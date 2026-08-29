"use client";

import { useCallback, useEffect, useState } from "react";
import { DeskBar } from "@/components/os/Dossier";

type Review = {
  id: string; customerId: string; customer: string; author: string | null;
  rating: number | null; body: string | null; postedAt: string | null;
  replyText: string | null; repliedAt: string | null;
  draftText: string | null; draftState: string;
};

const stars = (n: number | null) => (n ? "★".repeat(n) + "☆".repeat(5 - n) : "—");
const toneFor = (n: number | null) =>
  n === null ? "var(--text-secondary)" : n <= 2 ? "var(--state-stop)" : n === 3 ? "var(--state-blocked)" : "var(--state-go)";

/**
 * The reviews queue.
 *
 * Sorted by what needs answering, not by what is newest — an unanswered
 * one-star from three weeks ago matters more than a five-star from this
 * morning. Nothing posts without somebody reading it: Google overwrites a reply
 * in place and keeps no history, so there is no undo to fall back on.
 */
export default function ReviewsPage() {
  const [rows, setRows] = useState<Review[] | null>(null);
  const [connected, setConnected] = useState(false);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [onlyWaiting, setOnlyWaiting] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/reviews", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setRows(d.reviews ?? []);
    setConnected(Boolean(d.connected));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: string, text?: string) {
    setBusy(id + action);
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, text }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) return setError(out.error || "that did not work");
    if (out.text) setEdit((e) => ({ ...e, [id]: out.text }));
    await load();
  }

  async function sync(customerId: string) {
    setBusy("sync");
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync", customerId }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) return setError(out.error || "could not sync");
    await load();
  }

  if (!rows) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the reviews…</div>;

  // Unanswered first, then worst rating, then newest. That is the work order.
  const sorted = [...rows].sort((a, b) => {
    const aw = a.replyText ? 1 : 0;
    const bw = b.replyText ? 1 : 0;
    if (aw !== bw) return aw - bw;
    if ((a.rating ?? 5) !== (b.rating ?? 5)) return (a.rating ?? 5) - (b.rating ?? 5);
    return +new Date(b.postedAt ?? 0) - +new Date(a.postedAt ?? 0);
  });
  const shown = onlyWaiting ? sorted.filter((r) => !r.replyText) : sorted;
  const customers = [...new Set(rows.map((r) => r.customerId))];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DeskBar>
        <button className={`btn-os ${onlyWaiting ? "brand" : ""}`} onClick={() => setOnlyWaiting(true)}>
          Needs a reply <span className="tabular-nums opacity-70">{rows.filter((r) => !r.replyText).length}</span>
        </button>
        <button className={`btn-os ${onlyWaiting ? "" : "brand"}`} onClick={() => setOnlyWaiting(false)}>
          All <span className="tabular-nums opacity-70">{rows.length}</span>
        </button>
        {customers.map((c) => (
          <button key={c} className="btn-os" disabled={busy === "sync" || !connected} onClick={() => sync(c)}>
            Sync {rows.find((r) => r.customerId === c)?.customer ?? c}
          </button>
        ))}
      </DeskBar>

      {error ? (
        <div className="border-b px-4 py-2 text-[12.5px]" style={{ borderColor: "var(--hairline)", color: "var(--state-stop)" }}>{error}</div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {shown.length === 0 ? (
          <div className="max-w-[74ch] p-5 text-[13.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {rows.length === 0
              ? "No reviews yet. They arrive on their own once a customer's Google account is bound — Zernio tells us the moment one is left. Sync above to pull the back catalogue."
              : "Everything has been answered."}
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {shown.map((r) => (
              <article key={r.id} className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[15px]" style={{ color: toneFor(r.rating) }}>{stars(r.rating)}</span>
                  <b className="text-[13.5px]">{r.author ?? "Anonymous"}</b>
                  <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    {r.customer}{r.postedAt ? ` · ${new Date(r.postedAt).toLocaleDateString()}` : ""}
                  </span>
                  {r.replyText ? (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--state-go)" }}>
                      answered
                    </span>
                  ) : null}
                </div>

                {r.body ? <p className="mt-2 max-w-[76ch] text-[13.5px] leading-relaxed">{r.body}</p> : null}

                {r.replyText ? (
                  <div className="mt-2.5 rounded-lg p-2.5 text-[12.5px] leading-relaxed" style={{ background: "var(--surface)", color: "var(--text-secondary)" }}>
                    <b>Your reply:</b> {r.replyText}
                  </div>
                ) : (
                  <div className="mt-2.5 flex flex-col gap-2">
                    <textarea
                      className="btn-os h-[72px] w-full text-[12.5px]"
                      placeholder="Write a reply, or draft one."
                      value={edit[r.id] ?? r.draftText ?? ""}
                      onChange={(e) => setEdit({ ...edit, [r.id]: e.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button className="btn-os" disabled={Boolean(busy)} onClick={() => act(r.id, "draft")}>
                        {busy === r.id + "draft" ? "Writing…" : "Draft one"}
                      </button>
                      <button className="btn-os" disabled={Boolean(busy)} onClick={() => act(r.id, "save", edit[r.id] ?? "")}>
                        Save
                      </button>
                      <button
                        className="btn-os brand"
                        disabled={Boolean(busy) || !connected || !(edit[r.id] ?? r.draftText)}
                        onClick={() => {
                          if (confirm("Post this publicly on Google?\n\nGoogle replaces a reply in place and keeps no history, so this cannot be undone.")) {
                            act(r.id, "post", edit[r.id] ?? r.draftText ?? "");
                          }
                        }}
                      >
                        Post it
                      </button>
                      <button className="btn-os" disabled={Boolean(busy)} onClick={() => act(r.id, "skip")}>
                        Leave it
                      </button>
                      <span className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                        Nothing posts until you click. There is no undo on Google.
                      </span>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
