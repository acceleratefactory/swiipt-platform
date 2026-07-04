# Sprint 18 — Complete Unified Build Plan

## Viral Growth Engine, Affiliate University & Career Intelligence Center

**Sources consolidated:**
- `sprint_18_claude_code.md` (main Sprint 18 spec)
- `sprint_16_18_conflict_resolution.md` (conflict resolutions applied)
- `sprint_17_18_priority_order.md` (priority order + dashboard restructure)

**Prerequisite:** Sprints 1–17 complete. All existing functionality intact.

---

## TABLE OF CONTENTS

1. Strategic Overview
2. What Sprint 18 Builds
3. Dashboard Home Restructure
4. Phase A — Foundation (Database)
5. Phase B — Onboarding
6. Phase C — The Feed (Core Product)
7. Phase D — Growth Mechanics
8. Phase E — Admin & Content
9. Phase F — Affiliate University
10. Opportunity Score Update
11. Complete Build Sequence
12. Acceptance Tests

---

## 1. STRATEGIC OVERVIEW

The platform currently converts people who already want to move. That is a small market. The larger market is people who want to move but have not yet decided how, when, or whether they can afford it. These people need a reason to be on Swiipt before they are ready to save or order a service.

The Career Intelligence Center creates that reason. A young Nigerian who dreams of playing football in Europe, a nurse who wants to work in the UK, a developer who wants remote USD work, a student who wants a fully funded scholarship — none of these people are searching for a relocation platform. They are searching for the opportunity itself. When Swiipt surfaces that opportunity and puts it directly in front of them, they are already inside the platform ecosystem. Then the savings goals, the services, the readiness score, and the affiliate engine all work on them.

The invite-to-unlock mechanic has been removed per conflict resolution. Instead of gating content behind invites, the platform uses tier-based tool upgrades — users who refer friends get AI match scores, deadline alerts, employer contacts, and priority matching. All opportunities are visible to every user. The upgrade prompt appears at the moment of maximum engagement (after applying to 3 opportunities), converting far better than artificial scarcity.

The Affiliate University makes the referral program a career, not just a side bonus. When you give affiliates training, tools, templates, and a community, some of them will make this their full-time work.

---

## 2. WHAT SPRINT 18 BUILDS

1. **Career Intelligence Center** — Personalised opportunity feed for job seekers, students, footballers, nurses, freelancers, and other segments. Infinite scroll TikTok-style feed with AnimatedCard entrance animations.

2. **Affiliate University** — Dedicated education portal inside the platform teaching affiliates how to promote Swiipt, with certifications, leaderboards, earnings dashboards, and tools.

3. **Dashboard Home Restructure** — The opportunity feed becomes the primary screen after onboarding. Existing home moves to `/dashboard/home`. Cookie-based middleware routing.

4. **Shareable Achievement Cards** — Every milestone, visa approved, goal completed generates a shareable card designed for WhatsApp, Instagram Stories, and LinkedIn.

5. **Success Stories** — Users who complete services can share their story on the platform, creating social proof for new users.

6. **Viral Referral Campaign Center** — Admin creates campaigns with specific rewards for specific sharing actions. Users see active campaigns in their dashboard.

7. **Boundless Content Linking** — Admin-created opportunities can link to external articles (e.g. Boundless), creating a content-to-opportunity-to-Swiipt conversion loop.

---

## 3. DASHBOARD HOME RESTRUCTURE

### 3.1 The Decision

After Sprint 18 is built, users who have completed career profile onboarding land on `/dashboard/opportunities` — the opportunity feed — not the metrics home. Users who have not completed onboarding land on `/dashboard/opportunities/onboarding`.

### 3.2 The Routing Change

**File:** `src/lib/supabase/middleware.ts`

The cookie-based routing logic must go in `updateSession()`, not in `src/middleware.ts` (which only delegates to this function). Insert the check after the existing suspended-user check (line 52) and before the admin route check (line 55):

```typescript
// After suspended check (~line 52) and before admin route check (~line 55):
if (pathname === "/dashboard") {
  const onboardingComplete = request.cookies.get("swiipt_onboarding_complete");

  if (!onboardingComplete) {
    return NextResponse.redirect(new URL("/dashboard/opportunities/onboarding", request.url));
  } else {
    return NextResponse.redirect(new URL("/dashboard/opportunities", request.url));
  }
}
```

The `pathname` variable is `request.nextUrl.pathname`.

### 3.3 Cookie Set on Onboarding Completion

**File:** `src/app/(dashboard)/dashboard/opportunities/onboarding/page.tsx`

At the end of `handleComplete`:

```typescript
async function handleComplete() {
  // ... existing logic to save career_profiles record ...

  document.cookie = "swiipt_onboarding_complete=1; path=/; max-age=2592000; samesite=lax";
  window.location.href = "/dashboard/opportunities";
}
```

### 3.4 Existing Dashboard Home Move

**New route:** `/dashboard/home`

**File rename:** `src/app/(dashboard)/dashboard/page.tsx` → `src/app/(dashboard)/dashboard/home/page.tsx`

Content stays exactly the same (welcome banner, OpportunityScore widget, achievement cards, campaign banner, active goals summary, recent notifications).

### 3.5 Sidebar Link Update

**File:** `src/components/dashboard/shell/Sidebar.tsx`

```typescript
// Change:
{ href: "/dashboard", label: "Home", icon: "Home" },

// To:
{ href: "/dashboard/home", label: "Home", icon: "Home" },
```

### 3.6 New Navigation Order

**IMPORTANT:** The current sidebar has 15 items (not the 12 documented in older AGENTS.md). Sprint 17 added "My Profile" (index 1), "Certificates" (index 2), and "Find an Agent" (index 11). The following order accounts for the current state.

After the restructure — changes highlighted with `← NEW`:

```
🏠 Home                 → /dashboard/home          (was /dashboard)
🎯 Opportunities        → /dashboard/opportunities  ← NEW (Zap icon, index 1)
👤 My Profile           → /dashboard/profile        (existing, index 2)
📄 Certificates         → /dashboard/profile/certificates (existing, index 3)
💰 My Goals             → /dashboard/goals          (existing, index 4)
🗂️ Services             → /dashboard/services       (existing, index 5)
✈️ Flights              → /dashboard/flights        (existing, index 6)
🏖️ Holidays             → /dashboard/holidays       (existing, index 7)
👥 Groups               → /dashboard/groups         (existing, index 8)
🌍 Trade Shows          → /dashboard/trade-shows    (existing, index 9)
📄 Documents            → /dashboard/documents      (existing, index 10)
🎁 Rewards              → /dashboard/rewards        (existing, index 11)
💸 Earn with Swiipt     → /dashboard/affiliate      ← NEW (DollarSign icon, after Rewards)
💼 Find an Agent        → /dashboard/find-agent     (existing)
👥 Refer & Earn         → /dashboard/refer          (existing)
💬 Community            → /dashboard/community      (existing)
💳 Wallet               → /dashboard/wallet         (existing)
⚙️ Settings             → /dashboard/settings       (existing)
```

Note: The "Home" link href changes from `/dashboard` to `/dashboard/home`. All other existing links keep their current hrefs. The sidebar `navItems` array in `src/components/dashboard/shell/Sidebar.tsx` gains two new entries — insert Opportunities immediately after Home, insert Earn with Swiipt immediately after Rewards.

### 3.7 OpportunityScore in Sidebar

**File:** `src/components/dashboard/shell/Sidebar.tsx`

Add mini OpportunityScore to the bottom of the sidebar above Settings:

```tsx
<div style={{
  padding: "0.75rem 1rem",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  marginTop: "auto",
}}>
  <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
    Opportunity Score
  </p>
  <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)" }}>
    {opportunityCount}
    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 400, marginLeft: "4px" }}>opportunities</span>
  </p>
</div>
```

### 3.8 Dashboard Sidebar — New Nav Items

Add these to `src/components/dashboard/shell/Sidebar.tsx` in the `navItems` array:

```typescript
// After "Home" (/dashboard/home), insert as second item:
{ href: "/dashboard/opportunities", label: "Opportunities", icon: "Zap" },

// After "Rewards" (current index 11), insert "Find an Agent" shifts to index 12, "Refer & Earn" to 13, etc.
{ href: "/dashboard/affiliate", label: "Earn with Swiipt", icon: "DollarSign" },
```

The "Opportunities" link must be the second item (immediately after Home). This is the most important new feature for user activation.

**Import update:** Also add `Zap` and `DollarSign` to the lucide-react import statement in `src/components/dashboard/shell/Sidebar.tsx` line 5-9.

### 3.9 Admin Sidebar — New Nav Items

**IMPORTANT:** The admin sidebar currently has 25 nav items (after Sprint 17 added Certificates and Partners). Insert new items at the correct positions.

Add these to `src/components/admin/shell/AdminSidebar.tsx`:

