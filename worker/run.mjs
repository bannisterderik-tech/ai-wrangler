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
import { hostname } from "node:os";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
const INTERVAL = (() => {
  const raw = process.env.POLL_SECONDS;
  if (raw === undefined || raw === "") return 600;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    // "120s" and "2m" both read as obviously correct and both parse to NaN.
    // Math.max(30, NaN) is NaN, setTimeout(NaN) fires in 1ms, and the worker
    // then starts a paid pass as fast as it can spawn one. Refuse to boot.
    console.error(`[agent] POLL_SECONDS="${raw}" is not a number of seconds. Use POLL_SECONDS=600.`);
    process.exit(1);
  }
  return n;
})();
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
3. checkout to get a URL you can clone and push with, then clone into this
   directory if it is empty. That URL holds a credential: never echo it, never
   put it in a step, never commit it.
4. read_project on it. That call is the truth about this customer: what is bound and
   therefore what you may touch, their house rules, what is on fire, how they are
   doing. Read it before you plan. Their house rules outrank your judgement.
5. next_work if the job is vague — the client's own requests and their live site's
   errors are there. open_work turns one into a job with its own budget.
6. Do the work. post_step as you go, one line per real step, so a human can watch
   without interrupting you.
7. Stop at the wall. request_approval for anything irreversible: a production
   merge, a first message to a real person, money moving. Then stop. Do not do it
   anyway, and do not ask twice.

Hard rules:
- Never guess a repository name. read_bound_repo is the only source. A name you
  guessed will be refused with a 403 and you will have wasted the turn.
- Never write to main. Commit AND PUSH your branch first, then open_branch, then
  ask. The floor asks GitHub whether that branch is really there and refuses if it
  is not, so an unpushed branch is a refusal, not a record. open_branch records what you tell it; it cannot see your working tree. A
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
  "mcp__wrangler__checkout",
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
const HELP = (() => {
  const r = spawnSync("claude", ["--help"], { encoding: "utf8", timeout: 20_000 });
  if (r.error) {
    console.error(`[agent] cannot run claude: ${r.error.message}`);
    process.exit(1);
  }
  return `${r.stdout || ""}${r.stderr || ""}`;
})();

const HOST = process.env.AGENT_HOST || hostname();

const VERSION = (() => {
  const r = spawnSync("claude", ["--version"], { encoding: "utf8", timeout: 20_000 });
  return `${r.stdout || ""}`.trim() || "version unknown";
})();

/** Continuing a session only helps if this build can do it. */
const CAN_RESUME = HELP.includes("--resume");

const BARE = (() => {
  if (!HELP.includes("--bare")) return false;
  // In bare mode Claude Code never reads OAuth credentials or the keychain; it
  // needs ANTHROPIC_API_KEY. Passing --bare without one turns every pass into an
  // auth failure — a hardening flag that switches the whole fleet off.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[agent] --bare is available but ANTHROPIC_API_KEY is not set; running without it.");
    console.warn("[agent] the checkout's own .claude/ hooks and CLAUDE.md WILL load. Set the key to close that.");
    return false;
  }
  return true;
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
    // 401 is not a hiccup. The token was revoked, and every MCP call this pass
    // would make is going to be refused — so the pass can only burn money to
    // discover that. Revocation must make an agent cheaper, not dearer.
    if (res.status === 401 || res.status === 403) return { fatal: true };
    if (!res.ok) return { unreachable: true, why: `floor returned ${res.status}` };
    return await res.json();
  } catch (e) {
    return { unreachable: true, why: e?.message || "network error" };
  }
}

/** Hard ceiling on one pass, so a stuck agent cannot bill for hours. */
const MAX_PASS_MS = Math.max(60, Number(process.env.MAX_PASS_SECONDS) || 1800) * 1000;

/**
 * Hard ceiling on this container, for the whole time it is up.
 *
 * The per-job cap is the floor's business and depends on spend being reported
 * and attributed correctly. This one does not depend on anything: the worker
 * adds up what the harness told it each pass cost, and when the total passes
 * this number it stops and stays stopped.
 *
 * It exists because the last version of this file idled on Opus every 120
 * seconds with no per-pass check and no skip — it ran a full session to be told
 * "nothing to do", 30 times an hour, and spent $20 doing nothing at all. A
 * ceiling that needs no other component to be working is the only kind that
 * would have caught it.
 */
