/**
 * How much brain a job gets.
 *
 * `jobs.tier` existed as free text defaulting to "Medium brain" and nothing ever
 * read it — every pass ran on whatever AGENT_MODEL the container was started
 * with, which meant every job cost Opus money whether it needed Opus or not.
 *
 * A tier is picked when the job is opened, because that is the moment somebody
 * knows what the work is. "Rename a heading" and "rebuild the booking flow" are
 * not the same purchase.
 */

export type BrainId = "haiku" | "sonnet" | "opus";

export type Brain = {
  id: BrainId;
  label: string;
  /** The model id passed to Claude Code with --model. */
  model: string;
  /** Roughly, per million tokens in/out, in cents — for the picker's guidance. */
  rate: string;
  /** What this tier is actually for, in the words of someone opening a job. */
  good: string;
  /** The honest downside. A picker that only lists upsides is a sales page. */
  bad: string;
};

export const BRAINS: Brain[] = [
  {
    id: "haiku",
    label: "Small brain",
    model: process.env.AGENT_MODEL_HAIKU || "claude-haiku-4-5",
    rate: "~$1 / $5 per Mtok",
    good: "Copy edits, alt text, a heading, one obvious typo, bulk repetitive changes.",
    bad: "Loses the thread on anything needing more than a couple of files held at once.",
  },
  {
    id: "sonnet",
    label: "Medium brain",
    model: process.env.AGENT_MODEL_SONNET || "claude-sonnet-5",
    rate: "~$2 / $10 per Mtok",
    good: "A new page from an existing pattern, a form, a component, most day to day build work.",
    bad: "Will follow a bad plan competently. Give it a clear goal.",
  },
  {
    id: "opus",
    label: "Big brain",
    model: process.env.AGENT_MODEL_OPUS || "claude-opus-5",
    rate: "~$5 / $25 per Mtok",
    good: "Rebuilds, tricky debugging, anything where the plan itself is the hard part.",
    bad: "Five times the price of Medium. Spending it on a heading change is how a cap disappears.",
  },
];

export const DEFAULT_BRAIN: BrainId = "sonnet";

export function brain(id: string | null | undefined): Brain {
  return BRAINS.find((b) => b.id === id) ?? BRAINS.find((b) => b.id === DEFAULT_BRAIN)!;
}

/** Accepts a tier id, or the legacy free-text label rows already carry. */
export function brainFromTier(tier: string | null | undefined): Brain {
  if (!tier) return brain(DEFAULT_BRAIN);
  const byId = BRAINS.find((b) => b.id === tier);
  if (byId) return byId;
  const byLabel = BRAINS.find((b) => b.label.toLowerCase() === tier.toLowerCase());
  return byLabel ?? brain(DEFAULT_BRAIN);
}
