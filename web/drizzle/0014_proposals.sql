-- Quote to cash.
--
-- A lead gets a proposal. They accept it, sign it, and pay a deposit — and the
-- deposit is what turns them into a customer, because money changing hands is
-- the only signal worth trusting for that.
--
-- The signature row is evidence. ESIGN/UETA want intent, attribution and an
-- unaltered record, so we keep what was signed (a hash of the exact rendered
-- document), who signed it, from where, and when. A signature that cannot be
-- tied to a specific document version proves nothing.

CREATE TABLE IF NOT EXISTS proposals (
  id              text PRIMARY KEY,
  lead_id         text NOT NULL REFERENCES agency_leads(id) ON DELETE CASCADE,
  title           text NOT NULL,
  summary         text,
  -- The contract body as sent. Frozen at send time: editing a sent proposal
  -- would change what somebody already agreed to.
  terms           text,
  status          text NOT NULL DEFAULT 'draft',

  -- Money, in cents, integer only.
  currency        text NOT NULL DEFAULT 'usd',
  once_cents      integer NOT NULL DEFAULT 0,
  monthly_cents   integer NOT NULL DEFAULT 0,
  -- Deposit settings, decided before sending. Either a percentage of the
  -- one-time total or a flat amount; never both.
  deposit_kind    text NOT NULL DEFAULT 'percent',
  deposit_pct     integer NOT NULL DEFAULT 50,
  deposit_cents   integer NOT NULL DEFAULT 0,

  -- The capability URL. One proposal's worth of access, nothing else. Stored as
  -- issued rather than hashed because the operator has to be able to re-open and
  -- re-send the same link; a hash would make every resend a new link and break
  -- the one already in the client's inbox.
  token           text UNIQUE,
  sent_at         timestamptz,
  viewed_at       timestamptz,
  expires_at      timestamptz,
  declined_at     timestamptz,
  decline_reason  text,

  -- Set once the deposit clears. One customer per proposal, enforced below.
  customer_id     text REFERENCES customers(id) ON DELETE SET NULL,
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proposals_lead_idx ON proposals (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals (status, created_at DESC);

CREATE TABLE IF NOT EXISTS proposal_items (
  id            text PRIMARY KEY,
  proposal_id   text NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  name          text NOT NULL,
  detail        text,
  -- 'once' or 'monthly'. A retainer and a build are not the same line.
  cadence       text NOT NULL DEFAULT 'once',
  qty           integer NOT NULL DEFAULT 1,
  unit_cents    integer NOT NULL DEFAULT 0,
  sort          integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS proposal_items_idx ON proposal_items (proposal_id, sort);

-- One signature per proposal. Re-signing is a new proposal, not an overwrite:
-- an amended agreement must not quietly replace the evidence for the old one.
CREATE TABLE IF NOT EXISTS signatures (
  id             text PRIMARY KEY,
  proposal_id    text NOT NULL UNIQUE REFERENCES proposals(id) ON DELETE CASCADE,
  typed_name     text NOT NULL,
  email          text,
  ip             text,
  user_agent     text,
  -- SHA-256 of the exact document text the signer was shown.
  document_hash  text NOT NULL,
  signed_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposal_payments (
  id            text PRIMARY KEY,
  proposal_id   text NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  provider      text NOT NULL DEFAULT 'stripe',
  -- Stripe's ids. Unique so a retried webhook cannot bank the same money twice.
  session_id    text,
  intent_id     text,
  amount_cents  integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pending',
  paid_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS proposal_payments_session ON proposal_payments (session_id)
  WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS proposal_payments_proposal ON proposal_payments (proposal_id, created_at DESC);

-- A proposal converts at most one lead into at most one customer. Webhooks
-- retry, so idempotency is the index's job, not the handler's memory.
CREATE UNIQUE INDEX IF NOT EXISTS proposals_one_customer ON proposals (customer_id)
  WHERE customer_id IS NOT NULL;
