import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fail, guard, operator } from "@/lib/api";
import { audit, jobs, people, personScopes, personTools } from "@/lib/schema";
import { mintToken } from "@/lib/session-token";
import { TOOLS } from "@/lib/mcp-tools";
import { getCustomer } from "@/lib/customers";
import { attachAgent } from "@/lib/railway";
import { publicOrigin } from "@/lib/origin";

/**
 * One person's session. Everything here is an operator action:
 * mint or rotate their token, widen or narrow their scope, grant or take a tool,
 * or kill the session outright.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/people/[id]">) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const actor = (await operator())?.name || "you";

  try {
    const [who] = await db.select().from(people).where(eq(people.id, id)).limit(1);
    if (!who) return NextResponse.json({ error: "no such person" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    // A client signs in to their own CRM with a magic link; they have no MCP
    // session, so a token here would be a credential that can never do anything.
    if (who.kind === "client" && (action === "token" || action === "tool")) {
      return NextResponse.json(
        { error: `${who.name} is a client user, not an operator. They sign in at /client with a magic link.` },
        { status: 400 },
      );
    }

    if (action === "token") {
      // Shown once, here, and never again. We keep the hash and a prefix.
      const { raw, hash, prefix } = mintToken();
      await db
        .update(people)
        .set({ tokenHash: hash, tokenPrefix: prefix, status: "invited", clientVersion: null, connectedAt: null })
        .where(eq(people.id, id));
      await db.insert(audit).values({
        customerId: null,
        actor,
        action: who.tokenHash ? "rotated session token" : "minted session token",
        target: who.handle,
        at: new Date(),
      });
      // An agent's token is not for a person to copy — it is for the worker to
      // run as. Hand it straight to Railway so nobody opens that dashboard.
      let deploy: Record<string, unknown> = { deployed: false, why: "Not an agent." };
      if (who.kind === "agent") {
        try {
          deploy = await attachAgent(
            raw,
            process.env.WORKER_REPO || "bannisterderik-tech/ai-wrangler",
            publicOrigin(req),
          );
        } catch (e) {
          deploy = { deployed: false, why: (e as Error).message };
        }
        await db.insert(audit).values({
          customerId: who.customerId,
          actor,
          action: deploy.deployed ? "deployed agent to the worker" : "agent token minted, not deployed",
          target: who.handle,
          at: new Date(),
        });
      }
      return NextResponse.json({
        ok: true,
        token: raw,
        deploy,
        note:
          who.kind === "agent"
            ? "Handed to the worker. Copy it only if you want to run this agent somewhere else."
            : "Copy this now. It is stored as a hash and cannot be shown again.",
      });
    }

    // Scope is a list for a teammate and a column for an agent. Handing an agent
    // a second customer is the one thing this model exists to make impossible.
    if (action === "scope" && who.kind === "agent") {
      return NextResponse.json(
        { error: `${who.name} is an agent. It belongs to one project and its scope cannot be widened.` },
        { status: 400 },
      );
    }

    if (action === "scope") {
      const customerId = String(body.customerId || "");
      if (!(await getCustomer(customerId))) {
        return NextResponse.json({ error: "no such customer" }, { status: 404 });
      }
      const [has] = await db
        .select()
        .from(personScopes)
        .where(and(eq(personScopes.personId, id), eq(personScopes.customerId, customerId)))
        .limit(1);
      if (has) {
        await db
          .delete(personScopes)
          .where(and(eq(personScopes.personId, id), eq(personScopes.customerId, customerId)));
      } else {
        await db.insert(personScopes).values({ personId: id, customerId }).onConflictDoNothing();
      }
      await db.insert(audit).values({
        customerId,
        actor,
        action: has ? "removed from scope" : "granted scope",
        target: who.handle,
        at: new Date(),
      });
      return NextResponse.json({ ok: true, scoped: !has });
    }

    if (action === "tool") {
      const tool = String(body.tool || "");
      if (!TOOLS.some((t) => t.name === tool)) {
        return NextResponse.json({ error: "no such tool" }, { status: 400 });
      }
      const [has] = await db
        .select()
        .from(personTools)
        .where(and(eq(personTools.personId, id), eq(personTools.tool, tool)))
        .limit(1);
      if (has) {
        await db.delete(personTools).where(and(eq(personTools.personId, id), eq(personTools.tool, tool)));
      } else {
        await db.insert(personTools).values({ personId: id, tool }).onConflictDoNothing();
      }
      await db.insert(audit).values({
        customerId: null,
        actor,
        action: has ? `took ${tool}` : `granted ${tool}`,
        target: who.handle,
        at: new Date(),
      });
      return NextResponse.json({ ok: true, granted: !has });
    }

    if (action === "revoke") {
      // Nothing to unwind on Railway. We never keep the plaintext, so we could
      // not find it in the worker's list anyway — and we do not need to: the
      // token is dead the moment the hash is cleared, and the worker skips any
      // token the floor no longer recognises.
      // Kill the token, then put everything they were holding back on the board.
      await db
        .update(people)
        .set({ tokenHash: null, tokenPrefix: null, status: "revoked", clientVersion: null, connectedAt: null })
        .where(eq(people.id, id));
      const released = await db
        .update(jobs)
        .set({ ownerId: null, claimedAt: null })
        .where(eq(jobs.ownerId, id))
        .returning({ id: jobs.id });
      await db.insert(audit).values({
        customerId: null,
        actor,
        action: "revoked session",
        target: `${who.handle} · released ${released.length}`,
        at: new Date(),
      });
      return NextResponse.json({ ok: true, released: released.length });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}
