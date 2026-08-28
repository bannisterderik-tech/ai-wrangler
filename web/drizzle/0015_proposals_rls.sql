-- The proposals tables shipped without a wall.
--
-- 0002 revoked anon/authenticated on the tables that existed then; it cannot
-- cover tables created twelve migrations later. On Supabase, ALTER DEFAULT
-- PRIVILEGES hands anon/authenticated rights on new public tables, so these
-- four were reachable through PostgREST with the publishable key and no RLS to
-- stop the read.
--
-- What was exposed: signatures.email / ip / user_agent, which we keep precisely
-- because they are signing evidence, and proposals.token — the capability URL
-- that lets its holder sign the contract.
--
-- These are agency tables, not tenant tables. A client has no business reading
-- any of them, so the tenant role is revoked outright rather than given a policy.

ALTER TABLE proposals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures        ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_payments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON proposals, proposal_items, signatures, proposal_payments FROM wrangler_tenant;

DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON proposals, proposal_items, signatures, proposal_payments FROM anon, authenticated';
EXCEPTION WHEN undefined_object THEN
  -- Not Supabase; those roles do not exist here.
  NULL;
END $$;
