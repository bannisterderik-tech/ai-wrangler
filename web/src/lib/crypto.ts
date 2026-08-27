import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * The vault key. A malformed TOKEN_ENCRYPTION_KEY used to fall back silently to a
 * key derived from a literal string in this public repo, which meant one typo
 * downgraded every customer's stored token to plaintext-equivalent while the UI
 * kept saying "encrypted". In production that is now a refusal to boot.
 */
function key(): Buffer {
  const raw = (process.env.TOKEN_ENCRYPTION_KEY || "").trim();
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be 64 hex characters. Generate one with: openssl rand -hex 32",
    );
  }
  if (!warned) {
    warned = true;
    console.warn(
      "[wrangler] TOKEN_ENCRYPTION_KEY is missing or malformed — using the DEV vault key. " +
        "Anything encrypted now is NOT protected. Set a real key before storing a customer token.",
    );
  }
  return scryptSync("ai-wrangler-dev-only", "vault", 32);
}

let warned = false;

export function encrypt(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decrypt(blob: string) {
  const parts = String(blob).split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("unknown vault format");
  const iv = Buffer.from(parts[1], "base64url");
  const tag = Buffer.from(parts[2], "base64url");
  const data = Buffer.from(parts[3], "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function slug(name: string) {
  return (
    String(name || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "customer"
  );
}
