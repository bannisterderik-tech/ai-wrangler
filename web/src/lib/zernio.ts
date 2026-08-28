
const BASE = "https://zernio.com/api/v1";
const KEY = process.env.ZERNIO_API_KEY;

export function zernioConfigured() {
  return Boolean(KEY);
}

async function zernio(path: string, init?: RequestInit) {
  if (!KEY) throw new Error("ZERNIO_API_KEY missing");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Zernio ${res.status}`);
  return data;
}

export async function listAds() {
  // No fabricated campaigns. Without a key there is nothing to report, and the
  // Ads screen reads our own ad_campaigns table anyway.
  if (!zernioConfigured()) {
    return { ok: true, demo: true, ads: [] as unknown[] };
  }
  const data = await zernio("/ads?limit=100");
  return { ok: true, demo: false, ads: data.ads || [] };
}

export async function createAd(input: {
  platform: string;
  name: string;
  budget: number;
  geo?: string;
  accountId?: string;
  adAccountId?: string;
}) {
  if (!zernioConfigured()) {
    return {
      ok: true,
      demo: true,
      ad: {
        id: `A_demo_${Date.now()}`,
        platform: input.platform,
        name: input.name,
        status: "pending_review",
        spend: 0,
        leads: 0,
        cpl: 0,
        roas: 0,
      },
    };
  }
  const data = await zernio("/ads/create", {
    method: "POST",
    body: JSON.stringify({
      platform: input.platform === "google" ? "googleads" : input.platform === "meta" ? "metaads" : input.platform,
      accountId: input.accountId,
      adAccountId: input.adAccountId,
      name: input.name,
      goal: "leads",
      budget: { amount: input.budget, type: "daily" },
      targeting: { geoTargets: input.geo ? [input.geo] : ["US"] },
    }),
  });
  return { ok: true, demo: false, ad: data };
}

export async function setAdStatus(id: string, status: "active" | "paused") {
  if (!zernioConfigured()) {
    return { ok: true, demo: true, id, status };
  }
  await zernio(`/ads/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  return { ok: true, demo: false, id, status };
}
