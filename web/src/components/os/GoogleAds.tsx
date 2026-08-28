"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleCampaign } from "./GoogleCampaign";

type Binding = { customerId: string; customerName: string; accountId: string; adAccountId: string; name: string };
type Row = Record<string, unknown>;

const VIEWS = [
  ["tree", "Campaigns"],
  ["search-terms", "Search terms"],
  ["keywords", "Keywords"],
  ["lsa", "Local Services leads"],
  ["build", "Build a campaign"],
] as const;
type View = (typeof VIEWS)[number][0];

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const money = (v: unknown) => "$" + num(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
const str = (v: unknown) => (v == null ? "" : String(v));

/**
 * A customer's Google account, as Google reports it.
 *
 * Everything on this screen came back from Google in the last few seconds.
 * Nothing here is a number somebody typed into the OS, which is the whole
 * difference between this and the planning table beside it.
 */
export function GoogleAds() {
  const [bindings, setBindings] = useState<Binding[] | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [view, setView] = useState<View>("tree");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/ads/accounts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { bound: [] }))
      .then((d) => {
        setBindings(d.bound ?? []);
        if (d.bound?.length) setCustomerId(d.bound[0].customerId);
      });
  }, []);

  const load = useCallback(async () => {
    if (!customerId || view === "build") return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/ads/google?customerId=${encodeURIComponent(customerId)}&view=${view}`, { cache: "no-store" });
    const out = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setData(null);
      return setError(out.error || "Google would not answer");
    }
    setData(out);
    if (out.connected === false) setError(out.reason || "");
  }, [customerId, view]);
  useEffect(() => {
    load();
  }, [load]);

  async function flip(campaignId: string, status: "active" | "paused") {
    setBusy(true);
    const res = await fetch("/api/ads/google/campaign", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, campaignId, status }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "that did not work");
    await load();
  }

  const chosen = bindings?.find((b) => b.customerId === customerId) ?? null;

  const campaigns = useMemo(() => {
    const raw = (data?.campaigns ?? data?.tree ?? []) as Row[];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  if (!bindings) return <Note>Reading the connections…</Note>;
  if (!bindings.length) {
    return (
      <Note>
        No customer has a Google Ads account bound yet. Bind one on Settings → Ad accounts — every call Google
        answers is scoped to an account, and picking it is deliberate rather than guessed from a name.
      </Note>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: "var(--hairline)" }}>
        <select className="btn-os" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          {bindings.map((b) => (
            <option key={b.customerId} value={b.customerId}>{b.customerName}</option>
          ))}
        </select>
        {VIEWS.map(([v, label]) => (
          <button key={v} className={`btn-os ${view === v ? "brand" : ""}`} onClick={() => setView(v)}>{label}</button>
        ))}
        {chosen ? (
          <span className="ml-auto font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {chosen.name} · {chosen.adAccountId}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="border-b px-4 py-2 text-[12.5px]" style={{ borderColor: "var(--hairline)", color: "var(--state-blocked)" }}>
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {view === "build" && chosen ? (
          <GoogleCampaign customerId={chosen.customerId} customerName={chosen.customerName} onDone={() => setView("tree")} />
        ) : loading ? (
          <Note>Asking Google…</Note>
        ) : view === "tree" ? (
          campaigns.length ? (
            <Table
              head={["Campaign", "Status", "Spend", "Impressions", "Clicks", "Conversions", "Cost/conv.", ""]}
              rows={campaigns.map((c) => {
                const conv = num(c.conversions);
                const spend = num(c.spend);
                const id = str(c.platformCampaignId || c.campaignId || c.id);
                const live = /active|enabled/i.test(str(c.status));
                return [
                  <b key="n">{str(c.name) || id}</b>,
                  <span key="s" style={{ color: live ? "var(--state-go)" : "var(--text-secondary)" }}>{str(c.status)}</span>,
                  money(spend),
                  num(c.impressions).toLocaleString(),
                  num(c.clicks).toLocaleString(),
                  conv.toLocaleString(),
                  conv ? money(spend / conv) : "—",
                  <button key="b" className={`btn-os ${live ? "" : "brand"}`} disabled={busy}
                    onClick={() => flip(id, live ? "paused" : "active")}>
                    {live ? "Pause" : "Start"}
                  </button>,
                ];
              })}
            />
          ) : (
            <Note>No campaigns on this account in the last 90 days.</Note>
          )
        ) : view === "search-terms" ? (
          <Terms data={data} />
        ) : view === "keywords" ? (
          <Keywords data={data} />
        ) : (
          <Leads data={data} />
        )}
      </div>
    </div>
  );
}

/** What people actually typed. Every bad one here is a negative keyword. */
function Terms({ data }: { data: Record<string, unknown> | null }) {
  const rows = ((data?.searchTerms ?? data?.results ?? []) as Row[]) || [];
  if (!rows.length) return <Note>No search terms in this range. Google publishes them a day or two behind.</Note>;
  return (
    <Table
      head={["What they searched", "Matched", "Impressions", "Clicks", "Cost", "Conversions"]}
      rows={rows.map((r) => [
        str(r.searchTerm || r.term),
        str(r.keyword || r.matchType),
        num(r.impressions).toLocaleString(),
        num(r.clicks).toLocaleString(),
        money(r.cost ?? r.spend),
        num(r.conversions).toLocaleString(),
      ])}
    />
  );
}

function Keywords({ data }: { data: Record<string, unknown> | null }) {
  const rows = ((data?.keywords ?? []) as Row[]) || [];
  if (!rows.length) return <Note>No keywords on this account.</Note>;
  return (
    <Table
      head={["Keyword", "Match", "Status", "Impressions", "Clicks", "Cost"]}
      rows={rows.map((r) => [
        <span key="k">{str(r.text || r.keyword)}{r.negative ? <em style={{ color: "var(--text-secondary)" }}> · negative</em> : null}</span>,
        str(r.matchType),
        str(r.status),
        num(r.impressions).toLocaleString(),
        num(r.clicks).toLocaleString(),
        money(r.cost ?? r.spend),
      ])}
    />
  );
}

/** Local Services leads — for a trade, this is the money end of Google. */
function Leads({ data }: { data: Record<string, unknown> | null }) {
  const rows = ((data?.leads ?? []) as Row[]) || [];
  if (!rows.length) {
    return <Note>No Local Services leads in this range. This is empty unless the shop runs LSA, which is separate from Search.</Note>;
  }
  return (
    <Table
      head={["When", "Type", "Who", "Status", "Charged"]}
      rows={rows.map((r) => [
        str(r.creationDateTime || r.createdAt).slice(0, 16).replace("T", " "),
        str(r.leadType).toLowerCase().replace("_", " "),
        str(r.contactDetails || r.consumerPhoneNumber || r.name) || "—",
        str(r.leadStatus || r.status),
        r.chargeStatus || r.charged ? "yes" : "no",
      ])}
    />
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            {head.map((h) => (
              <th key={h} className="sticky top-0 border-b px-3 py-2" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b" style={{ borderColor: "var(--hairline)" }}>
              {r.map((cell, j) => (
                <td key={j} className={`px-3 py-2.5 ${j > 1 ? "tabular-nums" : ""}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[74ch] p-5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
      {children}
    </p>
  );
}
