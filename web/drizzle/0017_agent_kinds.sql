-- Two kinds of agent, and what each one needs to reach.
--
-- Until now an agent meant one thing: a build agent, pointed at a customer's
-- repository. A customer asking for a copilot to run four businesses needs
-- something different — not code, but reach into the systems the business
-- actually runs on: email, calendar, chat, the ERP, the project board.
--
-- The dependencies are recorded whether or not we can connect them yet, because
-- the first useful artefact is the list. A customer's tool sprawl is the thing
-- you have to see before you can quote it, and "declared" is honestly different
-- from "connected" — the status column keeps those apart rather than letting a
-- tidy screen imply an integration that does not exist.

ALTER TABLE people ADD COLUMN IF NOT EXISTS agent_kind text;
UPDATE people SET agent_kind = 'build' WHERE kind = 'agent' AND agent_kind IS NULL;

-- What the copilot is for, in the customer's words. A build agent has a repo;
-- a copilot has a job description.
ALTER TABLE people ADD COLUMN IF NOT EXISTS brief text;

CREATE TABLE IF NOT EXISTS agent_connections (
  id          text PRIMARY KEY,
  person_id   text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  -- From the catalog in src/lib/connectors.ts.
  provider    text NOT NULL,
  -- Which account: "Synergy Innovation" vs "Personal". Van has both.
  label       text,
  -- needed | connected | blocked | dropped
  status      text NOT NULL DEFAULT 'needed',
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- One row per provider per account per agent.
CREATE UNIQUE INDEX IF NOT EXISTS agent_connections_one
  ON agent_connections (person_id, provider, COALESCE(label, ''));
CREATE INDEX IF NOT EXISTS agent_connections_person ON agent_connections (person_id, status);

ALTER TABLE agent_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON agent_connections FROM wrangler_tenant;
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON agent_connections FROM anon, authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
