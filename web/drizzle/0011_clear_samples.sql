-- Clear every seeded row. What is left should be what somebody actually entered.
--
-- The two operator logins survive because they are configuration, not sample
-- data: OPERATOR_EMAILS decides who may sign in, and deleting the rows would not
-- change that, it would only lose their scope and tokens.

DELETE FROM orch_log;
DELETE FROM deals;
DELETE FROM inbox;
DELETE FROM changes;
DELETE FROM approvals;
DELETE FROM job_steps;
DELETE FROM jobs;
DELETE FROM memories;
DELETE FROM lead_events;
DELETE FROM leads;
DELETE FROM client_requests;
DELETE FROM site_errors;
DELETE FROM metrics;

-- Seeded teammates and agents. The real ones get made on Sessions.
DELETE FROM people WHERE id IN ('U2', 'U3', 'U4') OR handle IN ('build-agent', 'maya', 'dev');
DELETE FROM people WHERE kind = 'agent' AND customer_id IS NULL;

-- The operator row keeps its identity but loses the seeded machine description.
UPDATE people SET machine = NULL WHERE id = 'U1';

-- The agency's own sales pipeline. Their leads are shops buying web and
-- technology from us — a different thing from `leads`, which is a customer's own
-- callers, and so a different table.
CREATE TABLE IF NOT EXISTS agency_leads (
  id text PRIMARY KEY,
  company text NOT NULL,
  contact text,
  phone text,
  email text,
  city text,
  trade text,
  source text,
  stage text NOT NULL DEFAULT 'new',        -- new | talking | proposal | won | lost
  value_cents integer NOT NULL DEFAULT 0,
  note text,
  owner_id text REFERENCES people(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_touch_at timestamptz
);

CREATE INDEX IF NOT EXISTS agency_leads_board ON agency_leads (stage, created_at DESC);

-- Agency-level, like people: RLS on, no policy, no grant. Nothing customer-scoped
-- may read who we are selling to.
ALTER TABLE agency_leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON agency_leads FROM wrangler_tenant;
