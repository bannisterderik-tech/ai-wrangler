import { NextResponse } from "next/server";
import { fail, guard, operator } from "@/lib/api";
import { db } from "@/lib/db";
import { audit } from "@/lib/schema";
import { connectRailway, railwayState } from "@/lib/railway";

/** Whether the OS can deploy agents by itself, and the one credential that lets it. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const state = await railwayState();
  return NextResponse.json({
    ...state,
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    repo: process.env.WORKER_REPO || "bannisterderik-tech/ai-wrangler",
  });
}

/** Save the Railway API token. The one thing that has to be done by hand, once. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
    await connectRailway(token);
    await db.insert(audit).values({
      customerId: null,
      actor,
      action: "connected Railway",
      target: null,
      at: new Date(),
    });
    return NextResponse.json({ ok: true, ...(await railwayState()) });
  } catch (e) {
    return fail(e);
  }
}
