/* Dossier records — Wrangler sells web/tech to trades. Not roof jobs. */
window.WR = window.WR || {};

WR.PROSPECTS = [
  { id: "R1", name: "Summit Roofing", trade: "Roofing", city: "Redding, CA", value: 4500, stage: 1, phone: "+1 530 555 4401", email: "jake@summitroofing.net", dm: "Jake Summit", role: "Owner", pain: "Buying Angi leads at $92. Close rate 11%. After-hours goes to voicemail.", stack: "Angi · Jobber · in-house Google ads", why: "Saw Apex's storm page rank #1 in Red Bluff. Wants the same machine.", demo: "Thu 2:00p", employees: 9, jobsMo: 22 },
  { id: "R2", name: "North Valley HVAC", trade: "HVAC", city: "Chico, CA", value: 3800, stage: 2, phone: "+1 530 555 4418", email: "lisa@nvhvac.com", dm: "Lisa Park", role: "COO", pain: "CSR drowned. Speed-to-lead is 14 minutes. Goodman dealer eating nights.", stack: "ServiceTitan · Facebook ads", why: "Lost 3 after-hours replacements last week — they want the site + night AI.", demo: "Proposal sent Mon", employees: 14, jobsMo: 40 },
  { id: "R3", name: "River City Electric", trade: "Electrical", city: "Red Bluff, CA", value: 2800, stage: 0, phone: "+1 530 555 4470", email: "owen@rcelectric.co", dm: "Owen Diaz", role: "Owner-operator", pain: "No site. GBP photos from 2019. Panel-upgrade demand from EVs, zero capture.", stack: "None. Pencil and a van.", why: "Ken Williamson intro.", demo: null, employees: 4, jobsMo: 12 },
  { id: "R4", name: "Tehama Air & Heat", trade: "HVAC", city: "Corning, CA", value: 3200, stage: 3, phone: "+1 530 555 4422", email: "sam@tehamaair.com", dm: "Sam Ruiz", role: "Founder", pain: "Wants to stop being the cheap guy. Needs reviews + LSA + a real site.", stack: "Housecall Pro", why: "Won — contract in DocuSign.", demo: "Won", employees: 7, jobsMo: 18 },
];

WR.PROSPECT_STAGES = ["New", "Talking", "Proposal", "Won"];

WR.LEAD_X = {
  L1: {
    email: "jake@summitroofing.net", website: "summitroofing.net (Wix, 2018)", stack: "Angi · Jobber · DIY Google ads",
    pain: "Buying Angi at $92. Close 11%. Nights to voicemail.",
    scope: "New site · Google LSA · Twilio 60s SMS · click-to-call",
    assigned: "You", temp: "hot",
    people: [{ name: "Jake Summit", role: "Owner", phone: "+1 530 555 4401", email: "jake@summitroofing.net" }],
    money: { mrr: 4500, term: "12 mo", competitor: "Angi + a cousin who 'does websites'" },
    attrib: { campaign: "Apex case study", network: "referral", partner: null, firstTouch: "this morning" },
    tasks: [{ t: "Call Jake", done: false }, { t: "Book teardown", done: false }, { t: "Send Apex storm page Loom", done: false }],
    files: [{ n: "apex-case-study.pdf", k: "proof" }],
    next: { title: "Call Jake — he asked for the Apex machine", why: "Inbound, hot, 38s and climbing. First agency that talks books the teardown.", do: "dial" },
  },
  L2: {
    email: "lisa@nvhvac.com", website: "nvhvac.com", stack: "ServiceTitan · Facebook ads",
    pain: "CSR drowned. 14 min speed-to-lead. After-hours dying.",
    scope: "Site speed pass · after-hours AI receptionist · Twilio overflow",
    assigned: "You", temp: "hot",
    people: [{ name: "Lisa Park", role: "COO", phone: "+1 530 555 4418", email: "lisa@nvhvac.com" }],
    money: { mrr: 3800, term: "12 mo", competitor: "ServiceTitan marketing add-on" },
    attrib: { campaign: "Inbound form", network: "wrangler site", partner: null, firstTouch: "yesterday" },
    tasks: [{ t: "Show night-AI demo", done: true }, { t: "Send proposal", done: false }],
    files: [{ n: "nvhvac-audit.pdf", k: "audit" }],
    next: { title: "Send the after-hours proposal today", why: "They already lost three night replacements this week.", do: "sms" },
  },
  L3: {
    email: "owen@rcelectric.co", website: "none", stack: "Pencil and a van",
    pain: "No site. GBP from 2019. EV panel demand, zero capture.",
    scope: "First site · GBP · click-to-call · LSA when ready",
    assigned: "You", temp: "warm",
    people: [{ name: "Owen Diaz", role: "Owner-operator", phone: "+1 530 555 4470", email: "owen@rcelectric.co" }],
    money: { mrr: 2800, term: "12 mo", competitor: "none — they have nothing" },
    attrib: { campaign: "Ken Williamson intro", network: "partner", partner: "P1", firstTouch: "yesterday" },
    tasks: [{ t: "Call Owen", done: false }, { t: "Mock a one-pager on his van wrap", done: false }],
    files: [],
    next: { title: "Call Owen — Ken already sold the intro", why: "No site. That's a 2-week ship, not a 6-month website project.", do: "dial" },
  },
};

