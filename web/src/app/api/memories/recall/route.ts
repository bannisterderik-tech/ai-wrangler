import { NextResponse } from "next/server";
import { fail, guardTenant } from "@/lib/api";
import { recall, recallMode } from "@/lib/recall";
import { customerInTenant } from "@/lib/tenant-scope";

/** What we know about this customer that bears on `q`. */
export async function GET(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  try {
    const url = new URL(req.url);
    const customerId = String(url.searchParams.get("customerId") || "").trim();
    if (!customerId) return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    if (!(await customerInTenant(t.tenantId, customerId))) {
      return NextResponse.json({ error: "no such customer" }, { status: 404 });
    }
    const q = String(url.searchParams.get("q") || "");
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 12));
    const memories = await recall(customerId, q, limit);
    return NextResponse.json({ mode: recallMode(), memories });
  } catch (e) {
    return fail(e);
  }
}
