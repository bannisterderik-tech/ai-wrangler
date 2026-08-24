"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = { id: string; name: string; vercel?: { connected: boolean; bound?: number; mode?: string } };
type Profile = {
  project?: string;
  pct?: number;
  repo?: string;
  vercel?: string;
  supabase?: string;
  rules?: string;
  owner?: string;
  contact?: { name: string; role: string; phone: string; email: string; addr: string };
  health?: { label: string; value: string; color: string }[];
  timeline?: { who: string; text: string; when: string }[];
};

export default function CustomersPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [id, setId] = useState("");
  const [detail, setDetail] = useState<{ name: string; profile: Profile; vercel: Customer["vercel"] } | null>(null);

  async function loadList() {
    const data = await fetch("/api/customers").then((r) => r.json());
    setList(data.customers || []);
    setId((cur) => cur || data.customers?.[0]?.id || "");
  }

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then(setDetail);
  }, [id]);

  const p = detail?.profile || {};
  const c = p.contact;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1.5 overflow-x-auto px-[18px] py-2.5" style={{ borderBottom: "1px solid var(--hairline)" }}>
        {list.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setId(tb.id)}
            className="cursor-pointer whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs"
            style={{
              background: id === tb.id ? "var(--surface-inset)" : "transparent",
              borderColor: id === tb.id ? "var(--brand)" : "var(--hairline)",
            }}
          >
            {tb.name}
          </button>
        ))}
        <div className="flex-1" />
        <Link href="/connect" className="shrink-0 rounded-lg border px-3 py-1.5 text-[11.5px] no-underline" style={{ background: "var(--btn)", borderColor: "var(--hairline)", color: "var(--text-primary)" }}>
          Connect Vercel
        </Link>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[270px_1fr]">
        <div className="flex flex-col gap-4 overflow-y-auto px-[18px] py-4" style={{ borderRight: "1px solid var(--hairline)" }}>
          <div className="rounded-[10px] border p-3" style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}>
            <div className="text-[13px] font-semibold">{c?.name || "Add a contact"}</div>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{c?.role}</div>
            <div className="mt-2 flex flex-col gap-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
              <span>{c?.phone}</span>
              <span>{c?.email}</span>
              <span>{c?.addr}</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>Project</div>
            <div className="mt-1 text-[13.5px] font-semibold">{p.project}</div>
            <div className="mt-2 flex justify-between text-[11px]" style={{ color: "var(--text-secondary)" }}>
              <span>Progress</span>
              <span className="tabular-nums">{p.pct || 0}%</span>
            </div>
            <div className="mt-1 h-[5px] overflow-hidden rounded-sm" style={{ background: "var(--surface-inset)" }}>
              <div className="h-full rounded-sm" style={{ width: `${p.pct || 0}%`, background: "var(--brand)" }} />
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>Connected accounts</div>
            <div className="font-mono flex flex-col gap-1 text-[10.5px]">
              <Row k="GitHub" v={p.repo?.replace("github.com/", "") || "—"} />
              <Row k="Vercel" v={detail?.vercel?.connected ? `${detail.vercel.mode} · ${detail.vercel.bound || 0} bound` : p.vercel || "not connected"} />
              <Row k="Supabase" v={p.supabase || "—"} />
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>Code health</div>
            {(p.health || []).map((h) => (
              <div key={h.label} className="mb-1.5 flex justify-between gap-2 text-[11.5px]">
                <span style={{ color: "var(--text-secondary)" }}>{h.label}</span>
                <span style={{ color: h.color }}>{h.value}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>House rules</div>
            <div className="text-[11.5px] leading-relaxed">{p.rules}</div>
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="px-[18px] pt-4 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
            One timeline — people and AI together
          </div>
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-[18px] py-2">
            {(p.timeline || []).map((ev, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="mt-0.5 shrink-0 rounded-[5px] border px-1.5 py-0.5 text-[9.5px] font-semibold"
                  style={{
                    background: ev.who === "AI" ? "var(--surface-inset)" : "transparent",
                    borderColor: ev.who === "AI" ? "var(--state-running)" : "var(--hairline)",
                    color: ev.who === "AI" ? "var(--state-running)" : "var(--text-primary)",
                  }}
                >
                  {ev.who}
                </span>
                <div>
                  <div className="text-[12.5px] leading-snug">{ev.text}</div>
                  <div className="text-[10.5px]" style={{ color: "var(--text-secondary)" }}>{ev.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-1.5">
      <span style={{ color: "var(--text-secondary)" }}>{k}</span>
      <span className="overflow-hidden text-ellipsis" style={{ color: "var(--state-running)" }}>{v}</span>
    </div>
  );
}
