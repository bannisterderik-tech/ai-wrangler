import { NextResponse } from "next/server";
import { fail, guardBuild } from "@/lib/api";
import { githubStatus } from "@/lib/github";

export async function GET() {
  // The build half. A CRM-only account is refused it outright rather than
  // shown an empty floor and left to wonder.
  const b = await guardBuild();
  if ("error" in b) return b.error;
  try {
    return NextResponse.json(await githubStatus());
  } catch (e) {
    return fail(e);
  }
}
