-- Demo data for the morning briefing. Runs once (migrations are tracked); every
-- row is ON CONFLICT DO NOTHING so it can never clobber real customer data.

INSERT INTO customers (id, name, created_at, profile_json) VALUES
('brightline', 'Brightline', now(), $j${"project":"Invoice portal v2","pct":68,"repo":"github.com/brightline/invoice-portal","vercel":"brightline-team.vercel.app","supabase":"brightline-prod.supabase.co","rules":"Ask before anything a customer could see or that can’t be undone.","owner":"Alex (you)","contact":{"name":"Maya Chen","role":"Head of Ops","phone":"(415) 555-0132","email":"maya@brightline.com","addr":"548 Market St, Suite 210, San Francisco, CA"},"health":[{"label":"Code freshness","value":"Up to date","color":"var(--state-running)"},{"label":"Waiting reviews","value":"2 open, oldest 1 day","color":"var(--text-primary)"},{"label":"Automated checks","value":"Passing","color":"var(--state-running)"}],"timeline":[{"who":"You","text":"Kickoff call — agreed the invoice portal scope.","when":"2 days ago"},{"who":"AI","text":"Set up the project board with 12 tasks.","when":"2 days ago"},{"who":"You","text":"Reviewed and merged the payment-page polish.","when":"yesterday"},{"who":"AI","text":"Routine checkup — everything healthy.","when":"8 hours ago"}]}$j$),
('harbor-and-co', 'Harbor & Co', now(), $j${"project":"Storefront refresh","pct":41,"repo":"github.com/harbor-co/storefront","vercel":"harbor-co.vercel.app","supabase":"harbor-prod.supabase.co","rules":"Busy season Nov–Jan: no risky changes then.","owner":"Alex (you)","contact":{"name":"Dev Okafor","role":"Founder","phone":"(206) 555-0187","email":"dev@harborandco.shop","addr":"1120 Alaskan Way, Seattle, WA"},"health":[{"label":"Code freshness","value":"3 days behind","color":"var(--state-blocked)"},{"label":"Waiting reviews","value":"1 open, 6 days old","color":"var(--state-blocked)"},{"label":"Automated checks","value":"Passing","color":"var(--state-running)"}],"timeline":[{"who":"You","text":"Shared the new homepage direction with their team.","when":"3 days ago"},{"who":"AI","text":"Drafted the product-grid layout for review.","when":"2 days ago"},{"who":"AI","text":"Flagged a review that has been waiting 6 days.","when":"this morning"}]}$j$),
('atlas-labs', 'Atlas Labs', now(), $j${"project":"Patient intake app","pct":83,"repo":"github.com/atlas-labs/patient-intake","vercel":"atlas-labs.vercel.app","supabase":"atlas-prod.supabase.co","rules":"Healthcare data: never log form contents. Deploys must be one-click reversible.","owner":"Alex (you)","contact":{"name":"Rosa Alvarez","role":"Clinical Director","phone":"(512) 555-0119","email":"rosa@atlaslabs.health","addr":"77 Congress Ave, Austin, TX"},"health":[{"label":"Code freshness","value":"Up to date","color":"var(--state-running)"},{"label":"Automated checks","value":"Passing","color":"var(--state-running)"},{"label":"Library updates","value":"1 security update","color":"var(--state-blocked)"}],"timeline":[{"who":"You","text":"HIPAA review of the intake flow.","when":"last week"},{"who":"AI","text":"Shipped form autosave.","when":"yesterday"},{"who":"You","text":"Patients keep getting logged out mid-form — looking now.","when":"this morning"}]}$j$)
ON CONFLICT (id) DO NOTHING;

INSERT INTO jobs (id, customer_id, title, status, harness, tier, spent_cents, budget_cents, cache, transcript_json, created_at) VALUES
('A', 'brightline', 'Add PDF export to invoices', 'blocked', 'claude-code-mcp', 'Medium brain', 214, 1000, 72,
 $j$[{"kind":"think","text":"Maya wants customers to export invoices as PDF. I’ll find the existing CSV export and mirror it."},{"kind":"tool","label":"Reading the invoice page","text":"Found Export as CSV. I’ll add Export as PDF next to it, same data."},{"kind":"tool","label":"Writing the change (on a safe copy)","text":"src/pages/InvoicePage.tsx + src/lib/pdf.ts · branch agent/invoice-export"},{"kind":"tool","label":"Running the checks","text":"6 new checks pass. Totals and dates come out right."},{"kind":"gate","text":"Paused — needs your OK to open the PR and preview."}]$j$, now()),