const MAX_SPEND_USD = Number(process.env.MAX_SPEND_USD) || 25;
let spentThisBoot = 0;

/**
 * Passes on the same job continue one session instead of starting a new one.
 *
 * Two things were paying for this. Cost: every pass was a cold start, so Claude
 * Code's system prompt and the whole tool schema were billed at full input
 * price every time — prompt caching only helps inside a session, and there was
 * never a second turn in one. Quality: the agent could not remember what it had
 * already done, so it re-read the project, re-reviewed the same diff, and
 * rediscovered the same wall, four passes in a row, on real money.
 *
 * Resumed only while the job is the same. A different job gets a clean head.
 */
const RESUME_LIMIT = Math.max(1, Number(process.env.MAX_RESUMES) || 8);

function runOnce(dir, model, brief, resumeId, apiKey) {
  return new Promise((resolve) => {
    const args = [
      "-p", brief,
      ...(BARE ? ["--bare"] : []),
      ...(resumeId ? ["--resume", resumeId] : []),
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
      // NOT process.env. WRANGLER_SESSION_TOKENS holds every project's token,
      // and this child has arbitrary code execution. One agent's process has no
      // business holding another project's credentials.
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        LANG: process.env.LANG,
        // The customer's own key when they brought one, otherwise the agency's.
        // A pass that works for one customer should carry one customer's
        // billing, not the key that pays for everybody.
        ...(apiKey || process.env.ANTHROPIC_API_KEY
          ? { ANTHROPIC_API_KEY: apiKey || process.env.ANTHROPIC_API_KEY }
          : {}),
      },
    });

    let killed = false;
    const killer = setTimeout(() => {
      killed = true;
      console.error(`[agent] pass exceeded ${Math.round(MAX_PASS_MS / 1000)}s — killing it.`);
      child.kill("SIGKILL");
    }, MAX_PASS_MS);

    let out = "";
    child.stdout.on("data", (b) => {
      out += b;
    });
    child.on("error", (e) => {
      clearTimeout(killer);
      console.error("[agent] could not start claude:", e.message);
      resolve({ code: 1, usd: NaN });
    });
    child.on("exit", (code) => {
      clearTimeout(killer);
      let usd = NaN;
      let text = "";
      let sessionId = null;
      try {
        const r = JSON.parse(out);
        sessionId = typeof r.session_id === "string" ? r.session_id : null;
        // An absent field is unknown, not zero. `Number(undefined) || 0` quietly
        // recorded every such pass as free.
        usd = "total_cost_usd" in r ? Number(r.total_cost_usd) : NaN;
        if (!Number.isFinite(usd)) usd = NaN;
        text = String(r.result ?? "").trim();
      } catch {
        if (out.trim()) console.log(out.trim().slice(0, 4000));
      }
      if (text) console.log(text);
      resolve({ code: code ?? 0, usd, killed, sessionId });
    });
  });
}

/**
 * Maintenance the floor has queued for this agent.
 *
 * A fixed set of verbs. The only one that takes an argument is `update`, and
 * that argument is matched against a semver pattern before it goes anywhere
 * near a command line — a version string taken on trust is a shell injection
 * with extra steps, and this runs on a client's box.
 */
const SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+$/;

