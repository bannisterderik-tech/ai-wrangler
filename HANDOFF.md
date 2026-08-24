# Handoff — deploy AI Wrangler

Read this before changing or deploying anything.

## What this is

An **agency control plane**, not a coding agent.

- **Our GitHub** — one agency account. Bind `owner/repo` → customer. No overlap.
- **Their Vercel** — each customer’s token + bound project IDs.
- Isolation is the product: a job for customer A cannot see customer B’s repo or Vercel project.

Claude Code on the operator’s laptop is the Head Wrangler (MCP). Cloud agents are later.

## Deploy this, not that

| Deploy | Ignore |
|---|---|
| `web/` (Next.js 16 App Router) | `prototype/` (design sim) |
| | Root `server/` (moved under prototype) |
| | SQLite file DB |

Vercel root directory: **`web`**.

## Do not ship until

1. **Postgres, not SQLite.** `web/src/lib/db.ts` uses `better-sqlite3`. That **cannot run on Vercel serverless**. Swap to Supabase/Postgres (`DATABASE_URL`) with `customer_id` on every table and RLS. The file throws if `VERCEL` is set and `DATABASE_URL` is missing.
2. **Operator auth.** All `/api/*` routes are currently unauthenticated. Do not expose a public URL until there is at least one login (password, magic link, or GitHub).
3. **Secrets in Vercel env**, never in git:
   - `TOKEN_ENCRYPTION_KEY` (32-byte hex, **new** for prod — do not reuse local)
   - `DATABASE_URL`
   - `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` (callback `https://<domain>/api/auth/github/callback`)
   - Vercel integration ids if using OAuth (callback route in Next is still incomplete — `/api/auth/vercel/start` exists, **callback does not**)
4. **Isolation tests** before public: bind repo A to customer 1 → request as customer 2 → 403.

## Product rules (do not “improve” away)

- Keep the NeXT UI (CSS variables in `web/src/app/globals.css`). Do not restyle as Linear.
- Do not put all clients on one Vercel project.
- Do not use a shared Vercel token across customers.
- Production deploys stay two-click / approval-gated.
- Do not build HubSpot. Inbox/playbooks/billing are later.

## What’s already real

- OS shell + screens in `web/src/app`
- Per-customer Vercel PAT vault (encrypted)
- Agency GitHub connect (OAuth / PAT / explicit gh import) — **not** auto `bannisterderik-tech`
- Repo binding with overlap refusal
- Jobs / approvals / inbox as SQLite rows (not live agents)

## What’s fake / stub

- Jobs do not open Git branches or call Vercel deploy
- Morning briefing seed data
- Marketing page
- Vercel Integration OAuth callback
- Client portal

## First PR on deploy

1. Postgres + Drizzle
2. Auth gate on the OS
3. Finish Vercel OAuth callback **or** keep PAT-only for v1
4. Isolation test
5. Deploy `web/` to Vercel

Local:

```bash
cd web && npm i && npm run dev
```
