import { NextResponse } from "next/server";
import { fail, guardTenant } from "@/lib/api";
import { placeCall, twilioStatus, voiceToken } from "@/lib/twilio";
import { getAgencyKey } from "@/lib/keys";
import { customerInTenant } from "@/lib/tenant-scope";
import { numberForCustomer } from "@/lib/numbers";

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
    const { to, customerId } = await req.json().catch(() => ({}));
    if (!to) return NextResponse.json({ error: "who are we calling?" }, { status: 400 });

    // Whose number the person on the other end sees, and calls back on.
    let from: string | null = null;
    if (customerId) {
      if (!(await customerInTenant(t.tenantId, String(customerId)))) {
        return NextResponse.json({ error: "no such customer" }, { status: 404 });
      }
      from = (await numberForCustomer(String(customerId)))?.number ?? null;
    }

    // The number Twilio rings first. The lead only hears a human.
    const bridge = (await getAgencyKey("callback_number")) ?? process.env.OPERATOR_CALLBACK_NUMBER ?? "";
    const placed = await placeCall(String(to), bridge, from);
    return NextResponse.json({
      ...placed,
      warning: placed.shared ? "Calling from the shared number — this customer has none of their own." : undefined,
    });
  } catch (e) {
    return fail(e);
  }
}
