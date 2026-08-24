# AI Wrangler — Plan to build the operating system

Date: 2026-08-24
Status: research complete, ready to execute

This is not another coding agent. Agents already exist and they are converging. This is the **control plane an agency uses to run agents across hundreds of client production systems without ever mixing them.**

---

## 1. What the market actually is (August 2026)

Three layers. Almost nobody owns all three for *client work*.

### Layer A — Coding agents (write code)

| Product | Shape | Superpower | Blind spot |
|---|---|---|---|
| Claude Code | CLI + subagents + MCP | Deepest harness, dynamic workflows, local or cloud | One session, one machine, not a company OS |
| Cursor | IDE + cloud VMs | Best in-editor, background agents, video replay | Developer tool, not multi-client isolation |
| Codex | CLI + cloud | Async PR throughput | OpenAI garden |
| Devin / Devin Desktop | Slack → PR | Hands-off ticket | Uneven on vague work; one org |
| Factory Droids | Enterprise factory | Compliance, missions | Sold to engineering orgs |
| Copilot coding agent | Issue → PR | GitHub-native | GitHub-only governance |
| Jules / OpenHands / Cline | Cloud / OSS | Cheap or self-host | Not an agency product |

Consensus in 2026: **stack them, don’t pick one.** Cursor for driving, Claude Code for deep work, Codex/Devin for async tickets.

### Layer B — Software factories (fleet of agents)

| Product | What it is | Missing for an agency |
|---|---|---|
| Warp Factories (EA, Aug 18 2026) | Foreman + triage/spec/implement/review. Harness-agnostic (Warp, Claude Code, Codex). Factory-as-code. | Built for *one engineering org*, not 100 client brands with separate GitHub/Vercel/billing |
| Factory 2.0 | Droids across the SDLC, Agent Effectiveness ROI | Same: internal eng, not client tenancy |
| GitHub Copilot Business | Repo + governance | No client portal, no spend-by-client, no Vercel |

Closest idea: Warp’s “foreman routes work items through specialist agents.” Steal the pattern. Do not become Warp.

### Layer C — Agency OS / PM (run the firm)

ClickUp, Teamwork, HyperScale, Agiled, HubSpot, Productive.

AI is bolted onto CRM/PM. **None of them can checkout a repo, open a PR, preview-deploy, or isolate a Vercel token.** They manage people. They do not drive production.

### Closest cousins (study, don’t copy)

- **General Intelligence / Cofounder** — founders get a GitHub repo + managed Vercel via *Vercel for Platforms*. 100 parallel previews. Agents need 100% of infra via API. **For one-person companies, not agencies serving brands.**
- **Fivos Aresti “Company OS in git”** — company wiki + per-client repos + 26 agents/79 skills. Operationally closest. **A convention, not a product.**
- **Automaton Agency stack** — Supabase RLS + Next.js + Claude Code + MCP. Correct ingredients, custom per firm.
- **Vercel Platform Template** — sandbox + AI Gateway + claim-deployment. The *builder* pattern. Use for *client apps*, not for Wrangler itself.
- **Vercel for Platforms** — two modes: multi-tenant (one codebase) vs **multi-project** (one Vercel project per customer). We are multi-project. Always.

### The hole

Nobody ships:

> An agency signs a client. That client’s GitHub, Vercel, and database are walled. A Head Wrangler breaks work into sub-agents. Previews go out freely. Production waits for a human. The client sees *their* work only. Cost is by client. Playbooks rerun. Inbox becomes tasks. Nothing from Harbor ever touches Brightline.

That is AI Wrangler.

---

## 2. Product thesis

**AI Wrangler is the factory an agency is.**  
Claude Code / Cursor / Codex are the workers. Wrangler is the floor, the badge reader, the job board, and the client lobby.

Keep the NeXT aesthetic. The prototype already *looks* like an OS. Most competitors look like Linear clones. Do not sand that off.

### Non-goals (on purpose)

- Do not replace Claude Code, Cursor, or GitHub.
- Do not be a general chatbot.
- Do not host all client apps on one shared Vercel project.
- Do not let a shared “agency token” see every client.

### Goals

1. **Hard isolation** as a product feature, not a setting.
2. **Harness-agnostic** control plane; Claude Code is the default Head Wrangler because it is the deepest coding harness in 2026.
3. **Human in the loop** for anything a customer could see or that cannot be undone.
4. **Client portal** that is the same OS, filtered.
5. **Eat our own dogfood** — Derik’s agency is tenant zero.

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  OS UI  (NeXT shell — briefing, live work, org, approvals)  │
│  Agency view  ·  Client view  ·  Phone approvals            │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐     ┌────────────────────────────┐
│ Control plane (Wrangler) │     │ Tenant vault (encrypted)   │
│ jobs · gates · playbooks │     │ GH install · Vercel token  │
│ memory · cost · audit    │     │ Supabase · bound projectIDs│
└────────────┬─────────────┘     └────────────┬───────────────┘
             │                                │
             ▼                                ▼
