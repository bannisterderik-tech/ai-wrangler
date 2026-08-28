/**
 * Outbound email. One message type so far: the sign-in link.
 *
 * Resend if RESEND_API_KEY is set, otherwise the link goes to the server log so
 * a fresh install can be signed into before anyone wires up a mail provider.
 * The fallback says loudly what it is doing — a link printed to a log is fine on
 * a laptop and is not fine in production.
 */

import { getAgencyKey } from "./keys";

const FROM = process.env.MAIL_FROM || "AI Wrangler <login@aiwrangler.co>";

/** Vault first, environment second — the key is pasted in the OS, not set here. */
export async function mailConfigured() {
  return Boolean(await getAgencyKey("resend"));
}

export async function sendMagicLink(to: string, url: string, minutes: number) {
  const subject = "Your AI Wrangler sign-in link";
  const text = [
    "Someone asked to sign in to AI Wrangler as you.",
    "",
    url,
    "",
    `This link works once and expires in ${minutes} minutes.`,
    "If it wasn't you, ignore this — the link does nothing until it is opened, and nobody else was told it exists.",
  ].join("\n");

  const key = await getAgencyKey("resend");
  if (!key) {
    console.warn(
      `[wrangler] No Resend key saved, so this sign-in link was NOT emailed.\n` +
        `           to: ${to}\n           ${url}\n` +
        `           Paste one on Settings before this deploy is used by anyone but you.`,
    );
    return { ok: true, delivered: false as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`mail provider refused the send (${res.status}): ${detail.slice(0, 200)}`);
  }
  return { ok: true, delivered: true as const };
}
