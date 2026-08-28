import { NextResponse } from "next/server";
import { fail, guard, operator } from "@/lib/api";
import { db } from "@/lib/db";
import { audit } from "@/lib/schema";
import { agencyKeyStatus, keyLabels, saveAgencyKey, type AgencyKey } from "@/lib/keys";

/** Which agency keys are set. Never the values. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json({ keys: await agencyKeyStatus(), fields: keyLabels() });
}

/** Save one. Shape-checked before it is stored, so a typo fails here. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const actor = (await operator())?.name || "you";
  try {
    const body = await req.json().catch(() => ({}));
    const which = String(body.key || "") as AgencyKey;
    const value = String(body.value || "");
    if (!keyLabels().some((f) => f.id === which)) {
      return NextResponse.json({ error: "unknown key" }, { status: 400 });
    }
    if (!value.trim()) return NextResponse.json({ error: "value required" }, { status: 400 });
    await saveAgencyKey(which, value);
    await db.insert(audit).values({
      customerId: null, actor, action: `saved the ${which} key`, target: null, at: new Date(),
    });
    return NextResponse.json({ ok: true, keys: await agencyKeyStatus() });
  } catch (e) {
    return fail(e);
  }
}
