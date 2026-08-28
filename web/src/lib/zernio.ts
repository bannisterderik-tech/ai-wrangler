/**
 * The Google Ads layer, on top of the generated client.
 *
 * Everything Zernio can do lives in `zernio-generated.ts`, straight from their
 * OpenAPI spec. This file adds the one thing a generator cannot: judgement
 * about what a good Google campaign contains, and Google's own limits checked
 * before a round trip is spent discovering them.
 *
 * A local refusal names the field. Google's 400 names a policy enum.
 */
export { ZernioError, zernioConfigured } from "./zernio-http";
export { ZERNIO_OPERATIONS, ZERNIO_EVENTS, type ZernioEventName } from "./zernio-generated";

import { ZernioError } from "./zernio-http";
import {
  attachCampaignAssets as gAttachAssets,
  bulkUpdateAdCampaignStatus,
  createStandaloneAd,
  updateAdCampaign,
  updateAdCampaignStatus,
  updateAdStatus,
} from "./zernio-generated";

export const SNIPPET_HEADERS = [
  "Amenities", "Brands", "Courses", "Degree programs", "Destinations", "Featured hotels",
  "Insurance coverage", "Models", "Neighborhoods", "Service catalog", "Shows", "Styles", "Types",
] as const;
export type SnippetHeader = (typeof SNIPPET_HEADERS)[number];

export type Sitelink = { text: string; linkUrl: string; description1?: string; description2?: string };
export type StructuredSnippet = { header: string; values: string[] };

export type GoogleAd = {
  accountId: string;
  adAccountId: string;
  name: string;
  campaignType: "search" | "display";
  goal?: string;
  budgetAmount: number;
  budgetType: "daily" | "lifetime";
  headline: string;
  body: string;
  linkUrl: string;
  /** Responsive Search Ads take 15 headlines and 4 descriptions in total. */
  additionalHeadlines?: string[];
  additionalDescriptions?: string[];
  keywords?: string[];
  negativeKeywords?: string[];
  sitelinks?: Sitelink[];
  callouts?: string[];
  structuredSnippets?: StructuredSnippet[];
  countries?: string[];
  /** Display only. */
  longHeadline?: string;
  businessName?: string;
  images?: { landscape?: string; square?: string };
  status?: "ACTIVE" | "PAUSED";
};

const trim = (s: unknown) => String(s ?? "").trim();

/**
 * Google's own limits, checked before we spend a round trip on them.
 *
 * Every number came from the spec, which took them from Google.
 */
export function checkGoogleAd(a: GoogleAd): string[] {
  const bad: string[] = [];
  const cap = (label: string, v: string, n: number) => {
    if (v.length > n) bad.push(`${label} is ${v.length} characters; Google allows ${n}.`);
  };

  if (!trim(a.accountId)) bad.push("Connect a Google Ads account first.");
  if (!trim(a.adAccountId)) bad.push("Pick which Google Ads account this runs on.");
  if (!trim(a.name)) bad.push("Give the campaign a name.");
  if (!trim(a.headline)) bad.push("A headline is required.");
  if (!trim(a.body)) bad.push("A description is required.");
  if (!trim(a.linkUrl)) bad.push("A destination URL is required.");
  cap("The headline", trim(a.headline), 30);
  cap("The description", trim(a.body), 90);
  if (!(a.budgetAmount > 0)) bad.push("Set a budget above zero.");

  for (const h of a.additionalHeadlines ?? []) cap(`Headline "${h}"`, h, 30);
  for (const d of a.additionalDescriptions ?? []) cap(`Description "${d}"`, d, 90);
  // 15 and 4 are Google's RSA ceilings, counting the primary one.
  if ((a.additionalHeadlines?.length ?? 0) > 14) bad.push("Google allows 15 headlines in total.");
  if ((a.additionalDescriptions?.length ?? 0) > 3) bad.push("Google allows 4 descriptions in total.");

  if (a.campaignType === "search") {
    if (!(a.keywords ?? []).filter((k) => trim(k)).length) {
      bad.push("A Search campaign needs at least one keyword.");
    }
    for (const k of a.negativeKeywords ?? []) cap(`Negative keyword "${k}"`, k, 80);
  }

  if (a.campaignType === "display") {
    // Google rejects a Responsive Display Ad that has only one of the pair.
    if (!trim(a.images?.landscape)) bad.push("Display needs a landscape image (1.91:1).");
    if (!trim(a.images?.square)) bad.push("Display needs a square image (1:1).");
    cap("The long headline", trim(a.longHeadline), 90);
    cap("The business name", trim(a.businessName), 25);
  }

  const links = a.sitelinks ?? [];
  // Google will not surface a lone sitelink, so one is worse than none.
  if (links.length === 1) bad.push("Sitelinks come in pairs — add a second, or remove the one.");
  if (links.length > 20) bad.push("Google allows 20 sitelinks.");
  for (const s of links) {
    if (!trim(s.text) || !trim(s.linkUrl)) bad.push("Every sitelink needs both text and a URL.");
    cap(`Sitelink "${s.text}"`, trim(s.text), 25);
    if (s.description1) cap("A sitelink description", s.description1, 35);
    if (s.description2) cap("A sitelink description", s.description2, 35);
  }

  const outs = (a.callouts ?? []).filter((c) => trim(c));
  if (outs.length > 20) bad.push("Google allows 20 callouts.");
  for (const c of outs) cap(`Callout "${c}"`, c, 25);

  const snips = a.structuredSnippets ?? [];
  if (snips.length > 20) bad.push("Google allows 20 structured snippets.");
  for (const s of snips) {
    if (!SNIPPET_HEADERS.includes(s.header as SnippetHeader)) {
      bad.push(`"${s.header}" is not one of Google's snippet headers.`);
    }
    const vals = (s.values ?? []).filter((v) => trim(v));
    if (vals.length < 3) bad.push(`"${s.header}" needs at least 3 values.`);
    if (vals.length > 10) bad.push(`"${s.header}" allows at most 10 values.`);
    for (const v of vals) cap(`Snippet value "${v}"`, v, 25);
  }
  return bad;
}