```typescript
// After "Promotions" (current index 15), insert:
{ href: "/admin/campaigns", label: "Campaigns", icon: "Megaphone" },

// After "Content" (current index 11), insert:
{ href: "/admin/opportunities", label: "Opportunities", icon: "Zap" },
```

Also add `Megaphone` and `Zap` to the second lucide-react import block (lines 5-25) in `src/components/admin/shell/AdminSidebar.tsx` where the other icon imports are.

**Note on admin layout badges:** If you want pending-count badges on the new Campaigns sidebar item, add a campaigns pending count fetch in `src/app/(admin)/layout.tsx` (mirroring the `pendingDeposits`/`pendingWithdrawals` pattern) and pass it through `AdminShell` to `AdminSidebar`. This is optional — badges are not required for the initial build.

### 3.10 Opportunity Count at Top of Feed Page

```tsx
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
  <div>
    <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)" }}>
      Your Opportunities
    </h1>
    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
      {opportunityCount} matched to your profile · Updated today
    </p>
  </div>
  <a href="/dashboard/opportunities/onboarding" style={{ fontSize: "0.8125rem", color: "var(--teal)", textDecoration: "none", fontWeight: 600 }}>
    Update interests →
  </a>
</div>
```

---

## 4. PHASE A — FOUNDATION (DATABASE)

Run in Supabase SQL Editor in this order.

### 4.1 Career Segments Table

```sql
CREATE TABLE IF NOT EXISTS career_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Opportunities Table (WITHOUT gating columns per conflict resolution)

```sql
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_slug TEXT NOT NULL REFERENCES career_segments(slug),
  title TEXT NOT NULL,
  organisation TEXT NOT NULL,
  location_country TEXT NOT NULL,
  location_city TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'job', 'scholarship', 'fellowship', 'visa_programme',
    'sports_trial', 'remote_work', 'internship', 'training', 'grant'
  )),
  description TEXT NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  funding_amount TEXT,
  deadline DATE,
  application_url TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  related_service_slug TEXT,
  related_goal_template_id UUID REFERENCES goal_templates(id),
  source_url TEXT,
  source_name TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_relevance_score INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  apply_click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**NOTE:** The removed columns are `is_free_to_view` and `invites_required` — these were removed per the conflict resolution. No gating columns exist.

### 4.3 User Opportunity Feed Table (WITHOUT is_unlocked per conflict resolution)

```sql
CREATE TABLE IF NOT EXISTS user_opportunity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) NOT NULL,
  relevance_score INTEGER DEFAULT 0,
  is_saved BOOLEAN DEFAULT FALSE,
  is_applied BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,
  saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);
```

### 4.4 Career Profiles Table

```sql
CREATE TABLE IF NOT EXISTS career_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  segment_slug TEXT REFERENCES career_segments(slug),
  -- Job seeker specific
  current_role TEXT,
  years_experience INTEGER,
  highest_qualification TEXT,
  field_of_study TEXT,
  certifications TEXT[],
  desired_roles TEXT[],
  desired_countries TEXT[],
  desired_salary_usd_monthly INTEGER,
  employment_type TEXT[],
  -- Student specific
  current_level TEXT,
  gpa NUMERIC,
  ielts_score NUMERIC,
  gre_score INTEGER,
  study_fields TEXT[],
  target_universities TEXT[],
  scholarship_interest BOOLEAN DEFAULT FALSE,
  -- Sports specific
  sport TEXT,
  position TEXT,
  current_club TEXT,
  target_leagues TEXT[],
  video_url TEXT,
  -- Freelancer specific
  freelancer_platforms TEXT[],
  hourly_rate_usd INTEGER,
  portfolio_url TEXT,
  -- General
  availability TEXT,
  visa_status TEXT,
  passport_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 Users Table — Tier Columns (per conflict resolution)

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'free'
  CHECK (user_tier IN ('free', 'plus', 'pro', 'ambassador'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_unlocked_via TEXT DEFAULT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_unlocked_at TIMESTAMPTZ;
```

### 4.6 Tier Upgrade Function (per conflict resolution)

```sql
CREATE OR REPLACE FUNCTION check_and_upgrade_tier(user_id_input UUID)
RETURNS TEXT AS $$
DECLARE
  referral_count INTEGER;
  current_tier TEXT;
BEGIN
  SELECT user_tier INTO current_tier FROM users WHERE id = user_id_input;
  SELECT COUNT(*) INTO referral_count FROM referrals
    WHERE referrer_id = user_id_input AND status = 'completed';

  IF referral_count >= 10 AND current_tier NOT IN ('pro', 'ambassador') THEN
    UPDATE users SET user_tier = 'pro', tier_unlocked_via = 'referrals', tier_unlocked_at = NOW()
    WHERE id = user_id_input;
    RETURN 'pro';
  ELSIF referral_count >= 3 AND current_tier = 'free' THEN
    UPDATE users SET user_tier = 'plus', tier_unlocked_via = 'referrals', tier_unlocked_at = NOW()
    WHERE id = user_id_input;
    RETURN 'plus';
  END IF;

  RETURN current_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.7 Affiliate Modules Table

```sql
CREATE TABLE IF NOT EXISTS affiliate_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'article', 'quiz', 'template', 'tool')),
  content_url TEXT,
  content_body TEXT,
  duration_minutes INTEGER,
  order_in_course INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT TRUE,
  min_affiliate_tier TEXT DEFAULT 'starter',
  points_on_completion INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.8 Affiliate Module Progress Table

```sql
CREATE TABLE IF NOT EXISTS affiliate_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  module_id UUID REFERENCES affiliate_modules(id) NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);
```

### 4.9 Affiliate Status Table

```sql
CREATE TABLE IF NOT EXISTS affiliate_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  tier TEXT DEFAULT 'starter' CHECK (tier IN ('starter', 'bronze', 'silver', 'gold', 'platinum')),
  tier_upgraded_at TIMESTAMPTZ,
  total_earned_ngn NUMERIC DEFAULT 0,
  pending_earnings_ngn NUMERIC DEFAULT 0,
  withdrawn_earnings_ngn NUMERIC DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  converting_referrals INTEGER DEFAULT 0,
  conversion_rate_pct NUMERIC DEFAULT 0,
  custom_affiliate_code TEXT UNIQUE,
  custom_landing_page_slug TEXT,
  tracking_pixel_code TEXT,
  modules_completed INTEGER DEFAULT 0,
  university_certificate_issued BOOLEAN DEFAULT FALSE,
  monthly_rank INTEGER,
  all_time_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.10 Achievement Cards Table

```sql
CREATE TABLE IF NOT EXISTS achievement_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN (
    'goal_created', 'milestone_25', 'milestone_50', 'milestone_75', 'goal_funded',
    'service_ordered', 'service_completed', 'visa_approved',
    'readiness_score', 'streak_achieved', 'certificate_issued',
    'joined_swiipt', 'first_deposit'
  )),
  title TEXT NOT NULL,
  subtitle TEXT,
  data JSONB NOT NULL,
  image_url TEXT,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.11 Viral Campaigns Table

```sql
CREATE TABLE IF NOT EXISTS viral_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('credits', 'goal_contribution', 'service_discount', 'cash')),
  reward_amount_ngn NUMERIC NOT NULL,
  reward_per_invite BOOLEAN DEFAULT FALSE,
  invites_target INTEGER,
  requires_segment TEXT,
  min_readiness_score INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.12 Campaign Participations Table

```sql
CREATE TABLE IF NOT EXISTS campaign_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES viral_campaigns(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  invites_sent INTEGER DEFAULT 0,
  invites_converted INTEGER DEFAULT 0,
  reward_earned_ngn NUMERIC DEFAULT 0,
  reward_paid BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);
```

### 4.13 Success Stories Table (NEW from priority order doc)

```sql
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  order_id UUID REFERENCES service_orders(id),
  first_name TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  service_completed TEXT NOT NULL,
  journey_duration TEXT,
  approximate_cost_range TEXT,
  hardest_part TEXT,
  advice TEXT,
  photo_url TEXT,
  open_to_contact BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.14 RLS Policies (with drop guards for idempotency)

