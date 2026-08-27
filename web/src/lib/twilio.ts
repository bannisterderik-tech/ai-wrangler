/**
 * Twilio voice + SMS. Real credentials go live; without them the OS stays
 * in demo mode so the frontend can be clicked on GitHub Pages / local.
 */
const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_CALLER_ID;
const APP = process.env.TWILIO_TWIML_APP_SID;

export function twilioConfigured() {
  return Boolean(SID && TOKEN && FROM);
}

export async function sendSms(to: string, body: string) {
  if (!twilioConfigured()) {
    return { ok: true, demo: true, sid: `SM_demo_${Date.now()}`, to, body };
  }
  const auth = Buffer.from(`${SID}:${TOKEN}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: FROM!, Body: body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Twilio SMS failed");
  return { ok: true, demo: false, sid: data.sid, to };
}

export async function voiceToken(identity: string) {
  if (!twilioConfigured() || !APP) {
    return { ok: true, demo: true, token: null, identity };
  }
  return { ok: true, demo: false, token: null, identity, app: APP };
}

export async function placeCall(to: string) {
  if (!twilioConfigured()) {
    return { ok: true, demo: true, sid: `CA_demo_${Date.now()}`, to };
  }
  const auth = Buffer.from(`${SID}:${TOKEN}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      From: FROM!,
      Twiml: `<Response><Say>Connecting you through AI Wrangler.</Say></Response>`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Twilio call failed");
  return { ok: true, demo: false, sid: data.sid, to };
}
