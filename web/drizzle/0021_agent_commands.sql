-- Maintaining a client's agent without opening a terminal.
--
-- A managed agent runs on somebody else's behalf, on a box the client never
-- sees, and the work of keeping it alive is ours. Until now that meant SSH:
-- restart it, move it to a newer Claude Code, change how often it wakes. Every
-- one of those is a click's worth of intent and a shell session's worth of risk.
--
-- The command set is a FIXED enum, deliberately. A channel that can run
-- arbitrary shell on a client's box is not maintenance, it is a backdoor with
-- an audit trail. Everything here is a verb the worker already knows how to do.
CREATE TABLE IF NOT EXISTS agent_commands (
  id          text PRIMARY KEY,
  person_id   text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  -- restart | update | reload | run_now | pause | resume | diagnose
  command     text NOT NULL,
  args        text,
  issued_by   text NOT NULL,
  issued_at   timestamptz NOT NULL DEFAULT now(),
  -- queued | taken | done | failed
  status      text NOT NULL DEFAULT 'queued',
  taken_at    timestamptz,
  done_at     timestamptz,
  result      text
);

CREATE INDEX IF NOT EXISTS agent_commands_queue ON agent_commands (person_id, status, issued_at);

ALTER TABLE agent_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON agent_commands FROM wrangler_tenant;
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON agent_commands FROM anon, authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
