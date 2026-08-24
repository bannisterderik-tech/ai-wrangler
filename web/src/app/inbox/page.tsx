"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  customerId: string;
  fromName: string;
  via: string;
  at: string;
  text: string;
  task: string;
  status: string;
};

export default function InboxPage() {
  const [items, setItems] = useState<Item[]>([]);
  const router = useRouter();

  async function load() {
    const data = await fetch("/api/inbox").then((r) => r.json());
    setItems(data.items || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function wrangle(id: string) {
    await fetch(`/api/inbox/${id}/wrangle`, { method: "POST" });
    await load();
    router.push("/work");
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-[18px] py-4">
      <div className="mb-1 text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Customer messages from email and Slack land here. One click hands them to the Head Wrangler.
      </div>
      {items.map((im) => (
        <div
          key={im.id}
          className="flex items-center gap-3 rounded-[10px] px-3.5 py-3"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold">{im.fromName}</span>
              <span className="rounded-[5px] border px-1.5 py-0.5 text-[9.5px] font-semibold" style={{ borderColor: "var(--hairline)", color: "var(--text-secondary)" }}>
                {im.via}
              </span>
              <span className="text-[10.5px]" style={{ color: "var(--text-secondary)" }}>{im.at}</span>
              {im.status === "new" ? (
                <span className="rounded-[5px] border px-1.5 py-0.5 text-[9.5px] font-semibold" style={{ borderColor: "var(--state-blocked)", color: "var(--state-blocked)" }}>
                  SLA: reply within 4h
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-[12.5px] leading-relaxed">“{im.text}”</div>
          </div>
          {im.status === "new" ? (
            <button
              onClick={() => wrangle(im.id)}
              className="shrink-0 cursor-pointer rounded-lg px-3 py-2 text-[11.5px] font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              Wrangle it →
            </button>
          ) : (
            <span className="shrink-0 text-[11.5px]" style={{ color: "var(--state-running)" }}>
              ✓ Turned into a task
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
