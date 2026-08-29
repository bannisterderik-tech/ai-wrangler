import { NextResponse } from "next/server";
import { verifyTwilioSignature } from "./twilio";
import { customerForNumber, type CustomerNumber } from "./numbers";
import { publicOrigin } from "./origin";

/**
 * The shared front door for everything Twilio sends us.
 *
 * These routes are public, because Twilio has no session with us. The signature
 * is therefore the only wall, and it is checked before a single field of the
 * body is read or used. Three routes needed the same six steps, and three
 * copies of a security check is two copies too many.
 */

export type Inbound = {
  params: Record<string, string>;
  /** Whose number it arrived on. Null when nobody has that number bound. */
  who: CustomerNumber | null;
};

/**
 * Read, verify, and work out who it is for.
 *
 * Returns a Response to send back on refusal, or the parsed request. Twilio
 * signs the exact URL it was configured with, so the origin has to be the
 * public one rather than whatever `Host` the request happens to carry — that
 * header is caller-controlled, and trusting it would let anyone choose a URL
 * that makes their own signature verify.
 */
export async function readInbound(req: Request, path: string): Promise<Inbound | { refusal: Response }> {
  const raw = await req.text();
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(raw)) params[k] = v;

  const url = `${publicOrigin(req)}${path}`;
  if (!verifyTwilioSignature(url, params, req.headers.get("x-twilio-signature"))) {
    return {
      refusal: NextResponse.json({ error: "bad signature" }, { status: 401 }),
    };
  }

  // Which customer, decided by the number it came in ON — never by `From`,
  // which is whoever is calling and is trivially spoofed by the payload.
  const who = await customerForNumber(params.To ?? "");
  return { params, who };
}

/** TwiML, with the header Twilio expects. */
export function twiml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}
