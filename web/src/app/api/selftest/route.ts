import { NextResponse } from "next/server";
import { fail, guard } from "@/lib/api";
import { selfTest } from "@/lib/selftest";

/**
 * Operator-only, because it reports vendor account names.
 *
 * Every check is a real request to the real service. Nothing here infers that
 * something works from an environment variable being present — that inference
 * is exactly how a deploy ends up quietly doing nothing.
 */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  try {
    const checks = await selfTest();
    return NextResponse.json({
      checks,
      working: checks.filter((c) => c.state === "ok").length,
      broken: checks.filter((c) => c.state === "fail").length,
      off: checks.filter((c) => c.state === "off").length,
    });
  } catch (e) {
    return fail(e);
  }
}
