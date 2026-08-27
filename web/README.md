# AI Wrangler — `web/`

The agency control plane. Next.js 16 App Router, Postgres, one operator door.

## Run it locally

You need Postgres. Homebrew:

```bash
brew install postgresql@18 && brew services start postgresql@18 && createdb wrangler_dev
```

Then:

```bash
cp ../.env.example .env.local   # fill in the values below
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000 — you land on `/login`, because the OS has no public side.

### The env vars that matter

| Var | Why |
|---|---|
| `DATABASE_URL` | Postgres. There is no SQLite fallback. |
| `TOKEN_ENCRYPTION_KEY` | 32-byte hex. Encrypts every customer's Vercel token. A **new** one for production. |
| `AUTH_SECRET` | Signs the operator session cookie. Falls back to `TOKEN_ENCRYPTION_KEY` if unset. |
| `OPERATOR_PASSWORD` | Password login. Either this or GitHub login must exist, or nothing opens. |
| `GITHUB_OAUTH_CLIENT_ID` / `_SECRET` | "Sign in with GitHub" for the operator, and the agency GitHub connect flow. |
| `OPERATOR_GITHUB_LOGINS` | Comma-separated GitHub logins allowed to sign in. Required for GitHub login. |
| `VERCEL_INTEGRATION_CLIENT_ID` / `_SECRET` / `_SLUG` | Optional. Lets a customer install on their own Vercel instead of pasting a token. |

## Commands

```bash
npm run dev          # local dev
npm run db:migrate   # apply drizzle/*.sql once each
npm run db:reset     # drop + rebuild (refuses anything that is not local/test)
npm test             # build, rebuild wrangler_test, start on :3111, run the isolation suite
```

## Isolation, concretely

Three walls, all tested in `tests/isolation.test.mjs`:

1. **The door.** `src/middleware.ts` — no operator session, no page and no API. `/api/health` and the login routes are the only public paths.
2. **The route.** A job may only name a repo or Vercel project bound to *its own* customer (`assertBoundToCustomer`). Someone else's resource is a 403; an unbound one is a 409.
3. **The database.** Every tenant table has RLS. Customer-scoped work runs through `withCustomer()` as the `wrangler_tenant` role with `app.customer_id` pinned for the transaction, so a query written wrong still cannot read another customer's rows. A unique index on `(provider, resource_id)` means one repo belongs to one customer even under a race.

The owner role (your `DATABASE_URL`) sees everything — that is the agency view, and it is on purpose. Supabase's `anon` / `authenticated` roles see nothing.

## Layout

```
src/app/api/**      route handlers (all gated)
src/lib/db.ts       Postgres client, withCustomer()
src/lib/isolation.ts  the refusals
src/lib/binding.ts  repo / project binding, no overlap
drizzle/*.sql       migrations, in order
scripts/            migrate, reset, test
```
