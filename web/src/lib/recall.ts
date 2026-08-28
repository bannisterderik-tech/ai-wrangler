import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { memories } from "./schema";
import { newId } from "./customers";

/**
 * Finding the notes that bear on a piece of work.
 *
 * read_project used to hand the agent the newest thirty memories by date, so a
 * job about a booking form was read a note about last quarter's logo. That is
 * both worse context and more tokens, every pass.
 *
 * Two backends behind one function:
 *
 *   Lexical  — Postgres full-text plus trigram. No new vendor, works now, and
 *              at a few thousand notes per customer it is genuinely fast.
 *   Semantic — cosine over stored embeddings. Off unless an embedding provider
 *              is configured, because there isn't one to inherit: Anthropic has
 *              no embeddings endpoint and OpenRouter does not expose one, so
 *              this means a third API key and it should be a decision, not a
 *              surprise line item.
 *
 * Callers do not branch on which is running. That is the point — turning
 * embeddings on later must not mean rewriting the call sites.
 */

export type Recalled = {
  id: string;
  text: string;
  kind: string;
  source: string | null;
  /** 0..1. Comparable within one search, not across backends. */
  score: number;
};

export type Embedder = {
  id: string;
  dims: number;
  embed: (texts: string[]) => Promise<number[][]>;
};

/**
 * Voyage is Anthropic's recommended embedding partner and the only provider
 * wired here. It stays null until a key exists, and every path below is written
 * to work with null — no embedder is a supported state, not a broken one.
 */
export function embedder(): Embedder | null {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) return null;
  const model = process.env.VOYAGE_MODEL || "voyage-3.5-lite";
  return {
    id: model,
    dims: 1024,
    async embed(texts) {
      const res = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: texts, input_type: "document" }),
      });
      if (!res.ok) throw new Error(`Voyage refused the call (${res.status}): ${(await res.text()).slice(0, 200)}`);
      const data = await res.json();
      return (data.data ?? []).map((d: { embedding: number[] }) => d.embedding);
    },
  };
}

