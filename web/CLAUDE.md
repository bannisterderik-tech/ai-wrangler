@../HANDOFF.md

Deploy **this `web/` directory only**. Prototype UI lives in `../prototype` — visual reference, not the deploy target.

Postgres only. `DATABASE_URL` is required everywhere, and the Vercel guard at the top of `src/lib/db.ts` stays.

Do not weaken any of these: the middleware gate, `withCustomer()` / RLS, `assertBoundToCustomer`, the `(provider, resource_id)` unique index. `npm test` proves all four; keep it green.