('C', 'atlas-labs', 'Fix login timeout bug', 'queued', 'claude-code-mcp', 'Big brain', 0, 2000, 64, $j$[]$j$, now()),
('D', 'harbor-and-co', 'Speed up the checkout page', 'working', 'claude-code-mcp', 'Medium brain', 88, 1000, 58,
 $j$[{"kind":"think","text":"Harbor & Co’s checkout feels slow on phones. Measuring before I touch anything."},{"kind":"tool","label":"Measuring the slow parts","text":"Full-size product photos on tiny screens. 4.1s wasted per visit."},{"kind":"tool","label":"Writing the change (on a safe copy)","text":"2 files on agent/faster-checkout. Live store untouched."}]$j$, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO approvals (id, customer_id, job_id, title, why, payload, irreversible, status, created_at) VALUES
('g1', 'brightline', 'A', 'Share “Add PDF export to invoices” for review + preview site',
 'The work is done and every check passes — on a safe copy only. I need your OK to open it for review. Nothing touches the real site.',
 $p$branch: agent/invoice-export -> main
opens: pull request + preview website

 src/pages/InvoicePage.tsx
+  <ExportButton onClick={downloadPdf}
+     label="Export as PDF" />

 src/lib/pdf.ts   (new, 48 lines)
+  builds the PDF from invoice data$p$, false, 'pending', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO inbox (id, customer_id, from_name, via, at, text, task, status) VALUES
('i1', 'brightline', 'Maya @ Brightline', 'email', '8:52 AM', 'Could customers get an email receipt after paying? We keep forwarding them by hand.', 'Send email receipts after payment', 'new'),
('i2', 'harbor-and-co', 'Dev @ Harbor & Co', 'slack', '9:18 AM', 'The product photos look blurry on phones. Any quick fix?', 'Sharpen product photos on mobile', 'new')
ON CONFLICT (id) DO NOTHING;

INSERT INTO changes (id, customer_id, title, repo, branch, files, status, diff, expl, created_at) VALUES
('ch1', 'brightline', 'Add PDF export to invoices', 'github.com/brightline/invoice-portal', 'agent/invoice-export', 3, 'pushed',
 $p$branch: agent/invoice-export -> main
+ Export as PDF button
+ src/lib/pdf.ts$p$,
 $p$• Adds an “Export as PDF” button next to the existing CSV one
• The PDF is built from the same data the page already shows
• 6 new checks make sure totals and dates come out right$p$, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO memories (id, customer_id, text, created_at) VALUES
('m1', 'brightline', 'They prefer small, frequent releases over big ones.', now()),
('m2', 'brightline', 'Maya is the decision-maker; cc her on anything customer-facing.', now()),
('m3', 'harbor-and-co', 'Busy season is Nov–Jan: no risky changes then.', now()),
('m4', 'atlas-labs', 'Healthcare data: never log form contents, ever.', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO orch_log (customer_id, tag, text, at) VALUES
(NULL, 'mcp', 'claude-code connected — Head Wrangler session 7f3a (your laptop)', now()),
(NULL, 'mcp', 'tools granted: create_task · read_runs · deploy · query_costs', now()),
(NULL, 'plan', 'watching 3 customer workspaces, isolation walls up', now()),
('brightline', 'assign', '→ sub-agent brightline-builder: “Add PDF export to invoices”', now()),
('brightline', 'paused', 'Brightline — waiting on you to open the PR', now());

INSERT INTO deals (id, name, value, note, stage) VALUES
('d1', 'Northwind Dental', '$4k/mo', 'Website + intake. Call notes in Drive.', 1),
('d2', 'Copper Kettle', '$2.5k/mo', 'Online ordering. Warm intro from Maya.', 2),
('d3', 'Kinship Goods', '$3k/mo', 'Won — ready to onboard.', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit (customer_id, actor, action, target, at) VALUES
('brightline', 'brightline-builder', 'used GitHub write key', 'agent/invoice-export', now()),
(NULL, 'you', 'signed in', 'session 7f3a via MCP', now());
