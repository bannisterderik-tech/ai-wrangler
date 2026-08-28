-- The layer above the agency.
--
-- Until now there was exactly one agency — us — and everything agency-level
-- (leads, proposals, partners, and the customers themselves) sat in one pool
-- with nothing separating it. That is correct for one agency and a total leak
-- for two, so it has to exist before the second one signs up rather than after.
--
-- The shape:
--
--   tenant            an agency account. AI Wrangler is the first one.
--     operators       their staff
--     agency_leads    their pipeline
--     proposals       their quotes
--     partners        their franchisees
--     customers       THEIR clients — and everything already walled per
--                     customer keeps working underneath, unchanged.
--
-- can_build is the switch this was actually asked for: a CRM tenant works their
-- own leads and never sees the floor, the agents, the repositories or the
-- deploys. It is a column rather than a role name because it is a capability,
-- and capabilities get sold separately.

CREATE TABLE IF NOT EXISTS tenants (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  -- Does this account get the AI building half at all?
  can_build   boolean NOT NULL DEFAULT false,
  status      text NOT NULL DEFAULT 'active',
  plan        text,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Us. Everything that exists today belongs here.
INSERT INTO tenants (id, name, can_build, plan, note)
VALUES ('ai-wrangler', 'AI Wrangler', true, 'owner', 'The house account. Everything that existed before tenants belongs to it.')
ON CONFLICT (id) DO UPDATE SET can_build = true;

-- Every agency-level table gains an owner, defaulted to us so nothing moves.
ALTER TABLE people        ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'ai-wrangler' REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE customers     ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'ai-wrangler' REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE agency_leads  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'ai-wrangler' REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE proposals     ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'ai-wrangler' REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE partners      ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'ai-wrangler' REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE threads       ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'ai-wrangler' REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE call_log      ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'ai-wrangler' REFERENCES tenants(id) ON DELETE CASCADE;

-- Which of an account's people can administer it, and which account owns the
-- product itself. 'owner' is us; 'admin' runs one tenant; 'operator' works in it.
ALTER TABLE people ADD COLUMN IF NOT EXISTS tenant_role text NOT NULL DEFAULT 'operator';

-- The house operators are owners.
UPDATE people SET tenant_role = 'owner'
WHERE kind = 'operator' AND tenant_id = 'ai-wrangler';

CREATE INDEX IF NOT EXISTS people_tenant      ON people (tenant_id, kind);
CREATE INDEX IF NOT EXISTS customers_tenant   ON customers (tenant_id);
CREATE INDEX IF NOT EXISTS agency_leads_tenant ON agency_leads (tenant_id, stage);
CREATE INDEX IF NOT EXISTS proposals_tenant   ON proposals (tenant_id);
CREATE INDEX IF NOT EXISTS partners_tenant    ON partners (tenant_id);

-- A customer id is a slug and two tenants may both have an "acme".
DROP INDEX IF EXISTS customers_tenant_name;
CREATE UNIQUE INDEX customers_tenant_name ON customers (tenant_id, id);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tenants FROM wrangler_tenant;
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON tenants FROM anon, authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
