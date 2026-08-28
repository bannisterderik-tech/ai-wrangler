-- Where a customer's own credentials live.
--
-- agent_connections recorded WHICH systems a copilot needs. It had no field for
-- the secret that actually reaches them, so a copilot could be fully mapped and
-- still unable to read a single email.
--
-- Encrypted with the same vault as every other customer token, and delivered to
-- exactly one place: the machine running that customer's copilot. It is never
-- returned by an API, never rendered, and never sent to a machine running
-- anybody else's copilot — which is the whole argument for a box per client. A
-- copilot holds a business's mail, calendar and books; on a shared app server
-- one bug exposes every customer's, and on its own box a compromise stops at
-- the one it belongs to.
ALTER TABLE agent_connections ADD COLUMN IF NOT EXISTS encrypted_secret text;
ALTER TABLE agent_connections ADD COLUMN IF NOT EXISTS secret_kind text;
ALTER TABLE agent_connections ADD COLUMN IF NOT EXISTS secret_set_at timestamptz;
ALTER TABLE agent_connections ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Where this copilot actually runs, so a secret can only go to its own box.
ALTER TABLE people ADD COLUMN IF NOT EXISTS host_id text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS host_provider text;
