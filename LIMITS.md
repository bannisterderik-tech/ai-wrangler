# What is proven, what is not, and what cannot work yet

Written so nobody has to guess which is which. The rule throughout: **"I wrote
it" is not "it works", and "the key is set" is not "the key works."**

Settings → **What actually works** runs this live against your deploy. It asks
each vendor and shows their answer. Trust that over this file, and trust this
file over anything I have said in a chat.

---

## Proven, by running it

Verified against a real Postgres, a production build, and a browser.

| | How it was proven |
|---|---|
| 167 tests | Real Postgres, `NODE_ENV=production`, every run in this session |
| Tenant isolation | As one tenant, another's rows are invisible by id; a write naming another customer is refused by Postgres with `new row violates row-level security policy` |
| Agent scope | Every MCP tool re-reads its job as `wrangler_tenant`; a cross-scope job is refused identically whether it exists or not |
| The proposal chain | Built, sent, opened with no account, signed in a browser, IP and user-agent recorded, hash re-derived and matched |
| Deposit → customer | A forged webhook creates nothing; a correctly signed one converts; a replay creates no second customer |
| The spend cap | Concurrent reports add up rather than overwrite; at the cap the job is held and `claim_job` refuses it |
| The stop switch | Round-tripped through the UI; a worker on old code is still refused at the claim |
| Client revocation | Deleting a client fails their very next request, cookie still signed and unexpired |
| Sign-in redirects | `/\evil.com` and three other bypasses refused — reverting the fix fails the tests |
| Security fixes | Mutation-tested: reverting each one makes tests fail |

---

## Written and never executed

All of this compiles, typechecks and is reasoned from official docs. **None of
it has run.** There is no `claude` binary, no Anthropic key, no GitHub App, no
Stripe key and no Twilio account on the machine it was written on.

| | Risk if I am wrong |
|---|---|
| **Every worker change** | The worker has never completed a single pass. Session resume, `--bare`, `--resume`, spend reporting, model selection, the pass timeout, `MAX_SPEND_USD` — all unexecuted. |
| **GitHub App tokens** | No installation token has ever been minted. If the JWT signing is wrong, `checkout` fails and the agent still cannot push. |
| **`open_branch` verification** | Never called against a real repository. |
| **Stripe** | Tested against self-signed payloads with a test secret — including the whole subscription lifecycle. Never talked to Stripe. The one-off deposit path has the same standing it always had; the recurring path is newer and has the same gap. |
| **Twilio** | No call has ever been placed and no number has ever been bought. The `<Dial>` TwiML, the purchase call and the number search are correct by reading, not by ringing a phone. What IS proven without Twilio: the webhook signature (mutation-tested), inbound routing by the number dialled, and the meter counting a retried callback once. |
| **Resend** | Mail has failed in testing, not succeeded. |
| **Zernio** | All 596 operations are generated from Zernio's published spec and typecheck. **No live call has ever been made** — there is no `ZERNIO_API_KEY` on the machine this was written on. The spec-conformance and validation tests pass without one; they prove the client matches the spec, not that the spec matches Zernio's behaviour. |
| **The Zernio webhook** | The signature check is mutation-tested (removing it fails two tests) and the accept path is exercised with a real HMAC. Zernio itself has never called it. |

**The recurring billing specifically.** The webhook handling is proven against
forged and redelivered events, and mutation-tested — making the counter
double-count, or dropping the newer invoice shape, both fail tests. What is NOT
proven is that Stripe accepts the Checkout Session we build. The mixed
one-time-plus-recurring cart is read from Stripe's API reference verbatim, not
tried. Run one test-mode proposal end to end before trusting it with a real card.

**How to close this gap, in order:**

1. Set the keys. Open Settings → **What actually works**. Every line should say
   *works*. A line saying *broken* is worse than *not set up* — it means the OS
   will try and fail rather than telling you it cannot.
2. Deploy the worker with `RUN_ONCE=1`, once, and read the whole log. That is
   the only thing no screen can prove. You are looking for: which model it
   started, whether it resumed or cold-started, what the pass cost, and whether
   the spend was recorded. `SPEND NOT RECORDED` means the cap is blind.
3. Give it one tiny job — a heading change, Small brain, $1 cap — and watch it
   end to end before anything real.

---

## Cannot work yet, by construction

Not bugs. Nothing here is scheduled, and none of it should be sold.

