-- Two audiences on one OS.
--
-- Until now `people` meant agency staff and every session saw everything. A
-- client user is the same kind of row with a customer_id on it, and that column
-- is what the whole tenancy hangs off: their session pins app.customer_id, and
-- the RLS policies written in 0002 do the rest. Wall three stops being a proof
-- and starts being the product.

ALTER TABLE people ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS customer_id text REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE people ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'operator';

-- One login, one person. Case is folded so Maya@ and maya@ are the same human.
CREATE UNIQUE INDEX IF NOT EXISTS people_email ON people (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS people_customer ON people (customer_id) WHERE customer_id IS NOT NULL;

-- A client row must name its customer; an operator row must not.
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_kind_scope;
ALTER TABLE people ADD CONSTRAINT people_kind_scope CHECK (
  (kind = 'client' AND customer_id IS NOT NULL) OR
  (kind = 'operator' AND customer_id IS NULL)
);

-- The client's own CRM. These are THEIR leads — the people who call them — not
-- our sales pipeline. Different business, different table.
CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  source text,
  stage text NOT NULL DEFAULT 'new',          -- new | contacted | quoted | won | lost
  value_cents integer NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_touch_at timestamptz
);

CREATE INDEX IF NOT EXISTS leads_board ON leads (customer_id, stage, created_at DESC);

-- Calls, texts, emails and notes against a lead. One table: they are all "a
-- thing that happened with this person", and splitting them makes every timeline
-- a three-way union for no gain.
CREATE TABLE IF NOT EXISTS lead_events (
  id bigserial PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  lead_id text NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  kind text NOT NULL,                          -- call | sms | email | note
  direction text NOT NULL DEFAULT 'out',       -- in | out
  body text,
  duration_s integer,
  actor text NOT NULL DEFAULT 'ai',            -- ai | the client's own name
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_events_timeline ON lead_events (customer_id, lead_id, at DESC);

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leads','lead_events'] LOOP
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

GRANT USAGE, SELECT ON SEQUENCE lead_events_id_seq TO wrangler_tenant;

-- Existing staff are operators; give the two admins their login addresses.
UPDATE people SET kind = 'operator' WHERE kind IS NULL;
UPDATE people SET email = 'derik@aiwrangler.co' WHERE id = 'U1' AND email IS NULL;