WR.CUST_X = {
  apex: {
    legal: "Apex Roofing LLC", founded: 2009, crew: 11, hours: "Mon–Sat 7a–7p · after-hours → Maya cell via Twilio",
    radius: "20 miles of Red Bluff", services: "Reroof · repair · tarp · insurance · gutters",
    voice: "Direct. No scare tactics. Storm = tarp today, quote tomorrow.",
    rules: "Ask before anything a homeowner could see. Previews auto-OK.",
    did: "+1 530 555 0190", a2p: "Brand registered · 10DLC campaign ApexStorm",
    gbp: "Apex Roofing Red Bluff · 4.8★ · 186 reviews",
    github: "apex-roofing/site", vercel: "apexroofing.vercel.app", zernio: "profile_apex",
    owner: { name: "Rick Hale", role: "Owner", phone: "+1 530 555 2001", email: "rick@apexroofing.co" },
    people: [
      { name: "Rick Hale", role: "Owner", phone: "+1 530 555 2001", email: "rick@apexroofing.co" },
      { name: "Maya Chen", role: "CSR / speed-to-lead", phone: "+1 530 555 2002", email: "maya@apexroofing.co" },
      { name: "Andre Voss", role: "Lead estimator", phone: "+1 530 555 2003", email: "andre@apexroofing.co" },
    ],
    health: [
      { l: "Speed-to-lead", v: "47s", ok: true },
      { l: "Share of search", v: "18% · rank #2", ok: false },
      { l: "Reviews this month", v: "9 · 4.9★", ok: true },
      { l: "Site", v: "Storm page live", ok: true },
      { l: "Ad ROAS", v: "6.2× Google", ok: true },
      { l: "Isolation", v: "Repo + DID + Zernio unique", ok: true },
    ],
    next: { title: "Kill the #1 competitor on ‘emergency roof repair Red Bluff’", why: "We're #2. Storm 90 playbook + $75/day more on LSA closes the gap this week.", do: "ads" },
  },
  cascade: {
    legal: "Cascade HVAC Inc", founded: 1998, crew: 16, hours: "24/7 on-call",
    radius: "Redding + 25mi", services: "Install · repair · maintenance plans",
    voice: "Calm, technical, never upsell a furnace at 1am.",
    rules: "After-hours: diagnose, don't replace without a human OK.",
    did: "+1 530 555 3300", a2p: "Pending — blast blocked on your OK",
    gbp: "Cascade HVAC Redding · 4.6★ · 240 reviews",
    github: "cascade-hvac/site", vercel: "cascadehvac.vercel.app", zernio: "profile_cascade",
    owner: { name: "Dev Okafor", role: "Founder", phone: "+1 530 555 3301", email: "dev@cascadehvac.com" },
    people: [{ name: "Dev Okafor", role: "Founder", phone: "+1 530 555 3301", email: "dev@cascadehvac.com" }],
    health: [
      { l: "Site", v: "Needs night-AI page", ok: false },
      { l: "After-hours", v: "A2P blast waiting on you", ok: false },
      { l: "Isolation", v: "Walls up", ok: true },
    ],
    next: { title: "Approve after-hours SMS blast (46 opted-in)", why: "They're losing night replacements to the big guys. Irreversible once it leaves Twilio.", do: "approvals" },
  },
};

WR.PART_X = {
  P1: {
    legal: "Williamson Water LLC", contact: { name: "Ken Williamson", role: "Owner", phone: "+1 970 555 0144", email: "ken@williamsonwater.com" },
    trades: "Sends roofing/HVAC *owners* who need a site — not homeowner jobs",
    territory: "Montrose + Tehama (snowbirds)", exclusive: "Wrangler for web/tech in Red Bluff trades",
    take: "10% of collected", w9: "on file", last: "this morning",
    flow: [{ n: "River City Electric — needs a site", dir: "in", when: "today" }, { n: "Apex case study PDF", dir: "out", when: "last week" }],
    next: { title: "Thank Ken and ask for one more owner this month", why: "He sends shops that buy Wrangler. Reciprocity is the contract.", do: "sms" },
  },
  P3: {
    legal: "Dudley Excavating", contact: { name: "Cal Dudley", role: "Ops", phone: "+1 530 555 7701", email: "cal@dudleyexc.com" },
    trades: "GC network — intros to owners who need sites",
    territory: "Tehama County", exclusive: "none",
    take: "12%", w9: "on file", last: "yesterday",
    flow: [{ n: "Bell Brothers Roofing — Angi refugee", dir: "in", when: "yesterday" }],
    next: { title: "Send Cal the Apex Loom to forward", why: "GCs meet owners before we do. Arm them.", do: "sms" },
  },
};

WR.CUST_DEFAULT = {
  legal: "", crew: 6, hours: "Mon–Fri 8–5", radius: "15 miles", services: "Core trade",
  voice: "Plain speech. Local.", rules: "Balanced.",
  did: "unassigned", a2p: "not started", gbp: "thin",
  github: "unbound", vercel: "unbound", zernio: "unbound",
  people: [], health: [{ l: "Isolation", v: "Walls up", ok: true }],
  next: { title: "Connect Twilio DID + Zernio profile", why: "Can't dominate a market without a number and an ad account that don't leak.", do: "settings" },
};

WR.PART_DEFAULT = {
  contact: { name: "—", role: "Owner", phone: "", email: "" },
  trades: "Referral", territory: "local", exclusive: "none", w9: "needed", last: "—", flow: [],
  next: { title: "Send a thank-you SMS and a W9 request", why: "Partners who intro owners keep intro'ing.", do: "sms" },
};
