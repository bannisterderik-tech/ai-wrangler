"use client";

import { useState } from "react";

const HEADERS = [
  "Amenities", "Brands", "Courses", "Degree programs", "Destinations", "Featured hotels",
  "Insurance coverage", "Models", "Neighborhoods", "Service catalog", "Shows", "Styles", "Types",
];

type Sitelink = { text: string; linkUrl: string; description1: string; description2: string };
type Snippet = { header: string; values: string[] };

const blankSitelink = (): Sitelink => ({ text: "", linkUrl: "", description1: "", description2: "" });

/**
 * Everything Google will take, on one screen.
 *
 * A Search ad with one headline and no extensions is the ad nobody clicks, and
 * it is what every "create a campaign" form produces. Google's own ranking
 * rewards the assets, so the form asks for them: fifteen headlines, four
 * descriptions, sitelinks, callouts, structured snippets, keywords and the
 * negatives that stop the wasted clicks.
 *
 * Character counts are live and Google's own. Running out of room in the box is
 * better than a rejection two days later that says
 * ASSET_LINK_ERROR_TEXT_TOO_LONG.
 */
export function GoogleCampaign({
  customerId,
  customerName,
  onDone,
}: {
  customerId: string;
  customerName: string;
  onDone: () => void;
}) {
  const [type, setType] = useState<"search" | "display">("search");
  const [f, setF] = useState({
    name: "", headline: "", body: "", linkUrl: "", budgetAmount: "50",
    budgetType: "daily" as "daily" | "lifetime", goal: "lead_generation",
    longHeadline: "", businessName: "", landscape: "", square: "", countries: "US",
  });
  const [headlines, setHeadlines] = useState<string[]>(["", ""]);
  const [descriptions, setDescriptions] = useState<string[]>([""]);
  const [keywords, setKeywords] = useState("");
  const [negatives, setNegatives] = useState("");
  const [sitelinks, setSitelinks] = useState<Sitelink[]>([blankSitelink(), blankSitelink()]);
  const [callouts, setCallouts] = useState("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [said, setSaid] = useState("");

  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const payload = () => ({
    customerId,
    name: f.name,
    campaignType: type,
    goal: f.goal,
    budgetAmount: Number(f.budgetAmount) || 0,
    budgetType: f.budgetType,
    headline: f.headline,
    body: f.body,
    linkUrl: f.linkUrl,
    countries: f.countries.split(",").map((c) => c.trim()).filter(Boolean),
    additionalHeadlines: headlines.filter(Boolean),
    additionalDescriptions: descriptions.filter(Boolean),
    keywords: lines(keywords),
    negativeKeywords: lines(negatives),
    callouts: lines(callouts),
    sitelinks: sitelinks.filter((s) => s.text || s.linkUrl),
    structuredSnippets: snippets.filter((s) => s.header && s.values.some(Boolean)),
    longHeadline: f.longHeadline,
    businessName: f.businessName,
    images: { landscape: f.landscape, square: f.square },
  });

  async function send(check: boolean) {
    setBusy(true);
    setError("");
    setSaid("");
    const res = await fetch(`/api/ads/google/campaign${check ? "?check=1" : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    setProblems(out.problems ?? []);
    if (!res.ok) return setError(out.error || "Google would not take that");
    if (check) {
      if (!out.problems?.length) setSaid("Everything Google asks for is here.");
      return;
    }
    setSaid(`Built, and paused. Look it over in Google, then start it — nothing is spending yet.`);
    onDone();
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {(["search", "display"] as const).map((t) => (
            <button key={t} className={`btn-os ${type === t ? "brand" : ""}`} onClick={() => setType(t)}>
              {t === "search" ? "Search" : "Display"}
            </button>
          ))}
          <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>for {customerName}</span>
        </div>
        <p className="mt-2 max-w-[74ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {type === "search"
            ? "A responsive search ad. Google mixes the headlines and descriptions itself, so more of them is more combinations to test — and the extensions below are what makes the ad taller than the one above it."
            : "A responsive display ad. Google requires both a landscape and a square image; supplying one is rejected."}
        </p>
      </div>

      <Group title="The campaign">
        <Field label="Name" wide>
          <input className="btn-os w-full" value={f.name} onChange={set("name")} placeholder={`${customerName} — Search`} />
        </Field>
        <Field label="Budget">
          <input type="number" min="1" className="btn-os w-[110px] tabular-nums" value={f.budgetAmount} onChange={set("budgetAmount")} />
        </Field>
        <Field label="Per">
          <select className="btn-os" value={f.budgetType} onChange={set("budgetType")}>
            <option value="daily">day</option>
            <option value="lifetime">lifetime</option>
          </select>
        </Field>
        <Field label="Goal">
          <select className="btn-os" value={f.goal} onChange={set("goal")}>
            {["lead_generation", "conversions", "traffic", "awareness"].map((g) => (
              <option key={g} value={g}>{g.replace("_", " ")}</option>
            ))}
          </select>
        </Field>
        <Field label="Countries">
          <input className="btn-os w-[100px]" value={f.countries} onChange={set("countries")} placeholder="US" />
        </Field>
      </Group>

      <Group title="The ad">
        <Field label="Headline" cap={30} value={f.headline} wide>
          <input className="btn-os w-full" value={f.headline} onChange={set("headline")} />
        </Field>
        <Field label="Description" cap={90} value={f.body} wide>
          <input className="btn-os w-full" value={f.body} onChange={set("body")} />
        </Field>
        <Field label="Destination URL" wide>
          <input className="btn-os w-full" value={f.linkUrl} onChange={set("linkUrl")} placeholder="https://" />
        </Field>
      </Group>

      {type === "search" ? (
        <>
          <Group
            title="More headlines"
            note="Google builds each impression from these. Fifteen is the ceiling and roughly the point — every one is another combination it can test."
          >
            <Many values={headlines} setValues={setHeadlines} cap={30} max={14} placeholder="Licensed & insured" />
          </Group>

          <Group title="More descriptions" note="Four in total, counting the one above.">
            <Many values={descriptions} setValues={setDescriptions} cap={90} max={3} placeholder="Same-day service across the metro." />
          </Group>

          <Group title="Keywords" note="One per line. Added broad-match; tighten them in Google once you can see what they actually match.">
            <textarea className="btn-os h-[92px] w-full font-mono text-[12px]" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder={"emergency plumber\nwater heater repair"} />
          </Group>

          <Group title="Negative keywords" note="The cheapest line on this page. Every one is a search you stop paying for — start with free, jobs, salary, DIY.">
            <textarea className="btn-os h-[72px] w-full font-mono text-[12px]" value={negatives} onChange={(e) => setNegatives(e.target.value)} placeholder={"free\njobs\nsalary"} />
          </Group>

          <Group
            title="Sitelinks"
            note="Two minimum — Google will not show a single one. Four is its own recommendation, and they take up the space a competitor would have had."
          >
            <div className="flex flex-col gap-2">
              {sitelinks.map((s, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <Field label="Text" cap={25} value={s.text}>
                    <input className="btn-os w-[170px]" value={s.text}
                      onChange={(e) => setSitelinks(sitelinks.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="Book a visit" />
                  </Field>
                  <Field label="URL">
                    <input className="btn-os w-[210px]" value={s.linkUrl}
                      onChange={(e) => setSitelinks(sitelinks.map((x, j) => (j === i ? { ...x, linkUrl: e.target.value } : x)))} placeholder="https://" />
                  </Field>
                  <Field label="Line 1" cap={35} value={s.description1}>
                    <input className="btn-os w-[180px]" value={s.description1}
                      onChange={(e) => setSitelinks(sitelinks.map((x, j) => (j === i ? { ...x, description1: e.target.value } : x)))} />
                  </Field>
                  <Field label="Line 2" cap={35} value={s.description2}>
                    <input className="btn-os w-[180px]" value={s.description2}
                      onChange={(e) => setSitelinks(sitelinks.map((x, j) => (j === i ? { ...x, description2: e.target.value } : x)))} />
                  </Field>
                  <button className="btn-os" onClick={() => setSitelinks(sitelinks.filter((_, j) => j !== i))}>Remove</button>
                </div>
              ))}
              <div>
                <button className="btn-os" disabled={sitelinks.length >= 20} onClick={() => setSitelinks([...sitelinks, blankSitelink()])}>
                  + Sitelink
                </button>
              </div>
            </div>
          </Group>

          <Group title="Callouts" note="Short claims under the ad, 25 characters each. Not clickable — they are there to be read.">
            <textarea className="btn-os h-[72px] w-full font-mono text-[12px]" value={callouts} onChange={(e) => setCallouts(e.target.value)} placeholder={"24/7 emergency\nFree estimates\nLicensed & insured"} />
          </Group>

          <Group title="Structured snippets" note="One of Google's thirteen headers, then three to ten values. Service catalog is the one most trades want.">
            <div className="flex flex-col gap-2">
              {snippets.map((s, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <Field label="Header">
                    <select className="btn-os" value={s.header}
                      onChange={(e) => setSnippets(snippets.map((x, j) => (j === i ? { ...x, header: e.target.value } : x)))}>
                      {HEADERS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </Field>
                  <Field label="Values — one per line, 3 to 10" wide>
                    <textarea className="btn-os h-[64px] w-full font-mono text-[12px]" value={s.values.join("\n")}
                      onChange={(e) => setSnippets(snippets.map((x, j) => (j === i ? { ...x, values: e.target.value.split("\n") } : x)))}
                      placeholder={"Drain cleaning\nWater heaters\nRepiping"} />
                  </Field>
                  <button className="btn-os" onClick={() => setSnippets(snippets.filter((_, j) => j !== i))}>Remove</button>
                </div>
              ))}
              <div>
                <button className="btn-os" disabled={snippets.length >= 20}
                  onClick={() => setSnippets([...snippets, { header: "Service catalog", values: ["", "", ""] }])}>
                  + Snippet
                </button>
              </div>
            </div>
          </Group>
        </>
      ) : (
        <Group title="Display creative" note="Google needs both shapes. Long headline and business name show on the larger placements.">
          <Field label="Long headline" cap={90} value={f.longHeadline} wide>
            <input className="btn-os w-full" value={f.longHeadline} onChange={set("longHeadline")} />
          </Field>
          <Field label="Business name" cap={25} value={f.businessName}>
            <input className="btn-os w-[200px]" value={f.businessName} onChange={set("businessName")} />
          </Field>
          <Field label="Landscape image 1.91:1" wide>
            <input className="btn-os w-full" value={f.landscape} onChange={set("landscape")} placeholder="https://…/1200x628.jpg" />
          </Field>
          <Field label="Square image 1:1" wide>
            <input className="btn-os w-full" value={f.square} onChange={set("square")} placeholder="https://…/1080x1080.jpg" />
          </Field>
        </Group>
      )}

      {problems.length ? (
        <ul className="flex flex-col gap-1 rounded-lg p-3 text-[12.5px]" style={{ background: "var(--surface-raised)", color: "var(--state-blocked)" }}>
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      ) : null}
      {error && !problems.length ? <p className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}
      {said ? <p className="text-[12.5px]" style={{ color: "var(--state-go)" }}>{said}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-os" disabled={busy} onClick={() => send(true)}>Check it</button>
        <button className="btn-os brand" disabled={busy} onClick={() => send(false)}>
          {busy ? "Building…" : "Build it, paused"}
        </button>
        <span className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
          It arrives switched off. Starting the spend is a separate click.
        </span>
      </div>
    </div>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: "var(--text-secondary)" }}>{title}</h4>
      {note ? <p className="max-w-[74ch] text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{note}</p> : null}
      <div className="flex flex-wrap items-end gap-2.5">{children}</div>
    </section>
  );
}

/** A labelled input that shows how much of Google's allowance is left. */
function Field({
  label, children, cap, value, wide,
}: { label: string; children: React.ReactNode; cap?: number; value?: string; wide?: boolean }) {
  const n = (value ?? "").length;
  const over = cap !== undefined && n > cap;
  return (
    <label className={`flex flex-col gap-1 ${wide ? "w-full" : ""}`}>
      <span className="flex items-baseline gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        {label}
        {cap !== undefined ? (
          <span className="tabular-nums" style={{ color: over ? "var(--state-stop)" : "var(--text-secondary)" }}>
            {n}/{cap}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

/** A growing list of one-line texts, each with its own character count. */
function Many({
  values, setValues, cap, max, placeholder,
}: { values: string[]; setValues: (v: string[]) => void; cap: number; max: number; placeholder: string }) {
  return (
    <div className="flex w-full flex-col gap-2">
      {values.map((v, i) => (
        <div key={i} className="flex items-end gap-2">
          <Field label={`#${i + 2}`} cap={cap} value={v} wide>
            <input className="btn-os w-full" value={v} placeholder={placeholder}
              onChange={(e) => setValues(values.map((x, j) => (j === i ? e.target.value : x)))} />
          </Field>
          <button className="btn-os" onClick={() => setValues(values.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <div>
        <button className="btn-os" disabled={values.length >= max} onClick={() => setValues([...values, ""])}>
          + Add {values.length >= max ? "(at Google's limit)" : ""}
        </button>
      </div>
    </div>
  );
}
