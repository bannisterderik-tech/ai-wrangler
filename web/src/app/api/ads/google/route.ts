import { NextResponse } from "next/server";
import { fail, guardTenant } from "@/lib/api";
import { bindingFor } from "@/lib/ads-scope";
import { ZernioError, zernioConfigured } from "@/lib/zernio";
import {
  generateKeywordIdeas, generateKeywordHistoricalMetrics, getAdTree, getAdsSearchTerms,
  getAdsTimeline, getCampaignAnalytics, listAdKeywords, listLocalServicesLeadConversations,
  listLocalServicesLeads, queryAdInsights,
} from "@/lib/zernio-generated";

/**
 * Everything Google will tell us about one customer's account.
 *
 * One route with a `view` rather than a dozen files, because they all need the
 * same two checks first: the customer belongs to this agency, and this ad
 * account belongs to that customer. Writing that pair a dozen times is how one
 * of them ends up written wrong.
 */
export async function GET(req: Request) {
  const t = await guardTenant();
  if ("error" in t) return t.error;
  try {
    const url = new URL(req.url);
    const q = (k: string) => url.searchParams.get(k) || undefined;
    const list = (k: string) => (q(k) || "").split(",").map((s) => s.trim()).filter(Boolean);
    const customerId = String(q("customerId") || "");
    const view = String(q("view") || "tree");

    const b = await bindingFor(t.tenantId, customerId);
    if (!b) {
      return NextResponse.json({ error: "That customer has no Google Ads account bound." }, { status: 404 });
    }
    if (!zernioConfigured()) {
      // An empty screen that says why beats one that looks broken, and beats
      // invented numbers by a mile.
      return NextResponse.json({
        connected: false,
        binding: b,
        reason: "Zernio is not connected — set ZERNIO_API_KEY.",
      });
    }

    const account = b.accountId;
    const google = b.adAccountId;
    const from = q("from");
    const to = q("to");

    let data: Record<string, unknown>;
    switch (view) {
      case "tree":
        data = await getAdTree({
          accountId: account, adAccountId: google, platform: "google",
          fromDate: from, toDate: to, campaignId: q("campaignId"),
          sort: "spend_desc", limit: 100,
          ...(q("daily") === "1" ? { timeIncrement: 1 as const, dailyLevel: "campaign" as const } : {}),
        });
        break;
      case "timeline":
        data = await getAdsTimeline({ accountId: account, adAccountId: google, platform: "google", fromDate: from, toDate: to });
        break;
      case "search-terms":
        data = await getAdsSearchTerms({
          accountId: account, customerId: google, campaignId: q("campaignId"),
          fromDate: from, toDate: to, pageToken: q("pageToken"),
        });
        break;
      case "keywords":
        data = await listAdKeywords({
          accountId: account, adAccountId: google, campaignId: q("campaignId"),
          negative: q("negative") === "1" ? true : undefined, limit: 200,
        });
        break;
      case "keyword-ideas":
        data = await generateKeywordIdeas({ accountId: account, customerId: google, keywords: list("seed"), url: q("url") } as Parameters<typeof generateKeywordIdeas>[0]);
        break;
      case "keyword-history":
        data = await generateKeywordHistoricalMetrics({ accountId: account, customerId: google, keywords: list("seed") } as Parameters<typeof generateKeywordHistoricalMetrics>[0]);
        break;
      case "lsa":
        data = await listLocalServicesLeads({
          accountId: account, customerId: google, fromDate: from, toDate: to,
          leadType: q("leadType") as "PHONE_CALL" | "MESSAGE" | "BOOKING" | undefined,
          chargedOnly: q("chargedOnly") === "1" ? true : undefined,
          pageToken: q("pageToken"),
        });
        break;
      case "lsa-conversation": {
        const leadId = q("leadId");
        if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
        data = await listLocalServicesLeadConversations(leadId, { accountId: account, customerId: google });
        break;
      }
      case "campaign-analytics": {
        const campaignId = q("campaignId");
        if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });
        data = await getCampaignAnalytics(campaignId, { platform: "google", fromDate: from, toDate: to });
        break;
      }
      case "gaql": {
        const query = q("query");
        if (!query) return NextResponse.json({ error: "a GAQL query is required" }, { status: 400 });
        // GAQL has no write form, so this stays a read whatever arrives.
        data = await queryAdInsights({ accountId: account, query, customerId: google, pageToken: q("pageToken"), limit: 500 });
        break;
      }
      default:
        return NextResponse.json({ error: `unknown view "${view}"` }, { status: 400 });
    }
    return NextResponse.json({ connected: true, binding: b, ...data });
  } catch (e) {
    if (e instanceof ZernioError) return NextResponse.json({ error: e.message }, { status: e.status });
    return fail(e);
  }
}
