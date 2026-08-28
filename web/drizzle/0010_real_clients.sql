-- The real book. Brightline, Harbor & Co and Atlas Labs were seed data to make
-- the screens walkable; they are not customers and they should not be sitting in
-- the list next to people who pay.
--
-- Deletes cascade: a demo customer takes its jobs, steps, leads, approvals,
-- changes, memories, bindings and any client user or agent scoped to it. That is
-- intended — none of it was real either. An agent bound to a demo customer goes
-- with it, so make the new agents against these rows.

INSERT INTO customers (id, name) VALUES
  ('red-bank-outfitters',   'Red Bank Outfitters'),
  ('tehama-family-fitness', 'Tehama Family Fitness'),
  ('dudleys-excavating',    'Dudleys Excavating, Inc.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Operators see every customer, so the two admins pick these up automatically.
INSERT INTO person_scopes (person_id, customer_id)
SELECT p.id, c.id
FROM people p
CROSS JOIN customers c
WHERE p.kind = 'operator'
  AND c.id IN ('red-bank-outfitters', 'tehama-family-fitness', 'dudleys-excavating')
ON CONFLICT DO NOTHING;

DELETE FROM customers WHERE id IN ('brightline', 'harbor-and-co', 'atlas-labs');

-- 0003 and 0005 seeded those demo rows and would put them back on a fresh
-- database. Leaving this migration last means they are created and then removed,
-- which is correct but noisy; the seeds are left alone rather than rewritten so
-- the migration history stays honest about what happened.
