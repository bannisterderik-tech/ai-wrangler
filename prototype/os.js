/* AI Wrangler OS — frontend preview (Twilio + Zernio wired as live-shaped demo until keys land). */
(() => {
  const NAV = [
    ["FUNNEL", [
      ["command", "Command"],
      ["pipeline", "Pipeline"],
      ["leads", "Leads"],
      ["prospects", "Prospects"],
      ["dialer", "Dialer"],
      ["sms", "SMS"],
      ["ads", "Ads"],
      ["partners", "Partners"],
    ]],
    ["CLIENTS", [
      ["customers", "Customers"],
      ["inbox", "Inbox"],
      ["billing", "Billing"],
    ]],
    ["BUILD", [
      ["work", "Live work"],
      ["wrangler", "Head Wrangler"],
      ["approvals", "Needs you"],
      ["changes", "Changes"],
      ["playbooks", "Playbooks"],
    ]],
    ["SYSTEM", [
      ["settings", "Settings"],
    ]],
  ];
  const TITLES = {
    command: "Command — dominate the market",
    pipeline: "Pipeline",
    leads: "Lead dossier",
    prospects: "Prospects — firms we want",
    dialer: "Twilio power dialer",
    sms: "SMS — every book",
    ads: "Zernio ads",
    partners: "Partner dossier",
    customers: "Customer dossier",
    inbox: "Inbox",
    billing: "Billing & margin",
    work: "Live work",
    wrangler: "Head Wrangler",
    approvals: "Needs you",
    changes: "All changes",
    playbooks: "Playbooks",
    settings: "Settings",
  };
  const STAGES = ["New", "Speed-to-lead", "Estimate", "Won", "Customer"];
  const CUST = [
    { id: "apex", name: "Apex Roofing", city: "Red Bluff, CA", trade: "Roofing", mrr: 4500, rank: 2, share: "18%" },
    { id: "cascade", name: "Cascade HVAC", city: "Redding, CA", trade: "HVAC", mrr: 3800, rank: 4, share: "11%" },
    { id: "ironclad", name: "Ironclad Plumbing", city: "Chico, CA", trade: "Plumbing", mrr: 3200, rank: 3, share: "14%" },
    { id: "ridge", name: "Ridgeline Electric", city: "Corning, CA", trade: "Electrical", mrr: 2800, rank: 6, share: "9%" },
    { id: "valley", name: "Valley Pest", city: "Tehama County", trade: "Pest", mrr: 2200, rank: 1, share: "22%" },
  ];
  const LEADS = [
    { id: "L1", name: "Maria Delgado", phone: "+1 530 555 0142", kind: "lead", cust: "apex", src: "Google LSA", score: 94, stage: 0, city: "Red Bluff", note: "Storm leak over garage. Wants tarp today.", sla: 38 },
    { id: "L2", name: "James Whitaker", phone: "+1 530 555 0199", kind: "lead", cust: "apex", src: "Meta lead ad", score: 81, stage: 1, city: "Los Molinos", note: "Asphalt shingle, 22sq, insurance claim.", sla: 12 },
    { id: "L3", name: "Priya Shah", phone: "+1 530 555 0114", kind: "prospect", cust: "cascade", src: "LSA", score: 88, stage: 2, city: "Redding", note: "Furnace out. Elderly. After-hours.", sla: 4 },
    { id: "L4", name: "Tom Nguyen", phone: "+1 530 555 0177", kind: "lead", cust: "ironclad", src: "Angi", score: 72, stage: 0, city: "Chico", note: "Slab leak suspected. Two baths down.", sla: 51 },
    { id: "L5", name: "Helen Brooks", phone: "+1 530 555 0108", kind: "customer", cust: "apex", src: "Referral", score: 99, stage: 4, city: "Red Bluff", note: "Full reroof 2025. Review outstanding.", sla: 0 },
    { id: "L6", name: "Derek Holt", phone: "+1 530 555 0160", kind: "lead", cust: "ridge", src: "TikTok", score: 76, stage: 1, city: "Corning", note: "Panel upgrade for EV charger.", sla: 22 },
    { id: "L7", name: "Sofia Alvarez", phone: "+1 530 555 0125", kind: "prospect", cust: "valley", src: "Nextdoor", score: 85, stage: 2, city: "Tehama", note: "Termite swarm. Inspection booked Thu.", sla: 0 },
    { id: "L8", name: "Ken Williamson", phone: "+1 970 555 0144", kind: "partner", cust: "apex", src: "Trade", score: 90, stage: 4, city: "Montrose", note: "Sends 4–6 roofing jobs / month.", sla: 0 },
    { id: "L9", name: "Anita Cole", phone: "+1 530 555 0182", kind: "lead", cust: "cascade", src: "Google", score: 69, stage: 0, city: "Anderson", note: "AC quote vs two competitors.", sla: 63 },
    { id: "L10", name: "Luis Ortega", phone: "+1 530 555 0133", kind: "lead", cust: "apex", src: "Storm list", score: 91, stage: 2, city: "Red Bluff", note: "Hail 1.25\". Adjuster on site Friday.", sla: 0 },
    { id: "L11", name: "Megan Fitch", phone: "+1 530 555 0155", kind: "prospect", cust: "ironclad", src: "SMS blast", score: 64, stage: 1, city: "Durham", note: "Water heater 14yrs. Financing ask.", sla: 19 },
    { id: "L12", name: "Chris Patel", phone: "+1 530 555 0190", kind: "customer", cust: "cascade", src: "Won", score: 86, stage: 4, city: "Redding", note: "Maintenance plan. Upsell UV light.", sla: 0 },
  ];
  const ADS = [
    { id: "A1", cust: "apex", platform: "google", name: "Roof replacement — Red Bluff 20mi", status: "active", spend: 1840, leads: 41, cpl: 44.88, roas: 6.2, goal: "leads" },
    { id: "A2", cust: "apex", platform: "meta", name: "Storm leak — instant call", status: "active", spend: 920, leads: 28, cpl: 32.86, roas: 4.8, goal: "calls" },
    { id: "A3", cust: "cascade", platform: "google", name: "Emergency HVAC Redding", status: "active", spend: 1310, leads: 22, cpl: 59.55, roas: 5.1, goal: "leads" },
    { id: "A4", cust: "ironclad", platform: "tiktok", name: "Slab leak 15s", status: "paused", spend: 410, leads: 9, cpl: 45.56, roas: 3.4, goal: "traffic" },
    { id: "A5", cust: "valley", platform: "meta", name: "Termite swarm season", status: "active", spend: 640, leads: 19, cpl: 33.68, roas: 7.1, goal: "leads" },
    { id: "A6", cust: "ridge", platform: "google", name: "EV panel upgrade", status: "pending_review", spend: 0, leads: 0, cpl: 0, roas: 0, goal: "leads" },
  ];
  const PARTNERS = [
    { id: "P1", name: "Williamson Water", kind: "Trade partner", city: "Montrose, CO", sent: 11, won: 4, take: "10%" },
    { id: "P2", name: "Tehama Family Fitness", kind: "Community", city: "Red Bluff", sent: 3, won: 1, take: "gift card" },
    { id: "P3", name: "Dudley Excavating", kind: "Trade partner", city: "Tehama County", sent: 7, won: 3, take: "12%" },
    { id: "P4", name: "Mistletoe Construction", kind: "GC", city: "Red Bluff", sent: 9, won: 5, take: "8%" },
  ];
  const JOBS = [
    { id: "J1", cust: "apex", title: "Storm-landing page + LSA form", status: "working", spent: 6.4, budget: 20, log: ["Measured bounce on /storm.", "Drafting tarp-today hero + click-to-call.", "Zernio Google campaign queued behind the form."] },
    { id: "J2", cust: "cascade", title: "Speed-to-lead SMS + voicemail drop", status: "blocked", spent: 3.1, budget: 10, log: ["Twilio number provisioned.", "Paused — needs your OK to send first A2P blast."] },
    { id: "J3", cust: "ironclad", title: "Review machine after won jobs", status: "thinking", spent: 1.2, budget: 10, log: ["Reading last 40 invoices for timing."] },
  ];
  const INBOX = [
    { id: "I1", from: "Maya @ Apex", via: "sms", text: "Can the AI text storm leads in under a minute?", task: "Turn on 60s SMS SLA" },
    { id: "I2", from: "Dev @ Cascade", via: "email", text: "We're losing after-hours calls to the big guys.", task: "Night receptionist + Twilio overflow" },
  ];
  const TEMPLATES = [
    { id: "T1", name: "60s speed-to-lead", body: "Hey {name} — this is {company}. Got your request about {job}. Can you take a 2-min call so we can get you on today's board?" },
    { id: "T2", name: "Estimate confirm", body: "{name}, you're on the board for {when}. Reply 1 to confirm, 2 to move it. — {company}" },
    { id: "T3", name: "Review ask", body: "{name} — glad we got you taken care of. Mind a 20-second Google review? It helps the crew. {link}" },
    { id: "T4", name: "Partner ping", body: "Hey {name} — sending you a warm one in {city}. You free to take it this week?" },
  ];
  const SCRIPT = `Hey {name}, this is Wrangler on the line for {company} — you just requested help with {job}.

1. Confirm the address and the pain (leak / no heat / no power).
2. Ask: is anyone home in the next 90 minutes?
3. Book the estimate. Don't quote a number on the first call.
4. If insurance: get carrier + claim #.
5. Text the calendar hold before you hang up.`;

  const state = {
    page: "command",
    theme: localStorage.getItem("wrangler-theme") || "dark",
    q: "",
    search: false,
    lead: "L1",
    sms: "L1",
    tab: "overview",
    custId: "apex",
    prospect: "R1",
    partner: "P1",
    call: null,
    muted: false,
    power: false,
    toast: null,
    filter: "all",
    launch: false,
    tick: 0,
    convos: {
      L1: [{ dir: "in", t: "Roof leaking over the garage since last night." }, { dir: "out", t: "On it. Can you take a 2-min call?" }],
      L3: [{ dir: "out", t: "Furnace crew is 40 min out. Stay warm — extra blankets on us if needed." }],
      L8: [{ dir: "out", t: "Sending you the Red Bluff reroof that came in at 8:14." }, { dir: "in", t: "Got it. I'll take it." }],
    },
    audit: [],
    integrations: {
      twilio: true,
      zernio: true,
      github: true,
      vercel: false,
    },
  };

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cust = (id) => CUST.find((c) => c.id === id);
  const lead = (id) => LEADS.find((l) => l.id === id);
  const money = (n) => "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const clock = () => {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ap}`;
  };
  const toast = (msg) => {
    state.toast = msg;
    render();
    setTimeout(() => { if (state.toast === msg) { state.toast = null; render(); } }, 2800);
  };
  const go = (page) => {
    state.page = page;
    state.tab = "overview";
    location.hash = "#/" + page;
    render();
  };
  const filterLeads = () => LEADS.filter((l) => state.filter === "all" || l.cust === state.filter);
  const jobLeads = () => LEADS.filter((l) => l.kind !== "partner");
  const PX = WR.PROSPECTS || [];
  function ld(l) {
    return Object.assign({
      email: (l.name.split(" ")[0].toLowerCase()) + "@gmail.com",
      addr: l.city + ", CA", year: "—",
      temp: l.score > 85 ? "hot" : l.score > 70 ? "warm" : "cold",
      assigned: "Board", opt: { call: true, sms: true, email: false }, dnc: false,
      people: [{ name: l.name, role: "Contact", phone: l.phone }],
      job: { trade: cust(l.cust).trade, issue: l.note, squares: "—", material: "—", insurance: "—", tarp: "—", access: "—", photos: 0 },
      money: { estimate: 0, deposit: 0, financed: "—", competitor: "—" },
      attrib: { campaign: l.src, network: l.src, keyword: "—", landing: "/", partner: null, firstTouch: "—" },
      appts: [], tasks: [{ t: "Speed-to-lead call", done: false }, { t: "SMS confirm", done: false }], files: [],
      next: { title: "Call " + l.name.split(" ")[0], why: l.note, do: "dial" },
    }, (WR.LEAD_X && WR.LEAD_X[l.id]) || {});
  }
  function cd(id) {
    const base = (WR.CUST_X && WR.CUST_X[id]) || {};
    const d = WR.CUST_DEFAULT || {};
    const c = cust(id);
    return Object.assign({
      legal: c.name, owner: { name: "Owner", role: "Owner", phone: "", email: "" },
    }, d, base);
  }
  function pd(id) {
    return Object.assign({}, WR.PART_DEFAULT || {}, (WR.PART_X && WR.PART_X[id]) || {});
  }
  function kv(rows) {
    return `<div class="kv">${rows.map(([k, v]) => `<div class="k">${esc(k)}</div><div class="v">${v}</div>`).join("")}</div>`;
  }
  function tabbar(items) {
    return `<div class="ptabs">${items.map(([id, l]) => `<button class="ptab ${state.tab === id ? "on" : ""}" data-act="tab" data-id="${id}">${esc(l)}</button>`).join("")}</div>`;
  }
  function rail(next, extra) {
    return `<aside class="rail"><h5>Next move</h5>
      <div class="next-box"><b>${esc(next.title)}</b>
      <div style="color:var(--muted);font-size:12.5px;line-height:1.45;margin:6px 0 12px">${esc(next.why)}</div>
      <button class="btn brand full" data-act="next" data-do="${esc(next.do)}">Do it</button></div>${extra || ""}</aside>`;
  }
  function peopleList(people, dialId) {
    if (!people || !people.length) return `<div style="color:var(--muted)">No people yet.</div>`;
    return people.map((p) => `<div class="person"><div><b>${esc(p.name)}</b><div style="color:var(--muted);font-size:12px">${esc(p.role)} · ${esc(p.phone || "")} ${esc(p.email || "")}</div></div>
      <div style="display:flex;gap:4px">${p.phone ? `<button class="btn tiny brand" data-act="dial" data-id="${dialId}">Call</button>` : ""}${p.phone ? `<button class="btn tiny" data-act="sms-open" data-id="${dialId}">SMS</button>` : ""}</div></div>`).join("");
  }
  function history(events) {
    return `<div class="tl">${events.map((e) => `<div class="ev"><div class="when">${esc(e.when)}</div><div><span class="pill ${e.cls || "info"}">${esc(e.who)}</span> ${esc(e.text)}</div></div>`).join("")}</div>`;
  }

  function kpi(label, n, sub, cls) {
    return `<div class="kpi"><div class="l">${esc(label)}</div><div class="n">${n}</div><div class="s ${cls || ""}">${esc(sub)}</div></div>`;
  }
  function ni(id, label) {
    const on = state.page === id ? "on" : "";
    const pending = id === "approvals" ? 1 : id === "inbox" ? INBOX.length : 0;
    const live = id === "work" && JOBS.some((j) => j.status === "working");
    return `<button class="ni ${on}" data-act="nav" data-page="${id}"><span>${esc(label)}</span>${pending ? `<span class="badge">${pending}</span>` : live ? `<span class="dot"></span>` : ""}</button>`;
  }

  function pageCommand() {
    const speed = "47s";
    const calls = 38;
    const sms = 126;
    const spend = ADS.reduce((a, x) => a + x.spend, 0);
    const leadsN = ADS.reduce((a, x) => a + x.leads, 0);
    const hot = LEADS.filter((l) => l.stage <= 1).slice(0, 6);
    return `
      <div class="page">
        <div class="hero">
          <div>
            <h3>Good morning. Five trades. One war room.</h3>
            <p>Speed-to-lead is ${speed}. The AI is already texting storm leads, dialing the board, and spinning Zernio ads while you drink the coffee. Isolation is on — Apex never sees Cascade's book.</p>
          </div>
          <div class="top-actions">
            <button class="btn brand" data-act="power">Start power dial</button>
            <button class="btn" data-act="nav" data-page="ads">Launch ads</button>
          </div>
        </div>
        <div class="kpis">
          ${kpi("Speed to lead", speed, "target < 60s", "up")}
          ${kpi("Calls today", calls, "Twilio · 4 lines")}
          ${kpi("SMS sent", sms, "A2P 10DLC live", "up")}
          ${kpi("Ad spend", money(spend), leadsN + " leads · Zernio")}
          ${kpi("Booked estimates", "14", "+3 vs yesterday", "up")}
          ${kpi("AI jobs live", JOBS.filter((j) => j.status === "working" || j.status === "thinking").length, "Head Wrangler on box")}
        </div>
        <div class="grid-3">
          <div class="card">
            <h4>Hot board — call these now</h4>
            <div class="body">${hot.map((l) => `
              <div class="row">
                <div>
                  <div><b>${esc(l.name)}</b> · ${esc(cust(l.cust).name)}</div>
                  <div class="m" style="color:var(--muted);font-size:12px;margin-top:3px">${esc(l.note)}</div>
                </div>
                <div style="display:flex;gap:6px;flex:none">
                  <button class="btn tiny brand" data-act="dial" data-id="${l.id}">Call</button>
                  <button class="btn tiny" data-act="sms-open" data-id="${l.id}">SMS</button>
                </div>
              </div>`).join("")}</div>
          </div>
          <div class="card">
            <h4>Local domination — share of search</h4>
            <div class="body">
              <div class="markets">${CUST.map((c) => `
                <div class="map-card">
                  <b>${esc(c.city.split(",")[0])}</b>
                  <div style="color:var(--muted);font-size:12px;margin-top:4px">${esc(c.name)} · rank #${c.rank}</div>
                  <div class="bar"><i style="width:${esc(c.share)}"></i></div>
                  <div class="mono" style="margin-top:6px;font-size:12px">${esc(c.share)} share</div>
                </div>`).join("")}</div>
            </div>
          </div>
          <div class="card">
            <h4>AI + human feed</h4>
            <div class="body">
              ${[
                ["AI", "go", "Zernio · Apex Google RSA is 2.1× impression share vs last week."],
                ["You", "wait", "Approval needed: Cascade after-hours SMS blast (46 opted-in)."],
                ["Twilio", "info", "Inbound from 530-555-0142 — routed to Apex storm queue."],
                ["AI", "go", "Booked Priya Shah estimate Thursday 7:30a."],
                ["Partner", "brand", "Ken Williamson sent a reroof. Auto-texted in 19s."],
              ].map((x) => `<div class="row"><span class="pill ${x[1]}">${x[0]}</span><div style="flex:1;font-size:12.5px">${x[2]}</div></div>`).join("")}
            </div>
          </div>
        </div>
      </div>`;
  }

  function pagePipeline() {
    const rows = filterLeads();
    return `
      <div class="page">
        <div class="statline">
          <span>Full-screen board · every lead the agency touches</span>
          <select data-act="filter">${[["all", "All books"], ...CUST.map((c) => [c.id, c.name])].map(([v, n]) => `<option value="${v}" ${state.filter === v ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
        </div>
        <div class="board">${STAGES.map((name, i) => {
          const cards = rows.filter((l) => l.stage === i);
          return `<div class="col"><div class="hd"><span>${name}</span><span>${cards.length}</span></div>
            <div class="stack">${cards.map((l) => `
              <div class="deal">
                <b>${esc(l.name)}</b>
                <div class="meta"><span>${esc(cust(l.cust).name)}</span><span class="mono">${esc(l.phone)}</span></div>
                <div class="meta"><span>${esc(l.src)}</span><span>score ${l.score}</span></div>
                <div style="font-size:12px;color:var(--muted);margin-top:6px">${esc(l.note)}</div>
                <div class="acts">
                  <button class="btn tiny" data-act="dial" data-id="${l.id}">Call</button>
                  <button class="btn tiny" data-act="sms-open" data-id="${l.id}">SMS</button>
                  ${i > 0 ? `<button class="btn tiny" data-act="stage" data-id="${l.id}" data-dir="-1">‹</button>` : ""}
                  ${i < STAGES.length - 1 ? `<button class="btn tiny brand" data-act="stage" data-id="${l.id}" data-dir="1">›</button>` : ""}
                </div>
              </div>`).join("")}</div></div>`;
        }).join("")}</div>
      </div>`;
  }

  function pageLeads() {
    const rows = jobLeads();
    const l = lead(state.lead) && lead(state.lead).kind !== "partner" ? lead(state.lead) : rows[0];
    const x = ld(l);
    const c = cust(l.cust);
    const tab = state.tab || "overview";
    const tabs = [["overview", "Overview"], ["job", "Job"], ["comms", "Comms"], ["tasks", "Tasks"], ["money", "Money"], ["files", "Files"], ["attrib", "Source"], ["history", "History"]];
    const opt = `${x.opt.call ? "Call" : "no-call"} · ${x.opt.sms ? "SMS" : "no-SMS"} · ${x.dnc ? "DNC" : "callable"}`;
    let body = "";
    if (tab === "overview") body = `${kv([
      ["Book", `<b>${esc(c.name)}</b> · ${esc(c.trade)}`],
      ["Stage", STAGES[l.stage]],
      ["Score", `<span class="temp-${x.temp}">${l.score} · ${x.temp}</span>`],
      ["SLA", l.sla ? l.sla + "s" : "ok"],
      ["Phone", `<span class="mono">${esc(l.phone)}</span>`],
      ["Email", esc(x.email)],
      ["Address", esc(x.addr)],
      ["Year built", esc(x.year)],
      ["Assigned", esc(x.assigned)],
      ["Consent", opt],
      ["Source", esc(l.src)],
    ])}<div class="sec" style="margin-top:18px"><h5>People on this job</h5>${peopleList(x.people, l.id)}</div>`;
    if (tab === "job") body = kv([
      ["Trade", esc(x.job.trade)], ["Issue", esc(x.job.issue)], ["Size", esc(x.job.squares)],
      ["Material / unit", esc(x.job.material)], ["Insurance", esc(x.job.insurance)],
      ["Tarp / urgency", esc(x.job.tarp)], ["Access", esc(x.job.access)], ["Photos", x.job.photos],
    ]) + (x.appts.length ? `<div class="sec" style="margin-top:16px"><h5>Appointments</h5>${x.appts.map((a) => `<div class="person"><div><b>${esc(a.kind)}</b><div style="color:var(--muted);font-size:12px">${esc(a.when)} · ${esc(a.who)}</div></div></div>`).join("")}</div>` : "");
    if (tab === "comms") {
      const msgs = state.convos[l.id] || [];
      body = `<div class="msgs" style="min-height:180px">${msgs.length ? msgs.map((m) => `<div class="bubble ${m.dir}">${esc(m.text)}</div>`).join("") : `<div style="color:var(--muted)">No thread yet. First shop that texts wins.</div>`}</div>
        <div style="display:flex;gap:6px;margin-top:10px"><button class="btn brand" data-act="dial" data-id="${l.id}">Call</button><button class="btn" data-act="sms-open" data-id="${l.id}">Open SMS desk</button></div>
        <div class="script" style="margin-top:14px">${esc(SCRIPT.replace("{name}", l.name.split(" ")[0]).replace("{company}", c.name).replace("{job}", l.note))}</div>`;
    }
    if (tab === "tasks") body = x.tasks.map((t, i) => `<label class="check"><input type="checkbox" ${t.done ? "checked" : ""} data-act="task" data-id="${l.id}" data-i="${i}"><span>${esc(t.t)}</span></label>`).join("");
    if (tab === "money") body = kv([["Estimate", x.money.estimate ? money(x.money.estimate) : "not priced"], ["Deposit", money(x.money.deposit)], ["Financing", esc(x.money.financed)], ["Competitors", esc(x.money.competitor)]]);
    if (tab === "files") body = (x.files.length ? x.files.map((f) => `<div class="file"><span>${esc(f.n)}</span><span class="pill">${esc(f.k)}</span></div>`).join("") : `<div style="color:var(--muted)">No files. Photos of the pain close claims.</div>`);
    if (tab === "attrib") body = kv([["Campaign", esc(x.attrib.campaign)], ["Network", esc(x.attrib.network)], ["Keyword", esc(x.attrib.keyword)], ["Landing", esc(x.attrib.landing)], ["Partner", x.attrib.partner ? esc(x.attrib.partner) : "—"], ["First touch", esc(x.attrib.firstTouch)]]);
    if (tab === "history") body = history([
      { when: "now", who: "SLA", cls: l.sla > 45 ? "stop" : "wait", text: l.sla ? `Unworked ${l.sla}s` : "Inside SLA" },
      { when: "8:14a", who: x.attrib.network || "src", cls: "info", text: `In via ${l.src}` },
      { when: "—", who: "note", cls: "brand", text: l.note },
    ]);
    return `<div class="page desk">
      <div class="roll">${rows.map((r) => `<button class="item ${r.id === l.id ? "on" : ""}" data-act="sel-lead" data-id="${r.id}">
        <div class="t">${esc(r.name)}</div>
        <div class="m">${esc(cust(r.cust).name)} · ${esc(STAGES[r.stage])} · ${r.sla ? r.sla + "s" : "ok"}</div>
      </button>`).join("")}</div>
      <div class="dossier">
        <div class="dh"><span class="pill brand">${esc(l.kind)}</span><span class="pill ${x.temp === "hot" ? "stop" : x.temp === "warm" ? "wait" : "info"}">${x.temp}</span>
          <div class="who">${esc(l.name)}</div>
          <div class="sub">${esc(l.phone)} · ${esc(x.addr)} · book: ${esc(c.name)}</div>
          <div class="pills"><span class="pill">${esc(STAGES[l.stage])}</span><span class="pill">score ${l.score}</span><span class="pill">${esc(l.src)}</span></div>
        </div>
        <div class="acts">
          <button class="btn tiny brand" data-act="dial" data-id="${l.id}">Call</button>
          <button class="btn tiny" data-act="sms-open" data-id="${l.id}">SMS</button>
          <button class="btn tiny" data-act="stage" data-id="${l.id}" data-dir="1">Advance</button>
          <button class="btn tiny" data-act="stage" data-id="${l.id}" data-dir="-1">Back</button>
        </div>
        ${tabbar(tabs)}
        <div class="dbody">${body}</div>
      </div>
      ${rail(x.next, `<h5>Talk track</h5><div class="script">${esc(SCRIPT.replace("{name}", l.name.split(" ")[0]).replace("{company}", c.name).replace("{job}", l.note))}</div>`)}
    </div>`;
  }

  function pageDialer() {
    const queue = LEADS.filter((l) => l.kind === "lead" || l.kind === "prospect");
    const live = state.call ? lead(state.call.id) : null;
    return `
      <div class="page livework">
        <div class="list">
          <div style="padding:12px 14px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">
            <b>Call list · ${queue.length}</b>
            <button class="btn tiny brand" data-act="power">${state.power ? "Stop" : "Power dial"}</button>
          </div>
          ${queue.map((l) => `
            <button class="item ${state.call && state.call.id === l.id ? "on" : ""}" data-act="dial" data-id="${l.id}">
              <div class="t">${esc(l.name)}</div>
              <div class="m">${esc(cust(l.cust).name)} · ${esc(l.phone)} · SLA ${l.sla || 0}s</div>
            </button>`).join("")}
        </div>
        <div class="canvas pad">
          <div class="hero" style="padding:8px 0 16px">
            <div>
              <h3>${live ? "Live · " + esc(live.name) : "Twilio lines idle"}</h3>
              <p>${live ? esc(live.note) : "Click a lead or start power dial. Four parallel lines, AMD, voicemail drop — same machine as the brokerage OS, pointed at roofers."}</p>
            </div>
            <div class="mono" style="font-size:28px" data-dur>${live ? dur() : "0:00"}</div>
          </div>
          <div class="script">${esc(SCRIPT)}</div>
          <div class="kpis" style="padding:16px 0;grid-template-columns:repeat(4,1fr)">
            ${kpi("Connect rate", "41%", "last 2h")}
            ${kpi("Talk time", "2:14 avg", "target 3:00")}
            ${kpi("VM drops", "11", "compliant")}
            ${kpi("Booked from dials", "6", "today", "up")}
          </div>
        </div>
      </div>`;
  }

  function pageSms() {
    const l = lead(state.sms) || LEADS[0];
    const msgs = state.convos[l.id] || [];
    return `
      <div class="page split">
        <div class="list">
          ${LEADS.map((x) => `
            <button class="item ${x.id === l.id ? "on" : ""}" data-act="sms-sel" data-id="${x.id}">
              <div class="t">${esc(x.name)} <span class="pill">${esc(x.kind)}</span></div>
              <div class="m">${esc(cust(x.cust).name)} · ${esc(x.phone)}</div>
            </button>`).join("")}
        </div>
        <div class="thread">
          <div style="padding:14px 18px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">
            <div><b>${esc(l.name)}</b><div class="mono" style="color:var(--muted);font-size:12px">${esc(l.phone)} · Twilio A2P · ${esc(cust(l.cust).name)}</div></div>
            <button class="btn tiny brand" data-act="dial" data-id="${l.id}">Call</button>
          </div>
          <div class="msgs">${msgs.map((m) => `<div class="bubble ${m.dir}">${esc(m.text)}</div>`).join("")}</div>
          <div style="display:flex;gap:6px;padding:8px 12px;flex-wrap:wrap">${TEMPLATES.map((t) => `<button class="btn tiny" data-act="tpl" data-id="${t.id}">${esc(t.name)}</button>`).join("")}</div>
          <form class="composer" data-act="sms-send">
            <textarea name="body" placeholder="SMS via Twilio — opted-in only"></textarea>
            <button class="btn brand" type="submit">Send</button>
          </form>
        </div>
      </div>`;
  }

  function pageAds() {
    const spend = ADS.reduce((a, x) => a + x.spend, 0);
    const leadsN = ADS.reduce((a, x) => a + x.leads, 0);
    return `
      <div class="page">
        <div class="hero">
          <div>
            <h3>Zernio · seven networks, one API.</h3>
            <p>Google, Meta, TikTok, LinkedIn, Pinterest, X, OpenAI ads. Isolation: each customer's ad account is a Zernio profile. We never mix pixels.</p>
          </div>
          <button class="btn brand" data-act="launch">Launch campaign</button>
        </div>
        <div class="kpis">
          ${kpi("Spend (30d)", money(spend), "no % of spend to Zernio")}
          ${kpi("Leads", leadsN, "from ads")}
          ${kpi("Blended CPL", "$" + (spend / Math.max(1, leadsN)).toFixed(0), "target <$50")}
          ${kpi("Best ROAS", "7.1×", "Valley Pest Meta")}
          ${kpi("Networks live", "4", "Google · Meta · TikTok · LSA")}
          ${kpi("In review", ADS.filter((a) => a.status === "pending_review").length, "Ridgeline EV")}
        </div>
        <div class="canvas" style="padding:0 22px 22px">
          <table class="grid">
            <thead><tr><th>Campaign</th><th>Book</th><th>Network</th><th>Status</th><th>Spend</th><th>Leads</th><th>CPL</th><th>ROAS</th><th></th></tr></thead>
            <tbody>${ADS.map((a) => `
              <tr>
                <td><b>${esc(a.name)}</b></td>
                <td>${esc(cust(a.cust).name)}</td>
                <td><span class="pill info">${esc(a.platform)}</span></td>
                <td><span class="pill ${a.status === "active" ? "go" : a.status === "paused" ? "wait" : "brand"}">${esc(a.status)}</span></td>
                <td class="mono">${money(a.spend)}</td>
                <td class="mono">${a.leads}</td>
                <td class="mono">${a.cpl ? "$" + a.cpl.toFixed(0) : "—"}</td>
                <td class="mono">${a.roas ? a.roas.toFixed(1) + "×" : "—"}</td>
                <td><button class="btn tiny" data-act="ad-toggle" data-id="${a.id}">${a.status === "active" ? "Pause" : "Resume"}</button></td>
              </tr>`).join("")}</tbody>
          </table>
        </div>
        ${state.launch ? `<div class="modal" data-act="launch-off"><div class="sheet" onclick="event.stopPropagation()">
          <h3>Launch via Zernio</h3>
          <form class="body" data-act="ad-create">
            <div class="field"><label>Customer</label><select name="cust">${CUST.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div>
            <div class="field"><label>Network</label><select name="platform"><option value="google">Google Ads / LSA</option><option value="meta">Meta</option><option value="tiktok">TikTok</option><option value="openai">ChatGPT ads</option></select></div>
            <div class="field"><label>Name</label><input name="name" value="Emergency {trade} — 20mi" required></div>
            <div class="field"><label>Daily budget</label><input name="budget" type="number" value="75"></div>
            <div class="field"><label>Geo</label><input name="geo" value="Red Bluff, CA + 20 miles"></div>
            <div class="foot"><button type="button" class="btn" data-act="launch">Cancel</button><button class="btn brand" type="submit">Create campaign</button></div>
          </form>
        </div></div>` : ""}
      </div>`;
  }

  function pagePartners() {
    const p = PARTNERS.find((x) => x.id === state.partner) || PARTNERS[0];
    const x = pd(p.id);
    const tab = state.tab || "overview";
    const tabs = [["overview", "Overview"], ["people", "People"], ["flow", "Flow"], ["comarket", "Co-market"], ["agreement", "Agreement"], ["history", "History"]];
    const who = x.contact || { name: p.name, role: p.kind, phone: "", email: "" };
    let body = "";
    if (tab === "overview") body = kv([
      ["Kind", esc(p.kind)], ["Market", esc(p.city)], ["Trades", esc(x.trades || p.kind)],
      ["Territory", esc(x.territory || p.city)], ["Exclusive", esc(x.exclusive || "none")],
      ["Sent us", p.sent], ["Won", p.won], ["Take", esc(p.take)], ["Last ping", esc(x.last || "—")],
    ]);
    if (tab === "people") body = peopleList([who], "L8");
    if (tab === "flow") body = (x.flow && x.flow.length ? x.flow.map((f) => `<div class="file"><span>${esc(f.n)}</span><span class="pill ${f.dir === "in" ? "go" : "info"}">${f.dir === "in" ? "they sent" : "we sent"} · ${esc(f.when)}</span></div>`).join("") : `<div style="color:var(--muted)">No jobs moved yet. Reciprocity is the contract.</div>`);
    if (tab === "comarket") body = kv([["Play", "Storm list + tarp page"], ["QR / truck", "Partner wrap → Text-for-Info keyword"], ["Ads", "Co-op Zernio geo, split 50/50"]]);
    if (tab === "agreement") body = kv([["Take", esc(p.take)], ["W9", esc(x.w9 || "needed")], ["Exclusive zips", esc(x.exclusive || "none")], ["Paid how", "Monthly, after collected"]]);
    if (tab === "history") body = history([{ when: x.last || "—", who: "ping", cls: "go", text: "Last contact" }, { when: "—", who: "note", cls: "brand", text: p.name + " in the rolodex" }]);
    return `<div class="page desk">
      <div class="roll">${PARTNERS.map((r) => `<button class="item ${r.id === p.id ? "on" : ""}" data-act="sel-partner" data-id="${r.id}">
        <div class="t">${esc(r.name)}</div><div class="m">${esc(r.kind)} · sent ${r.sent} · won ${r.won}</div>
      </button>`).join("")}</div>
      <div class="dossier">
        <div class="dh"><span class="pill brand">${esc(p.kind)}</span>
          <div class="who">${esc(p.name)}</div>
          <div class="sub">${esc(p.city)} · take ${esc(p.take)} · ${esc(who.name)}</div>
        </div>
        <div class="acts">
          <button class="btn tiny brand" data-act="sms-open" data-id="L8">SMS</button>
          <button class="btn tiny" data-act="dial" data-id="L8">Call</button>
        </div>
        ${tabbar(tabs)}
        <div class="dbody">${body}</div>
      </div>
      ${rail(x.next || { title: "Ping them", why: "Partners who get paid and thanked keep sending.", do: "sms" })}
    </div>`;
  }

  function pageProspects() {
    const r = PX.find((x) => x.id === state.prospect) || PX[0];
    if (!r) return `<div class="page pad">No prospects.</div>`;
    const tab = state.tab || "overview";
    const stages = WR.PROSPECT_STAGES || ["New", "Talking", "Proposal", "Won"];
    const tabs = [["overview", "Overview"], ["people", "People"], ["discovery", "Discovery"], ["sequence", "Sequence"], ["deal", "Deal"], ["history", "History"]];
    let body = "";
    if (tab === "overview") body = kv([
      ["Trade", esc(r.trade)], ["Market", esc(r.city)], ["Stage", stages[r.stage]],
      ["Retainer", money(r.value) + "/mo"], ["Why now", esc(r.pain)],
      ["Demo", esc(r.demo || "not booked")], ["Crew", r.employees], ["Jobs / mo", r.jobsMo],
    ]);
    if (tab === "people") body = peopleList([{ name: r.dm, role: r.role, phone: r.phone, email: r.email }], r.id);
    if (tab === "discovery") body = kv([["Pain", esc(r.pain)], ["Stack today", esc(r.stack)], ["Why us", esc(r.why)], ["Close if", "Speed-to-lead + isolation + ads they don't have to run"]]);
    if (tab === "sequence") body = ["Day 0 · Loom of Apex storm page", "Day 1 · Call the owner", "Day 3 · SMS the demo hold", "Day 7 · Proposal", "Day 10 · Isolation walkthrough"].map((t, i) => `<label class="check"><input type="checkbox" ${i < r.stage ? "checked" : ""} disabled><span>${esc(t)}</span></label>`).join("");
    if (tab === "deal") body = kv([["MRR", money(r.value)], ["Onboarding", "Storm 90 + DID + Zernio profile"], ["Term", "12 mo"], ["Status", stages[r.stage]]]);
    if (tab === "history") body = history([{ when: "—", who: "gtm", cls: "brand", text: r.why }, { when: "now", who: "pain", cls: "wait", text: r.pain }]);
    return `<div class="page desk">
      <div class="roll">${PX.map((x) => `<button class="item ${x.id === r.id ? "on" : ""}" data-act="sel-prospect" data-id="${x.id}">
        <div class="t">${esc(x.name)}</div><div class="m">${esc(x.city)} · ${esc(stages[x.stage])} · ${money(x.value)}/mo</div>
      </button>`).join("")}</div>
      <div class="dossier">
        <div class="dh"><span class="pill brand">${esc(r.trade)}</span>
          <div class="who">${esc(r.name)}</div>
          <div class="sub">${esc(r.dm)} · ${esc(r.phone)} · ${esc(r.city)}</div>
          <div class="pills"><span class="pill">${esc(stages[r.stage])}</span><span class="pill">${money(r.value)}/mo</span></div>
        </div>
        <div class="acts">
          <button class="btn tiny brand" data-act="dial" data-id="${r.id}">Call ${esc(r.dm.split(" ")[0])}</button>
          <button class="btn tiny" data-act="pstage" data-id="${r.id}" data-dir="1">Advance</button>
        </div>
        ${tabbar(tabs)}
        <div class="dbody">${body}</div>
      </div>
      ${rail({ title: r.stage >= 3 ? "Kick off onboarding — DID + Zernio + Storm 90" : "Call " + r.dm.split(" ")[0] + " about " + r.pain.split(".")[0], why: r.why, do: r.stage >= 3 ? "settings" : "dial" })}
    </div>`;
  }

  function pageCustomers() {
    const c = cust(state.custId) || CUST[0];
    const x = cd(c.id);
    const tab = state.tab || "overview";
    const tabs = [["overview", "Overview"], ["people", "People"], ["funnel", "Funnel"], ["build", "Build"], ["dominate", "Dominate"], ["phone", "Phone"], ["money", "Money"], ["memory", "Memory"], ["walls", "Walls"]];
    const inPlay = LEADS.filter((l) => l.cust === c.id && l.stage < 4).length;
    const ads = ADS.filter((a) => a.cust === c.id);
    let body = "";
    if (tab === "overview") body = kv([
      ["Legal", esc(x.legal || c.name)], ["Trade", esc(c.trade)], ["Market", esc(c.city)],
      ["Rank / share", `#${c.rank} · ${c.share}`], ["Crew", x.crew || "—"], ["Hours", esc(x.hours || "—")],
      ["Radius", esc(x.radius || "—")], ["Services", esc(x.services || c.trade)],
      ["GBP", esc(x.gbp || "—")],
    ]) + `<div class="sec" style="margin-top:16px"><h5>Health</h5>${(x.health || []).map((h) => `<div class="file"><span>${esc(h.l)}</span><span class="pill ${h.ok ? "go" : "wait"}">${esc(h.v)}</span></div>`).join("")}</div>`;
    if (tab === "people") body = peopleList(x.people && x.people.length ? x.people : [x.owner], "L1");
    if (tab === "funnel") body = `<div class="sec"><h5>${inPlay} leads in play</h5>${LEADS.filter((l) => l.cust === c.id).map((l) => `<div class="file"><span>${esc(l.name)} · ${esc(l.note)}</span><span class="pill">${esc(STAGES[l.stage])}</span></div>`).join("")}</div>
      <button class="btn tiny brand" data-act="filter-go" data-id="${c.id}">Open their pipeline</button>`;
    if (tab === "build") body = kv([["GitHub", `<span class="mono">${esc(x.github)}</span>`], ["Vercel", `<span class="mono">${esc(x.vercel)}</span>`], ["Jobs", JOBS.filter((j) => j.cust === c.id).map((j) => j.title).join(" · ") || "idle"]]) +
      JOBS.filter((j) => j.cust === c.id).map((j) => `<div class="file"><span>${esc(j.title)}</span><span class="pill">${esc(j.status)}</span></div>`).join("");
    if (tab === "dominate") body = ads.map((a) => `<div class="file"><span>${esc(a.name)}</span><span class="mono">${esc(a.platform)} · ${money(a.spend)} · ${a.leads} leads</span></div>`).join("") || `<div style="color:var(--muted)">No ads yet.</div>`;
    if (tab === "phone") body = kv([["DID", `<span class="mono">${esc(x.did)}</span>`], ["A2P", esc(x.a2p)], ["After hours", esc(x.hours)], ["Missed call", "SMS in 20s → dialer queue"]]);
    if (tab === "money") body = kv([["Retainer", money(c.mrr) + "/mo"], ["Ad spend 30d", money(ads.reduce((a, z) => a + z.spend, 0))], ["Twilio", "metered, isolated"], ["AI jobs", "capped per job"]]);
    if (tab === "memory") body = kv([["Voice", esc(x.voice)], ["House rules", esc(x.rules)], ["Busy season", esc(x.hours)]]);
    if (tab === "walls") body = kv([
      ["Repo", `<span class="mono">${esc(x.github)}</span> · unique`],
      ["Vercel", `<span class="mono">${esc(x.vercel)}</span> · their token`],
      ["Zernio", `<span class="mono">${esc(x.zernio)}</span> · their pixel`],
      ["Twilio DID", `<span class="mono">${esc(x.did)}</span> · not shared`],
    ]) + `<p style="color:var(--muted);font-size:12.5px;margin-top:12px">Overlap is refused in the database. One resource, one customer.</p>`;
    return `<div class="page desk">
      <div class="roll">${CUST.map((r) => `<button class="item ${r.id === c.id ? "on" : ""}" data-act="sel-cust" data-id="${r.id}">
        <div class="t">${esc(r.name)}</div><div class="m">${esc(r.city)} · #${r.rank} · ${money(r.mrr)}/mo</div>
      </button>`).join("")}</div>
      <div class="dossier">
        <div class="dh"><span class="pill brand">${esc(c.trade)}</span>
          <div class="who">${esc(c.name)}</div>
          <div class="sub">${esc(c.city)} · rank #${c.rank} · ${esc(c.share)} share · ${money(c.mrr)}/mo</div>
          <div class="pills"><span class="pill">${inPlay} live leads</span><span class="pill">${ads.length} campaigns</span><span class="pill">isolated</span></div>
        </div>
        <div class="acts">
          <button class="btn tiny brand" data-act="filter-go" data-id="${c.id}">Pipeline</button>
          <button class="btn tiny" data-act="nav" data-page="ads">Ads</button>
          <button class="btn tiny" data-act="nav" data-page="work">Build</button>
        </div>
        ${tabbar(tabs)}
        <div class="dbody">${body}</div>
      </div>
      ${rail(x.next)}
    </div>`;
  }

  function pageInbox() {
    return `<div class="page pad scroll">${INBOX.map((m) => `
      <div class="card" style="margin-bottom:10px"><div class="body" style="display:flex;gap:12px;align-items:center">
        <div style="flex:1"><b>${esc(m.from)}</b> <span class="pill">${esc(m.via)}</span><div style="margin-top:6px">“${esc(m.text)}”</div></div>
        <button class="btn brand" data-act="nav" data-page="wrangler">Wrangle →</button>
      </div></div>`).join("")}</div>`;
  }

  function pageBilling() {
    const rev = CUST.reduce((a, c) => a + c.mrr, 0);
    return `<div class="page"><div class="kpis">${kpi("Retainers", money(rev), "5 customers")}${kpi("Ad spend pass-through", money(5120), "Zernio, billed through")}${kpi("Twilio", "$410", "calls + SMS")}${kpi("Margin", "61%", "after AI + ads + phone", "up")}</div>
      <div class="canvas" style="padding:0 22px 22px"><table class="grid"><thead><tr><th>Customer</th><th>Retainer</th><th></th></tr></thead>
      <tbody>${CUST.map((c) => `<tr><td>${esc(c.name)}</td><td class="mono">${money(c.mrr)}/mo</td><td><button class="btn tiny">Invoice</button></td></tr>`).join("")}</tbody></table></div></div>`;
  }

  function pageWork() {
    const j = JOBS[0];
    return `<div class="page livework">
      <div class="list">${JOBS.map((x, i) => `<button class="item ${i === 0 ? "on" : ""}"><div class="t">${esc(x.title)}</div><div class="m">${esc(cust(x.cust).name)} · ${esc(x.status)}</div></button>`).join("")}</div>
      <div class="canvas pad"><h3 style="font-family:var(--display)">${esc(j.title)}</h3>
        <div class="tlog">${j.log.map((t, i) => `<div class="${i === j.log.length - 1 ? "gate" : "think"}">${esc(t)}</div>`).join("")}</div>
      </div></div>`;
  }

  function pageWrangler() {
    return `<div class="page pad scroll"><div class="card"><h4>Head Wrangler session</h4><div class="body">
      ${["claude-code connected — laptop MCP", "watching 5 customer workspaces, isolation walls up", "Twilio + Zernio tools granted", "→ apex-builder: storm landing page", "paused: Cascade A2P blast needs you"].map((t) => `<div class="row"><span class="pill info">mcp</span><div>${esc(t)}</div></div>`).join("")}
    </div></div></div>`;
  }

  function pageApprovals() {
    return `<div class="page pad"><div class="card"><h4>Needs you</h4><div class="body">
      <div class="row"><div><b>Cascade HVAC — send after-hours SMS blast</b><div style="color:var(--muted);margin-top:4px">46 opted-in customers. Twilio A2P. Irreversible once it leaves.</div></div>
        <div style="display:flex;gap:6px"><button class="btn stop">Reject</button><button class="btn go" data-act="approve">Approve</button></div></div>
    </div></div></div>`;
  }

  function pageChanges() {
    return `<div class="page pad scroll"><div class="card"><div class="body">
      <b>Apex Roofing — Storm landing page</b>
      <div class="mono" style="color:var(--muted);margin:6px 0">github.com/apex-roofing/site · agent/storm-lsa</div>
      <span class="pill go">Preview live</span>
    </div></div></div>`;
  }

  function pagePlaybooks() {
    const pbs = [
      ["Storm 90", "LSA + Meta + Twilio 60s SLA + tarp landing page. Run the morning after hail."],
      ["Speed-to-lead", "Missed call → SMS in 20s → dialer queue → voicemail drop."],
      ["Review flywheel", "Won job + 2 days → SMS review ask → boost 5-star via Zernio."],
      ["Partner ping", "New lead in a partner's zip → SMS them first, us second."],
    ];
    return `<div class="page pad scroll" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">${pbs.map((p) => `<div class="card"><h4>${esc(p[0])}</h4><div class="body">${esc(p[1])}<div style="margin-top:12px"><button class="btn tiny brand" data-act="nav" data-page="work">Run</button></div></div></div>`).join("")}</div>`;
  }

  function pageSettings() {
    const rows = [
      ["Twilio", "Voice + SMS + A2P. One number per customer.", "twilio"],
      ["Zernio", "Ads across Google, Meta, TikTok, LinkedIn, Pinterest, X, OpenAI.", "zernio"],
      ["GitHub", "Agency account. Repos bound 1:1 to customers.", "github"],
      ["Vercel", "Their tokens. Never a shared project.", "vercel"],
    ];
    return `<div class="page pad scroll">${rows.map(([n, d, k]) => `
      <div class="row card" style="padding:14px 16px;margin-bottom:8px;display:flex;align-items:center">
        <div style="flex:1"><b>${n}</b><div style="color:var(--muted);font-size:12.5px;margin-top:4px">${d}</div></div>
        <button class="btn ${state.integrations[k] ? "" : "brand"}" data-act="integ" data-id="${k}">${state.integrations[k] ? "Connected" : "Connect"}</button>
      </div>`).join("")}
      <p style="color:var(--muted);font-size:12.5px;max-width:640px">This Pages preview simulates Twilio + Zernio. Paste real keys on the Next app (<span class="mono">TWILIO_*</span>, <span class="mono">ZERNIO_API_KEY</span>) and the same screens go live.</p>
    </div>`;
  }

  const PAGES = {
    command: pageCommand, pipeline: pagePipeline, leads: pageLeads, prospects: pageProspects, dialer: pageDialer,
    sms: pageSms, ads: pageAds, partners: pagePartners, customers: pageCustomers,
    inbox: pageInbox, billing: pageBilling, work: pageWork, wrangler: pageWrangler,
    approvals: pageApprovals, changes: pageChanges, playbooks: pagePlaybooks, settings: pageSettings,
  };

  function dur() {
    if (!state.call) return "0:00";
    const s = Math.floor((Date.now() - state.call.t0) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function dock() {
    const live = state.call ? party(state.call.id) : null;
    return `
      <div class="call-id">${live
        ? `<div class="who">${esc(live.name)}</div><div class="ph">${esc(live.phone)} · ${esc(live.book)} · ${dur()}</div>`
        : `<div class="who">Twilio idle</div><div class="ph">4 lines · A2P ready · click any Call</div>`}</div>
      <div class="wave">${state.call ? Array.from({ length: 18 }, () => "<span></span>").join("") : `<span style="color:var(--muted);font-size:12px">Ready</span>`}</div>
      <div class="dialpad">
        ${live ? `
          <button class="btn tiny" data-act="mute">${state.muted ? "Unmute" : "Mute"}</button>
          <button class="btn tiny" data-act="sms-open" data-id="${live.id}">SMS</button>
          <button class="btn tiny stop" data-act="hang">Hang up</button>` : `
          <button class="btn tiny brand" data-act="power">Power dial</button>
          <button class="btn tiny" data-act="nav" data-page="dialer">Open dialer</button>`}
      </div>`;
  }

  function render() {
    document.documentElement.setAttribute("data-theme", state.theme);
    const app = $("#app");
    app.innerHTML = `
      <div class="os ${state.call ? "live" : ""}">
        <aside class="side">
          <div class="brand"><div class="mark">✛</div><div><h1>AI WRANGLER</h1><small>Local domination OS</small></div></div>
          <nav class="nav">${NAV.map((g) => `<div class="nav-h ${g[0] === "BUILD" ? "build" : ""}">${g[0]}</div>${g[1].map(([id, l]) => ni(id, l)).join("")}`).join("")}</nav>
          <div class="side-foot">
            <button class="btn brand full" data-act="nav" data-page="pipeline">＋ New lead</button>
            <button class="btn full" data-act="power">＋ Dial the board</button>
            <div style="display:flex;gap:6px">
              <button class="btn ghost full" data-act="theme">${state.theme === "dark" ? "Light" : "Dark"}</button>
              <span class="chip" style="flex:1;justify-content:center">${clock()}</span>
            </div>
          </div>
        </aside>
        <section class="main">
          <header class="top">
            <h2>${esc(TITLES[state.page] || "AI Wrangler")}</h2>
            <div class="top-actions">
              <button class="chip" data-act="search">Search everything… <span class="k">⌘K</span></button>
              <span class="chip">Agency view</span>
            </div>
          </header>
          <div class="stage">${(PAGES[state.page] || pageCommand)()}</div>
        </section>
        <footer class="dock ${state.call ? "live" : ""}">${dock()}</footer>
      </div>
      ${state.toast ? `<div class="toast">${esc(state.toast)}</div>` : ""}
      ${state.search ? `<div class="search" data-act="search-off"><div class="box" onclick="event.stopPropagation()">
        <input autofocus placeholder="Leads, ads, customers, playbooks…" value="${esc(state.q)}" data-act="q">
        ${hits().map((h) => `<button class="hit" data-act="hit" data-page="${h.page}" data-id="${h.id || ""}"><span>${esc(h.label)}</span><span class="pill">${esc(h.kind)}</span></button>`).join("")}
      </div></div>` : ""}
    `;
    const q = $('[data-act="q"]');
    if (q) q.focus();
  }

  function hits() {
    const q = (state.q || "").toLowerCase();
    const out = [];
    LEADS.forEach((l) => out.push({ label: l.name, kind: l.kind, page: l.kind === "partner" ? "partners" : "leads", id: l.id }));
    CUST.forEach((c) => out.push({ label: c.name, kind: "customer", page: "customers", id: c.id }));
    PX.forEach((p) => out.push({ label: p.name, kind: "prospect", page: "prospects", id: p.id }));
    PARTNERS.forEach((p) => out.push({ label: p.name, kind: "partner", page: "partners", id: p.id }));
    ADS.forEach((a) => out.push({ label: a.name, kind: "ad", page: "ads" }));
    return out.filter((h) => !q || h.label.toLowerCase().includes(q)).slice(0, 8);
  }

  function party(id) {
    const l = lead(id);
    if (l) return { name: l.name, phone: l.phone, book: cust(l.cust).name };
    const r = PX.find((x) => x.id === id);
    if (r) return { name: r.dm, phone: r.phone, book: r.name };
    const p = PARTNERS.find((x) => x.id === id);
    if (p) {
      const c = pd(p.id).contact || {};
      return { name: c.name || p.name, phone: c.phone || "", book: p.name };
    }
    return null;
  }
  function dial(id) {
    const p = party(id);
    if (!p || !p.phone) return;
    state.call = { id, t0: Date.now() };
    state.muted = false;
    toast("Twilio · ringing " + p.phone);
    render();
  }
  function hang() {
    const was = state.call;
    const d = dur();
    state.call = null;
    if (was) toast("Call logged · " + d);
    if (state.power && was) {
      const q = LEADS.filter((l) => l.kind === "lead" || l.kind === "prospect");
      const i = q.findIndex((l) => l.id === was.id);
      const next = q[(i + 1) % q.length] || q[0];
      if (next) setTimeout(() => dial(next.id), 400);
    }
    render();
  }

  document.addEventListener("click", (e) => {
    const n = e.target.closest("[data-act]");
    if (!n) return;
    const act = n.getAttribute("data-act");
    const id = n.getAttribute("data-id");
    if (act === "nav") go(n.getAttribute("data-page"));
    if (act === "theme") { state.theme = state.theme === "dark" ? "light" : "dark"; localStorage.setItem("wrangler-theme", state.theme); render(); }
    if (act === "search") { state.search = true; render(); }
    if (act === "search-off") { state.search = false; render(); }
    if (act === "dial") dial(id);
    if (act === "hang") hang();
    if (act === "mute") { state.muted = !state.muted; render(); }
    if (act === "sms-open") { state.sms = id; go("sms"); }
    if (act === "sms-sel") { state.sms = id; render(); }
    if (act === "sel-lead") { state.lead = id; state.tab = "overview"; render(); }
    if (act === "sel-cust") { state.custId = id; state.tab = "overview"; render(); }
    if (act === "sel-prospect") { state.prospect = id; state.tab = "overview"; render(); }
    if (act === "sel-partner") { state.partner = id; state.tab = "overview"; render(); }
    if (act === "tab") { state.tab = id; render(); }
    if (act === "next") {
      const d = n.getAttribute("data-do");
      if (d === "dial") dial(state.page === "prospects" ? state.prospect : state.lead);
      else if (d === "sms") { state.sms = state.page === "partners" ? "L8" : state.lead; go("sms"); }
      else if (d === "ads") go("ads");
      else if (d === "approvals") go("approvals");
      else if (d === "settings") go("settings");
      else if (d === "job") { state.tab = "job"; render(); }
      else toast("Queued");
    }
    if (act === "pstage") {
      const r = PX.find((x) => x.id === id);
      if (r) {
        r.stage = Math.max(0, Math.min(3, r.stage + Number(n.getAttribute("data-dir"))));
        toast(r.name + " → " + (WR.PROSPECT_STAGES || [])[r.stage]);
        render();
      }
    }
    if (act === "task") {
      const l = lead(id);
      const dx = ld(l);
      const i = Number(n.getAttribute("data-i"));
      if (dx.tasks[i]) dx.tasks[i].done = !dx.tasks[i].done;
      if (!WR.LEAD_X[id]) WR.LEAD_X[id] = dx;
      else WR.LEAD_X[id].tasks = dx.tasks;
      render();
    }
    if (act === "stage") {
      const l = lead(id);
      l.stage = Math.max(0, Math.min(STAGES.length - 1, l.stage + Number(n.getAttribute("data-dir"))));
      toast(l.name + " → " + STAGES[l.stage]);
      render();
    }
    if (act === "power") {
      state.power = !state.power;
      if (state.power) {
        const first = LEADS.find((l) => l.kind === "lead");
        dial(first.id);
        toast("Power dial on · four Twilio lines");
      } else toast("Power dial stopped");
    }
    if (act === "launch" || act === "launch-off") { state.launch = !state.launch; render(); }
    if (act === "ad-toggle") {
      const a = ADS.find((x) => x.id === id);
      a.status = a.status === "active" ? "paused" : "active";
      toast("Zernio · " + a.name + " " + a.status);
      render();
    }
    if (act === "filter-go") { state.filter = id; go("pipeline"); }
    if (act === "integ") {
      state.integrations[id] = !state.integrations[id];
      toast(id + (state.integrations[id] ? " connected" : " disconnected"));
      render();
    }
    if (act === "approve") toast("Approved · Twilio will send the blast");
    if (act === "hit") {
      const page = n.getAttribute("data-page");
      if (page === "customers") state.custId = id;
      else if (page === "prospects") state.prospect = id;
      else if (page === "partners") state.partner = id;
      else if (id) { state.lead = id; state.sms = id; }
      state.search = false;
      go(page);
    }
    if (act === "tpl") {
      const t = TEMPLATES.find((x) => x.id === id);
      const l = lead(state.sms);
      const body = t.body.replace("{name}", l.name.split(" ")[0]).replace("{company}", cust(l.cust).name).replace("{job}", l.note).replace("{when}", "Thu 7:30a").replace("{city}", l.city).replace("{link}", "g.page/apex");
      const ta = document.querySelector(".composer textarea");
      if (ta) ta.value = body;
    }
  });

  document.addEventListener("submit", (e) => {
    const n = e.target.closest("[data-act]");
    if (!n) return;
    e.preventDefault();
    if (n.getAttribute("data-act") === "sms-send") {
      const body = n.body.value.trim();
      if (!body) return;
      const id = state.sms;
      state.convos[id] = state.convos[id] || [];
      state.convos[id].push({ dir: "out", t: body });
      n.body.value = "";
      toast("Twilio SMS queued to " + lead(id).phone);
      render();
    }
    if (n.getAttribute("data-act") === "ad-create") {
      const fd = new FormData(n);
      ADS.unshift({
        id: "A" + (ADS.length + 1),
        cust: fd.get("cust"),
        platform: fd.get("platform"),
        name: fd.get("name"),
        status: "pending_review",
        spend: 0, leads: 0, cpl: 0, roas: 0, goal: "leads",
      });
      state.launch = false;
      toast("Zernio · campaign created (pending review)");
      render();
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.getAttribute("data-act") === "filter") {
      state.filter = e.target.value;
      render();
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.getAttribute("data-act") === "q") {
      state.q = e.target.value;
      render();
      const inp = $('[data-act="q"]');
      if (inp) { inp.focus(); inp.setSelectionRange(state.q.length, state.q.length); }
    }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); state.search = !state.search; render(); }
    if (e.key === "Escape") { state.search = false; state.launch = false; render(); }
  });

  addEventListener("hashchange", () => {
    const p = location.hash.replace("#/", "");
    if (PAGES[p]) { state.page = p; render(); }
  });

  const boot = location.hash.replace("#/", "");
  if (PAGES[boot]) state.page = boot;
  render();
  setInterval(() => {
    if (!state.call) return;
    document.querySelectorAll("[data-dur]").forEach((el) => { el.textContent = dur(); });
    const ph = document.querySelector(".dock .ph");
    if (ph && state.call) {
      const p = party(state.call.id);
      if (p) ph.textContent = `${p.phone} · ${p.book} · ${dur()}`;
    }
  }, 1000);
})();
