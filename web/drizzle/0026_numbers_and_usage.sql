-- A number of their own, and a meter under it.
--
-- Every customer's calls and texts went out from one shared TWILIO_CALLER_ID.
-- In a product whose whole premise is isolation that was the loudest remaining
-- contradiction: a shop's customer saw the same number as every other shop's,
-- inbound could not be routed to anybody in particular, and nothing could be
-- attributed — so nothing could be billed.
--
-- The binding itself lives in bound_resources, beside repos, Vercel projects
-- and Google Ads accounts, because it needs exactly the same wall: the
-- (provider, resource_id) unique index makes "one number, one customer" a
-- database fact rather than a code path. No new table for that.
--
-- What is new is the meter.

CREATE TABLE IF NOT EXISTS usage_events (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL DEFAULT 'ai-wrangler',
  customer_id text REFERENCES customers(id) ON DELETE CASCADE,

  -- call | sms | ai | ads. One table rather than four, because the question
  -- being asked is always "what did this customer cost us this month".
  kind        text NOT NULL,

  -- Seconds for a call, segments for a text, tokens for a model. The unit is
  -- decided by `kind` and named in `unit` so a reader never has to guess.
  quantity    integer NOT NULL DEFAULT 0,
  unit        text NOT NULL DEFAULT 'unit',

  -- What it cost US, in tenths of a cent. Twilio prices a text at $0.0079 and
  -- a call minute at $0.014; whole cents would round both to nothing, and a
  -- meter that rounds every row to zero is not a meter.
  cost_millicents integer NOT NULL DEFAULT 0,

  -- The provider's own id, so a row can be reconciled against their invoice
  -- and so a redelivered webhook cannot count the same call twice.
  ref         text,
  detail      text,
  at          timestamptz NOT NULL DEFAULT now()
);

-- The idempotency wall. A Twilio status callback is retried, and a call
-- counted twice is a bill that does not match theirs.
CREATE UNIQUE INDEX IF NOT EXISTS usage_events_ref ON usage_events (kind, ref) WHERE ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS usage_events_customer ON usage_events (customer_id, at DESC);
CREATE INDEX IF NOT EXISTS usage_events_tenant ON usage_events (tenant_id, at DESC);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS usage_events_tenant_policy ON usage_events;
CREATE POLICY usage_events_tenant_policy ON usage_events
  FOR ALL TO wrangler_tenant
  USING (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true))
  WITH CHECK (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true));

GRANT SELECT, INSERT, UPDATE, DELETE ON usage_events TO wrangler_tenant;

-- Which customer an inbound call or text is for is decided by the number it
-- arrived on, so that lookup happens on every single inbound webhook.
CREATE INDEX IF NOT EXISTS bound_resources_provider_resource
  ON bound_resources (provider, resource_id);

-- The call log was built when every call was outbound: somebody clicked Call
-- on a lead. An inbound call has a direction, a caller, and a Twilio id that
-- the status callback arrives with later, none of which it could record.
ALTER TABLE call_log ADD COLUMN IF NOT EXISTS from_number text;
ALTER TABLE call_log ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'out';
ALTER TABLE call_log ADD COLUMN IF NOT EXISTS ref text;

-- The status callback finds the call it belongs to by this.
CREATE UNIQUE INDEX IF NOT EXISTS call_log_ref ON call_log (ref) WHERE ref IS NOT NULL;
