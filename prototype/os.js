/* AI Wrangler OS — frontend preview (Twilio + Zernio wired as live-shaped demo until keys land). */
(() => {
  const NAV = [
    ["FUNNEL", [
      ["command", "Command"],
      ["pipeline", "Pipeline"],
      ["leads", "Leads"],
      ["prospects", "Prospects"],
      ["dialer", "Dialer"],
      ["inbox", "Inbox"],
      ["ads", "Ads"],
      ["partners", "Partners"],
    ]],
    ["CLIENTS", [
      ["customers", "Customers"],
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
    ads: "Zernio ads",
    partners: "Partner dossier",
    customers: "Customer dossier",
    inbox: "Inbox — every thread",
    billing: "Billing & margin",
    work: "Live work",
    wrangler: "Head Wrangler",
    approvals: "Needs you",
    changes: "All changes",
    playbooks: "Playbooks",
    settings: "Settings",
  };
  const STAGES = ["New", "Talking", "Proposal", "Won", "Customer"];
  const CUST = [
    { id: "apex", name: "Apex Roofing", city: "Red Bluff, CA", trade: "Roofing", mrr: 4500, rank: 2, share: "18%" },
    { id: "cascade", name: "Cascade HVAC", city: "Redding, CA", trade: "HVAC", mrr: 3800, rank: 4, share: "11%" },
    { id: "ironclad", name: "Ironclad Plumbing", city: "Chico, CA", trade: "Plumbing", mrr: 3200, rank: 3, share: "14%" },
    { id: "ridge", name: "Ridgeline Electric", city: "Corning, CA", trade: "Electrical", mrr: 2800, rank: 6, share: "9%" },
    { id: "valley", name: "Valley Pest", city: "Tehama County", trade: "Pest", mrr: 2200, rank: 1, share: "22%" },
  ];
  const LEADS = [
    { id: "L1", name: "Jake Summit", company: "Summit Roofing", trade: "Roofing", phone: "+1 530 555 4401", kind: "lead", src: "Apex case study", score: 94, stage: 0, city: "Redding, CA", note: "Wants the Apex machine: site + LSA + 60s SMS.", sla: 38, value: 4500 },
    { id: "L2", name: "Lisa Park", company: "North Valley HVAC", trade: "HVAC", phone: "+1 530 555 4418", kind: "lead", src: "Inbound form", score: 88, stage: 1, city: "Chico, CA", note: "CSR drowned. Needs after-hours AI + new site.", sla: 12, value: 3800 },
    { id: "L3", name: "Owen Diaz", company: "River City Electric", trade: "Electrical", phone: "+1 530 555 4470", kind: "lead", src: "Ken Williamson", score: 81, stage: 0, city: "Red Bluff, CA", note: "No website. GBP from 2019. EV-panel demand, zero capture.", sla: 51, value: 2800 },
    { id: "L4", name: "Sam Ruiz", company: "Tehama Air & Heat", trade: "HVAC", phone: "+1 530 555 4422", kind: "lead", src: "Demo", score: 91, stage: 2, city: "Corning, CA", note: "Proposal out: site rebuild + reviews + LSA.", sla: 0, value: 3200 },
    { id: "L5", name: "Gina Holt", company: "Holt Plumbing Co", trade: "Plumbing", phone: "+1 530 555 4430", kind: "lead", src: "Google", score: 76, stage: 1, city: "Red Bluff, CA", note: "Jobber + a Wix page. Wants isolation + ads.", sla: 22, value: 3000 },
    { id: "L6", name: "Marcus Bell", company: "Bell Brothers Roofing", trade: "Roofing", phone: "+1 530 555 4441", kind: "lead", src: "Partner ping", score: 72, stage: 0, city: "Redding, CA", note: "Buying Angi. Close rate 9%. Asked for a teardown.", sla: 63, value: 4200 },
    { id: "L7", name: "Priya Shah", company: "Shah Pest Control", trade: "Pest", phone: "+1 530 555 4455", kind: "lead", src: "Referral", score: 85, stage: 3, city: "Tehama, CA", note: "Won — DocuSign. Kickoff: GBP + click-to-call site.", sla: 0, value: 2200 },
    { id: "L8", name: "Ken Williamson", company: "Williamson Water", trade: "Water", phone: "+1 970 555 0144", kind: "partner", src: "Trade", score: 90, stage: 4, city: "Montrose, CO", note: "Sends roofing/HVAC owners our way.", sla: 0, value: 0 },
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
    { id: "T1", name: "Book the teardown", body: "Hey {name} — Wrangler here. Got your note about {job}. Got 20 min this week for a teardown of the current site + ads?" },
    { id: "T2", name: "Apex proof", body: "{name} — this is the storm page we shipped for Apex in Red Bluff. Same machine, your market. {link}" },
    { id: "T3", name: "Proposal nudge", body: "{name} — proposal's in your inbox. Site + LSA + Twilio 60s SLA. Reply 1 and we kick off Monday." },
    { id: "T4", name: "Partner ping", body: "Hey {name} — sending you a warm owner in {city} who needs a site. You free to intro?" },
  ];
  const SCRIPT = `Hey {name}, this is Wrangler — you asked about a site and the lead machine for {company}.

1. Confirm trade + market. Don't pitch yet.
2. What's broken: website, GBP, ads, after-hours, reviews.
3. Book a 20-min teardown. Don't quote a retainer on this call.
4. Send the Apex case study after you hang up.`;

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
    chan: "all",
    tick: 0,
    convos: {
      L1: [{ dir: "in", t: "Saw what you did for Apex. Can you do the site + ads for us?" }, { dir: "out", t: "Yes. 20 min teardown this week — I'll show the machine, not a deck." }],
      L2: [{ dir: "in", t: "Our CSR is drowning and nights go to voicemail." }],
      L8: [{ dir: "out", t: "Sending you a Redding roofer who needs a site." }, { dir: "in", t: "Got it. I'll intro." }],
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
    if (page === "sms") page = "inbox";
    state.page = page;
    state.tab = "overview";
    location.hash = "#/" + page;
    render();
  };
  const filterLeads = () => LEADS.filter((l) => l.kind !== "partner" && (state.filter === "all" || l.trade === state.filter));
  const jobLeads = () => LEADS.filter((l) => l.kind !== "partner");
  const PX = WR.PROSPECTS || [];
  const leadCo = (l) => l.company || l.trade || "";
  function ld(l) {
    return Object.assign({
      email: (l.name.split(" ")[0].toLowerCase()) + "@" + (l.company || "shop").toLowerCase().replace(/[^a-z0-9]+/g, "") + ".com",
      temp: l.score > 85 ? "hot" : l.score > 70 ? "warm" : "cold",
      assigned: "You",
      website: "none / dying",
      stack: "unknown",
      pain: l.note,
      scope: "Site · GBP · LSA · Twilio 60s SLA",
      people: [{ name: l.name, role: "Owner", phone: l.phone }],
      money: { mrr: l.value || 0, term: "12 mo", competitor: "Angi / DIY ads" },
      attrib: { campaign: l.src, network: l.src, partner: null, firstTouch: "—" },
      tasks: [{ t: "Call the owner", done: false }, { t: "Book 20-min teardown", done: false }, { t: "Send Apex case study", done: false }],
      files: [],
      next: { title: "Call " + l.name.split(" ")[0] + " at " + (l.company || "the shop"), why: l.note, do: "dial" },
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
  function threads() {
    const out = [];
    LEADS.forEach((l) => {
      const msgs = state.convos[l.id] || [];
      const last = msgs[msgs.length - 1];
      out.push({
        id: l.id, name: l.name, phone: l.phone,
        kind: l.kind === "partner" ? "partner" : "lead",
        via: "sms", book: leadCo(l),
        preview: last ? last.t : l.note,
        unread: msgs.length === 0 || last?.dir === "in",
        sla: l.sla, wrangle: false,
      });
    });
    INBOX.forEach((m) => {
      const msgs = state.convos[m.id] || [];
      const last = msgs[msgs.length - 1];
      out.push({
        id: m.id, name: m.from, phone: "",
        kind: "client", via: m.via,
        book: m.from.indexOf("Apex") >= 0 ? "Apex Roofing" : "Cascade HVAC",
        preview: last ? last.t : m.text,
        unread: m.status === "new" && !msgs.some((x) => x.dir === "out"),
        sla: 0, wrangle: true, task: m.task,
      });
    });
    out.push({
      id: "VM1", name: "Missed · 530-555-0199", phone: "+1 530 555 0199",
      kind: "lead", via: "vm", book: "Apex Roofing",
      preview: "Voicemail 0:18 — “need a website like Apex, please call”",
      unread: !(state.convos.VM1 && state.convos.VM1.length), sla: 92, wrangle: false,
    });
    const chan = state.chan || "all";
    return out.filter((t) => {
      if (chan === "unread") return t.unread;
      if (chan === "sms") return t.via === "sms";
      if (chan === "email") return t.via === "email";
      if (chan === "call") return t.via === "vm" || t.via === "call";
      if (chan === "wrangle") return t.wrangle;
      return true;
    });
  }

  function kpi(label, n, sub, cls) {
    return `<div class="kpi"><div class="l">${esc(label)}</div><div class="n">${n}</div><div class="s ${cls || ""}">${esc(sub)}</div></div>`;
  }
  function ni(id, label) {
    const on = state.page === id ? "on" : "";
    const pending = id === "approvals" ? 1 : id === "inbox" ? threads().filter((t) => t.unread).length : 0;
    const live = id === "work" && JOBS.some((j) => j.status === "working");
    return `<button class="ni ${on}" data-act="nav" data-page="${id}"><span>${esc(label)}</span>${pending ? `<span class="badge">${pending}</span>` : live ? `<span class="dot"></span>` : ""}</button>`;
  }

  function pageCommand() {
    const speed = "47s";
    const calls = 38;
    const sms = 126;
    const spend = ADS.reduce((a, x) => a + x.spend, 0);
    const leadsN = ADS.reduce((a, x) => a + x.leads, 0);
    const hot = jobLeads().filter((l) => l.stage <= 1).slice(0, 6);
    return `
      <div class="page">
        <div class="hero">
          <div>
            <h3>Good morning. Five trades. One war room.</h3>
            <p>Speed-to-lead is ${speed}. Inbound shops who want a site and the machine get a call before they bounce to a web guy on Facebook. Signed customers stay isolated.</p>
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
          ${kpi("Demos booked", "4", "+2 vs yesterday", "up")}
          ${kpi("AI jobs live", JOBS.filter((j) => j.status === "working" || j.status === "thinking").length, "Head Wrangler on box")}
        </div>
        <div class="grid-3">
          <div class="card">
            <h4>Hot board — call these now</h4>
            <div class="body">${hot.map((l) => `
              <div class="row">
                <div>
                  <div><b>${esc(l.company || l.name)}</b> · ${esc(l.name)}</div>
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
                ["Twilio", "info", "Inbound from Summit Roofing — wants the Apex machine."],
                ["AI", "go", "Tehama Air proposal sitting 2 days — nudge queued."],
                ["Partner", "brand", "Ken Williamson intro'd River City Electric."],
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
          <span>Wrangler sales board — shops who want a site and the machine</span>
          <select data-act="filter">${[["all", "All trades"], ...[...new Set(jobLeads().map((l) => l.trade))].map((t) => [t, t])].map(([v, n]) => `<option value="${v}" ${state.filter === v ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
        </div>
        <div class="board">${STAGES.map((name, i) => {
          const cards = rows.filter((l) => l.stage === i);
          return `<div class="col"><div class="hd"><span>${name}</span><span>${cards.length}</span></div>
            <div class="stack">${cards.map((l) => `
              <div class="deal">
                <b>${esc(l.company || l.name)}</b>
                <div class="meta"><span>${esc(l.name)} · ${esc(l.trade)}</span><span class="mono">${esc(l.phone)}</span></div>
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
    const tab = state.tab || "overview";
    const tabs = [["overview", "Overview"], ["discovery", "Discovery"], ["scope", "Scope"], ["comms", "Comms"], ["tasks", "Tasks"], ["money", "Money"], ["files", "Files"], ["source", "Source"]];
    const talk = SCRIPT.replace("{name}", l.name.split(" ")[0]).replace("{company}", leadCo(l)).replace("{job}", l.note);
    let body = "";
    if (tab === "overview") body = `${kv([
      ["Company", `<b>${esc(l.company)}</b>`],
      ["Trade", esc(l.trade)],
      ["Market", esc(l.city)],
      ["Contact", esc(l.name) + " · owner"],
      ["Stage", STAGES[l.stage]],
      ["Score", `<span class="temp-${x.temp}">${l.score} · ${x.temp}</span>`],
      ["Phone", `<span class="mono">${esc(l.phone)}</span>`],
      ["Email", esc(x.email)],
      ["Website", esc(x.website)],
      ["Source", esc(l.src)],
      ["Assigned", esc(x.assigned)],
    ])}<div class="sec" style="margin-top:18px"><h5>People</h5>${peopleList(x.people, l.id)}</div>`;
    if (tab === "discovery") body = kv([
      ["Pain", esc(x.pain)],
      ["Stack today", esc(x.stack)],
      ["Why Wrangler", "Site + ads + Twilio + isolation — not another web guy"],
    ]);
    if (tab === "scope") body = kv([
      ["Build", esc(x.scope)],
      ["Not in scope", "Their homeowner jobs. That's their CRM. We don't take roof calls."],
    ]);
    if (tab === "comms") {
      const msgs = state.convos[l.id] || [];
      body = `<div class="msgs" style="min-height:180px">${msgs.length ? msgs.map((m) => `<div class="bubble ${m.dir}">${esc(m.text)}</div>`).join("") : `<div style="color:var(--muted)">No thread yet.</div>`}</div>
        <div style="display:flex;gap:6px;margin-top:10px"><button class="btn brand" data-act="dial" data-id="${l.id}">Call</button><button class="btn" data-act="sms-open" data-id="${l.id}">Open thread</button></div>
        <div class="script" style="margin-top:14px">${esc(talk)}</div>`;
    }
    if (tab === "tasks") body = x.tasks.map((t, i) => `<label class="check"><input type="checkbox" ${t.done ? "checked" : ""} data-act="task" data-id="${l.id}" data-i="${i}"><span>${esc(t.t)}</span></label>`).join("");
    if (tab === "money") body = kv([["Retainer", x.money.mrr ? money(x.money.mrr) + "/mo" : "not priced"], ["Term", esc(x.money.term)], ["Competing with", esc(x.money.competitor)]]);
    if (tab === "files") body = (x.files.length ? x.files.map((f) => `<div class="file"><span>${esc(f.n)}</span><span class="pill">${esc(f.k)}</span></div>`).join("") : `<div style="color:var(--muted)">No files yet. Drop the site audit and the proposal here.</div>`);
    if (tab === "source") body = kv([["How they found us", esc(x.attrib.campaign)], ["Partner", x.attrib.partner ? esc(x.attrib.partner) : "—"], ["First touch", esc(x.attrib.firstTouch)]]);
    return `<div class="page desk">
      <div class="roll">${rows.map((r) => `<button class="item ${r.id === l.id ? "on" : ""}" data-act="sel-lead" data-id="${r.id}">
        <div class="t">${esc(r.company)}</div>
        <div class="m">${esc(r.name)} · ${esc(STAGES[r.stage])} · ${money(r.value)}/mo</div>
      </button>`).join("")}</div>
      <div class="dossier">
        <div class="dh"><span class="pill brand">${esc(l.trade)}</span><span class="pill ${x.temp === "hot" ? "stop" : x.temp === "warm" ? "wait" : "info"}">${x.temp}</span>
          <div class="who">${esc(l.company)}</div>
          <div class="sub">${esc(l.name)} · ${esc(l.phone)} · ${esc(l.city)}</div>
          <div class="pills"><span class="pill">${esc(STAGES[l.stage])}</span><span class="pill">${money(l.value)}/mo</span><span class="pill">${esc(l.src)}</span></div>
        </div>
        <div class="acts">
          <button class="btn tiny brand" data-act="dial" data-id="${l.id}">Call</button>
          <button class="btn tiny" data-act="sms-open" data-id="${l.id}">Inbox</button>
          <button class="btn tiny" data-act="stage" data-id="${l.id}" data-dir="1">Advance</button>
          <button class="btn tiny" data-act="stage" data-id="${l.id}" data-dir="-1">Back</button>
        </div>
        ${tabbar(tabs)}
        <div class="dbody">${body}</div>
      </div>
      ${rail(x.next, `<h5>Talk track</h5><div class="script">${esc(talk)}</div>`)}
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
              <div class="m">${esc(leadCo(l))} · ${esc(l.phone)}</div>
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

  function pageSms() { return pageInbox(); }

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
    const inPlay = JOBS.filter((j) => j.cust === c.id).length;
    const ads = ADS.filter((a) => a.cust === c.id);
    let body = "";
    if (tab === "overview") body = kv([
      ["Legal", esc(x.legal || c.name)], ["Trade", esc(c.trade)], ["Market", esc(c.city)],
      ["Rank / share", `#${c.rank} · ${c.share}`], ["Crew", x.crew || "—"], ["Hours", esc(x.hours || "—")],
      ["Radius", esc(x.radius || "—")], ["Services", esc(x.services || c.trade)],
      ["GBP", esc(x.gbp || "—")],
    ]) + `<div class="sec" style="margin-top:16px"><h5>Health</h5>${(x.health || []).map((h) => `<div class="file"><span>${esc(h.l)}</span><span class="pill ${h.ok ? "go" : "wait"}">${esc(h.v)}</span></div>`).join("")}</div>`;
    if (tab === "people") body = peopleList(x.people && x.people.length ? x.people : [x.owner], "L1");
    if (tab === "funnel") body = `<div class="sec"><h5>Work we run for them — not their homeowner jobs</h5>
        <p style="color:var(--muted);font-size:12.5px;margin:0 0 10px">Their storm calls live in THEIR world. Wrangler sells them the site, the ads, the number, the AI.</p>
        ${JOBS.filter((j) => j.cust === c.id).map((j) => `<div class="file"><span>${esc(j.title)}</span><span class="pill">${esc(j.status)}</span></div>`).join("") || `<div style="color:var(--muted)">No jobs in flight.</div>`}</div>`;
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
          <div class="pills"><span class="pill">${inPlay} jobs in flight</span><span class="pill">${ads.length} campaigns</span><span class="pill">isolated</span></div>
        </div>
        <div class="acts">
          <button class="btn tiny brand" data-act="nav" data-page="leads">Sales leads</button>
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
    const list = threads();
    const cur = list.find((t) => t.id === state.sms) || list[0];
    const l = cur && lead(cur.id);
    const msgs = cur ? (state.convos[cur.id] || (cur.via === "vm" ? [{ dir: "in", t: cur.preview, ch: "vm" }] : cur.wrangle ? [{ dir: "in", t: cur.preview, ch: cur.via }] : [])) : [];
    const chans = [["all", "All"], ["unread", "Unread"], ["sms", "SMS"], ["email", "Email"], ["call", "Calls / VM"], ["wrangle", "Needs a job"]];
    const placeholder = !cur ? "" : cur.via === "email" ? "Reply by email — stays on this customer" : cur.via === "slack" ? "Reply in Slack" : cur.via === "vm" ? "Text them back (Twilio) — then call" : "SMS via Twilio — opted-in only";
    const context = cur && l ? `
      <h5>Record</h5>
      <div class="next-box"><b>${esc(l.name)}</b>
        <div style="color:var(--muted);font-size:12.5px;margin:6px 0">${esc(leadCo(l))} · ${esc(l.note)}</div>
        <button class="btn tiny brand" data-act="open-lead" data-id="${l.id}">Open dossier</button>
      </div>` : cur && cur.wrangle ? `
      <h5>This is ops, not a homeowner text</h5>
      <div class="next-box"><b>${esc(cur.task || "Turn into a job")}</b>
        <div style="color:var(--muted);font-size:12.5px;margin:6px 0 10px">${esc(cur.book)} asked. Wrangle hands it to Head Wrangler — isolated to this customer.</div>
        <button class="btn brand full" data-act="wrangle" data-id="${cur.id}">Wrangle → job</button>
      </div>` : "";
    if (!cur) return `<div class="page pad">Inbox is empty.</div>`;
    return `<div class="page desk">
      <div class="roll">
        <div class="acts" style="border-bottom:1px solid var(--line);flex-wrap:wrap">
          ${chans.map(([cid, label]) => `<button class="btn tiny ${state.chan === cid ? "brand" : ""}" data-act="chan" data-id="${cid}">${esc(label)}</button>`).join("")}
        </div>
        ${list.map((t) => `<button class="item ${t.id === cur.id ? "on" : ""}" data-act="sms-sel" data-id="${t.id}">
          <div class="t">${t.unread ? "● " : ""}${esc(t.name)} <span class="pill ${t.via === "sms" ? "go" : t.via === "vm" || t.via === "call" ? "wait" : t.wrangle ? "brand" : "info"}">${esc(t.via)}</span></div>
          <div class="m">${esc(t.book)} · ${esc(t.kind)}${t.sla ? " · SLA " + t.sla + "s" : ""}</div>
          <div class="m" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.preview)}</div>
        </button>`).join("") || `<div class="pad" style="color:var(--muted)">Nothing in this filter.</div>`}
      </div>
      <div class="thread">
        <div style="padding:14px 18px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:10px">
          <div><b>${esc(cur.name)}</b>
            <div class="mono" style="color:var(--muted);font-size:12px">${esc(cur.phone || cur.via)} · ${esc(cur.book)} · ${esc(cur.kind)}</div>
          </div>
          <div style="display:flex;gap:6px">
            ${cur.phone ? `<button class="btn tiny brand" data-act="dial" data-id="${cur.id === "VM1" ? "L2" : cur.id}">Call</button>` : ""}
            ${cur.wrangle ? `<button class="btn tiny" data-act="wrangle" data-id="${cur.id}">Wrangle</button>` : ""}
          </div>
        </div>
        <div class="msgs">${msgs.map((m) => `<div class="bubble ${m.dir}"><span class="pill" style="margin-right:6px">${esc(m.ch || cur.via)}</span>${esc(m.t)}</div>`).join("")}</div>
        ${cur.via === "sms" || cur.via === "vm" ? `<div style="display:flex;gap:6px;padding:8px 12px;flex-wrap:wrap">${TEMPLATES.map((t) => `<button class="btn tiny" data-act="tpl" data-id="${t.id}">${esc(t.name)}</button>`).join("")}</div>` : ""}
        <form class="composer" data-act="sms-send">
          <textarea name="body" placeholder="${esc(placeholder)}"></textarea>
          <button class="btn brand" type="submit">${cur.via === "email" ? "Send email" : cur.via === "slack" ? "Reply" : "Send"}</button>
        </form>
      </div>
      <aside class="rail">
        <h5>Channel</h5>
        <div style="font-size:12.5px;color:var(--muted);line-height:1.5">One inbox. SMS, email, Slack, missed calls, voicemail. Isolation: a Cascade thread never sits on Apex's DID.</div>
        ${context}
      </aside>
    </div>`;
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
          <button class="btn tiny" data-act="sms-open" data-id="${live.id}">Inbox</button>
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
    if (l) return { name: l.name, phone: l.phone, book: leadCo(l) };
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
    if (act === "sms-open") { state.sms = id; state.chan = "all"; go("inbox"); }
    if (act === "chan") { state.chan = id; render(); }
    if (act === "open-lead") { state.lead = id; go("leads"); }
    if (act === "wrangle") {
      const m = INBOX.find((x) => x.id === id);
      if (m) m.status = "tasked";
      toast("Wrangled → Head Wrangler · isolated job queued");
      go("work");
    }
    if (act === "sms-sel") { state.sms = id; render(); }
    if (act === "sel-lead") { state.lead = id; state.tab = "overview"; render(); }
    if (act === "sel-cust") { state.custId = id; state.tab = "overview"; render(); }
    if (act === "sel-prospect") { state.prospect = id; state.tab = "overview"; render(); }
    if (act === "sel-partner") { state.partner = id; state.tab = "overview"; render(); }
    if (act === "tab") { state.tab = id; render(); }
    if (act === "next") {
      const d = n.getAttribute("data-do");
      if (d === "dial") dial(state.page === "prospects" ? state.prospect : state.lead);
      else if (d === "sms") { state.sms = state.page === "partners" ? "L8" : state.lead; go("inbox"); }
      else if (d === "ads") go("ads");
      else if (d === "approvals") go("approvals");
      else if (d === "settings") go("settings");
      else if (d === "job") { state.tab = "scope"; render(); }
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
      const name = l ? l.name.split(" ")[0] : "there";
      const company = l ? leadCo(l) : "Wrangler";
      const job = l ? l.note : "your request";
      const city = l ? l.city : "";
      const body = t.body.replace("{name}", name).replace("{company}", company).replace("{job}", job).replace("{when}", "Thu 7:30a").replace("{city}", city).replace("{link}", "g.page/apex");
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
      const row = INBOX.find((x) => x.id === id);
      if (row) row.status = "tasked";
      const to = (lead(id) && lead(id).phone) || (party(id) && party(id).phone) || "thread";
      toast((lead(id) || id === "VM1" ? "Twilio SMS queued to " : "Reply queued · ") + to);
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
    let p = location.hash.replace("#/", "");
    if (p === "sms") p = "inbox";
    if (PAGES[p]) { state.page = p; render(); }
  });

  let boot = location.hash.replace("#/", "");
  if (boot === "sms") boot = "inbox";
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