async function takeCommands(a) {
  let list = [];
  try {
    const res = await fetch(new URL("/api/agent/commands", MCP_URL), {
      headers: { Authorization: `Bearer ${a.token}` },
    });
    if (!res.ok) return;
    list = (await res.json()).commands ?? [];
  } catch {
    return;
  }

  for (const c of list) {
    let ok = true;
    let result = "";
    try {
      switch (c.command) {
        case "pause":
          a.paused = true;
          result = "paused; still running, not taking work";
          break;
        case "resume":
          a.paused = false;
          a.dead = false;
          result = "taking work again";
          break;
        case "run_now":
          a.runNow = true;
          result = "will do a pass without waiting for the next cycle";
          break;
        case "reload":
          // Settings already come from the floor on every cycle, so this is a
          // no-op by design rather than by omission. Saying so beats pretending.
          result = "nothing to reload: the model, the job and the cap are read fresh every cycle";
          break;
        case "diagnose":
          result =
            `claude ${VERSION} on ${HOST} · up ${Math.round(process.uptime())}s · ` +
            `bare=${BARE} resume=${CAN_RESUME} · $${spentThisBoot.toFixed(2)} of $${MAX_SPEND_USD.toFixed(2)} · ` +
            `poll ${INTERVAL}s · pass ceiling ${Math.round(MAX_PASS_MS / 1000)}s`;
          break;
        case "update": {
          const want = String(c.args || "").trim();
          if (want && !SEMVER.test(want)) throw new Error(`"${want}" is not a version number`);
          const target = want ? `@anthropic-ai/claude-code@${want}` : "@anthropic-ai/claude-code@latest";
          const r = spawnSync("npm", ["install", "-g", target], { encoding: "utf8", timeout: 300_000 });
          if (r.status !== 0) throw new Error((r.stderr || "npm failed").slice(0, 300));
          const v = spawnSync("claude", ["--version"], { encoding: "utf8", timeout: 20_000 });
          result = `updated to ${(v.stdout || "").trim() || target}; restarting`;
          await reportCommand(a, c.id, true, result);
          console.log(`[agent] ${a.label}: ${result}`);
          process.exit(0);
          break;
        }
        case "restart":
          result = "restarting";
          await reportCommand(a, c.id, true, result);
          console.log(`[agent] ${a.label}: told to restart`);
          // The supervisor brings it back. Exiting is the whole mechanism, and
          // it is why the worker must run under systemd, pm2 or a container
          // that restarts.
          process.exit(0);
          break;
        default:
          ok = false;
          result = `unknown command ${c.command}`;
      }
    } catch (e) {
      ok = false;
      result = e?.message ?? String(e);
    }
    console.log(`[agent] ${a.label}: ${c.command} — ${result}`);
    await reportCommand(a, c.id, ok, result);
  }
}

async function reportCommand(a, id, ok, result) {
  try {
    await fetch(new URL("/api/agent/commands", MCP_URL), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${a.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id, ok, result }),
    });
  } catch {
    /* the floor will see it did not come back */
  }
}

/**
 * Say what this worker is doing, so the OS knows without asking a provider.
 *
 * Outbound on purpose: it works from a Hostinger VPS, a Railway container or a
 * box under a desk, with no inbound port, no provider API token and no firewall
 * hole. And it reports what "working" means rather than what "powered on"
 * means — a provider's uptime graph was green for the whole of the $20
 * incident, while the agent did nothing thirty times an hour.
 */
async function heartbeat(token, body) {
  try {
    await fetch(new URL("/api/agent/heartbeat", MCP_URL), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        host: HOST,
        cliVersion: VERSION,
        uptimeS: Math.round(process.uptime()),
        bare: BARE,
        resuming: CAN_RESUME,
        spentUsd: spentThisBoot,
        ceilingUsd: MAX_SPEND_USD,
        ...body,
      }),
    });
  } catch {
    // A missed heartbeat is not worth failing a pass over. The floor treats
    // silence as its own state anyway, which is the point.
  }
}

/**
 * Tell the floor what the pass cost. The floor decides whether that puts the
 * job over its cap and holds it if so — the container does not get a vote.
 */
async function reportSpend(token, usd, jobId) {
  if (!Number.isFinite(usd) || usd <= 0) return { failed: true, why: "cost unknown" };
  try {
    const res = await fetch(new URL("/api/agent/spend", MCP_URL), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      // The job is named, not inferred. Attributing to "whatever this session
      // most recently claimed" let open_work redirect the bill onto a fresh
      // $0 job, and lost the cost entirely once a job was finished or released.
      body: JSON.stringify({ usd, jobId: jobId ?? null }),
    });
    if (!res.ok) return { failed: true, why: `floor returned ${res.status}` };
    return await res.json();
  } catch (e) {
    return { failed: true, why: e?.message || "network error" };
  }
}