- **A Google Ads account has to be bound by hand before anything works.** Every
  Zernio call is scoped to an account, so a customer with none bound gets a
  clear refusal rather than a guess. There is no OAuth flow in the OS yet — the
  Zernio account id and Google customer id are entered on Settings → Ad accounts.
- **Only Google is wired to a screen.** All 596 operations are callable in code —
  Meta, TikTok, LinkedIn, Pinterest, X, OpenAI Ads, sixteen social platforms,
  the inbox, telephony and WhatsApp — but the only UI built on them is Google
  Ads. Everything else is a client with no screen.
- **10 of the 12 connectors a copilot can name do not exist.** Microsoft 365
  mail, calendar, Teams, SharePoint, Asana, Odoo, Apple Calendar, IMAP,
  meeting notes. The dependency map is real and useful — it is the scope of the
  job — but it is a map, not an integration. The OS refuses to let any of them
  mark itself connected.
- **Personal WhatsApp has no API.** Not a backlog item, a wall. Only WhatsApp
  Business through a provider can ever work.
- **The client CRM is one page and one route.** `threads`, `messages` and
  `call_log` have row level security enabled with no policy, so no tenant can
  read them at all. Wiring clients into conversations needs a migration and a
  schema decision, not a config change.
- **`ask()` has no call sites.** The whole model layer, including the prompt
  caching in it, is unreachable. It saves nothing until something calls it.
- **No blog or CMS.** Asked for, not built.
- **A customer's Claude subscription cannot run their agent.** Claude Code can
  sign in with a Pro or Max login, but `--bare` — which stops their own
  repository injecting hooks and CLAUDE.md into the agent — never reads OAuth or
  the keychain, so a subscription means giving up that wall. Separately, a
  consumer subscription is priced for a person using it, not for unattended
  automation in a datacenter resold as part of a service, and the account
  suspended for that would be the customer's. Their own API key does the same
  job with neither problem; confirm the current terms with Anthropic rather than
  taking this file's word for them.
- **`metrics` has a reader and no writer.** The performance numbers an agent
  reads are from a table nothing fills.

---

## Security: what is actually true

**Fixed and tested in this session**

- A signed-in client could reach the Vercel and GitHub OAuth routes and
  overwrite *another customer's* deploy token and bindings, or the agency's own
  GitHub credential. Closed at two layers, each independently sufficient.
- A worker's checkout was keyed on a token's *position* in an env var, on a
  persistent volume. Reordering that variable gave one customer's agent another
  customer's repository. Keyed on identity now, with a wipe on mismatch.
- Sign-in links were built from the caller's `Host` header when no platform
  value existed. Refuses now rather than trusting it.
- The password throttle keyed on a caller-supplied header, so a random value per
  request bought unlimited attempts at a single-factor admin password.
- Open redirect after the session cookie was set.
- Tables added after migration 2 shipped with no RLS, exposing signature
  evidence and proposal capability tokens. A test now fails if any table lacks it.

- Customers and Ads answered `guard()`, which asks only whether *somebody* is
  signed in, and then selected their whole table. Any signed-in agency read
  every other agency's client list and ad spend, and could pause their
  campaigns. Found while checking something else. Five tests were written
  first, failed, and now pass.

- Every API route was audited. 23 of them answered `guard()` — which asks only
  whether somebody is signed in — and are now on `guardTenant`, `guardBuild` or
  `guardOwner` with the query scoped. A test enumerates the route files and
  fails if a new one answers `guard()`, so the class cannot come back quietly.
  The scoping is proved by a second agency walking the routes, not by the
  rename: three of the fixes were mutation-tested.
- The importer wrote leads, customers, partners and proposals with no tenant
  stamp, so any agency's import landed in the house account. It also keyed rows
  on the source CRM's record id, which is unique only within one export — two
  agencies importing collided on every id and the second one's rows were
  silently skipped as "already here".
- `/api/threads` POST let the request body choose which agency a conversation
  belonged to, and a local variable named `t` shadowed the tenant guard exactly
  where the check was needed.
- `/api/deals` was removed. Nothing called it, `agency_leads` replaced it, and
  the `deals` table has no tenant or customer column at all — so the route was
  an unscoped read of a dead table. The table itself is still there.
- `/team` drew a hardcoded card saying "claude-code connected · this laptop"
  regardless of whether anything was. It redirects to Sessions now.

- Every customer can have their own phone number, bound through the same
  unique index as a repository. Inbound calls and texts are routed by the number
  they arrived ON — never by `From`, which the caller controls — and land in
  that customer's call log and conversations.

