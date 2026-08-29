import { db } from "./db";
import { agentTraces } from "./schema";
import { newId } from "./customers";

/**
 * What an agent saw, chose, and what it cost.
 *
 * Spend and a heartbeat say an agent is alive and what it burned. Neither
 * answers "why did it do that" — which is the question a customer asks, and the
 * one that decides whether a managed agent is supportable or just spooky.
 *
 * Never throws, and never blocks. A trace is a record of work, not the work: an
 * agent that fails because its logging failed is strictly worse than one that
 * did the job and told us nothing.
 *
 * Inputs and outputs are truncated hard. This is meant to reconstruct a
 * decision, not to become a second copy of the database.
 */
export async function trace(opts: {
  tenantId: string;
  customerId?: string | null;
  personId?: string | null;
  jobId?: string | null;
  kind: "tool" | "model" | "decision" | "error" | "event";
  name: string;
  input?: unknown;
  output?: unknown;
  ok?: boolean;
  ms?: number;
  costMillicents?: number;
}) {
  try {
    await db.insert(agentTraces).values({
      id: "TR" + newId().slice(0, 10),
      tenantId: opts.tenantId,
      customerId: opts.customerId ?? null,
      personId: opts.personId ?? null,
      jobId: opts.jobId ?? null,
      kind: opts.kind,
      name: opts.name.slice(0, 120),
      input: brief(opts.input),
      output: brief(opts.output),
      ok: opts.ok !== false,
      ms: Math.max(0, Math.round(opts.ms ?? 0)),
      costMillicents: Math.max(0, Math.round(opts.costMillicents ?? 0)),
    });
  } catch {
    /* a trace that fails is a trace we do not have; it is not an outage */
  }
}

function brief(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  try {
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return s.length > 2000 ? `${s.slice(0, 2000)}… (${s.length} chars)` : s;
  } catch {
    return String(v).slice(0, 2000);
  }
}

/** Time something and trace it, whichever way it goes. */
export async function traced<T>(
  meta: Omit<Parameters<typeof trace>[0], "ok" | "ms" | "output">,
  run: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  try {
    const out = await run();
    await trace({ ...meta, ok: true, ms: Date.now() - started, output: out });
    return out;
  } catch (e) {
    // The failures are the ones worth having. An agent that worked is easy to
    // explain; an agent that stopped is the support call.
    await trace({ ...meta, kind: "error", ok: false, ms: Date.now() - started, output: (e as Error).message });
    throw e;
  }
}
