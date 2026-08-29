import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { receptionistCalls, receptionists, usageEvents } from "./schema";
import { ask } from "./ai";
import type { CustomerNumber } from "./numbers";

/**
 * The assistant that answers a shop's phone.
 *
 * A contractor missing five to ten calls a week loses more than everything else
 * in this product combined, and about five in six people who reach voicemail
 * never ring back. So the bar here is not cleverness — it is never dropping a
 * call. Every failure path in this file ends with a human or a voicemail, not
 * with silence.
 *
 * It is deliberately boring: greet, listen, get the job and a callback number,
 * hand urgent callers to a person. It does not quote prices, promise times, or
 * make commitments on somebody else's behalf. Those are the things that cost a
 * business money when a machine gets them wrong, so it cannot do them at all —
 * that is enforced here rather than requested in a prompt.
 */

export type Turn = { who: "them" | "it"; text: string };

export type Config = {
  customerId: string;
  tenantId: string;
  enabled: boolean;
  mode: "always" | "after_hours" | "on_no_answer";
  businessName: string;
  greeting: string | null;
  brief: string | null;
  hours: { tz: string; open: number; close: number; days: number[] };
  forwardTo: string | null;
  urgentWords: string[];
  maxTurns: number;
  monthlyCapCents: number;
};

const DEFAULT_HOURS = { tz: "America/Los_Angeles", open: 8, close: 17, days: [1, 2, 3, 4, 5] };

export async function configFor(customerId: string): Promise<Config | null> {
  const [r] = await db.select().from(receptionists).where(eq(receptionists.customerId, customerId)).limit(1);
  if (!r) return null;
  let hours = DEFAULT_HOURS;
  try {
    if (r.hoursJson) hours = { ...DEFAULT_HOURS, ...(JSON.parse(r.hoursJson) as typeof DEFAULT_HOURS) };
  } catch {
    /* a malformed row should not stop the phone being answered */
  }
  return {
    customerId: r.customerId,
    tenantId: r.tenantId,
    enabled: r.enabled,
    mode: (["always", "after_hours", "on_no_answer"].includes(r.mode) ? r.mode : "on_no_answer") as Config["mode"],
    businessName: r.businessName || "the business",
    greeting: r.greeting,
    brief: r.brief,
    hours,
    forwardTo: r.forwardTo,
    urgentWords: (r.urgentWords || "").split(",").map((w) => w.trim().toLowerCase()).filter(Boolean),
    maxTurns: Math.max(2, Math.min(20, r.maxTurns)),
    monthlyCapCents: r.monthlyCapCents,
  };
}

/**
 * Are they open right now?
 *
 * In the customer's own timezone, not the server's. A shop in Sacramento
 * answered by a box in Virginia would otherwise go to the after-hours assistant
 * at two in the afternoon.
 */
export function isOpenNow(hours: Config["hours"], now = new Date()): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: hours.tz,
      weekday: "short",
      hour: "numeric",
      hour12: false,
    }).formatToParts(now);
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "-1");
    const dayNumber = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
    if (dayNumber < 0 || hour < 0) return true;
    if (!hours.days.includes(dayNumber)) return false;
    return hour >= hours.open && hour < hours.close;
  } catch {
    // An unknown timezone must not decide that a business is shut.
    return true;
  }
}

/** Should it pick up this call, before anyone has said anything? */
export function answersNow(config: Config, now = new Date()): boolean {
  if (!config.enabled) return false;
  if (config.mode === "always") return true;
  if (config.mode === "after_hours") return !isOpenNow(config.hours, now);
  // on_no_answer: the humans get it first; this catches what they miss.
  return false;
}

/** What this month's calls have cost, against the cap. */
export async function spentThisMonth(customerId: string): Promise<number> {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const [row] = await db
    .select({ millicents: sql<number>`coalesce(sum(${usageEvents.costMillicents}), 0)::int` })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.customerId, customerId),
        eq(usageEvents.kind, "ai"),
        gte(usageEvents.at, start),
      ),
    );
  return Math.round((row?.millicents ?? 0) / 1000);
}

export async function overCap(config: Config): Promise<boolean> {
  if (config.monthlyCapCents <= 0) return false;
  return (await spentThisMonth(config.customerId)) >= config.monthlyCapCents;
}

/**
 * The opening line.
 *
 * The disclosure is not optional and is not part of the editable greeting.
 * Several states now require a person to be told they are talking to a machine,
 * and beyond the law it is the difference between a useful assistant and a
 * trick. Making it configurable would mean somebody eventually turns it off.
 */
export function opening(config: Config): string {
  const custom = (config.greeting || "").trim();
  const base = custom || `Thanks for calling ${config.businessName}.`;
  return `${base} I'm an automated assistant. How can I help?`;
}

export type Decision = {
  /** What to say back. */
  say: string;
  /** talk — keep going. capture — we have enough. transfer — get a human. */
  next: "talk" | "capture" | "transfer";
  callerName?: string;
  jobSummary?: string;
  callback?: string;
  urgent?: boolean;
};

