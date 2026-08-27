import { NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { placeCall, voiceToken, twilioConfigured } from "@/lib/twilio";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json({
    configured: twilioConfigured(),
    token: await voiceToken("operator"),
  });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { to } = await req.json();
  if (!to) return NextResponse.json({ error: "to required" }, { status: 400 });
  try {
    return NextResponse.json(await placeCall(String(to)));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
