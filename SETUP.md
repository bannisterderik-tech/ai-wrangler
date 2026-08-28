# Switching things on

Everything below is off until you set it, and the OS says which. Hit
`/api/health` on your deploy — it lists what each capability needs and what is
missing, by variable name, never by value.

Nothing here is required to boot. Each block turns on one capability, and
without it the feature refuses out loud rather than pretending.

---

## Required

| Variable | Why |
|---|---|
| `DATABASE_URL` | Postgres. Migrations run at boot. |
| `AUTH_SECRET` | Signs session cookies. |
| `TOKEN_ENCRYPTION_KEY` | 64 hex chars. The vault every customer secret is stored under. |
| `PUBLIC_ORIGIN` | This deploy's real URL, e.g. `https://os.aiwrangler.co`. |

**On `PUBLIC_ORIGIN`:** links that leave the server — sign-in links, proposal
links — are built from it. Without it, and without a platform value, those
routes **refuse**, because the only remaining source is the caller's own `Host`
header, and believing that lets a stranger request a sign-in link that points at
their server and collects your token when you click it. Railway sets
`RAILWAY_PUBLIC_DOMAIN` so this is covered there, but set it explicitly anyway.

Plus at least one way in: `OPERATOR_PASSWORD`, or magic links (a Resend key,
saved in the OS), or GitHub OAuth. With none configured the OS seals itself
rather than falling open.

---

## The agent, so it can actually deliver work

Without this the agent can read and think, and cannot push anything anywhere.

1. Create a GitHub App (Settings → Developer settings → GitHub Apps).
   - Repository permissions: **Contents: Read & write**, **Pull requests: Read
     & write**. Nothing else, and specifically **not** Workflows — withholding
     it means GitHub refuses any push touching `.github/workflows`, whatever
     the agent tries.
   - No webhook needed.
2. Generate a private key. GitHub gives you a `.pem` once.
3. **Install the App on each customer repository** you want the agent to touch.
   It only ever gets a token for a repo it is installed on.

| Variable | Value |
|---|---|
| `GITHUB_APP_ID` | The numeric App ID |
| `GITHUB_APP_PRIVATE_KEY` | The whole PEM, `-----BEGIN…` to `-----END…`. Literal newlines or `\n` both work. |

**Do not commit the `.pem`.** It goes in the environment and nowhere else.
Anyone holding it can act as the App on every repo it is installed on. If it has
ever been pasted anywhere it should not have been, delete that key in GitHub and
generate a new one — the App survives, only the key rotates.

Once set: `checkout(job_id)` hands the agent a clone URL scoped to one repo for
about an hour, and `open_branch` asks GitHub whether a branch is really there
instead of believing the agent.

---

## The phone

Without this the dialer is off. It used to be worse than off — it rang the lead,
said one sentence, and hung up.

**Bridge calling** (the minimum — Twilio rings you, then dials the lead and
joins you):

| Variable | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | `AC…` |
| `TWILIO_AUTH_TOKEN` | from the console |
| `TWILIO_CALLER_ID` | a number you own, what the lead sees |

Then set **Ring me on** in the OS (Settings → agency keys) to the number Twilio
should call first. Without it a call is refused, because a call with nobody on
our end is a robocall.

**Browser calling** (the call happens in the tab) additionally needs:

| Variable | Value |
|---|---|
| `TWILIO_API_KEY_SID` | `SK…` — an API key, not the auth token |
| `TWILIO_API_KEY_SECRET` | shown once when you create the key |
| `TWILIO_TWIML_APP_SID` | `AP…` |

Still true: one shared caller id for every customer. Per-customer numbers are
not built.

---

## Taking deposits

Without this, a client can sign a proposal but not pay it, and the page says
you will invoice them instead.

| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` first. Card details never touch this server — Checkout is Stripe's hosted page. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` |

Add the webhook endpoint in Stripe: `https://<your-origin>/api/stripe/webhook`,
event `checkout.session.completed`.

