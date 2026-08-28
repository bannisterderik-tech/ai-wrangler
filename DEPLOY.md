# Deploying AI Wrangler

Railway. One service, one image, root directory **`web`**. `prototype/` never ships.

The image runs migrations at boot and refuses to start if they fail, so a bad schema
never serves traffic. Nothing else here is automatic on purpose: production deploys stay
approval-gated, and every secret is generated fresh rather than lifted from a laptop.

## 1. Project and database

```bash
npm i -g @railway/cli
railway login
cd web && railway init          # or: railway link, into an existing project
railway add --database postgres
```

Or the same three clicks in the dashboard: **New Project → Deploy from GitHub repo →
＋ New → Database → PostgreSQL**.

In the service settings set **Root Directory = `web`**. Railway picks up
[`web/railway.json`](web/railway.json) from there: Dockerfile build, health check on
`/api/health`, restart on failure.

## 2. Secrets, generated fresh

```bash
node -e "console.log('TOKEN_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('AUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Do not reuse the local values. `TOKEN_ENCRYPTION_KEY` decrypts every customer's Vercel
token; rotating it later strands every stored token.

## 3. Variables on the service

| Var | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` — a reference variable, so it follows the plugin |
| `TOKEN_ENCRYPTION_KEY` | fresh 32-byte hex |
| `AUTH_SECRET` | fresh 32-byte hex |

Plus **at least one way to sign in**, or the OS refuses to open:

| Var | Value |
|---|---|
| `OPERATOR_PASSWORD` | a long random password, or |
| `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` | OAuth App at github.com/settings/developers |
| `OPERATOR_GITHUB_LOGINS` | the GitHub logins allowed in — required for GitHub login |

Optional, for customers who would rather install than paste a token:
`VERCEL_INTEGRATION_CLIENT_ID`, `VERCEL_INTEGRATION_CLIENT_SECRET`, `VERCEL_INTEGRATION_SLUG`.

Railway sets `PORT` itself. Do not set it.

## 4. Deploy

```bash
cd web && railway up
```

Then **Settings → Networking → Generate Domain**. Point the OAuth callbacks at it:

- GitHub OAuth App → `https://<domain>/api/auth/github/callback`
- Vercel Integration redirect → `https://<domain>/api/auth/vercel/callback`

Both are per-domain, so add them after the first deploy and redeploy.

## 5. Check it landed

```bash
curl -s https://<domain>/api/health          # {"ok":true,"login":{"configured":true,…}}
curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/api/customers   # 401
```

Then, signed in:

1. `/github` — connect whichever GitHub account should own client repos. Nothing is hardwired.
2. `/connect` — paste a customer's Vercel token, or send them through the integration.
3. `/customers` — bind a repo to customer A, then try to bind it to customer B. It refuses.

## Schema changes later

Add a numbered file to `web/drizzle/`. It applies on the next boot, once, and is recorded
in `_wrangler_migrations`. To run one by hand:

```bash
cd web && DATABASE_URL='<railway postgres url>' npm run db:migrate
```

## Running it somewhere else

The image is plain Node — Fly, Render, a VPS all work with the same Dockerfile.

**Vercel** also still works for the OS (the guard in `web/src/lib/db.ts` is there for it),
but a Vercel function cannot hold a long agent session, so the job runner would have to live
on a second host anyway. That is the reason this deploys to Railway: when the runner lands,
it is a second service in the same project, off the same image, sharing the same Postgres.

## Not in this pass

Live Git branches, real Vercel deploys from jobs, cloud agent runtime (Head Wrangler is
Claude Code on the operator's laptop over MCP), HubSpot, client portal, inbox ingest.

## Vercel

Vercel builds the **repo root** by default, and there is no app there — the root
`package.json` has no dependencies and no lockfile, so the build fails before it
starts. Three things to set:

1. **Root Directory → `web`** in Project Settings. Without this nothing else matters.
2. **Environment variables** — runtime, not build time. The build no longer needs
   a database (the connection is opened on first use), so a misconfigured deploy
   *builds and boots*; it just cannot serve a page that queries. Set:

   | Variable | Why |
   |---|---|
   | `DATABASE_URL` | Postgres. Without it every data route 500s. |
   | `AUTH_SECRET` | Signs the operator session cookie. |
   | `TOKEN_ENCRYPTION_KEY` | Exactly 64 hex chars — `openssl rand -hex 32`. Production refuses to encrypt with anything else. |
   | `OPERATOR_PASSWORD` | Or GitHub OAuth. With neither, the OS seals itself shut. |

   `GET /api/health` reports which of these are wired, in booleans, without
   leaking a value. Hit it first when a deploy looks wrong.
3. **Do not add a build command or output directory override.** `next.config.ts`
   already branches on `process.env.VERCEL`: standalone output for a box,
   Vercel's own output here. It also pins `outputFileTracingRoot` to `web/`,
   because the repo-root `package.json` is enough to make Next anchor tracing one
   directory up — and then Vercel's `onBuildComplete` fails with
   `ENOENT ... web/.next/next-server.js.nft.json`, which says nothing about
   workspaces and costs an afternoon.
4. Expect the OS to work and the long-running side not to — the job runner wants
   a box, not a function.

Railway stays the target for the container.


## Railway — the two things that fail first

**1. Root Directory = `web`.** Both `railway.json` and `Dockerfile` live in `web/`,
and Railway looks for them at the root of the service's source directory. Point a
service at the repo root and it never sees either — it falls back to Railpack,
detects Node from whatever is at the root, and dies with `next: not found`
because the app's dependencies were never installed. Service → Settings → Root
Directory → `web`.

There is deliberately no `package.json` at the repo root any more. It only
proxied npm scripts, and it caused four deploy failures across two platforms by
making each of them believe the repo root was the app. Use the `Makefile` for the
same shortcuts locally: `make dev`, `make test`, `make migrate`.

**2. The container refuses to start without a database, on purpose.**
`scripts/start.mjs` migrates before it serves and will not serve a schema it did
not migrate. So the database has to exist before the first deploy:

- Add a **Postgres** database to the Railway project.
- On the app service set `DATABASE_URL = ${{Postgres.DATABASE_URL}}` — the
  reference syntax, so it follows the database rather than being pasted.
- Set `AUTH_SECRET` and `TOKEN_ENCRYPTION_KEY`, different values, each
  `openssl rand -hex 32`.

It now names the missing variable in the deploy log instead of failing with
"migrations failed".

`/api/health` is the healthcheck and answers 200 as soon as the server is up, with
`database.reachable` telling you whether the rest is wired.
