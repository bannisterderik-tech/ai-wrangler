/** Frontend seed for the domination OS. Live Twilio/Zernio replace this when keys exist. */

export const STAGES = ["New", "Speed-to-lead", "Estimate", "Won", "Customer"] as const;

export const CUSTOMERS = [
  { id: "apex", name: "Apex Roofing", city: "Red Bluff, CA", trade: "Roofing", mrr: 4500, rank: 2, share: "18%" },
  { id: "cascade", name: "Cascade HVAC", city: "Redding, CA", trade: "HVAC", mrr: 3800, rank: 4, share: "11%" },
  { id: "ironclad", name: "Ironclad Plumbing", city: "Chico, CA", trade: "Plumbing", mrr: 3200, rank: 3, share: "14%" },
  { id: "ridge", name: "Ridgeline Electric", city: "Corning, CA", trade: "Electrical", mrr: 2800, rank: 6, share: "9%" },
  { id: "valley", name: "Valley Pest", city: "Tehama County", trade: "Pest", mrr: 2200, rank: 1, share: "22%" },
] as const;

export type LeadKind = "lead" | "prospect" | "customer" | "partner";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  kind: LeadKind;
  cust: string;
  src: string;
  score: number;
  stage: number;
  city: string;
  note: string;
  sla: number;
};

export const LEADS: Lead[] = [
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

export const ADS = [
  { id: "A1", cust: "apex", platform: "google", name: "Roof replacement — Red Bluff 20mi", status: "active", spend: 1840, leads: 41, cpl: 44.88, roas: 6.2 },
  { id: "A2", cust: "apex", platform: "meta", name: "Storm leak — instant call", status: "active", spend: 920, leads: 28, cpl: 32.86, roas: 4.8 },
  { id: "A3", cust: "cascade", platform: "google", name: "Emergency HVAC Redding", status: "active", spend: 1310, leads: 22, cpl: 59.55, roas: 5.1 },
  { id: "A4", cust: "ironclad", platform: "tiktok", name: "Slab leak 15s", status: "paused", spend: 410, leads: 9, cpl: 45.56, roas: 3.4 },
  { id: "A5", cust: "valley", platform: "meta", name: "Termite swarm season", status: "active", spend: 640, leads: 19, cpl: 33.68, roas: 7.1 },
  { id: "A6", cust: "ridge", platform: "google", name: "EV panel upgrade", status: "pending_review", spend: 0, leads: 0, cpl: 0, roas: 0 },
];

export const PARTNERS = [
  { id: "P1", name: "Williamson Water", kind: "Trade partner", city: "Montrose, CO", sent: 11, won: 4, take: "10%" },
  { id: "P2", name: "Tehama Family Fitness", kind: "Community", city: "Red Bluff", sent: 3, won: 1, take: "gift card" },
  { id: "P3", name: "Dudley Excavating", kind: "Trade partner", city: "Tehama County", sent: 7, won: 3, take: "12%" },
  { id: "P4", name: "Mistletoe Construction", kind: "GC", city: "Red Bluff", sent: 9, won: 5, take: "8%" },
];

export const SMS_TEMPLATES = [
  { id: "T1", name: "60s speed-to-lead", body: "Hey {name} — this is {company}. Got your request about {job}. Can you take a 2-min call so we can get you on today's board?" },
  { id: "T2", name: "Estimate confirm", body: "{name}, you're on the board for Thursday 7:30a. Reply 1 to confirm, 2 to move it. — {company}" },
  { id: "T3", name: "Review ask", body: "{name} — glad we got you taken care of. Mind a 20-second Google review? It helps the crew." },
  { id: "T4", name: "Partner ping", body: "Hey {name} — sending you a warm one in {city}. You free to take it this week?" },
];

export const DIALER_SCRIPT =
  "Hey {name}, this is Wrangler on the line for {company} — you just requested help with {job}.\n\n1. Confirm the address and the pain.\n2. Ask: is anyone home in the next 90 minutes?\n3. Book the estimate. Don't quote a number on the first call.\n4. If insurance: get carrier + claim #.\n5. Text the calendar hold before you hang up.";

export function customerName(id: string) {
  return CUSTOMERS.find((c) => c.id === id)?.name || id;
}

export const PROSPECT_STAGES = ["New", "Talking", "Proposal", "Won"] as const;

export const PROSPECTS = [
  { id: "R1", name: "Summit Roofing", trade: "Roofing", city: "Redding, CA", value: 4500, stage: 1, phone: "+1 530 555 4401", email: "jake@summitroofing.net", dm: "Jake Summit", role: "Owner", pain: "Buying Angi leads at $92. Close rate 11%. After-hours goes to voicemail.", stack: "Angi · Jobber · in-house Google ads", why: "Saw Apex's storm page rank #1 in Red Bluff.", demo: "Thu 2:00p", employees: 9, jobsMo: 22 },
  { id: "R2", name: "North Valley HVAC", trade: "HVAC", city: "Chico, CA", value: 3800, stage: 2, phone: "+1 530 555 4418", email: "lisa@nvhvac.com", dm: "Lisa Park", role: "COO", pain: "CSR drowned. Speed-to-lead is 14 minutes.", stack: "ServiceTitan · Facebook ads", why: "Lost 3 after-hours replacements last week.", demo: "Proposal sent Mon", employees: 14, jobsMo: 40 },
  { id: "R3", name: "River City Electric", trade: "Electrical", city: "Red Bluff, CA", value: 2800, stage: 0, phone: "+1 530 555 4470", email: "owen@rcelectric.co", dm: "Owen Diaz", role: "Owner-operator", pain: "No site. GBP photos from 2019. EV panel demand, zero capture.", stack: "Pencil and a van", why: "Ken Williamson intro.", demo: null as string | null, employees: 4, jobsMo: 12 },
  { id: "R4", name: "Tehama Air & Heat", trade: "HVAC", city: "Corning, CA", value: 3200, stage: 3, phone: "+1 530 555 4422", email: "sam@tehamaair.com", dm: "Sam Ruiz", role: "Founder", pain: "Wants to stop being the cheap guy.", stack: "Housecall Pro", why: "Won — contract in DocuSign.", demo: "Won", employees: 7, jobsMo: 18 },
];

export function money(n: number) {
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