```sql
ALTER TABLE career_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_opportunity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

-- Public read policies
DROP POLICY IF EXISTS "Anyone reads active career segments" ON career_segments;
CREATE POLICY "Anyone reads active career segments" ON career_segments FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Authenticated users read active opportunities" ON opportunities;
CREATE POLICY "Authenticated users read active opportunities" ON opportunities FOR SELECT USING (is_active = TRUE AND auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Anyone reads active viral campaigns" ON viral_campaigns;
CREATE POLICY "Anyone reads active viral campaigns" ON viral_campaigns FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Anyone reads affiliate modules" ON affiliate_modules;
CREATE POLICY "Anyone reads affiliate modules" ON affiliate_modules FOR SELECT USING (TRUE);

-- User-specific policies
DROP POLICY IF EXISTS "Users read own opportunity feed" ON user_opportunity_feed;
CREATE POLICY "Users read own opportunity feed" ON user_opportunity_feed FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own opportunity feed" ON user_opportunity_feed;
CREATE POLICY "Users manage own opportunity feed" ON user_opportunity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own opportunity feed" ON user_opportunity_feed;
CREATE POLICY "Users update own opportunity feed" ON user_opportunity_feed FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users read own career profile" ON career_profiles;
CREATE POLICY "Users read own career profile" ON career_profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own career profile" ON career_profiles;
CREATE POLICY "Users manage own career profile" ON career_profiles FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users read own module progress" ON affiliate_module_progress;
CREATE POLICY "Users read own module progress" ON affiliate_module_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own module progress" ON affiliate_module_progress;
CREATE POLICY "Users manage own module progress" ON affiliate_module_progress FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users read own affiliate status" ON affiliate_status;
CREATE POLICY "Users read own affiliate status" ON affiliate_status FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users read own achievement cards" ON achievement_cards;
CREATE POLICY "Users read own achievement cards" ON achievement_cards FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users read own campaign participations" ON campaign_participations;
CREATE POLICY "Users read own campaign participations" ON campaign_participations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own stories" ON success_stories;
CREATE POLICY "Users can insert own stories" ON success_stories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Published stories visible to all authenticated users" ON success_stories;
CREATE POLICY "Published stories visible to all authenticated users" ON success_stories FOR SELECT USING (status = 'published' OR auth.uid() = user_id);

-- Admin policies
DROP POLICY IF EXISTS "Admins manage career segments" ON career_segments;
CREATE POLICY "Admins manage career segments" ON career_segments FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins manage opportunities" ON opportunities;
CREATE POLICY "Admins manage opportunities" ON opportunities FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins read all feeds" ON user_opportunity_feed;
CREATE POLICY "Admins read all feeds" ON user_opportunity_feed FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins manage modules" ON affiliate_modules;
CREATE POLICY "Admins manage modules" ON affiliate_modules FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins read all affiliate status" ON affiliate_status;
CREATE POLICY "Admins read all affiliate status" ON affiliate_status FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins manage campaigns" ON viral_campaigns;
CREATE POLICY "Admins manage campaigns" ON viral_campaigns FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins read all participations" ON campaign_participations;
CREATE POLICY "Admins read all participations" ON campaign_participations FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins manage all stories" ON success_stories;
CREATE POLICY "Admins manage all stories" ON success_stories FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
```

### 4.15 Indexes

```sql
CREATE INDEX idx_opportunities_segment ON opportunities(segment_slug, is_active);
CREATE INDEX idx_opportunities_featured ON opportunities(is_featured, is_active);
CREATE INDEX idx_opportunities_type ON opportunities(type, is_active);
CREATE INDEX idx_user_feed_user ON user_opportunity_feed(user_id, is_dismissed);
CREATE INDEX idx_career_profiles_segment ON career_profiles(segment_slug);
CREATE INDEX idx_affiliate_status_tier ON affiliate_status(tier, total_earned_ngn);
CREATE INDEX idx_achievement_cards_user ON achievement_cards(user_id, card_type);
CREATE INDEX idx_campaigns_active ON viral_campaigns(is_active, ends_at);
```

---

## 5. PHASE B — ONBOARDING

### 5.1 Seed Career Segments

```sql
INSERT INTO career_segments (slug, name, description, icon, sort_order) VALUES
('job_seeker', 'Job Seekers', 'International job opportunities matched to your skills and experience', '💼', 1),
('student', 'Students & Scholars', 'Scholarships, fellowships, and fully funded programmes worldwide', '🎓', 2),
('healthcare', 'Healthcare Professionals', 'UK NHS, UAE hospitals, Canadian health systems hiring Nigerian professionals', '🏥', 3),
('tech_professional', 'Tech Professionals', 'Remote and relocation opportunities for developers, designers, and product people', '💻', 4),
('footballer', 'Footballers', 'Trials, academy invitations, and agent representation opportunities in Europe and Asia', '⚽', 5),
('sports_professional', 'Sports Professionals', 'Opportunities for athletes across basketball, athletics, swimming, and other sports', '🏆', 6),
('freelancer', 'Freelancers & Creators', 'High-paying international clients, platforms, and contracts', '🎨', 7),
('entrepreneur', 'Entrepreneurs & SMEs', 'Business expansion, trade missions, and market entry opportunities', '🚀', 8),
('trade_worker', 'Skilled Trade Workers', 'Construction, electrical, plumbing, and other trade opportunities in Europe and Gulf', '🔧', 9),
('caregiver', 'Caregivers & Domestic Workers', 'Legal caregiver and domestic worker placements in the UK, Canada, and UAE', '❤️', 10)
ON CONFLICT (slug) DO NOTHING;
```

### 5.2 Onboarding Page — File Structure

```
src/app/(dashboard)/dashboard/opportunities/onboarding/
  page.tsx              ← 4-step onboarding flow server component
```

### 5.3 Onboarding Flow (4 steps)

**Step 1 — Segment Selection:** Full-screen step. Header: "What describes you best?" Subtitle: "We will personalise your opportunity feed." Show 10 segment cards from career_segments. Each card has icon, name, description. User picks one.

**Step 2 — Quick Profile (varies by segment):**

- `job_seeker`: current role (text), years experience (number), highest qualification (select: SSCE | OND | HND | BSc | MSc | MBA | PhD), desired roles (tag input, up to 5), desired countries (multi-select checkboxes: UK | Canada | UAE | Germany | Netherlands | Australia | USA | Remote)
- `student`: current level (select), field of study (text), IELTS score (number or "not yet taken"), target countries, scholarship interest (yes/no)
- `footballer`: position (select: GK | CB | LB | RB | CDM | CM | CAM | LW | RW | ST), age (number), current club (text, optional), video URL (text, optional)
- `healthcare`: current role (select: RN | Doctor | Pharmacist | Physiotherapist | Lab Scientist | Other), years experience, IELTS score, NMC registered (yes/no/in-progress)
- `tech_professional`: primary skill (select), years experience, GitHub URL, employment preference
- `freelancer`: primary platform (multi-select), hourly rate range
- `entrepreneur`: business type (text), years trading, export interest (yes/no), trade show interest (yes/no)

**Step 3 — Passport & Visa Status:** Passport status (No passport yet | Applied but not received | Valid passport). IELTS status (Not taken | Score under 6 | Score 6.0-6.5 | Score 7.0+ | Not applicable). Timeline (3-6 months | 6-12 months | 1-2 years | Just exploring).

**Step 4 — Swiipt Goals Connection:** "Based on your profile, here is what we recommend you save toward:" Show 2-3 matching goal templates. Each with Start this goal → or Skip for now.

**On completion:** Create `career_profiles` record, call `/api/opportunities/feed` to generate first feed, set `swiipt_onboarding_complete` cookie, redirect to `/dashboard/opportunities`.

---

## 6. PHASE C — THE FEED (CORE PRODUCT)

### 6.1 Seed Opportunities (idempotent — skips if any seed opportunities exist)

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM opportunities WHERE type IN ('job', 'scholarship', 'fellowship', 'visa_programme', 'sports_trial', 'remote_work', 'internship', 'training', 'grant') LIMIT 1) THEN
    INSERT INTO opportunities (
  segment_slug, title, organisation, location_country, location_city,
  type, description, requirements, salary_range, deadline, application_url,
  is_featured, related_service_slug, ai_generated, source_name
) VALUES

-- Job seeker opportunities
('job_seeker', 'Software Engineer — Remote (USD Payroll)', 'Andela', 'USA', 'Remote',
 'job', 'Andela places African engineers in senior engineering roles at top US and European companies. Fully remote, USD payroll, benefits included.',
 'Minimum 3 years professional software engineering experience. Strong English communication. Portfolio required.',
 '$3,000–$8,000/month USD', '2026-09-30', 'https://andela.com/join-network',
 TRUE, 'uk-company-registration', FALSE, 'Andela'),

('job_seeker', 'Germany Opportunity Card — IT Professionals', 'Federal Employment Agency Germany', 'Germany', 'Multiple cities',
 'visa_programme', 'The Germany Chancenkarte (Opportunity Card) allows qualified IT professionals to live in Germany for 12 months while searching for employment. No job offer required.',
 'University degree in a STEM field. Minimum 60 months of relevant work experience OR degree with 3+ years experience. B1 German recommended but not required.',
 '€45,000–€80,000/year on placement', '2026-12-31', 'https://www.make-it-in-germany.com/en/visa-residence/types/opportunity-card',
 TRUE, 'germany-job-seeker-visa', FALSE, 'Make it in Germany'),

