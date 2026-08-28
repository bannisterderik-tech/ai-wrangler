-- What an agent is actually doing, reported by the agent.
--
-- A VPS provider's API can tell you a box is powered on. That is the wrong
-- signal: during the $20 incident the box was up the entire time, idling on
-- Opus every two minutes and producing nothing, and any uptime dashboard would
-- have shown a healthy green light throughout.
--
-- So the worker reports in rather than us polling a vendor. It works on
-- Hostinger, Railway, a Hetzner box or a laptop, because it is an outbound POST
-- and needs no inbound port, no provider token and no firewall hole. And it
-- carries the things that actually mean "working": when a pass last finished,
-- what it cost, whether the spend was recorded, and what it is stuck on.
CREATE TABLE IF NOT EXISTS agent_health (
  person_id      text PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
  host           text,
  cli_version    text,
  -- Seconds the worker process has been alive, as it reported them.
  uptime_s       integer,
  passes         integer NOT NULL DEFAULT 0,
  last_pass_at   timestamptz,
  last_cost_usd  numeric(10,4),
  spent_usd      numeric(10,4) NOT NULL DEFAULT 0,
  ceiling_usd    numeric(10,4),
  -- ok | idle | stuck | unbilled | stopped
  state          text NOT NULL DEFAULT 'ok',
  detail         text,
  bare           boolean,
  resuming       boolean,
  at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_health_seen ON agent_health (at DESC);

ALTER TABLE agent_health ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON agent_health FROM wrangler_tenant;
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON agent_health FROM anon, authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
