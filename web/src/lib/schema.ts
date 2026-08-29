import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Every row that is client-owned MUST have customerId. Isolation is a column, not a vibe. */
/**
 * An agency account. The layer above everything else.
 *
 * AI Wrangler is the first one; a SaaS customer is another. can_build is the
 * capability switch: a CRM-only tenant works its own leads and never sees the
 * floor, the agents, the repositories or the deploys.
 */
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  canBuild: boolean("can_build").notNull().default(false),
  status: text("status").notNull().default("active"),
  plan: text("plan"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
    /** Which agency account owns this row. */
    tenantId: text("tenant_id").notNull().default("ai-wrangler"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  profileJson: text("profile_json"),
  /** SHA-256 of the write-only key their site posts errors with. */
  ingestKeyHash: text("ingest_key_hash"),
});

/** Agency-level (not per-customer): which GitHub account Wrangler uses. */
export const agencyConnections = pgTable("agency_connections", {
  provider: text("provider").primaryKey(),
  mode: text("mode").notNull(),
  encryptedAccess: text("encrypted_access").notNull(),
  login: text("login"),
  org: text("org"),
  userJson: text("user_json"),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
});

export const connections = pgTable(
  "connections",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // vercel | github | supabase
    mode: text("mode").notNull(), // integration | pat | github-app
    encryptedAccess: text("encrypted_access").notNull(),
    encryptedRefresh: text("encrypted_refresh"),
    teamId: text("team_id"),
    teamName: text("team_name"),
    installationId: text("installation_id"),
    userJson: text("user_json"),
    tokenPrefix: text("token_prefix"),
    connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("conn_customer_provider").on(t.customerId, t.provider)],
);

