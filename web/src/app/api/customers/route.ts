import { NextResponse } from "next/server";
import { guardTenant } from "@/lib/api";
import { ensureCustomer, listCustomersPublic } from "@/lib/customers";

export async function GET() {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  return NextResponse.json({ customers: await listCustomersPublic(t.tenantId) });
}

export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || body.id || "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const row = await ensureCustomer(body.id || name, name, t.tenantId);
  const list = await listCustomersPublic(t.tenantId);
  return NextResponse.json(list.find((c) => c.id === row.id));
}
