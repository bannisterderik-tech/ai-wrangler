-- The customer's own conversation with their copilot.
--
-- Walled like every other tenant table: a customer reads and writes their own
-- thread and cannot see that anyone else has one.
--
-- Note what is deliberately absent: any column that would let the copilot act.
-- It answers from what it can read, and anything requiring a hand becomes a row
-- in client_requests for a human. An agent that reads a customer's mail is
-- reading untrusted text — anyone can send them an email containing
-- instructions — so the protection has to be that it holds no capability to
-- misuse, not that it was asked nicely in a prompt.
CREATE TABLE IF NOT EXISTS copilot_messages (
  id           text PRIMARY KEY,
  customer_id  text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  -- them | copilot
  who          text NOT NULL,
  body         text NOT NULL,
  -- What it looked at to answer, so an answer can be checked rather than trusted.
  looked_at    text,
  -- Cost of the reply in cents, so a chat cannot quietly become the new $20.
  cents        integer NOT NULL DEFAULT 0,
  at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS copilot_messages_thread ON copilot_messages (customer_id, at);

ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON copilot_messages;
CREATE POLICY tenant_isolation ON copilot_messages FOR ALL TO wrangler_tenant
  USING (customer_id = current_setting('app.customer_id', true))
  WITH CHECK (customer_id = current_setting('app.customer_id', true));
GRANT SELECT, INSERT ON copilot_messages TO wrangler_tenant;

DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON copilot_messages FROM anon, authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
