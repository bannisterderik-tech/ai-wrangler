import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, operatorAllowlist, sessionCookieOptions, signSession } from "@/lib/auth";
import { publicOrigin } from "@/lib/origin";

export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get("wrangler_login_state")?.value;
  const bail = (msg: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, origin));

  if (!code || !state || !expected || state !== expected) return bail("login state mismatch — try again");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: `${origin}/api/auth/operator/github/callback`,
    }),
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenData.access_token) return bail(tokenData.error_description || "GitHub would not issue a token");

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const user = await userRes.json().catch(() => ({}));
  if (!userRes.ok || !user.login) return bail("GitHub would not say who you are");

  const allow = operatorAllowlist();
  if (!allow.includes(String(user.login).toLowerCase())) {
    return bail(`${user.login} is not on the operator list for this agency`);
  }

  const token = await signSession({
    sub: String(user.login),
    name: (user.name as string) || String(user.login),
    via: "github",
  });
  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  res.cookies.set("wrangler_login_state", "", { maxAge: 0, path: "/" });
  return res;
}
