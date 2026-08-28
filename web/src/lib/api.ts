import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { HOUSE, SESSION_COOKIE, isClient, isOperatorEmail, readSession, tenantOf, type Session } from "./auth";
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
 * A client session, re-checked against the people table.
 *
 * Sessions are signed cookies with a seven day life and no server-side state,
 * because the middleware runs at the edge and cannot reach Postgres. That is
 * fine for deciding *who* is asking and wrong for deciding *whether they still
 * work here*: deleting a client, or moving them to another customer, left their
 * existing cookie working for up to a week, still pinned to the old customer.
 *
 * Route handlers can reach the database, so this is where it gets checked. The
 * customer comes from the row, not from the cookie — a cookie minted before a
 * move must not keep opening the old door.
 */
export async function clientSession(): Promise<{ session: Session; customerId: string } | null> {
  const session = await operator();
  if (!isClient(session)) return null;
  const { db } = await import("./db");
  const { people } = await import("./schema");
  const { sql } = await import("drizzle-orm");
  // By email, the same way the magic-link callback finds them, and
  // case-insensitively for the same reason.
  const [row] = await db
    .select()
    .from(people)
    .where(sql`lower(${people.email}) = ${String(session.sub || "").toLowerCase()} AND ${people.kind} = 'client'`)
    .limit(1);
  // No row, no longer a client, revoked, or no customer: the cookie is stale.
  if (!row || row.kind !== "client" || row.status === "revoked" || !row.customerId) return null;
  return { session, customerId: row.customerId };
}

/**
 * The tenant this request acts within, and what it may do.
 *
 * Never taken from a query string or a body. An agency account that could name
 * its own tenant is not an agency account, it is a shared database.
 */
export async function tenantContext(): Promise<
  { tenantId: string; role: "owner" | "admin" | "operator"; canBuild: boolean } | null
> {
  const session = await operator();
  if (!session || isClient(session)) return null;
  const { db } = await import("./db");
  const { tenants } = await import("./schema");
  const { eq } = await import("drizzle-orm");
  const tenantId = tenantOf(session);
  const [row] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  // A tenant row that has been deleted or suspended stops working now, rather
  // than when the cookie expires.
  if (!row || row.status !== "active") return null;
  /**
   * A cookie minted before tenants existed carries no role.
   *
   * Before this change the only way to hold an operator session at all was the
   * house password, house GitHub, or the house email allowlist — so an old
   * session IS the house, and dropping it to "operator" would lock the owner
   * out of their own product for a week until the cookie expired. Checked
   * against the allowlist rather than assumed.
   */
  const role =
    session.trole ??
    (tenantId === HOUSE && (session.via !== "email" || isOperatorEmail(session.sub)) ? "owner" : "operator");

  return {
    tenantId,
    role,
    // The house always can; everyone else only if it was sold to them.
    canBuild: row.canBuild,
  };
}

/**
 * `const t = await guardTenant(); if ("error" in t) return t.error;`
 *
 * Use on anything agency-level — leads, proposals, partners, customers.
 */
export async function guardTenant() {
  const t = await tenantContext();
  if (!t) return { error: NextResponse.json({ error: "sign in first" }, { status: 401 }) };
  return t;
}

/** The AI building half. A CRM-only tenant is refused it outright. */
export async function guardBuild() {
  const t = await tenantContext();
  if (!t) return { error: NextResponse.json({ error: "sign in first" }, { status: 401 }) };
  if (!t.canBuild) {
    return {
      error: NextResponse.json(
        { error: "This account does not include the build side — agents, repositories and deploys." },
        { status: 403 },
      ),
    };
  }
  return t;
}

/** Only the house may create tenants or look across them. */
export async function guardOwner() {
  const t = await tenantContext();
  if (!t) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  // Through tenantContext, so a pre-tenant cookie is resolved the same way
  // everywhere rather than only in the places that remembered to.
  if (t.role !== "owner" || t.tenantId !== HOUSE) {
    return NextResponse.json({ error: "not yours" }, { status: 403 });
  }
  return null;
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
