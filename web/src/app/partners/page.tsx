"use client";

import Link from "next/link";
import { PARTNERS } from "@/lib/os-demo";

export default function PartnersPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-end justify-between px-5 pt-5">
        <div>
          <h3 className="m-0 text-[28px]">Partners. The quiet compounding machine.</h3>
          <p className="mt-2 max-w-[640px] text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
            GCs, plumbers, gyms, water guys — anyone who can hand a roofer a job. Twilio ping when they send one.
          </p>
        </div>
        <Link href="/sms" className="btn-os brand no-underline">Text Ken</Link>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              {["Partner", "Kind", "Market", "Sent us", "Won", "Take", ""].map((h) => (
                <th key={h} className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARTNERS.map((p) => (
              <tr key={p.id}>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}><b>{p.name}</b></td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{p.kind}</td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{p.city}</td>
                <td className="border-b px-3 py-2.5 font-mono" style={{ borderColor: "var(--hairline)" }}>{p.sent}</td>
                <td className="border-b px-3 py-2.5 font-mono" style={{ borderColor: "var(--hairline)" }}>{p.won}</td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{p.take}</td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>
                  <Link href="/sms" className="btn-os no-underline">SMS</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
