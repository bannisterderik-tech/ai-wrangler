-- The rest of the OS, off the mockups and onto rows.
--
-- Prospects is not a second table. A prospect is a lead you have not engaged
-- yet, so it is a stage on agency_leads — two tables would drift, and the day
-- they drift is the day a prospect and a lead are the same shop twice.

-- Partners are franchise licensees: other agencies running our name, playbooks
-- and recipes in their own territory. Agency-level.
CREATE TABLE IF NOT EXISTS partners (
  id text PRIMARY KEY,
  name text NOT NULL,
  operator_name text,
  email text,
  phone text,
  territory text,
  tier text NOT NULL DEFAULT 'operator',      -- founding | operator | associate
  status text NOT NULL DEFAULT 'applied',     -- applied | onboarding | live | paused
  customers integer NOT NULL DEFAULT 0,
  book_cents integer NOT NULL DEFAULT 0,      -- what their own customers pay them
  royalty_pct integer NOT NULL DEFAULT 12,
  fee_cents integer NOT NULL DEFAULT 0,
  note text,
  since text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One market, one partner. The same shape as a repo binding, for the same reason.
CREATE UNIQUE INDEX IF NOT EXISTS partners_territory ON partners (lower(territory)) WHERE territory IS NOT NULL;

-- Ad campaigns we run for a customer. Their account, their spend — we never hold it.
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  platform text NOT NULL DEFAULT 'google',
  status text NOT NULL DEFAULT 'draft',       -- draft | pending_review | active | paused
  goal text,
  spend_cents integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  daily_cap_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_campaigns_customer ON ad_campaigns (customer_id, status);

-- Conversations. Agency-level, because a thread can be with a lead we have no
-- customer for yet; customer_id is set once there is one.
CREATE TABLE IF NOT EXISTS threads (
  id text PRIMARY KEY,
  subject text,
  who text NOT NULL,
  channel text NOT NULL DEFAULT 'sms',        -- sms | email | call | note
  phone text,
  email text,
  customer_id text REFERENCES customers(id) ON DELETE SET NULL,
  lead_id text REFERENCES agency_leads(id) ON DELETE SET NULL,
  unread boolean NOT NULL DEFAULT false,
  last_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS threads_recent ON threads (last_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id bigserial PRIMARY KEY,
  thread_id text NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'out',      -- in | out
  channel text NOT NULL DEFAULT 'sms',
  body text NOT NULL,
  actor text NOT NULL DEFAULT 'you',
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_thread ON messages (thread_id, id);

-- Calls, so the dialer has a history rather than a list that forgets.
CREATE TABLE IF NOT EXISTS call_log (
  id bigserial PRIMARY KEY,
  lead_id text REFERENCES agency_leads(id) ON DELETE CASCADE,
  customer_id text REFERENCES customers(id) ON DELETE SET NULL,
  to_number text,
  outcome text NOT NULL DEFAULT 'dialled',    -- dialled | answered | voicemail | no-answer
  seconds integer NOT NULL DEFAULT 0,
  note text,
  actor text NOT NULL DEFAULT 'you',
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_log_recent ON call_log (at DESC);

-- Agency-level tables: RLS on, no policy, no grant. ad_campaigns is customer
-- scoped and joins the tenant policy set.
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON partners, threads, messages, call_log FROM wrangler_tenant;

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON ad_campaigns TO wrangler_tenant;
DROP POLICY IF EXISTS tenant_isolation ON ad_campaigns;
CREATE POLICY tenant_isolation ON ad_campaigns FOR ALL TO wrangler_tenant
  USING (customer_id = current_setting('app.customer_id', true))
  WITH CHECK (customer_id = current_setting('app.customer_id', true));
