-- The twelve real pipeline stages, replacing the six we had.
--
-- The old set collapsed four offer stages into one word, so a lead whose offer
-- was still being written and a lead mid-negotiation were both `proposal`.
--
-- Reversing that cannot be exact — the information was thrown away on import.
-- Two rules keep it honest:
--
--   Where the database still knows the answer, use it. A lead at `proposal`
--   whose proposal was actually sent becomes `offer_sent`; one whose proposal
--   is signed becomes `offer_negotiation`. Those are facts, not guesses.
--
--   Where it does not, move BACKWARDS, never forwards. A lead filed one stage
--   early gets looked at again. A lead wrongly marked "Offer Sent" is one
--   nobody chases, because the board says it is already handled.

UPDATE agency_leads SET stage = 'prospects'  WHERE stage = 'prospect';
UPDATE agency_leads SET stage = 'partners'   WHERE stage = 'partner';
UPDATE agency_leads SET stage = 'lead'       WHERE stage = 'new';

-- `talking` came from both "Book Discovery Meeting" and "Booked Discovery
-- Meeting". Nothing distinguishes them now, so it lands on the earlier one.
UPDATE agency_leads SET stage = 'book_discovery' WHERE stage = 'talking';

-- `proposal` came from four stages. The proposals table remembers which.
UPDATE agency_leads l SET stage = 'offer_negotiation'
 WHERE l.stage = 'proposal'
   AND EXISTS (SELECT 1 FROM proposals p WHERE p.lead_id = l.id AND p.status IN ('signed', 'paid'));

UPDATE agency_leads l SET stage = 'offer_sent'
 WHERE l.stage = 'proposal'
   AND EXISTS (SELECT 1 FROM proposals p WHERE p.lead_id = l.id AND p.status = 'sent');

UPDATE agency_leads l SET stage = 'offer_ready'
 WHERE l.stage = 'proposal'
   AND EXISTS (SELECT 1 FROM proposals p WHERE p.lead_id = l.id);

-- Whatever is left had no proposal at all, so the offer was never written.
UPDATE agency_leads SET stage = 'create_offer' WHERE stage = 'proposal';

-- Anything that predates all of this, or arrived from somewhere unrecognised,
-- is filed rather than silently dropped into the middle of the pipeline.
UPDATE agency_leads
   SET stage = 'no_stage'
 WHERE stage NOT IN (
   'no_stage', 'partners', 'prospects', 'lead', 'book_discovery', 'booked_discovery',
   'create_offer', 'offer_ready', 'offer_sent', 'offer_negotiation', 'won', 'lost'
 );
