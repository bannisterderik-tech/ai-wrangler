"use client";

import { useCallback, useEffect, useState } from "react";
import { DeskBar } from "@/components/os/Dossier";

type Sub = {
  id: string; customerId: string | null; customer: string | null; status: string;
  monthly: number; collected: number; invoicesPaid: number; failures: number;
  lastFailure: string | null; currentPeriodEnd: string | null; startedAt: string | null;
  canceledAt: string | null; hasStripeCustomer: boolean;
};
type Invoice = {
  id: string; subscriptionId: string | null; amount: number; status: string;
  reason: string | null; hostedUrl: string | null; paidAt: string | null; createdAt: string;
};
type Payload = {
  configured: boolean; mrr: number; collected: number;
  counts: { billing: number; pastDue: number; ended: number };
  subscriptions: Sub[]; invoices: Invoice[];
};

const TONE: Record<string, string> = {
  active: "var(--state-go)", trialing: "var(--state-running)",
  past_due: "var(--state-blocked)", unpaid: "var(--state-stop)",
  canceled: "var(--text-secondary)", incomplete: "var(--text-secondary)", paused: "var(--text-secondary)",
};
const money = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const day = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

/**
 * What is actually being collected.
 *
 * Every number here is a sum of invoices Stripe told us about. There is no
 * projection, no annualised figure and no "potential" anything — the OS printed
 * an invented saving once and it is not doing it again.
 */
export default function BillingPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/billing", { cache: "no-store" });
    if (!res.ok) return;
    setData(await res.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: string, confirmWith?: string) {
    if (confirmWith && !confirm(confirmWith)) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "that did not work");
    if (out.url) return window.open(out.url, "_blank", "noopener");
    await load();
  }

  if (!data) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the ledger…</div>;

  const overdue = data.subscriptions.filter((s) => s.status === "past_due");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DeskBar>
        <Figure label="MRR" value={money(data.mrr)} />
        <Figure label="Collected" value={money(data.collected)} />
        <Figure label="Billing" value={String(data.counts.billing)} />
        <Figure label="Overdue" value={String(data.counts.pastDue)} tone={data.counts.pastDue ? "var(--state-blocked)" : undefined} />
        {!data.configured ? (
          <span className="ml-auto text-[11.5px]" style={{ color: "var(--state-blocked)" }}>
            Stripe is not configured — nothing can be charged.
          </span>
        ) : null}
      </DeskBar>

      {error ? (
        <div className="border-b px-4 py-2 text-[12.5px]" style={{ borderColor: "var(--hairline)", color: "var(--state-stop)" }}>{error}</div>
      ) : null}

      {overdue.length ? (
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--state-blocked)" }}>
            Needs a card
          </div>
          <p className="mt-1 max-w-[74ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Stripe retries a declined card for several days before giving up, so these are not lost yet. Send them
            the portal — they fix it themselves and nobody reads a card number down a phone.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {overdue.map((s) => (
              <button key={s.id} className="btn-os" disabled={busy || !s.hasStripeCustomer} onClick={() => act(s.id, "portal")}>
                {s.customer ?? s.customerId} — {money(s.monthly)}/mo
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {data.subscriptions.length === 0 ? (
          <div className="max-w-[74ch] p-5 text-[13.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Nothing recurring yet. A subscription starts itself when a customer pays a proposal that carries a
            monthly figure — the deposit and the first month go through on one card entry, and it renews from
            there. Nothing on this page is ever set by hand.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                {["Customer", "Status", "Monthly", "Collected", "Invoices", "Renews", ""].map((h) => (
                  <th key={h} className="sticky top-0 border-b px-3 py-2" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.subscriptions.map((s) => (
                <tr key={s.id} className="border-b" style={{ borderColor: "var(--hairline)" }}>
                  <td className="px-3 py-2.5"><b>{s.customer ?? s.customerId ?? "—"}</b></td>
                  <td className="px-3 py-2.5" style={{ color: TONE[s.status] ?? "var(--text-secondary)" }}>
                    {s.status.replace("_", " ")}
                    {s.lastFailure ? (
                      <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{s.lastFailure}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{money(s.monthly)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{money(s.collected)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{s.invoicesPaid}</td>
                  <td className="px-3 py-2.5 tabular-nums">{day(s.currentPeriodEnd)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {s.hasStripeCustomer ? (
                        <button className="btn-os" disabled={busy} onClick={() => act(s.id, "portal")}>Portal</button>
                      ) : null}
                      {!["canceled", "unpaid"].includes(s.status) ? (
                        <button
                          className="btn-os"
                          disabled={busy}
                          onClick={() =>
                            act(s.id, "cancel", `Stop ${s.customer ?? "this customer"} renewing?\n\nThey keep what they have already paid for until ${day(s.currentPeriodEnd)}.`)
                          }
                        >
                          Stop renewing
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data.invoices.length ? (
          <div className="p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: "var(--text-secondary)" }}>
              Lately
            </div>
            <div className="flex flex-col gap-1.5">
              {data.invoices.map((i) => (
                <div key={i.id} className="flex flex-wrap items-baseline gap-2 border-b pb-1.5 text-[12px]" style={{ borderColor: "var(--hairline)" }}>
                  <span className="w-[86px] shrink-0 tabular-nums">{money(i.amount)}</span>
                  <span className="w-[58px] shrink-0" style={{ color: i.status === "paid" ? "var(--state-go)" : "var(--state-stop)" }}>
                    {i.status}
                  </span>
                  <span className="w-[92px] shrink-0 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                    {day(i.paidAt ?? i.createdAt)}
                  </span>
                  <span className="min-w-[140px] flex-1" style={{ color: "var(--text-secondary)" }}>
                    {i.reason ?? ""}
                  </span>
                  {i.hostedUrl ? (
                    <a className="btn-os no-underline" href={i.hostedUrl} target="_blank" rel="noopener noreferrer">Invoice</a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="text-[15px] font-semibold tabular-nums" style={{ color: tone }}>{value}</span>
    </span>
  );
}
