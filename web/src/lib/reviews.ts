import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { reviews } from "./schema";
import { newId } from "./customers";
import { ownedBy } from "./tenant-scope";
import { ask } from "./ai";
import { getGoogleBusinessReviews, replyToGoogleBusinessReview } from "./zernio-generated";

/**
 * Reviews, and answering them.
 *
 * The valuable thing is not the list — anyone can read their own reviews. It is
 * knowing which ones nobody has answered, and having a decent reply already
 * written when somebody sits down to do it.
 *
 * Replies are drafted and approved by a person, always. Google overwrites a
 * reply in place and keeps no history, so a machine that answers a one-star
 * review unsupervised cannot be undone — only overwritten again, by somebody
 * who is now much more upset.
 */

export type Review = typeof reviews.$inferSelect;

/** Pull the current page of reviews and fold them into what we already have. */
export async function syncReviews(opts: {
  accountId: string;
  customerId: string;
  tenantId: string;
  locationId?: string;
}) {
  const data = await getGoogleBusinessReviews(opts.accountId, {
    locationId: opts.locationId,
    pageSize: 50,
  });
  const list = ((data.reviews ?? data.items ?? []) as Record<string, unknown>[]) || [];

  let added = 0;
  let updated = 0;
  for (const r of list) {
    const externalId = String(r.reviewId ?? r.name ?? r.id ?? "");
    if (!externalId) continue;
    const reply = (r.reviewReply ?? r.reply) as Record<string, unknown> | undefined;
    const values = {
      author: str(r.reviewer && (r.reviewer as Record<string, unknown>).displayName) ?? str(r.author),
      rating: starsOf(r.starRating ?? r.rating),
      body: str(r.comment ?? r.text ?? r.body, 4000),
      postedAt: date(r.createTime ?? r.postedAt),
      replyText: str(reply?.comment ?? reply?.text, 4000),
      repliedAt: date(reply?.updateTime ?? reply?.repliedAt),
      updatedAt: new Date(),
    };

    const [existing] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.source, "google"), eq(reviews.externalId, externalId)))
      .limit(1);

    if (existing) {
      await db.update(reviews).set(values).where(eq(reviews.id, existing.id));
      updated++;
    } else {
      await db
        .insert(reviews)
        .values({
          id: "RV" + newId().slice(0, 10),
          tenantId: opts.tenantId,
          customerId: opts.customerId,
          source: "google",
          externalId,
          ...values,
        })
        .onConflictDoNothing();
      added++;
    }
  }
  return { added, updated, seen: list.length };
}

const str = (v: unknown, n = 300) => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, n) : null;
};
const date = (v: unknown) => {
  const d = v ? new Date(String(v)) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

/** Google sends FIVE, FOUR… as words on some surfaces and numbers on others. */
function starsOf(v: unknown): number | null {
  const words: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  const s = String(v ?? "").toUpperCase();
  if (words[s]) return words[s];
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : null;
}

const SYSTEM = `You write a short public reply to a review of a local trade business.

Rules:
- Under 50 words. It is read on a phone, under the review.
- Thank them by first name if you have it. Never invent a name.
- Never argue, never blame the customer, never mention a refund or money.
- Never promise anything specific. You do not know what was agreed.
- For anything under four stars: acknowledge it plainly, apologise once, and ask them to get in touch directly. Do not explain or justify.
- Plain sentences. No emoji, no marketing language, no exclamation marks.

Reply with the text only. No quotes, no preamble.`;

/**
 * Draft a reply. Never posts it.
 *
 * The draft is the product: somebody reads three sentences and clicks, instead
 * of staring at a blank box on a Sunday.
 */
export async function draftReply(review: Review, businessName: string) {
  const answer = await ask({
    role: "fast",
    system: SYSTEM,
    cache: true,
    maxTokens: 200,
    prompt:
      `The business is ${businessName}.\n` +
      `Rating: ${review.rating ?? "unknown"} out of 5.\n` +
      `Reviewer: ${review.author ?? "anonymous"}\n` +
      `What they wrote: ${review.body ?? "(no text, just a rating)"}\n\n` +
      `Your reply:`,
  });
  const text = answer.text.trim().replace(/^["']|["']$/g, "").slice(0, 900);
  return { text, costMillicents: Math.round(answer.cents * 1000) };
}

/**
 * Post an approved reply.
 *
 * Reads the review back first. Somebody may have answered it in the Google app
 * since the draft was written, and posting would silently overwrite them —
 * Google keeps no history, so that reply would simply be gone.
 */
export async function postReply(opts: {
  accountId: string;
  review: Review;
  text: string;
  locationId?: string;
}) {
  const fresh = await getGoogleBusinessReviews(opts.accountId, { locationId: opts.locationId, pageSize: 50 });
  const list = ((fresh.reviews ?? fresh.items ?? []) as Record<string, unknown>[]) || [];
  const current = list.find((r) => String(r.reviewId ?? r.name ?? r.id ?? "") === opts.review.externalId);
  const theirs = current ? ((current.reviewReply ?? current.reply) as Record<string, unknown> | undefined) : undefined;
  const already = str(theirs?.comment ?? theirs?.text, 4000);

  if (already && already !== opts.review.replyText) {
    throw new Error(
      "Somebody already replied to this in Google since the draft was written. " +
        "Posting would overwrite them with no way back — reload and look first.",
    );
  }

  // The endpoint takes the comment and nothing else — the location comes from
  // the account. Passing more would be silently dropped, or rejected.
  await replyToGoogleBusinessReview(opts.accountId, opts.review.externalId, {
    comment: opts.text.slice(0, 4000),
  });

  await db
    .update(reviews)
    .set({ replyText: opts.text, repliedAt: new Date(), draftState: "posted", updatedAt: new Date() })
    .where(eq(reviews.id, opts.review.id));
}

/**
 * Everything for one agency, newest first.
 *
 * Scoped in the query, not filtered after the limit — taking 200 rows and then
 * throwing most away means an agency with one customer sees whatever happened
 * to fall inside the first 200 rows of everybody's reviews.
 */
export async function reviewsFor(customerIds: string[]) {
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.source, "google"), ownedBy(reviews.customerId, customerIds)))
    .orderBy(desc(reviews.postedAt))
    .limit(200);
}
