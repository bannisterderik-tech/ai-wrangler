import { execFileSync } from "node:child_process";
import { eq } from "drizzle-orm";
import { IsolationError } from "./isolation";
import { encrypt, decrypt } from "./crypto";
import { db } from "./db";
import { agencyConnections } from "./schema";

const API = "https://api.github.com";

export function oauthReady() {
  return Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET);
}

export function peekGhCli(): { login?: string; present: boolean } {
  try {
    const t = execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
    if (!t) return { present: false };
    const who = execFileSync("gh", ["api", "user", "--jq", ".login"], { encoding: "utf8" }).trim();
    return { present: true, login: who || undefined };
  } catch {
    return { present: false };
  }
}

function ghCliToken() {
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

export async function getAgencyGithub() {
  const [row] = await db
    .select()
    .from(agencyConnections)
    .where(eq(agencyConnections.provider, "github"))
    .limit(1);
  return row || null;
}

export async function token() {
  const row = await getAgencyGithub();
  if (row?.encryptedAccess) return decrypt(row.encryptedAccess);
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  throw new IsolationError(
    "No GitHub account connected. Open Our GitHub and sign in with the agency account you want.",
    503,
  );
}

export async function githubConfigured() {
  return Boolean((await getAgencyGithub()) || process.env.GITHUB_TOKEN);
}

export async function githubOrg() {
  return (await getAgencyGithub())?.org || process.env.GITHUB_ORG || "";
}

export async function saveAgencyGithub(opts: {
  accessToken: string;
  mode: string;
  org?: string | null;
}) {
  const user = await githubUser(opts.accessToken);
  const orgs = await githubOrgs(opts.accessToken);
  await db.delete(agencyConnections).where(eq(agencyConnections.provider, "github"));
  await db.insert(agencyConnections)
    .values({
      provider: "github",
      mode: opts.mode,
      encryptedAccess: encrypt(opts.accessToken),
      login: user.login,
      org: opts.org ?? null,
      userJson: JSON.stringify({
        id: user.id,
        login: user.login,
        name: user.name,
        orgs: orgs.map((o) => o.login),
      }),
      connectedAt: new Date(),
    });
  return { login: user.login as string, name: (user.name as string) || user.login, orgs: orgs.map((o) => o.login) };
}

export async function disconnectAgencyGithub() {
  await db.delete(agencyConnections).where(eq(agencyConnections.provider, "github"));
}

export async function setAgencyOrg(org: string | null) {
  const row = await getAgencyGithub();
  if (!row) throw new IsolationError("connect GitHub first", 409);
  await db
    .update(agencyConnections)
    .set({ org: org || null })
    .where(eq(agencyConnections.provider, "github"));
}

async function githubUser(accessToken: string) {
  const res = await fetch(`${API}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new IsolationError(data.message || "GitHub rejected this token", res.status);
  return data;
}

async function githubOrgs(accessToken: string) {
  const res = await fetch(`${API}/user/orgs`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) return [];
  return (await res.json()) as { login: string }[];
}

async function gh(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await token()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new IsolationError(data.message || `github ${res.status}`, res.status);
  }
  return data;
}

export type GhRepo = {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  owner: { login: string };
};

export async function githubStatus() {
  const cli = peekGhCli();
  const stored = await getAgencyGithub();
  const envTok = Boolean(process.env.GITHUB_TOKEN);
  if (!(await githubConfigured())) {
    return {
      connected: false as const,
      oauthReady: oauthReady(),
      cli,
      hint: "Connect the GitHub account that should own client repos — sign in, paste a token, or import this machine’s gh login.",
    };
  }
  const user = await gh("/user");
  const orgs = await gh("/user/orgs");
  return {
    connected: true as const,
    login: user.login as string,
    name: (user.name as string) || (user.login as string),
    org: (await githubOrg()) || null,
    orgs: (orgs as { login: string }[]).map((o) => o.login),
    mode: stored?.mode || (envTok ? "env" : "unknown"),
    oauthReady: oauthReady(),
    cli,
  };
}

export async function listAgencyRepos(): Promise<GhRepo[]> {
  const org = await githubOrg();
  if (org) {
    return (await gh(`/orgs/${encodeURIComponent(org)}/repos?per_page=100&sort=updated`)) as GhRepo[];
  }
  return (await gh("/user/repos?per_page=100&affiliation=owner,organization_member&sort=updated")) as GhRepo[];
}

export async function createAgencyRepo(name: string, description?: string): Promise<GhRepo> {
  const org = await githubOrg();
  const body = {
    name,
    private: true,
    description: description || "AI Wrangler customer workspace",
    auto_init: true,
  };
  if (org) {
    return gh(`/orgs/${encodeURIComponent(org)}/repos`, { method: "POST", body: JSON.stringify(body) });
  }
  return gh("/user/repos", { method: "POST", body: JSON.stringify(body) });
}

export { ghCliToken };
