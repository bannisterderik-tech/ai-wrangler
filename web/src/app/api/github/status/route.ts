import { NextResponse } from "next/server";
import { IsolationError } from "@/lib/isolation";
import { githubStatus } from "@/lib/github";

export async function GET() {
  try {
    return NextResponse.json(await githubStatus());
  } catch (e) {
    const err = e as IsolationError;
    return NextResponse.json({ connected: false, error: err.message }, { status: err.status || 500 });
  }
}
