# AI Wrangler

Agency OS for running AI builds across many client sites **without mixing them**.

**Frontend preview (no database):** [bannisterderik-tech.github.io/ai-wrangler](https://bannisterderik-tech.github.io/ai-wrangler/)

Funnel (CRM, Twilio dialer, SMS, Zernio ads, partners) sits at the top. Build work sits at the bottom. Every screen is full-viewport. Twilio / Zernio keys go in `.env.example` when you are ready — until then the desk runs as a live-shaped demo.

GitHub Pages serves the clickable OS sim so you can walk the UI before Postgres and Vercel are wired. It is noindex. The live product is still `web/`.

- **Product:** [`web/`](web/) — Next.js 16 app on Postgres. **This is what you deploy** (Railway / later Vercel).
- **Design sim:** [`prototype/`](prototype/) — Claude Design `.dc.html`. Visual source of truth. Previewed on Pages; not the production app.
- **Plan:** [`PLAN.md`](PLAN.md) · **Handoff:** [`HANDOFF.md`](HANDOFF.md) · **Deploy:** [`DEPLOY.md`](DEPLOY.md)

The app is **`web/`** — point every deploy platform's Root Directory at it.
There is no `package.json` at the repo root on purpose; one there makes build
platforms think the root is the app. Local shortcuts live in the `Makefile`
(`make dev`, `make test`, `make migrate`).

```bash
createdb wrangler_dev
cd web && npm install && cp ../.env.example .env.local   # fill it in
npm run db:migrate && npm run dev
```

Open http://localhost:3000 — you land on the operator login, because there is no public side.

```bash
cd web && npm test   # the isolation suite: the door, the routes, and the database walls
```
