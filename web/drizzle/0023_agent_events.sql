-- What wakes a copilot.
--
-- The build worker polls for jobs. A copilot has none, so it had nothing to do
-- all day — and polling is what cost $20: a full model session every two
-- minutes to be told there was nothing.
--
-- Events invert that. Nothing runs until something happens, so idle is one
-- cheap HTTP call rather than a paid session. And the sources that matter most
-- already arrive here without any third-party connector: a site error, a
-- request from the client, a call, a lead touched, the customer typing into
-- their own copilot. Their mail and their ERP add to this list; they do not
-- change its shape.
CREATE TABLE IF NOT EXISTS agent_events (
  id          text PRIMARY KEY,
  person_id   text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  customer_id text REFERENCES customers(id) ON DELETE CASCADE,
  -- site_error | client_request | call | lead | message | external
  kind        text NOT NULL,
  -- Where it came from, in words a person would use.
  source      text,
  -- The row it is about, so the copilot can go and read it.
  ref_id      text,
  summary     text NOT NULL,
  payload     text,
  -- queued | taken | done | ignored | failed
  status      text NOT NULL DEFAULT 'queued',
  created_at  timestamptz NOT NULL DEFAULT now(),
  taken_at    timestamptz,
  done_at     timestamptz,
  result      text
);

CREATE INDEX IF NOT EXISTS agent_events_queue ON agent_events (person_id, status, created_at);
-- One event per underlying row per copilot. A site error seen five times is one
-- thing to react to, not five model runs.
CREATE UNIQUE INDEX IF NOT EXISTS agent_events_once
  ON agent_events (person_id, kind, ref_id) WHERE ref_id IS NOT NULL;

ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON agent_events FROM wrangler_tenant;
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON agent_events FROM anon, authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Which kinds each copilot should be woken for. Absent means all of them.
ALTER TABLE people ADD COLUMN IF NOT EXISTS wakes_on text;
