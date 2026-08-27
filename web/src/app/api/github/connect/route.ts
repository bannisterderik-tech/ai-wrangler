import { NextResponse } from "next/server";
import { fail, guard } from "@/lib/api";
import { disconnectAgencyGithub, ghCliToken, saveAgencyGithub, setAgencyOrg } from "@/lib/github";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  try {
    if (body.disconnect) {
      await disconnectAgencyGithub();
      return NextResponse.json({ ok: true, connected: false });
    }
    if (body.org !== undefined && !body.token && !body.useGhCli) {
      await setAgencyOrg(body.org || null);
      return NextResponse.json({ ok: true });
    }
    let access = String(body.token || "").trim();
    let mode = "pat";
    if (body.useGhCli) {
      access = ghCliToken();
      mode = "gh-cli";
      if (!access) {
        return NextResponse.json(
          {
            error:
              "This machine’s gh CLI is not logged in. Run `gh auth login` with the account you want, or paste a token.",
          },
          { status: 400 },
        );
      }
    }
    if (access.length < 12) {
      return NextResponse.json({ error: "GitHub token required" }, { status: 400 });
    }
    const saved = await saveAgencyGithub({ accessToken: access, mode, org: body.org || null });
    return NextResponse.json({ ok: true, ...saved });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE() {
  const denied = await guard();
  if (denied) return denied;
  await disconnectAgencyGithub();
  return NextResponse.json({ ok: true });
}
