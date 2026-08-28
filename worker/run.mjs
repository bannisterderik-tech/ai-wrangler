#!/usr/bin/env node
/**
 * The build agent.
 *
 * This is Claude Code, headless, in a container, pointed at the Wrangler MCP
 * server. It is deliberately not a second orchestration system: the floor
 * already decides what work exists, who owns it, what a session may touch and
 * what needs a human. This process only gives that floor a pair of hands.
 *
 * Everything it is allowed to do is decided by its session token — the customers
 * in its scope and the tools it was granted on the Sessions screen. Take away
 * open_branch and it can read and think and ask, and cannot write. That is not a
 * prompt instruction; the server refuses the call.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MCP_URL = need("WRANGLER_MCP_URL");

/**
 * One token per agent, and an agent is one project. Several here means one
 * container hosting several project agents — each pass runs as exactly one of
 * them, in its own workspace, and the server gives it exactly one customer.
 * Isolation is per token, not per container, so this stays true however many
 * you list.
 */
const TOKENS = (process.env.WRANGLER_SESSION_TOKENS || process.env.WRANGLER_SESSION_TOKEN || "")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);
if (!TOKENS.length) {
  console.error(
    "[agent] WRANGLER_SESSION_TOKENS is not set.\n" +
      "        One token per project agent, comma separated. Mint each on Sessions —\n" +
      "        + Agent for a project — and each is shown once.",
  );
  process.exit(1);
}
const WORKSPACE = process.env.WORKSPACE_DIR || "/work";
const INTERVAL = Number(process.env.POLL_SECONDS || 120);
const ONCE = process.env.RUN_ONCE === "1";
/**
 * The fallback only. Normally the floor names the model for the next job, so a
 * heading change does not get billed at rebuild prices. AGENT_MODEL is what we
 * use when the floor cannot be reached or has nothing queued.
 */
const MODEL = process.env.AGENT_MODEL || "claude-sonnet-5";

function need(key) {
  const v = process.env[key];
  if (!v) {
    console.error(
      `[agent] ${key} is not set.\n` +
        `        WRANGLER_MCP_URL is https://<your-app>/api/mcp\n` +
        `        WRANGLER_SESSION_TOKENS is one token per project agent, comma separated.\n        Both are set for you when you mint an agent token in the OS. If they are\n        missing, this service was made by hand rather than by Sessions — delete it\n        and mint an agent instead.`,
    );
    process.exit(1);
  }
  return v;
}

/**
 * Claude Code reads .mcp.json from the working directory. Writing it here rather
 * than baking it into the image keeps the token out of the image layers.
 */