export function recallMode(): "semantic" | "lexical" {
  return embedder() ? "semantic" : "lexical";
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Embed one string, or null if there is no provider or it failed.
 *
 * Separate from remember() because a customer-scoped write goes through
 * withCustomer() for RLS and must stay inside that transaction; this lets the
 * caller own the write and still get an embedding.
 */
export async function embedOne(text: string): Promise<{ embedding: number[]; model: string } | null> {
  const e = embedder();
  if (!e) return null;
  try {
    const [v] = await e.embed([text]);
    return Array.isArray(v) ? { embedding: v, model: e.id } : null;
  } catch {
    return null;
  }
}

/** Write a memory, embedding it when there is something to embed it with. */
export async function remember(
  customerId: string,
  text: string,
  opts: { kind?: string; source?: string | null } = {},
) {
  const body = text.trim();
  if (!body) throw new Error("a memory needs some text");
  const e = embedder();
  let embedding: number[] | null = null;
  let embeddingModel: string | null = null;
  if (e) {
    try {
      const [v] = await e.embed([body]);
      if (Array.isArray(v)) {
        embedding = v;
        embeddingModel = e.id;
      }
    } catch {
      // A provider outage must not lose the note. It stays lexically findable
      // and can be embedded later.
    }
  }
  const id = "M" + newId().slice(0, 8);
  await db.insert(memories).values({
    id,
    customerId,
    text: body,
    kind: opts.kind || "note",
    source: opts.source ?? null,
    embedding,
    embeddingModel,
  });
  return { id, embedded: Boolean(embedding) };
}

/**
 * The notes that bear on `query`, best first.
 *
 * House rules are never ranked away: a rule the customer set outranks anything
 * a similarity score has an opinion about, so rules come back regardless and
 * relevance only orders what is left.
 */
export async function recall(customerId: string, query: string, limit = 12): Promise<Recalled[]> {
  const q = query.trim();
  const rules = await db
    .select()
    .from(memories)
    .where(and(eq(memories.customerId, customerId), eq(memories.kind, "rule")))
    .orderBy(desc(memories.createdAt));

  const asRecalled = (r: typeof rules[number], score: number): Recalled => ({
    id: r.id,
    text: r.text,
    kind: r.kind,
    source: r.source,
    score,
  });

  if (!q) {
    const recent = await db
      .select()
      .from(memories)
      .where(eq(memories.customerId, customerId))
      .orderBy(desc(memories.createdAt))
      .limit(limit);
    return recent.map((r) => asRecalled(r, 0));
  }

  const e = embedder();
  if (e) {
    try {
      const [vec] = await e.embed([q]);
      const rows = await db
        .select()
        .from(memories)
        .where(and(eq(memories.customerId, customerId), sql`${memories.embedding} is not null`));
      const scored = rows
        .map((r) => asRecalled(r, cosine(vec, (r.embedding as number[]) ?? [])))
        .filter((r) => r.score > 0.25)
        .sort((a, b) => b.score - a.score);
      return withFallback(customerId, [...rules.map((r) => asRecalled(r, 1)), ...scored], limit);
    } catch {
      // Fall through to lexical. A provider being down degrades recall; it does
      // not take the agent's context away entirely.
    }
  }

  // OR, not AND. websearch_to_tsquery and plainto_tsquery both AND their terms,
  // so "booking form for site visits" would only match a note containing every
  // one of those words — which is a filter, not recall. We want the note with
  // the best overlap, so the terms are ORed and ts_rank does the ordering.
  const terms = tsOr(q);
  if (!terms) {
    const recent = await db
      .select()
      .from(memories)
      .where(eq(memories.customerId, customerId))
      .orderBy(desc(memories.createdAt))
      .limit(limit);
    return dedupe([...rules.map((r) => asRecalled(r, 1)), ...recent.map((r) => asRecalled(r, 0))], limit);
  }
  const rows = await db
    .select({
      id: memories.id,
      text: memories.text,
      kind: memories.kind,
      source: memories.source,
      score: sql<number>`
        ts_rank(memories.tsv, to_tsquery('english', ${terms}))
        + similarity(${memories.text}, ${q})`.as("score"),
    })
    .from(memories)
    .where(
      and(
        eq(memories.customerId, customerId),
        sql`(memories.tsv @@ to_tsquery('english', ${terms}) OR ${memories.text} % ${q})`,
      ),
    )
    .orderBy(desc(sql`score`))
    .limit(limit);

  return withFallback(
    customerId,
    [...rules.map((r) => asRecalled(r, 1)), ...rows.map((r) => ({ ...r, score: Number(r.score) || 0 }))],
    limit,
  );
}

/**
 * Rank, then top up with whatever else is there.
 *
 * Ranking that also excludes is dangerous here. A note saying "never ship on a
 * Friday" shares no words with "rebuild the booking page", so a pure relevance
 * filter drops it — and the agent then ships on a Friday. Below the limit,
 * everything is returned and relevance only decides the order; exclusion starts
 * only once there is genuinely more than the caller asked for.
 */
async function withFallback(customerId: string, ranked: Recalled[], limit: number) {
  const out = dedupe(ranked, limit);
  if (out.length >= limit) return out;
  const seen = new Set(out.map((r) => r.id));
  const rest = await db
    .select()
    .from(memories)
    .where(eq(memories.customerId, customerId))
    .orderBy(desc(memories.createdAt))
    .limit(limit * 2);
  for (const r of rest) {
    if (seen.has(r.id)) continue;
    out.push({ id: r.id, text: r.text, kind: r.kind, source: r.source, score: 0 });
    seen.add(r.id);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * A query as an OR'd tsquery, with everything Postgres would choke on removed.
 *
 * Words are stripped to letters and digits rather than escaped: a memory search
 * has no reason to accept tsquery operators, and refusing them entirely is
 * simpler to be sure of than quoting them correctly.
 */
function tsOr(q: string) {
  const words = q
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .slice(0, 24);
  return words.length ? words.join(" | ") : "";
}

/** Words that match everything and therefore rank nothing. */
const STOP = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "our", "your", "their",
  "was", "were", "are", "not", "but", "all", "any", "can", "how", "why", "who", "what",
  "when", "where", "add", "new", "use", "get", "set", "job", "page",
]);

function dedupe(rows: Recalled[], limit: number) {
  const seen = new Set<string>();
  const out: Recalled[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}
