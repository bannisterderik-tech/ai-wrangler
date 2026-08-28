import { NextResponse } from "next/server";
import { fail, operator, guardBuild } from "@/lib/api";
import { db } from "@/lib/db";
import { audit } from "@/lib/schema";
import { anthropicKey, connectRailway, railwayState, redeployWorker, saveAnthropicKey } from "@/lib/railway";

/** Whether the OS can deploy agents by itself, and the one credential that lets it. */
export async function GET() {
  // The build half. A CRM-only account is refused it outright rather than
  // shown an empty floor and left to wonder.
  const b = await guardBuild();
  if ("error" in b) return b.error;
  const state = await railwayState();
  return NextResponse.json({
    ...state,
    anthropic: Boolean(await anthropicKey()),
    repo: process.env.WORKER_REPO || "bannisterderik-tech/ai-wrangler",
  });
}

/** Save the Railway API token. The one thing that has to be done by hand, once. */
export async function POST(req: Request) {
  // The build half. A CRM-only account is refused it outright rather than
  // shown an empty floor and left to wonder.
  const b = await guardBuild();
  if ("error" in b) return b.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === "redeploy") {
      const out = await redeployWorker();
      if (!out.deployed) return NextResponse.json({ error: out.why }, { status: 409 });
      await db.insert(audit).values({
        customerId: null, actor, action: "redeployed the worker", target: out.service, at: new Date(),
      });
      return NextResponse.json({ ok: true, redeployed: true });
    }

    const token = String(body.token || "").trim();
    const key = String(body.anthropicKey || "").trim();
    if (!token && !key) return NextResponse.json({ error: "nothing to save" }, { status: 400 });

    if (key) {
      await saveAnthropicKey(key);
      await db.insert(audit).values({
        customerId: null, actor, action: "saved the Anthropic key", target: null, at: new Date(),
      });
    }
    if (token) {
      await connectRailway(token);
      await db.insert(audit).values({
        customerId: null, actor, action: "connected Railway", target: null, at: new Date(),
      });
    }
    return NextResponse.json({ ok: true, ...(await railwayState()), anthropic: Boolean(await anthropicKey()) });
  } catch (e) {
    return fail(e);
  }
}