function writeMcpConfig(dir, token) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, ".mcp.json"),
    JSON.stringify(
      {
        mcpServers: {
          wrangler: {
            type: "http",
            url: MCP_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        },
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
}

const BRIEF = `You are a build agent on the AI Wrangler floor. You work for an agency that
builds and runs websites and lead systems for local service businesses.

Do this, in order:

1. list_jobs. If nothing is unclaimed and nothing you already hold is unfinished, say
   "nothing to do" and stop. Do not invent work.
2. claim_job on one job. One at a time.
3. read_project on it. That call is the truth about this customer: what is bound and
   therefore what you may touch, their house rules, what is on fire, how they are
   doing. Read it before you plan. Their house rules outrank your judgement.
4. next_work if the job is vague — the client's own requests and their live site's
   errors are there. open_work turns one into a job with its own budget.
5. Do the work. post_step as you go, one line per real step, so a human can watch
   without interrupting you.
6. Stop at the wall. request_approval for anything irreversible: a production
   merge, a first message to a real person, money moving. Then stop. Do not do it
   anyway, and do not ask twice.

Hard rules:
- Never guess a repository name. read_bound_repo is the only source. A name you
  guessed will be refused with a 403 and you will have wasted the turn.
- Never write to main. Commit your work to the branch FIRST, then open_branch, then
  ask. open_branch records what you tell it; it cannot see your working tree. A
  branch recorded with the work still uncommitted reads as done and is not, and the
  next pass will spend the budget finding that out.
- Before you plan, read the steps already on this job. If a previous pass hit a wall
  you are about to walk into, say so and stop. Re-deriving what the last pass
  already established is how a cap gets spent with nothing to show.
- If a tool refuses you, that refusal is the answer. Do not try a different phrasing
  of the same thing.
- Spend is capped per job. When you are near the cap, post_step saying so and stop.`;

/**
 * Exactly what this agent may reach for.
 *
 * In non-interactive mode an unlisted tool is a prompt nobody is there to
 * answer, so the MCP tools have to be named. Naming them is also the point: this
 * list plus the session's grants are the whole of what it can do. It gets git
 * and the editor, and it does not get a shell that can curl the internet.
 */
const ALLOWED = [
  "mcp__wrangler__list_jobs",
  "mcp__wrangler__claim_job",
  "mcp__wrangler__release_job",
  "mcp__wrangler__read_project",
  "mcp__wrangler__read_bound_repo",
  "mcp__wrangler__next_work",
  "mcp__wrangler__open_work",
  "mcp__wrangler__open_branch",
  "mcp__wrangler__post_step",
  "mcp__wrangler__request_approval",
  "Read",
  "Edit",
  "Write",
  "Glob",
  "Grep",
  "Bash(git *)",
  "Bash(npm *)",
  // Without this a static-site repo cannot be built at all: `node build.mjs` is
  // refused, the agent correctly takes the refusal as final, goes to the wall,
  // gets approved, comes back and hits the same wall. Four laps on one job
  // before anyone noticed. `npm *` already runs arbitrary scripts, so this
  // widens nothing that was not already open.
  "Bash(node *)",
  "Bash(ls *)",
  "Bash(cat *)",
];

if (!ALLOWED.some((t) => t.startsWith("Bash(node"))) {
  // A guard against the exact regression: a static-site repo whose build is
  // `node build.mjs` becomes unbuildable and every pass ends at the same wall.
  throw new Error("[agent] the allowlist must let the agent run its build");
}

/**
 * Whether this Claude Code build knows `--bare`.
 *
 * It matters because without it a `-p` session auto-loads the hooks in the
 * checkout's .claude/settings.json, its CLAUDE.md and its skills — and the
 * checkout is a customer's repository, which is exactly the thing this product
 * treats as untrusted. House rules reach the agent through read_project, from
 * the floor, not from the repo it was pointed at.
 *
 * Detected rather than assumed: an unknown flag is rejected before the run
 * starts, and a hardening change must not be able to break every pass.
 */
const BARE = (() => {
  try {
    const r = spawnSync("claude", ["--help"], { encoding: "utf8", timeout: 20_000 });
    return `${r.stdout || ""}${r.stderr || ""}`.includes("--bare");
  } catch {
    return false;
  }
})();

/**
 * Ask the floor what is next and how much brain it wants.
 *
 * --model is fixed for the life of a session, but the job is chosen inside the
 * session, so the tier can only be honoured by asking before we start.
 */
async function nextBrain(token) {
  try {
    const res = await fetch(new URL("/api/agent/next", MCP_URL), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function runOnce(dir, model) {
  return new Promise((resolve) => {
    const args = [
      "-p", BRIEF,
      ...(BARE ? ["--bare"] : []),
      "--model", model,
      "--permission-mode", "acceptEdits",
      "--mcp-config", join(dir, ".mcp.json"),
      // Only the floor. Not whatever else happens to be configured on the box.
      "--strict-mcp-config",
      // The harness prints what the pass cost. That number is the only honest
      // one available: asking the model to report its own spend puts the
      // spender in charge of the cap. The floor is the live log — the agent
      // streams there with post_step — so nothing is lost by capturing stdout.
      "--output-format", "json",
      "--allowedTools", ...ALLOWED,
    ];
    const child = spawn("claude", args, {
      cwd: dir,
      stdio: ["ignore", "pipe", "inherit"],
      env: process.env,
    });
    let out = "";
    child.stdout.on("data", (b) => {
      out += b;
    });
    child.on("error", (e) => {
      console.error("[agent] could not start claude:", e.message);
      resolve({ code: 1, usd: 0 });
    });
    child.on("exit", (code) => {
      let usd = 0;
      let text = "";
      try {
        const r = JSON.parse(out);
        usd = Number(r.total_cost_usd) || 0;
        text = String(r.result ?? "").trim();
      } catch {
        // Never let an unreadable result swallow the pass. A cost we could not
        // read is reported as unknown, not as zero-and-carry-on.
        if (out.trim()) console.log(out.trim());
        usd = NaN;
      }
      if (text) console.log(text);
      resolve({ code: code ?? 0, usd });
    });
  });
}

/**
 * Tell the floor what the pass cost. The floor decides whether that puts the
 * job over its cap and holds it if so — the container does not get a vote.
 */
async function reportSpend(token, usd) {
  if (!Number.isFinite(usd) || usd <= 0) return null;
  try {
    const res = await fetch(new URL("/api/agent/spend", MCP_URL), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ usd }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Ask the floor who this token is, so the log names the agent and its project. */
async function whoAmI(token) {
  try {
    const res = await fetch(MCP_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { label: `token ending ${token.slice(-6)}`, ok: false };
    const info = await res.json();
    return { label: `${info.session?.handle ?? "agent"} → ${(info.scope || []).join(", ") || "no project"}`, ok: true };
  } catch {
    return { label: `token ending ${token.slice(-6)}`, ok: false };
  }
}

async function main() {
  console.log(`[agent] floor: ${MCP_URL}`);
  console.log(`[agent] ${TOKENS.length} agent${TOKENS.length === 1 ? "" : "s"}  model: ${MODEL}`);
  console.log(`[agent] mode: ${ONCE ? "one pass each" : `every ${INTERVAL}s`}`);
  console.log(
    BARE
      ? "[agent] bare mode: the checkout's own hooks, skills and CLAUDE.md are not loaded"
      : "[agent] this Claude Code has no --bare: a checkout's .claude/ hooks and CLAUDE.md WILL load. Update the image.",
  );

  const agents = [];
  for (let i = 0; i < TOKENS.length; i++) {
    const token = TOKENS[i];
    const who = await whoAmI(token);
    if (!who.ok) {
      // A revoked agent's token stays in the worker's list — the OS never keeps
      // the plaintext, so it cannot go and remove it. It does not need to: a
      // token the floor no longer recognises is simply skipped.
      console.warn(`[agent] skipping ${who.label}: the floor does not recognise this token (revoked?)`);
      continue;
    }
    // A workspace each: two agents must never share a checkout.
    const dir = join(WORKSPACE, `agent-${i + 1}`);
    writeMcpConfig(dir, token);
    agents.push({ dir, label: who.label, token });
    console.log(`[agent] ${i + 1}. ${who.label}  workspace ${dir}`);
  }

  if (!agents.length) {
    console.error("[agent] no token on this worker is recognised by the floor. Nothing to run.");
    process.exit(1);
  }

  do {
    for (const a of agents) {
      const started = Date.now();
      console.log(`[agent] --- ${a.label} ---`);

      const next = await nextBrain(a.token);
      if (next && !next.job) {
        // Nothing claimable. Starting a session to be told that costs real money
        // for a guaranteed "nothing to do".
        console.log(`[agent] ${a.label}: ${next.reason}. Skipping this pass.`);
        continue;
      }
      const model = next?.model || MODEL;
      if (next?.job) {
        console.log(
          `[agent] ${a.label}: ${next.job.id} "${next.job.title}" — ${next.brain} (${model}), ` +
            `$${Number(next.remaining).toFixed(2)} left on its cap`,
        );
      } else {
        console.log(`[agent] ${a.label}: floor unreachable, falling back to ${model}`);
      }

      const { code, usd } = await runOnce(a.dir, model);
      const secs = Math.round((Date.now() - started) / 1000);
      const cost = Number.isFinite(usd) ? `$${usd.toFixed(2)}` : "cost unknown";
      console.log(`[agent] ${a.label}: ${secs}s  ${cost}  (exit ${code})`);
      if (!Number.isFinite(usd)) {
        console.warn(`[agent] ${a.label}: could not read the pass cost — the cap cannot see this one.`);
      }
      const spend = await reportSpend(a.token, usd);
      if (spend?.attributed) {
        console.log(`[agent] ${a.label}: ${spend.job} now $${spend.spent.toFixed(2)} of $${spend.budget.toFixed(2)}`);
        if (spend.over) {
          console.warn(`[agent] ${a.label}: ${spend.job} is at its cap and has been held. It will not be worked again until a human raises it.`);
        }
      }
    }
    if (ONCE) process.exit(0);
    // A crashed pass must not become a hot loop against the API.
    await new Promise((r) => setTimeout(r, Math.max(30, INTERVAL) * 1000));
  } while (true);
}

main();
