import { NextResponse } from "next/server";
import { fail, guard } from "@/lib/api";
import { githubStatus } from "@/lib/github";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  try {
    return NextResponse.json(await githubStatus());
  } catch (e) {
    return fail(e);
  }
}
