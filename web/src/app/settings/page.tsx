"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [customers, setCustomers] = useState<{ id: string; name: string; vercel?: { connected: boolean; bound?: number; mode?: string }; github?: { bound: number } }[]>([]);
  const [gh, setGh] = useState<{ connected?: boolean; login?: string; org?: string | null }>({});

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []));
    fetch("/api/github/status")
      .then((r) => r.json())
      .then(setGh);
  }, []);

  const connected = customers.filter((c) => c.vercel?.connected).length;
  const ghBound = customers.reduce((a, c) => a + (c.github?.bound || 0), 0);

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-2 overflow-y-auto p-4">
      <div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
        Each connection issues the AI its own limited token — never your password. Isolation is per customer.
      </div>
      <Row
        name="Vercel"
        desc="Hosting — previews and production deploys."
        detail={
          connected
            ? `isolated tokens · ${connected} customer${connected === 1 ? "" : "s"} · projects bound, never shared`
            : "Not connected — each customer signs into their own Vercel"
        }
        on={connected > 0}
        href="/connect"
      />
      <Row
        name="GitHub"
        desc="Our org. Code lives here. Clients don’t install anything."
        detail={
          gh.connected
            ? `${gh.org || gh.login} · ${ghBound} repo(s) bound across customers`
            : "Add GITHUB_TOKEN in web/.env.local — our org, not the client’s."
        }
        on={!!gh.connected}
        href="/github"
      />
      <Row name="Supabase" desc="Databases, with row-level walls between customers." detail="Not connected yet." on={false} />
    </div>
  );
}

function Row({
  name,
  desc,
  detail,
  on,
  href,
}: {
  name: string;
  desc: string;
  detail: string;
  on: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] px-3.5 py-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold">{name}</span>
          {on ? (
            <span className="rounded-[5px] border px-1.5 py-0.5 text-[9.5px] font-semibold" style={{ borderColor: "var(--state-running)", color: "var(--state-running)" }}>
              Connected
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>{desc}</div>
        <div className="font-mono mt-1 text-[10.5px]" style={{ color: "var(--text-secondary)" }}>{detail}</div>
      </div>
      {href ? (
        <Link href={href} className="shrink-0 rounded-[7px] px-3 py-1.5 text-[11.5px] font-semibold text-white no-underline" style={{ background: "var(--brand)" }}>
          {on ? "Manage" : "Connect"}
        </Link>
      ) : (
        <span className="shrink-0 text-[11px]" style={{ color: "var(--text-secondary)" }}>
          Soon
        </span>
      )}
    </div>
  );
}
