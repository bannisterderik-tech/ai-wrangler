-- Magic-link sign in.
--
-- The link has to be single use, so the token lives in the database and gets
-- burned on redemption. A signed-but-stateless token cannot be revoked, and an
-- email sits in a mailbox — and in a mail provider's logs — long after it was
-- read. Only the SHA-256 is stored, same as a session token.

CREATE TABLE IF NOT EXISTS login_links (
  token_hash text PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  requested_from text
);

CREATE INDEX IF NOT EXISTS login_links_email ON login_links (email, created_at DESC);

-- Agency-level. RLS on, no policy, no grant — nothing customer-scoped may read
-- who signs in here, or when.
ALTER TABLE login_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON login_links FROM wrangler_tenant;

DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON login_links FROM %I', r);
    END IF;
  END LOOP;
END
$$;
