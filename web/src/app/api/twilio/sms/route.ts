import { NextResponse } from "next/server";
import { sendSms } from "@/lib/twilio";

export async function POST(req: Request) {
  const { to, body } = await req.json();
  if (!to || !body) return NextResponse.json({ error: "to and body required" }, { status: 400 });
  try {
    return NextResponse.json(await sendSms(String(to), String(body)));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
