import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { people, personScopes, personTools } from "./schema";

/**
 * A session token is what a teammate's Claude Code sends on every MCP call.
 * We store a SHA-256 of it and a display prefix — never the token. It is
 * returned exactly once, when it is minted or rotated, and if they lose it the
 * only cure is a rotation. That is the point.
 */

const PREFIX = "wr_sess_";

export function mintToken() {
  const raw = PREFIX + randomBytes(24).toString("base64url");
  return { raw, hash: hashToken(raw), prefix: raw.slice(0, PREFIX.length + 4) };
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw.trim()).digest("hex");
}

/** Constant-time compare of two hex digests of the same length. */
export function sameDigest(a: string, b: string) {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length || ab.length === 0) return false;
  return timingSafeEqual(ab, bb);
}

export type McpSession = {
  id: string;
  name: string;
  handle: string;
  /** operator = a teammate, scoped to a list. agent = one project, one customer. */
  kind: string;
  /** Which agency account this session acts inside. Never widened by a tool. */
  tenantId: string;
  /** owner | admin | operator — what they may do within it. */
  tenantRole: string;
  approver: boolean;
  status: string;
  scope: string[];
  tools: string[];
};

/** Resolve an `Authorization: Bearer <token>` header to a person, or null. */
export async function sessionFromHeader(header: string | null): Promise<McpSession | null> {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const digest = hashToken(match[1]);

  // Indexed lookup on the digest, then a constant-time confirm so a partial
  // index scan cannot be used to distinguish "no such token" from "wrong token".
  const [row] = await db.select().from(people).where(eq(people.tokenHash, digest)).limit(1);
  if (!row || !row.tokenHash || !sameDigest(row.tokenHash, digest)) return null;
  if (row.status === "revoked") return null;

  const tools = await db.select().from(personTools).where(eq(personTools.personId, row.id));

  // An agent's scope is its column, not a list somebody maintains. It cannot be
  // widened by a mis-click, and there is no second customer to widen it to.
  let scope: string[];
  if (row.kind === "agent") {
    scope = row.customerId ? [row.customerId] : [];
  } else {
    const scopes = await db.select().from(personScopes).where(eq(personScopes.personId, row.id));
    scope = scopes.map((s) => s.customerId);
  }

  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    kind: row.kind,
    // From the row, so a token cannot name its own account. This is what makes
    // platform tools safe to grant: they are always inside one tenant.
    tenantId: row.tenantId,
    tenantRole: row.tenantRole,
    approver: row.approver,
    status: row.status,
    scope,
    tools: tools.map((t) => t.tool),
  };
}

/** Mark a session live. Best effort — a failed heartbeat must never fail a tool call. */
export async function touchSession(id: string, clientVersion?: string | null) {
  try {
    await db
      .update(people)
      .set({
        status: "connected",
        connectedAt: new Date(),
        ...(clientVersion ? { clientVersion } : {}),
      })
      .where(eq(people.id, id));
  } catch {
    /* heartbeat only */
  }
}