('job_seeker', 'UK Health and Care Worker Visa — Nurses Urgently Needed', 'NHS England', 'UK', 'Multiple NHS Trusts',
 'job', 'NHS Trusts across England are actively recruiting internationally trained nurses. Many trusts cover visa fees and offer relocation packages.',
 'Valid nursing degree. Current registration with NMCN. IELTS Academic 7.0+ in all components or OET B+. Active NMC registration or ability to obtain.',
 '£28,407–£34,581/year starting (Band 5)', '2026-12-31', 'https://www.nhscareers.nhs.uk',
 TRUE, 'uk-healthcare-nursing-jobs', FALSE, 'NHS England'),

('job_seeker', 'UAE Golden Visa — Professionals with Exceptional Talent', 'UAE GDRFA', 'UAE', 'Dubai / Abu Dhabi',
 'visa_programme', 'The UAE Golden Visa is available to professionals with exceptional talent in sciences, arts, and sports. 10-year renewable residency with no employer sponsorship required.',
 'Recognition from a relevant UAE authority or accredited organisation.',
 'Not salary-based — residency permit without employer tie', NULL, 'https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa',
 TRUE, 'uae-dubai-residency', FALSE, 'UAE Government'),

-- Student opportunities
('student', 'Fully Funded Masters Scholarships — Germany (DAAD)', 'DAAD — German Academic Exchange Service', 'Germany', 'Multiple Universities',
 'scholarship', 'DAAD offers hundreds of fully funded scholarships for Nigerians to study in Germany. Covers tuition, living costs, health insurance, and flights.',
 'First degree with minimum Second Class Upper (2:1). 2 years relevant professional experience for most programmes. IELTS 6.5+ or TestDaF.',
 'Full tuition + €934/month stipend + health insurance + flights', '2027-01-31', 'https://www.daad.de/en/study-and-research-in-germany/scholarships',
 TRUE, 'germany-job-seeker-visa', FALSE, 'DAAD'),

('student', 'Chevening Scholarship — UK Government Full Funding', 'UK Foreign Commonwealth & Development Office', 'UK', 'Multiple Universities',
 'scholarship', 'Chevening is the UK Government flagship scholarship programme. Fully funded one-year Masters at any UK university. 1,500+ scholarships awarded annually.',
 'Undergraduate degree equivalent to UK 2:1. 2 years work experience. Leadership potential. English language requirement. Nigerian nationality.',
 'Full tuition + £1,393/month + flights + visa fee + thesis grant', '2026-11-05', 'https://www.chevening.org/scholarships/who-can-apply/nigeria',
 TRUE, 'uk-skilled-worker', FALSE, 'Chevening'),

('student', 'Commonwealth Masters and PhD Scholarships 2027', 'Commonwealth Scholarship Commission', 'UK', 'Multiple Universities',
 'scholarship', 'Commonwealth Shared Scholarships for high-achieving Nigerians at UK universities.',
 'Nigerian citizenship. First degree with minimum 2:1. Demonstrated need and development impact of study.',
 'Full tuition + £1,393/month + airfare + thesis allowance', '2026-12-19', 'https://cscuk.fcdo.gov.uk',
 FALSE, NULL, FALSE, 'Commonwealth Scholarship Commission'),

('student', 'Canadian Government Scholarships — Vanier Canada Graduate', 'Government of Canada', 'Canada', 'Multiple Universities',
 'scholarship', 'The Vanier Canada Graduate Scholarships Programme is awarded to doctoral students who demonstrate leadership skills.',
 'PhD enrolment at a Canadian university. Nominated by the institution. Exceptional academic achievement and leadership.',
 'CAD 50,000/year for 3 years', '2026-11-01', 'https://vanier.gc.ca',
 FALSE, 'canada-express-entry', FALSE, 'Government of Canada'),

-- Football opportunities
('footballer', 'Open Trials — FC Nordsjaelland Right to Dream Academy', 'Right to Dream / FC Nordsjaelland', 'Denmark', 'Copenhagen',
 'sports_trial', 'Right to Dream runs the most successful African player pathway to European professional football. Open trials for ages 13-19 in Nigeria twice a year.',
 'Ages 13-19. Outstanding football ability. Academic willingness. Character and resilience as important as technical ability.',
 'Full scholarship if accepted. Pathway to professional contract.', '2026-08-15', 'https://www.righttodream.com',
 TRUE, 'uk-student-proof-of-funds', FALSE, 'Right to Dream'),

('footballer', 'Professional Trials — Swedish Allsvenskan Clubs', 'Football Agent Network Scandinavia', 'Sweden', 'Stockholm / Gothenburg',
 'sports_trial', 'Agent-coordinated trials with 6 clubs in the Swedish Allsvenskan (top division) for attacking midfielders and strikers aged 18-26.',
 'Ages 18-26. Verifiable playing history at semi-professional or professional level in Nigeria. Valid international passport.',
 'Contract negotiable — typically €800–€2,500/month + accommodation', '2026-09-30', '#',
 FALSE, 'uae-dubai-residency', FALSE, 'Swiipt Curated'),

-- Healthcare
('healthcare', 'Canada Express Entry — Healthcare Professionals Priority Draw', 'IRCC Canada', 'Canada', 'Multiple Provinces',
 'visa_programme', 'Canada runs dedicated Express Entry draws for healthcare workers including nurses, doctors, physiotherapists, pharmacists, and medical laboratory scientists.',
 'Completed Canadian credential recognition (NNAS for nurses, MCC for doctors). Valid registration with provincial college. IELTS CLB 7+.',
 'Healthcare salary in Canada: CAD 60,000–$140,000/year depending on role', NULL, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html',
 TRUE, 'canada-express-entry', FALSE, 'IRCC'),

('healthcare', 'UAE Private Hospital Nurse Recruitment — Multiple Hospitals', 'NurseConnect UAE', 'UAE', 'Dubai / Abu Dhabi / Sharjah',
 'job', 'Private hospitals across the UAE are actively recruiting Nigerian and African nurses.',
 'Valid nursing degree. Current NMCN registration. Minimum 2 years clinical experience. IELTS 6.0+. Police clearance.',
 'AED 5,000–12,000/month + accommodation or accommodation allowance + annual flight', '2026-10-31', '#',
 TRUE, 'qatar-work-visa', FALSE, 'Swiipt Curated'),

-- Tech professional
('tech_professional', 'Remote Senior Developer — European Startups (EUR Payroll)', 'Remotely', 'Multiple', 'Remote',
 'remote_work', 'Remotely places senior African developers at funded European startups. Fully remote, EUR payroll via your UK company, equity options available.',
 'Minimum 5 years professional development experience. Strong portfolio. Senior-level skills in React, Python, Node, or Go. Excellent English.',
 '€4,000–€9,000/month', NULL, 'https://remotely.works',
 TRUE, 'uk-company-registration', FALSE, 'Remotely'),

('tech_professional', 'Toptal Freelance Network — Top 3% of Tech Talent', 'Toptal', 'Global', 'Remote',
 'remote_work', 'Toptal accepts the top 3% of freelance tech talent globally. Once accepted, you access high-paying clients including Fortune 500 companies.',
 'Senior-level technical skills. Strong communication. Portfolio of production-level work. Ability to pass Toptal screening process.',
 '$60–$200/hour USD', NULL, 'https://www.toptal.com',
 FALSE, 'uk-company-registration', FALSE, 'Toptal'),

-- Freelancer
('freelancer', 'Upwork Top Rated Plus — Guidance and Profile Optimisation', 'Upwork', 'Global', 'Remote',
 'training', 'A guided programme to reach Upwork Top Rated Plus status — the threshold that unlocks Enterprise-level clients and significantly higher earnings.',
 'Active Upwork account. Willingness to complete profile optimisation steps. UK company or US LLC for payment.',
 '$30–$150/hour once Top Rated achieved', NULL, 'https://www.upwork.com',
 FALSE, 'uk-company-registration', FALSE, 'Swiipt Curated'),

-- Entrepreneur
('entrepreneur', 'Canton Fair October 2026 — Group Mission Available', 'Swiipt Trade Missions', 'China', 'Guangzhou',
 'training', 'Join Swiipt''s curated Nigerian SME delegation to the Canton Fair October 2026. Group visa processing, group hotel rates, sourcing agent, and post-fair freight support.',
 'Registered Nigerian business. CAC documents. Minimum $3,000 sourcing budget. Valid international passport.',
 'Trip cost: ₦850,000 per person in group (solo: ₦1,100,000)', '2026-09-01', '#',
 TRUE, 'canton-fair-china-sourcing', FALSE, 'Swiipt'),

-- Trade worker
('trade_worker', 'UK Skilled Worker Visa — Shortage Occupations', 'UK Home Office', 'UK', 'Multiple Cities',
 'visa_programme', 'The UK Shortage Occupation List includes electricians, plumbers, welders, HGV drivers, and construction workers. These roles qualify for a Skilled Worker visa at reduced salary thresholds.',
 'Recognised trade qualification or equivalent experience. Job offer from a UK employer with a sponsorship licence.',
 '£28,000–£45,000/year depending on trade', NULL, 'https://www.gov.uk/skilled-worker-visa',
  FALSE, 'uk-skilled-worker', FALSE, 'UK Home Office');
  END IF;