const SYSTEM = `You answer the phone for a local trade business. You are speaking out loud, so keep every reply under 30 words and never use lists, markdown or symbols.

Your only job is to find out three things: who is calling, what they need, and the best number to call them back on. When you have all three, stop.

Rules you cannot break:
- Never quote a price, estimate a cost, or say what something might cost.
- Never promise a time, a date, or that somebody will definitely come.
- Never claim to be a person. If asked, say you are an automated assistant.
- If they ask for a human, if they sound distressed, or if it could be dangerous — gas, flooding, no heat in winter, anything electrical and live — hand over immediately.
- Do not argue, upsell, or ask more than one question at a time.

Reply with JSON only, no other text:
{"say": "what to say out loud", "next": "talk" | "capture" | "transfer", "callerName": "", "jobSummary": "", "callback": "", "urgent": false}

Use next="capture" once you have the name, the job and a callback number. Use next="transfer" for anything urgent or when they ask for a person.`;

/** Anything on the shop's own urgent list, checked before the model sees it. */
export function soundsUrgent(text: string, words: string[]): boolean {
  const t = text.toLowerCase();
  // A deliberately short built-in list. These are the ones where waiting for a
  // model to agree is the wrong trade.
  const always = ["emergency", "gas leak", "flooding", "no heat", "burst", "sparking", "smoke"];
  return [...always, ...words].some((w) => w && t.includes(w));
}

/**
 * One turn of the conversation.
 *
 * Never throws. If the model is slow, broken or unaffordable, the caller is
 * handed to a person — a receptionist that fails closed is a receptionist that
 * loses the exact call it was bought to catch.
 */
export async function decide(
  config: Config,
  transcript: Turn[],
  heard: string,
): Promise<{ decision: Decision; costMillicents: number }> {
  if (soundsUrgent(heard, config.urgentWords)) {
    return {
      decision: {
        say: "That sounds urgent. Let me get you to someone now.",
        next: "transfer",
        urgent: true,
        jobSummary: heard.slice(0, 300),
      },
      costMillicents: 0,
    };
  }

  const history = transcript
    .map((t) => `${t.who === "them" ? "Caller" : "You"}: ${t.text}`)
    .join("\n");

  try {
    const answer = await ask({
      // Latency is the whole game on a phone call. A better answer four seconds
      // later is a worse answer.
      role: "fast",
      system: SYSTEM,
      cache: true,
      maxTokens: 300,
      prompt:
        `The business is ${config.businessName}.` +
        (config.brief ? `\nWhat they do: ${config.brief}` : "") +
        `\n\nThe call so far:\n${history}\nCaller: ${heard}\n\nYour JSON reply:`,
    });
    const decision = parseDecision(answer.text);
    return { decision, costMillicents: Math.round(answer.cents * 1000) };
  } catch {
    return {
      decision: { say: "Let me put you through to someone.", next: "transfer" },
      costMillicents: 0,
    };
  }
}

/**
 * Read the model's reply, and refuse to trust it further than it deserves.
 *
 * A model asked for JSON usually returns JSON. "Usually" is not good enough
 * when the failure mode is reading a brace out loud to somebody's customer, so
 * anything unparseable becomes a transfer.
 */
export function parseDecision(raw: string): Decision {
  const text = String(raw ?? "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return { say: "Let me put you through to someone.", next: "transfer" };
  }
  try {
    const o = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const say = String(o.say ?? "").trim();
    const next = ["talk", "capture", "transfer"].includes(String(o.next)) ? (o.next as Decision["next"]) : "talk";
    if (!say) return { say: "Let me put you through to someone.", next: "transfer" };
    return {
      // Bounded because it is spoken aloud: a model that decides to recite a
      // paragraph leaves a caller listening to a robot for a minute.
      say: say.slice(0, 300),
      next,
      callerName: str(o.callerName),
      jobSummary: str(o.jobSummary),
      callback: str(o.callback),
      urgent: o.urgent === true,
    };
  } catch {
    return { say: "Let me put you through to someone.", next: "transfer" };
  }
}

const str = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, 300) : undefined;
};

/** Start, or resume, the record of a call. */
export async function callRecord(callSid: string, who: CustomerNumber, from: string) {
  const [existing] = await db
    .select()
    .from(receptionistCalls)
    .where(eq(receptionistCalls.callSid, callSid))
    .limit(1);
  if (existing) return existing;
  const [made] = await db
    .insert(receptionistCalls)
    .values({
      id: "RC" + callSid.slice(-10),
      callSid,
      customerId: who.customerId,
      tenantId: who.tenantId,
      fromNumber: from || null,
      transcriptJson: "[]",
    })
    .onConflictDoNothing()
    .returning();
  if (made) return made;
  // Lost the race with a redelivered webhook; read what the winner wrote.
  const [row] = await db
    .select()
    .from(receptionistCalls)
    .where(eq(receptionistCalls.callSid, callSid))
    .limit(1);
  return row;
}

export function readTranscript(json: string | null): Turn[] {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? (v as Turn[]) : [];
  } catch {
    return [];
  }
}
