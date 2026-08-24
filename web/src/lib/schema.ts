import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** Every row that is client-owned MUST have customerId. Isolation is a column, not a vibe. */
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  profileJson: text("profile_json"),
});

/** Agency-level (not per-customer): which GitHub account Wrangler uses. */
export const agencyConnections = sqliteTable("agency_connections", {
  provider: text("provider").primaryKey(),
  mode: text("mode").notNull(),
  encryptedAccess: text("encrypted_access").notNull(),
  login: text("login"),
  org: text("org"),
  userJson: text("user_json"),
  connectedAt: integer("connected_at", { mode: "timestamp_ms" }).notNull(),
});

export const connections = sqliteTable(
  "connections",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    provider: text("provider").notNull(), // vercel | github | supabase
    mode: text("mode").notNull(), // integration | pat | github-app
    encryptedAccess: text("encrypted_access").notNull(),
    encryptedRefresh: text("encrypted_refresh"),
    teamId: text("team_id"),
    teamName: text("team_name"),
    installationId: text("installation_id"),
    userJson: text("user_json"),
    tokenPrefix: text("token_prefix"),
    connectedAt: integer("connected_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  },
  (t) => [uniqueIndex("conn_customer_provider").on(t.customerId, t.provider)],
);

export const boundResources = sqliteTable(
  "bound_resources",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    provider: text("provider").notNull(),
    resourceId: text("resource_id").notNull(),
    name: text("name").notNull(),
    metaJson: text("meta_json"),
  },
  (t) => [uniqueIndex("bound_unique").on(t.customerId, t.provider, t.resourceId)],
);

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  title: text("title").notNull(),
  status: text("status").notNull(),
  harness: text("harness").notNull().default("claude-code-mcp"),
  tier: text("tier").notNull().default("Medium brain"),
  spentCents: integer("spent_cents").notNull().default(0),
  budgetCents: integer("budget_cents").notNull().default(1000),
  cache: integer("cache").notNull().default(60),
  transcriptJson: text("transcript_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  jobId: text("job_id").references(() => jobs.id),
  title: text("title").notNull(),
  why: text("why"),
  payload: text("payload"),
  irreversible: integer("irreversible", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const audit = sqliteTable("audit", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: text("customer_id"),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  at: integer("at", { mode: "timestamp_ms" }).notNull(),
});

export const memories = sqliteTable("memories", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const inbox = sqliteTable("inbox", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  fromName: text("from_name").notNull(),
  via: text("via").notNull(),
  at: text("at").notNull(),
  text: text("text").notNull(),
  task: text("task").notNull(),
  status: text("status").notNull().default("new"),
});

export const changes = sqliteTable("changes", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  title: text("title").notNull(),
  repo: text("repo"),
  branch: text("branch"),
  files: integer("files").notNull().default(1),
  status: text("status").notNull(),
  diff: text("diff"),
  expl: text("expl"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const orchLog = sqliteTable("orch_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: text("customer_id"),
  tag: text("tag").notNull(),
  text: text("text").notNull(),
  at: integer("at", { mode: "timestamp_ms" }).notNull(),
});

export const deals = sqliteTable("deals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  note: text("note"),
  stage: integer("stage").notNull().default(0),
});