END $$;
```

### 6.2 File Structure

```
src/
  app/
    (dashboard)/
      dashboard/
        opportunities/
          page.tsx                        ← Main opportunities feed
          [opportunityId]/
            page.tsx                      ← Opportunity detail
    api/
      opportunities/
        feed/
          route.ts                        ← Generate personalised feed
        save/
          route.ts                        ← Save opportunity
        track/
          route.ts                        ← Track apply click
        refresh/
          route.ts                        ← AI refresh feed
  components/
    dashboard/
      opportunities/
        OpportunityFeed.tsx               ← Infinite scroll feed
        OpportunityCard.tsx               ← Full card with all features
        OpportunityFilters.tsx            ← Filter bar
        SegmentSelector.tsx               ← Segment picker component
```

### 6.3 Feed Generation API

**File:** `src/app/api/opportunities/feed/route.ts`

Process:
1. Get user auth
2. Fetch career profile
3. Get all active opportunities for user's segment
4. Score each opportunity (base 50, +20 if featured, +15 if country match, +10 if employment type match, +15 if scholarship interest matches)
5. Return all opportunities (no gating, no filtering by is_free_to_view or invites_required)
6. Include `userTier` in response
7. Upsert feed records to `user_opportunity_feed`

```typescript
// Response shape:
{
  feed: ScoredOpportunity[],
  userReferrals: number,
  userTier: "free" | "plus" | "pro" | "ambassador",
  segmentSlug: string,
}
```

### 6.4 OpportunityFeed Component (Infinite Scroll)

**File:** `src/components/dashboard/opportunities/OpportunityFeed.tsx`

Key features:
- Cards load 10 at a time as user scrolls (IntersectionObserver)
- Cards appear with fade-up entrance animation (`AnimatedCard` wrapper) — IntersectionObserver triggers opacity 0→1 + translateY(16px→0) with staggered delay per card. Defined inline in the same file as a helper component.
- "Featured" card at every 5th position — renders the #1 highest-match opportunity inside a midnight gradient container with "⭐ Top match for your profile" label
- "New this morning" section at top when opportunities added in last 24h
- Single-column on mobile, two-column on desktop
- End-of-feed message: "You have seen all X opportunities" + "Refresh for new matches" button
- Upgrade prompt appears after user clicks Apply on 3 opportunities in one session (if user tier is "free")

### 6.5 OpportunityCard Component

**File:** `src/components/dashboard/opportunities/OpportunityCard.tsx`

Full card specification:
- Org avatar (first letter in coloured circle)
- Title + organisation
- Country flag emoji + location
- Type badge (colour-coded: job=blue, scholarship=purple, visa=teal, trial=orange)
- Deadline badge (⏰ Xd left, red if ≤7 days, amber if ≤14 days)
- AI match badge (only if user tier is plus/pro/ambassador) — uses plain signal labels instead of raw percentage:
  - Score ≥ 80 → "Excellent match" (teal badge)
  - Score 50–79 → "Good match" (blue badge)
  - Score < 50 → "Fair match" (amber badge)
  - Never shows raw number (e.g. "94% match")
- Salary/funding amount (prominent, teal, Cabinet Grotesk)
- Description preview (2 lines, truncated)
- Save button (📌/🔖 toggle)
- Apply now → button (tracks click, opens application URL)
- "Need visa?" related service upsell — if `opportunity.related_service_slug` is set, render a clickable chip at card bottom: "🛂 Need a {service_name} visa? We can help →" linking to `/services/{related_service_slug}`. Resolve `related_service_slug` to a display name via lookup in the component or pass from server.
- Share button (Web Share API with clipboard fallback)
- Share prompt after apply (appears 2s later, WhatsApp + Skip buttons)
- **Boundless source link** at bottom (if source_url and source_name exist):
  ```
  📖 Read the full guide on {source_name} →
  ```

### 6.6 Save API

**File:** `src/app/api/opportunities/save/route.ts`

```typescript
POST /api/opportunities/save
Body: { opportunityId }
Action: Upserts user_opportunity_feed with is_saved = true
```

### 6.7 Track API

**File:** `src/app/api/opportunities/track/route.ts`

```typescript
POST /api/opportunities/track
Body: { opportunityId, action: "apply" | "view" }
Action: Increments apply_click_count or view_count on opportunities table
```

### 6.8 Upgrade Prompt in Feed

After user clicks Apply on 3 opportunities in one session (tracked in component state), show a dark upgrade banner with:
- "Upgrade your access" header
- "Get AI match scores, deadline alerts & priority opportunities"
- "Refer 3 friends to unlock Plus tier free"
- "Share my referral link" button (copies link)

**Note:** Per conflict resolution, the subscription option ("or subscribe for ₦5,000/month") was removed. The upgrade prompt is referral-only — no payment wall. See sprint_16_18_conflict_resolution.md Conflict 2.

### 6.9 Opportunities Page (Server Component)

**File:** `src/app/(dashboard)/dashboard/opportunities/page.tsx`

Server component that fetches user profile, career segment, all active opportunities, and existing feed state. Filters opportunities to match user's segment, scores and sorts by relevance, and passes to `OpportunityFeed`.

**Header display:** Shows `{opportunityCount} matched to your profile · Updated today` with an "Update interests →" link back to onboarding.

---

## 7. PHASE D — GROWTH MECHANICS

### 7.1 Achievement Cards

**File:** `src/app/api/achievements/generate-card/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { userId, cardType, data } = await request.json();

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cardTitles: Record<string, (data: any) => string> = {
    goal_created: (d) => `I started saving toward ${d.goalName}`,
    milestone_25: (d) => `25% funded — ${d.goalName}`,
    milestone_50: (d) => `Halfway there — ${d.goalName}`,
    milestone_75: (d) => `75% funded — almost ready to move!`,
    goal_funded: (d) => `${d.goalName} — fully funded!`,
    service_ordered: (d) => `My ${d.serviceName} application has started`,
    service_completed: (d) => `I just completed my ${d.serviceName} 🎉`,
    visa_approved: (d) => `Visa approved — I'm moving to ${d.destination}`,
    certificate_issued: (d) => `I just got my Swiipt ${d.certificateType}`,
    joined_swiipt: () => `I just joined Swiipt — planning my move abroad`,
    readiness_score: (d) => `My relocation readiness score is ${d.score}/100`,
  };

  const titleFn = cardTitles[cardType];
  if (!titleFn) return NextResponse.json({ error: "Unknown card type" }, { status: 400 });

  const title = titleFn(data);
  const subtitle = data.subtitle || "Swiipt — Plan, fund, and execute your global move";

  const { data: card } = await adminSupabase
    .from("achievement_cards")
    .insert({ user_id: userId, card_type: cardType, title, subtitle, data })
    .select()
    .single();

  return NextResponse.json({ card });
}
```

**Trigger events — add card generation at these existing points:**

1. **Goal created** — in `src/components/dashboard/goals/CreateGoalForm.tsx` (fire-and-forget after `INSERT` succeeds in `handleCreateGoal`, before `router.push`)
2. **25% / 50% / 75% milestones** — in the deposit confirmed flow or `confirm_deposit` RPC
3. **Goal fully funded** — same deposit confirmed flow
4. **Service ordered** — in `src/app/api/services/order/route.ts`
5. **Service completed** — in `src/app/api/admin/orders/update-status/route.ts` (see trigger below)
6. **Certificate issued** — in proof-of-funds and trust certificate routes
7. **Signup** — in the auth callback route (`/auth/callback`) after the user is confirmed. The existing `handle_new_user()` DB trigger (which runs on every `auth.users` insert) cannot make HTTP requests. Generate the card client-side after the signup flow redirects, or via a fire-and-forget `fetch()` in the auth callback server route using `process.env.NEXT_PUBLIC_APP_URL`.

Each trigger fires a fire-and-forget POST to `/api/achievements/generate-card` with the appropriate cardType and data payload.

**Example trigger on order completion:**

**File:** `src/app/api/admin/orders/update-status/route.ts`

After order is marked as completed:
```typescript
if (newStatus === "completed") {
  fetch("/api/achievements/generate-card", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify({
      userId: order.user_id,
      cardType: "service_completed",
      data: {
        serviceName: (order.service_packages as any)?.name || "your service",
        destination: (order.service_packages as any)?.destination || "",
        subtitle: "Swiipt — Plan, fund, and execute your global move",
      },
    }),
  }).catch(() => {});
}
```

Other triggers follow the same pattern with fitting cardType and data fields.

**Achievement Card Display**

**File:** `src/components/dashboard/home/AchievementCardSection.tsx`

Shown on `/dashboard/home` after the OpportunityScore widget. Shows the 3 most recent unshared achievement cards.

Each card is a stylised box:
- Dark navy background with teal accent
- Swiipt logo small at top right
- Large emoji representing the achievement
- Title text (e.g. "Goal fully funded!")
- Subtitle
- "Share on WhatsApp" button
- "Share on Instagram" button (downloads 1080×1080 PNG via Canvas API)
- "Dismiss" button

**WhatsApp share text for achievement cards:**
```
[title]

