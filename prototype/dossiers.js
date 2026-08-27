/* Dossier records — the OS remembers everything an agency must never lose. */
window.WR = window.WR || {};

WR.PROSPECTS = [
  { id: "R1", name: "Summit Roofing", trade: "Roofing", city: "Redding, CA", value: 4500, stage: 1, phone: "+1 530 555 4401", email: "jake@summitroofing.net", dm: "Jake Summit", role: "Owner", pain: "Buying Angi leads at $92. Close rate 11%. After-hours goes to voicemail.", stack: "Angi · Jobber · in-house Google ads", why: "Saw Apex's storm page rank #1 in Red Bluff. Wants the same machine.", demo: "Thu 2:00p", employees: 9, jobsMo: 22 },
  { id: "R2", name: "North Valley HVAC", trade: "HVAC", city: "Chico, CA", value: 3800, stage: 2, phone: "+1 530 555 4418", email: "lisa@nvhvac.com", dm: "Lisa Park", role: "COO", pain: "CSR drowned. Speed-to-lead is 14 minutes. Goodman dealer eating nights.", stack: "ServiceTitan · Facebook ads", why: "Lost 3 after-hours replacements last week.", demo: "Proposal sent Mon", employees: 14, jobsMo: 40 },
  { id: "R3", name: "River City Electric", trade: "Electrical", city: "Red Bluff, CA", value: 2800, stage: 0, phone: "+1 530 555 4470", email: "owen@rcelectric.co", dm: "Owen Diaz", role: "Owner-operator", pain: "No site. GBP photos from 2019. Panel-upgrade demand from EVs, zero capture.", stack: "None. Pencil and a van.", why: "Ken Williamson intro.", demo: null, employees: 4, jobsMo: 12 },
  { id: "R4", name: "Tehama Air & Heat", trade: "HVAC", city: "Corning, CA", value: 3200, stage: 3, phone: "+1 530 555 4422", email: "sam@tehamaair.com", dm: "Sam Ruiz", role: "Founder", pain: "Wants to stop being the cheap guy. Needs reviews + LSA + a real site.", stack: "Housecall Pro", why: "Won — contract in DocuSign.", demo: "Won", employees: 7, jobsMo: 18 },
];

WR.PROSPECT_STAGES = ["New", "Talking", "Proposal", "Won"];

