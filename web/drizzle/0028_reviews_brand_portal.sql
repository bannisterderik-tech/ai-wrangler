-- Reviews, branding, and letting a client see their own conversations.

-- ---------------------------------------------------------------- reviews
--
-- What people say in public about a shop we run. Cached here rather than
-- fetched every time a screen opens, because the useful thing is not the list —
-- it is knowing which ones nobody has answered yet.
--
-- Replies are DRAFTED and approved by a person. Google overwrites a reply in
-- place and keeps no history, so a machine that answers a one-star review
-- unsupervised cannot be undone, only overwritten again by somebody upset.

CREATE TABLE IF NOT EXISTS reviews (
  id           text PRIMARY KEY,
  tenant_id    text NOT NULL DEFAULT 'ai-wrangler',
  customer_id  text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- google | facebook | other. The provider's own id, so re-syncing updates.
  source       text NOT NULL DEFAULT 'google',
  external_id  text NOT NULL,

  author       text,
  rating       integer,
  body         text,
  posted_at    timestamptz,

  -- What is already public, if anything.
  reply_text   text,
  replied_at   timestamptz,

  -- What we would say, waiting for a human. draft | approved | posted | skipped
  draft_text   text,
  draft_state  text NOT NULL DEFAULT 'none',
  draft_by     text,

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_source_external ON reviews (source, external_id);
CREATE INDEX IF NOT EXISTS reviews_customer ON reviews (customer_id, posted_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviews_tenant_policy ON reviews;
CREATE POLICY reviews_tenant_policy ON reviews
  FOR ALL TO wrangler_tenant
  USING (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true))
  WITH CHECK (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO wrangler_tenant;

-- ---------------------------------------------------------------- branding
--
-- Multi-tenancy without branding is a database feature, not a product somebody
-- can resell. These are the things a client actually sees: the name on the
-- proposal they sign, the colour of the button they click, the logo at the top
-- of the portal they log into.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_name text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_logo_url text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_accent text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_domain text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_from_email text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_support text;

-- ------------------------------------------------------------ the portal
--
-- threads, messages and call_log have had row level security ENABLED with no
-- policy since they were created. Postgres denies everything in that state, so
-- the client-facing desk could not read a single row — the feature was not
-- half-built, it was walled off from itself.
--
-- messages has no customer_id of its own, so its policy reaches the customer
-- through the thread it belongs to. That is the honest shape: a message is only
-- ever meaningful as part of a conversation.

DROP POLICY IF EXISTS threads_tenant_policy ON threads;
CREATE POLICY threads_tenant_policy ON threads
  FOR ALL TO wrangler_tenant
  USING (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true))
  WITH CHECK (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON threads TO wrangler_tenant;

DROP POLICY IF EXISTS messages_tenant_policy ON messages;
CREATE POLICY messages_tenant_policy ON messages
  FOR ALL TO wrangler_tenant
  USING (
    EXISTS (
      SELECT 1 FROM threads t
      WHERE t.id = messages.thread_id
        AND t.customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM threads t
      WHERE t.id = messages.thread_id
        AND t.customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true)
    )
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO wrangler_tenant;

DROP POLICY IF EXISTS call_log_tenant_policy ON call_log;
CREATE POLICY call_log_tenant_policy ON call_log
  FOR ALL TO wrangler_tenant
  USING (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true))
  WITH CHECK (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON call_log TO wrangler_tenant;
GRANT USAGE, SELECT ON SEQUENCE call_log_id_seq TO wrangler_tenant;

-- ------------------------------------------------------------- agent traces
--
-- Selling managed agents means answering "why did it do that". Spend and a
-- heartbeat say an agent is alive and what it cost; neither says what it saw or
-- what it chose. Twenty dollars once vanished into a polling loop because
-- nothing was watching closely enough to notice.

CREATE TABLE IF NOT EXISTS agent_traces (
  id           text PRIMARY KEY,
  tenant_id    text NOT NULL DEFAULT 'ai-wrangler',
  customer_id  text REFERENCES customers(id) ON DELETE CASCADE,
  person_id    text,
  job_id       text,

  -- What kind of thing happened: tool | model | decision | error | event
  kind         text NOT NULL,
  -- The tool name, the model, or a short name for the decision.
  name         text NOT NULL,
  -- What went in and what came back, both truncated. Enough to reconstruct a
  -- choice, not enough to become a second copy of the database.
  input        text,
  output       text,

  ok           boolean NOT NULL DEFAULT true,
  ms           integer NOT NULL DEFAULT 0,
  cost_millicents integer NOT NULL DEFAULT 0,
  at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_traces_customer ON agent_traces (customer_id, at DESC);
CREATE INDEX IF NOT EXISTS agent_traces_person ON agent_traces (person_id, at DESC);
CREATE INDEX IF NOT EXISTS agent_traces_tenant ON agent_traces (tenant_id, at DESC);

ALTER TABLE agent_traces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_traces_tenant_policy ON agent_traces;
CREATE POLICY agent_traces_tenant_policy ON agent_traces
  FOR ALL TO wrangler_tenant
  USING (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true))
  WITH CHECK (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_traces TO wrangler_tenant;

-- messages has a bigserial id, so the policy alone is not enough: without the
-- sequence the client desk is refused at "permission denied for sequence"
-- before RLS is ever consulted. Readable but unwritable is not a working desk,
-- and the refusal points at the wrong thing while you debug it.
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO wrangler_tenant;
