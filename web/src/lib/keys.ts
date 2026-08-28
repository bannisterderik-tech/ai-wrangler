import { eq } from "drizzle-orm";
import { db } from "./db";
import { decrypt, encrypt } from "./crypto";
import { agencyConnections } from "./schema";

/**
 * Agency-level credentials.
 *
 * These are the keys the agency itself holds — not a customer's. They live in
 * the same encrypted vault as every customer token, so there is one place to
 * put a key and one place it can leak from, and setting one never means opening
 * a hosting dashboard.
 *
 * Reads are vault first, environment second: an existing env var keeps working,
 * and nothing has to be migrated to adopt this.
 */

export type AgencyKey = "anthropic" | "resend" | "openrouter";

const KEYS: Record<AgencyKey, { env: string; label: string; looksRight: (v: string) => boolean; hint: string }> = {
  anthropic: {
    env: "ANTHROPIC_API_KEY",
    label: "Anthropic",
    looksRight: (v) => /^sk-ant-/.test(v),
    hint: "Anthropic keys start with sk-ant-.",
  },
  resend: {
    env: "RESEND_API_KEY",
    label: "Resend",
    looksRight: (v) => /^re_/.test(v),
    hint: "Resend keys start with re_.",
  },
  openrouter: {
    env: "OPENROUTER_API_KEY",
    label: "OpenRouter",
    looksRight: (v) => /^sk-or-/.test(v),
    hint: "OpenRouter keys start with sk-or-.",
  },
};

export function keyLabels() {
  return (Object.keys(KEYS) as AgencyKey[]).map((k) => ({ id: k, label: KEYS[k].label, hint: KEYS[k].hint }));
}

export async function getAgencyKey(which: AgencyKey): Promise<string | null> {
  try {
    const [row] = await db
      .select()
      .from(agencyConnections)
      .where(eq(agencyConnections.provider, which))
      .limit(1);
    if (row?.encryptedAccess) return decrypt(row.encryptedAccess);
  } catch {
    /* fall through to the environment */
  }
  return process.env[KEYS[which].env] || null;
}

export async function saveAgencyKey(which: AgencyKey, value: string) {
  const v = value.trim();
  const spec = KEYS[which];
  if (!spec) throw new Error("unknown key");
  // A wrong-looking key stored is a failure that surfaces hours later, in a send
  // or a model call, far from the person who pasted it.
  if (!spec.looksRight(v)) throw new Error(spec.hint);
  await db
    .insert(agencyConnections)
    .values({ provider: which, mode: "api-key", encryptedAccess: encrypt(v), connectedAt: new Date() })
    .onConflictDoUpdate({
      target: agencyConnections.provider,
      set: { encryptedAccess: encrypt(v), mode: "api-key", connectedAt: new Date() },
    });
  return { ok: true };
}

/** Which keys exist. Never the values — this shape is safe to render. */
export async function agencyKeyStatus() {
  const out: Record<string, boolean> = {};
  for (const k of Object.keys(KEYS) as AgencyKey[]) out[k] = Boolean(await getAgencyKey(k));
  return out;
}
