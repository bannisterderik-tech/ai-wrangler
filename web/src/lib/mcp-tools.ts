import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, withCustomer } from "./db";
import { newId } from "./customers";
import { assertBoundToCustomer, boundIds, IsolationError } from "./isolation";
import {
  approvals,
  audit,
  boundResources,
  changes,
  clientRequests,
  customers,
  jobs,
  jobSteps,
  metrics,
  siteErrors,
} from "./schema";
import type { McpSession } from "./session-token";
import { recall } from "./recall";
import { agentsPaused } from "./switches";
import { cloneUrl, githubAppConfigured, readBranch } from "./github-app";

/**
 * The tools a teammate's Claude Code gets over MCP.
 *
 * Two rules hold for every one of them, and they are enforced here rather than
 * described in a prompt:
 *   1. The session must have been granted the tool.
 *   2. The job or resource must belong to a customer in the session's scope.
 * A session that asks nicely for a customer outside its scope gets the same
 * refusal an agent gets.
 */

export type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const str = (d: string) => ({ type: "string", description: d });

export const TOOLS: ToolDef[] = [
  {
    name: "list_jobs",
    description:
      "List jobs on the floor, filtered to the customers this session is scoped to. Use it before claiming anything.",
    inputSchema: {
      type: "object",
      properties: {
        status: str("Optional filter: working, blocked, thinking, done. Omit for everything."),
        mine: { type: "boolean", description: "Only jobs this session already claimed." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "claim_job",
    description:
      "Take ownership of a job so no other session picks it up. Refused if someone else already holds it.",
    inputSchema: {
      type: "object",
      properties: { job_id: str("The job id from list_jobs.") },
      required: ["job_id"],
      additionalProperties: false,
    },
  },
  {
    name: "release_job",
    description: "Put a job you claimed back on the board.",
    inputSchema: {
      type: "object",
      properties: { job_id: str("The job id you currently hold.") },
      required: ["job_id"],
      additionalProperties: false,
    },
  },
  {
    name: "read_bound_repo",
    description:
      "Get the repo and deploy target bound to a job's customer. This is the only way to learn a repo name — guessing one gets refused.",
    inputSchema: {
      type: "object",
      properties: { job_id: str("The job whose customer you want the bindings for.") },
      required: ["job_id"],
      additionalProperties: false,
    },
  },
  {
    name: "read_project",
    description:
      "Everything known about a job's customer in one call: what is bound, what the agent is allowed to touch, their house rules, what is on fire, what the ads and the site are doing, and what has shipped lately. Read this before you plan anything.",
    inputSchema: {
      type: "object",
      properties: { job_id: str("Any job belonging to the customer you want context on.") },
      required: ["job_id"],
      additionalProperties: false,
    },
  },
  {
    name: "next_work",
    description:
      "The intake: update requests from the client and errors from their live site that nobody has turned into a job yet. Use open_work to promote one.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: str("Any job belonging to the customer whose intake you want."),
        kind: str("Optional: requests or errors. Omit for both."),
      },
      required: ["job_id"],
      additionalProperties: false,
    },
  },
  {
    name: "open_work",
    description:
      "Turn one intake item into a job you own, so the work has a budget, a transcript and an approval gate like everything else. Refused if it is already jobbed.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: str("Any job belonging to that customer — this is how scope is proven."),
        item_id: str("The request or error id from next_work."),
        title: str("What the new job is called."),
        budget_dollars: { type: "number", description: "Spend cap for the new job. Defaults to 10." },
      },
      required: ["job_id", "item_id", "title"],
      additionalProperties: false,
    },
  },
  {
    name: "checkout",
    description:
      "Get a clone URL you can push with for this job's bound repository. The token is scoped to that one " +
      "repo, expires in about an hour, and cannot touch .github/workflows. Never print it or put it in a step.",
    inputSchema: {
      type: "object",
      properties: { job_id: str("The job you hold.") },
      required: ["job_id"],
      additionalProperties: false,
    },
  },
  {
    name: "open_branch",
    description:
      "Record a branch you have ALREADY PUSHED. The floor checks GitHub and refuses if the branch is not " +
      "there, so push first. Never writes to main — production is a separate approval.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: str("The job you hold."),
        branch: str("Branch name, e.g. agent/rebuild."),
        summary: str("One line on what the branch does."),
        preview_url: str("Optional preview deployment URL."),
        files: {
          type: "array",
          description: "Files touched, as 'path +added -removed' strings.",
          items: { type: "string" },
        },
      },
      required: ["job_id", "branch", "summary"],
      additionalProperties: false,
    },
  },
  {
    name: "read_decision",
    description:
      "Has a human answered the thing you asked about? Returns the latest approval on this job and what was " +
      "decided. Call this before re-deriving anything: the answer may already be here.",
    inputSchema: {
      type: "object",
      properties: { job_id: str("The job you hold.") },
      required: ["job_id"],
      additionalProperties: false,
    },
  },
  {
    name: "post_step",
    description:
      "Stream one line of what you are doing back onto the floor so a human can watch without interrupting you.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: str("The job you hold."),
        kind: str("think, tool, gate or done."),
        text: str("What you did or decided, in one line."),
      },
      required: ["job_id", "kind", "text"],
      additionalProperties: false,
    },
  },
  {
    name: "request_approval",
    description:
      "Stop at the wall and ask a human. Use this for anything irreversible: a production merge, a first live send, money moving.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: str("The job you hold."),
        title: str("What you want to do, in one line."),
        what: str("Exactly what happens if they approve."),
        blast: str("Blast radius — who or what this touches."),
        cost: str("What it costs, or $0."),
        irreversible: { type: "boolean", description: "True if it cannot be undone." },
      },
      required: ["job_id", "title", "what", "blast"],
      additionalProperties: false,
    },
  },
];