/** Ask the floor who this token is, so the log names the agent and its project. */
async function whoAmI(token) {
  try {
    const res = await fetch(MCP_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { label: `token ending ${token.slice(-6)}`, ok: false, scope: [] };
    const info = await res.json();
    const scope = info.scope || [];
    return {
      label: `${info.session?.handle ?? "agent"} → ${scope.join(", ") || "no project"}`,
      ok: true,
      scope,
    };
  } catch {
    return { label: `token ending ${token.slice(-6)}`, ok: false, scope: [] };
  }
}

/**
 * Prove the model key works before starting anything that costs money.
 *
 * A bad or expired ANTHROPIC_API_KEY does not fail fast. Verified against the
 * real CLI: it retried silently for over two minutes with zero bytes on stdout
 * and stderr before being killed. Without this check that becomes one full
 * MAX_PASS_SECONDS of nothing, per pass, per agent, while the log says only
 * that a pass took a long time.
 *
 * Listing models is free and is the same question the OS asks on its own
 * self-test screen.
 */
async function keyWorks() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: true, why: "no key in the environment; Claude Code will use whatever it is configured with" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    });
    if (res.ok) return { ok: true, why: "model key accepted" };
    const body = await res.json().catch(() => ({}));
    return { ok: false, why: body?.error?.message || `Anthropic returned ${res.status}` };
  } catch (e) {
    // A network problem is not a bad key. Say which it is rather than refusing
    // to boot over a blip.
    return { ok: true, why: `could not reach Anthropic to check the key (${e?.message ?? e}) — starting anyway` };
  }
}

