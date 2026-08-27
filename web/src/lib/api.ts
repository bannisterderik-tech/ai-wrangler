import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, readSession, type Session } from "./auth";
import { IsolationError } from "./isolation";

/** Who is driving. The middleware already gated this request; routes check again anyway. */
export async function operator(): Promise<Session | null> {
  return readSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** `const denied = await guard(); if (denied) return denied;` at the top of every route. */
export async function guard(): Promise<NextResponse | null> {
  const session = await operator();
  if (session) return null;
  return NextResponse.json({ error: "sign in first" }, { status: 401 });
}

export function fail(e: unknown): NextResponse {
  const err = e as IsolationError;
  const status = typeof err?.status === "number" ? err.status : 500;
  if (status >= 500) console.error("[wrangler]", err);
  return NextResponse.json({ error: err?.message || "something went wrong" }, { status });
}
