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
import { agencyKeyStatus } from "@/lib/keys";
import { db } from "@/lib/db";
import { githubAppStatus } from "@/lib/github-app";
import { stripeStatus } from "@/lib/stripe";
import { twilioStatus } from "@/lib/twilio";

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
    mail: { configured: (await agencyKeyStatus()).resend },
    // What each capability needs, and what is missing. Booleans and variable
    // NAMES only — never a value. Finding out a thing is unconfigured by
    // watching it fail is how the dialer shipped as a robocaller.
    origin: {
      // Required in production: links that leave the server refuse without it.
      configured: Boolean(
        process.env.PUBLIC_ORIGIN || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.VERCEL_PROJECT_PRODUCTION_URL,
      ),
    },
    agent: {
      // Without the App the agent cannot push, and open_branch cannot check
      // whether a branch it was told about is really there.
      canPush: githubAppStatus().configured,
      missing: githubAppStatus().missing,
    },
    phone: {
      configured: twilioStatus().configured,
      browserCalling: twilioStatus().browser,
      missing: twilioStatus().missing,
    },
    payments: {
      configured: stripeStatus().configured,
      // Without the webhook secret a paid deposit never becomes a customer.
      webhook: stripeStatus().webhook,
      mode: stripeStatus().mode,
      missing: stripeStatus().missing,
    },
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
