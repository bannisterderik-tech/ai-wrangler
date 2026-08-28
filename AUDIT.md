# AI Wrangler OS — state of the system, and what's left

Written for adversarial review. Every claim below is either verified in the
code (file:line given) or explicitly flagged as unverified. Attack the
unverified ones first — they are where I am most likely wrong.

**Verified by:** reading the source, 98 passing tests, a production build, and
driving the running app in a browser.
**Not verified by:** any live production run. I have no access to the
production database, to Railway, or to a `claude` binary. Everything about the
worker is verified by syntax check and official docs, not by watching it work.

---

## The headline: the agent cannot deliver work, and never could

Four approvals were granted on the Dudley's booking-page job. Nothing reached
the live site. That is not a mistake by the agent — it is three missing pieces
that together make the pipeline a dead end.

### 1. The worker has no GitHub credential

`web/src/lib/railway.ts:240` sets exactly three variables on the worker
service: `ANTHROPIC_API_KEY`, `WRANGLER_MCP_URL`, `WRANGLER_SESSION_TOKENS`.
There is no GitHub token anywhere in `worker/`.

Consequences:
- It can clone a **public** repo (which is why Dudley's worked at all — it is a
  GitHub Pages site).
- It can **never** clone a private one.
- It can **never push**. Push always needs auth.

So `2689e70` exists only inside the Railway volume at `/work`. It is not on
GitHub. Derik cannot see it, cannot review it, cannot merge it.

### 2. `open_branch` never touches GitHub

`web/src/lib/mcp-tools.ts:430`. It validates the binding, then writes rows. No
`fetch`, no `api.github.com`. The branch shown in the OS is a **claim by the
agent**, not an observed fact about a repository.

This compounds #1: the OS displays a branch that does not exist anywhere a
human can reach.

### 3. Approval is a dead end in both directions

- `web/src/app/api/approvals/[id]/route.ts` — approving flips a status and
  appends `"You: yes, do it."` to a transcript. **Nothing executes.**
- There is no MCP tool that lets an agent read an approval decision. The ten
  tools are list_jobs, claim_job, release_job, read_bound_repo, read_project,
  next_work, open_work, open_branch, post_step, request_approval. The agent
  literally cannot learn it was approved, so it re-derives from scratch.

**Net effect:** ask → wall → approve → re-derive → same wall. Forever.

### The fix is tractable

`web/src/lib/github.ts` already has a stored agency token (`token()`) and a
working API layer (`listAgencyRepos`, `createAgencyRepo`). The right shape is
**the floor does the write, not the agent**: `open_branch` uses the agency
token to create the branch and commit via the GitHub API, so the agent never
holds a credential and the wall stays in the server. That matches the
architecture already in HANDOFF.md.

---

## What I shipped that is unproven

I want these attacked specifically, because they are recent and confident.

### 4. Prompt caching is dead code

`ask()` in `web/src/lib/ai.ts` has **zero call sites**. Nothing in the
application calls the model layer at all. The caching I added last session —
`cache?: boolean`, the ephemeral breakpoint, the 1.25×/0.1× pricing — is
correct as written and **currently unreachable**.

I delivered a feature into a layer nothing uses and did not say so at the time.
That was the wrong call.

### 5. The worker has never completed a real pass

`node` in the allowlist, `--bare`, `--output-format json`, spend reporting,
per-job model selection — none of it has run. Specific risks:

- If Claude Code exits before emitting JSON, cost parses as `NaN` and reports
  as *unknown*. It logs a warning rather than silently reporting zero, but the
  cap sees nothing for that pass.
- Switching stdout from `inherit` to `pipe` means container logs now only show
  the final `result` string. If a pass hangs, there is less to look at.
- `--bare` is feature-detected off `claude --help`, which spawns a process on
  every worker boot with a 20s timeout.

### 6. `/api/agent/next` is advisory and can be wrong

It tells the worker which job it would take, and the worker starts Claude Code
with that job's model. But the agent then claims through MCP independently and
may get a **different** job — another session can win the race. So a Haiku-sized
session can end up working an Opus-tier job.

Cost of being wrong is one pass at the wrong tier, not a wall. But it is a real
hole in "select a model per job", and I should not have described that feature
without this caveat.

### 7. Spend attribution can land on the wrong job

`/api/agent/spend` attributes a pass's cost to the most recently claimed job
that session holds. A pass that touches two jobs bills all of it to one. The
cap is now real — it was `0` forever before — but it is not accounting.

### 8. Recall's ranking is currently doing nothing

`withFallback` in `web/src/lib/recall.ts` returns everything when the corpus is
below the limit. That is deliberate — it stops a safety rule being ranked away —
but it means at today's data volumes recall is equivalent to "list all
memories". The value only appears once a customer has more than ~14 notes. It
is groundwork, not a live improvement.

---

## Product gaps against what was actually asked for

### 9. The client CRM is one page

The ask was: clients manage "their leads, call, sms, manage their ai agents".
What exists: `web/src/app/client/page.tsx` and **one** route,
`api/client/leads/route.ts`. No calls, no SMS, no agent management for clients.

### 10. Twilio still sends from one shared number

`web/src/lib/twilio.ts:7` — a single `TWILIO_CALLER_ID`. Every customer's
outbound message goes from the same number. For a product whose entire premise
is per-customer isolation, this is the loudest remaining contradiction. The UI
now says so out loud on Dialer and Inbox, which is honest but not a fix.

### 11. Ads are a shell

Zernio returns `{ads: []}` without a key. The screen reads our own
`ad_campaigns` table, which nothing populates from a real ad platform.

---

## Hygiene

- `prototype/server/` — 7 dead `.mjs` files (config, crypto-vault, index,
  isolation, oauth, store, vercel). Superseded by `web/`.
- 4 of 51 API routes use `withCustomer()`. Most of the rest are operator routes
  where seeing everything is the design, so the raw number is not itself a bug —
  but nobody has audited which is which, and that audit has never been written
  down.
- Test coverage: 98 tests, strong on isolation/MCP/caps, nothing on the client
  desk beyond leads.

---

## Proposed order

**P0 — make the pipeline actually deliver.** Nothing else matters until an
approved job reaches a repo a human can see.
1. `open_branch` pushes via the agency GitHub token (server-side write).
2. An MCP tool for the agent to read approval decisions.
3. Approving executes: merge/PR through the GitHub API.

**P1 — prove what is already built.** One `RUN_ONCE=1` worker deploy, log
captured, confirming node/`--bare`/model selection/spend reporting all work.
Everything in P0 depends on the worker actually running.

**P2 — close the isolation contradiction.** Per-customer Twilio numbers.

**P3 — the client CRM.** Calls, SMS, agent visibility for clients.

**P4 — hygiene.** Delete `prototype/server/`. Write down the RLS audit.

**Not now:** semantic embeddings (deliberately deferred — lexical works and
costs nothing), the marketing page, playbooks, billing.

---

## Where to attack this

The three I am least sure of:

1. **Is the floor-does-the-write design right for `open_branch`?** The
   alternative is giving the worker a scoped GitHub token. I prefer keeping the
   credential out of the container, but that means the OS reconstructs a commit
   from a diff the agent reports, and the agent's working tree becomes the
   source of truth for something the server writes. That may be worse.
2. **Is the per-job model selection worth it given #6?** If the race makes tier
   selection unreliable, a simpler design — one worker per tier, jobs routed to
   the right worker — might be more honest.
3. **Is deferring the client CRM right?** It was an explicit ask, and I have
   put it at P3 behind infrastructure. That may be me preferring the problems I
   find interesting.
