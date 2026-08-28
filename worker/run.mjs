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
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MCP_URL = need("WRANGLER_MCP_URL");
const TOKEN = need("WRANGLER_SESSION_TOKEN");
const WORKSPACE = process.env.WORKSPACE_DIR || "/work";
const INTERVAL = Number(process.env.POLL_SECONDS || 120);
const ONCE = process.env.RUN_ONCE === "1";
const MODEL = process.env.AGENT_MODEL || "claude-opus-5";

function need(key) {
  const v = process.env[key];
  if (!v) {
    console.error(
      `[agent] ${key} is not set.\n` +
        `        WRANGLER_MCP_URL is https://<your-app>/api/mcp\n` +
        `        WRANGLER_SESSION_TOKEN is minted on the Sessions screen — it is shown once.`,
    );
    process.exit(1);
  }
  return v;
}

/**
 * Claude Code reads .mcp.json from the working directory. Writing it here rather
 * than baking it into the image keeps the token out of the image layers.
 */
function writeMcpConfig() {
  mkdirSync(WORKSPACE, { recursive: true });
  writeFileSync(
    join(WORKSPACE, ".mcp.json"),
    JSON.stringify(
      {
        mcpServers: {
          wrangler: {
            type: "http",
            url: MCP_URL,
            headers: { Authorization: `Bearer ${TOKEN}` },
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
- Never write to main. open_branch, then ask.
- If a tool refuses you, that refusal is the answer. Do not try a different phrasing
  of the same thing.
- Spend is capped per job. When you are near the cap, post_step saying so and stop.`;

function runOnce() {
  return new Promise((resolve) => {
    const args = [
      "-p", BRIEF,
      "--model", MODEL,
      "--permission-mode", "acceptEdits",
      "--mcp-config", join(WORKSPACE, ".mcp.json"),
    ];
    const child = spawn("claude", args, {
      cwd: WORKSPACE,
      stdio: ["ignore", "inherit", "inherit"],
      env: process.env,
    });
    child.on("error", (e) => {
      console.error("[agent] could not start claude:", e.message);
      resolve(1);
    });
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

async function main() {
  writeMcpConfig();
  console.log(`[agent] floor: ${MCP_URL}`);
  console.log(`[agent] workspace: ${WORKSPACE}  model: ${MODEL}`);
  console.log(`[agent] mode: ${ONCE ? "one pass" : `every ${INTERVAL}s`}`);

  do {
    const started = Date.now();
    const code = await runOnce();
    console.log(`[agent] pass finished in ${Math.round((Date.now() - started) / 1000)}s (exit ${code})`);
    if (ONCE) process.exit(code);
    // A crashed pass must not become a hot loop against the API.
    await new Promise((r) => setTimeout(r, Math.max(30, INTERVAL) * 1000));
  } while (true);
}

main();
