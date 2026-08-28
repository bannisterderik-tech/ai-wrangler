import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { boundResources } from "@/lib/schema";
import { raiseEvent, type EventKind } from "@/lib/agent-events";
import { ZERNIO_EVENTS } from "@/lib/zernio-generated";

/**
 * What Zernio sends us.
 *
 * The other half of the integration. Everything else in here asks Zernio a
 * question; this is Zernio telling us something happened — a call came in, a
 * Local Services lead arrived, a review was left, an ad changed status. Fifty-one
 * event types, and they are the reason a copilot can be event-driven instead of
 * polling, which is the thing that cost $20 in a weekend.
 *
 * This route is public, because Zernio has no session with us. The signature is
 * therefore the only wall, so it is checked before anything else is read, and a
 * request without one is refused rather than trusted.
 *
 * Verification is HMAC-SHA256 of the raw body, lowercase hex, no prefix —
 * confirmed against Zernio's own documentation, not guessed from the header
 * name.
 */

const SECRET = process.env.ZERNIO_WEBHOOK_SECRET;

/** Which of our copilot wake-up kinds an incoming event maps to. */
const KIND: Record<string, EventKind> = {
  "lead.received": "lead",
  "call.received": "call",
  "call.ended": "call",
  "call.failed": "call",
  "message.received": "message",
  "conversation.started": "message",
  "comment.received": "message",
  "reaction.received": "message",
  "referral.received": "lead",
  "review.new": "external",
  "review.updated": "external",
  "post.failed": "external",
  "post.platform.failed": "external",
  "account.disconnected": "external",
  "ad.status_changed": "external",
};

function verified(raw: string, header: string | null): boolean {
  if (!SECRET || !header) return false;
  const mine = createHmac("sha256", SECRET).update(raw).digest("hex");
  const a = Buffer.from(mine, "utf8");
  const b = Buffer.from(header.trim().toLowerCase(), "utf8");
  // Length must match before timingSafeEqual, which throws on a mismatch.
  return a.length === b.length && timingSafeEqual(a, b);
}

const NAMES = new Set<string>(ZERNIO_EVENTS.map((e) => e.name));

/** Pull the account id out of whatever shape the event uses. */
function accountIdOf(body: Record<string, unknown>): string {
  const data = (body.data ?? body) as Record<string, unknown>;
  for (const k of ["accountId", "socialAccountId", "adAccountId", "customerId"]) {
    const v = data[k] ?? body[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

export async function POST(req: Request) {
  // Read the body as text exactly once: the signature is over these bytes, and
  // re-serialising parsed JSON would sign a different string.
  const raw = await req.text();

  if (!SECRET) {
    // Refusing is right. Accepting unsigned events would mean anyone who learns
    // the URL can raise events against a customer's copilot.
    return NextResponse.json({ error: "webhooks are not configured" }, { status: 503 });
  }
  if (!verified(raw, req.headers.get("x-zernio-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "not json" }, { status: 400 });
  }

  const event = String(body.event ?? body.type ?? "");
  if (!NAMES.has(event)) {
    // Answer 200 so Zernio does not retry forever over an event we simply do
    // not handle yet, but say plainly that nothing was done with it.
    return NextResponse.json({ ok: true, ignored: `unknown event "${event}"` });
  }
  if (event === "webhook.test") return NextResponse.json({ ok: true, test: true });

  // Which customer this belongs to, decided by the binding rather than by
  // anything in the payload — the payload is the untrusted part.
  const accountId = accountIdOf(body);
  let customerId = "";
  if (accountId) {
    const rows = await db
      .select({
        customerId: boundResources.customerId,
        resourceId: boundResources.resourceId,
        metaJson: boundResources.metaJson,
      })
      .from(boundResources)
      .where(eq(boundResources.provider, "google_ads"));
    // The event may name either id, so both are matched: `resourceId` is the
    // Google Ads customer id, `metaJson.accountId` the Zernio account behind it.
    const zernioAccount = (meta: string | null) => {
      try {
        return (JSON.parse(meta ?? "{}") as { accountId?: string }).accountId ?? "";
      } catch {
        return "";
      }
    };
    customerId =
      rows.find((r) => r.resourceId === accountId || zernioAccount(r.metaJson) === accountId)?.customerId ?? "";
  }
  if (!customerId) {
    return NextResponse.json({ ok: true, ignored: "no customer is bound to that account" });
  }

  const kind = KIND[event] ?? "external";
  await raiseEvent({
    customerId,
    kind,
    summary: summarise(event, body),
    source: "zernio",
    refId: String((body.id as string) ?? ""),
    payload: body,
  });
  return NextResponse.json({ ok: true });
}

function summarise(event: string, body: Record<string, unknown>): string {
  const d = (body.data ?? {}) as Record<string, unknown>;
  const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  switch (event) {
    case "lead.received":
      return `A Google lead came in${s("leadType") ? ` (${s("leadType").toLowerCase().replace("_", " ")})` : ""}.`;
    case "call.received":
      return `A call came in${s("from") ? ` from ${s("from")}` : ""}.`;
    case "call.ended":
      return "A call ended.";
    case "message.received":
      return `A message came in${s("text") ? `: ${s("text").slice(0, 140)}` : ""}.`;
    case "review.new":
      return `A new review was left${s("rating") ? ` (${s("rating")} stars)` : ""}.`;
    case "ad.status_changed":
      return `An ad changed status${s("status") ? ` to ${s("status")}` : ""}.`;
    case "account.disconnected":
      return "An ad or social account disconnected — it needs reconnecting.";
    case "post.failed":
    case "post.platform.failed":
      return "A scheduled post failed to publish.";
    default:
      return `Zernio: ${event}.`;
  }
}
