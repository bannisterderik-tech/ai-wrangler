"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, TITLES } from "@/lib/nav";

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [clock, setClock] = useState("");
  const [needs, setNeeds] = useState(0);
  const [me, setMe] = useState<{ name: string; via: string } | null>(null);
  const bare = path === "/login";

  useEffect(() => {
    const stored = localStorage.getItem("wrangler-theme") as "dark" | "light" | null;
    const t = stored || "dark";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, "0");
      const ap = h >= 12 ? " PM" : " AM";
      h = h % 12 || 12;
      setClock(`${h}:${m}${ap}`);
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (bare) return;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.signedIn ? setMe({ name: d.name, via: d.via }) : setMe(null)))
      .catch(() => {});
  }, [bare]);

  useEffect(() => {
    if (bare) return;
    const load = () =>
      fetch("/api/approvals")
        .then((r) => r.json())
        .then((d) => setNeeds((d.approvals || []).filter((a: { status: string }) => a.status === "pending").length))
        .catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [bare]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("wrangler-theme", next);
  }

  if (bare) {
    return (
      <div className="fixed inset-0" style={{ background: "var(--surface-void)" }}>
        {children}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex" style={{ background: "var(--surface-void)" }}>
      <aside
        className="flex w-[216px] shrink-0 flex-col"
        style={{ background: "var(--surface-raised)", borderRight: "1px solid var(--hairline)" }}
      >
        <div className="px-4 pb-3.5 pt-4">
          <div className="flex items-center gap-2 text-[14px] font-semibold tracking-[0.3px]">
            <span style={{ color: "var(--brand-text)", fontSize: 15 }}>✛</span>
            AI WRANGLER
          </div>
          <div
            className="mt-1 text-[10px] uppercase tracking-[0.8px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Your AI Operating System
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0 overflow-y-auto px-2">
          {NAV.map((group) => (
            <div key={group.section}>
              <div
                className="px-3 pb-0.5 pt-1.5 text-[9px] font-semibold tracking-widest"
                style={{ color: "var(--text-secondary)" }}
              >
                {group.section}
              </div>
              {group.items.map((item) => {
                const active = path === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-[7px] px-3 py-1 text-[11.5px] no-underline"
                    style={{
                      background: active ? "var(--surface-inset)" : "transparent",
                      color: "var(--text-primary)",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span>{item.label}</span>
                    {item.id === "approvals" && needs > 0 ? (
                      <span
                        className="rounded-lg px-1.5 text-[10px] font-semibold tabular-nums"
                        style={{ background: "var(--state-blocked)", color: "#0B0C0E" }}
                      >
                        {needs}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="flex flex-col gap-1.5 border-t p-2.5" style={{ borderColor: "var(--hairline)" }}>
          <Link
            href="/customers"
            className="rounded-lg py-1.5 text-center text-xs font-semibold text-white no-underline"
            style={{ background: "var(--brand)" }}
          >
            ＋ New customer
          </Link>
          <Link
            href="/work"
            className="rounded-lg border py-1.5 text-center text-xs no-underline"
            style={{
              background: "var(--btn)",
              borderColor: "var(--hairline)",
              color: "var(--text-primary)",
            }}
          >
            ＋ Give the AI a task
          </Link>
          <Link
            href="/github"
            className="rounded-lg border py-1.5 text-center text-xs no-underline"
            style={{
              background: "var(--btn)",
              borderColor: "var(--hairline)",
              color: "var(--text-primary)",
            }}
          >
            Our GitHub
          </Link>
          <div className="flex gap-1.5">
            <button
              onClick={toggleTheme}
              className="flex-1 cursor-pointer rounded-lg border py-1 text-[11px]"
              style={{
                background: "none",
                borderColor: "var(--hairline)",
                color: "var(--text-secondary)",
              }}
            >
              {theme === "dark" ? "Light" : "Dark"} mode
            </button>
            <span
              className="flex flex-1 items-center justify-center text-[11px] tabular-nums"
              style={{ color: "var(--text-secondary)" }}
            >
              {clock}
            </span>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-[52px] shrink-0 items-center justify-between px-5"
          style={{
            background: "var(--surface-raised)",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <div className="text-[15px] font-semibold">{TITLES[path] || "AI Wrangler"}</div>
          <div className="flex items-center gap-2">
            <span
              className="rounded-lg border px-3.5 py-1.5 text-xs"
              style={{
                background: "var(--btn)",
                borderColor: "var(--hairline)",
                color: "var(--text-secondary)",
              }}
            >
              Search everything…
            </span>
            <span
              className="rounded-lg border px-3 py-1.5 text-xs"
              style={{
                background: "var(--btn)",
                borderColor: "var(--hairline)",
                color: "var(--text-primary)",
              }}
            >
              Agency view ▾
            </span>
            <button
              onClick={signOut}
              title={me ? `Signed in as ${me.name} (${me.via})` : "Sign out"}
              className="cursor-pointer rounded-lg border px-3 py-1.5 text-xs"
              style={{
                background: "var(--btn)",
                borderColor: "var(--hairline)",
                color: "var(--text-secondary)",
              }}
            >
              {me ? `${me.name} · Sign out` : "Sign out"}
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