**The webhook is not optional.** Paying is what turns a lead into a customer,
and the webhook is the only statement about money that did not come from the
person who owes it — anyone can open a success URL. With `STRIPE_SECRET_KEY` set
and no webhook secret, deposits will be charged and nobody will be converted.

---

## Models

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Also settable in the OS, which is where the worker reads it from. |
| `AI_PROVIDER=openrouter` + `OPENROUTER_API_KEY` | To route through OpenRouter instead. |
| `AGENT_MODEL_HAIKU` / `_SONNET` / `_OPUS` | Override the model behind each brain tier. |

Per-job tiers are picked on the New job form. The worker asks the floor which
job it would take and starts Claude Code at that job's tier.

---

## The worker

Deploys from `worker/`, or from the OS: Sessions → an agent → **Redeploy the
worker**.

| Variable | Value |
|---|---|
| `WRANGLER_MCP_URL` | `https://<your-origin>/api/mcp` |
| `WRANGLER_SESSION_TOKENS` | One agent token per project, comma separated |
| `ANTHROPIC_API_KEY` | Required, and required specifically in `--bare` mode |
| `POLL_SECONDS` | Seconds. A value like `120s` is refused at boot rather than parsed to NaN. |
| `MAX_PASS_SECONDS` | Ceiling on one pass. Default 1800. |
| `MAX_SPEND_USD` | Ceiling for the whole container, all passes. Default 25. It stops and stays stopped. |

### Running it on your own VPS

Nothing about the worker is Railway-specific. It needs Node, git, ripgrep and
Claude Code, and it makes only outbound calls — so a Hostinger VPS, a Hetzner
box or a machine under a desk all work identically, with no inbound port, no
firewall hole and no provider API token.

```
git clone <this repo> && cd worker
npm install -g @anthropic-ai/claude-code@2.1.236
WRANGLER_MCP_URL=https://<your-origin>/api/mcp \
WRANGLER_SESSION_TOKENS=<one per project agent> \
ANTHROPIC_API_KEY=sk-ant-... \
MAX_SPEND_USD=25 POLL_SECONDS=600 node run.mjs
```

Set `AGENT_HOST` to name the box in the OS. Run it under systemd or pm2 so it
restarts; the worker itself has no opinion about that.

**On uptime:** a provider's API can tell you a box is powered on, and that is
the wrong signal — during the incident that cost $20 the box was on the whole
time and the agent produced nothing. The worker reports its own health instead:
which host, which CLI version, how many passes, what the last one cost, how much
of its ceiling is gone, and what it is stuck on. Silence is treated as its own
state rather than as a stale "ok", because a box that has stopped talking is the
thing you most need to see.

**Stopping it does not mean opening Railway.** The floor has a stop switch: on
the floor, **Stop all agents**. Every agent asks the floor what to do before it
starts a paid session, so it takes effect on the next poll, and `claim_job`
refuses too — which catches a worker running older code that never asks.

`MAX_SPEND_USD` is the backstop underneath all of that. It needs nothing else to
be working: the worker adds up what the harness said each pass cost and stops
itself. A previous version idled on Opus every 120 seconds with no skip and no
per-pass check, spending $20 to be told "nothing to do" thirty times an hour,
while the per-job counter read $0.00 the whole time. A ceiling that depends on
no other component is the only kind that would have caught that.

**Editing `WRANGLER_SESSION_TOKENS` is safe now** — workspaces are keyed on the
token's identity, not its position in that list. It was not safe before: removing
one token shifted every later agent down a slot and the next customer's agent
inherited the previous customer's checkout.

---

## Semantic memory (optional)

`VOYAGE_API_KEY` switches recall from keyword search to embeddings. Lexical
search works now and costs nothing; this only starts to matter once a customer
has more notes than fit in one read. `/api/memories/recall` reports which
backend answered.
