import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, guardTenant, operator } from "@/lib/api";
import { audit } from "@/lib/schema";
import { bindingFor } from "@/lib/ads-scope";
import {
  attachCampaignAssets, checkGoogleAd, createGoogleAd, googleAdBody, setAdStatus, setCampaignStatus,
  updateCampaign, zernioConfigured, ZernioError, type GoogleAd,
} from "@/lib/zernio";

const str = (v: unknown) => String(v ?? "").trim();
const strs = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

/** Read the request into the shape the Zernio client takes. */
function draft(body: Record<string, unknown>, accountId: string, adAccountId: string): GoogleAd {
  return {
    accountId,
    adAccountId,
    name: str(body.name),
    campaignType: body.campaignType === "display" ? "display" : "search",
    goal: str(body.goal) || "traffic",
    budgetAmount: Number(body.budgetAmount) || 0,
    budgetType: body.budgetType === "lifetime" ? "lifetime" : "daily",
    headline: str(body.headline),
    body: str(body.body),
    linkUrl: str(body.linkUrl),
    additionalHeadlines: strs(body.additionalHeadlines),
    additionalDescriptions: strs(body.additionalDescriptions),
    keywords: strs(body.keywords),
    negativeKeywords: strs(body.negativeKeywords),
    callouts: strs(body.callouts),
    countries: strs(body.countries),
    longHeadline: str(body.longHeadline),
    businessName: str(body.businessName),
    images: {
      landscape: str((body.images as Record<string, unknown>)?.landscape),
      square: str((body.images as Record<string, unknown>)?.square),
    },
    sitelinks: (Array.isArray(body.sitelinks) ? body.sitelinks : [])
      .map((s: Record<string, unknown>) => ({
        text: str(s?.text),
        linkUrl: str(s?.linkUrl),
        description1: str(s?.description1) || undefined,
        description2: str(s?.description2) || undefined,
      }))
      .filter((s) => s.text || s.linkUrl),
    structuredSnippets: (Array.isArray(body.structuredSnippets) ? body.structuredSnippets : [])
      .map((s: Record<string, unknown>) => ({ header: str(s?.header), values: strs(s?.values) }))
      .filter((s) => s.header || s.values.length),
    // Always paused. Making it live is a second, separate click, because the
    // first one is the one somebody makes at 11pm with a typo in the budget.
    status: "PAUSED",
  };
}

/**
 * Build a Google campaign, with the assets that make it worth running.
 *
 * A Search ad with one headline and no extensions is the ad nobody clicks.
 * Everything Google will take — the extra RSA headlines and descriptions,
 * sitelinks, callouts, structured snippets, keywords and negatives — goes in
 * one call, which is what Zernio's create endpoint is for.
 *
 * `?check=1` validates and returns what is wrong without sending anything. The
 * validation is the same function either way, so what the form shows you is
 * what the create will enforce.
 */
export async function POST(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const customerId = str(body.customerId);
    const b = await bindingFor(t.tenantId, customerId);
    if (!b) return NextResponse.json({ error: "That customer has no Google Ads account bound." }, { status: 404 });

    const ad = draft(body, b.accountId, b.adAccountId);
    const problems = checkGoogleAd(ad);
    if (new URL(req.url).searchParams.get("check") === "1") {
      // The exact body that would go to Zernio, so what you approve is what is
      // sent — and so a test can assert on it without a live key.
      return NextResponse.json({ ok: problems.length === 0, problems, body: googleAdBody(ad) });
    }
    if (problems.length) return NextResponse.json({ error: problems.join(" "), problems }, { status: 400 });
    if (!zernioConfigured()) {
      return NextResponse.json({ error: "Zernio is not connected — set ZERNIO_API_KEY." }, { status: 503 });
    }

    const made = await createGoogleAd(ad);
    await db.insert(audit).values({
      customerId,
      actor,
      action: `built a paused Google ${ad.campaignType} campaign`,
      target: `${ad.name} · $${ad.budgetAmount}/${ad.budgetType === "daily" ? "day" : "lifetime"}`,
      at: new Date(),
    });
    return NextResponse.json({ ok: true, ad: made });
  } catch (e) {
    if (e instanceof ZernioError) return NextResponse.json({ error: e.message }, { status: e.status });
    return fail(e);
  }
}

