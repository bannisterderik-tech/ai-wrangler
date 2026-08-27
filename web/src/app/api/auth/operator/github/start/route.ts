import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { githubLoginConfigured, operatorAllowlist } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!githubLoginConfigured()) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("GitHub login is not configured on this deploy.")}`, origin),
    );
  }
  if (!operatorAllowlist().length) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Set OPERATOR_GITHUB_LOGINS to the GitHub usernames allowed to run this agency — otherwise any GitHub account could sign in.",
        )}`,
        origin,
      ),
    );
  }
  const state = randomBytes(16).toString("hex");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_OAUTH_CLIENT_ID!);
  url.searchParams.set("redirect_uri", `${origin}/api/auth/operator/github/callback`);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);
  const res = NextResponse.redirect(url);
  res.cookies.set("wrangler_login_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