async function main() {
  console.log(`[agent] floor: ${MCP_URL}`);
  console.log(`[agent] ${TOKENS.length} agent${TOKENS.length === 1 ? "" : "s"}  model: ${MODEL}`);
  console.log(`[agent] mode: ${ONCE ? "one pass each" : `every ${INTERVAL}s`}`);
  console.log(`[agent] ceiling: $${MAX_SPEND_USD.toFixed(2)} for this container, ${Math.round(MAX_PASS_MS / 1000)}s per pass`);
  // Say which build is running. When something changes behaviour between one
  // week and the next, this is the line that says whether the software moved.
  console.log(`[agent] claude ${VERSION}`);
  console.log(
    CAN_RESUME
      ? `[agent] passes on the same job continue one session (up to ${RESUME_LIMIT}), so the fixed prompt is cached rather than rebought`
      : "[agent] this Claude Code has no --resume: every pass pays a cold start. Update the image.",
  );
  console.log(
    BARE
      ? "[agent] bare mode: the checkout's own hooks, skills and CLAUDE.md are not loaded"
      : "[agent] this Claude Code has no --bare: a checkout's .claude/ hooks and CLAUDE.md WILL load. Update the image.",
  );

  const key = await keyWorks();
  console.log(`[agent] ${key.why}`);
  if (!key.ok) {
    console.error("[agent] refusing to start: every pass would hang on authentication and bill for the wait.");
    process.exit(1);
  }

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
    // A workspace each, keyed on WHO rather than WHERE.
    //
    // This used to be `agent-${i + 1}` — the token's position in the
    // comma-separated list — while /work is a persistent Railway volume.
    // Deleting a token from the middle of that variable shifted every later
    // agent down one slot, and the next customer's agent booted into the
    // previous customer's checkout: their repository, their git history, their
    // remotes. A text edit in the Railway dashboard silently broke the one
    // guarantee this product sells. Keyed on the token's digest, a workspace
    // belongs to a session and cannot be inherited.
    const dir = join(WORKSPACE, `agent-${createHash("sha256").update(token).digest("hex").slice(0, 16)}`);
    mkdirSync(dir, { recursive: true });

    // Belt and braces: if this directory ever held a different customer, it is
    // wiped rather than reused. A stale checkout is not worth a leak.
    const marker = join(dir, ".wrangler-customer");
    const mine = (who.scope || []).join(",");
    let previous = null;
    try {
      previous = readFileSync(marker, "utf8").trim();
    } catch {
      /* first run for this session */
    }
    if (previous && previous !== mine) {
      console.warn(`[agent] ${who.label}: workspace held "${previous}" and is now "${mine}" — wiping it.`);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(marker, mine, { mode: 0o600 });

    writeMcpConfig(dir, token);
    agents.push({ dir, label: who.label, token, jobId: null, sessionId: null, resumes: 0, passes: 0, paused: false, runNow: false });
    console.log(`[agent] ${i + 1}. ${who.label}  workspace ${dir}`);
  }

  if (!agents.length) {
    console.error("[agent] no token on this worker is recognised by the floor. Nothing to run.");
    process.exit(1);
  }

  do {
    for (const a of agents) {
      if (a.dead) continue;
      const started = Date.now();
      console.log(`[agent] --- ${a.label} ---`);

      // Maintenance first: a restart or an update should not wait behind a pass.
      await takeCommands(a);
      if (a.dead) continue;
      if (a.paused) {
        await heartbeat(a.token, { state: "stopped", detail: "paused from the OS" });
        continue;
      }

      await heartbeat(a.token, { state: "ok", passes: a.passes || 0, detail: "checking for work" });

      const next = await nextBrain(a.token);
      if (next?.stop) {
        // The floor pulled the switch. Obeyed here rather than by deleting a
        // service, so stopping does not mean opening a dashboard.
        console.error(`[agent] ${a.label}: the floor says stop — ${next.reason ?? "paused by an operator"}.`);
        await heartbeat(a.token, { state: "stopped", detail: next.reason ?? "paused by an operator" });
        a.dead = true;
        continue;
      }
      if (next?.fatal) {
        console.error(`[agent] ${a.label}: the floor refused this token. Not running it again.`);
        a.dead = true;
        continue;
      }
      if (next?.unreachable) {
        // Fail closed. A pass is only safe to start when the floor confirmed
        // there is work AND is available to receive the bill.
        a.misses = (a.misses || 0) + 1;
        console.warn(`[agent] ${a.label}: ${next.why} — skipping (${a.misses} in a row).`);
        continue;
      }
      a.misses = 0;
      if (!next?.job) {
        console.log(`[agent] ${a.label}: ${next?.reason ?? "nothing to do"}. Skipping this pass.`);
        await heartbeat(a.token, { state: "idle", detail: next?.reason ?? "nothing on the board" });
        continue;
      }
      const model = next.model || MODEL;
      console.log(
        `[agent] ${a.label}: ${next.job.id} "${next.job.title}" — ${next.brain} (${model}), ` +
          `$${Number(next.remaining).toFixed(2)} left on its cap, billed to ${next.billedTo ?? "agency"}`,
      );

      // A new job means a clean head. Carrying one job's reasoning into another
      // is worse than paying for a cold start.
      if (a.jobId !== next.job.id) {
        a.jobId = next.job.id;
        a.sessionId = null;
        a.resumes = 0;
      }
      // Context grows every turn, so a session that never ends stops being a
      // saving. Start fresh periodically and let the floor re-establish state.
      const resumeId = CAN_RESUME && a.resumes < RESUME_LIMIT ? a.sessionId : null;
      if (!resumeId && a.sessionId) console.log(`[agent] ${a.label}: starting a fresh session (resume limit).`);

      // The model is started at this job's tier, so it has to be told which job
      // that is. list_jobs may well show a different one first, and a Haiku
      // session attempting an Opus rebuild burns the pass and produces a mess.
      const brief = resumeId
        ? `You are continuing ${next.job.id} — "${next.job.title}" — in this same session.\n\n` +
          `You already know what you did last pass. Do NOT re-read the project or re-review work you have ` +
          `already reviewed; pick up where you stopped. If you were waiting on a human, call read_decision ` +
          `first and act on the answer. If nothing has changed and you are still blocked, say so in one ` +
          `post_step and stop — do not spend the budget confirming a wall you already found.`
        : `${BRIEF}\n\nThis session was sized for ${next.job.id} — "${next.job.title}".` +
          `\nClaim that job and no other. If it is already taken, say so and stop:` +
          ` a different job may need a different model than the one you are running.`;

      const { code, usd, killed, sessionId } = await runOnce(a.dir, model, brief, resumeId, next.apiKey);
      if (code !== 0 && resumeId) {
        // Most likely the session is gone: the container restarted, or the file
        // was cleaned up. Drop it so the next pass starts clean instead of
        // failing the same way forever.
        console.warn(`[agent] ${a.label}: resumed pass exited ${code} — dropping that session and starting fresh next time.`);
        a.sessionId = null;
        a.resumes = 0;
      } else if (sessionId) {
        a.sessionId = sessionId;
        a.resumes = resumeId ? (a.resumes || 0) + 1 : 1;
      }
      const secs = Math.round((Date.now() - started) / 1000);
      const cost = Number.isFinite(usd) ? `$${usd.toFixed(2)}` : "cost unknown";
      console.log(
        `[agent] ${a.label}: ${secs}s  ${cost}  (exit ${code})  ` +
          `${resumeId ? `resumed (${a.resumes}/${RESUME_LIMIT})` : "fresh session"}  ` +
          `— $${spentThisBoot.toFixed(2)} of $${MAX_SPEND_USD.toFixed(2)} this boot`,
      );
      if (!Number.isFinite(usd)) {
        console.warn(`[agent] ${a.label}: could not read the pass cost — the cap cannot see this one.`);
      }
      if (Number.isFinite(usd)) spentThisBoot += usd;
      const spend = await reportSpend(a.token, usd, next.job.id);
      a.passes = (a.passes || 0) + 1;
      if (spend?.attributed) {
        a.unbilled = 0;
        console.log(`[agent] ${a.label}: ${spend.job} now $${spend.spent.toFixed(2)} of $${spend.budget.toFixed(2)}`);
        if (spend.over) {
          console.warn(`[agent] ${a.label}: ${spend.job} is at its cap and has been held until someone raises it.`);
        }
      } else {
        // A worker that cannot record what it spent must not keep spending.
        a.unbilled = (a.unbilled || 0) + 1;
        console.error(
          `[agent] ${a.label}: SPEND NOT RECORDED (${spend?.why ?? spend?.reason ?? "no job matched"}) ` +
            `— ${a.unbilled} pass(es) unbilled.`,
        );
        if (a.unbilled >= 2) {
          console.error(`[agent] ${a.label}: stopping this agent. Two passes in a row went unbilled; the cap is blind.`);
          a.dead = true;
        }
        await heartbeat(a.token, {
          state: "unbilled",
          passes: a.passes || 0,
          lastPassAt: new Date().toISOString(),
          detail: `spend not recorded: ${spend?.why ?? spend?.reason ?? "no job matched"}`,
        });
      }
      if (killed) console.error(`[agent] ${a.label}: that pass was killed on the time limit.`);
      if (spend?.attributed) {
        await heartbeat(a.token, {
          state: killed ? "stuck" : "ok",
          passes: (a.passes || 0) + 1,
          lastPassAt: new Date().toISOString(),
          lastCostUsd: Number.isFinite(usd) ? usd : undefined,
          detail: killed
            ? `killed on the ${Math.round(MAX_PASS_MS / 1000)}s limit`
            : `${next.job.id} · ${next.brain} · $${spend.spent.toFixed(2)} of $${spend.budget.toFixed(2)}`,
        });
      }
    }
    if (ONCE) process.exit(0);
    if (spentThisBoot >= MAX_SPEND_USD) {
      console.error(
        `[agent] STOPPING: this worker has spent $${spentThisBoot.toFixed(2)} of its $${MAX_SPEND_USD.toFixed(2)} ` +
          `ceiling. Raise MAX_SPEND_USD if that was the intention.`,
      );
      process.exit(1);
    }
    if (agents.every((a) => a.dead)) {
      console.error("[agent] every agent is stopped. Nothing left to run.");
      process.exit(1);
    }
    // A crashed pass must not become a hot loop against the API.
    // run_now shortens the wait rather than skipping it, so a stuck queue
    // cannot turn into a hot loop.
    const wait = agents.some((a) => a.runNow) ? 5 : Math.max(30, INTERVAL);
    for (const a of agents) a.runNow = false;
    await new Promise((r) => setTimeout(r, wait * 1000));
  } while (true);
}

main();
