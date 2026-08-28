import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { connections } from "./schema";
import { decrypt, encrypt } from "./crypto";
import { newId } from "./customers";

/**
 * A customer's own Anthropic key.
 *
 * Why this rather than their Claude subscription: Claude Code can sign in with
 * a Pro or Max login, but two things rule it out here. `--bare` — the flag that
 * stops a customer's own repository injecting hooks and CLAUDE.md into the
 * agent — never reads OAuth credentials or the keychain, so using a
 * subscription means giving up that wall. And a consumer subscription is
 * priced for a person using it, not for unattended automation in a datacenter
 * resold as part of somebody's service; the account that gets suspended for
 * that is the customer's, mid-engagement.
 *
 * A key from their own Console account has neither problem. It puts the cost
 * where they want it, they can see their own usage, and nobody is holding
 * anybody's personal login.
 *
 * It also shrinks the blast radius rather than widening it. The agent container
 * has arbitrary code execution and used to hold the agency key — every
 * customer's billing, in one place. A pass that carries only that customer's
 * key can leak only that customer's key.
 */
const PROVIDER = "anthropic";

export async function setCustomerKey(customerId: string, key: string) {
  const trimmed = key.trim();
  if (!/^sk-ant-/.test(trimmed)) {
    throw Object.assign(new Error("An Anthropic key starts with sk-ant-."), { status: 400 });
  }
  const [existing] = await db
    .select()
    .from(connections)
    .where(and(eq(connections.customerId, customerId), eq(connections.provider, PROVIDER)))
    .limit(1);
  if (existing) {
    await db
      .update(connections)
      .set({ encryptedAccess: encrypt(trimmed), mode: "api-key", connectedAt: new Date() })
      .where(eq(connections.id, existing.id));
    return;
  }
  await db.insert(connections).values({
    id: newId(),
    customerId,
    provider: PROVIDER,
    mode: "api-key",
    encryptedAccess: encrypt(trimmed),
    connectedAt: new Date(),
  });
}

export async function clearCustomerKey(customerId: string) {
  await db
    .delete(connections)
    .where(and(eq(connections.customerId, customerId), eq(connections.provider, PROVIDER)));
}

/** The decrypted key, or null. Never returned by any API — only used to run a pass. */
export async function customerKey(customerId: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(connections)
    .where(and(eq(connections.customerId, customerId), eq(connections.provider, PROVIDER)))
    .limit(1);
  if (!row) return null;
  try {
    return decrypt(row.encryptedAccess);
  } catch {
    return null;
  }
}

/** Whether one is set, and its prefix — enough to recognise, useless to steal. */
export async function customerKeyStatus(customerId: string) {
  const key = await customerKey(customerId);
  return key ? { set: true, prefix: `${key.slice(0, 11)}…` } : { set: false, prefix: null };
}

/** Does it actually work? The same question the self-test asks, per customer. */
export async function checkCustomerKey(customerId: string) {
  const key = await customerKey(customerId);
  if (!key) return { ok: false, why: "no key saved" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    });
    if (res.ok) return { ok: true, why: "their key works" };
    const body = await res.json().catch(() => ({}));
    return { ok: false, why: body?.error?.message || `Anthropic returned ${res.status}` };
  } catch (e) {
    return { ok: false, why: (e as Error).message };
  }
}
