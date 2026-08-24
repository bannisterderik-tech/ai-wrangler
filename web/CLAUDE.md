@../HANDOFF.md

Deploy **this `web/` directory only**. Prototype UI lives in `../prototype` — visual reference, not the deploy target.

SQLite is local-only. Production requires `DATABASE_URL` (Postgres). Do not remove the Vercel guard in `src/lib/db.ts`.