WR.LEAD_X = {
  L1: {
    email: "maria.delgado@gmail.com", addr: "412 Oak St, Red Bluff, CA 96080", year: 1978, temp: "hot",
    assigned: "Maya Chen", opt: { call: true, sms: true, email: true }, dnc: false,
    people: [{ name: "Maria Delgado", role: "Homeowner", phone: "+1 530 555 0142" }, { name: "Luis Delgado", role: "Spouse / on site", phone: "+1 530 555 0143" }],
    job: { trade: "Roofing", issue: "Storm leak over garage", squares: 22, material: "3-tab asphalt, 18yr", insurance: "State Farm · claim #SF-88211", tarp: "Tonight", access: "Gate code 4412", photos: 6 },
    money: { estimate: 18400, deposit: 0, financed: "undecided", competitor: "Two bids incoming" },
    attrib: { campaign: "Storm leak — instant call", network: "Google LSA", keyword: "emergency roof repair red bluff", landing: "/storm", partner: null, firstTouch: "8:14a" },
    appts: [{ when: "Today 4:30p–6p", kind: "Tarp + inspect", who: "Andre Voss" }],
    tasks: [{ t: "Call in < 60s", done: false }, { t: "Confirm someone home", done: false }, { t: "Tarp tonight", done: false }, { t: "Photos of decking", done: false }, { t: "Insurance worksheet", done: false }],
    files: [{ n: "garage-leak-1.jpg", k: "photo" }, { n: "insurance-card.pdf", k: "doc" }],
    next: { title: "Call Maria now — 38s SLA and climbing", why: "Hot LSA. Storm leak. She asked for a tarp today. First shop that talks wins the claim.", do: "dial" },
  },
  L3: {
    email: "priya.shah@icloud.com", addr: "88 Pioneer Dr, Redding, CA", year: 1994, temp: "hot",
    assigned: "Night AI", opt: { call: true, sms: true, email: false }, dnc: false,
    people: [{ name: "Priya Shah", role: "Homeowner", phone: "+1 530 555 0114" }],
    job: { trade: "HVAC", issue: "Furnace out, elderly in home", squares: "3-ton, 16yr Goodman", material: "Gas furnace", insurance: "none", tarp: "n/a", access: "Side door", photos: 2 },
    money: { estimate: 7200, deposit: 0, financed: "yes if >$5k", competitor: "One after-hours service already quoted $890 trip" },
    attrib: { campaign: "Emergency HVAC Redding", network: "Google LSA", keyword: "furnace not working redding", landing: "/", partner: null, firstTouch: "1:12a" },
    appts: [{ when: "Thu 7:30a", kind: "Diagnose + quote", who: "Cascade on-call" }],
    tasks: [{ t: "Keep her warm (blankets SMS sent)", done: true }, { t: "Confirm Thursday window", done: false }, { t: "Parts on truck", done: false }],
    files: [{ n: "furnace-tag.jpg", k: "photo" }],
    next: { title: "Confirm Thursday 7:30a by SMS", why: "Elderly. After-hours. One competitor already in her head.", do: "sms" },
  },
  L10: {
    email: "l.ortega@outlook.com", addr: "19 Antelope Blvd, Red Bluff, CA", year: 1962, temp: "warm",
    assigned: "Andre Voss", opt: { call: true, sms: true, email: true }, dnc: false,
    people: [{ name: "Luis Ortega", role: "Homeowner", phone: "+1 530 555 0133" }, { name: "Adjuster — Dana Cho", role: "State Farm", phone: "+1 530 555 8800" }],
    job: { trade: "Roofing", issue: "Hail 1.25\" — full reroof likely", squares: 28, material: "comp, 12yr", insurance: "State Farm · adjuster Friday", tarp: "not needed", access: "open", photos: 14 },
    money: { estimate: 31200, deposit: 0, financed: "insurance", competitor: "National chain already door-knocked" },
    attrib: { campaign: "Storm list", network: "SMS blast", keyword: null, landing: "/storm", partner: "P3", firstTouch: "yesterday" },
    appts: [{ when: "Fri 10:00a with adjuster", kind: "Meet adjuster", who: "Andre Voss" }],
    tasks: [{ t: "Meet Dana Friday", done: false }, { t: "Supplement if they lowball", done: false }],
    files: [{ n: "hail-map.pdf", k: "doc" }, { n: "drone-1.jpg", k: "photo" }],
    next: { title: "Prep supplement packet before Friday", why: "National chain is already on the porch. We win on documentation.", do: "job" },
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
      { l: "Speed-to-lead", v: "4s on Priya", ok: true },
      { l: "After-hours", v: "Needs A2P blast", ok: false },
      { l: "Isolation", v: "Walls up", ok: true },
    ],
    next: { title: "Approve after-hours SMS blast (46 opted-in)", why: "They're losing night replacements to the big guys. Irreversible once it leaves Twilio.", do: "approvals" },
  },
};

WR.PART_X = {
  P1: {
    legal: "Williamson Water LLC", contact: { name: "Ken Williamson", role: "Owner", phone: "+1 970 555 0144", email: "ken@williamsonwater.com" },
    trades: "RO / filtration · sends roofing when they open a ceiling",
    territory: "Montrose + Tehama (snowbirds)", exclusive: "Apex for roofing in Red Bluff",
    take: "10% of collected", w9: "on file", last: "this morning",
    flow: [{ n: "Reroof — Oak St", dir: "in", when: "today" }, { n: "Whole-home filtration", dir: "out", when: "last week" }],
    next: { title: "Text Ken the Oak St leak as a warm handoff the other way", why: "He sent 11 this quarter. Reciprocity is the contract.", do: "sms" },
  },
  P3: {
    legal: "Dudley Excavating", contact: { name: "Cal Dudley", role: "Ops", phone: "+1 530 555 7701", email: "cal@dudleyexc.com" },
    trades: "Grading · septic · sends roofs after tree / hail debris",
    territory: "Tehama County", exclusive: "none",
    take: "12%", w9: "on file", last: "yesterday",
    flow: [{ n: "Hail — Antelope Blvd", dir: "in", when: "yesterday" }],
    next: { title: "Co-op storm SMS: their list + our tarp page", why: "They see debris piles first. We see insurance. Together we own the storm.", do: "sms" },
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
  next: { title: "Send a thank-you SMS and a W9 request", why: "Partners who get paid and thanked keep sending.", do: "sms" },
};
