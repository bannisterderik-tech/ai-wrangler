# The build agent

Claude Code, headless, in a container, pointed at the Wrangler MCP server.

This is deliberately **not** a second orchestration system. The floor already
decides what work exists, who owns it, what a session may touch and what needs a
human. This process only gives that floor a pair of hands.

## Why this and not Managed Agents

Managed Agents would host the loop and the sandbox for us. It was rejected:

- It is beta and gated, so it cannot be a dependency of the product shipping.
- It is Anthropic-only, which forecloses the model choice in `web/src/lib/ai.ts`.
- It would mean two orchestration systems — its own session and job model beside
  the one already built and tested here.
- Its sandbox is the only thing it really adds, and Railway already gives us a
  box, because the agency is deploying one anyway.

The trade is real: we operate the container. In exchange the walls, the audit
trail and the approval gate stay in one system, and the agent is the same Claude
Code the team already uses.

## An agent is per project

Not per teammate. A teammate is a person who brings their own Claude Code and
works across the customers you scope them to. An agent has no human, and it must
never be able to see a second customer — so its scope is a **column on its row**,
not a list somebody maintains. There is no toggle to forget, and the database
refuses an agent without a project.

Make one on **Sessions → + Agent for a project**, pick the customer, mint its
token. Need an agent on another project? Make another agent.

Everything else it can do is the tools you grant it there. Take away
`open_branch` and it can read, think and ask, and cannot write — not because the
brief says so, but because `/api/mcp` refuses the call. Revoke the session and
everything it was holding goes back on the board.

## One container, several agents

Isolation is per token, not per container. `WRANGLER_SESSION_TOKENS` takes a
comma-separated list: each pass runs as exactly one agent, in its own workspace,
and the server hands it exactly one customer. So you do not need a Railway
service per project — you need a token per project.

## Deploy on Railway

A second service in the same project, from the same repo.

| Setting | Value |
|---|---|
| Root Directory | `worker` |
| Builder | Dockerfile (automatic once the root directory is right) |
| Volume | mount at `/work` so a checkout survives between passes |

Variables:

| Variable | Where it comes from |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `WRANGLER_MCP_URL` | `https://<your-app>.up.railway.app/api/mcp` |
| `WRANGLER_SESSION_TOKENS` | One per project agent, comma separated. Sessions → the agent → Mint token. Shown once. |
| `POLL_SECONDS` | optional, default 120 |
| `RUN_ONCE` | optional, `1` to make one pass and exit — use this first |
| `AGENT_MODEL` | optional, default `claude-opus-5` |

Set `RUN_ONCE=1` for the first deploy. Read the log, see what it did on the
floor, then unset it.

## What it does on a pass

`list_jobs` → `claim_job` → `read_project` → work → `post_step` as it goes →
`request_approval` at anything irreversible, then stop.

Every step it posts shows up on **The floor** under that job, attributed to its
handle, while it is still working.

## Auth in the container

Claude Code picks up `ANTHROPIC_API_KEY` from the environment; the worker passes
its own env straight through, so setting it on the Railway service is enough.

If a pass ever logs `Not logged in · Please run /login`, the key did not reach
the process. Add `--bare` to the args in `run.mjs` — it forces auth to be
strictly `ANTHROPIC_API_KEY` and never reads a keychain or OAuth, which is what
you want in a container. It is not on by default only because it also skips
hooks, LSP and CLAUDE.md discovery, and none of that has been exercised here.

## What was verified, and what was not

Verified: the exact CLI invocation parses — `-p`, `--model`, `--permission-mode
acceptEdits`, `--mcp-config`, `--strict-mcp-config` and `--allowedTools` are all
real flags and accepted together. The MCP config is written at 0600. The worker
resolves each token against the floor and names the agent and its project. Every
MCP tool in the brief was exercised over the wire against a real server.

Not verified: a complete agent pass. It has never run with a key.
Deploy with `RUN_ONCE=1` and read the log before letting it poll.
