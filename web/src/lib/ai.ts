/**
 * The model layer.
 *
 * One function, two providers, no SDK — both APIs are HTTP and `fetch` is already
 * here. Adding @anthropic-ai/sdk plus an OpenAI-shaped client to send two JSON
 * bodies is a dependency you maintain forever to save forty lines you can read.
 *
 * Model choice is a role, not a string, so a call site says what kind of thinking
 * it wants and the mapping lives in one place. Swapping a model, or moving one
 * role to a different provider, is a line here rather than a search-and-replace.
 *
 * Two rules hold for every call, and they are the reason this file exists rather
 * than fetch() at each call site:
 *   1. A call for a customer is billed to that customer's job and refused when
 *      the job is over its cap. The agent does not get to decide the work was
 *      worth more than you said.
 *   2. Every call lands in the audit trail with the customer, the job, the model
 *      and the cost.
 */

export type Role = "deep" | "fast" | "cheap";

type Provider = "anthropic" | "openrouter";

/**
 * Per million tokens, in cents, so spend can be integer maths. Update when
 * pricing moves — a stale number here shows up as a wrong budget, not a crash.
 */
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-opus-5": { in: 500, out: 2500 },
  "claude-sonnet-5": { in: 200, out: 1000 },
  "claude-haiku-4-5": { in: 100, out: 500 },
};

const MODELS: Record<Role, string> = {
  // Anything that writes something a customer will read, or decides anything.
  deep: process.env.AI_MODEL_DEEP || "claude-opus-5",
  // Summaries, extraction, the companion answering a question about known data.
  fast: process.env.AI_MODEL_FAST || "claude-sonnet-5",
  // Bulk generation where volume matters more than nuance.
  cheap: process.env.AI_MODEL_CHEAP || "claude-haiku-4-5",
};

/** OpenRouter namespaces model ids by vendor; the direct API does not. */
function providerModel(model: string, provider: Provider) {
  if (provider !== "openrouter") return model;
  return model.startsWith("anthropic/") ? model : `anthropic/${model}`;
}

export function aiProvider(): Provider {
  return process.env.AI_PROVIDER === "openrouter" ? "openrouter" : "anthropic";
}

export function aiConfigured() {
  return aiProvider() === "openrouter"
    ? Boolean(process.env.OPENROUTER_API_KEY)
    : Boolean(process.env.ANTHROPIC_API_KEY);
}

export class AiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "AiError";
    this.status = status;
  }
}

export type Ask = {
  role?: Role;
  system?: string;
  prompt: string;
  maxTokens?: number;
  /** low | medium | high | xhigh | max. Higher costs more and thinks longer. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  /**
   * Mark the system prompt as cacheable. Worth it when the same system text is
   * sent repeatedly — a customer's house rules, a playbook, a site's content
   * being walked page by page. Ignored when the block is too small to qualify,
   * and ignored on OpenRouter, which does not expose the breakpoint.
   */
  cache?: boolean;
};

export type Answer = {
  text: string;
  model: string;
  provider: Provider;
  inputTokens: number;
  outputTokens: number;
  /** Tokens written into the cache on this call, billed at 1.25x input. */
  cacheWriteTokens: number;
  /** Tokens served from the cache, billed at 0.1x input. The saving. */
  cacheReadTokens: number;
  /** Whole cents, rounded up, so a job is never under-billed. */
  cents: number;
};

/**
 * Cached tokens are not priced like fresh ones: writing the cache costs 1.25x
 * input and reading it costs 0.1x. Billing a cache read at full rate would
 * report a saving as a cost and make the cap fire early.
 */
const CACHE_WRITE = 1.25;
const CACHE_READ = 0.1;

function priceOf(model: string, inTok: number, outTok: number, cacheWrite = 0, cacheRead = 0) {
  const p = PRICING[model.replace(/^anthropic\//, "")];
  if (!p) return 0;
  const micros =
    inTok * p.in + outTok * p.out + cacheWrite * p.in * CACHE_WRITE + cacheRead * p.in * CACHE_READ;
  return Math.ceil(micros / 1_000_000);
}

/**
 * Below this a cache breakpoint is refused by the API and does nothing but add
 * a field. Anthropic's floor is 1024 tokens for the bigger models and 2048 for
 * Haiku; ~3.5 chars a token, and we err high so we never mark a block that is
 * too small to qualify.
 */
const CACHEABLE_CHARS = 2048 * 4;

/** The raw call. Use `askFor` when the work belongs to a customer. */
export async function ask({ role = "deep", system, prompt, maxTokens = 8000, effort, cache }: Ask): Promise<Answer> {
  const provider = aiProvider();
  const model = MODELS[role];
  // The key can live in the vault as well as the environment, so it is pasted
  // into the OS once rather than set on every service that needs it.
  const { anthropicKey } = await import("./railway");
  const key = (await anthropicKey()) || "";
  if (provider === "anthropic" && !key) {
    throw new AiError("No Anthropic key. Paste one on Sessions, or set AI_PROVIDER=openrouter.", 503);
  }
  if (provider === "openrouter" && !process.env.OPENROUTER_API_KEY) {
    throw new AiError("OPENROUTER_API_KEY is not set.", 503);
  }

  if (provider === "openrouter") {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // OpenRouter attributes traffic by these; harmless and useful in their dashboard.
        "HTTP-Referer": process.env.PUBLIC_ORIGIN || "https://aiwrangler.co",
        "X-Title": "AI Wrangler",
      },
      body: JSON.stringify({
        model: providerModel(model, provider),
        max_tokens: maxTokens,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new AiError(`OpenRouter refused the call (${res.status}): ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    const inTok = data?.usage?.prompt_tokens ?? 0;
    const outTok = data?.usage?.completion_tokens ?? 0;
    return {
      text, model, provider,
      inputTokens: inTok, outputTokens: outTok,
      cacheWriteTokens: 0, cacheReadTokens: 0,
      cents: priceOf(model, inTok, outTok),
    };
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      // A cache breakpoint has to sit on a structured block, so the system only
      // becomes an array when we are actually asking for one.
      ...(system
        ? {
            system:
              cache && system.length >= CACHEABLE_CHARS
                ? [{ type: "text", text: system, cache_control: { type: "ephemeral" } }]
                : system,
          }
        : {}),
      ...(effort ? { output_config: { effort } } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new AiError(`Anthropic refused the call (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = (data?.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
  const inTok = data?.usage?.input_tokens ?? 0;
  const outTok = data?.usage?.output_tokens ?? 0;
  const cw = data?.usage?.cache_creation_input_tokens ?? 0;
  const cr = data?.usage?.cache_read_input_tokens ?? 0;
  return {
    text, model, provider,
    inputTokens: inTok, outputTokens: outTok,
    cacheWriteTokens: cw, cacheReadTokens: cr,
    cents: priceOf(model, inTok, outTok, cw, cr),
  };
}
