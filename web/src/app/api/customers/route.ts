import { NextResponse } from "next/server";
import { ensureCustomer, listCustomersPublic } from "@/lib/customers";

export async function GET() {
  return NextResponse.json({ customers: listCustomersPublic() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || body.id || "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const row = ensureCustomer(body.id || name, name);
  return NextResponse.json(listCustomersPublic().find((c) => c.id === row.id));
}
