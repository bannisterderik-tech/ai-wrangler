/* AI Wrangler OS — frontend preview (Twilio + Zernio wired as live-shaped demo until keys land). */
(() => {
  const NAV = [
    ["FUNNEL", [
      ["command", "Command"],
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
      ["work", "The floor"],
      ["sessions", "Sessions"],
      ["playbooks", "Playbooks"],
    ]],
    ["SYSTEM", [
      ["memory", "Memory"],
      ["spending", "Spending"],
      ["connect", "Connect Vercel"],
      ["github", "Our GitHub"],
      ["settings", "Settings"],
    ]],
  ];
  const TITLES = {
    command: "Command — dominate the market",
    leads: "Leads",
    prospects: "Prospects — firms we want",
    dialer: "Twilio power dialer",
    ads: "Zernio ads",
    partners: "Partners — the franchise network",
    customers: "Customer dossier",
    inbox: "Inbox — every thread",
    billing: "Billing & margin",
    work: "The floor — everything the AI is doing",
    sessions: "Sessions — every Claude Code on the floor",
    playbooks: "Playbooks",
    approvals: "The floor — everything the AI is doing",
    changes: "The floor — everything the AI is doing",
    wrangler: "Sessions — every Claude Code on the floor",
    team: "Sessions — every Claude Code on the floor",
    memory: "Memory — what the AI is allowed to remember",
    spending: "Spending",
    connect: "Connect Vercel",
    github: "Our GitHub",
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
    { id: "L8", name: "Ken Williamson", company: "Williamson Digital", trade: "Franchise", phone: "+1 970 555 0144", kind: "partner", src: "Founding partner", score: 90, stage: 4, city: "Montrose, CO", note: "Runs Montrose + Delta County under our name. Six shops.", sla: 0, value: 0 },
  ];
  const ADS = [
    { id: "A1", cust: "apex", platform: "google", name: "Roof replacement — Red Bluff 20mi", status: "active", spend: 1840, leads: 41, cpl: 44.88, roas: 6.2, goal: "leads" },
    { id: "A2", cust: "apex", platform: "meta", name: "Storm leak — instant call", status: "active", spend: 920, leads: 28, cpl: 32.86, roas: 4.8, goal: "calls" },
    { id: "A3", cust: "cascade", platform: "google", name: "Emergency HVAC Redding", status: "active", spend: 1310, leads: 22, cpl: 59.55, roas: 5.1, goal: "leads" },
    { id: "A4", cust: "ironclad", platform: "tiktok", name: "Slab leak 15s", status: "paused", spend: 410, leads: 9, cpl: 45.56, roas: 3.4, goal: "traffic" },
    { id: "A5", cust: "valley", platform: "meta", name: "Termite swarm season", status: "active", spend: 640, leads: 19, cpl: 33.68, roas: 7.1, goal: "leads" },
    { id: "A6", cust: "ridge", platform: "google", name: "EV panel upgrade", status: "pending_review", spend: 0, leads: 0, cpl: 0, roas: 0, goal: "leads" },
  ];
  const TIERS = {
    founding: { name: "Founding", fee: 0, royalty: 18, exclusive: true, kit: "everything, forever" },
    operator: { name: "Operator", fee: 950, royalty: 12, exclusive: true, kit: "full kit" },
    associate: { name: "Associate", fee: 450, royalty: 8, exclusive: false, kit: "core kit" },
  };
  const KIT = [
    { id: "K1", kind: "brand", name: "The AI Wrangler name", what: "Their market, our name. Site, deck, contracts, and the teardown script.", tier: "associate" },
    { id: "K2", kind: "os", name: "Their own Wrangler tenant", what: "This OS, their customers, their walls. We cannot read their book and neither can any other partner.", tier: "associate" },
    { id: "K3", kind: "playbook", name: "Rebuild in 10", what: "The delivery playbook. Kickoff to production in ten days.", tier: "associate" },
    { id: "K4", kind: "playbook", name: "Teardown close", what: "The sales motion. Their broken funnel on screen, never a deck.", tier: "associate" },
    { id: "K5", kind: "recipe", name: "site-builder", what: "Agent recipe: read the old site, generate the route template, open a preview.", tier: "operator" },
    { id: "K6", kind: "recipe", name: "receptionist", what: "Agent recipe: DID, A2P registration, missed-call SMS under sixty seconds.", tier: "operator" },
    { id: "K7", kind: "recipe", name: "local-seo", what: "Agent recipe: service-area pages from the customer's own job history, plus schema.", tier: "operator" },
    { id: "K8", kind: "skill", name: "teardown-audit", what: "Claude Code skill: pull a prospect's site, GBP, ads and response time into one score.", tier: "associate" },
    { id: "K9", kind: "skill", name: "review-engine", what: "Claude Code skill: wire their job system's close-out webhook to the review ask.", tier: "operator" },
    { id: "K10", kind: "recipe", name: "franchise-launch", what: "The recipe that stands up a new partner: tenant, walls, kit, first three customers.", tier: "founding" },
  ];
  const PARTNERS = [
    { id: "P1", name: "Williamson Digital", op: "Ken Williamson", role: "Owner",
      phone: "+1 970 555 0144", email: "ken@williamsondigital.com", thread: "L8",
      city: "Montrose, CO", territory: "Montrose + Delta County, CO", tier: "founding",
      status: "live", since: "Mar 2026", customers: 6, mrr: 19400, certified: ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9"],
      lastPay: "Aug 1 · $3,492", note: "First partner. Took the model before it had a name and now runs the biggest book outside ours." },
    { id: "P2", name: "Cascade Range Digital", op: "Dana Moreau", role: "Founder",
      phone: "+1 541 555 0188", email: "dana@cascaderange.co", thread: null,
      city: "Bend, OR", territory: "Bend + Redmond, OR", tier: "operator",
      status: "live", since: "May 2026", customers: 4, mrr: 12800, certified: ["K1", "K2", "K3", "K4", "K5", "K8"],
      lastPay: "Aug 1 · $2,486", note: "Strong closer, thin on delivery. Has not shipped a receptionist yet." },
    { id: "P3", name: "Dudley & Co", op: "Cal Dudley", role: "Ops",
      phone: "+1 530 555 7701", email: "cal@dudleyco.com", thread: null,
      city: "Tehama County, CA", territory: "pending — overlaps ours", tier: "associate",
      status: "onboarding", since: "Aug 2026", customers: 1, mrr: 2400, certified: ["K1", "K3"],
      lastPay: "—", note: "Territory request overlaps Red Bluff, which is ours. Has to move the boundary or take Glenn County." },
    { id: "P4", name: "Gulf Coast Wrangler", op: "Marisol Vega", role: "Owner",
      phone: "+1 251 555 0132", email: "marisol@gulfcoastwrangler.com", thread: null,
      city: "Mobile, AL", territory: "Mobile + Baldwin County, AL", tier: "operator",
      status: "applied", since: "—", customers: 0, mrr: 0, certified: [],
      lastPay: "—", note: "Ran a two-person shop for nine years. Wants the recipes, not the training wheels." },
    { id: "P5", name: "High Desert Systems", op: "Ryan Alcott", role: "Owner",
      phone: "+1 775 555 0179", email: "ryan@highdesertsys.com", thread: null,
      city: "Reno, NV", territory: "Washoe County, NV", tier: "associate",
      status: "paused", since: "Jan 2026", customers: 2, mrr: 4200, certified: ["K1", "K2", "K3"],
      lastPay: "Jun 1 · $336", note: "Two months behind on royalty. Kit access is frozen, his customers are not — they still get served." },
  ];
  const JOBS = [
    { id: "J1", cust: "apex", title: "Next.js rebuild — 41 routes off Wix", status: "working", spent: 6.4, budget: 20,
      owner: "U1", gate: "AP2", change: "C1",
      agent: "apex-builder", model: "claude-opus", started: "6:12a", repo: "apex-roofing/site", branch: "agent/rebuild",
      preview: "apex-rebuild.vercel.app", risk: "Preview only. Production is a separate approval.",
      scope: "Site rebuild · click-to-call · form → dialer",
      goal: "Get them off a 2018 Wix page onto something that loads in under a second on a phone and puts the phone number where a thumb already is.",
      steps: [
        { k: "tool", t: "read apex-roofing/site — 41 routes, Wix export, no build step" },
        { k: "think", t: "Mobile LCP is 4.8s and the phone number is below the fold on every route. That is the whole conversion problem." },
        { k: "tool", t: "write app/(marketing)/[service]/page.tsx — one template, 41 routes generated" },
        { k: "tool", t: "write app/api/lead/route.ts — form posts straight onto the power-dial list" },
        { k: "think", t: "LCP 4.8s → 0.9s on a throttled phone. Call bar is sticky now." },
        { k: "gate", t: "Waiting on you: promote to production." },
      ],
      files: [["app/(marketing)/[service]/page.tsx", "+186 −0"], ["app/api/lead/route.ts", "+41 −0"], ["components/CallBar.tsx", "+28 −4"], ["app/layout.tsx", "+3 −5"]] },
    { id: "J2", cust: "cascade", title: "AI receptionist + 60s response SLA", status: "blocked", spent: 3.1, budget: 10,
      owner: "U2", gate: "AP1", change: "C3",
      agent: "cascade-ops", model: "claude-opus", started: "5:48a", repo: "cascade-hvac/site", branch: "agent/receptionist",
      preview: null, risk: "The first live send is irreversible once it leaves Twilio.",
      scope: "AI receptionist · missed-call SMS · after-hours routing",
      goal: "Answer every inbound in under sixty seconds, nights included, without texting anyone who never opted in.",
      steps: [
        { k: "tool", t: "twilio: provision +1 530 555 0164 — Cascade only, not shared" },
        { k: "tool", t: "twilio: A2P 10DLC brand + campaign registered" },
        { k: "tool", t: "write workflows/missed-call.ts — webhook → SMS in 20s → dial queue" },
        { k: "think", t: "Opt-in list is 46 of 380 contacts. The other 334 are not textable and I am not going to pretend otherwise." },
        { k: "gate", t: "Paused — needs your OK before it answers live traffic." },
      ],
      files: [["workflows/missed-call.ts", "+94 −0"], ["config/twilio.json", "+12 −2"]] },
    { id: "J3", cust: "ironclad", title: "Review engine wired to their invoicing", status: "thinking", spent: 1.2, budget: 10,
      owner: "U2", gate: null, change: null,
      agent: "ironclad-growth", model: "claude-opus", started: "7:31a", repo: "ironclad-plumbing/site", branch: "agent/reviews",
      preview: null, risk: "Read-only so far. Nothing sends.",
      scope: "Housecall Pro webhook · review ask · GBP posting",
      goal: "Fire the review ask off a real close-out event in their system instead of a person remembering to do it.",
      steps: [
        { k: "tool", t: "read Housecall Pro webhook schema — job.closed carries the invoice id" },
        { k: "think", t: "Median gap between close-out and payment is 38 hours. The ask should fire at +48, not on a cron." },
      ],
      files: [] },
    { id: "J4", cust: "valley", title: "Local SEO program — 9 service-area pages", status: "done", spent: 4.8, budget: 12,
      owner: "U3", gate: null, change: "C2",
      agent: "valley-local", model: "claude-opus", started: "yesterday 4:02p", repo: "valley-pest/site", branch: "agent/service-areas",
      preview: "valleypest.com", risk: "Shipped. Rollback is one click on Changes.",
      scope: "Service-area pages · schema · GBP sync",
      goal: "Nine real service-area pages built from their own job history, so they rank in the towns they actually serve.",
      steps: [
        { k: "tool", t: "generate 9 service-area routes from their own job history" },
        { k: "tool", t: "write LocalBusiness + Service schema per route" },
        { k: "done", t: "Merged and live. Share of search 19% → 22%." },
      ],
      files: [["app/areas/[city]/page.tsx", "+240 −0"], ["content/areas.json", "+118 −0"]] },
    { id: "J5", cust: "ridge", title: "Paid search program — $40/day", status: "blocked", spent: 0.8, budget: 6,
      owner: "U3", gate: "AP3", change: null,
      agent: "zernio-buyer", model: "claude-opus", started: "7:02a", repo: "ridgeline-electric/site", branch: "—",
      preview: null, risk: "Nothing spends until you approve the daily cap.",
      scope: "Search program · calls-only after 6pm · $40/day",
      goal: "Point paid traffic at the new site now that there is something worth landing on.",
      steps: [
        { k: "tool", t: "zernio: draft Search campaign — Corning +20mi, EV panel intent" },
        { k: "think", t: "Their site converts at 4.4% in preview. Below $70 CPL this pays back in one job." },
        { k: "gate", t: "Waiting on you: approve $40/day." },
      ],
      files: [] },
    { id: "J6", cust: "ridge", title: "Service-area pages — first pass", status: "rolled_back", spent: 2.2, budget: 12,
      owner: null, gate: null, change: "C4",
      agent: "ridge-local", model: "claude-opus", started: "Mon 9:40a", repo: "ridgeline-electric/site", branch: "agent/areas",
      preview: null, risk: "Already rolled back. Nothing of it is live.",
      scope: "Service-area pages · schema",
      goal: "Same build as Valley, pointed at Ridgeline's real service list — which is what went wrong the first time.",
      steps: [
        { k: "tool", t: "generate area pages from the content source" },
        { k: "think", t: "Content source was the Corning branch sheet, not the area list." },
        { k: "done", t: "Rolled back by you. Unclaimed — needs someone to point it at the right source and run it again." },
      ],
      files: [["app/areas/[city]/page.tsx", "+140 −74"]] },
  ];
  const APPROVALS = [
    { id: "AP1", cust: "cascade", job: "J2", title: "Turn the AI receptionist on for live traffic", asked: "12m ago", by: "cascade-ops",
      what: "Point Cascade's number at the receptionist and send the one-time notice to 46 opted-in contacts that the after-hours line is live.",
      blast: "46 phones · Twilio A2P 10DLC · Cascade's DID only", cost: "$1.84 Twilio", irreversible: true, status: "open",
      why: "They are paying us for a phone that answers at night. This is the switch that makes it true.",
      guard: "The other 334 contacts never opted in. They are not in this send and the agent cannot add them." },
    { id: "AP2", cust: "apex", job: "J1", title: "Promote the rebuilt site to production", asked: "26m ago", by: "apex-builder",
      what: "Merge agent/rebuild into main on apex-roofing/site and deploy to Apex's own Vercel project.",
      blast: "apex-roofing/site · Apex's Vercel token · 1 project", cost: "$0", irreversible: false, status: "open",
      why: "Preview converts at 6.1% against 2.3% on the Wix page, and loads five seconds faster on a phone.",
      guard: "Deploys with Apex's token to Apex's project id. It cannot touch Cascade's." },
    { id: "AP3", cust: "ridge", job: "J5", title: "Zernio: start the paid program at $40/day", asked: "1h ago", by: "zernio-buyer",
      what: "Turn on the search program we scoped for Ridgeline: $40/day cap, their radius, calls-only after 6pm.",
      blast: "Ridgeline's Zernio account · $1,200/mo ceiling", cost: "$40/day", irreversible: false, status: "open",
      why: "Ridgeline is rank #6 with zero paid coverage. The new site has nothing pointed at it.",
      guard: "Spend is capped in Zernio, billed to Ridgeline, and pauses itself if cost per lead passes $70." },
    { id: "AP4", cust: "ironclad", job: null, title: "Bind repo ironclad-plumbing/site", asked: "yesterday", by: "you",
      what: "Bind the repo to Ironclad Plumbing so its agent can read and write it.",
      blast: "1 repo · 1 customer · permanent until unbound", cost: "$0", irreversible: false, status: "approved",
      why: "The review engine needs write access to ship the ask page.",
      guard: "The database refuses a second customer on the same repo. One resource, one customer." },
  ];
  const CHANGES = [
    { id: "C1", job: "J1", cust: "apex", title: "Next.js rebuild — 41 routes", repo: "apex-roofing/site", branch: "agent/rebuild",
      state: "preview", when: "18m ago", by: "apex-builder", add: 258, del: 9, preview: "apex-rebuild.vercel.app",
      note: "Preview converts at 6.1% vs 2.3%, and mobile LCP went 4.8s → 0.9s. Waiting on your promote.",
      files: [["app/(marketing)/[service]/page.tsx", "+186 −0"], ["app/api/lead/route.ts", "+41 −0"], ["components/CallBar.tsx", "+28 −4"], ["app/layout.tsx", "+3 −5"]] },
    { id: "C2", job: "J4", cust: "valley", title: "Nine service-area pages + schema", repo: "valley-pest/site", branch: "agent/service-areas",
      state: "live", when: "yesterday 5:40p", by: "valley-local", add: 358, del: 0, preview: "valleypest.com",
      note: "Live. Share of search 19% → 22% in nine days.",
      files: [["app/areas/[city]/page.tsx", "+240 −0"], ["content/areas.json", "+118 −0"]] },
    { id: "C3", job: "J2", cust: "cascade", title: "Missed-call → SMS workflow", repo: "cascade-hvac/site", branch: "agent/receptionist",
      state: "blocked", when: "2h ago", by: "cascade-ops", add: 106, del: 2, preview: null,
      note: "Code is ready. Going live is gated on Needs you.",
      files: [["workflows/missed-call.ts", "+94 −0"], ["config/twilio.json", "+12 −2"]] },
    { id: "C4", job: "J6", cust: "ridge", title: "Service-area pages — first pass", repo: "ridgeline-electric/site", branch: "agent/areas",
      state: "rolled_back", when: "Mon 11:20a", by: "ridge-local", add: 140, del: 74, preview: null,
      note: "Rolled back — the agent wrote Corning hours onto the Red Bluff page. Content source was wrong, not the template.",
      files: [["app/areas/[city]/page.tsx", "+140 −74"]] },
  ];
  const PLAYBOOKS = [
    { id: "PB1", name: "Rebuild in 10", live: ["apex", "ridge"], runs: 7, trigger: "Signed customer on a dead site",
      blurb: "Our delivery playbook. Ten days from kickoff to a production site we are not embarrassed by.",
      steps: ["Bind their repo and their Vercel token — one customer, one project",
              "Pull the old site, their photos, and their real service list",
              "Generate the route template, then every service and area page from it",
              "Wire the form to the dialer and put the call bar above the fold",
              "Ship to preview, get the promote approval, then hand them the login"] },
    { id: "PB2", name: "Response SLA install", live: ["cascade", "apex", "ironclad"], runs: 61, trigger: "Customer buys the AI receptionist",
      blurb: "The product they actually feel: nothing inbound waits more than sixty seconds.",
      steps: ["Provision a DID for this customer only and register A2P",
              "Missed-call webhook fires on their own number",
              "SMS goes out in under 20 seconds from their number, not ours",
              "Lead lands on the power-dial board, hottest first",
              "Anything the AI cannot answer escalates to a human with the transcript"] },
    { id: "PB3", name: "Review engine", live: ["ironclad", "valley"], runs: 28, trigger: "Customer's job system fires job.closed",
      blurb: "Wire the ask to a real event in their software instead of a person remembering.",
      steps: ["Integrate their job system's webhook — Housecall, ServiceTitan, Jobber",
              "Wait 48 hours after close-out, not a fixed cron",
              "SMS the ask with a one-tap link from their number",
              "Post the five-star to their GBP through Zernio",
              "Route anything under four stars to the owner, never public"] },
    { id: "PB4", name: "Franchise launch", live: [], runs: 5, trigger: "A partner signs the license",
      blurb: "How a new agency goes from signature to their first three customers under our name.",
      steps: ["Check the territory against every existing partner — overlap is refused, not negotiated",
              "Stand up their own Wrangler tenant, walls up, empty",
              "Grant the kit their tier pays for — brand, playbooks, recipes, skills",
              "Certify the operator on Teardown close before they are allowed to sell",
              "Ride along on their first three closes, then get out of the way"] },
    { id: "PB5", name: "Teardown close", live: ["apex", "cascade"], runs: 19, trigger: "Prospect books a demo",
      blurb: "Our sales motion. Show them their own broken funnel on screen. Never open a deck.",
      steps: ["Pull their site, GBP, ads, and response time into one screen",
              "Score the five holes against whoever is beating them locally",
              "Show a customer's live build as the fix, not a slide",
              "Send the recording and the scope inside an hour",
              "Nudge at day two if the proposal has not moved"] },
  ];
  const MCP_TOOLS = [
    ["list_jobs", "see the board, filtered to the customers you are scoped to"],
    ["claim_job", "take a job so nobody else picks it up"],
    ["read_bound_repo", "read a repo bound to that job's customer — nothing else"],
    ["open_branch", "write a branch and open a preview"],
    ["post_step", "stream what you are doing back onto the floor"],
    ["request_approval", "stop at the wall and ask a human"],
    ["release_job", "put it back on the board"],
  ];
  const PEOPLE = [
    { id: "U1", name: "You", handle: "derik", role: "Operator", approver: true,
      machine: "MacBook Pro · Red Bluff", status: "connected", version: "claude-code 2.4.1", since: "6:02a",
      token: "wr_sess_7f21c8ea", scope: ["apex", "cascade", "ironclad", "ridge", "valley"],
      tools: ["list_jobs", "claim_job", "read_bound_repo", "open_branch", "post_step", "request_approval", "release_job"] },
    { id: "U2", name: "Marisol Vega", handle: "marisol", role: "Build wrangler", approver: false,
      machine: "MacBook Air · Mobile, AL", status: "connected", version: "claude-code 2.4.1", since: "5:48a",
      token: "wr_sess_b19c44d2", scope: ["cascade", "ironclad"],
      tools: ["list_jobs", "claim_job", "read_bound_repo", "open_branch", "post_step", "request_approval"] },
    { id: "U3", name: "Theo Ruiz", handle: "theo", role: "Local + ads", approver: false,
      machine: "ThinkPad · Chico", status: "idle", version: "claude-code 2.3.9", since: "yesterday 6:40p",
      token: "wr_sess_c882a04f", scope: ["valley", "ridge"],
      tools: ["list_jobs", "claim_job", "read_bound_repo", "post_step", "request_approval"] },
    { id: "U4", name: "Priya Nandan", handle: "priya", role: "Build wrangler", approver: false,
      machine: "not connected yet", status: "invited", version: "—", since: "—",
      token: "wr_sess_4d10be77", scope: ["apex"],
      tools: ["list_jobs", "claim_job", "read_bound_repo", "post_step"] },
  ];
  const person = (id) => PEOPLE.find((x) => x.id === id);
  const TEAM = [
    { id: "TM2", name: "apex-builder", kind: "ai", session: "U1", role: "Site builder", where: "sandbox · apex-roofing/site", status: "working",
      scope: "Apex Roofing only. Cannot see another customer's repo or token.", tools: ["github", "vercel"], jobs: 1 },
    { id: "TM3", name: "cascade-ops", kind: "ai", session: "U2", role: "Phone + SMS systems", where: "sandbox · Cascade DID", status: "blocked",
      scope: "Cascade HVAC only. Sends nothing without an approval.", tools: ["twilio"], jobs: 1 },
    { id: "TM4", name: "ironclad-growth", kind: "ai", session: "U2", role: "Integrations + local", where: "sandbox · ironclad-plumbing/site", status: "thinking",
      scope: "Ironclad Plumbing only. Read-only until it has something to ship.", tools: ["github", "zernio"], jobs: 1 },
    { id: "TM5", name: "valley-local", kind: "ai", session: "U3", role: "Local + content", where: "sandbox · valley-pest/site", status: "idle",
      scope: "Valley Pest only.", tools: ["github", "zernio"], jobs: 0 },
    { id: "TM6", name: "zernio-buyer", kind: "ai", session: "U3", role: "Media buyer", where: "Zernio API · per-customer accounts", status: "blocked",
      scope: "One ad account per customer. Budgets capped per customer.", tools: ["zernio"], jobs: 1 },
  ];
  const MEM = [
    { id: "M1", scope: "apex", kind: "voice", t: "Maya signs everything “Maya @ Apex.” Never “Team Apex.”" },
    { id: "M2", scope: "apex", kind: "fact", t: "They are on Wix with no build step. Any change ships as a full route rewrite, not a patch." },
    { id: "M3", scope: "apex", kind: "rule", t: "Do not touch their GBP listing without Maya. She has been burned by an agency before." },
    { id: "M4", scope: "cascade", kind: "rule", t: "Do not text anyone who did not opt in. 46 of 380 are textable. That number is the ceiling." },
    { id: "M5", scope: "cascade", kind: "fact", t: "Dev signs the invoices. Lisa runs the CSRs and decides whether the receptionist stays on." },
    { id: "M6", scope: "ironclad", kind: "voice", t: "Plain talk. No exclamation marks — they think it reads like a scam." },
    { id: "M7", scope: "ironclad", kind: "fact", t: "Housecall Pro is the system of record. Anything we build reads from it, never the other way." },
    { id: "M8", scope: "agency", kind: "rule", t: "Never quote a retainer on the first call. Book the twenty-minute teardown." },
    { id: "M9", scope: "agency", kind: "rule", t: "Production deploys and first live sends are always two clicks. Never one." },
    { id: "M10", scope: "agency", kind: "voice", t: "We sell the machine, not a website. Lead with what it caught, not what it looks like." },
  ];
  const SPEND = [
    { k: "AI jobs (Claude)", amt: 128.4, note: "4 agents · capped per job", pass: false },
    { k: "Twilio", amt: 410, note: "voice + SMS across 5 DIDs", pass: false },
    { k: "GitHub", amt: 21, note: "agency org, one account", pass: false },
    { k: "Vercel", amt: 0, note: "their tokens, their invoices", pass: false },
    { k: "Zernio ad spend", amt: 5120, note: "pass-through, billed to the customer", pass: true },
  ];
  const BINDINGS = [
    { repo: "apex-roofing/site", cust: "apex", when: "Aug 4" },
    { repo: "cascade-hvac/site", cust: "cascade", when: "Aug 9" },
    { repo: "ironclad-plumbing/site", cust: "ironclad", when: "Aug 21" },
    { repo: "valley-pest/site", cust: "valley", when: "Jul 28" },
    { repo: "ridgeline-electric/site", cust: "ridge", when: "Aug 14" },
  ];
  const VAULT = [
    { cust: "apex", token: true, project: "prj_apex_site_7f21", team: "Apex Roofing", added: "Aug 4" },
    { cust: "cascade", token: true, project: "prj_cascade_web_a19c", team: "Cascade HVAC", added: "Aug 9" },
    { cust: "ironclad", token: true, project: "prj_ironclad_3b04", team: "Ironclad Plumbing", added: "Aug 21" },
    { cust: "valley", token: true, project: "prj_valleypest_c882", team: "Valley Pest", added: "Jul 28" },
    { cust: "ridge", token: false, project: null, team: null, added: null },
  ];
  const INBOX = [
    { id: "I1", from: "Maya @ Apex", via: "sms", text: "Can the receptionist text a new lead in under a minute?", task: "Turn on the 60s response SLA" },
    { id: "I2", from: "Dev @ Cascade", via: "email", text: "We're losing after-hours calls to the big guys.", task: "Night receptionist + Twilio overflow" },
  ];
  const TEMPLATES = [
    { id: "T1", name: "Book the teardown", body: "Hey {name} — Wrangler here. Got your note about {job}. Got 20 min this week for a teardown of the current site + ads?" },
    { id: "T2", name: "Apex proof", body: "{name} — this is the site and lead machine we shipped for Apex in Red Bluff. Same build, your market. {link}" },
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
    lead: null,
    sms: "L1",
    tab: "overview",
    custId: "apex",
    prospect: "R1",
    partner: null,
    call: null,
    muted: false,
    power: false,
    toast: null,
    filter: "all",
    filterStage: "all",
    leadView: "list",
    leadSort: "score",
    leadQ: "",
    custSort: "mrr",
    custQ: "",
    custTrade: "all",
    prospView: "list",
    prospSort: "value",
    prospQ: "",
    partSort: "sent",
    partQ: "",
    launch: false,
    menu: false,
    jump: false,
    chan: "all",
    job: "J1",
    jobFilter: null,
    who: "U1",
    pb: "PB1",
    memScope: "agency",
    memQ: "",
    billId: "apex",
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
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };
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
  const isPhone = () => window.matchMedia("(max-width: 860px)").matches;
  const ALIAS = { sms: "inbox", approvals: "work", changes: "work", wrangler: "sessions", team: "sessions" };
  const go = (page) => {
    state.menu = false;
    if (ALIAS[page]) { if (page === "approvals") state.jobFilter = "gate"; if (page === "changes") state.tab = "diff"; page = ALIAS[page]; }
    if (page === "pipeline") { page = "leads"; state.leadView = "kanban"; }
    state.page = page;
    state.tab = "overview";
    location.hash = "#/" + page;
    render();
  };
  const jobLeads = () => LEADS.filter((l) => l.kind !== "partner");
  const filterLeads = () => {
    let rows = jobLeads();
    if (state.filter !== "all") rows = rows.filter((l) => l.trade === state.filter);
    if (state.filterStage !== "all") rows = rows.filter((l) => String(l.stage) === state.filterStage);
    const q = (state.leadQ || "").toLowerCase();
    if (q) rows = rows.filter((l) => (l.company + " " + l.name + " " + l.city + " " + l.note + " " + l.src).toLowerCase().includes(q));
    const s = state.leadSort || "score";
    rows = rows.slice().sort((a, b) => {
      if (s === "company") return (a.company || "").localeCompare(b.company || "");
      if (s === "value") return (b.value || 0) - (a.value || 0);
      if (s === "sla") return (b.sla || 0) - (a.sla || 0);
      if (s === "stage") return a.stage - b.stage;
      return b.score - a.score;
    });
    return rows;
  };
  function leadToolbar() {
    const trades = [...new Set(jobLeads().map((l) => l.trade))];
    return `<div class="statline">
      <button class="btn tiny ${state.leadView === "list" ? "brand" : ""}" data-act="view" data-id="list">List</button>
      <button class="btn tiny ${state.leadView === "kanban" ? "brand" : ""}" data-act="view" data-id="kanban">Kanban</button>
      <input data-act="lead-q" placeholder="Search companies, owners, pain…" value="${esc(state.leadQ || "")}">
      <select data-act="filter">${[["all", "All trades"], ...trades.map((t) => [t, t])].map(([v, n]) => `<option value="${v}" ${state.filter === v ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
      <select data-act="filter-stage">${[["all", "All stages"], ...STAGES.map((n, i) => [String(i), n])].map(([v, n]) => `<option value="${v}" ${state.filterStage === v ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
      <select data-act="sort">${[["score", "Sort: score"], ["value", "Sort: retainer"], ["sla", "Sort: SLA"], ["company", "Sort: name"], ["stage", "Sort: stage"]].map(([v, n]) => `<option value="${v}" ${state.leadSort === v ? "selected" : ""}>${n}</option>`).join("")}</select>
    </div>`;
  }
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
    const pending = id === "work" ? openGates().length : id === "inbox" ? threads().filter((t) => t.unread).length : 0;
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
            <h3>${esc(greeting())}. Five customers. One desk.</h3>
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
                ["Partner", "brand", "Williamson Digital closed their sixth shop in Montrose."],
              ].map((x) => `<div class="row"><span class="pill ${x[1]}">${x[0]}</span><div style="flex:1;font-size:12.5px">${x[2]}</div></div>`).join("")}
            </div>
          </div>
        </div>
      </div>`;
  }

  function pagePipeline() { state.leadView = "kanban"; return pageLeads(); }

  function pageLeads() {
    const rows = filterLeads();
    const sel = state.lead ? lead(state.lead) : null;
    const l = sel && sel.kind !== "partner" ? sel : null;
    if (!rows.length && !l) return `<div class="page">${leadToolbar()}<div class="pad" style="color:var(--muted)">No leads match that filter.</div></div>`;
    const x = l ? ld(l) : null;
    const tab = state.tab || "overview";
    const tabs = [["overview", "Overview"], ["discovery", "Discovery"], ["scope", "Scope"], ["comms", "Comms"], ["tasks", "Tasks"], ["money", "Money"], ["files", "Files"], ["source", "Source"]];
    const talk = l ? SCRIPT.replace("{name}", l.name.split(" ")[0]).replace("{company}", leadCo(l)).replace("{job}", l.note) : "";
    let body = "";
    if (l) {
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
      ["Not in scope", "Their own customer jobs. That lives in their software, not ours."],
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
    }
    const dossier = !l ? "" : `
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
          <button class="btn tiny" data-act="close-lead" style="margin-left:auto">Close</button>
        </div>
        ${tabbar(tabs)}
        <div class="dbody">${body}</div>
      </div>
      ${rail(x.next, `<h5>Talk track</h5><div class="script">${esc(talk)}</div>`)}`;
    if (state.leadView === "kanban") {
      return `<div class="page">${leadToolbar()}
        <div class="board" style="flex:1;min-height:0">${STAGES.map((name, i) => {
          const cards = rows.filter((r) => r.stage === i);
          return `<div class="col"><div class="hd"><span>${name}</span><span>${cards.length}</span></div>
            <div class="stack">${cards.map((r) => `
              <div class="deal" role="button" tabindex="0" data-act="sel-lead" data-id="${r.id}" style="cursor:pointer;text-align:left;border-color:${l && r.id === l.id ? "var(--brand)" : "var(--line)"}">
                <b>${esc(r.company)}</b>
                <div class="meta"><span>${esc(r.name)} · ${esc(r.trade)}</span><span class="mono">${money(r.value)}</span></div>
                <div style="font-size:12px;color:var(--muted);margin-top:6px">${esc(r.note)}</div>
                <div class="acts">
                  <button class="btn tiny" data-act="dial" data-id="${r.id}">Call</button>
                  ${i > 0 ? `<button class="btn tiny" data-act="stage" data-id="${r.id}" data-dir="-1">‹</button>` : ""}
                  ${i < STAGES.length - 1 ? `<button class="btn tiny brand" data-act="stage" data-id="${r.id}" data-dir="1">›</button>` : ""}
                </div>
              </div>`).join("")}</div></div>`;
        }).join("")}</div>
      </div>`;
    }
    return `<div class="page">${leadToolbar()}
      <div class="desk ${l ? "wide-list" : "full-list"}">
        <div class="roll" style="width:auto">
          <table class="grid">
            <thead><tr><th>Company</th><th>Owner</th><th>Trade</th><th>Stage</th><th>Retainer</th><th>Score</th></tr></thead>
            <tbody>${rows.map((r) => `<tr role="button" tabindex="0" data-act="sel-lead" data-id="${r.id}" style="cursor:pointer;background:${l && r.id === l.id ? "var(--brand-dim)" : "transparent"}">
              <td data-l="Company"><b>${esc(r.company)}</b></td><td data-l="Owner">${esc(r.name)}</td><td data-l="Trade">${esc(r.trade)}</td>
              <td data-l="Stage">${esc(STAGES[r.stage])}</td><td data-l="Retainer" class="mono">${money(r.value)}</td><td data-l="Score" class="mono">${r.score}</td>
            </tr>`).join("") || `<tr><td colspan="6" style="color:var(--muted)">No leads match that filter.</td></tr>`}</tbody>
          </table>
        </div>
        ${dossier}
      </div>
    </div>`;
  }

  function pageDialer() {
    const queue = LEADS.filter((l) => l.kind === "lead");
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

  const PART_PILL = { live: "go", onboarding: "wait", applied: "info", paused: "stop" };
  const kitFor = (tier) => KIT.filter((k) => k.tier === "associate" || (tier !== "associate" && k.tier === "operator") || (tier === "founding" && k.tier === "founding"));

  function pagePartners() {
    const sel = state.partner ? PARTNERS.find((x) => x.id === state.partner) : null;
    const p = sel || null;
    let plist = PARTNERS.slice();
    const pq = (state.partQ || "").toLowerCase();
    if (pq) plist = plist.filter((r) => (r.name + r.op + r.city + r.territory + r.status).toLowerCase().includes(pq));
    if (state.partSort === "customers") plist.sort((a, b) => b.customers - a.customers);
    else if (state.partSort === "name") plist.sort((a, b) => a.name.localeCompare(b.name));
    else if (state.partSort === "status") plist.sort((a, b) => a.status.localeCompare(b.status));
    else plist.sort((a, b) => b.mrr - a.mrr);

    const live = PARTNERS.filter((r) => r.status === "live");
    const network = PARTNERS.reduce((a, r) => a + r.mrr, 0);
    const royalty = PARTNERS.reduce((a, r) => a + (r.status === "live" ? Math.round(r.mrr * TIERS[r.tier].royalty / 100) + TIERS[r.tier].fee : 0), 0);
    const shops = PARTNERS.reduce((a, r) => a + r.customers, 0);

    const roll = `<div class="roll">${plist.map((r) => `<button class="item ${p && r.id === p.id ? "on" : ""}" data-act="sel-partner" data-id="${r.id}">
      <div class="t">${esc(r.name)} <span class="pill ${PART_PILL[r.status]}">${esc(r.status)}</span></div>
      <div class="m">${esc(r.op)} · ${esc(r.city)}</div>
      <div class="m mono">${r.customers} shops · ${money(r.mrr)}/mo · ${esc(TIERS[r.tier].name)}</div>
    </button>`).join("") || `<div class="pad" style="color:var(--muted)">No partners match that.</div>`}</div>`;

    const stats = `<div class="kpis">
      ${kpi("Partners live", live.length, PARTNERS.length + " in the network")}
      ${kpi("Their book", money(network), shops + " shops under our name")}
      ${kpi("Royalty + fees", money(royalty), "per month, collected")}
      ${kpi("Territories", live.length + PARTNERS.filter((r) => r.status === "onboarding").length, "one market, one partner", "up")}
    </div>`;

    const bar2 = `<div class="statline">
      <input data-act="part-q" placeholder="Search partners, operators, territories…" value="${esc(state.partQ || "")}">
      <select data-act="part-sort">${[["mrr", "Sort: their book"], ["customers", "Sort: shops"], ["status", "Sort: status"], ["name", "Sort: name"]].map(([v, n]) => `<option value="${v}" ${state.partSort === v ? "selected" : ""}>${n}</option>`).join("")}</select>
    </div>`;

    if (!p) {
      return `<div class="page">${stats}${bar2}
        <div class="desk full-list">${roll}</div>
      </div>`;
    }

    const t = TIERS[p.tier];
    const granted = KIT.filter((k) => p.certified.indexOf(k.id) >= 0);
    const owed = kitFor(p.tier).filter((k) => p.certified.indexOf(k.id) < 0);
    const take = Math.round(p.mrr * t.royalty / 100) + t.fee;
    const tab = state.tab || "overview";
    let body = "";
    if (tab === "overview") body = kv([
      ["Operator", `<b>${esc(p.op)}</b> · ${esc(p.role)}`],
      ["Territory", esc(p.territory)],
      ["Tier", `${esc(t.name)} · ${t.fee ? money(t.fee) + "/mo + " : ""}${t.royalty}% of collected`],
      ["Status", `<span class="pill ${PART_PILL[p.status]}">${esc(p.status)}</span>`],
      ["Signed", esc(p.since)],
      ["Their book", `${p.customers} shops · ${money(p.mrr)}/mo`],
      ["We collect", `${money(take)}/mo`],
      ["Phone", `<span class="mono">${esc(p.phone)}</span>`],
      ["Email", esc(p.email)],
    ]) + `<div class="sec" style="margin-top:18px"><h5>Read</h5>
      <div style="font-size:13.5px;line-height:1.55;color:var(--ink,var(--text))">${esc(p.note)}</div></div>`;

    if (tab === "territory") body = `<div class="sec"><h5>What they own</h5>
      ${kv([["Market", esc(p.territory)], ["Exclusive", t.exclusive ? "Yes — nobody else sells here under our name" : "No — Associate tier shares the market"], ["Base", esc(p.city)]])}
      </div>
      <div class="sec"><h5>Every territory in the network</h5>
        ${PARTNERS.filter((r) => r.territory !== "—").map((r) => `<div class="file"><span>${esc(r.territory)}</span><span class="pill ${r.id === p.id ? "brand" : r.territory.indexOf("overlaps") >= 0 ? "stop" : ""}">${esc(r.name)}</span></div>`).join("")}
        <div class="file"><span>Red Bluff · Redding · Chico · Corning, CA</span><span class="pill go">us</span></div>
      </div>
      <p style="color:var(--muted);font-size:12.5px">A territory is bound the same way a repo is: one market, one partner, refused at the database rather than argued about on a call.</p>`;

    if (tab === "kit") body = `<div class="sec"><h5>Granted — they can run these today</h5>
      ${granted.map((k) => `<div class="file"><span><span class="pill ${k.kind === "recipe" ? "brand" : k.kind === "skill" ? "info" : k.kind === "playbook" ? "go" : ""}" style="margin-right:8px">${esc(k.kind)}</span>${esc(k.name)}<div style="color:var(--muted);font-size:12px;margin-top:3px">${esc(k.what)}</div></span><span class="pill go">certified</span></div>`).join("") || `<div style="color:var(--muted)">Nothing granted yet.</div>`}
      </div>
      ${owed.length ? `<div class="sec"><h5>Their tier pays for these — not certified yet</h5>
        ${owed.map((k) => `<div class="file"><span><span class="pill" style="margin-right:8px">${esc(k.kind)}</span>${esc(k.name)}</span><button class="btn tiny brand" data-act="certify" data-id="${p.id}" data-kit="${k.id}">Certify</button></div>`).join("")}
      </div>` : ""}
      <p style="color:var(--muted);font-size:12.5px">Recipes and skills are the actual product. A partner who has the brand but not the recipes is a logo; a partner with the recipes ships the same build we do.</p>`;

    if (tab === "book") body = `<div class="sec"><h5>What they run</h5>
      ${kv([["Shops", p.customers], ["Their retainers", money(p.mrr) + "/mo"], ["Average", p.customers ? money(Math.round(p.mrr / p.customers)) + "/mo" : "—"]])}
      </div>
      <div class="sec"><h5>What we can see</h5>
        <div style="font-size:13px;line-height:1.6;color:var(--muted)">These four numbers and nothing else. Their customers, threads, repos and tokens live in their own tenant. We cannot open a partner's customer record any more than one customer can open another's — it is the same wall, one level up.</div>
      </div>`;

    if (tab === "money") body = kv([
      ["Licence fee", t.fee ? money(t.fee) + "/mo" : "none — founding partner"],
      ["Royalty", t.royalty + "% of collected, not of billed"],
      ["This month", money(take)],
      ["Last payment", esc(p.lastPay)],
      ["Ad spend", "never ours — their customers, their cards"],
    ]) + `<div class="sec" style="margin-top:18px"><h5>Why a share and not a markup</h5>
      <div style="font-size:13px;line-height:1.6;color:var(--muted)">A markup on tools makes us a reseller they will route around the moment they can. A share of what they collect means we only make money when they do, and it is the reason the recipes keep getting handed over instead of held back.</div></div>`;

    if (tab === "walls") body = kv([
      ["Their tenant", `<span class="mono">${esc(p.id.toLowerCase())}.wrangler</span> · isolated`],
      ["Their GitHub", "their org, their tokens — never ours"],
      ["Their Twilio", "their numbers, their A2P brand"],
      ["Can they see us", "No"],
      ["Can we see them", "Aggregate only — shops, book, royalty"],
      ["Can partners see each other", "No"],
    ]) + `<p style="color:var(--muted);font-size:12.5px;margin-top:12px">If a partner leaves, they keep their customers and we revoke the kit. Nothing to unwind, nothing held hostage. That is deliberate — the model has to survive somebody quitting or nobody serious will sign.</p>`;

    if (tab === "history") body = history([
      { when: p.since, who: "signed", cls: "brand", text: p.name + " licensed " + p.territory },
      { when: "onboard", who: "walls", cls: "go", text: "Own tenant provisioned, isolated from ours and every other partner" },
      { when: "kit", who: "grant", cls: "info", text: granted.length + " of " + kitFor(p.tier).length + " kit items certified" },
      { when: "now", who: p.status, cls: PART_PILL[p.status], text: p.note },
    ]);

    const next = p.status === "applied"
      ? { title: "Decide on " + p.op.split(" ")[0], why: "Territory is clear. The only question is whether they can sell before we hand over the recipes.", do: "sms" }
      : p.status === "onboarding"
        ? { title: "Settle the territory before anything else", why: p.territory.indexOf("overlaps") >= 0 ? "Their request overlaps Red Bluff, which is ours. Move the boundary or offer Glenn County — do not grant it and sort it later." : "Get the boundary signed, then provision the tenant.", do: "sms" }
        : p.status === "paused"
          ? { title: "Two months behind — call, do not email", why: "Kit access is frozen and his two shops are still being served. That is the fair order, but it does not hold forever.", do: "dial" }
          : owed.length
            ? { title: "Certify " + p.op.split(" ")[0] + " on " + owed[0].name, why: "They pay for it and cannot run it. Every uncertified item is a build they hand back to us.", do: "none" }
            : { title: "Nothing owed here", why: p.name + " is current, certified, and running " + p.customers + " shops. Leave them alone.", do: "none" };

    return `<div class="page">${stats}${bar2}
      <div class="desk wide-list">
        ${roll}
        <div class="dossier">
          <div class="dh"><span class="pill ${PART_PILL[p.status]}">${esc(p.status)}</span><span class="pill brand">${esc(t.name)}</span>
            <div class="who">${esc(p.name)}</div>
            <div class="sub">${esc(p.op)} · ${esc(p.territory)}</div>
            <div class="pills"><span class="pill">${p.customers} shops</span><span class="pill mono">${money(p.mrr)}/mo book</span><span class="pill mono">${money(take)}/mo to us</span></div>
          </div>
          <div class="acts">
            <button class="btn tiny brand" data-act="dial" data-id="${p.id}">Call ${esc(p.op.split(" ")[0])}</button>
            ${p.thread ? `<button class="btn tiny" data-act="sms-open" data-id="${p.thread}">Inbox</button>` : ""}
            <button class="btn tiny" data-act="tab" data-id="kit">Kit</button>
            <button class="btn tiny" data-act="close-partner" style="margin-left:auto">Close</button>
          </div>
          ${tabbar([["overview", "Overview"], ["territory", "Territory"], ["kit", "Licensed kit"], ["book", "Their book"], ["money", "Money"], ["walls", "Walls"], ["history", "History"]])}
          <div class="dbody">${body}</div>
        </div>
        ${rail(next, `<h5>The model</h5><div style="font-size:12.5px;color:var(--muted);line-height:1.55">They bring the market and the relationships. We license the name, the playbooks, the agent recipes and the skills, and take a share of what they collect. One market, one partner.</div>`)}
      </div></div>`;
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
    if (tab === "sequence") body = ["Day 0 · Loom of the Apex rebuild", "Day 1 · Call the owner", "Day 3 · SMS the demo hold", "Day 7 · Proposal", "Day 10 · Isolation walkthrough"].map((t, i) => `<label class="check"><input type="checkbox" ${i < r.stage ? "checked" : ""} disabled><span>${esc(t)}</span></label>`).join("");
    if (tab === "deal") body = kv([["MRR", money(r.value)], ["Onboarding", "Rebuild in 10 + DID + Zernio profile"], ["Term", "12 mo"], ["Status", stages[r.stage]]]);
    if (tab === "history") body = history([{ when: "—", who: "gtm", cls: "brand", text: r.why }, { when: "now", who: "pain", cls: "wait", text: r.pain }]);
    let prow = PX.slice();
    const pqq = (state.prospQ || "").toLowerCase();
    if (pqq) prow = prow.filter((x) => (x.name + x.city + x.trade + x.pain).toLowerCase().includes(pqq));
    if (state.prospSort === "name") prow.sort((a, b) => a.name.localeCompare(b.name));
    else prow.sort((a, b) => b.value - a.value);
    const pboard = state.prospView === "kanban";
    if (pboard) {
      return `<div class="page">
        <div class="statline">
          <button class="btn tiny" data-act="pview" data-id="list">List</button>
          <button class="btn tiny brand" data-act="pview" data-id="kanban">Kanban</button>
          <input data-act="prosp-q" placeholder="Search prospects…" value="${esc(state.prospQ || "")}">
        </div>
        <div class="board">${stages.map((name, i) => {
          const cards = prow.filter((x) => x.stage === i);
          return `<div class="col"><div class="hd"><span>${name}</span><span>${cards.length}</span></div>
            <div class="stack">${cards.map((x) => `<div class="deal" role="button" tabindex="0" data-act="sel-prospect" data-id="${x.id}"><b>${esc(x.name)}</b><div class="meta"><span>${esc(x.dm)}</span><span>${money(x.value)}</span></div></div>`).join("")}</div></div>`;
        }).join("")}</div></div>`;
    }
    return `<div class="page">
      <div class="statline">
        <button class="btn tiny brand" data-act="pview" data-id="list">List</button>
        <button class="btn tiny" data-act="pview" data-id="kanban">Kanban</button>
        <input data-act="prosp-q" placeholder="Search prospects…" value="${esc(state.prospQ || "")}">
        <select data-act="prosp-sort">${[["value", "Sort: retainer"], ["name", "Sort: name"]].map(([v, n]) => `<option value="${v}" ${state.prospSort === v ? "selected" : ""}>${n}</option>`).join("")}</select>
      </div>
      <div class="desk">
      <div class="roll">${prow.map((x) => `<button class="item ${x.id === r.id ? "on" : ""}" data-act="sel-prospect" data-id="${x.id}">
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
      ${rail({ title: r.stage >= 3 ? "Kick off onboarding — repo, DID, Zernio" : "Call " + r.dm.split(" ")[0] + " about " + r.pain.split(".")[0], why: r.why, do: r.stage >= 3 ? "settings" : "dial" })}
    </div></div>`;
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
    if (tab === "funnel") body = `<div class="sec"><h5>What we build and run for them</h5>
        <p style="color:var(--muted);font-size:12.5px;margin:0 0 10px">Their own service calls live in their software. Wrangler sells them the site, the ads, the number, the AI that answers it.</p>
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
    let clist = CUST.slice();
    const cq = (state.custQ || "").toLowerCase();
    if (state.custTrade !== "all") clist = clist.filter((r) => r.trade === state.custTrade);
    if (cq) clist = clist.filter((r) => (r.name + r.city + r.trade).toLowerCase().includes(cq));
    if (state.custSort === "rank") clist.sort((a, b) => a.rank - b.rank);
    else if (state.custSort === "name") clist.sort((a, b) => a.name.localeCompare(b.name));
    else clist.sort((a, b) => b.mrr - a.mrr);
    const trades = [...new Set(CUST.map((r) => r.trade))];
    return `<div class="page">
      <div class="statline">
        <input data-act="cust-q" placeholder="Search customers…" value="${esc(state.custQ || "")}">
        <select data-act="cust-trade">${[["all", "All trades"], ...trades.map((t) => [t, t])].map(([v, n]) => `<option value="${v}" ${state.custTrade === v ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
        <select data-act="cust-sort">${[["mrr", "Sort: retainer"], ["rank", "Sort: rank"], ["name", "Sort: name"]].map(([v, n]) => `<option value="${v}" ${state.custSort === v ? "selected" : ""}>${n}</option>`).join("")}</select>
      </div>
      <div class="desk">
      <div class="roll">${clist.map((r) => `<button class="item ${r.id === c.id ? "on" : ""}" data-act="sel-cust" data-id="${r.id}">
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
    </div></div>`;
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
      <h5>This is account work, not their customer traffic</h5>
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

  const JOB_PILL = { working: "go", blocked: "stop", thinking: "info", done: "" };
  const CHG_PILL = { preview: "wait", live: "go", blocked: "stop", rolled_back: "info" };
  const CHG_WORD = { preview: "preview", live: "live", blocked: "gated", rolled_back: "rolled back" };
  const job = (id) => JOBS.find((j) => j.id === id);
  const bar2m = (used, cap) => bar(used, cap, used / cap > 0.8 ? "warn" : "");
  const bar = (used, cap, cls) => `<div class="meter"><i class="${cls || ""}" style="width:${Math.min(100, Math.round((used / cap) * 100))}%"></i></div>`;

  function pageBilling() {
    const c = cust(state.billId) || CUST[0];
    const ads = ADS.filter((a) => a.cust === c.id);
    const pass = ads.reduce((a, z) => a + z.spend, 0);
    const rev = CUST.reduce((a, x) => a + x.mrr, 0);
    const passAll = ADS.reduce((a, x) => a + x.spend, 0);
    const ourCost = SPEND.filter((r) => !r.pass).reduce((a, r) => a + r.amt, 0);
    const cost = Math.round(ourCost / CUST.length);
    const margin = Math.round(((c.mrr - cost) / c.mrr) * 100);
    const tab = state.tab || "overview";
    let body = "";
    if (tab === "overview") body = kv([
      ["Retainer", `<b>${money(c.mrr)}</b> / month · 12 mo term`],
      ["Started", "Aug 4 · month 1 of 12"],
      ["Next invoice", "Sep 1 · auto"],
      ["Method", "ACH on file"],
      ["Ad spend", `${money(pass)} passed through at cost`],
      ["Our cost to serve", `~${money(cost)} · AI, phone, hosting`],
      ["Gross margin", `<b>${margin}%</b> · before your time`],
    ]) + `<div class="sec" style="margin-top:18px"><h5>What the retainer covers</h5>
      ${["Site — hosting, changes, and the AI that ships them", "The number — Twilio DID, A2P, recordings", "The receptionist — every inbound answered in under a minute", "Local — service-area pages, schema, GBP", "One human who picks up when you call"].map((t) => `<div class="file"><span>${t}</span><span class="pill go">included</span></div>`).join("")}</div>`;
    if (tab === "passthrough") body = `<div class="sec"><h5>Billed through at cost — we do not mark this up</h5>
      ${ads.map((a) => `<div class="file"><span>${esc(a.name)} <span class="pill">${esc(a.platform)}</span></span><span class="mono">${money(a.spend)}</span></div>`).join("") || `<div style="color:var(--muted)">No ad spend this cycle.</div>`}
      <div class="file"><b>Total</b><b class="mono">${money(pass)}</b></div></div>
      <p style="color:var(--muted);font-size:12.5px">Their card, their Zernio account, their invoices. We never hold the spend.</p>`;
    if (tab === "cost") body = `<div class="sec"><h5>What this customer costs us</h5>
      ${[["AI jobs", JOBS.filter((j) => j.cust === c.id).reduce((a, j) => a + j.spent, 0).toFixed(2)], ["Twilio", "82.00"], ["Hosting", "0.00"], ["GitHub seat", "4.20"]].map((r) => `<div class="file"><span>${r[0]}</span><span class="mono">$${r[1]}</span></div>`).join("")}
      <div class="file"><span>Your time</span><span class="mono" style="color:var(--muted)">not counted below</span></div>
      <div class="file"><b>Gross margin</b><b class="mono">${margin}%</b></div></div>
      ${bar(100 - margin, 100, margin > 55 ? "" : "warn")}
      <p style="color:var(--muted);font-size:12.5px;margin-top:10px">Vercel is $0 to us because it runs on their token and their invoice. That is the isolation model paying rent. The number above is gross — it does not price your hours, and the whole point of the agents is to keep that column from growing with the customer count.</p>`;
    if (tab === "invoices") body = `<div class="sec">${[["Aug 1", c.mrr, "paid"], ["Jul 1", c.mrr, "paid"], ["Jun 1", c.mrr, "paid"]].map((r) => `<div class="file"><span>${r[0]} · retainer</span><span class="mono">${money(r[1])} <span class="pill go">${r[2]}</span></span></div>`).join("")}</div>`;
    return `<div class="page">
      <div class="kpis">
        ${kpi("Retainers", money(rev), CUST.length + " customers")}
        ${kpi("Pass-through", money(passAll), "ads, at cost")}
        ${kpi("Cost to serve", money(ourCost), "AI + phone + org")}
        ${kpi("Gross margin", Math.round(((rev - ourCost) / rev) * 100) + "%", "before your time", "up")}
      </div>
      <div class="desk">
        <div class="roll">${CUST.map((r) => `<button class="item ${r.id === c.id ? "on" : ""}" data-act="sel-bill" data-id="${r.id}">
          <div class="t">${esc(r.name)}</div><div class="m">${money(r.mrr)}/mo · ${esc(r.city)}</div></button>`).join("")}</div>
        <div class="dossier">
          <div class="dh"><span class="pill brand">${esc(c.trade)}</span>
            <div class="who">${esc(c.name)}</div>
            <div class="sub">${money(c.mrr)}/mo · month 1 of 12 · ACH on file</div>
            <div class="pills"><span class="pill go">current</span><span class="pill">${money(pass)} passed through</span><span class="pill">${margin}% margin</span></div>
          </div>
          <div class="acts">
            <button class="btn tiny brand" data-act="invoice" data-id="${c.id}">Send invoice</button>
            <button class="btn tiny" data-act="raise" data-id="${c.id}">Propose a raise</button>
            <button class="btn tiny" data-act="sel-cust-go" data-id="${c.id}">Open dossier</button>
          </div>
          ${tabbar([["overview", "Overview"], ["passthrough", "Pass-through"], ["cost", "Cost & margin"], ["invoices", "Invoices"]])}
          <div class="dbody">${body}</div>
        </div>
        ${rail({ title: "Send the September invoice", why: money(c.mrr) + " on ACH. Nothing outstanding, nothing disputed.", do: "invoice" },
          `<h5>Rule</h5><div style="font-size:12.5px;color:var(--muted);line-height:1.5">Ad spend is passed through at cost. The day we mark it up is the day they start shopping the retainer.</div>`)}
      </div></div>`;
  }

  const gateOf = (j) => (j && j.gate ? APPROVALS.find((a) => a.id === j.gate) : null);
  const changeOf = (j) => (j && j.change ? CHANGES.find((c) => c.id === j.change) : null);
  const openGates = () => JOBS.filter((j) => { const g = gateOf(j); return g && g.status === "open"; });
  const JOB_WORD = { working: "working", blocked: "waiting on a human", thinking: "reading", done: "shipped", rolled_back: "rolled back" };

  function pageWork() {
    const gated = openGates();
    const filters = [
      ["gate", "Needs you", gated.length],
      ["mine", "Mine", JOBS.filter((j) => j.owner === "U1").length],
      ["running", "Running", JOBS.filter((j) => j.status === "working" || j.status === "thinking").length],
      ["free", "Unclaimed", JOBS.filter((j) => !j.owner).length],
      ["shipped", "Shipped", JOBS.filter((j) => j.status === "done").length],
      ["all", "Everything", JOBS.length],
    ];
    const pick = (f) => {
      if (f === "gate") return gated;
      if (f === "mine") return JOBS.filter((j) => j.owner === "U1");
      if (f === "running") return JOBS.filter((j) => j.status === "working" || j.status === "thinking");
      if (f === "free") return JOBS.filter((j) => !j.owner);
      if (f === "shipped") return JOBS.filter((j) => j.status === "done");
      return JOBS.slice();
    };
    let f = state.jobFilter;
    if (!f || (f === "gate" && !gated.length)) f = gated.length ? "gate" : "all";
    const rows = pick(f);
    const j = rows.find((r) => r.id === state.job) || rows[0];

    const bar = `<div class="statline">
      ${filters.filter((x) => x[2] || x[0] === "all").map(([v, n, c]) => `<button class="btn tiny ${f === v ? "brand" : ""}" data-act="job-filter" data-id="${v}">${n}${c ? ` <span class="mono">${c}</span>` : ""}</button>`).join("")}
      <span style="margin-left:auto" class="mono">$${JOBS.reduce((a, x) => a + x.spent, 0).toFixed(2)} today · ${PEOPLE.filter((u) => u.status === "connected").length} sessions live</span>
    </div>`;
    const roll = `<div class="roll">${rows.map((x) => {
      const g = gateOf(x);
      const o = person(x.owner);
      return `<button class="item ${j && x.id === j.id ? "on" : ""}" data-act="sel-job" data-id="${x.id}">
        <div class="t">${g && g.status === "open" ? "● " : ""}${esc(x.title)}</div>
        <div class="m">${esc(cust(x.cust).name)} · <span class="pill ${JOB_PILL[x.status] || ""}">${esc(JOB_WORD[x.status] || x.status)}</span></div>
        <div class="m mono">${o ? esc(o.handle) : "unclaimed"} · ${esc(x.agent)} · $${x.spent.toFixed(2)}/$${x.budget}</div>
      </button>`;
    }).join("") || `<div class="pad" style="color:var(--muted)">Nothing here.</div>`}</div>`;

    if (!j) return `<div class="page">${bar}<div class="pad" style="color:var(--muted)">Nothing on the floor in that filter.</div></div>`;

    const c = cust(j.cust);
    const g = gateOf(j);
    const ch = changeOf(j);
    const owner = person(j.owner);
    const tab = state.tab || "overview";
    let body = "";
    if (tab === "overview") body = `<div class="tlog">${j.steps.map((x) => `<div class="${x.k}">${esc(x.t)}</div>`).join("")}</div>
      ${j.status === "working" ? `<div class="think" style="opacity:.7;padding:8px 10px;border-left:2px solid var(--info);color:var(--muted);font-size:13px">…still working${owner ? " · streamed from " + esc(owner.handle) + "'s session" : ""}</div>` : ""}`;
    if (tab === "gate") body = !g
      ? `<div style="color:var(--muted)">Nothing is waiting on a human here.</div>`
      : `<div class="sec"><h5>${g.irreversible ? "This cannot be undone" : "This is reversible"}</h5>
          <div style="font-size:13.5px;line-height:1.55">${esc(g.what)}</div></div>
        ${kv([["Blast radius", esc(g.blast)], ["Cost", esc(g.cost)], ["Reversible", g.irreversible ? "<b style=\"color:var(--stop)\">No</b>" : "Yes — one click on the diff"], ["Asked", esc(g.asked) + " by " + esc(g.by)], ["Why now", esc(g.why)]])}
        <div class="sec" style="margin-top:18px"><h5>What the wall is doing</h5>
          <div style="font-size:13px;color:var(--muted);line-height:1.55">${esc(g.guard)}</div></div>
        ${g.status === "open" ? `<div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap">
          <button class="btn go" data-act="appr-yes" data-id="${g.id}">Approve${g.irreversible ? " — I understand it sends" : ""}</button>
          <button class="btn stop" data-act="appr-no" data-id="${g.id}">Reject</button>
          <button class="btn" data-act="appr-hold" data-id="${g.id}">Ask the agent for more</button>
        </div>` : `<div class="file" style="margin-top:20px"><b>Decided</b><span class="pill ${g.status === "approved" ? "go" : "info"}">${esc(g.status)}</span></div>`}`;
    if (tab === "diff") body = !ch
      ? (j.files.length
          ? `<div class="sec">${j.files.map((x) => `<div class="file"><span class="mono">${esc(x[0])}</span><span class="mono" style="color:var(--muted)">${esc(x[1])}</span></div>`).join("")}</div>`
          : `<div style="color:var(--muted)">Nothing written yet — this job is still reading.</div>`)
      : `<div class="sec"><h5><span class="pill ${CHG_PILL[ch.state]}">${esc(CHG_WORD[ch.state])}</span> <span class="mono" style="margin-left:8px">${esc(ch.repo)} · ${esc(ch.branch)}</span></h5>
          <div style="font-size:13.5px;line-height:1.55;margin:10px 0 14px">${esc(ch.note)}</div>
          ${ch.files.map((x) => `<div class="file"><span class="mono">${esc(x[0])}</span><span class="mono" style="color:var(--muted)">${esc(x[1])}</span></div>`).join("")}
          <div class="file"><b>${ch.files.length} files</b><b class="mono"><span style="color:var(--go)">+${ch.add}</span> <span style="color:var(--stop)">−${ch.del}</span></b></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${ch.preview ? `<button class="btn tiny brand" data-act="open-preview-url" data-id="${ch.id}">Open ${esc(ch.preview)}</button>` : ""}
          ${ch.state === "live" ? `<button class="btn tiny stop" data-act="rollback" data-id="${ch.id}">Roll back</button>` : ""}
        </div>`;
    if (tab === "scope") body = kv([
      ["Goal", esc(j.goal)], ["Scope", esc(j.scope)],
      ["Owner", owner ? `<b>${esc(owner.name)}</b> · <span class="mono">${esc(owner.handle)}</span>` : `<span style="color:var(--wait)">unclaimed</span>`],
      ["Agent", `<span class="mono">${esc(j.agent)}</span> · ${esc(j.model)}`],
      ["Started", esc(j.started)], ["Risk", esc(j.risk)],
    ]);
    if (tab === "budget") body = `<div class="sec"><h5>Spend cap for this job</h5>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span class="mono">$${j.spent.toFixed(2)} used</span><span class="mono" style="color:var(--muted)">cap $${j.budget}</span></div>
      ${bar2m(j.spent, j.budget)}
      <p style="color:var(--muted);font-size:12.5px;margin-top:12px">The agent stops at the cap and asks. It does not get to decide the job was worth more than you said.</p></div>`;
    if (tab === "walls") body = kv([
      ["Customer", esc(c.name)],
      ["Repo", `<span class="mono">${esc(j.repo)}</span> · bound to ${esc(c.name)} only`],
      ["Deploy", j.preview ? `<span class="mono">${esc(j.preview)}</span> · their Vercel token` : "no deploy yet"],
      ["Session scope", owner ? owner.scope.map((x) => cust(x).name).join(" · ") : "—"],
      ["Cannot see", CUST.filter((x) => x.id !== c.id).map((x) => x.name).join(" · ")],
    ]) + `<p style="color:var(--muted);font-size:12.5px;margin-top:12px">If this job named another customer's repo it would get a 403, not a merge — and the same is true of the human session that claimed it.</p>`;

    const tabs = [["overview", "Transcript"]];
    if (g) tabs.push(["gate", g.status === "open" ? "Needs you ●" : "Decision"]);
    tabs.push(["diff", ch ? "Diff" : "Files"], ["scope", "Scope"], ["budget", "Budget"], ["walls", "Walls"]);

    return `<div class="page">${bar}
      <div class="desk">
        ${roll}
        <div class="dossier">
          <div class="dh"><span class="pill ${JOB_PILL[j.status] || ""}">${esc(JOB_WORD[j.status] || j.status)}</span>${g && g.status === "open" ? `<span class="pill stop">needs you</span>` : ""}
            <div class="who">${esc(j.title)}</div>
            <div class="sub">${esc(c.name)} · <span class="mono">${esc(j.agent)}</span> · ${owner ? "claimed by " + esc(owner.handle) : "unclaimed"} · started ${esc(j.started)}</div>
            <div class="pills"><span class="pill mono">${esc(j.repo)}</span>${j.branch !== "—" ? `<span class="pill mono">${esc(j.branch)}</span>` : ""}${j.preview ? `<span class="pill go mono">${esc(j.preview)}</span>` : ""}</div>
          </div>
          <div class="acts">
            ${g && g.status === "open" ? `<button class="btn tiny go" data-act="tab" data-id="gate">Decide it</button>` : ""}
            ${j.preview ? `<button class="btn tiny brand" data-act="open-preview" data-id="${j.id}">Open preview</button>` : ""}
            ${j.owner ? `<button class="btn tiny" data-act="release-job" data-id="${j.id}">Release</button>` : `<button class="btn tiny brand" data-act="claim-job" data-id="${j.id}">Claim</button>`}
            <button class="btn tiny" data-act="sel-cust-go" data-id="${c.id}">Customer</button>
            ${j.status === "working" || j.status === "thinking" ? `<button class="btn tiny stop" data-act="stop-job" data-id="${j.id}">Stop</button>` : ""}
          </div>
          ${tabbar(tabs)}
          <div class="dbody">${body}</div>
        </div>
        ${rail(g && g.status === "open"
          ? { title: g.title, why: g.irreversible ? "Irreversible. Read the blast radius, then decide — the agent already checked the wall." : g.why, do: "gate" }
          : !j.owner
            ? { title: "Nobody owns this", why: "It sits on the board until a session claims it. Unclaimed work is how things quietly rot.", do: "claim" }
            : j.status === "done"
              ? { title: "Shipped — tell " + c.name.split(" ")[0], why: "Send the before and after. This is the proof that renews the retainer.", do: "sms" }
              : { title: "Let it run", why: j.goal, do: "watch" },
          `<h5>Budget</h5><div style="font-size:12.5px;color:var(--muted);margin-bottom:6px">$${j.spent.toFixed(2)} of $${j.budget}</div>${bar2m(j.spent, j.budget)}
           <h5 style="margin-top:14px">Session</h5><div style="font-size:12.5px;color:var(--muted);line-height:1.5">${owner ? esc(owner.name) + " · " + esc(owner.machine) + "<br>" + esc(owner.version) : "No session has claimed this."}</div>`)}
      </div></div>`;
  }

  function pageSessions() {
    const u = PEOPLE.find((x) => x.id === state.who) || PEOPLE[0];
    const mine = JOBS.filter((x) => x.owner === u.id);
    const free = JOBS.filter((x) => !x.owner);
    const agents = TEAM.filter((a) => a.session === u.id);
    const live = PEOPLE.filter((x) => x.status === "connected").length;
    const tab = state.tab || "overview";
    const cmd = `claude mcp add wrangler \\\n  --transport http https://os.aiwrangler.com/mcp \\\n  --header "Authorization: Bearer ${u.token}"`;

    let body = "";
    if (tab === "overview") body = `<div class="sec"><h5>Live from ${esc(u.handle)}'s machine</h5>
        ${agents.length ? agents.map((a) => {
          const job = JOBS.find((x) => x.agent === a.name);
          const last = job && job.steps[job.steps.length - 1];
          return `<div class="file"><span><b>${esc(a.name)}</b> <span class="pill ${a.status === "working" ? "go" : a.status === "blocked" ? "stop" : "info"}">${esc(a.status)}</span>
            <div style="color:var(--muted);font-size:12px;margin-top:4px">${last ? esc(last.t) : esc(a.scope)}</div></span>
            ${job ? `<button class="btn tiny" data-act="sel-job-go" data-id="${job.id}">Open</button>` : ""}</div>`;
        }).join("") : `<div style="color:var(--muted)">No agents running in this session.</div>`}
      </div>
      ${kv([
        ["Machine", esc(u.machine)],
        ["Client", `<span class="mono">${esc(u.version)}</span>`],
        ["Connected", esc(u.since)],
        ["Can approve", u.approver ? "<b>Yes</b> — irreversible things stop here" : "No — their gates route to you"],
        ["Claimed", mine.length + " job" + (mine.length === 1 ? "" : "s")],
      ])}`;
    if (tab === "claimed") body = `<div class="sec"><h5>Claimed by ${esc(u.handle)}</h5>
        ${mine.map((x) => `<div class="file"><span>${esc(x.title)}<div style="color:var(--muted);font-size:12px;margin-top:3px">${esc(cust(x.cust).name)} · ${esc(JOB_WORD[x.status] || x.status)}</div></span>
          <span style="display:flex;gap:6px"><button class="btn tiny" data-act="sel-job-go" data-id="${x.id}">Open</button><button class="btn tiny stop" data-act="release-job" data-id="${x.id}">Release</button></span></div>`).join("") || `<div style="color:var(--muted)">Nothing claimed.</div>`}
      </div>
      <div class="sec"><h5>On the board, unclaimed</h5>
        ${free.map((x) => `<div class="file"><span>${esc(x.title)}<div style="color:var(--muted);font-size:12px;margin-top:3px">${esc(cust(x.cust).name)}</div></span>
          <button class="btn tiny brand" data-act="assign-job" data-id="${x.id}" data-who="${u.id}">Give it to ${esc(u.handle)}</button></div>`).join("") || `<div style="color:var(--muted)">Board is clear.</div>`}
      </div>`;
    if (tab === "connect") body = `<div class="sec"><h5>${u.status === "invited" ? "Send " + esc(u.name.split(" ")[0]) + " this" : "How this session connects"}</h5>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;max-width:62ch">They run this once on their own laptop. Their Claude Code then sees the board, claims work, and streams every step back here — scoped to the customers below and nothing else.</p>
        <pre class="cmd">${esc(cmd)}</pre>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <button class="btn tiny brand" data-act="copy-cmd" data-id="${u.id}">Copy command</button>
          <button class="btn tiny" data-act="rotate-token" data-id="${u.id}">Rotate token</button>
        </div>
      </div>
      <div class="sec"><h5>Then it can</h5>
        ${MCP_TOOLS.map(([n, w]) => `<div class="file"><span><span class="mono" style="color:var(--brand-2)">${esc(n)}</span><div style="color:var(--muted);font-size:12px;margin-top:3px">${esc(w)}</div></span>
          <span class="pill ${u.tools.indexOf(n) >= 0 ? "go" : ""}">${u.tools.indexOf(n) >= 0 ? "granted" : "not granted"}</span></div>`).join("")}
      </div>`;
    if (tab === "scope") body = `<div class="sec"><h5>Customers this session can mount</h5>
        ${CUST.map((x) => `<div class="file"><span>${esc(x.name)}<div style="color:var(--muted);font-size:12px;margin-top:3px">${esc(x.city)}</div></span>
          <button class="btn tiny ${u.scope.indexOf(x.id) >= 0 ? "" : "brand"}" data-act="scope-toggle" data-id="${u.id}" data-cust="${x.id}">${u.scope.indexOf(x.id) >= 0 ? "Scoped" : "Grant"}</button></div>`).join("")}
      </div>
      <p style="color:var(--muted);font-size:12.5px;max-width:62ch">Scope is enforced at the tool, not in the prompt. <span class="mono">read_bound_repo</span> on a customer outside this list returns a 403 to their Claude Code, the same 403 an agent gets. Asking nicely does not change it.</p>`;

    return `<div class="page">
      <div class="statline">
        <span class="pill go">${live} connected</span>
        <span class="pill">${JOBS.filter((x) => x.owner).length} claimed</span>
        ${free.length ? `<span class="pill wait">${free.length} on the board</span>` : ""}
        <span style="margin-left:auto;color:var(--muted)">Everyone brings their own Claude Code. Nobody shares a login.</span>
      </div>
      <div class="desk">
        <div class="roll">${PEOPLE.map((x) => `<button class="item ${x.id === u.id ? "on" : ""}" data-act="sel-who" data-id="${x.id}">
          <div class="t">${esc(x.name)} <span class="pill ${x.status === "connected" ? "go" : x.status === "idle" ? "info" : "wait"}">${esc(x.status)}</span></div>
          <div class="m">${esc(x.role)} · ${JOBS.filter((y) => y.owner === x.id).length} claimed</div>
          <div class="m mono">${esc(x.machine)}</div>
        </button>`).join("")}</div>
        <div class="dossier">
          <div class="dh"><span class="pill ${u.status === "connected" ? "go" : u.status === "idle" ? "info" : "wait"}">${esc(u.status)}</span>${u.approver ? `<span class="pill brand">approver</span>` : ""}
            <div class="who">${esc(u.name)}</div>
            <div class="sub"><span class="mono">${esc(u.handle)}</span> · ${esc(u.role)} · ${esc(u.machine)}</div>
            <div class="pills"><span class="pill mono">${esc(u.version)}</span><span class="pill">${agents.length} agents</span><span class="pill">${u.scope.length} customers</span></div>
          </div>
          <div class="acts">
            <button class="btn tiny brand" data-act="tab" data-id="connect">${u.status === "invited" ? "Send the invite" : "Connection"}</button>
            <button class="btn tiny" data-act="tab" data-id="claimed">Claimed work</button>
            ${u.status === "connected" && u.id !== "U1" ? `<button class="btn tiny stop" data-act="revoke" data-id="${u.id}">Revoke session</button>` : ""}
          </div>
          ${tabbar([["overview", "Live"], ["claimed", "Work"], ["connect", "Connect"], ["scope", "Scope"]])}
          <div class="dbody">${body}</div>
        </div>
        ${rail(u.status === "invited"
          ? { title: "Send " + u.name.split(" ")[0] + " the command", why: "Nothing happens until they run it on their own machine. There is no seat to log into.", do: "copy" }
          : free.length
            ? { title: free.length + " job" + (free.length === 1 ? "" : "s") + " on the board", why: "Any connected session can claim these. Work with no owner is work nobody is watching.", do: "board" }
            : { title: "Floor is covered", why: "Every job has an owner and every session is scoped. Go sell something.", do: "none" },
          `<h5>Why their own Claude Code</h5><div style="font-size:12.5px;color:var(--muted);line-height:1.55">One shared agent account means one blast radius. Each person's session carries its own token, its own customer scope, and its own audit trail — so “who told it to do that” always has an answer.</div>`)}
      </div></div>`;
  }

  function pagePlaybooks() {
    const pb = PLAYBOOKS.find((x) => x.id === state.pb) || PLAYBOOKS[0];
    return `<div class="page desk">
      <div class="roll">${PLAYBOOKS.map((x) => `<button class="item ${x.id === pb.id ? "on" : ""}" data-act="sel-pb" data-id="${x.id}">
        <div class="t">${esc(x.name)}</div><div class="m">${esc(x.blurb)}</div>
        <div class="m mono">${x.runs} runs · live on ${x.live.length}</div></button>`).join("")}</div>
      <div class="dossier">
        <div class="dh"><span class="pill brand">playbook</span>
          <div class="who">${esc(pb.name)}</div>
          <div class="sub">${esc(pb.blurb)}</div>
          <div class="pills"><span class="pill">${pb.runs} runs</span>${pb.live.map((id) => `<span class="pill go">${esc(cust(id).name)}</span>`).join("")}</div>
        </div>
        <div class="acts">
          <button class="btn tiny brand" data-act="pb-run" data-id="${pb.id}">Run it on a customer</button>
          <button class="btn tiny" data-act="pb-edit" data-id="${pb.id}">Edit steps</button>
        </div>
        <div class="dbody">
          <div class="sec"><h5>Fires when</h5><div style="font-size:13.5px">${esc(pb.trigger)}</div></div>
          <div class="sec"><h5>Steps</h5>
            ${pb.steps.map((t, i) => `<div class="file"><span><span class="mono" style="color:var(--faint);margin-right:10px">${i + 1}</span>${esc(t)}</span><span class="pill ${i === 0 ? "go" : ""}">${i === 0 ? "auto" : "auto"}</span></div>`).join("")}
          </div>
          <div class="sec"><h5>Not automated on purpose</h5>
            <div style="font-size:13px;color:var(--muted);line-height:1.55">Anything that sends to a real person or merges to production stops and asks. A playbook is a plan, not a permission.</div></div>
        </div>
      </div>
      ${rail({ title: "Run " + pb.name, why: "Pick a customer and the agents take the steps that are safe to take alone. The rest lands on Needs you.", do: "pb" },
        `<h5>Live on</h5>${pb.live.map((id) => `<div class="file"><span>${esc(cust(id).name)}</span><span class="pill go">on</span></div>`).join("") || `<div style="color:var(--muted);font-size:12.5px">Nobody yet.</div>`}`)}
    </div>`;
  }

  function pageMemory() {
    const scopes = [["agency", "Agency"], ...CUST.map((c) => [c.id, c.name])];
    const q = (state.memQ || "").toLowerCase();
    const rows = MEM.filter((m) => m.scope === state.memScope).filter((m) => !q || m.t.toLowerCase().includes(q));
    const label = state.memScope === "agency" ? "Agency" : cust(state.memScope).name;
    return `<div class="page desk">
      <div class="roll">${scopes.map(([id, n]) => `<button class="item ${state.memScope === id ? "on" : ""}" data-act="mem-scope" data-id="${id}">
        <div class="t">${esc(n)}</div><div class="m">${MEM.filter((m) => m.scope === id).length} remembered</div></button>`).join("")}</div>
      <div class="dossier">
        <div class="dh"><span class="pill brand">${state.memScope === "agency" ? "house" : "customer"}</span>
          <div class="who">${esc(label)}</div>
          <div class="sub">What the AI reads before it writes a single word for ${esc(label)}.</div>
        </div>
        <div class="statline"><input data-act="mem-q" placeholder="Search memory…" value="${esc(state.memQ || "")}"></div>
        <div class="dbody">
          ${rows.map((m) => `<div class="file"><span><span class="pill ${m.kind === "rule" ? "stop" : m.kind === "voice" ? "brand" : "info"}" style="margin-right:8px">${esc(m.kind)}</span>${esc(m.t)}</span>
            <button class="btn tiny" data-act="mem-del" data-id="${m.id}">Forget</button></div>`).join("") || `<div style="color:var(--muted)">Nothing here yet.</div>`}
          <form data-act="mem-add" style="margin-top:18px;display:grid;gap:8px">
            <div class="field"><label>Teach it something about ${esc(label)}</label>
              <textarea name="body" rows="2" placeholder="“Dev signs the invoices, Lisa decides whether the receptionist stays on.”"></textarea></div>
            <div style="display:flex;gap:8px;align-items:center">
              <select name="kind" class="btn tiny"><option value="fact">fact</option><option value="rule">rule</option><option value="voice">voice</option></select>
              <button class="btn brand tiny" type="submit">Remember it</button>
            </div>
          </form>
        </div>
      </div>
      ${rail({ title: "Memory is scoped, always", why: "An Apex rule is never read on a Cascade job. There is no shared brain, because a shared brain is how one customer's voice ends up on another one's site.", do: "none" },
        `<h5>Kinds</h5><div style="font-size:12.5px;color:var(--muted);line-height:1.6"><b style="color:var(--stop)">rule</b> — a hard no. The agent obeys it over your prompt.<br><b style="color:var(--brand)">voice</b> — how they sound.<br><b style="color:var(--info)">fact</b> — what is true about the account.</div>`)}
    </div>`;
  }

  function pageSpending() {
    const ours = SPEND.filter((r) => !r.pass);
    const total = ours.reduce((a, r) => a + r.amt, 0);
    const pass = SPEND.filter((r) => r.pass).reduce((a, r) => a + r.amt, 0);
    const rev = CUST.reduce((a, c) => a + c.mrr, 0);
    return `<div class="page">
      <div class="kpis">
        ${kpi("Our cost this month", money(total), "AI, phone, org")}
        ${kpi("Pass-through", money(pass), "their ads, at cost")}
        ${kpi("Retainers", money(rev), CUST.length + " customers")}
        ${kpi("Cost per customer", money(Math.round(total / CUST.length)), "all-in", "up")}
      </div>
      <div class="desk norail">
        <div class="roll">
          <div class="acts" style="border-bottom:1px solid var(--line)"><span class="pill">this month</span></div>
          ${SPEND.map((r) => `<div class="item"><div class="t">${esc(r.k)} ${r.pass ? `<span class="pill">pass-through</span>` : ""}</div>
            <div class="m">${esc(r.note)}</div><div class="m mono">${money(r.amt)}</div></div>`).join("")}
        </div>
        <div class="canvas pad scroll">
          <div class="sec"><h5>AI spend by job — every job has a ceiling</h5>
            ${JOBS.map((j) => `<div style="margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
                <span>${esc(j.title)} <span style="color:var(--muted)">· ${esc(cust(j.cust).name)}</span></span>
                <span class="mono">$${j.spent.toFixed(2)} / $${j.budget}</span></div>
              ${bar(j.spent, j.budget, j.spent / j.budget > 0.8 ? "warn" : "")}</div>`).join("")}
          </div>
          <div class="sec"><h5>Caps</h5>
            ${[["Per job", "$20 default. The agent stops and asks."], ["Per customer per month", "$300 across all their jobs."], ["Ad spend", "Capped in Zernio, on their card, never ours."], ["Twilio", "Metered per DID so one customer cannot spend another's budget."]].map((r) => `<div class="file"><span><b>${r[0]}</b> — ${r[1]}</span><span class="pill go">enforced</span></div>`).join("")}
          </div>
          <div class="sec"><h5>What we deliberately do not pay for</h5>
            <div style="font-size:13px;color:var(--muted);line-height:1.6">Their Vercel. Their domain. Their ad spend. All of it sits on their account with their token, which is why our hosting line is $0 and why losing a customer costs us nothing to unwind.</div>
          </div>
        </div>
      </div></div>`;
  }

  function pageConnect() {
    const wired = VAULT.filter((v) => v.token).length;
    return `<div class="page">
      <div class="statline"><span class="pill go">${wired} of ${VAULT.length} customers wired</span><span style="color:var(--muted)">One token per customer. Never a shared account.</span></div>
      <div class="desk norail">
        <div class="roll">${VAULT.map((v) => `<div class="item">
          <div class="t">${esc(cust(v.cust).name)} <span class="pill ${v.token ? "go" : "wait"}">${v.token ? "vault" : "not connected"}</span></div>
          <div class="m mono">${esc(v.project || "no project bound")}</div>
          <div class="m">${v.added ? "added " + esc(v.added) : "needs their OAuth"}</div></div>`).join("")}</div>
        <div class="canvas pad scroll">
          <div class="sec"><h5>Why it is one token each</h5>
            <div style="font-size:13.5px;line-height:1.6;max-width:680px">A single agency Vercel account with everyone's sites on it is the cheap way to run this, and it is the reason agencies lose whole client lists in one afternoon. Each customer authorises us on their own account. The token is encrypted at rest, scoped to their project ids, and revocable by them without touching anyone else.</div>
          </div>
          <div class="sec"><h5>Per customer</h5>
            <table class="grid"><thead><tr><th>Customer</th><th>Token</th><th>Bound project</th><th>Action</th></tr></thead>
            <tbody>${VAULT.map((v) => `<tr>
              <td>${esc(cust(v.cust).name)}</td>
              <td><span class="pill ${v.token ? "go" : "wait"}">${v.token ? "encrypted in vault" : "missing"}</span></td>
              <td class="mono">${esc(v.project || "—")}</td>
              <td><button class="btn tiny ${v.token ? "" : "brand"}" data-act="vault" data-id="${v.cust}">${v.token ? "Rotate" : "Send OAuth link"}</button></td>
            </tr>`).join("")}</tbody></table>
          </div>
          <div class="sec"><h5>What we never do</h5>
            ${["Put two customers on one Vercel project", "Share one token across accounts", "Store a token in plaintext or in an env var on the box", "Deploy to production without an approval"].map((t) => `<div class="file"><span>${t}</span><span class="pill stop">never</span></div>`).join("")}
          </div>
        </div>
      </div></div>`;
  }

  function pageGithub() {
    return `<div class="page">
      <div class="statline"><span class="pill go">agency org · one account</span><span class="pill">${BINDINGS.length} repos bound</span><span style="color:var(--muted)">A repo belongs to exactly one customer. The database enforces it.</span></div>
      <div class="desk norail">
        <div class="roll">${BINDINGS.map((b) => `<div class="item">
          <div class="t mono">${esc(b.repo)}</div>
          <div class="m">→ ${esc(cust(b.cust).name)}</div>
          <div class="m">bound ${esc(b.when)} <span class="pill go">unique</span></div></div>`).join("")}</div>
        <div class="canvas pad scroll">
          <div class="sec"><h5>Bind a repo to a customer</h5>
            <form data-act="bind-repo" style="display:grid;gap:10px;max-width:560px">
              <div class="field"><label>Repo</label><input name="repo" placeholder="owner/name" value=""></div>
              <div class="field"><label>Customer</label><select name="cust">${CUST.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div>
              <div><button class="btn brand" type="submit">Bind</button></div>
            </form>
            <p style="color:var(--muted);font-size:12.5px;margin-top:12px;max-width:560px">Try binding a repo that is already taken. It will not warn you and then do it anyway — it refuses, the same way the unique index refuses it in Postgres.</p>
          </div>
          <div class="sec"><h5>Bindings</h5>
            <table class="grid"><thead><tr><th>Repo</th><th>Customer</th><th>Bound</th><th>Action</th></tr></thead>
            <tbody>${BINDINGS.map((b) => `<tr><td class="mono">${esc(b.repo)}</td><td>${esc(cust(b.cust).name)}</td><td class="mono">${esc(b.when)}</td>
              <td><button class="btn tiny stop" data-act="unbind" data-id="${esc(b.repo)}">Unbind</button></td></tr>`).join("")}</tbody></table>
          </div>
          <div class="sec"><h5>The wall, in one line</h5>
            <div class="mono" style="font-size:12.5px;background:var(--inset);border:1px solid var(--line);border-radius:10px;padding:12px;overflow:auto">UNIQUE (provider, resource_id)  —  one repo, one customer, even under a race</div>
            <p style="color:var(--muted);font-size:12.5px;margin-top:10px">A job that names a repo bound to somebody else gets a 403. A repo nobody has bound yet gets a 409. Neither one gets a merge.</p>
          </div>
        </div>
      </div></div>`;
  }

  function pageSettings() {
    const rows = [
      ["Twilio", "Voice, SMS, A2P. One number per customer, never a shared line.", "twilio"],
      ["Zernio", "Ads across Google, Meta, TikTok, LinkedIn, Pinterest, X, OpenAI. One ad account per customer.", "zernio"],
      ["GitHub", "The agency account. Repos bind 1:1 to customers.", "github"],
      ["Vercel", "Their token, their project. We never hold a shared one.", "vercel"],
    ];
    return `<div class="page pad scroll">
      <div class="sec" style="max-width:820px"><h5>Integrations</h5>
        ${rows.map(([n, d, k]) => `
        <div class="card" style="padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;flex-direction:row">
          <div style="flex:1;min-width:0"><b>${n}</b><div style="color:var(--muted);font-size:12.5px;margin-top:4px">${d}</div></div>
          <button class="btn ${state.integrations[k] ? "" : "brand"}" data-act="integ" data-id="${k}">${state.integrations[k] ? "Connected" : "Connect"}</button>
        </div>`).join("")}
      </div>
      <div class="sec" style="max-width:820px"><h5>The door</h5>
        ${[["Operator password", "set", true], ["GitHub OAuth allowlist", "1 account — you", true], ["Public pages", "none. There is no public side.", true], ["Session", "signed cookie, 7 days", true]].map((r) => `<div class="file"><span><b>${r[0]}</b> <span style="color:var(--muted)">— ${r[1]}</span></span><span class="pill go">on</span></div>`).join("")}
        <p style="color:var(--muted);font-size:12.5px;margin-top:10px">With no login method configured the OS seals itself shut rather than falling open. That is deliberate.</p>
      </div>
      <div class="sec" style="max-width:820px"><h5>Guardrails you can move</h5>
        ${[["Default job cap", "$20"], ["Monthly cap per customer", "$300"], ["Approval on production merges", "always"], ["Approval on first live send", "always"]].map((r) => `<div class="file"><span>${r[0]}</span><span class="mono">${r[1]}</span></div>`).join("")}
      </div>
      <p style="color:var(--muted);font-size:12.5px;max-width:680px">This Pages preview simulates Twilio and Zernio. Paste real keys into the Next app (<span class="mono">TWILIO_*</span>, <span class="mono">ZERNIO_API_KEY</span>) and the same screens go live against the real APIs.</p>
    </div>`;
  }

  const PAGES = {
    command: pageCommand, pipeline: pagePipeline, leads: pageLeads, prospects: pageProspects, dialer: pageDialer,
    sms: pageSms, ads: pageAds, partners: pagePartners, customers: pageCustomers,
    inbox: pageInbox, billing: pageBilling, work: pageWork, sessions: pageSessions,
    playbooks: pagePlaybooks, memory: pageMemory, spending: pageSpending,
    connect: pageConnect, github: pageGithub, settings: pageSettings,
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
        : `<div class="who">Twilio idle</div><div class="ph">4 lines · A2P ready</div>`}</div>
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
      <div class="os ${state.call ? "live" : ""} ${state.menu ? "menu-open" : ""}">
        <div class="scrim" data-act="menu-close"></div>
        <aside class="side">
          <div class="brand"><div class="mark">✛</div><div><h1>AI WRANGLER</h1><small>Local domination OS</small></div></div>
          <nav class="nav">${NAV.map((g) => `<div class="nav-h ${g[0] === "BUILD" ? "build" : ""}">${g[0]}</div>${g[1].map(([id, l]) => ni(id, l)).join("")}`).join("")}</nav>
          <div class="side-foot">
            <button class="btn brand full" data-act="nav" data-page="leads">＋ New lead</button>
            <button class="btn full" data-act="power">＋ Dial the board</button>
          </div>
        </aside>
        <section class="main">
          <header class="top">
            <button class="burger" data-act="menu" aria-label="Menu" aria-expanded="${state.menu ? "true" : "false"}"><span></span><span></span><span></span></button>
            <h2>${esc(TITLES[state.page] || "AI Wrangler")}</h2>
            <div class="top-actions">
              <button class="chip search-chip" data-act="search" aria-label="Search"><span class="glass">⌕</span><span class="hide-sm">Search everything… <span class="k">⌘K</span></span></button>
              <span class="chip hide-sm">Agency view</span>
              <button class="chip" data-act="theme">${state.theme === "dark" ? "Light" : "Dark"}</button>
              <span class="chip mono hide-md">${clock()}</span>
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
    if (state.jump) {
      state.jump = false;
      if (isPhone()) {
        // Synchronous on purpose: reading the rect forces layout, and a rAF here
        // never fires in a backgrounded tab, which silently loses the jump.
        const stage = $(".stage");
        const target = stage && (stage.querySelector(".dossier") || stage.querySelector(".thread"));
        if (stage && target) {
          const top = target.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop;
          stage.scrollTop = Math.max(0, top - 4);
        }
      }
    }
  }

  function hits() {
    const q = (state.q || "").toLowerCase();
    const out = [];
    LEADS.forEach((l) => out.push({ label: l.name, kind: l.kind, page: l.kind === "partner" ? "partners" : "leads", id: l.id }));
    CUST.forEach((c) => out.push({ label: c.name, kind: "customer", page: "customers", id: c.id }));
    PX.forEach((p) => out.push({ label: p.name, kind: "prospect", page: "prospects", id: p.id }));
    PARTNERS.forEach((p) => out.push({ label: p.name, kind: "franchise", page: "partners", id: p.id }));
    ADS.forEach((a) => out.push({ label: a.name, kind: "ad", page: "ads" }));
    return out.filter((h) => !q || h.label.toLowerCase().includes(q)).slice(0, 8);
  }

  function party(id) {
    const l = lead(id);
    if (l) return { name: l.name, phone: l.phone, book: leadCo(l) };
    const r = PX.find((x) => x.id === id);
    if (r) return { name: r.dm, phone: r.phone, book: r.name };
    const p = PARTNERS.find((x) => x.id === id);
    if (p) return { name: p.op, phone: p.phone, book: p.name };
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
    if (act === "menu") { state.menu = !state.menu; render(); }
    if (act === "menu-close") { state.menu = false; render(); }
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
    if (act === "sms-sel") state.jump = true;
    if (act === "sms-sel") { state.sms = id; render(); }
    if (act === "sel-lead") state.jump = true;
    if (act === "sel-lead") { state.lead = id; state.tab = "overview"; render(); }
    if (act === "close-lead") { state.lead = null; render(); }
    if (act === "close-partner") { state.partner = null; render(); }
    if (act === "certify") {
      const pr = PARTNERS.find((x) => x.id === id);
      const k = KIT.find((x) => x.id === n.getAttribute("data-kit"));
      if (pr && k && pr.certified.indexOf(k.id) < 0) {
        pr.certified.push(k.id);
        toast(pr.op.split(" ")[0] + " certified on " + k.name);
      }
      render();
    }
    if (act === "sel-cust") state.jump = true;
    if (act === "sel-cust") { state.custId = id; state.tab = "overview"; render(); }
    if (act === "sel-prospect") state.jump = true;
    if (act === "sel-prospect") { state.prospect = id; state.tab = "overview"; render(); }
    if (act === "sel-partner") state.jump = true;
    if (act === "sel-partner") { state.partner = id; state.tab = "overview"; render(); }
    if (act === "tab") { state.tab = id; render(); }
    if (act === "next") {
      const d = n.getAttribute("data-do");
      if (d === "dial") { const t = state.page === "prospects" ? state.prospect : state.lead; if (t) dial(t); else toast("Pick a lead first"); }
      else if (d === "sms") {
        if (state.page === "partners") {
          const pr = PARTNERS.find((x) => x.id === state.partner);
          if (pr && pr.thread) { state.sms = pr.thread; go("inbox"); }
          else toast("No thread with " + (pr ? pr.op : "them") + " yet — call instead");
        } else { state.sms = state.lead || state.sms; go("inbox"); }
      }
      else if (d === "ads") go("ads");
      else if (d === "approvals") go("approvals");
      else if (d === "settings") go("settings");
      else if (d === "job") { state.tab = "scope"; render(); }
      else if (d === "work") go("work");
      else if (d === "invoice") toast("Invoice queued · ACH");
      else if (d === "pb") { toast("Queued — safe steps run, the rest lands on Needs you"); go("work"); }
      else if (d === "watch") toast("Watching · you get pinged the moment it needs you");
      else if (d === "gate") { state.tab = "gate"; render(); }
      else if (d === "claim") { const j = job(state.job); if (j) { j.owner = "U1"; toast("Claimed"); render(); } }
      else if (d === "copy") { state.tab = "connect"; render(); }
      else if (d === "board") { state.tab = "claimed"; render(); }
      else if (d === "none") toast("Nothing to do here");
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
    if (act === "filter-go") { state.filter = id; go("leads"); }
    if (act === "view") { state.leadView = id; render(); }
    if (act === "pview") { state.prospView = id; render(); }
    if (act === "integ") {
      state.integrations[id] = !state.integrations[id];
      toast(id + (state.integrations[id] ? " connected" : " disconnected"));
      render();
    }
    if (act === "sel-bill") state.jump = true;
    if (act === "sel-bill") { state.billId = id; state.tab = "overview"; render(); }
    if (act === "invoice") { toast("Invoice queued · " + cust(id).name + " · ACH"); }
    if (act === "raise") toast("Raise drafted — it lands in your inbox to send, not theirs");
    if (act === "sel-cust-go") { state.custId = id; state.tab = "overview"; go("customers"); }
    if (act === "job-filter") { state.jobFilter = id; render(); }
    if (act === "sel-job") state.jump = true;
    if (act === "sel-job") { state.job = id; state.tab = "overview"; render(); }
    if (act === "sel-job-go") { state.job = id; state.tab = "overview"; go("work"); }
    if (act === "open-preview") { const j = job(id); toast("Preview · " + (j && j.preview ? j.preview : "not deployed yet")); }
    if (act === "open-preview-url") { const c0 = CHANGES.find((x) => x.id === id); toast("Preview · " + (c0 && c0.preview)); }
    if (act === "stop-job") {
      const j = job(id);
      if (j) { j.status = "blocked"; j.steps = j.steps.concat([{ k: "gate", t: "Stopped by you. Nothing was merged or sent." }]); }
      toast("Stopped · branch left open, nothing merged");
      render();
    }
    if (act === "appr-yes") {
      const a = APPROVALS.find((x) => x.id === id);
      if (a) {
        a.status = "approved";
        const j = a.job && job(a.job);
        if (j) { j.status = "working"; j.steps = j.steps.filter((x) => x.k !== "gate").concat([{ k: "done", t: "Approved by you — running now." }]); }
        toast("Approved · " + a.title.toLowerCase());
      }
      render();
    }
    if (act === "appr-no") {
      const a = APPROVALS.find((x) => x.id === id);
      if (a) { a.status = "rejected"; toast("Rejected · the agent is told why, not just no"); }
      render();
    }
    if (act === "appr-hold") toast("Asked the agent to show its work first");
    if (act === "rollback") {
      const c0 = CHANGES.find((x) => x.id === id);
      if (c0) { c0.state = "rolled_back"; c0.note = "Rolled back by you. The previous deploy is live again."; }
      toast("Rolled back · previous deploy restored");
      render();
    }
    if (act === "sel-pb") state.jump = true;
    if (act === "sel-pb") { state.pb = id; render(); }
    if (act === "pb-run") { toast(PLAYBOOKS.find((x) => x.id === id).name + " queued — safe steps run, the rest lands on Needs you"); go("work"); }
    if (act === "pb-edit") toast("Playbooks are code. Edit them in the repo, not in a form.");
    if (act === "sel-who") state.jump = true;
    if (act === "sel-who") { state.who = id; state.tab = "overview"; render(); }
    if (act === "claim-job") {
      const j = job(id);
      if (j) { j.owner = "U1"; toast("Claimed · it is yours until you release it"); }
      render();
    }
    if (act === "release-job") {
      const j = job(id);
      if (j) { j.owner = null; toast("Released · back on the board for any session"); }
      render();
    }
    if (act === "assign-job") {
      const j = job(id);
      const u = person(n.getAttribute("data-who"));
      if (j && u) { j.owner = u.id; toast("Assigned to " + u.handle + " · it shows up in their Claude Code"); }
      render();
    }
    if (act === "copy-cmd") {
      const u = person(id);
      const text = 'claude mcp add wrangler --transport http https://os.aiwrangler.com/mcp --header "Authorization: Bearer ' + u.token + '"';
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
      toast("Copied · send it to " + u.name.split(" ")[0] + ", it only works on their machine");
    }
    if (act === "rotate-token") {
      const u = person(id);
      if (u) { u.token = "wr_sess_" + (u.handle.length * 7919 + 40503).toString(16) + "b2"; toast("Rotated · their old session is dead as of now"); }
      render();
    }
    if (act === "scope-toggle") {
      const u = person(id);
      const cid = n.getAttribute("data-cust");
      if (u) {
        const i = u.scope.indexOf(cid);
        if (i >= 0) { u.scope.splice(i, 1); toast(cust(cid).name + " removed — their tools 403 on it now"); }
        else { u.scope.push(cid); toast(cust(cid).name + " granted to " + u.handle); }
      }
      render();
    }
    if (act === "revoke") {
      const u = person(id);
      if (u) {
        u.status = "invited"; u.version = "—"; u.since = "—";
        JOBS.forEach((j) => { if (j.owner === u.id) j.owner = null; });
        toast(u.name.split(" ")[0] + "'s session revoked · their claimed work went back on the board");
      }
      render();
    }
    if (act === "mem-scope") state.jump = true;
    if (act === "mem-scope") { state.memScope = id; state.memQ = ""; render(); }
    if (act === "mem-del") {
      const i = MEM.findIndex((m) => m.id === id);
      if (i >= 0) { MEM.splice(i, 1); toast("Forgotten · the agents stop reading it on the next job"); }
      render();
    }
    if (act === "vault") {
      const v = VAULT.find((x) => x.cust === id);
      if (v && v.token) toast("Rotation link sent to " + cust(id).name + " — they approve it on their own Vercel");
      else toast("OAuth link sent to " + cust(id).name + " — they authorise us on their account");
    }
    if (act === "unbind") {
      const i = BINDINGS.findIndex((b) => b.repo === id);
      if (i >= 0) { BINDINGS.splice(i, 1); toast("Unbound · " + id + " is free to bind again"); }
      render();
    }
    if (act === "approve") toast("Approved · Twilio will send it");
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
    if (n.getAttribute("data-act") === "wrangler-send") {
      const body = n.body.value.trim();
      if (!body) return;
      n.body.value = "";
      toast("Sent to Head Wrangler · it will plan, then stop at the first wall");
      return;
    }
    if (n.getAttribute("data-act") === "mem-add") {
      const body = n.body.value.trim();
      if (!body) return;
      MEM.push({ id: "M" + (MEM.length + 1) + "x", scope: state.memScope, kind: n.kind.value, t: body });
      n.body.value = "";
      toast("Remembered · scoped to " + (state.memScope === "agency" ? "the agency" : cust(state.memScope).name));
      render();
      return;
    }
    if (n.getAttribute("data-act") === "bind-repo") {
      const fd = new FormData(n);
      const repo = String(fd.get("repo") || "").trim();
      const who = fd.get("cust");
      if (!repo) return;
      const taken = BINDINGS.find((b) => b.repo.toLowerCase() === repo.toLowerCase());
      if (taken) {
        toast("409 · " + repo + " is already bound to " + cust(taken.cust).name + ". Refused.");
        return;
      }
      BINDINGS.push({ repo: repo, cust: who, when: "just now" });
      toast("Bound · " + repo + " → " + cust(who).name);
      render();
      return;
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
    const act = e.target.getAttribute("data-act");
    if (act === "filter") { state.filter = e.target.value; render(); }
    if (act === "filter-stage") { state.filterStage = e.target.value; render(); }
    if (act === "sort") { state.leadSort = e.target.value; render(); }
    if (act === "cust-sort") { state.custSort = e.target.value; render(); }
    if (act === "cust-trade") { state.custTrade = e.target.value; render(); }
    if (act === "prosp-sort") { state.prospSort = e.target.value; render(); }
    if (act === "part-sort") { state.partSort = e.target.value; render(); }
  });
  document.addEventListener("input", (e) => {
    const act = e.target.getAttribute("data-act");
    const keep = (sel, val) => { const inp = $(sel); if (inp) { inp.focus(); inp.setSelectionRange(val.length, val.length); } };
    if (act === "q") { state.q = e.target.value; render(); keep('[data-act="q"]', state.q); }
    if (act === "lead-q") { state.leadQ = e.target.value; render(); keep('[data-act="lead-q"]', state.leadQ); }
    if (act === "cust-q") { state.custQ = e.target.value; render(); keep('[data-act="cust-q"]', state.custQ); }
    if (act === "prosp-q") { state.prospQ = e.target.value; render(); keep('[data-act="prosp-q"]', state.prospQ); }
    if (act === "part-q") { state.partQ = e.target.value; render(); keep('[data-act="part-q"]', state.partQ); }
    if (act === "mem-q") { state.memQ = e.target.value; render(); keep('[data-act="mem-q"]', state.memQ); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const row = e.target.closest && e.target.closest('[role="button"][data-act]');
      if (row && row === e.target) { e.preventDefault(); row.click(); return; }
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); state.search = !state.search; render(); }
    if (e.key === "Escape") { state.search = false; state.launch = false; state.menu = false; render(); }
  });

  addEventListener("hashchange", () => {
    let p = location.hash.replace("#/", "");
    if (ALIAS[p]) { if (p === "approvals") state.jobFilter = "gate"; p = ALIAS[p]; }
    if (p === "pipeline") { p = "leads"; state.leadView = "kanban"; }
    if (PAGES[p]) { state.page = p; render(); }
  });

  let boot = location.hash.replace("#/", "");
  if (ALIAS[boot]) { if (boot === "approvals") state.jobFilter = "gate"; boot = ALIAS[boot]; }
  if (boot === "pipeline") { boot = "leads"; state.leadView = "kanban"; }
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
