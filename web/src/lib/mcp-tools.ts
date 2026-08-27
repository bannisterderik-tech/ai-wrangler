import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "./db";
import { newId } from "./customers";
import { assertBoundToCustomer, boundIds, IsolationError } from "./isolation";
import { approvals, audit, boundResources, changes, jobs, jobSteps } from "./schema";
import type { McpSession } from "./session-token";

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
    name: "open_branch",
    description:
      "Record a branch and an optional preview URL against a job. Never writes to main — production is a separate approval.",
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
  return job;
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
      const job = await jobInScope(session, s(args.job_id));
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

      const files = Array.isArray(args.files) ? (args.files as unknown[]).map((f) => s(f)).filter(Boolean) : [];
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
        expl: summary,
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
      return `Branch ${branch} recorded on ${job.repo}. It shows on the floor as a preview change. Main is untouched.`;
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
      await db.insert(jobSteps).values({
        jobId: job.id,
        customerId: job.customerId,
        kind,
        text,
        actor: session.handle,
      });
      if (kind === "done") await db.update(jobs).set({ status: "done" }).where(eq(jobs.id, job.id));
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
      await db.insert(approvals).values({
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
      await db.insert(jobSteps).values({
        jobId: job.id,
        customerId: job.customerId,
        kind: "gate",
        text: `Waiting on a human: ${title}`,
        actor: session.handle,
      });
      await db.update(jobs).set({ status: "blocked" }).where(eq(jobs.id, job.id));
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