export function toolsFor(session: McpSession) {
  return TOOLS.filter((t) => session.tools.includes(t.name));
}

export class ToolError extends Error {}

type Args = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Load a job and prove this session is allowed to see it at all. */
async function jobInScope(session: McpSession, jobId: string) {
  if (!jobId) throw new ToolError("job_id is required.");
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  // Same refusal whether it does not exist or is not yours: a session must not be
  // able to enumerate other customers' job ids by watching the error change.
  if (!job || !session.scope.includes(job.customerId)) {
    throw new ToolError(
      `refused: job ${jobId} is not on this session's floor. Scoped customers: ${session.scope.join(", ") || "none"}.`,
    );
  }

  // And make Postgres agree, before any tool does anything.
  //
  // The scope check above is TypeScript. HANDOFF calls row level security the
  // third wall, but no MCP tool has ever gone through withCustomer, so on the
  // agent path — the one an autonomous process drives — that wall was not
  // there. This re-reads the job as the tenant role with app.customer_id pinned
  // to the job's own customer: if the database does not agree the job belongs
  // there, nothing proceeds.
  //
  // It sits in jobInScope rather than in each tool because every tool already
  // passes through here. A tool added next year gets this without anyone
  // remembering to add it, which is the only kind of wall that stays standing.
  const confirmed = await withCustomer(job.customerId, (tx) =>
    tx.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, job.id)).limit(1),
  );
  if (!confirmed.length) {
    throw new ToolError(
      `refused: job ${jobId} is not on this session's floor. Scoped customers: ${session.scope.join(", ") || "none"}.`,
    );
  }
  return job;
}

/**
 * Run a tool's writes as the tenant, pinned to one customer.
 *
 * The scope check decides *whether*; this decides *what the connection can
 * physically touch* while doing it. A query that names the wrong customer is
 * refused by Postgres rather than by our own care.
 */
export function asTenant<T>(customerId: string, fn: (tx: Parameters<Parameters<typeof withCustomer>[1]>[0]) => Promise<T>) {
  return withCustomer(customerId, fn);
}

function mustHold(session: McpSession, job: { id: string; ownerId: string | null }) {
  if (job.ownerId !== session.id) {
    throw new ToolError(
      job.ownerId
        ? `refused: job ${job.id} is held by another session. Ask them to release it.`
        : `refused: claim job ${job.id} first.`,
    );
  }
}

async function log(customerId: string | null, actor: string, action: string, target?: string) {
  await db.insert(audit).values({ customerId, actor, action, target: target ?? null, at: new Date() });
}