/** Pause, resume, rename or re-budget something already running. */
export async function PATCH(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const customerId = str(body.customerId);
    const b = await bindingFor(t.tenantId, customerId);
    if (!b) return NextResponse.json({ error: "That customer has no Google Ads account bound." }, { status: 404 });
    if (!zernioConfigured()) {
      return NextResponse.json({ error: "Zernio is not connected — set ZERNIO_API_KEY." }, { status: 503 });
    }

    const status = body.status === "paused" ? "paused" : body.status === "active" ? "active" : null;
    const campaignId = str(body.campaignId);
    const adId = str(body.adId);
    let out: unknown;
    let what = "";

    if (adId && status) {
      out = await setAdStatus(adId, status);
      what = `${status} one ad`;
    } else if (campaignId && status) {
      out = await setCampaignStatus(campaignId, status);
      what = `${status} a campaign`;
    } else if (campaignId) {
      const patch: { name?: string; budgetAmount?: number; budgetType?: "daily" | "lifetime" } = {};
      if (body.name !== undefined) patch.name = str(body.name);
      if (body.budgetAmount !== undefined) {
        const n = Number(body.budgetAmount);
        if (!(n > 0)) return NextResponse.json({ error: "a budget has to be above zero" }, { status: 400 });
        patch.budgetAmount = n;
      }
      if (body.budgetType !== undefined) patch.budgetType = body.budgetType === "lifetime" ? "lifetime" : "daily";
      if (!Object.keys(patch).length) return NextResponse.json({ error: "nothing to change" }, { status: 400 });
      out = await updateCampaign(campaignId, patch);
      what = "changed a campaign";
    } else {
      return NextResponse.json({ error: "name a campaign or an ad" }, { status: 400 });
    }

    await db.insert(audit).values({
      customerId, actor, action: `Google Ads: ${what}`, target: campaignId || adId, at: new Date(),
    });
    return NextResponse.json({ ok: true, result: out });
  } catch (e) {
    if (e instanceof ZernioError) return NextResponse.json({ error: e.message }, { status: e.status });
    return fail(e);
  }
}

/**
 * Attach extensions to a campaign that already exists.
 *
 * Most accounts we take over were not built here. This is how an inherited
 * campaign gets the sitelinks and callouts it never had, without rebuilding it.
 */
export async function PUT(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  const actor = (await operator())?.name || "you";
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const customerId = str(body.customerId);
    const campaignId = str(body.campaignId);
    if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    const b = await bindingFor(t.tenantId, customerId);
    if (!b) return NextResponse.json({ error: "That customer has no Google Ads account bound." }, { status: 404 });
    if (!zernioConfigured()) {
      return NextResponse.json({ error: "Zernio is not connected — set ZERNIO_API_KEY." }, { status: 503 });
    }

    const sitelinks = (Array.isArray(body.sitelinks) ? body.sitelinks : []).map((s: Record<string, unknown>) => ({
      text: str(s?.text),
      linkUrl: str(s?.linkUrl),
      description1: str(s?.description1) || undefined,
      description2: str(s?.description2) || undefined,
    })).filter((s) => s.text && s.linkUrl);
    const callouts = strs(body.callouts);
    const structuredSnippets = (Array.isArray(body.structuredSnippets) ? body.structuredSnippets : [])
      .map((s: Record<string, unknown>) => ({ header: str(s?.header), values: strs(s?.values) }))
      .filter((s) => s.header && s.values.length);

    const out = await attachCampaignAssets(campaignId, {
      accountId: b.accountId,
      sitelinks: sitelinks.length ? sitelinks : undefined,
      callouts: callouts.length ? callouts : undefined,
      structuredSnippets: structuredSnippets.length ? structuredSnippets : undefined,
    });
    await db.insert(audit).values({
      customerId, actor,
      action: "attached Google assets",
      target: `${campaignId}: ${sitelinks.length} sitelinks, ${callouts.length} callouts, ${structuredSnippets.length} snippets`,
      at: new Date(),
    });
    return NextResponse.json({ ok: true, result: out });
  } catch (e) {
    if (e instanceof ZernioError) return NextResponse.json({ error: e.message }, { status: e.status });
    return fail(e);
  }
}