export const boundResources = pgTable(
  "bound_resources",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    resourceId: text("resource_id").notNull(),
    name: text("name").notNull(),
    metaJson: text("meta_json"),
  },
  (t) => [
    uniqueIndex("bound_unique").on(t.customerId, t.provider, t.resourceId),
    /** One resource, one customer. The overlap refusal is a database constraint, not a code path. */
    uniqueIndex("bound_no_overlap").on(t.provider, t.resourceId),
    index("bound_customer").on(t.customerId),
  ],
);

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull(),
  harness: text("harness").notNull().default("claude-code-mcp"),
  tier: text("tier").notNull().default("Medium brain"),
  repo: text("repo"),
  vercelProjectId: text("vercel_project_id"),
  spentCents: integer("spent_cents").notNull().default(0),
  budgetCents: integer("budget_cents").notNull().default(1000),
  cache: integer("cache").notNull().default(60),
  transcriptJson: text("transcript_json"),
  ownerId: text("owner_id"),
  agent: text("agent"),
  branch: text("branch"),
  previewUrl: text("preview_url"),
  goal: text("goal"),
  scopeNote: text("scope_note"),
  risk: text("risk"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const approvals = pgTable("approvals", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  jobId: text("job_id").references(() => jobs.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  why: text("why"),
  payload: text("payload"),
  irreversible: boolean("irreversible").notNull().default(false),
  status: text("status").notNull().default("pending"),
  askedBy: text("asked_by"),
  blast: text("blast"),
  cost: text("cost"),
  guard: text("guard"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: text("decided_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const audit = pgTable("audit", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  customerId: text("customer_id"),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

export const memories = pgTable("memories", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  /** note | rule | outcome — a house rule outranks a passing observation. */
  kind: text("kind").notNull().default("note"),
  /** Who wrote it: an operator's name, or the job that learned it. */
  source: text("source"),
  /** Optional. Null until an embedding provider is configured. */
  embedding: jsonb("embedding").$type<number[]>(),
  embeddingModel: text("embedding_model"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inbox = pgTable("inbox", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  fromName: text("from_name").notNull(),
  via: text("via").notNull(),
  at: text("at").notNull(),
  text: text("text").notNull(),
  task: text("task").notNull(),
  status: text("status").notNull().default("new"),
});

export const changes = pgTable("changes", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  repo: text("repo"),
  branch: text("branch"),
  files: integer("files").notNull().default(1),
  status: text("status").notNull(),
  diff: text("diff"),
  expl: text("expl"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orchLog = pgTable("orch_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  customerId: text("customer_id"),
  tag: text("tag").notNull(),
  text: text("text").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

export const deals = pgTable("deals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  note: text("note"),
  stage: integer("stage").notNull().default(0),
});

/**
 * The floor. People bring their own Claude Code over MCP; a job has one owner
 * and one transcript. Agency-level tables — no customer_id, no tenant policy.
 */
export const people = pgTable(
  "people",
  {
    id: text("id").primaryKey(),
    /** Which agency account owns this row. */
    tenantId: text("tenant_id").notNull().default("ai-wrangler"),
    /** owner (us) | admin (runs a tenant) | operator (works in one) */
    tenantRole: text("tenant_role").notNull().default("operator"),
    name: text("name").notNull(),
    handle: text("handle").notNull(),
    email: text("email"),
    /** operator = agency staff, sees everything. client = one customer's own user. */
    kind: text("kind").notNull().default("operator"),
  /** build | copilot — only meaningful when kind is "agent". */
  agentKind: text("agent_kind"),
  /** What a copilot is for, in the customer's words. */
  brief: text("brief"),
  /** Comma-separated event kinds this copilot wakes for. Empty means all. */
  wakesOn: text("wakes_on"),
  /** Which machine runs this agent, and who provides it. */
  hostId: text("host_id"),
  hostProvider: text("host_provider"),
    /** Set on client rows only. This column is the tenancy. */
    customerId: text("customer_id"),
    role: text("role").notNull().default("Build wrangler"),
    approver: boolean("approver").notNull().default(false),
    machine: text("machine"),
    status: text("status").notNull().default("invited"),
    clientVersion: text("client_version"),
    /** SHA-256 of the session token. The plaintext is shown once and never stored. */
    tokenHash: text("token_hash"),
    tokenPrefix: text("token_prefix"),
    connectedAt: timestamp("connected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("people_handle").on(t.handle)],
);

/** Which customers a person's session may mount. Enforced in every MCP tool. */
export const personScopes = pgTable(
  "person_scopes",
  {
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.customerId] })],
);

/** Which MCP tools a person's session is handed. Absent means the call is refused. */
export const personTools = pgTable(
  "person_tools",
  {
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    tool: text("tool").notNull(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.tool] })],
);

/** One row per thing an agent did. Appended by post_step over MCP. */
export const jobSteps = pgTable(
  "job_steps",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    text: text("text").notNull(),
    actor: text("actor").notNull().default("agent"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("job_steps_job").on(t.jobId, t.id)],
);

/**
 * One row per magic link handed out. Burned on redemption so a link that leaks
 * out of a mailbox is worth nothing the second time.
 */
export const loginLinks = pgTable(
  "login_links",
  {
    tokenHash: text("token_hash").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    requestedFrom: text("requested_from"),
  },
  (t) => [index("login_links_email").on(t.email, t.createdAt)],
);

/** An update request from the client. Becomes a job. */
export const clientRequests = pgTable(
  "client_requests",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    fromName: text("from_name"),
    fromEmail: text("from_email"),
    kind: text("kind").notNull().default("request"),
    body: text("body").notNull(),
    status: text("status").notNull().default("new"),
    jobId: text("job_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("client_requests_open").on(t.customerId, t.status, t.createdAt)],
);

/** One row per distinct error on a customer's site. The count is what moves. */
export const siteErrors = pgTable(
  "site_errors",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    fingerprint: text("fingerprint").notNull(),
    message: text("message").notNull(),
    url: text("url"),
    stack: text("stack"),
    count: integer("count").notNull().default(1),
    status: text("status").notNull().default("open"),
    jobId: text("job_id"),
    firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
    lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("site_errors_fingerprint").on(t.customerId, t.fingerprint)],
);

/** Ads and performance as one flat series, so context is one query not one per vendor. */
export const metrics = pgTable(
  "metrics",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    name: text("name").notNull(),
    value: text("value").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("metrics_recent").on(t.customerId, t.source, t.name, t.at)],
);

/** The client's own leads — the people who call THEM. Not our sales pipeline. */
export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    source: text("source"),
    stage: text("stage").notNull().default("new"),
    valueCents: integer("value_cents").notNull().default(0),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastTouchAt: timestamp("last_touch_at", { withTimezone: true }),
  },
  (t) => [index("leads_board").on(t.customerId, t.stage, t.createdAt)],
);

/** Calls, texts, emails and notes against a lead — one timeline, not three. */
export const leadEvents = pgTable(
  "lead_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    direction: text("direction").notNull().default("out"),
    body: text("body"),
    durationS: integer("duration_s"),
    actor: text("actor").notNull().default("ai"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lead_events_timeline").on(t.customerId, t.leadId, t.at)],
);

/**
 * The agency's own pipeline — shops buying web and technology from us. Not the
 * same thing as `leads`, which is a customer's own callers.
 */
export const agencyLeads = pgTable(
  "agency_leads",
  {
    id: text("id").primaryKey(),
    /** Which agency account owns this row. */
    tenantId: text("tenant_id").notNull().default("ai-wrangler"),
    company: text("company").notNull(),
    contact: text("contact"),
    phone: text("phone"),
    email: text("email"),
    city: text("city"),
    trade: text("trade"),
    source: text("source"),
    stage: text("stage").notNull().default("new"),
    valueCents: integer("value_cents").notNull().default(0),
    note: text("note"),
    ownerId: text("owner_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastTouchAt: timestamp("last_touch_at", { withTimezone: true }),
  },
  (t) => [index("agency_leads_board").on(t.stage, t.createdAt)],
);

/** Franchise licensees — other agencies running our name in their own territory. */
export const partners = pgTable(
  "partners",
  {
    id: text("id").primaryKey(),
    /** Which agency account owns this row. */
    tenantId: text("tenant_id").notNull().default("ai-wrangler"),
    name: text("name").notNull(),
    operatorName: text("operator_name"),
    email: text("email"),
    phone: text("phone"),
    territory: text("territory"),
    tier: text("tier").notNull().default("operator"),
    status: text("status").notNull().default("applied"),
    customers: integer("customers").notNull().default(0),
    bookCents: integer("book_cents").notNull().default(0),
    royaltyPct: integer("royalty_pct").notNull().default(12),
    feeCents: integer("fee_cents").notNull().default(0),
    note: text("note"),
    since: text("since"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

/** Campaigns we run on a customer's own ad account. */
export const adCampaigns = pgTable(
  "ad_campaigns",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    platform: text("platform").notNull().default("google"),
    status: text("status").notNull().default("draft"),
    goal: text("goal"),
    spendCents: integer("spend_cents").notNull().default(0),
    leads: integer("leads").notNull().default(0),
    dailyCapCents: integer("daily_cap_cents").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ad_campaigns_customer").on(t.customerId, t.status)],
);

export const threads = pgTable(
  "threads",
  {
    id: text("id").primaryKey(),
    /** Which agency account owns this row. */
    tenantId: text("tenant_id").notNull().default("ai-wrangler"),
    subject: text("subject"),
    who: text("who").notNull(),
    channel: text("channel").notNull().default("sms"),
    phone: text("phone"),
    email: text("email"),
    customerId: text("customer_id"),
    leadId: text("lead_id"),
    unread: boolean("unread").notNull().default(false),
    lastAt: timestamp("last_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("threads_recent").on(t.lastAt)],
);

export const messages = pgTable(
  "messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    threadId: text("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    direction: text("direction").notNull().default("out"),
    channel: text("channel").notNull().default("sms"),
    body: text("body").notNull(),
    actor: text("actor").notNull().default("you"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_thread").on(t.threadId, t.id)],
);

export const callLog = pgTable(
  "call_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    /** Which agency account owns this row. */
    tenantId: text("tenant_id").notNull().default("ai-wrangler"),
    leadId: text("lead_id"),
    customerId: text("customer_id"),
    toNumber: text("to_number"),
    outcome: text("outcome").notNull().default("dialled"),
    seconds: integer("seconds").notNull().default(0),
    note: text("note"),
    actor: text("actor").notNull().default("you"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("call_log_recent").on(t.at)],
);

/**
 * Quote to cash.
 *
 * A lead gets a proposal; they accept, sign, and pay a deposit. The deposit is
 * the conversion event — money changing hands is the only signal worth trusting
 * to turn a lead into a customer.
 */
export const proposals = pgTable(
  "proposals",
  {
    id: text("id").primaryKey(),
    /** Which agency account owns this row. */
    tenantId: text("tenant_id").notNull().default("ai-wrangler"),
    leadId: text("lead_id")
      .notNull()
      .references(() => agencyLeads.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    /** The contract body as sent. Frozen once it leaves the building. */
    terms: text("terms"),
    /** draft | sent | viewed | signed | paid | declined | void */
    status: text("status").notNull().default("draft"),
    currency: text("currency").notNull().default("usd"),
    onceCents: integer("once_cents").notNull().default(0),
    monthlyCents: integer("monthly_cents").notNull().default(0),
    /** percent | flat */
    depositKind: text("deposit_kind").notNull().default("percent"),
    depositPct: integer("deposit_pct").notNull().default(50),
    depositCents: integer("deposit_cents").notNull().default(0),
    token: text("token").unique(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    declinedAt: timestamp("declined_at", { withTimezone: true }),
    declineReason: text("decline_reason"),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("proposals_lead_idx").on(t.leadId, t.createdAt)],
);

export const proposalItems = pgTable(
  "proposal_items",
  {
    id: text("id").primaryKey(),
    proposalId: text("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    detail: text("detail"),
    /** once | monthly — a build and a retainer are not the same line. */
    cadence: text("cadence").notNull().default("once"),
    qty: integer("qty").notNull().default(1),
    unitCents: integer("unit_cents").notNull().default(0),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("proposal_items_idx").on(t.proposalId, t.sort)],
);

/**
 * The evidence. ESIGN/UETA want intent, attribution and an unaltered record, so
 * we keep a hash of the exact document shown, who typed their name, from where,
 * and when. A signature not tied to a document version proves nothing.
 */
export const signatures = pgTable("signatures", {
  id: text("id").primaryKey(),
  proposalId: text("proposal_id")
    .notNull()
    .unique()
    .references(() => proposals.id, { onDelete: "cascade" }),
  typedName: text("typed_name").notNull(),
  email: text("email"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  documentHash: text("document_hash").notNull(),
  signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const proposalPayments = pgTable("proposal_payments", {
  id: text("id").primaryKey(),
  proposalId: text("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("stripe"),
  sessionId: text("session_id"),
  intentId: text("intent_id"),
  amountCents: integer("amount_cents").notNull().default(0),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Big red buttons. A row, so pulling one takes effect on the next poll. */
export const floorSwitches = pgTable("floor_switches", {
  id: text("id").primaryKey(),
  onAt: timestamp("on_at", { withTimezone: true }),
  reason: text("reason"),
  actor: text("actor"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * What an agent needs to reach, and whether it can yet.
 *
 * Recorded whether or not the connector exists: a customer's tool sprawl is the
 * thing you have to see before you can quote it, and "needed" is honestly
 * different from "connected".
 */
export const agentConnections = pgTable(
  "agent_connections",
  {
    id: text("id").primaryKey(),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    /** Which account — "Synergy Innovation" versus "Personal". */
    label: text("label"),
    /** needed | connected | blocked | dropped */
    status: text("status").notNull().default("needed"),
    note: text("note"),
    /**
     * The credential that actually reaches this system, encrypted with the same
     * vault as every customer token. Never returned by an API, never rendered,
     * and delivered to exactly one machine: the one running this copilot.
     */
    encryptedSecret: text("encrypted_secret"),
    /** token | password | oauth_refresh | json — what shape it is. */
    secretKind: text("secret_kind"),
    secretSetAt: timestamp("secret_set_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agent_connections_person").on(t.personId, t.status)],
);

/** A customer's conversation with their copilot. Walled per customer. */
export const copilotMessages = pgTable(
  "copilot_messages",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    /** them | copilot */
    who: text("who").notNull(),
    body: text("body").notNull(),
    /** What it read to answer, so the answer can be checked rather than trusted. */
    lookedAt: text("looked_at"),
    cents: integer("cents").notNull().default(0),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("copilot_messages_thread").on(t.customerId, t.at)],
);

/**
 * What an agent reports about itself.
 *
 * A provider's uptime API says the box is on. That is the wrong signal — during
 * the $20 incident the box was on the whole time and the agent was producing
 * nothing. This is the agent saying what it is doing, which works on any host
 * because it is an outbound POST.
 */
export const agentHealth = pgTable("agent_health", {
  personId: text("person_id").primaryKey(),
  host: text("host"),
  cliVersion: text("cli_version"),
  uptimeS: integer("uptime_s"),
  passes: integer("passes").notNull().default(0),
  lastPassAt: timestamp("last_pass_at", { withTimezone: true }),
  lastCostUsd: numeric("last_cost_usd", { precision: 10, scale: 4 }),
  spentUsd: numeric("spent_usd", { precision: 10, scale: 4 }).notNull().default("0"),
  ceilingUsd: numeric("ceiling_usd", { precision: 10, scale: 4 }),
  /** ok | idle | stuck | unbilled | stopped */
  state: text("state").notNull().default("ok"),
  detail: text("detail"),
  bare: boolean("bare"),
  resuming: boolean("resuming"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Maintenance a worker picks up on its next cycle.
 *
 * A fixed set of verbs, never arbitrary shell — a channel that can run anything
 * on a client's box is a backdoor with an audit trail rather than maintenance.
 */
export const agentCommands = pgTable(
  "agent_commands",
  {
    id: text("id").primaryKey(),
    personId: text("person_id").notNull(),
    /** restart | update | reload | run_now | pause | resume | diagnose */
    command: text("command").notNull(),
    args: text("args"),
    issuedBy: text("issued_by").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    /** queued | taken | done | failed */
    status: text("status").notNull().default("queued"),
    takenAt: timestamp("taken_at", { withTimezone: true }),
    doneAt: timestamp("done_at", { withTimezone: true }),
    result: text("result"),
  },
  (t) => [index("agent_commands_queue").on(t.personId, t.status, t.issuedAt)],
);

/**
 * What wakes a copilot.
 *
 * Polling is what cost $20 — a paid session every two minutes to be told there
 * was nothing. Events invert it: nothing runs until something happens, so idle
 * is one cheap HTTP call.
 */
export const agentEvents = pgTable(
  "agent_events",
  {
    id: text("id").primaryKey(),
    personId: text("person_id").notNull(),
    customerId: text("customer_id"),
    /** site_error | client_request | call | lead | message | external */
    kind: text("kind").notNull(),
    source: text("source"),
    /** The row it is about, so the copilot can go and read it. */
    refId: text("ref_id"),
    summary: text("summary").notNull(),
    payload: text("payload"),
    /** queued | taken | done | ignored | failed */
    status: text("status").notNull().default("queued"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    takenAt: timestamp("taken_at", { withTimezone: true }),
    doneAt: timestamp("done_at", { withTimezone: true }),
    result: text("result"),
  },
  (t) => [index("agent_events_queue").on(t.personId, t.status, t.createdAt)],
);

/**
 * Recurring revenue, mirrored from Stripe.
 *
 * Stripe is the ledger. This is the copy the OS can read without a round trip,
 * so a screen can answer "what is our MRR" and "who is overdue" in one query.
 */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().default("ai-wrangler"),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    proposalId: text("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripeCustomerId: text("stripe_customer_id"),
    /** trialing | active | past_due | unpaid | canceled | incomplete | paused */
    status: text("status").notNull().default("incomplete"),
    currency: text("currency").notNull().default("usd"),
    monthlyCents: integer("monthly_cents").notNull().default(0),
    collectedCents: integer("collected_cents").notNull().default(0),
    invoicesPaid: integer("invoices_paid").notNull().default(0),
    failures: integer("failures").notNull().default(0),
    lastFailure: text("last_failure"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("subscriptions_tenant").on(t.tenantId, t.status), index("subscriptions_customer").on(t.customerId)],
);

/** Every invoice Stripe told us about, so "collected" is a sum of facts. */
export const subscriptionInvoices = pgTable(
  "subscription_invoices",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    stripeInvoiceId: text("stripe_invoice_id").unique(),
    amountCents: integer("amount_cents").notNull().default(0),
    status: text("status").notNull().default("open"),
    reason: text("reason"),
    hostedUrl: text("hosted_url"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("subscription_invoices_sub").on(t.subscriptionId, t.createdAt)],
);
