import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { agentEvents, people } from "./schema";
import { newId } from "./customers";

/**
 * Waking a copilot when something actually happens.
 *
 * The build worker polls for jobs; a copilot has none, so it had nothing to do
 * all day. And polling is exactly what cost $20 — a paid model session every
 * two minutes to be told there was nothing.
 *
 * Events invert that. Nothing runs until something happens, so idle is one
 * cheap HTTP call rather than a session. Raising one is deliberately cheap and
 * failure-tolerant: a missed event must never fail the thing that caused it.
 */
export type EventKind = "site_error" | "client_request" | "call" | "lead" | "message" | "external";

export const EVENT_KINDS: { id: EventKind; label: string; what: string }[] = [
  { id: "site_error", label: "Their site broke", what: "An error was reported by the site we run for them." },
  { id: "client_request", label: "They asked for something", what: "A request came in from their own site or desk." },
  { id: "call", label: "A call happened", what: "A call was placed or logged against one of their leads." },
  { id: "lead", label: "A lead moved", what: "Somebody enquired, or an existing enquiry was touched." },
  { id: "message", label: "They messaged the copilot", what: "The customer typed something into their own copilot." },
  { id: "external", label: "Something in their own systems", what: "Mail, calendar or the ERP, once those are connected." },
];

/** Which copilots this customer has, and what each of them wakes for. */
async function copilotsFor(customerId: string) {
  return db
    .select()
    .from(people)
    .where(and(eq(people.customerId, customerId), eq(people.kind, "agent"), eq(people.agentKind, "copilot")));
}

/**
 * Tell a customer's copilots that something happened.
 *
 * Never throws. A copilot that missed a wake-up is a copilot that reacts late;
 * an ingest route that 500s because of one is a site that looks broken.
 */
export async function raiseEvent(opts: {
  customerId: string;
  kind: EventKind;
  summary: string;
  source?: string;
  refId?: string | null;
  payload?: unknown;
}) {
  try {
    const copilots = await copilotsFor(opts.customerId);
    if (!copilots.length) return 0;
    let raised = 0;
    for (const c of copilots) {
      // An empty wakesOn means everything. A list means only those kinds, so a
      // copilot hired to watch the inbox is not woken by a lead moving.
      const wants = (c.wakesOn ?? "").trim();
      if (wants && !wants.split(",").map((w) => w.trim()).includes(opts.kind)) continue;
      await db
        .insert(agentEvents)
        .values({
          id: "E" + newId().slice(0, 8),
          personId: c.id,
          customerId: opts.customerId,
          kind: opts.kind,
          source: opts.source ?? null,
          refId: opts.refId ?? null,
          summary: opts.summary.slice(0, 300),
          payload: opts.payload ? JSON.stringify(opts.payload).slice(0, 4000) : null,
        })
        // The unique index on (person, kind, ref) does the deduping: one site
        // error seen five times is one thing to react to, not five model runs.
        .onConflictDoNothing();
      raised++;
    }
    return raised;
  } catch {
    return 0;
  }
}
