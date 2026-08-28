-- What an agent needs before it can touch anything: the intake that creates work,
-- and the context that makes the work correct.
--
-- All three tables are customer-scoped, so they join the tenant policy set and a
-- query written wrong still cannot read another customer's rows.

-- Update requests, from the client. "Can you add a booking page." Becomes a job.
CREATE TABLE IF NOT EXISTS client_requests (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  from_name text,
  from_email text,
  kind text NOT NULL DEFAULT 'request',      -- request | bug | question
  body text NOT NULL,
  status text NOT NULL DEFAULT 'new',        -- new | jobbed | answered | closed
  job_id text REFERENCES jobs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_requests_open ON client_requests (customer_id, status, created_at DESC);

-- Errors, from the customer's deployed site. Deduplicated by fingerprint so one
-- broken route is one row with a count, not ten thousand rows.
CREATE TABLE IF NOT EXISTS site_errors (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  fingerprint text NOT NULL,
  message text NOT NULL,
  url text,
  stack text,
  count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'open',       -- open | jobbed | fixed | ignored
  job_id text REFERENCES jobs(id) ON DELETE SET NULL,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now()
);

-- One row per distinct error per customer. The count is what moves.
CREATE UNIQUE INDEX IF NOT EXISTS site_errors_fingerprint ON site_errors (customer_id, fingerprint);
CREATE INDEX IF NOT EXISTS site_errors_hot ON site_errors (customer_id, status, count DESC);

-- Ads and performance, as a flat time series. Whatever the source, one shape, so
-- read_project can hand an agent "how is this customer doing" without a join per
-- vendor.
CREATE TABLE IF NOT EXISTS metrics (
  id bigserial PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  source text NOT NULL,                      -- ads | web | gbp | phone
  name text NOT NULL,                        -- cpl | spend | leads | lcp | rank | calls
  value numeric NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS metrics_recent ON metrics (customer_id, source, name, at DESC);

-- A write-only key their deployed site uses to post errors. It ships in their
-- frontend, so it is not a secret — it is a routing token that says which
-- customer this error belongs to, and it can do nothing else. Stored as a digest
-- like every other credential here.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ingest_key_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS customers_ingest_key ON customers (ingest_key_hash) WHERE ingest_key_hash IS NOT NULL;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['client_requests','site_errors','metrics'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO wrangler_tenant', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I FOR ALL TO wrangler_tenant
         USING (customer_id = current_setting(''app.customer_id'', true))
         WITH CHECK (customer_id = current_setting(''app.customer_id'', true))', t);
  END LOOP;
END
$$;

GRANT USAGE, SELECT ON SEQUENCE metrics_id_seq TO wrangler_tenant;