I'm using @Swiipt to plan my move abroad. Planning your move too?
Sign up with my link and get a free Qatar visa credit:
swiipt.com/signup?ref=[referralCode]
```

**Instagram share** downloads a 1080×1080 PNG generated via Canvas API (same approach as affiliate tools image generator — see section 9.6).

### 7.2 SuccessStoryPrompt Component

**File:** `src/components/dashboard/home/SuccessStoryPrompt.tsx`

Shown on `/dashboard/home` when:
- User has a completed service order
- User has not yet submitted a success story
- User has not dismissed the prompt

Dark gradient card with teal accent. "Share my story →" button opens `SuccessStoryForm`. Dismissed via sessionStorage "Maybe later".

### 7.3 SuccessStoryForm Component

**File:** `src/components/dashboard/home/SuccessStoryForm.tsx`

Modal form fields:
- Photo (optional, file upload)
- Country moved to (pre-filled from order)
- Journey duration (dropdown: under 3 months, 3-6 months, 6-12 months, over 12 months)
- Total approximate cost (₦ range dropdown)
- Hardest part (textarea, max 200 chars)
- Advice for someone starting now (textarea, max 300 chars)
- Open to being contacted by other Swiipt users (checkbox)

On submit: POST to `/api/success-stories/submit`, creates `success_stories` record, generates achievement card, sends admin notification.

### 7.4 Success Stories Submit API

**File:** `src/app/api/success-stories/submit/route.ts`

Creates `success_stories` record with status = 'pending'.

### 7.5 Viral Campaign Admin

**File:** `src/app/(admin)/admin/campaigns/page.tsx` — Campaign list
**File:** `src/app/(admin)/admin/campaigns/new/page.tsx` — Create campaign form

Fully specified in Sprint 18. Build as written.

### 7.6 CampaignBanner Component

**File:** `src/components/dashboard/home/CampaignBanner.tsx`

Shown on `/dashboard/home`. Fetches active campaigns, renders a banner for each with reward details and CTA to participate.

---

## 8. PHASE E — ADMIN & CONTENT

### 8.1 Opportunity Admin Pages

**File:** `src/app/(admin)/admin/opportunities/page.tsx` — List with toggle active
**File:** `src/app/(admin)/admin/opportunities/new/page.tsx` — Create form
**File:** `src/app/(admin)/admin/opportunities/[id]/page.tsx` — Edit form with stats

All fields from `opportunities` table editable. Stats show view_count and apply_click_count.

### 8.2 Boundless Source Link in Card

Already in the card spec (section 6.5 — Boundless source link at bottom). No additional build needed.

### 8.3 AI Opportunity Refresh

**File:** `src/app/api/opportunities/refresh/route.ts`

Daily cron endpoint that uses `ANTHROPIC_API_KEY` to AI-source new opportunities from the web.

Before inserting each AI-sourced opportunity, run two deterministic pre-checks:

1. **Dead-link check** — `fetch(application_url, { method: "HEAD" })` must return a 2xx status. If the link is dead (4xx/5xx), skip the opportunity. This prevents broken links from reaching users.

2. **Deadline-in-future check** — if `deadline` is set, it must be in the future (`new Date(deadline) > new Date()`). If the deadline has already passed, skip the opportunity.

Both checks run per opportunity. Opportunities that fail either check are discarded with a log entry. Only opportunities that pass both checks are inserted into the database.

**Anthropic API prompt** (called for each segment with fewer than 15 active opportunities):
```
Generate 3 real, current international opportunities for Nigerian [segment_name].
Each opportunity should include: title, organisation, location, type, description (100 words),
requirements, salary or funding amount, application URL (real URL if known, # if uncertain),
whether it is currently open.
Return JSON array with these fields: title, organisation, location_country, location_city,
type, description, requirements, salary_range, application_url, is_featured.
```

Parse response, run dead-link and deadline checks, insert with `ai_generated = TRUE`. Mark old AI-generated opportunities as inactive if they have zero views in 30 days.

**pg_cron job setup** (dropped first for idempotency, runs daily at 6am):
```sql
SELECT cron.unschedule('refresh-opportunities');

SELECT cron.schedule(
  'refresh-opportunities',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://swiipt.com/api/opportunities/refresh',
    headers := '{"x-internal-secret":"YOUR_SECRET"}',
    body := '{}'
  )
  $$
);
```

**Prerequisites in Supabase:** This requires two extensions to be enabled:
- `pg_cron` extension (for scheduling)
- `pg_net` extension (for `net.http_post`)

Run in Supabase SQL Editor to verify:
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```
If either is missing, enable via Supabase Dashboard → Database → Extensions.

**Environment variables needed:**
- `ANTHROPIC_API_KEY` — for AI-sourced opportunities
- `INTERNAL_API_SECRET` — for securing the cron endpoint

---

## 9. PHASE F — AFFILIATE UNIVERSITY

### 9.1 File Structure

```
src/
  app/
    (dashboard)/
      dashboard/
        affiliate/
          page.tsx                        ← Affiliate hub
          university/
            page.tsx                      ← Course list
            [moduleId]/
              page.tsx                    ← Individual module
          earnings/
            page.tsx                      ← Earnings dashboard
          tools/
            page.tsx                      ← Marketing tools
          leaderboard/
            page.tsx                      ← Top affiliates
    api/
      affiliate/
        complete-module/
          route.ts
        upgrade-tier/
          route.ts
        withdraw/
          route.ts
  components/
    dashboard/
      affiliate/
        AffiliateHub.tsx
        UniversityModuleCard.tsx
        EarningsDashboard.tsx
        AffiliateTools.tsx
        AffiliateTierBadge.tsx
        AffiliateLeaderboard.tsx
```

### 9.2 Affiliate Hub Page

**File:** `src/app/(dashboard)/dashboard/affiliate/page.tsx`

Four sections:
1. **Your Affiliate Status** — Tier badge, total earned, pending earnings, conversion rate, monthly rank. Tier progression bar: Starter → Bronze → Silver → Gold → Platinum
2. **Your Affiliate Links and Tools** — Copy referral link, QR code, WhatsApp share button, message templates
3. **Pending Earnings** — Table of pending commissions
4. **Quick Stats** — Clicks this month, signups this month, orders this month, earnings this month

### 9.3 Tier Benefits Table

| Tier | Referrals needed | Commission % | Bonus features |
|------|-----------------|--------------|----------------|
| Starter | 0 | 5% | Basic tools, university access |
| Bronze | 10 | 7% | Custom landing page |
| Silver | 25 | 8% | Priority support, sub-affiliate tracking |
| Gold | 50 | 10% | Cash withdrawal from day 1, dedicated manager |
| Platinum | 100 | 12% | Revenue share on sub-affiliates, co-marketing |

### 9.4 Affiliate University

**File:** `src/app/(dashboard)/dashboard/affiliate/university/page.tsx` — Server component. Fetches all modules + user progress.

**File:** `src/components/dashboard/affiliate/UniversityModuleCard.tsx` — Card shows: number, title, type, duration, points, locked/unlocked/completed.

### 9.5 Seed Affiliate Modules

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM affiliate_modules LIMIT 1) THEN
    INSERT INTO affiliate_modules (title, subtitle, content_type, content_body, duration_minutes, order_in_course, is_free, points_on_completion) VALUES

('Why Swiipt Affiliates Earn More Than Traditional Referrers',
 'Understanding the platform, the market, and why now is the best time to promote Swiipt',
 'article',
 '## The opportunity\n\nThe Nigerian relocation market processes billions of naira in transactions every year...\n\n## Why the commission is high\n\nSwiipt charges ₦850,000–₦2,500,000 per service order. At 5% commission, one converting referral earns you ₦42,500–₦125,000...',
 15, 1, TRUE, 20),

('Your First 10 Referrals — The Fastest Path to Bronze Tier',
 'Practical tactics to get your first 10 converting referrals within 30 days',
 'article',
 '## The fastest path to 10 referrals\n\nYour first 10 referrals do not come from strangers on the internet...\n\n**Step 1 — Make a list of 30 people**...',
 20, 2, TRUE, 20),

('WhatsApp is Your Biggest Affiliate Asset — Here is How to Use It',
 'Nigeria runs on WhatsApp. Every affiliate strategy must start here.',
 'article',
 '## WhatsApp affiliate strategy\n\n**Step 1 — Status posts (the highest-leverage action)**...',
 25, 3, TRUE, 25),

