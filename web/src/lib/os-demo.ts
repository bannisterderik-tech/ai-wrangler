/** Frontend seed for the domination OS. Live Twilio/Zernio replace this when keys exist. */

export const STAGES = ["New", "Talking", "Proposal", "Won", "Customer"] as const;

export const CUSTOMERS = [
  { id: "apex", name: "Apex Roofing", city: "Red Bluff, CA", trade: "Roofing", mrr: 4500, rank: 2, share: "18%" },
  { id: "cascade", name: "Cascade HVAC", city: "Redding, CA", trade: "HVAC", mrr: 3800, rank: 4, share: "11%" },
  { id: "ironclad", name: "Ironclad Plumbing", city: "Chico, CA", trade: "Plumbing", mrr: 3200, rank: 3, share: "14%" },
  { id: "ridge", name: "Ridgeline Electric", city: "Corning, CA", trade: "Electrical", mrr: 2800, rank: 6, share: "9%" },
  { id: "valley", name: "Valley Pest", city: "Tehama County", trade: "Pest", mrr: 2200, rank: 1, share: "22%" },
] as const;

export type LeadKind = "lead" | "partner";

export type Lead = {
  id: string;
  name: string;
  company: string;
  trade: string;
  phone: string;
  kind: LeadKind;
  src: string;
  score: number;
  stage: number;
  city: string;
  note: string;
  sla: number;
  value: number;
};

export const LEADS: Lead[] = [
  { id: "L1", name: "Jake Summit", company: "Summit Roofing", trade: "Roofing", phone: "+1 530 555 4401", kind: "lead", src: "Apex case study", score: 94, stage: 0, city: "Redding, CA", note: "Wants the Apex machine: site + LSA + 60s SMS.", sla: 38, value: 4500 },
  { id: "L2", name: "Lisa Park", company: "North Valley HVAC", trade: "HVAC", phone: "+1 530 555 4418", kind: "lead", src: "Inbound form", score: 88, stage: 1, city: "Chico, CA", note: "CSR drowned. Needs after-hours AI + new site.", sla: 12, value: 3800 },
  { id: "L3", name: "Owen Diaz", company: "River City Electric", trade: "Electrical", phone: "+1 530 555 4470", kind: "lead", src: "Ken Williamson", score: 81, stage: 0, city: "Red Bluff, CA", note: "No website. GBP from 2019. EV-panel demand, zero capture.", sla: 51, value: 2800 },
  { id: "L4", name: "Sam Ruiz", company: "Tehama Air & Heat", trade: "HVAC", phone: "+1 530 555 4422", kind: "lead", src: "Demo", score: 91, stage: 2, city: "Corning, CA", note: "Proposal out: site rebuild + reviews + LSA.", sla: 0, value: 3200 },
  { id: "L5", name: "Gina Holt", company: "Holt Plumbing Co", trade: "Plumbing", phone: "+1 530 555 4430", kind: "lead", src: "Google", score: 76, stage: 1, city: "Red Bluff, CA", note: "Jobber + a Wix page. Wants isolation + ads.", sla: 22, value: 3000 },
  { id: "L6", name: "Marcus Bell", company: "Bell Brothers Roofing", trade: "Roofing", phone: "+1 530 555 4441", kind: "lead", src: "Partner ping", score: 72, stage: 0, city: "Redding, CA", note: "Buying Angi. Close rate 9%. Asked for a teardown.", sla: 63, value: 4200 },
  { id: "L7", name: "Priya Shah", company: "Shah Pest Control", trade: "Pest", phone: "+1 530 555 4455", kind: "lead", src: "Referral", score: 85, stage: 3, city: "Tehama, CA", note: "Won — DocuSign. Kickoff: GBP + click-to-call site.", sla: 0, value: 2200 },
  { id: "L8", name: "Ken Williamson", company: "Williamson Water", trade: "Water", phone: "+1 970 555 0144", kind: "partner", src: "Trade", score: 90, stage: 4, city: "Montrose, CO", note: "Sends roofing/HVAC owners our way.", sla: 0, value: 0 },
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
  { id: "T1", name: "Book the teardown", body: "Hey {name} — Wrangler here. Got your note about {job}. Got 20 min this week for a teardown of the current site + ads?" },
  { id: "T2", name: "Apex proof", body: "{name} — this is the storm page we shipped for Apex in Red Bluff. Same machine, your market." },
  { id: "T3", name: "Proposal nudge", body: "{name} — proposal's in your inbox. Site + LSA + Twilio 60s SLA. Reply 1 and we kick off Monday." },
  { id: "T4", name: "Partner ping", body: "Hey {name} — sending you a warm owner in {city} who needs a site. You free to intro?" },
];

export const DIALER_SCRIPT =
  "Hey {name}, this is Wrangler — you asked about a site and the lead machine for {company}.\n\n1. Confirm trade + market. Don't pitch yet.\n2. What's broken: website, GBP, ads, after-hours, reviews.\n3. Book a 20-min teardown. Don't quote a retainer on this call.\n4. Send the Apex case study after you hang up.";

export function customerName(id: string) {
  return CUSTOMERS.find((c) => c.id === id)?.name || id;
}

export function leadCompany(l: { company?: string; name: string }) {
  return l.company || l.name;
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
