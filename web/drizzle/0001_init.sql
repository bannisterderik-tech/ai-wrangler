-- AI Wrangler — core tables. Every client-owned row carries customer_id.

CREATE TABLE IF NOT EXISTS customers (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  profile_json text
);

CREATE TABLE IF NOT EXISTS agency_connections (
  provider text PRIMARY KEY,
  mode text NOT NULL,
  encrypted_access text NOT NULL,
  login text,
  org text,
  user_json text,
  connected_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS connections (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  provider text NOT NULL,
  mode text NOT NULL,
  encrypted_access text NOT NULL,
  encrypted_refresh text,
  team_id text,
  team_name text,
  installation_id text,
  user_json text,
  token_prefix text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS conn_customer_provider ON connections (customer_id, provider);

CREATE TABLE IF NOT EXISTS bound_resources (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  provider text NOT NULL,
  resource_id text NOT NULL,
  name text NOT NULL,
  meta_json text
);
CREATE UNIQUE INDEX IF NOT EXISTS bound_unique ON bound_resources (customer_id, provider, resource_id);
-- One repo or project belongs to exactly one customer. No overlap, enforced by the database.
CREATE UNIQUE INDEX IF NOT EXISTS bound_no_overlap ON bound_resources (provider, resource_id);
CREATE INDEX IF NOT EXISTS bound_customer ON bound_resources (customer_id);

CREATE TABLE IF NOT EXISTS jobs (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL,
  harness text NOT NULL DEFAULT 'claude-code-mcp',
  tier text NOT NULL DEFAULT 'Medium brain',
  repo text,
  vercel_project_id text,
  spent_cents integer NOT NULL DEFAULT 0,
  budget_cents integer NOT NULL DEFAULT 1000,
  cache integer NOT NULL DEFAULT 60,
  transcript_json text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_customer ON jobs (customer_id);

CREATE TABLE IF NOT EXISTS approvals (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  job_id text REFERENCES jobs(id) ON DELETE SET NULL,
  title text NOT NULL,
  why text,
  payload text,
  irreversible boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS approvals_customer ON approvals (customer_id);

CREATE TABLE IF NOT EXISTS audit (
  id bigserial PRIMARY KEY,
  customer_id text,
  actor text NOT NULL,
  action text NOT NULL,
  target text,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memories (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memories_customer ON memories (customer_id);

CREATE TABLE IF NOT EXISTS inbox (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  from_name text NOT NULL,
  via text NOT NULL,
  at text NOT NULL,
  text text NOT NULL,
  task text NOT NULL,
  status text NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS changes (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title text NOT NULL,
  repo text,
  branch text,
  files integer NOT NULL DEFAULT 1,
  status text NOT NULL,
  diff text,
  expl text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orch_log (
  id bigserial PRIMARY KEY,
  customer_id text,
  tag text NOT NULL,
  text text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
  id text PRIMARY KEY,
  name text NOT NULL,
  value text NOT NULL,
  note text,
  stage integer NOT NULL DEFAULT 0
);
