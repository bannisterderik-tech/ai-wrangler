-- Answering the phone.
--
-- A contractor missing five to ten calls a week is the single most expensive
-- thing in their business, and roughly five in six people who reach voicemail
-- never ring back. Until numbers were per-customer this was impossible: a call
-- could not be attributed to one shop before it was answered, so nothing could
-- greet the caller in that shop's name.
--
-- The shape follows how the trade actually runs it, which is layered — the
-- office answers when it can, an assistant sweeps the calls nobody reached,
-- and it owns nights and weekends outright.

CREATE TABLE IF NOT EXISTS receptionists (
  customer_id text PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id   text NOT NULL DEFAULT 'ai-wrangler',

  enabled     boolean NOT NULL DEFAULT false,
  -- always      — it answers every call
  -- after_hours — outside the hours below only
  -- on_no_answer— tries the humans first, picks up what they miss
  mode        text NOT NULL DEFAULT 'on_no_answer',

  -- Who it says it is, and what it knows about the business.
  business_name text,
  greeting      text,
  brief         text,

  -- {"tz":"America/Los_Angeles","open":8,"close":17,"days":[1,2,3,4,5]}
  hours_json  text,

  -- Rung first on on_no_answer, and where an urgent caller is transferred.
  forward_to  text,
  -- Said out loud by the caller, e.g. "gas leak, no heat, flooding".
  urgent_words text,

  -- A phone call cannot be allowed to cost whatever it likes. Turns bound the
  -- conversation; the cap bounds the month.
  max_turns   integer NOT NULL DEFAULT 8,
  monthly_cap_cents integer NOT NULL DEFAULT 2000,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE receptionists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS receptionists_tenant_policy ON receptionists;
CREATE POLICY receptionists_tenant_policy ON receptionists
  FOR ALL TO wrangler_tenant
  USING (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true))
  WITH CHECK (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON receptionists TO wrangler_tenant;

-- One row per call it handles, carrying the conversation between turns.
--
-- Twilio is stateless between webhooks: each turn arrives as a fresh HTTP
-- request carrying only the CallSid. This is where the conversation lives, and
-- keying it on the CallSid is what makes a turn resumable at all.
CREATE TABLE IF NOT EXISTS receptionist_calls (
  id           text PRIMARY KEY,
  call_sid     text NOT NULL UNIQUE,
  customer_id  text REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id    text NOT NULL DEFAULT 'ai-wrangler',
  from_number  text,

  turns        integer NOT NULL DEFAULT 0,
  -- talking | captured | transferred | voicemail | ended | failed
  outcome      text NOT NULL DEFAULT 'talking',

  -- The whole exchange, as [{who:"them"|"it", text}]. It is the record of what
  -- was said to somebody's customer in their name, so it is kept verbatim.
  transcript_json text,

  -- What it managed to get out of the call.
  caller_name  text,
  job_summary  text,
  callback     text,
  urgent       boolean NOT NULL DEFAULT false,

  lead_id      text,
  cost_millicents integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receptionist_calls_customer ON receptionist_calls (customer_id, created_at DESC);

ALTER TABLE receptionist_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS receptionist_calls_tenant_policy ON receptionist_calls;
CREATE POLICY receptionist_calls_tenant_policy ON receptionist_calls
  FOR ALL TO wrangler_tenant
  USING (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true))
  WITH CHECK (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON receptionist_calls TO wrangler_tenant;