┌──────────────────────────┐     ┌────────────────────────────┐
│ Head Wrangler            │     │ Per-customer runtime       │
│ Claude Agent SDK (def.)  │     │ sandbox / worktree         │
│ optional: Codex, Grok    │     │ GitHub App installation    │
│ MCP tools: create_task,  │     │ Vercel team+project allow  │
│ deploy, query_costs…     │     │ NEVER cross-tenant MCP     │
└──────────────────────────┘     └────────────────────────────┘
```

### Isolation contract (non-negotiable)

Every job carries `customerId`. Every API call loads **that** customer’s vault row. Tokens never leave the server. `projectId` / `repo` from the UI is checked against the allowlist. Mismatch = 403 + audit.

Directory layout on disk (and in sandboxes):

```
workspaces/{customerId}/{repoId}/
```

No shared checkout. No shared `.env`. No shared MCP config.

### Dual Vercel mode

| Mode | When | How |
|---|---|---|
| **Bring-your-own** (already started) | Client has a Vercel team | Integration OAuth or project-scoped token → bind projects |
| **We-host-then-claim** | New client, we scaffold | Vercel for Platforms *multi-project*: we create `prj_*`, they later [claim](https://vercel.com/docs/platforms/platform-elements/blocks/claim-deployment) |

Never mix the two on one customer.

### GitHub

GitHub App, not PATs. Client installs on **their org**. Store `installation_id`. Mint a fresh installation token per job. Recommended by Vercel for sandboxing private repos.

### Runtime for agents

- Short jobs: Vercel Sandbox (Firecracker, preview-friendly, GitHub App token in).
- Long jobs / resume: E2B (24h sessions) or a self-hosted runner later.
- Local dogfood: worktree on the operator’s machine via Claude Code MCP (what the prototype already pretends).

### Models

- **Coding / Head Wrangler:** Claude Agent SDK (the prototype’s “claude-code via MCP”).
- **Briefing, sales copy, proposals, client reports:** SpaceXAI (`api.x.ai`, `grok-4.5`) — cheap, good prose, not the coding harness.
- **Routing:** small brain / medium / big brain as in the prototype, mapped to real model tiers and hard $ caps per run.

### Data

Postgres (Supabase) with **RLS by `customer_id`**. Vault secrets encrypted (AES-GCM, already in `server/crypto-vault.mjs`). Audit log append-only.

Do not keep the JSON file vault past the prototype.

---

## 4. What we already have

| Piece | Status |
|---|---|
| NeXT OS UI (full sim) | Done — briefing, live work, org chart, approvals, inbox, customers, sales, billing, marketing, playbooks, team, spend |
| Vercel connect + encrypted vault | Done — `/connect.html`, isolation 403 proven |
| Real GitHub | Not started |
| Real agent runs | Simulated clock |
| Real Postgres | Not started |
| Production UI (not dc.html) | Not started |

The dc.html is the **visual source of truth**. Port it. Do not redesign.

---

## 5. Phased build

Each phase ships something you can click. No big-bang rewrite that goes dark for a month.

### Phase 0 — Keep the lights on (done)

Prototype OS + Vercel vault + isolation.

### Phase 1 — Real shell (1 week)

Port the OS into Next.js App Router. Same pixels. Same nav. Same copy.

- `app/(os)/*` screens as React, CSS variables copied from the prototype
- API routes absorb `server/*.mjs`
- Postgres + RLS (`customers`, `connections`, `jobs`, `approvals`, `audit`)
- Session auth for agency operators
- `/connect` stays, now a first-class OS page

Exit: you can click every screen; Vercel connect still works; sim data is still the default until a customer is connected.

### Phase 2 — GitHub App (1 week)

- GitHub App “AI Wrangler”
- Per-customer installation
- List repos, bind repos (same allowlist pattern as Vercel projects)
- Open branch `agent/{slug}` on a **safe copy**
- Open PR, never push to `main` from an agent
- Worktree / sandbox checkout `workspaces/{customerId}/{repo}`

Exit: “Give the AI a task” creates a real branch on the bound repo (agent can be a stub that commits a README). Isolation test: Harbor token cannot list Brightline repos.

### Phase 3 — Head Wrangler (2 weeks)

- Claude Agent SDK as default harness
- Wrangler MCP tools: `create_task`, `read_runs`, `deploy_preview`, `request_approval`, `query_costs`, `read_memory`
- Job runner: queue → sandbox → transcript stream into Live Work
- Spine visualization driven by real tool-call segments (think / tool / gate / you)
- Spend + cache % from actual token usage
- Grok writes the morning briefing from the job log

Exit: a real task on a bound repo streams into Live Work and opens a PR.

### Phase 4 — Gates that bite (1 week)

Wire Approvals to reality:

| Gate | Blocks |
|---|---|
| Preview deploy | nothing (policy: Balanced) |
| Open PR | nothing |
| Merge to main | human |
| Production deploy | human, two-click if irreversible |
| Supabase migration | human |
| Spend > run budget | human |

Phone view stays. Approvals are the product.

Exit: you cannot production-deploy from an agent without clicking Yes.

### Phase 5 — Client portal + memory (1 week)

- Org switcher already in the prototype becomes real RLS
- Client sees timeline, progress, previews — never other clients, never tokens, never internal notes
- Memory store per customer (the “AI forgets instantly” delete)

### Phase 6 — Agency surface (2 weeks)

Promote the simulated modules, one by one, only where they create leverage:

1. Inbox → task (email/Slack ingest)
2. Playbooks (versioned recipes, run-for-customer)
3. Weekly report draft (Grok, from the work log)
4. Spend by customer / by brain
5. Sales board → New customer wizard (GitHub + Vercel + rules + budget)

Marketing/uptime can wait. Billing can wait until money is real.

### Phase 7 — Factory scale

- Parallel jobs capped per customer and globally
- Vercel Sandbox pool + E2B for long runs
- Factory-as-code: playbooks and house rules in git
- Optional second harness (Codex) for async chores
- Vercel for Platforms multi-project for clients who have no Vercel yet
- Self-hosted runners for HIPAA-ish clients (Atlas Labs in the demo)

---

## 6. Key decisions

1. **Control plane, not an agent.** Wrangler commands Claude Code / Codex. It is not a tenth coding agent.
2. **Claude Code default, Grok for ops language.** Matches 2026 reality and the SpaceXAI default for *new* LLM features that are not coding.
3. **Multi-project Vercel, never multi-tenant-one-app** for client sites. Client code is theirs.
4. **Our GitHub, their Vercel.** Code lives in the agency org. Each customer is bound to one (or more) of *our* repos. Deploy uses the customer’s Vercel token. Clients do not install a GitHub App. A GitHub App on *our* org is optional; a fine-grained PAT on the agency account is enough for v1.
5. **Keep the NeXT UI.** The moat is the OS feeling + isolation, not another dashboard.
6. **Tenant-zero is this agency.** If we won’t run our own clients on it, it is vapor.
7. **Postgres + RLS from Phase 1.** JSON vault is a prototype only.
8. **Production is two-click.** The prototype already got this right.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Sign-in-with-Vercel API scopes still in beta | Integration OAuth + project-scoped tokens (already built) |
| Claude Agent SDK cost on 100 parallel jobs | Caps per run, small-brain routing, cache, kill switch |
| Cross-tenant leak | Isolation tests in CI; every API path goes through `assertBoundProject` |
| dc.html port drift | Visual QA against the prototype; CSS variables copied verbatim |
| GitHub App review delay | PAT-per-org fallback (same pattern as Vercel tokens) |
| Trying to build HubSpot | Phase 6 is ruthless. Inbox, playbooks, reports. Stop. |

---

## 8. First 10 engineering days (execute next)

1. Next.js app, port tokens/CSS, shell + nav + theme
2. Postgres schema + RLS + migrate Vercel vault
3. `/connect` as a real page (OAuth + PAT + bind)
4. Live Work wired to job table (still simulated runner)
5. GitHub App install + bind repos
6. Isolation test suite (cross-tenant 403s)
7. Sandbox checkout
8. Claude Agent SDK on one dogfood repo
9. Transcript → Live Work stream
10. Preview deploy via existing Vercel client, production still gated

After day 10 you have a real OS that can connect a client and run one agent job without overlap.

---

## 9. Locked decisions (2026-08-24)

1. **Tenant-zero = this agency’s real clients.** No fake Brightline org as the source of truth. Demo customers can stay as UI fixtures; production isolation is real client GitHub/Vercel.
2. **Head Wrangler runs as Claude Code on our laptops via MCP.** Matches the prototype: *their* Claude Code, *their* session, instructs *their* customers. Cloud Agent SDK is Phase 7, not v1.
3. **This week = Phase 1.** Port the OS to Next.js + Postgres. Same pixels. Real RLS. Then GitHub.
4. **GitHub is ours.** Agency org (or personal account) holds private repos. Bind `owner/repo` → customer. Deploy with *their* Vercel credentials.

Still open (doesn’t block):

- GitHub org slug (`GITHUB_ORG`) vs personal account
- Vercel Integration display name
- Where Wrangler itself is hosted (Vercel vs local-first for v1)
