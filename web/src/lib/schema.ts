import {
  bigserial,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Every row that is client-owned MUST have customerId. Isolation is a column, not a vibe. */
export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  profileJson: text("profile_json"),
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
    name: text("name").notNull(),
    handle: text("handle").notNull(),
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