- The assistant answers a customer's phone, in three layers: always, after
  hours, or catching what the humans miss. It takes a name, the job and a
  callback number, puts it on the board as a lead, and hands urgent callers to a
  person without waiting for a model to agree.

**True, and not fixed**

- **The assistant has never spoken to anybody.** Twilio's speech `<Gather>` and
  the whole turn loop are correct by reading their docs, not by ringing a phone,
  and there is no model key on the machine this was written on — so every test
  exercises the failure path, where it hands over to a human. What it SAYS is
  entirely unproven. Ring it yourself before it answers for a paying customer.
- **Call recording and AI disclosure are jurisdictional.** The greeting always
  says it is an automated assistant, and that is not configurable. But
  two-party-consent states have their own rules about recording and
  transcription, and Twilio transcribes every turn. This is worth ten minutes
  with somebody who knows the law in the states your customers operate in — it
  is not a thing to find out about afterwards.
- **Latency is unmeasured.** Each turn is a Twilio round trip plus a model call.
  It uses the fast model for that reason, but nobody has timed it on a real
  call, and a receptionist that pauses three seconds before every sentence is
  one people hang up on.


- **The usage meter has never been reconciled against a real invoice.** The
  Twilio rates in `numbers.ts` are US list prices read from their pricing page,
  not what your account is actually charged. Nothing is billed from the meter
  yet, deliberately: check a month of it against a real Twilio invoice before
  marking anything up.
- **A customer with no number still sends from the shared caller id.** That is
  now a visible, counted state rather than the design — Settings says how many
  are still sharing — but it is still true for anyone not yet migrated.


- **Customer ids are still global slugs.** Two agencies both signing "Acme"
  want one primary key. Every path now refuses rather than adopting, but the
  real fix is a composite key and a migration.


- **Customer ids are global slugs.** Two agencies both signing "Acme" want the
  same primary key. `ensureCustomer` now refuses rather than letting the second
  adopt and rename the first one's row, but the real answer is a composite key,
  and that is a migration.

- **The agent container has arbitrary code execution.** `Bash(npm *)` and
  `Bash(node *)` both allow it. That container holds your Anthropic key, its own
  session token, and — for about an hour — a GitHub token for one repository.
  Treat all three as exfiltrable by anything that gets into a checkout. The
  bound is: one repo, one hour, no `workflows` permission, revocable.
- **`--bare` matters more than it sounds.** Without it, Claude Code loads the
  hooks and `CLAUDE.md` out of the customer repository it just cloned. It needs
  `ANTHROPIC_API_KEY` set or it silently does not apply.
- **Operator sessions cannot be revoked mid-life.** Client sessions re-check the
  database every request; operator sessions are signed cookies valid up to seven
  days. Removing an operator does not end their session.
- **No penetration test.** Everything above is self-review plus one adversarial
  agent I pointed at my own work. That is not the same as someone competent
  trying to break it.

**What to do**

1. Rotate the GitHub App private key sitting in your Downloads folder if it has
   ever been in a synced folder, a backup, or a chat.
2. `PUBLIC_ORIGIN`, `AUTH_SECRET`, `TOKEN_ENCRYPTION_KEY` set on the deploy.
3. `MAX_SPEND_USD` to a number you are willing to lose.
4. Stripe in **test** mode until you have watched one deposit convert.
5. Install the GitHub App per repository. It only gets tokens for repos it is
   installed on — that is the wall, so do not install it org-wide.

---

## How to stop me from hallucinating

Things I have got wrong in this project, and what actually caught them:

- I claimed a Vercel fix twice from reasoning. Both were wrong. **Reproducing
  the failure** caught it.
- I asserted the Docker image would include a dependency. It did not. **Booting
  the image by hand** caught it.
- I guessed Railway's GraphQL schema. Two fields did not exist. **Fetching the
  schema** caught it.
- I said prompt caching would make things cheaper without checking that
  `ask()` had callers. It has none. **Grepping for call sites** caught it.
- I read the worker's polling loop and never asked what an idle pass cost.
  **$20** caught it.

The pattern is the same every time: I was confident from reading, and wrong
until something executed. So:

- Ask **"did you run it, or did you read it?"** I will tell you straight.
- Treat any number I give you as invented unless I show the command that
  produced it. The Spending page once printed a 42% saving nobody measured.
- When I say something works, the useful follow-up is **"show me the output."**
