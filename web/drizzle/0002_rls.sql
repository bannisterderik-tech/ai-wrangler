-- Row level security. The wall is in Postgres, not only in our route handlers.
--
-- Two roles matter:
--   owner (DATABASE_URL)  — the agency control plane. Sees every customer, by design.
--   wrangler_tenant       — what customer-scoped work runs as (see withCustomer in src/lib/db.ts).
--                           RLS pins it to one customer_id for the length of a transaction.
-- Supabase's API roles (anon, authenticated) get nothing: RLS is on and no policy names them.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wrangler_tenant') THEN
    CREATE ROLE wrangler_tenant NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO wrangler_tenant;

-- Tenant tables: RLS on, and one policy keyed to the pinned customer.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'connections','bound_resources','jobs','approvals','audit','memories','inbox','changes','orch_log'
  ] LOOP
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

-- The customer row itself: a tenant sees only its own.
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON customers TO wrangler_tenant;
DROP POLICY IF EXISTS tenant_isolation ON customers;
CREATE POLICY tenant_isolation ON customers FOR ALL TO wrangler_tenant
  USING (id = current_setting('app.customer_id', true))
  WITH CHECK (id = current_setting('app.customer_id', true));

-- Agency-only tables: RLS on, no policy, no grant. Nothing tenant-scoped may read them.
ALTER TABLE agency_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON agency_connections FROM wrangler_tenant;
REVOKE ALL ON deals FROM wrangler_tenant;

-- Serial ids on audit / orch_log need their sequences.
GRANT USAGE, SELECT ON SEQUENCE audit_id_seq TO wrangler_tenant;
GRANT USAGE, SELECT ON SEQUENCE orch_log_id_seq TO wrangler_tenant;

-- Supabase PostgREST roles: never expose the control plane over the public API.
DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON SCHEMA public FROM %I', r);
    END IF;
  END LOOP;
END
$$;
