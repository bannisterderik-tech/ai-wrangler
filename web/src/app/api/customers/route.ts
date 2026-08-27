import { NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { ensureCustomer, listCustomersPublic } from "@/lib/customers";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json({ customers: await listCustomersPublic() });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || body.id || "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const row = await ensureCustomer(body.id || name, name);
  const list = await listCustomersPublic();
  return NextResponse.json(list.find((c) => c.id === row.id));
}
