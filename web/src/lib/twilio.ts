import { createHmac } from "node:crypto";

/**
 * Twilio voice + SMS.
 *
 * The call path used to send this TwiML:
 *
 *   <Response><Say>Connecting you through AI Wrangler.</Say></Response>
 *
 * There is no <Dial> in it. With live credentials that rings a customer's lead,
 * says one sentence at them, and hangs up — a robocaller, shipped behind a
 * button labelled "Call". Nobody was ever connected to anybody.
 *
 * Two ways to actually place a call, and the OS picks whichever the credentials
 * support:
 *
 *   Bridge  — Twilio rings YOUR phone first; when you pick up it dials the lead
 *             and joins you. Needs only the account SID, auth token and caller
 *             id, so it works the moment Twilio is configured at all.
 *   Browser — a Voice SDK access token, so the call happens in the tab. Needs an
 *             API key pair and a TwiML app. voiceToken() returned `token: null`
 *             in its *configured* branch, so this could never initialise either.
 */
const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_CALLER_ID;
const APP = process.env.TWILIO_TWIML_APP_SID;
const KEY_SID = process.env.TWILIO_API_KEY_SID;
const KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;

export function twilioConfigured() {
  return Boolean(SID && TOKEN && FROM);
}

/** Browser calling needs more than the basics; say so rather than half-working. */
export function browserCallingConfigured() {
  return Boolean(twilioConfigured() && APP && KEY_SID && KEY_SECRET);
}

export function twilioStatus() {
  return {
    configured: twilioConfigured(),
    browser: browserCallingConfigured(),
    from: FROM ?? null,
    missing: [
      !SID && "TWILIO_ACCOUNT_SID",
      !TOKEN && "TWILIO_AUTH_TOKEN",
      !FROM && "TWILIO_CALLER_ID",
      !APP && "TWILIO_TWIML_APP_SID (browser calling)",
      !KEY_SID && "TWILIO_API_KEY_SID (browser calling)",
      !KEY_SECRET && "TWILIO_API_KEY_SECRET (browser calling)",
    ].filter(Boolean) as string[],
  };
}

function basic() {
  return Buffer.from(`${SID}:${TOKEN}`).toString("base64");
}

async function twilio(path: string, form: Record<string, string>) {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}${path}`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic()}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Twilio refused the request (${res.status})`);
  return data;
}

export async function sendSms(to: string, body: string) {
  if (!twilioConfigured()) {
    return { ok: true, demo: true, sid: `SM_demo_${Date.now()}`, to, body };
  }
  const data = await twilio("/Messages.json", { To: to, From: FROM!, Body: body });
  return { ok: true, demo: false, sid: data.sid, to };
}

const b64url = (b: Buffer | string) =>
  Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/**
 * A Twilio Access Token, which is a JWT signed with the API key secret.
 *
 * Hand-rolled rather than pulling in the Twilio SDK for one signature: it is
 * thirty lines of HMAC and the shape is fixed by Twilio's docs. `cty` is the
 * part people miss — without `twilio-fpa;v=1` the SDK rejects the token.
 */
export async function voiceToken(identity: string, ttlSeconds = 3600) {
  if (!browserCallingConfigured()) {
    return {
      ok: true,
      demo: !twilioConfigured(),
      token: null,
      identity,
      why: twilioConfigured()
        ? "Browser calling needs TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET and TWILIO_TWIML_APP_SID. Calls will ring your phone instead."
        : "Twilio is not configured.",
    };
  }
  const now = Math.floor(Date.now() / 1000);
  const header = { typ: "JWT", alg: "HS256", cty: "twilio-fpa;v=1" };
  const payload = {
    jti: `${KEY_SID}-${now}`,
    iss: KEY_SID,
    sub: SID,
    iat: now,
    exp: now + ttlSeconds,
    grants: {
      identity,
      voice: {
        incoming: { allow: true },
        outgoing: { application_sid: APP },
      },
    },
  };
  const signing = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = b64url(createHmac("sha256", KEY_SECRET!).update(signing).digest());
  return { ok: true, demo: false, token: `${signing}.${sig}`, identity, app: APP, expires: payload.exp };
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

/**
 * Ring `bridgeTo` (you), then dial `to` (the lead) and put you together.
 *
 * The lead sees the caller id, not your mobile. The <Say> is deliberately short
 * and only YOU hear it — it plays on the leg Twilio answers first, before the
 * <Dial> connects the other end.
 */
export async function placeCall(to: string, bridgeTo?: string) {
  if (!twilioConfigured()) {
    return { ok: true, demo: true, sid: `CA_demo_${Date.now()}`, to };
  }
  const target = (bridgeTo || "").trim();
  if (!target) {
    throw new Error(
      "No number to ring you on. Set your own phone in Settings, or turn on browser calling — " +
        "a call with nobody on our end is just a robocall.",
    );
  }
  const twiml =
    `<Response><Say>Connecting your call.</Say>` +
    `<Dial callerId="${escapeXml(FROM!)}" answerOnBridge="true">` +
    `<Number>${escapeXml(to)}</Number></Dial></Response>`;
  const data = await twilio("/Calls.json", { To: target, From: FROM!, Twiml: twiml });
  return { ok: true, demo: false, sid: data.sid, to, bridgedVia: target };
}