/** Only the fields the endpoint has, and only the ones that were set. */
export function googleAdBody(a: GoogleAd) {
  const list = <T>(x: T[] | undefined) => (x && x.length ? x : undefined);
  const text = (x: string[] | undefined) => list((x ?? []).map(trim).filter(Boolean));
  const search = a.campaignType === "search";
  return {
    accountId: a.accountId,
    adAccountId: a.adAccountId,
    name: trim(a.name),
    campaignType: a.campaignType,
    goal: a.goal || "traffic",
    budgetAmount: a.budgetAmount,
    budgetType: a.budgetType,
    headline: trim(a.headline),
    body: trim(a.body),
    linkUrl: trim(a.linkUrl),
    countries: text(a.countries) ?? ["US"],
    // Ads arrive switched off. Somebody looks before Google starts charging.
    status: a.status ?? "PAUSED",
    additionalHeadlines: text(a.additionalHeadlines),
    additionalDescriptions: text(a.additionalDescriptions),
    // Search-only fields, omitted entirely on Display: the endpoint 400s on
    // negativeKeywords for anything else.
    keywords: search ? text(a.keywords)?.slice(0, 20) : undefined,
    negativeKeywords: search ? text(a.negativeKeywords) : undefined,
    sitelinks: search ? list(a.sitelinks) : undefined,
    callouts: search ? text(a.callouts) : undefined,
    structuredSnippets: search
      ? list(
          (a.structuredSnippets ?? []).map((s) => ({
            header: s.header as SnippetHeader,
            values: s.values.map(trim).filter(Boolean),
          })),
        )
      : undefined,
    longHeadline: search ? undefined : trim(a.longHeadline) || undefined,
    businessName: search ? undefined : trim(a.businessName) || undefined,
    images: search ? undefined : a.images?.landscape && a.images?.square ? a.images : undefined,
    imageUrl: search ? undefined : a.images?.landscape || undefined,
  };
}

export async function createGoogleAd(a: GoogleAd) {
  const bad = checkGoogleAd(a);
  if (bad.length) throw new ZernioError(bad.join(" "), 400);
  return createStandaloneAd(googleAdBody(a) as Parameters<typeof createStandaloneAd>[0]);
}

/**
 * Attach sitelinks, callouts or snippets to a campaign that already exists.
 *
 * The other half of asset work: most campaigns are inherited from whoever ran
 * the account before us, and this is how they get the extensions they never had.
 */
export async function attachCampaignAssets(
  campaignId: string,
  input: { accountId: string; sitelinks?: Sitelink[]; callouts?: string[]; structuredSnippets?: StructuredSnippet[] },
) {
  const has = (x?: unknown[]) => Boolean(x && x.length);
  if (!has(input.sitelinks) && !has(input.callouts) && !has(input.structuredSnippets)) {
    throw new ZernioError("Nothing to attach — add a sitelink, a callout or a snippet.", 400);
  }
  if (input.sitelinks && input.sitelinks.length === 1) {
    throw new ZernioError("Sitelinks come in pairs — Google will not show a single one.", 400);
  }
  return gAttachAssets(campaignId, input as Parameters<typeof gAttachAssets>[1]);
}

export const setAdStatus = (adId: string, status: "active" | "paused") => updateAdStatus(adId, { status });

export const setCampaignStatus = (campaignId: string, status: "active" | "paused") =>
  updateAdCampaignStatus(campaignId, { status, platform: "google" });

export const setManyCampaignStatuses = (campaignIds: string[], status: "active" | "paused") =>
  bulkUpdateAdCampaignStatus({
    status,
    campaigns: campaignIds.map((platformCampaignId) => ({ platformCampaignId, platform: "google" as const })),
  });

/**
 * Rename or re-budget a live campaign.
 *
 * Note the shape: `budget: { amount, type }` here, where create takes flat
 * `budgetAmount` / `budgetType`. That asymmetry is Zernio's, and the generated
 * types are the only reason it is right — the hand-written version had it flat
 * in both places.
 */
export const updateCampaign = (
  campaignId: string,
  patch: { name?: string; budgetAmount?: number; budgetType?: "daily" | "lifetime" },
) =>
  updateAdCampaign(campaignId, {
    platform: "google",
    name: patch.name,
    budget:
      patch.budgetAmount !== undefined
        ? { amount: patch.budgetAmount, type: patch.budgetType ?? "daily" }
        : undefined,
  });
