import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail } from "@/lib/api";
import { agentConnections, audit } from "@/lib/schema";
import { decrypt } from "@/lib/crypto";
import { sessionFromHeader } from "@/lib/session-token";
import { connector } from "@/lib/connectors";

/**
 * A copilot collecting the credentials for the systems it was given.
 *
 * This is the only place a customer's connector secret is ever decrypted, and
 * it goes to exactly one machine: the one holding that copilot's session token.
 * A token identifies one agent, an agent belongs to one customer, and the query
 * is keyed on the session — so there is no argument that widens it.
 *
 * That is the whole reason a copilot earns its own box. It holds a business's
 * mail, calendar and books; on a shared server one bug exposes every customer's,
 * and on its own machine a compromise stops at the one it belongs to.
 */
export async function GET(req: Request) {
  const session = await sessionFromHeader(req.headers.get("authorization"));
  if (!session) return NextResponse.json({ error: "unknown session" }, { status: 401 });
  if (session.kind !== "agent") {
    return NextResponse.json({ error: "only an agent collects its own credentials" }, { status: 403 });
  }
  try {
    const rows = await db
      .select()
      .from(agentConnections)
      // Keyed on the session's own id. Not on anything the caller can say.
      .where(and(eq(agentConnections.personId, session.id), eq(agentConnections.status, "connected")));

    const out = [];
    for (const r of rows) {
      if (!r.encryptedSecret) continue;
      let secret: string;
      try {
        secret = decrypt(r.encryptedSecret);
      } catch {
        // A secret we cannot decrypt is a vault key that changed. Say nothing
        // and let the health report carry it, rather than handing over rubbish.
        continue;
      }
      out.push({
        provider: r.provider,
        label: r.label,
        kind: r.secretKind ?? "token",
        secret,
        gives: connector(r.provider)?.gives ?? null,
      });
    }

    if (out.length) {
      await db
        .update(agentConnections)
        .set({ deliveredAt: new Date() })
        .where(and(eq(agentConnections.personId, session.id), eq(agentConnections.status, "connected")));
      await db.insert(audit).values({
        customerId: null,
        actor: session.handle,
        action: "collected its credentials",
        // How many, never which values.
        target: `${out.length} connection(s)`,
        at: new Date(),
      });
    }

    return NextResponse.json({ connections: out });
  } catch (e) {
    return fail(e);
  }
}
