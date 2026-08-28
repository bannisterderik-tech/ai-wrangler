"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, TITLES } from "@/lib/nav";
import { DialerDock, DialerProvider } from "./DialerDock";

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [clock, setClock] = useState("");
  const [needs, setNeeds] = useState(0);
  const [me, setMe] = useState<{ name: string; via: string } | null>(null);
  // The client side is a different product with a different audience. It must not
  // render the agency's navigation — those links are not theirs to see, never mind
  // follow, and the middleware refusing them afterwards is not the same as not
  // showing them.
  const bare = path === "/login" || path === "/client" || path.startsWith("/client/");

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
    // A full document load on purpose: router.push would keep every screen's
    // fetched rows alive in memory after the session that was allowed to read
    // them is gone.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
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
    <DialerProvider>
      <div
        className="fixed inset-0 grid"
        style={{
          gridTemplateColumns: "248px 1fr",
          gridTemplateRows: "1fr 64px",
          background: "var(--surface-void)",
        }}
      >
        <aside
          className="flex flex-col"
          style={{
            gridRow: "1 / span 2",
            background: "var(--surface-raised)",
            borderRight: "1px solid var(--hairline)",
          }}
        >
          <div className="flex items-center gap-2.5 px-4 pb-3.5 pt-4">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg text-[15px] font-extrabold"
              style={{ background: "linear-gradient(135deg, var(--brand), #ff8a4c)", color: "#140800" }}
            >
              ✛
            </span>
            <div>
              <div className="text-[14px] font-semibold tracking-[0.3px]">AI WRANGLER</div>
              <div className="text-[10px] uppercase tracking-[1.4px]" style={{ color: "var(--text-secondary)" }}>
                Local domination OS
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col overflow-y-auto px-2.5">
            {NAV.map((group) => (
              <div key={group.section}>
                <div
                  className="px-2.5 pb-0.5 pt-3 text-[9px] font-semibold tracking-[1.6px]"
                  style={{ color: group.section === "BUILD" ? "var(--brand-text)" : "var(--text-secondary)" }}
                >
                  {group.section}
                </div>
                {group.items.map((item) => {
                  const active = path === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-[9px] px-2.5 py-2 text-[13px] no-underline"
                      style={{
                        background: active ? "var(--brand-dim, rgba(255,77,24,0.14))" : "transparent",
                        color: active ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: active ? 600 : 400,
                        boxShadow: active ? "inset 3px 0 0 var(--brand)" : "none",
                      }}
                    >
                      <span>{item.label}</span>
                      {item.id === "work" && needs > 0 ? (
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
            <Link href="/leads" className="btn-os brand" style={{ textAlign: "center", textDecoration: "none" }}>
              ＋ New lead
            </Link>
            <button className="btn-os" onClick={() => router.push("/dialer")}>
              ＋ Dial the board
            </button>
            <div className="flex gap-1.5">
              <button className="btn-os flex-1" onClick={toggleTheme}>
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <span className="flex flex-1 items-center justify-center font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {clock}
              </span>
            </div>
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col">
          <header
            className="flex h-14 shrink-0 items-center justify-between px-5"
            style={{ background: "var(--surface-raised)", borderBottom: "1px solid var(--hairline)" }}
          >
            <div className="text-[17px] font-semibold tracking-tight">{TITLES[path] || "AI Wrangler"}</div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border px-3.5 py-1.5 text-xs" style={{ borderColor: "var(--hairline)", color: "var(--text-secondary)" }}>
                Search everything… ⌘K
              </span>
              <span className="rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: "var(--hairline)" }}>
                Agency view
              </span>
              <button className="btn-os" onClick={signOut} title={me ? `Signed in as ${me.name}` : "Sign out"}>
                {me ? `${me.name} · Sign out` : "Sign out"}
              </button>
            </div>
          </header>
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
        </div>
        <div style={{ gridColumn: 2 }}>
          <DialerDock />
        </div>
      </div>
    </DialerProvider>
  );
}
