import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { publicOrigin } from "@/lib/origin";

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL(
        "/github?error=" +
          encodeURIComponent(
            "GitHub OAuth isn’t configured. Create an OAuth App at github.com/settings/developers (callback http://localhost:3000/api/auth/github/callback) and set GITHUB_OAUTH_CLIENT_ID / SECRET — or paste a token on this page.",
          ),
        publicOrigin(req),
      ),
    );
  }
  const state = randomBytes(16).toString("hex");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${publicOrigin(req)}/api/auth/github/callback`);
  url.searchParams.set("scope", "repo read:org user");
  url.searchParams.set("state", state);
  const res = NextResponse.redirect(url);
  res.cookies.set("gh_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
