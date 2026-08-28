import { NextResponse } from "next/server";
import { fail, guard } from "@/lib/api";
import { recall, recallMode } from "@/lib/recall";

/** What we know about this customer that bears on `q`. */
export async function GET(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const url = new URL(req.url);
    const customerId = String(url.searchParams.get("customerId") || "").trim();
    if (!customerId) return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    const q = String(url.searchParams.get("q") || "");
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 12));
    const memories = await recall(customerId, q, limit);
    return NextResponse.json({ mode: recallMode(), memories });
  } catch (e) {
    return fail(e);
  }
}
