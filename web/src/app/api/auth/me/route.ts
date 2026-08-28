import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, isClient, readSession } from "@/lib/auth";
import { tenantContext } from "@/lib/api";

export async function GET() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ signedIn: false }, { status: 401 });
  const base = { signedIn: true, name: session.name, sub: session.sub, via: session.via };
  if (isClient(session)) return NextResponse.json({ ...base, kind: "client" });

  // Which account this is and what it includes, so the navigation can stop
  // offering a floor this account will be refused.
  const t = await tenantContext();
  if (!t) return NextResponse.json({ signedIn: false }, { status: 401 });
  return NextResponse.json({
    ...base,
    kind: "operator",
    tenantId: t.tenantId,
    role: t.role,
    canBuild: t.canBuild,
    isOwner: t.role === "owner",
  });
}
