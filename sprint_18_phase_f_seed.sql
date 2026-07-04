-- ============================================================
-- Sprint 18 Phase F — Seed Affiliate Modules
-- idempotent: safe to re-run
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM affiliate_modules LIMIT 1) THEN
    INSERT INTO affiliate_modules (title, subtitle, content_type, content_body, duration_minutes, order_in_course, is_free, points_on_completion) VALUES

    ('Why Swiipt Affiliates Earn More Than Traditional Referrers',
     'Understanding the platform, the market, and why now is the best time to promote Swiipt',
     'article',
     '## The opportunity\n\nThe Nigerian relocation market processes billions of naira in transactions every year. Swiipt is the platform that captures this market — and as an affiliate, you earn a commission on every transaction.\n\n## Why the commission is high\n\nSwiipt charges ₦850,000–₦2,500,000 per service order. At 5% commission, one converting referral earns you ₦42,500–₦125,000. At Platinum tier (12%), that same referral earns you ₦102,000–₦300,000.\n\n## First-mover advantage\n\nThe platform is growing and the first affiliates are building networks that will generate passive income for years.',
     15, 1, TRUE, 20),

    ('Your First 10 Referrals — The Fastest Path to Bronze Tier',
     'Practical tactics to get your first 10 converting referrals within 30 days',
     'article',
     '## The fastest path to 10 referrals\n\nYour first 10 referrals do not come from strangers on the internet. They come from your existing network.\n\n**Step 1 — Make a list of 30 people**\n\nThink of everyone you know who has mentioned wanting to move abroad. Write their names down.\n\n**Step 2 — Personal outreach**\n\nSend each person a personal WhatsApp message. Do not send a broadcast. Personal messages convert at 10x the rate of broadcasts.\n\n**Step 3 — Follow up**\n\nMost people will not act on your first message. Follow up three times: 3 days later, 1 week later, 2 weeks later.\n\n**Step 4 — Ask for referrals**\n\nAfter someone signs up, ask them: "Do you know anyone else who is planning to move abroad?". The best referrals come from people who already trust you.',
     20, 2, TRUE, 20),

    ('WhatsApp is Your Biggest Affiliate Asset — Here is How to Use It',
     'Nigeria runs on WhatsApp. Every affiliate strategy must start here.',
     'article',
     '## WhatsApp affiliate strategy\n\n**Step 1 — Status posts (the highest-leverage action)**\n\nPost a status once a day. Rotate between: a scholarship opportunity, a success story, a question ("Where are you moving in 2026?"), and a testimonial.\n\n**Step 2 — Broadcast lists**\n\nCreate a broadcast list of 50+ people. Send one helpful message per week — not a sales pitch.\n\n**Step 3 — Group value**\n\nJoin relocation-focused WhatsApp groups. When someone asks a question, answer helpfully and mention how Swiipt can help.\n\n**Step 4 — DM sequence**\n\nDay 1: "Hey, I saw you were asking about moving to Canada. Are you still planning that?"\nDay 3: "I found this scholarship opportunity — thought of you."\nDay 7: "I use a platform called Swiipt to track my move. Want me to send you the link?"',
     25, 3, TRUE, 25),

    ('Content Templates — Copy, Paste, Send',
     'Ready-to-use WhatsApp statuses, tweets, and Instagram captions',
     'template',
     '## WhatsApp Status Templates\n\n**Template 1 — Scholarship angle**\n"₦0 to study abroad. Yes, it is possible. There are fully funded scholarships open right now for Nigerians. DM me for the link."\n\n**Template 2 — The question**\n"If you could move to any country in 2026, where would it be? I am curious."\n\n**Template 3 — Success story**\n"My client just got his Canadian visa approved. He started saving on Swiipt 8 months ago. He flies out next month."\n\n**Template 4 — Urgency**\n"UK visa fees are going up in April. If you are planning a UK move, start your application now."\n\n## Instagram Captions\n\n**Caption 1**\n"I am planning my move abroad and tracking everything on Swiipt. They help with savings, visa applications, and even flight bookings. If you are planning a move, check them out. Link in bio."\n\n**Caption 2**\n"4 countries. 2 visas. 1 platform. Swiipt has helped me organize my entire relocation plan. From saving to flights. Link in bio."\n\n## Twitter/X Templates\n\n**Tweet 1**\n"Did you know Nigeria has one of the highest visa rejection rates in the world? The secret is preparation. Use a platform that guides you step by step."\n\n**Tweet 2**\n"If you are Nigerian and you want to relocate in 2026, here is the order:\n1. Open a Swiipt account\n2. Start a goal\n3. Save monthly\n4. Apply\nIt works."',
     10, 4, TRUE, 15),

    ('Advanced Strategy — Building a Sub-Affiliate Network',
     'Silver tier and above: how to recruit other affiliates and earn from their referrals',
     'article',
     '## Sub-affiliate network (Silver and above)\n\nOnce you reach Silver tier (25 referrals), you unlock the ability to recruit sub-affiliates. When a sub-affiliate earns commission, you earn a percentage of their commission.\n\n**Step 1 — Recruit from your audience**\n\nPeople who have already moved abroad are your best sub-affiliates. They have first-hand experience and credibility.\n\n**Step 2 — Train them**\n\nShare the university modules with them. Walk them through your strategy. The better they perform, the more you earn.\n\n**Step 3 — Revenue share structure**\n\nAt Silver tier, you earn 10% of your sub-affiliates commission. At Gold, 15%. At Platinum, 20%.\n\n**Step 4 — Scale**\n\nYour sub-affiliates can recruit their own sub-affiliates. This creates a pyramid where you earn passive income from the entire network.',
     20, 5, FALSE, 30);
  END IF;
END $$;
