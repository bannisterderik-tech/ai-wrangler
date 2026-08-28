import { guardOperator } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { saveAgencyGithub } from "@/lib/github";
import { publicOrigin } from "@/lib/origin";

export async function GET(req: NextRequest) {
  // Connecting a Vercel or GitHub account rewrites agency-wide credentials and
  // bindings. The middleware lets client sessions reach /api/auth/*, so this
  // route has to refuse them itself.
  const denied = await guardOperator();
  if (denied) return denied;

  const origin = publicOrigin(req);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stored = req.cookies.get("gh_oauth_state")?.value;
  if (!code || !state || state !== stored) {
    return NextResponse.redirect(new URL("/github?error=oauth_state", origin));
  }
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/github?error=oauth_not_configured", origin));
  }
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${origin}/api/auth/github/callback`,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(
      new URL("/github?error=" + encodeURIComponent(tokenData.error_description || "token_exchange_failed"), origin),
    );
  }
  await saveAgencyGithub({ accessToken: tokenData.access_token, mode: "oauth" });
  const res = NextResponse.redirect(new URL("/github", origin));
  res.cookies.set("gh_oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}
