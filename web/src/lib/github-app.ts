import { createSign } from "node:crypto";

/**
 * Short-lived, single-repo GitHub credentials.
 *
 * The agency OAuth token is scope `repo` — read/write on every repository in
 * every organisation that account can reach. It is the right credential for the
 * operator screens, where a human picked the repo, and it is the wrong one to
 * put anywhere an agent can reach: one missed binding check and a job for
 * customer A writes to customer B with the agency's own identity on the commit.
 *
 * A GitHub App installation token is the opposite shape. It is minted per call,
 * scoped to exactly one repository, expires in about an hour, carries only the
 * permissions asked for, and can be revoked. `workflows` is deliberately never
 * requested, so an agent cannot write .github/workflows/* and get code running
 * with the repository's secrets.
 *
 * The container does get this token — it has to, to push — and it does have
 * arbitrary code execution, so treat it as exfiltrable for its lifetime. That is
 * a bounded loss: one repo, one hour, no workflows. The alternative on the table
 * was handing that same container a key to every repo the agency owns.
 */

const APP_ID = process.env.GITHUB_APP_ID;
// PEM, either literal newlines or \n-escaped, because both survive a paste into
// a different dashboard and neither is worth losing an evening to.
const PRIVATE_KEY = (process.env.GITHUB_APP_PRIVATE_KEY || "").replace(/\\n/g, "\n");

export function githubAppConfigured() {
  return Boolean(APP_ID && PRIVATE_KEY.includes("PRIVATE KEY"));
}

export function githubAppStatus() {
  return {
    configured: githubAppConfigured(),
    appId: APP_ID ?? null,
    missing: [
      !APP_ID && "GITHUB_APP_ID",
      !PRIVATE_KEY && "GITHUB_APP_PRIVATE_KEY",
      Boolean(PRIVATE_KEY) && !PRIVATE_KEY.includes("PRIVATE KEY") && "GITHUB_APP_PRIVATE_KEY (not a PEM)",
    ].filter(Boolean) as string[],
  };
}

const b64url = (b: Buffer | string) =>
  Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** The App's own JWT. Ten minutes is GitHub's ceiling; we ask for nine. */
function appJwt() {
  if (!githubAppConfigured()) throw new Error("GitHub App is not configured.");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  // 60s of backdating absorbs clock skew between us and GitHub, which is the
  // usual cause of a mysterious 401 here.
  const payload = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: APP_ID }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  return `${header}.${payload}.${b64url(signer.sign(PRIVATE_KEY))}`;
}

async function gh(path: string, init: RequestInit & { auth: string }) {
  const { auth, ...rest } = init;
  const res = await fetch(`https://api.github.com${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${auth}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "ai-wrangler",
      ...(rest.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    // GitHub's message is safe to surface; it says things like "not installed".
    throw new Error(`GitHub ${res.status}: ${data.message || "request failed"}`);
  }
  return data;
}

/** Which installation covers `owner/repo`, or null if the App is not on it. */
export async function installationFor(repo: string): Promise<number | null> {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`"${repo}" is not owner/repo.`);
  try {
    const data = await gh(`/repos/${owner}/${name}/installation`, { auth: appJwt() });
    return data.id ?? null;
  } catch {
    return null;
  }
}

export type RepoToken = { token: string; expiresAt: string; repo: string };

/**
 * A token that can push to exactly one repository, for about an hour.
 *
 * Note what is NOT requested: `workflows`. Without it GitHub refuses any push
 * that touches .github/workflows, whatever the agent decides to try.
 */
export async function repoToken(repo: string): Promise<RepoToken> {
  const [, name] = repo.split("/");
  const installationId = await installationFor(repo);
  if (!installationId) {
    throw new Error(
      `The AI Wrangler GitHub App is not installed on ${repo}. Install it on that repository and try again.`,
    );
  }
  const data = await gh(`/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    auth: appJwt(),
    body: JSON.stringify({
      repositories: [name],
      permissions: { contents: "write", pull_requests: "write" },
    }),
  });
  return { token: data.token, expiresAt: data.expires_at, repo };
}

/** A clone URL the agent can push with. Carries the secret — never log it. */
export async function cloneUrl(repo: string) {
  const t = await repoToken(repo);
  return {
    url: `https://x-access-token:${t.token}@github.com/${repo}.git`,
    expiresAt: t.expiresAt,
  };
}

/**
 * What is actually on GitHub for a branch.
 *
 * This is the point of the whole file: the OS's record of a branch becomes an
 * observed fact rather than something the agent told us. Read with the App
 * token, not the agent's.
 */
export async function readBranch(repo: string, branch: string) {
  const [owner, name] = repo.split("/");
  const { token } = await repoToken(repo);
  try {
    const ref = await gh(`/repos/${owner}/${name}/git/ref/heads/${encodeURIComponent(branch)}`, { auth: token });
    const info = await gh(`/repos/${owner}/${name}`, { auth: token });
    const base = info.default_branch || "main";
    const cmp = await gh(
      `/repos/${owner}/${name}/compare/${encodeURIComponent(base)}...${encodeURIComponent(branch)}`,
      { auth: token },
    );
    return {
      exists: true as const,
      headSha: ref.object?.sha as string,
      base,
      ahead: cmp.ahead_by as number,
      files: (cmp.files ?? []).map((f: { filename: string; additions: number; deletions: number; status: string }) => ({
        path: f.filename,
        added: f.additions,
        removed: f.deletions,
        status: f.status,
      })),
    };
  } catch {
    return { exists: false as const };
  }
}

/** Open a pull request. The human still merges, in GitHub, where the diff is. */
export async function openPullRequest(repo: string, branch: string, title: string, body: string) {
  const [owner, name] = repo.split("/");
  const { token } = await repoToken(repo);
  const info = await gh(`/repos/${owner}/${name}`, { auth: token });
  const base = info.default_branch || "main";
  const existing = await gh(
    `/repos/${owner}/${name}/pulls?head=${encodeURIComponent(`${owner}:${branch}`)}&state=open`,
    { auth: token },
  );
  if (Array.isArray(existing) && existing.length) {
    return { number: existing[0].number as number, url: existing[0].html_url as string, created: false as const };
  }
  const pr = await gh(`/repos/${owner}/${name}/pulls`, {
    method: "POST",
    auth: token,
    body: JSON.stringify({ title, body, head: branch, base }),
  });
  return { number: pr.number as number, url: pr.html_url as string, created: true as const };
}
