"use client";

import { useEffect, useState } from "react";

type Ch = {
  id: string;
  customerName: string;
  title: string;
  repo: string | null;
  branch: string | null;
  files: number;
  status: string;
  diff: string | null;
  expl: string | null;
};

export default function ChangesPage() {
  const [rows, setRows] = useState<Ch[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/changes")
      .then((r) => r.json())
      .then((d) => setRows(d.changes || []));
  }, []);

  if (!rows.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1" style={{ color: "var(--text-secondary)" }}>
        <div className="text-[13px]">No changes yet.</div>
        <div className="text-[11.5px]">As the AI writes code, every change lands here automatically.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-[18px] py-4">
      <div className="mb-1 text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Every line of code the AI writes, for every customer, in one place — tagged with the repo it was pushed to.
      </div>
      {rows.map((c) => (
        <div key={c.id} className="overflow-hidden rounded-[10px] border" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
          <button
            onClick={() => setOpen(open === c.id ? null : c.id)}
            className="flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left"
            style={{ background: "none", border: "none", color: "var(--text-primary)" }}
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[12.5px] font-medium">
                {c.customerName} — {c.title}
              </span>
              <span className="font-mono text-[10.5px]" style={{ color: "var(--text-secondary)" }}>
                {c.repo?.replace("github.com/", "")} · {c.branch} · {c.files} files
              </span>
            </span>
            <span className="shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold" style={{ color: "var(--state-running)", borderColor: "var(--state-running)" }}>
              {c.status}
            </span>
          </button>
          {open === c.id ? (
            <div className="grid grid-cols-2 gap-2.5 border-t px-3.5 py-3" style={{ borderColor: "var(--hairline)" }}>
              <pre className="max-h-[180px] overflow-auto whitespace-pre-wrap rounded-lg p-2.5 font-mono text-[10.5px] leading-relaxed" style={{ background: "var(--surface-inset)", border: "1px solid var(--hairline)" }}>
                {c.diff}
              </pre>
              <div className="max-h-[180px] overflow-auto whitespace-pre-wrap rounded-lg p-2.5 text-xs leading-relaxed" style={{ background: "var(--surface-inset)", border: "1px solid var(--hairline)" }}>
                {c.expl}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
