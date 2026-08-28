-- A switch that stops every agent, from the OS.
--
-- Stopping the worker used to mean deleting a Railway service. That is the one
-- thing this product exists to make unnecessary, and it is the thing you most
-- need at 2am when a container is burning money.
--
-- Stored as a row rather than an environment variable so it takes effect on the
-- next poll instead of on the next deploy.
CREATE TABLE IF NOT EXISTS floor_switches (
  id          text PRIMARY KEY,
  on_at       timestamptz,
  reason      text,
  actor       text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE floor_switches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON floor_switches FROM wrangler_tenant;
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON floor_switches FROM anon, authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

INSERT INTO floor_switches (id, on_at, reason) VALUES ('agents_paused', NULL, NULL)
  ON CONFLICT (id) DO NOTHING;
