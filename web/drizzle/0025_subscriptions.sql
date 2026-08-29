-- Recurring revenue.
--
-- Every proposal already carries monthly_cents, the customer already signs for
-- it, and until now nothing ever charged it. The deposit was a one-off Checkout
-- and the retainer was collected by hand, outside the system that sold it.
--
-- One row per subscription, mirroring Stripe rather than deciding anything.
-- Stripe is the ledger; this is the copy the OS can read without a round trip,
-- and the thing that lets a screen answer "who is overdue" in one query.

CREATE TABLE IF NOT EXISTS subscriptions (
  id             text PRIMARY KEY,
  tenant_id      text NOT NULL DEFAULT 'ai-wrangler',
  customer_id    text REFERENCES customers(id) ON DELETE SET NULL,
  proposal_id    text REFERENCES proposals(id) ON DELETE SET NULL,

  -- Stripe's own ids. Unique so a redelivered webhook updates rather than
  -- inserting a second row — Stripe retries until it gets a 2xx.
  stripe_subscription_id text UNIQUE,
  stripe_customer_id     text,

  -- trialing | active | past_due | unpaid | canceled | incomplete | paused
  status         text NOT NULL DEFAULT 'incomplete',
  currency       text NOT NULL DEFAULT 'usd',
  monthly_cents  integer NOT NULL DEFAULT 0,

  -- What we have actually collected, and what we last failed to.
  collected_cents integer NOT NULL DEFAULT 0,
  invoices_paid   integer NOT NULL DEFAULT 0,
  failures        integer NOT NULL DEFAULT 0,
  last_failure    text,

  current_period_end timestamptz,
  started_at     timestamptz,
  canceled_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_tenant ON subscriptions (tenant_id, status);
CREATE INDEX IF NOT EXISTS subscriptions_customer ON subscriptions (customer_id);

-- Isolation is a column, not a vibe. Same wall as every other tenant table.
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscriptions_tenant_policy ON subscriptions;
CREATE POLICY subscriptions_tenant_policy ON subscriptions
  FOR ALL TO wrangler_tenant
  USING (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true))
  WITH CHECK (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true));

GRANT SELECT, INSERT, UPDATE, DELETE ON subscriptions TO wrangler_tenant;

-- Every invoice Stripe tells us about, kept so "collected" is a sum of facts
-- rather than a counter somebody incremented and hoped about.
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id              text PRIMARY KEY,
  subscription_id text REFERENCES subscriptions(id) ON DELETE CASCADE,
  customer_id     text REFERENCES customers(id) ON DELETE SET NULL,
  stripe_invoice_id text UNIQUE,
  amount_cents    integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'open',
  reason          text,
  hosted_url      text,
  paid_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_invoices_sub ON subscription_invoices (subscription_id, created_at DESC);

ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_invoices_tenant_policy ON subscription_invoices;
CREATE POLICY subscription_invoices_tenant_policy ON subscription_invoices
  FOR ALL TO wrangler_tenant
  USING (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true))
  WITH CHECK (customer_id IS NOT DISTINCT FROM current_setting('app.customer_id', true));

GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_invoices TO wrangler_tenant;
