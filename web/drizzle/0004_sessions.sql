-- The floor: people bring their own Claude Code, jobs get an owner, and every
-- step an agent takes is a row instead of a blob.
--
-- people / person_scopes / person_tools are agency-level. Like agency_connections
-- they get RLS on with no policy and no grant: nothing customer-scoped may read
-- who works here or what their session token hashes to.

CREATE TABLE IF NOT EXISTS people (
  id text PRIMARY KEY,
  name text NOT NULL,
  handle text NOT NULL,
  role text NOT NULL DEFAULT 'Build wrangler',
  approver boolean NOT NULL DEFAULT false,
  machine text,
  status text NOT NULL DEFAULT 'invited',       -- invited | connected | idle | revoked
  client_version text,
  -- The session token is never stored. We keep a SHA-256 of it and a display
  -- prefix; the plaintext is returned once, at creation or rotation.
  token_hash text,
  token_prefix text,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS people_handle ON people (handle);
-- One token, one person, even under a race — the same shape as bound_no_overlap.
CREATE UNIQUE INDEX IF NOT EXISTS people_token_hash ON people (token_hash) WHERE token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS person_scopes (
  person_id text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, customer_id)
);

CREATE TABLE IF NOT EXISTS person_tools (
  person_id text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  tool text NOT NULL,
  PRIMARY KEY (person_id, tool)
);

-- Jobs grow an owner and the fields the floor actually renders.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS owner_id text REFERENCES people(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS agent text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS branch text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS preview_url text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS goal text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scope_note text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS risk text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

CREATE INDEX IF NOT EXISTS jobs_owner ON jobs (owner_id);
CREATE INDEX IF NOT EXISTS jobs_status ON jobs (status);

-- A transcript is rows, not a JSON blob, so a session can append to it while
-- somebody else is reading it.
CREATE TABLE IF NOT EXISTS job_steps (
  id bigserial PRIMARY KEY,
  job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  kind text NOT NULL,                            -- think | tool | gate | done
  text text NOT NULL,
  actor text NOT NULL DEFAULT 'agent',
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_steps_job ON job_steps (job_id, id);

-- Approvals need to say who asked and how big the blast is.
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS asked_by text;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS blast text;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS cost text;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS guard text;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS decided_at timestamptz;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS decided_by text;

-- job_steps is customer-scoped, so it joins the tenant policy set.
ALTER TABLE job_steps ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON job_steps TO wrangler_tenant;
GRANT USAGE, SELECT ON SEQUENCE job_steps_id_seq TO wrangler_tenant;
DROP POLICY IF EXISTS tenant_isolation ON job_steps;
CREATE POLICY tenant_isolation ON job_steps FOR ALL TO wrangler_tenant
  USING (customer_id = current_setting('app.customer_id', true))
  WITH CHECK (customer_id = current_setting('app.customer_id', true));

-- Agency-only. RLS on, no policy, no grant — same treatment as agency_connections.
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_tools ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON people FROM wrangler_tenant;
REVOKE ALL ON person_scopes FROM wrangler_tenant;
REVOKE ALL ON person_tools FROM wrangler_tenant;

DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
    END IF;
  END LOOP;
END
$$;