('Content Templates — Copy, Paste, Send',
 'Ready-to-use WhatsApp statuses, tweets, and Instagram captions',
 'template',
 '## WhatsApp Status Templates\n\n**Status 1 — Scholarship angle**\n...',
 10, 4, TRUE, 15),

  ('Advanced Strategy — Building a Sub-Affiliate Network',
  'Silver tier and above: how to recruit other affiliates and earn from their referrals',
  'article',
  '## Sub-affiliate network (Silver and above)\n\nOnce you reach Silver tier (25 referrals), you unlock the ability to recruit sub-affiliates...',
  20, 5, FALSE, 30);
  END IF;
END $$;
```

(Full content_body text available in sprint_18_claude_code.md — includes complete WhatsApp templates, Instagram captions, DM templates, and sub-affiliate strategy.)

### 9.6 Affiliate Tools Page

**File:** `src/app/(dashboard)/dashboard/affiliate/tools/page.tsx`

**Tool 1 — Link Generator:**
- Input: destination URL on Swiipt (e.g. `/move/uae-dubai-residency`)
- Output: full referral URL with user's code appended
- Copy button + QR code rendered in-browser

**Install:** `npm install qrcode.react`

**Tool 2 — WhatsApp Message Generator:**
- User selects a service type
- Platform generates a pre-written WhatsApp message for that service with their referral link embedded
- One-click copy

**Tool 3 — Share Image Generator (Canvas API):**
- User selects a template (e.g. "I'm moving to Canada", "Find international scholarships", "Register your UK company")
- Canvas renders 1080×1080 PNG in-browser with user's name, readiness score, and referral code
- User downloads and shares on Instagram/WhatsApp

```typescript
function generateShareImage(
  template: string,
  userName: string,
  score: number,
  referralCode: string
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#06112B";
  ctx.fillRect(0, 0, 1080, 1080);

  // Teal accent bar at top
  ctx.fillStyle = "#00C896";
  ctx.fillRect(0, 0, 1080, 8);

  // Swiipt logo text
  ctx.font = "bold 48px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Swiipt", 80, 100);

  // Template text
  ctx.font = "bold 64px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(template, 80, 240);

  // User info
  ctx.font = "36px Arial";
  ctx.fillStyle = "#B8C0CF";
  ctx.fillText(`${userName} · Readiness Score: ${score}/100`, 80, 340);

  // Referral CTA
  ctx.font = "bold 42px Arial";
  ctx.fillStyle = "#00C896";
  ctx.fillText(`Join me: swiipt.com/signup?ref=${referralCode}`, 80, 900);

  return canvas.toDataURL("image/png");
}
```

---

## 10. OPPORTUNITY SCORE UPDATE

### 10.1 Replace Formula with Real Count

**File:** `src/app/(dashboard)/dashboard/home/page.tsx`

Add to the server component data fetches:

```typescript
const supabase = createClient();

const { count: opportunityCount } = await supabase
  .from("user_opportunity_feed")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id)
  .eq("is_dismissed", false);
```

### 10.2 Update OpportunityScore Component

**File:** `src/components/dashboard/home/OpportunityScore.tsx`

```typescript
interface OpportunityScoreProps {
  score: number;
  opportunityCount: number;  // real count from Sprint 18 onward
  destination: string | null;
  userId: string;
}
```

Primary display changes from formula to real count:
```tsx
<span style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.875rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
  {opportunityCount}
</span>
<span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>opportunities</span>
```

The circular progress ring continues to use the 0-100 readiness score for the visual. The number in the centre changes from the formula to the real opportunity count from `user_opportunity_feed`.

### 10.3 Upgrade Path Reference (from AGENTS.md)

The old Sprint 16 `getOpportunityCount()` used a temporary formula:
```typescript
// REMOVED in Sprint 18:
// return Math.round((score / 100) * 35);
```

This is replaced by the real DB query in section 10.1. The `is_unlocked` filter mentioned in the original upgrade path was removed per the conflict resolution (see section 4.3 — no gating). The final query uses `is_dismissed` only:

```typescript
const { count } = await supabase
  .from("user_opportunity_feed")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId)
  .eq("is_dismissed", false);
return count || 0;
```

**Actual implementation:** Added `feedCountRes` query to `/dashboard/home/page.tsx` (line 23), passes `opportunityCount={opportunityCount}` to `OpportunityScore` component. The component now shows the real count from the database in the centre of the SVG circle and in the "You qualify for X opportunities today" text. The `getOpportunityCount()` formula function was removed from `OpportunityScore.tsx`.

**Zero rework.** The component name, file path, display framing, and prop interface all stayed the same. Only the data source changed.

---

## 11. COMPLETE BUILD SEQUENCE

Build in this exact order. Do not start a phase until the previous one is working and tested.

```
PHASE A — Foundation (Database)
  ├── Run all SQL in order: 4.1 through 4.15
  ├── Seed career segments (5.1)
  ├── Run check_and_upgrade_tier function (4.6)
  ├── Update `src/types/database.ts`: add all 11 new Sprint 18 table types + `users.user_tier`/`tier_unlocked_via`/`tier_unlocked_at` columns + `check_and_upgrade_tier` RPC
  └── Verify all tables created, RLS enabled, indexes created

PHASE B — Onboarding (required before feed)
  ├── Cookie-based middleware redirect (3.2)
  ├── Dashboard home page move (3.4)
  ├── Sidebar "Home" link update (3.5)
  ├── Dashboard sidebar: add "Opportunities" (Zap, second item) + "Earn with Swiipt" (DollarSign, after Rewards) (3.8)
  ├── Admin sidebar: add "Campaigns" (Megaphone) + "Opportunities" (Zap) (3.9)
  ├── Career profile onboarding page (5.2-5.3)
  │   ├── Step 1: Segment selection
  │   ├── Step 2: Dynamic profile form by segment
  │   ├── Step 3: Passport & visa status
  │   └── Step 4: Goal template recommendations + handleComplete
  └── Acceptance test: new user → onboarding → /dashboard/opportunities

PHASE C — The Feed (core product)
  ├── Seed 18 opportunities (6.1)
  ├── Feed generation API (6.3)
  ├── Track API (6.7)
  ├── Save API (6.6)
  ├── OpportunityFeed component — infinite scroll (6.4)
  ├── OpportunityCard component — full spec (6.5)
  ├── Upgrade prompt in feed (6.8)
  ├── Opportunities page (server component)
  ├── NicheCTA.tsx fix (pass recommended_goal_template_id)
  └── Acceptance test: onboarding → feed → apply → share prompt

PHASE D — Growth Mechanics
  ├── Achievement cards table + generate-card API with full cardTitles mapping (7.1)
  ├── Trigger achievement card on all events: goal created, milestones (25/50/75/100%), service ordered, service completed, certificate issued, signup (7.1)
  │   ├── Goal created: in CreateGoalForm.tsx after handleCreateGoal (existing)
  │   ├── Order completed: in admin/orders/update-status/route.ts — fire-and-forget fetch (added)
  │   └── Service completed context: uses order's package name from the DB
  ├── AchievementCardSection component on /dashboard/home — 3 most recent cards with WhatsApp + Instagram share (7.1)
  ├── success_stories table (4.13)
  ├── SuccessStoryPrompt component (7.2)
  ├── SuccessStoryForm component (7.3)
  ├── /api/success-stories/submit route (7.4)
  ├── Viral campaign admin pages (7.5)
  ├── CampaignBanner component (7.6)
  ├── OpportunityScore mini widget in sidebar (3.7)
  └── Acceptance test: complete order → achievement card → success story

PHASE E — Admin & Content
  ├── /admin/opportunities list page with view/apply click stats (8.1)
  ├── /admin/opportunities/new create form (8.1)
  ├── /admin/opportunities/[id] edit form (8.1)
  ├── /admin/campaigns list page (7.5)
  ├── /admin/campaigns/new create form (7.5)
  ├── Boundless source link in OpportunityCard — already in card spec (6.5), no separate build needed (8.2)
  ├── AI opportunity refresh endpoint with Anthropic prompt + dead-link + deadline checks (8.3)
  ├── pg_cron job: runs daily at 6am UTC (8.3)
  ├── AI-generated opportunities marked inactive if zero views in 30 days (8.3)
  └── OpportunityScore real count update (10.1-10.2) — done (real count from user_opportunity_feed replaces formula)

PHASE F — Affiliate University
  ├── Seed 5 affiliate modules (9.5)
  ├── Affiliate hub page with status, tier progression bar, earnings, stats (9.2)
  ├── University module list page
  ├── Module detail page
  ├── Earnings dashboard with pending/paid commissions
  ├── Tools page: link generator with QR code (qrcode.react), WhatsApp message generator, Canvas API share image generator (9.6)
  ├── Leaderboard page (top affiliates by monthly earnings)
  ├── /api/affiliate/complete-module route
  ├── /api/affiliate/upgrade-tier route
  └── /api/affiliate/withdraw route
