-- An agent is not a teammate.
--
-- A teammate is a person: they bring their own Claude Code, and they work across
-- whatever customers they are scoped to. An agent is per project. It has no
-- human, and it must never be able to see a second customer — that is the whole
-- product.
--
-- So scope stops being a list you maintain for an agent and becomes a column.
-- One customer, by the schema, the same way a client user works. There is no
-- toggle to forget.

ALTER TABLE people DROP CONSTRAINT IF EXISTS people_kind_scope;
ALTER TABLE people ADD CONSTRAINT people_kind_scope CHECK (
  (kind = 'client'   AND customer_id IS NOT NULL) OR
  (kind = 'agent'    AND customer_id IS NOT NULL) OR
  (kind = 'operator' AND customer_id IS NULL)
);

-- An agent has no inbox, so it has no email and cannot be sent a magic link.
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_agent_has_no_email;
ALTER TABLE people ADD CONSTRAINT people_agent_has_no_email CHECK (
  kind <> 'agent' OR email IS NULL
);

CREATE INDEX IF NOT EXISTS people_agents ON people (customer_id) WHERE kind = 'agent';
