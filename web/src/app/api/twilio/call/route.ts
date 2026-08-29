import { NextResponse } from "next/server";
import { fail, guardTenant } from "@/lib/api";
import { placeCall, twilioStatus, voiceToken } from "@/lib/twilio";
import { getAgencyKey } from "@/lib/keys";

export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const status = twilioStatus();
  return NextResponse.json({
    ...status,
    // Whether a call can actually be placed, which is not the same as whether
    // Twilio is configured: bridging needs somewhere to ring you.
    canCall: status.browser || Boolean(await getAgencyKey("callback_number")),
    callbackNumber: (await getAgencyKey("callback_number")) ?? null,
    token: await voiceToken("operator"),
  });
}

export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  try {
    const { to } = await req.json();
    if (!to) return NextResponse.json({ error: "who are we calling?" }, { status: 400 });
    // The number Twilio rings first. The lead only hears a human.
    const bridge = (await getAgencyKey("callback_number")) ?? process.env.OPERATOR_CALLBACK_NUMBER ?? "";
    return NextResponse.json(await placeCall(String(to), bridge));
  } catch (e) {
    return fail(e);
  }
}
