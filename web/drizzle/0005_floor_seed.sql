-- Seed the floor so a fresh database is walkable: one operator, three teammates,
-- and jobs that actually have owners, gates and transcripts.
--
-- Session tokens are NOT seeded. A person starts with no token_hash and status
-- 'invited'; the operator mints one on the Sessions screen and it is shown once.
-- Seeding a known token would put a working credential in a public repo.

INSERT INTO people (id, name, handle, role, approver, machine, status) VALUES
  ('U1', 'You',            'derik',   'Operator',       true,  'this machine',            'invited'),
  ('U2', 'Marisol Vega',   'marisol', 'Build wrangler', false, 'not connected yet',       'invited'),
  ('U3', 'Theo Ruiz',      'theo',    'Local + ads',    false, 'not connected yet',       'invited'),
  ('U4', 'Priya Nandan',   'priya',   'Build wrangler', false, 'not connected yet',       'invited')
ON CONFLICT (id) DO NOTHING;

-- Scope: who may mount which customer. The operator sees everything; the others
-- get the accounts they actually run.
INSERT INTO person_scopes (person_id, customer_id)
  SELECT 'U1', id FROM customers
ON CONFLICT DO NOTHING;

-- Teammates get a slice of the book, not all of it. Picked by position so this
-- seed works against whatever customers the base seed created.
INSERT INTO person_scopes (person_id, customer_id)
SELECT p.person_id, c.id
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS n FROM customers
) c
JOIN (VALUES ('U2', 1), ('U2', 2), ('U3', 2), ('U3', 3), ('U4', 1)) AS p(person_id, n)
  ON p.n = c.n
ON CONFLICT DO NOTHING;

-- Tool grants. Everyone can look and claim; open_branch and request_approval are
-- deliberately not automatic, and only the operator may release someone else's work.
INSERT INTO person_tools (person_id, tool)
SELECT p.id, t.tool
FROM (VALUES ('U1'), ('U2'), ('U3'), ('U4')) AS p(id)
CROSS JOIN (VALUES ('list_jobs'), ('claim_job'), ('read_bound_repo'), ('post_step')) AS t(tool)
ON CONFLICT DO NOTHING;

INSERT INTO person_tools (person_id, tool)
SELECT p.id, t.tool
FROM (VALUES ('U1'), ('U2'), ('U3')) AS p(id)
CROSS JOIN (VALUES ('open_branch'), ('request_approval')) AS t(tool)
ON CONFLICT DO NOTHING;

INSERT INTO person_tools (person_id, tool) VALUES ('U1', 'release_job')
ON CONFLICT DO NOTHING;

-- Give the seeded jobs an owner, an agent and the fields the floor renders.
UPDATE jobs SET
  owner_id    = COALESCE(owner_id, 'U1'),
  agent       = COALESCE(agent, 'wrangler-agent'),
  goal        = COALESCE(goal, 'Ship the thing this customer is paying us for.'),
  scope_note  = COALESCE(scope_note, 'Site · number · local'),
  risk        = COALESCE(risk, 'Preview only. Production is a separate approval.')
WHERE agent IS NULL OR owner_id IS NULL;

-- One job nobody owns, so the board is never empty and "unclaimed" is real.
INSERT INTO jobs (id, customer_id, title, status, agent, goal, scope_note, risk, budget_cents, spent_cents)
SELECT
  'job_unclaimed_seed',
  id,
  'Service-area pages — re-run against the right content source',
  'thinking',
  'local-agent',
  'Same build we shipped elsewhere, pointed at this customer''s real service list — which is what went wrong the first time.',
  'Service-area pages · schema',
  'Read-only until somebody claims it.',
  1200,
  0
FROM customers
ORDER BY created_at, id
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- A transcript for every job that has none, so the floor is not blank on first run.
INSERT INTO job_steps (job_id, customer_id, kind, text, actor)
SELECT j.id, j.customer_id, 'think', 'Picked up from the seed. Read the customer record before doing anything.', 'system'
FROM jobs j
WHERE NOT EXISTS (SELECT 1 FROM job_steps s WHERE s.job_id = j.id);
