import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import {
  authConfigured,
  githubLoginConfigured,
  magicLinkConfigured,
  operatorAllowlist,
  operatorEmails,
  passwordLoginConfigured,
} from "@/lib/auth";
import { mailConfigured } from "@/lib/mail";
import { db } from "@/lib/db";

/**
 * Public, and it stays that way, so it says nothing about customers — only
 * whether this deploy is wired up. Booleans, never a connection string.
 */
async function databaseReachable() {
  if (!process.env.DATABASE_URL) return { configured: false, reachable: false };
  try {
    await db.execute(sql`select 1`);
    return { configured: true, reachable: true };
  } catch {
    return { configured: true, reachable: false };
  }
}

export async function GET() {
  const database = await databaseReachable();
  return NextResponse.json({
    ok: database.reachable,
    database,
    vault: { configured: /^[0-9a-fA-F]{64}$/.test((process.env.TOKEN_ENCRYPTION_KEY || "").trim()) },
    integration: Boolean(process.env.VERCEL_INTEGRATION_CLIENT_ID && process.env.VERCEL_INTEGRATION_SLUG),
    mail: { configured: mailConfigured() },
    login: {
      configured: authConfigured(),
      email: magicLinkConfigured(),
      // A count, not the addresses — this endpoint is public.
      operators: operatorEmails().length,
      password: passwordLoginConfigured(),
      github: githubLoginConfigured() && operatorAllowlist().length > 0,
      allowlist: operatorAllowlist().length > 0,
    },
  });
}