export async function callTool(session: McpSession, name: string, args: Args): Promise<string> {
  if (!session.tools.includes(name)) {
    throw new ToolError(
      `refused: this session was not granted ${name}. Ask the operator to grant it on the Sessions screen.`,
    );
  }

  switch (name) {
    case "list_jobs": {
      if (!session.scope.length) return "No customers are scoped to this session yet.";
      const rows = await db
        .select()
        .from(jobs)
        .where(inArray(jobs.customerId, session.scope))
        .orderBy(desc(jobs.createdAt));
      const filtered = rows
        .filter((j) => !args.status || j.status === s(args.status))
        .filter((j) => !args.mine || j.ownerId === session.id);
      if (!filtered.length) return "Nothing on the floor matches that.";
      return filtered
        .map(
          (j) =>
            `${j.id}  [${j.status}]  ${j.title}\n    customer: ${j.customerId}  owner: ${
              j.ownerId === session.id ? "you" : j.ownerId || "unclaimed"
            }  spent: $${(j.spentCents / 100).toFixed(2)} of $${(j.budgetCents / 100).toFixed(2)}`,
        )
        .join("\n");
    }

    case "claim_job": {
      // A worker running older code does not ask /api/agent/next, so the switch
      // has to bite here as well or pausing would only stop the agents that
      // already know how to be stopped.
      const paused = await agentsPaused();
      if (paused.paused) {
        throw new ToolError(`refused: agents are paused on the floor — ${paused.reason ?? "stopped by an operator"}.`);
      }
      const job = await jobInScope(session, s(args.job_id));
      // The cap, enforced where it cannot be reasoned past. A job at its budget
      // is not workable by anyone until a human raises it — otherwise the money
      // is spent rediscovering that the money is spent.
      if (job.spentCents >= job.budgetCents) {
        throw new ToolError(
          `refused: ${job.id} has spent $${(job.spentCents / 100).toFixed(2)} of its ` +
            `$${(job.budgetCents / 100).toFixed(2)} cap. A human has to raise the cap before it moves again.`,
        );
      }
      if (job.ownerId && job.ownerId !== session.id) {
        throw new ToolError(`refused: ${job.id} is already held by another session.`);
      }
      if (job.ownerId === session.id) return `You already hold ${job.id}.`;
      // Conditional update. Two sessions racing for the same job: exactly one
      // UPDATE matches a NULL owner, so exactly one wins — the same shape as the
      // unique index that settles a repo binding under a race.
      const claimed = await db
        .update(jobs)
        .set({ ownerId: session.id, claimedAt: new Date() })
        .where(and(eq(jobs.id, job.id), isNull(jobs.ownerId)))
        .returning({ id: jobs.id });
      if (!claimed.length) throw new ToolError(`refused: ${job.id} was claimed by another session just now.`);
      await log(job.customerId, session.handle, "claimed job", job.id);
      return `Claimed ${job.id} — "${job.title}". It is yours until you release it.`;
    }

    case "release_job": {
      const job = await jobInScope(session, s(args.job_id));
      mustHold(session, job);
      await db.update(jobs).set({ ownerId: null, claimedAt: null }).where(eq(jobs.id, job.id));
      await log(job.customerId, session.handle, "released job", job.id);
      return `Released ${job.id}. It is back on the board.`;
    }

    case "read_bound_repo": {
      const job = await jobInScope(session, s(args.job_id));
      const repos = await db
        .select()
        .from(boundResources)
        .where(and(eq(boundResources.customerId, job.customerId), eq(boundResources.provider, "github")));
      const projects = await boundIds(job.customerId, "vercel");
      if (!repos.length) {
        throw new ToolError(
          `409: no repo is bound to ${job.customerId} yet. A human has to bind one before this job can touch code.`,
        );
      }
      return [
        `customer: ${job.customerId}`,
        `repos: ${repos.map((r) => r.resourceId).join(", ")}`,
        `vercel projects: ${projects.join(", ") || "none bound"}`,
        `You may read and branch these and nothing else. Naming another customer's repo returns a 403.`,
      ].join("\n");
    }

    case "read_project": {
      const job = await jobInScope(session, s(args.job_id));
      const cid = job.customerId;
      const [[customer], bound, notes, openJobs, shipped, requests, errors, series] = await Promise.all([
        db.select().from(customers).where(eq(customers.id, cid)).limit(1),
        db.select().from(boundResources).where(eq(boundResources.customerId, cid)),
        // The notes that bear on THIS job, not the newest thirty by date. House
        // rules come back regardless of what the ranking thinks.
        recall(cid, [job.title, job.goal, job.scopeNote].filter(Boolean).join(" "), 14),
        db.select().from(jobs).where(eq(jobs.customerId, cid)),
        db.select().from(changes).where(eq(changes.customerId, cid)).orderBy(desc(changes.createdAt)).limit(8),
        db.select().from(clientRequests).where(and(eq(clientRequests.customerId, cid), eq(clientRequests.status, "new"))),
        db.select().from(siteErrors).where(and(eq(siteErrors.customerId, cid), eq(siteErrors.status, "open"))).orderBy(desc(siteErrors.count)).limit(10),
        db.select().from(metrics).where(eq(metrics.customerId, cid)).orderBy(desc(metrics.at)).limit(40),
      ]);

      // Latest value wins per source/name, so the agent reads a state of the
      // world rather than a stream it has to reduce itself.
      const latest = new Map<string, { value: string; at: Date }>();
      for (const m of series) {
        const key = `${m.source}.${m.name}`;
        if (!latest.has(key)) latest.set(key, { value: m.value, at: m.at });
      }

      const lines = [
        `# ${customer?.name ?? cid}`,
        "",
        "## What you may touch",
        ...bound.map((b) => `- ${b.provider}: ${b.resourceId}`),
        bound.length ? "" : "- nothing is bound yet; a human has to bind a repo before you can write code",
        "Naming anything not on that list returns a 403. This is the whole list.",
        "",
        // Everything we know, most relevant to this job first. Ordered, not
        // filtered: a rule that shares no words with the job title is still a
        // rule, and dropping it is how an agent ships on a Friday.
        "## House rules — these outrank your own judgement",
        ...(notes.length
          ? notes.map((n) => `- ${n.text}${n.source ? ` (${n.source})` : ""}`)
          : ["- none recorded"]),
        "",
        "## On fire",
        ...(errors.length
          ? errors.map((e) => `- [${e.id}] ×${e.count} ${e.message}${e.url ? ` (${e.url})` : ""}`)
          : ["- nothing reported"]),
        "",
        "## Waiting on us",
        ...(requests.length
          ? requests.map((r) => `- [${r.id}] ${r.kind}: ${r.body.slice(0, 160)}`)
          : ["- nothing open"]),
        "",
        "## How they are doing",
        ...(latest.size
          ? [...latest.entries()].map(([k, v]) => `- ${k}: ${v.value}`)
          : ["- no metrics yet"]),
        "",
        "## Work in flight",
        ...openJobs
          .filter((j) => j.status !== "done")
          .map((j) => `- ${j.id} [${j.status}] ${j.title}${j.ownerId === session.id ? " (yours)" : ""}`),
        "",
        "## Shipped lately",
        ...(shipped.length ? shipped.map((c) => `- ${c.branch ?? "?"} — ${c.title} [${c.status}]`) : ["- nothing yet"]),
      ];
      return lines.join("\n");
    }

    case "next_work": {
      const job = await jobInScope(session, s(args.job_id));
      const want = s(args.kind).toLowerCase();
      const out: string[] = [];
      if (want !== "errors") {
        const rows = await db
          .select()
          .from(clientRequests)
          .where(and(eq(clientRequests.customerId, job.customerId), eq(clientRequests.status, "new")))
          .orderBy(asc(clientRequests.createdAt));
        out.push(
          ...rows.map((r) => `${r.id}  request/${r.kind}  from ${r.fromName || r.fromEmail || "the client"}\n    ${r.body.slice(0, 300)}`),
        );
      }
      if (want !== "requests") {
        const rows = await db
          .select()
          .from(siteErrors)
          .where(and(eq(siteErrors.customerId, job.customerId), eq(siteErrors.status, "open")))
          .orderBy(desc(siteErrors.count));
        out.push(...rows.map((e) => `${e.id}  error ×${e.count}  ${e.message}\n    ${e.url ?? ""}`));
      }
      return out.length ? out.join("\n") : "Intake is empty. Nothing is waiting.";
    }

    case "open_work": {
      const ref = await jobInScope(session, s(args.job_id));
      const itemId = s(args.item_id);
      const title = s(args.title);
      if (!itemId || !title) throw new ToolError("item_id and title are required.");

      const [request] = await db.select().from(clientRequests).where(eq(clientRequests.id, itemId)).limit(1);
      const [failure] = request
        ? [null]
        : await db.select().from(siteErrors).where(eq(siteErrors.id, itemId)).limit(1);
      const item = request ?? failure;
      if (!item) throw new ToolError(`refused: no intake item ${itemId} on this customer.`);
      // Scope again on the item itself: a job id proves scope, an item id does not.
      if (item.customerId !== ref.customerId) {
        throw new ToolError(`refused: intake item ${itemId} belongs to another customer.`);
      }
      if (item.status !== "new" && item.status !== "open") {
        throw new ToolError(`refused: ${itemId} is already ${item.status}.`);
      }

      const budget = Math.round(Math.max(1, Math.min(100, Number(args.budget_dollars) || 10)) * 100);
      const id = newId();
      await db.insert(jobs).values({
        id,
        customerId: ref.customerId,
        title,
        status: "thinking",
        ownerId: session.id,
        claimedAt: new Date(),
        agent: session.handle,
        repo: ref.repo,
        budgetCents: budget,
        goal: item.body ?? (failure ? failure.message : title),
        risk: "Opened from intake. Production is still a separate approval.",
      });
      if (request) {
        await db.update(clientRequests).set({ status: "jobbed", jobId: id }).where(eq(clientRequests.id, itemId));
      } else {
        await db.update(siteErrors).set({ status: "jobbed", jobId: id }).where(eq(siteErrors.id, itemId));
      }
      await db.insert(jobSteps).values({
        jobId: id,
        customerId: ref.customerId,
        kind: "tool",
        text: `opened from intake ${itemId}`,
        actor: session.handle,
      });
      await log(ref.customerId, session.handle, "opened work from intake", `${itemId} → ${id}`);
      return `Created ${id} — "${title}", claimed by you, cap $${(budget / 100).toFixed(2)}. Intake item ${itemId} is now jobbed.`;
    }

    case "checkout": {
      const job = await jobInScope(session, s(args.job_id));
      mustHold(session, job);
      if (!job.repo) throw new ToolError("This job has no repo bound. A human binds one on Our GitHub.");
      // Same wall as open_branch, enforced where the credential is minted rather
      // than in a sentence the agent is asked to respect.
      await assertBoundToCustomer(job.customerId, "github", job.repo);
      if (!githubAppConfigured()) {
        throw new ToolError(
          "The GitHub App is not configured on the floor, so no push credential can be issued. A human has to set it up.",
        );
      }
      const { url, expiresAt } = await cloneUrl(job.repo);
      await log(job.customerId, session.handle, "took a checkout token", job.repo);
      return (
        `Clone with:\n  git clone ${url} .\n\n` +
        `That URL contains a credential for ${job.repo} only. It expires at ${expiresAt}. ` +
        `Do not echo it, do not put it in a step, and do not commit it.`
      );
    }

    case "open_branch": {
      const job = await jobInScope(session, s(args.job_id));
      mustHold(session, job);
      const branch = s(args.branch);
      const summary = s(args.summary);
      if (!branch || !summary) throw new ToolError("branch and summary are required.");
      if (/^(main|master|prod|production)$/i.test(branch)) {
        throw new ToolError(
          "refused: agents do not write to main. Open a branch and use request_approval to promote it.",
        );
      }
      if (!job.repo) throw new ToolError("This job has no repo. Call read_bound_repo first.");
      // The wall: the job's repo must be bound to the job's own customer.
      await assertBoundToCustomer(job.customerId, "github", job.repo);

      // Observe the branch rather than believe it.
      //
      // This used to record whatever the agent said. A pass once reported a
      // complete-sounding branch that the next pass found had zero commits,
      // and four human approvals were spent on a branch that was never pushed
      // anywhere a human could see. If the App is configured, the floor asks
      // GitHub what is actually there and refuses if the answer is nothing.
      let observed: Awaited<ReturnType<typeof readBranch>> | null = null;
      if (githubAppConfigured()) {
        observed = await readBranch(job.repo, branch);
        if (!observed.exists) {
          throw new ToolError(
            `refused: ${branch} is not on ${job.repo}. Push it first — call checkout for a URL you can push with. ` +
              `Recording a branch that does not exist is how four approvals got spent on nothing.`,
          );
        }
        if (observed.ahead === 0) {
          throw new ToolError(
            `refused: ${branch} exists on ${job.repo} but is level with ${observed.base}. There is nothing on it to review.`,
          );
        }
      }

      const claimed = Array.isArray(args.files) ? (args.files as unknown[]).map((f) => s(f)).filter(Boolean) : [];
      const files = observed?.exists
        ? observed.files.map((f: { path: string; added: number; removed: number }) => `${f.path} +${f.added} -${f.removed}`)
        : claimed;
      const id = newId();
      await db.insert(changes).values({
        id,
        customerId: job.customerId,
        title: summary,
        repo: job.repo,
        branch,
        files: files.length || 1,
        status: "preview",
        diff: files.join("\n") || null,
        expl: observed?.exists ? `${summary}\n\nhead ${observed.headSha.slice(0, 7)} · ${observed.ahead} commit(s) ahead of ${observed.base}` : summary,
      });
      await db
        .update(jobs)
        .set({ branch, previewUrl: s(args.preview_url) || job.previewUrl, status: "working" })
        .where(eq(jobs.id, job.id));
      await db.insert(jobSteps).values({
        jobId: job.id,
        customerId: job.customerId,
        kind: "tool",
        text: `opened ${branch} — ${summary}`,
        actor: session.handle,
      });
      await log(job.customerId, session.handle, "opened branch", `${job.repo}:${branch}`);
      return observed?.exists
        ? `Verified ${branch} on ${job.repo}: head ${observed.headSha.slice(0, 7)}, ${observed.ahead} commit(s) ahead of ` +
            `${observed.base}, ${observed.files.length} file(s). Recorded. Main is untouched.`
        : `Branch ${branch} recorded on ${job.repo} WITHOUT verification — the GitHub App is not configured, so the ` +
            `floor cannot see whether it was really pushed. Main is untouched.`;
    }

    case "read_decision": {
      const job = await jobInScope(session, s(args.job_id));
      const rows = await db
        .select()
        .from(approvals)
        .where(eq(approvals.jobId, job.id))
        .orderBy(desc(approvals.createdAt));
      if (!rows.length) return "Nothing has been asked on this job, so there is nothing to hear back on.";
      const a = rows[0];
      if (a.status === "pending") {
        return `Still waiting on a human for "${a.title}". Do not ask again and do not do it anyway — stop here.`;
      }
      // The agent had no way to learn this. It would go to the wall, be
      // approved, pick the job back up, re-read everything from scratch and
      // walk into the same wall — four times, on real money.
      return (
        `"${a.title}" was ${a.status}.` +
        (a.status === "approved"
          ? ` You may do exactly that and nothing more. If the branch has moved since you asked, ask again.`
          : ` Do not do it. Read the note on the floor, change the plan, and ask again if it is still worth doing.`)
      );
    }

    case "post_step": {
      const job = await jobInScope(session, s(args.job_id));
      mustHold(session, job);
      const kind = s(args.kind).toLowerCase();
      const text = s(args.text);
      if (!text) throw new ToolError("text is required.");
      if (!["think", "tool", "gate", "done"].includes(kind)) {
        throw new ToolError("kind must be one of: think, tool, gate, done.");
      }
      await asTenant(job.customerId, async (tx) => {
        await tx.insert(jobSteps).values({
          jobId: job.id,
          customerId: job.customerId,
          kind,
          text,
          actor: session.handle,
        });
        if (kind === "done") await tx.update(jobs).set({ status: "done" }).where(eq(jobs.id, job.id));
      });
      return "Posted.";
    }

    case "request_approval": {
      const job = await jobInScope(session, s(args.job_id));
      mustHold(session, job);
      const title = s(args.title);
      const what = s(args.what);
      const blast = s(args.blast);
      if (!title || !what || !blast) throw new ToolError("title, what and blast are required.");
      const id = newId();
      await asTenant(job.customerId, async (tx) => {
      await tx.insert(approvals).values({
        id,
        customerId: job.customerId,
        jobId: job.id,
        title,
        why: what,
        payload: null,
        blast,
        cost: s(args.cost) || "$0",
        askedBy: session.handle,
        guard: `Asked by ${session.handle}'s session, scoped to ${session.scope.join(", ")}.`,
        irreversible: args.irreversible === true,
        status: "pending",
      });
      await tx.insert(jobSteps).values({
        jobId: job.id,
        customerId: job.customerId,
        kind: "gate",
        text: `Waiting on a human: ${title}`,
        actor: session.handle,
      });
        await tx.update(jobs).set({ status: "blocked" }).where(eq(jobs.id, job.id));
      });
      // The agency's own record, written on the owner connection: it should
      // survive even if a tenant statement above had rolled back.
      await log(job.customerId, session.handle, "requested approval", title);
      return `Asked. ${job.id} is now blocked and shows on Needs you. Stop here — do not do it anyway.`;
    }

    default:
      throw new ToolError(`no such tool: ${name}`);
  }
}

export async function stepsFor(jobId: string) {
  return db.select().from(jobSteps).where(eq(jobSteps.jobId, jobId)).orderBy(asc(jobSteps.id));
}

export { IsolationError };
