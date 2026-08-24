"use client";

import { useEffect, useState } from "react";

export default function MemoryPage() {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [id, setId] = useState("");
  const [rows, setRows] = useState<{ id: string; text: string }[]>([]);
  const [draft, setDraft] = useState("");

  async function loadCust() {
    const d = await fetch("/api/customers").then((r) => r.json());
    setCustomers(d.customers || []);
    setId((cur) => cur || d.customers?.[0]?.id || "");
  }
  async function loadMem(cid: string) {
    const d = await fetch("/api/memories?customerId=" + encodeURIComponent(cid)).then((r) => r.json());
    setRows(d.memories || []);
  }

  useEffect(() => {
    loadCust();
  }, []);
  useEffect(() => {
    if (id) loadMem(id);
  }, [id]);

  async function add() {
    if (!draft.trim() || !id) return;
    await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: id, text: draft }),
    });
    setDraft("");
    await loadMem(id);
  }
  async function del(mid: string) {
    await fetch("/api/memories?id=" + encodeURIComponent(mid), { method: "DELETE" });
    await loadMem(id);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex gap-1.5 overflow-x-auto px-[18px] py-2.5" style={{ borderBottom: "1px solid var(--hairline)" }}>
        {customers.map((c) => (
          <button
            key={c.id}
            onClick={() => setId(c.id)}
            className="cursor-pointer whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs"
            style={{
              background: id === c.id ? "var(--surface-inset)" : "transparent",
              borderColor: id === c.id ? "var(--brand)" : "var(--hairline)",
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="flex flex-1 justify-center overflow-y-auto p-4">
        <div className="flex w-[640px] max-w-full flex-col gap-2.5">
          <div className="text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            What the AI remembers about this customer. Wrong or stale? Delete it — the AI forgets instantly.
          </div>
          {rows.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
              <span className="flex-1 text-[12.5px] leading-relaxed">{m.text}</span>
              <button
                onClick={() => del(m.id)}
                title="Make the AI forget this"
                className="h-[26px] w-[26px] shrink-0 cursor-pointer rounded-[7px] border text-xs"
                style={{ background: "none", borderColor: "var(--hairline)", color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="mt-1 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Teach it something, e.g. “Never deploy for them on Fridays”"
              className="flex-1 rounded-lg border px-2.5 py-2 text-[12.5px] outline-none"
              style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
            />
            <button onClick={add} className="shrink-0 cursor-pointer rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white" style={{ background: "var(--brand)" }}>
              Remember it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
