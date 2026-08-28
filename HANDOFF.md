# Handoff — AI Wrangler

Read this before changing or deploying anything.

## What this is

An **agency control plane**, not a coding agent.

- **Our GitHub** — one agency account. Bind `owner/repo` → customer. No overlap.
- **Their Vercel** — each customer's own token and their own bound project ids. Never one shared token.
- Isolation is the product: a job for customer A cannot see customer B's repo or Vercel project.

Every teammate connects **their own Claude Code** over MCP — their own token, their own
customer scope, their own audit trail. Nobody shares a login. Cloud agents are later.

## Deploy this, not that

| Deploy | Ignore |
|---|---|
| `web/` (Next.js 16 App Router, Postgres) | `prototype/` (design sim) |

Railway, root directory **`web`**, Dockerfile build, migrations at boot. Steps in
[DEPLOY.md](DEPLOY.md). Vercel still works for the OS, but the job runner cannot live there —
which is why the deploy target is a box, not a function.

## The four walls (do not weaken)

1. **The door.** `web/src/middleware.ts`. No operator session → no page, no API. Only `/api/health`,
   `/api/mcp` (which carries its own Bearer auth) and the login routes are public. With no login
   method configured the OS seals itself rather than falling open.
   Sign in is a **magic link**: `OPERATOR_EMAILS` (default `derik@aiwrangler.co`,
   `van@aiwrangler.co`) is the allowlist, links are single use, expire in 15 minutes, and only the
   SHA-256 is stored. Asking for a link returns a byte-identical response whether or not the
   address is an operator — the refusal is recorded in `audit`, not returned to the caller.
2. **The route.** A job may only name a repo or Vercel project bound to its own customer
   (`assertBoundToCustomer`). Someone else's → 403. Nothing bound yet → 409.
3. **The database.** RLS on every tenant table. Customer-scoped work runs through `withCustomer()`
   as the `wrangler_tenant` role with `app.customer_id` pinned for the transaction. The owner role
   (`DATABASE_URL`) is the agency view and sees everything, by design; Supabase's `anon` /
   `authenticated` roles see nothing.
4. **The index.** `bound_resources (provider, resource_id)` is unique — one repo, one customer,
   even under a race.
5. **The session.** `web/src/app/api/mcp/route.ts`. A teammate's Claude Code authenticates with a
   Bearer token whose SHA-256 is all we store. Every tool call checks two things before it does
   anything: the session was granted that tool, and the job belongs to a customer in that session's
   scope. Agents do not write to `main`; they open a branch and call `request_approval`.

`cd web && npm test` proves all five (24 tests: the door, the refusals, the RLS walls, the MCP
walls). Keep it green.

## Product rules (do not "improve" away)

- Keep the NeXT UI (CSS variables in `web/src/app/globals.css`). Do not restyle as Linear.
- Do not put all clients on one Vercel project. Do not share a Vercel token across customers.
- Production deploys stay approval-gated / two-click for anything irreversible.
- Do not build HubSpot. Inbox ingest, playbooks-as-code, client portal, billing are later.

## What's real now

- Postgres + Drizzle, migrations in `web/drizzle/*.sql`, applied by `npm run db:migrate`
- Operator auth: password and/or GitHub OAuth with an allowlist, signed session cookie, sign-out
- Per-customer encrypted Vercel vault: PAT **and** the Vercel Integration OAuth callback
- Vercel project binding per customer (`/api/customers/[id]/vercel/projects`)
- Agency GitHub connect (OAuth / PAT / explicit gh import — never auto-picked)
- Repo binding with overlap refusal, in code and in the schema
- OS shell and screens; the floor (`/work`) and Sessions (`/sessions`) run on live Postgres
- **The MCP server** (`/api/mcp`) — streamable HTTP, Bearer auth, ten tools:
  `list_jobs`, `claim_job`, `release_job`, `read_bound_repo`, `read_project`, `next_work`,
  `open_work`, `open_branch`, `post_step`, `request_approval`. Connect with:
  `claude mcp add wrangler --transport http <host>/api/mcp --header "Authorization: Bearer <token>"`
- Session tokens stored as SHA-256 with a display prefix; shown once, rotatable, revocable
- Per-session customer scope and per-session tool grants, enforced in the server

## The agent runner

Managed Agents was considered and rejected: it is beta, gated, Anthropic-only (so
no model choice), and it would mean running a second orchestration system beside
the one already here. The plan is **Claude Code headless in the Railway
container** — the same agent the team already uses, pointed at `/api/mcp`, so the
walls, the audit trail and the approval gate are the ones already tested.

A blog or a CMS change does **not** need that sandbox — content is rows and a
renderer. Only work that edits a customer's repo does.

## What's still fake

- `open_branch` records the branch and the diff; it does not yet push to GitHub or call Vercel deploy
- Twilio still sends from one `TWILIO_CALLER_ID` — per-customer DIDs are not built
- Morning briefing seed data (`web/drizzle/0003_seed.sql`)
- Marketing page, playbooks, client portal

## Local

```bash
createdb wrangler_dev
cd web && npm i && cp ../.env.example .env.local   # fill in DATABASE_URL, TOKEN_ENCRYPTION_KEY, OPERATOR_PASSWORD
npm run db:migrate && npm run dev
```