```

---
## 12. ACCEPTANCE TESTS

### Loop 1 Test: Discover → Save → Apply → Succeed
1. Sign up as a new user
2. Complete career profile onboarding (all 4 steps)
3. Land on /dashboard/opportunities and see personalised cards
4. Click Apply on an opportunity — track event fires, application URL opens
5. Share prompt appears 2 seconds after apply click
6. Click a niche landing page (/move/uae-dubai-residency) while logged out
7. Click "Start my Dubai Move Fund" → lands on /signup with return URL
8. Sign up → lands on goal creation with Dubai template pre-filled
9. Create the goal → goal saved → OpportunityScore recalculates

### Loop 2 Test: Succeed → Share → Refer → New User
1. Complete a service order as admin (mark as completed)
2. User gets order completed notification
3. User visits /dashboard/home — SuccessStoryPrompt appears
4. User submits story → success_stories record created → admin notified
5. User has achievement card generated for service_completed
6. User sees the card on /dashboard/home with WhatsApp share button
7. Click share — WhatsApp opens with pre-composed message

### Loop 3 Test: Content → Opportunity → Swiipt → Customer
1. Admin creates an opportunity in /admin/opportunities with source_url set to a Boundless article
2. Opportunity appears in feed for users in the matching segment
3. Card shows "Read the full guide on Boundless →" at bottom

### Loop 4 Test: More Users → More Data → Better Matching → More Users
1. Create two test user accounts with different career profiles
2. Verify each sees different opportunities (different relevance scores)
3. Add IELTS score to user profile
4. Verify OpportunityScore increases and new matching opportunities appear

---

## 13. SPRINT 18 COMPLETION CHECKLIST

**Database:**
- [ ] `career_segments` table created and seeded (10 segments)
- [ ] `opportunities` table created (without `is_free_to_view`, `invites_required`)
- [ ] `user_opportunity_feed` table created (without `is_unlocked`)
- [ ] `career_profiles` table created
- [ ] `affiliate_modules` table created and seeded (5 modules)
- [ ] `affiliate_module_progress` table created
- [ ] `affiliate_status` table created
- [ ] `achievement_cards` table created
- [ ] `viral_campaigns` table created
- [ ] `campaign_participations` table created
- [ ] `success_stories` table created
- [ ] `user_tier`, `tier_unlocked_via`, `tier_unlocked_at` columns added to `users`
- [ ] `check_and_upgrade_tier` function created
- [ ] All RLS policies applied to all tables
- [ ] All indexes created
- [ ] 18 initial opportunities seeded
- [ ] `src/types/database.ts` updated: all 11 new Sprint 18 table types (Row, Insert, Update) added under Tables
- [ ] `src/types/database.ts` updated: `user_tier`, `tier_unlocked_via`, `tier_unlocked_at` column types added to `users` Row
- [ ] `src/types/database.ts` updated: `check_and_upgrade_tier` RPC added under Functions

**Dashboard Restructure:**
- [ ] `/dashboard/home` page exists (moved from `/dashboard/page.tsx`)
- [ ] Middleware redirects `/dashboard` → `/dashboard/opportunities/onboarding` or `/dashboard/opportunities` based on cookie
- [ ] Sidebar "Home" link points to `/dashboard/home`
- [ ] Sidebar has "Opportunities" as second item (Zap icon)
- [ ] Sidebar has "Earn with Swiipt" after Rewards (DollarSign icon)
- [ ] Admin sidebar has "Campaigns" (Megaphone) + "Opportunities" (Zap)
- [ ] OpportunityScore mini widget in sidebar

**Onboarding:**
- [ ] `/dashboard/opportunities/onboarding` shows segment selector (Step 1)
- [ ] 10 segment cards render from career_segments table
- [ ] Step 2 profile form varies correctly by segment
- [ ] Step 3 passport/IELTS/timeline selection works
- [ ] Step 4 shows goal template recommendations
- [ ] `career_profiles` record created on completion
- [ ] `swiipt_onboarding_complete` cookie set
- [ ] User redirected to `/dashboard/opportunities`

**Feed:**
- [ ] `/dashboard/opportunities` shows personalised feed
- [ ] Infinite scroll loads 10 cards at a time (IntersectionObserver)
- [ ] Cards have fade-up entrance animation (AnimatedCard)
- [ ] "New this morning" section at top when applicable
- [ ] Featured card (top match) every 5th position
- [ ] Apply click tracked via `/api/opportunities/track`
- [ ] Save button works via `/api/opportunities/save`
- [ ] Share prompt appears 2 seconds after apply click
- [ ] Upgrade prompt appears after 3rd apply in session (free tier only)
- [ ] AI match badge shows "Excellent match" / "Good match" / "Fair match" (no raw %)
- [ ] Boundless source link shows at card bottom when source_url exists
- [ ] Related service upsell chip shows where applicable

**Achievement Cards:**
- [ ] Card generated on: goal created, 25%, 50%, 75%, 100% funded, service ordered, service completed, certificate issued, signup
- [ ] Card generation API has all 11 cardTitles mapped
- [ ] Cards shown on `/dashboard/home` (up to 3 most recent)
- [ ] WhatsApp share composes correct message with referral link
- [ ] Instagram share downloads 1080×1080 PNG
- [ ] Dismiss removes card from view

**Success Stories:**
- [ ] `SuccessStoryPrompt` shows on `/dashboard/home` when completed order exists without story
- [ ] `SuccessStoryForm` collects all fields (photo, country, duration, cost, hardest part, advice, contact opt-in)
- [ ] POST `/api/success-stories/submit` creates record with status = `pending`
- [ ] Admin notified on new story submission

**Viral Campaign Center:**
- [ ] Admin can create campaigns at `/admin/campaigns/new`
- [ ] Campaign form has all fields: title, description, reward type, amount, per-invite toggle, target, segment, readiness score min, start/end dates, max participants
- [ ] Active campaigns appear on user dashboard home (`CampaignBanner`)
- [ ] "Join campaign" creates `campaign_participations` record
- [ ] Progress tracked (invites sent, invites converted)
- [ ] Reward paid when target hit

**Admin Opportunity Management:**
- [ ] `/admin/opportunities` lists all opportunities with stats
- [ ] Create new opportunity form works
- [ ] Edit existing opportunity works
- [ ] Toggle active/inactive works
- [ ] View count and apply count visible

**AI Refresh:**
- [ ] `/api/opportunities/refresh` endpoint works
- [ ] Calls Anthropic API for segments with < 15 opportunities
- [ ] Dead-link check: HEAD request must return 2xx
- [ ] Deadline-in-future check skips expired deadlines
- [ ] Old AI-generated opportunities marked inactive if zero views in 30 days
- [ ] pg_cron job scheduled for 6am daily

**Affiliate University:**
- [ ] `/dashboard/affiliate` hub shows: tier badge, progression bar, tier benefits table, earnings, stats
- [ ] `/dashboard/affiliate/university` shows all 5 modules
- [ ] Module articles render from content_body markdown
- [ ] Module completion triggers points award in `affiliate_module_progress`
- [ ] `/dashboard/affiliate/tools` shows: link generator with QR code, WhatsApp message generator, Canvas API share image generator
- [ ] QR code generates from referral link
- [ ] Message templates populated with user's referral link
- [ ] Share image generates and downloads as 1080×1080 PNG
- [ ] `/dashboard/affiliate/earnings` shows pending and paid commissions
- [ ] `/dashboard/affiliate/leaderboard` shows top affiliates by monthly earnings
- [ ] Tier upgrade checked via `check_and_upgrade_tier` function on referral completion

**General:**
- [ ] `npm install qrcode.react` installed
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] No existing sprint functionality broken
- [ ] All new pages render correctly at 375px mobile

---

## DISCREPANCY REGISTER (Resolved)

| # | Discrepancy | Source | Resolution |
|---|-------------|--------|------------|
| 1 | OpportunityScore vs ReadinessScore naming | S16 vs Vision | Keep DB names, component is `OpportunityScore.tsx` |
| 2 | Invite-to-unlock gating vs open feed | S18 vs Vision | Removed: no `is_free_to_view`, `invites_required`, `LockedOpportunityCard`, or `InviteToUnlockBanner` |
| 3 | TikTok feed not in Sprint 18 code | Vision vs S18 | Built: infinite scroll with AnimatedCard, full OpportunityCard spec |
| 4 | Landing page CTA not passing template ID | Master Alignment | Fixed: NicheCTA.tsx passes `recommended_goal_template_id` |
| 5 | Opportunity count formula vs real count | S16 vs S18 | Formula in S16, replaced with real DB query in S18 |
| 6 | Dashboard home routing | Not specified | Cookie-based middleware redirect + /dashboard → /dashboard/home |
| 7 | Success stories | Not specified | New table + components + API route added |

---

*Sprint 18 Complete Build Plan*
*July 2026 · Swiipt | swiipt.com*
*This document supersedes sprint_18_claude_code.md, sprint_16_18_conflict_resolution.md, and sprint_17_18_priority_order.md where noted.*
