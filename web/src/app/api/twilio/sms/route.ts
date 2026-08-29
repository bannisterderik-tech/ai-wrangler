import { NextResponse } from "next/server";
import { guardTenant } from "@/lib/api";
import { sendSms } from "@/lib/twilio";
import { customerInTenant } from "@/lib/tenant-scope";
import { meter, numberForCustomer, smsCost } from "@/lib/numbers";

/**
 * Text somebody on a customer's behalf, from their own number.
 *
 * Naming the customer is what decides which number it goes out from. Without
 * one it falls back to the shared caller id, and the reply says so — a shop's
 * customer texting back to a number that reaches five other shops is the exact
 * problem per-customer numbers exist to end.
 */
export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const { to, body, customerId } = await req.json().catch(() => ({}));
  if (!to || !body) return NextResponse.json({ error: "to and body required" }, { status: 400 });
  try {
    let from: string | null = null;
    if (customerId) {
      if (!(await customerInTenant(t.tenantId, String(customerId)))) {
        return NextResponse.json({ error: "no such customer" }, { status: 404 });
      }
      from = (await numberForCustomer(String(customerId)))?.number ?? null;
    }

    const sent = await sendSms(String(to), String(body), from);

    if (customerId && !sent.demo) {
      // Their number, their message, their meter line.
      await meter({
        customerId: String(customerId),
        tenantId: t.tenantId,
        kind: "sms",
        quantity: 1,
        unit: "segments",
        costMillicents: smsCost(1),
        ref: sent.sid,
        detail: `out to ${to}`,
      });
    }

    return NextResponse.json({
      ...sent,
      // Said out loud rather than hidden: this is the state we are migrating
      // away from, and a screen should be able to show it.
      warning: sent.shared ? "Sent from the shared number — this customer has none of their own." : undefined,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
