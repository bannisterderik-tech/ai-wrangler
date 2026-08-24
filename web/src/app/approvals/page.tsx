"use client";

import { useEffect, useState } from "react";

type Gate = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  why: string | null;
  payload: string | null;
  irreversible: boolean;
  status: string;
};

export default function ApprovalsPage() {
  const [rows, setRows] = useState<Gate[]>([]);
  const [sel, setSel] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  async function load() {
    const data = await fetch("/api/approvals").then((r) => r.json());
    const pending = (data.approvals || []).filter((a: Gate) => a.status === "pending");
    setRows(pending);
    setSel((s) => (pending.some((p: Gate) => p.id === s) ? s : pending[0]?.id || ""));
  }

  useEffect(() => {
    load();
  }, []);

  const det = rows.find((r) => r.id === sel) || rows[0];

  async function resolve(action: "approve" | "reject") {
    if (!det) return;
    if (action === "approve" && det.irreversible && confirm !== det.id) {
      setConfirm(det.id);
      return;
    }
    await fetch(`/api/approvals/${det.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    setConfirm(null);
    setRejecting(false);
    setNote("");
    await load();
  }

  if (!det) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
        <div className="text-[26px]">✓</div>
        <div className="text-[13px]">Nothing needs you right now.</div>
        <div className="text-[11.5px]">When the AI wants to do something sensitive, it pauses and asks here.</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1.5 overflow-x-auto px-[18px] py-2.5" style={{ borderBottom: "1px solid var(--hairline)" }}>
        {rows.map((q) => (
          <button
            key={q.id}
            onClick={() => setSel(q.id)}
            className="cursor-pointer whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11.5px]"
            style={{
              background: det.id === q.id ? "var(--surface-inset)" : "transparent",
              borderColor: det.id === q.id ? "var(--state-blocked)" : "var(--hairline)",
            }}
          >
            {q.customerName} — {q.title.slice(0, 30)}
            {q.title.length > 30 ? "…" : ""}
          </button>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2">
        <div className="flex flex-col gap-3.5 overflow-y-auto px-[18px] py-4" style={{ borderRight: "1px solid var(--hairline)" }}>
          <Block k="What it wants to do">
            <div className="mt-1 text-sm font-semibold leading-snug">{det.title}</div>
          </Block>
          <Block k="Why (in its own words)">
            <div className="mt-1 text-[12.5px] leading-relaxed">{det.why}</div>
          </Block>
          <Block k="Cost so far">
            <div className="mt-1 text-sm font-semibold tabular-nums">{det.customerName}</div>
          </Block>
          {det.irreversible ? (
            <div className="rounded-lg border px-2.5 py-2 text-[11.5px] leading-snug" style={{ borderColor: "var(--state-blocked)", color: "var(--state-blocked)" }}>
              This one can't be undone automatically, so approving takes two clicks.
            </div>
          ) : null}
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => resolve("approve")}
              className="flex-1 cursor-pointer rounded-lg py-2.5 text-[13px] font-semibold"
              style={{ background: "var(--state-running)", color: "#0B0C0E" }}
            >
              {det.irreversible && confirm === det.id ? "Click again to confirm" : "Yes, do it"}
            </button>
            <button
              onClick={() => setRejecting(true)}
              className="flex-1 cursor-pointer rounded-lg border py-2.5 text-[13px] font-semibold"
              style={{ background: "none", borderColor: "var(--state-blocked)", color: "var(--state-blocked)" }}
            >
              No — tell it why
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="px-[18px] pt-4 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
            The exact change
          </div>
          <pre
            className="m-2.5 flex-1 overflow-auto whitespace-pre-wrap rounded-lg p-3 font-mono text-[11px] leading-relaxed"
            style={{ background: "var(--surface-inset)", border: "1px solid var(--hairline)" }}
          >
            {det.payload}
          </pre>
        </div>
      </div>
      {rejecting ? (
        <div className="fixed inset-0 z-[9910] flex items-center justify-center" style={{ background: "var(--scrim)" }}>
          <div className="w-[440px] rounded-[14px] p-[18px]" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
            <div className="text-[15px] font-semibold">Tell it what to change</div>
            <div className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Your note goes straight to the AI, word for word.
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-3 h-[90px] w-full resize-none rounded-lg border p-2.5 text-[13px] outline-none"
              style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => resolve("reject")}
                className="flex-1 cursor-pointer rounded-lg py-2 text-[13px] font-semibold"
                style={{ background: "var(--state-blocked)", color: "#0B0C0E" }}
              >
                Send it back
              </button>
              <button
                onClick={() => setRejecting(false)}
                className="cursor-pointer rounded-lg border px-4 py-2 text-[13px]"
                style={{ background: "var(--btn)", borderColor: "var(--hairline)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Block({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
        {k}
      </div>
      {children}
    </div>
  );
}
