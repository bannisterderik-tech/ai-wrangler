-- Recall.
--
-- read_project handed the agent the newest 30 memories by date, relevant or
-- not, on every pass. This makes memories searchable so a job can be given the
-- notes that bear on it.
--
-- Lexical search works today with no new vendor. Embeddings are optional and
-- arrive later: Anthropic has no embeddings endpoint and OpenRouter does not
-- expose one, so semantic recall means a third API key, and the OS should be
-- useful before anyone pays for that.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE memories ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'note';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS source text;
-- Stored as jsonb rather than vector(n): pgvector is not present on every
-- Postgres this runs on, and a migration that assumes it would fail at boot on
-- the ones where it is missing. At this row count an exact scan beats an index
-- we cannot guarantee exists.
ALTER TABLE memories ADD COLUMN IF NOT EXISTS embedding jsonb;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS embedding_model text;

-- Lexical rank. Generated, so it cannot drift from the text it describes.
ALTER TABLE memories ADD COLUMN IF NOT EXISTS tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(text, ''))) STORED;

CREATE INDEX IF NOT EXISTS memories_tsv_idx ON memories USING gin (tsv);
CREATE INDEX IF NOT EXISTS memories_trgm_idx ON memories USING gin (text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS memories_customer_idx ON memories (customer_id, created_at DESC);
