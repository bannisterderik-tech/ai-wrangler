import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, isClient, readSession, type Session } from "./auth";
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

/**
 * Operator only — a signed-in client is refused.
 *
 * guard() asks whether anyone is signed in, not whether they are staff, and a
 * client session satisfies it. That is fine on the routes the middleware keeps
 * clients away from, and it was not fine on /api/auth/*, which the middleware
 * deliberately lets clients reach so they can sign in and out. Anything under
 * there that changes agency state has to say so itself.
 */
export async function guardOperator(): Promise<NextResponse | null> {
  const session = await operator();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  if (isClient(session)) return NextResponse.json({ error: "not yours" }, { status: 403 });
  return null;
}

/**
 * Postgres SQLSTATE, dug out of however many wrappers the driver put around it.
 * Drizzle rethrows as DrizzleQueryError with the real error on `.cause`, so a
 * check on the top-level object alone silently never matches.
 */
export function pgCode(e: unknown): string | null {
  for (let cur = e, hops = 0; cur && hops < 5; cur = (cur as { cause?: unknown }).cause, hops++) {
    const code = (cur as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
  }
  return null;
}

const CONSTRAINT: Record<string, [number, string]> = {
  "23505": [409, "something with those details already exists"],
  "23503": [409, "that points at something which is not there"],
  "23514": [400, "those values are not allowed"],
  "22001": [400, "one of those values is too long"],
};

/**
 * The only thing a caller learns from a failure is what they could act on.
 * A driver error's message carries the full statement and its bound parameters,
 * so it is logged and never returned; `says` lets a route name its own
 * constraint in words that mean something on that screen.
 */
export function fail(e: unknown, says?: Record<string, string>): NextResponse {
  const err = e as IsolationError;
  const code = pgCode(e);
  if (code) {
    console.error("[wrangler]", code, err);
    const known = CONSTRAINT[code];
    if (says?.[code]) return NextResponse.json({ error: says[code] }, { status: known?.[0] ?? 409 });
    if (known) return NextResponse.json({ error: known[1] }, { status: known[0] });
    return NextResponse.json({ error: "the database refused that" }, { status: 500 });
  }
  const status = typeof err?.status === "number" ? err.status : 500;
  if (status >= 500) {
    console.error("[wrangler]", err);
    // Our own thrown errors carry a status and a sentence meant for a person.
    // Anything else is an internal accident and stays internal.
    return NextResponse.json({ error: "something went wrong" }, { status: 500 });
  }
  return NextResponse.json({ error: err?.message || "that did not work" }, { status });
}
