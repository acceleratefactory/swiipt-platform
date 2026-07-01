# Sprint 17 — Global Profile, Certificates, Agent Escrow & Diaspora Gifts
## Complete Implementation Build Plan
### July 2026 — Based on `sprint_17_claude_code.md`, `sprint_16_18_conflict_resolution.md`, `sprint_17_18_priority_order.md`

---

## Overview

Sprint 17 builds 5 features that expand Swiipt from a savings/migration platform into a trust infrastructure and global mobility enabler:

| # | Feature | Priority | Database | Revenue |
|---|---------|----------|----------|---------|
| 1 | Global Opportunity Profile | High | `financial_profiles` table + `users` columns | Indirect (enables certificates) |
| 2 | Proof of Funds Certificate | High | `platform_certificates` table | ₦15,000 per certificate |
| 3 | Swiipt Trust Certificate | High | `platform_certificates` table (shared) | ₦10,000 per certificate |
| 4 | Agent Escrow Portal | Medium | `platform_partners` + `escrow_deals` tables | 5% platform fee per deal |
| 5 | Goal Gift from Diaspora | Medium | `goal_gifts` table + Stripe | 2% FX spread |

**No conflicts apply to Sprint 17** — all changes are additive. No existing table or function is modified. All 5 features can be built independently.

**Build order:** 1 → 2/3 (parallel) → 4 → 5

---

## Phase 0 — Database Migration

Run this SQL in Supabase SQL Editor in a single transaction:

```sql
-- === FINANCIAL PROFILES ===
CREATE TABLE financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  total_deposited_ngn NUMERIC DEFAULT 0,
  total_goals_created INTEGER DEFAULT 0,
  total_goals_completed INTEGER DEFAULT 0,
  average_monthly_deposit_ngn NUMERIC DEFAULT 0,
  deposit_consistency_score INTEGER DEFAULT 0,
  longest_streak_weeks INTEGER DEFAULT 0,
  primary_destination TEXT,
  secondary_destination TEXT,
  estimated_move_timeline TEXT,
  relocation_intent_score INTEGER DEFAULT 0,
  has_uk_company BOOLEAN DEFAULT FALSE,
  has_us_llc BOOLEAN DEFAULT FALSE,
  has_uae_company BOOLEAN DEFAULT FALSE,
  is_sme_owner BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  documents_verified_count INTEGER DEFAULT 0,
  services_completed INTEGER DEFAULT 0,
  platform_tenure_days INTEGER DEFAULT 0,
  trust_score INTEGER DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === PLATFORM CERTIFICATES ===
CREATE TABLE platform_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('proof_of_funds', 'trust_certificate')),
  certificate_number TEXT UNIQUE NOT NULL,
  goal_id UUID REFERENCES savings_goals(id),
  data_snapshot JSONB NOT NULL,
  verification_url TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  fee_paid_ngn NUMERIC DEFAULT 0,
  fee_deposit_id UUID REFERENCES deposits(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === PLATFORM PARTNERS (AGENTS) ===
CREATE TABLE platform_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  partner_type TEXT NOT NULL CHECK (partner_type IN (
    'immigration_lawyer', 'visa_agent', 'relocation_consultant',
    'trade_agent', 'recruitment_agency', 'education_consultant'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  verification_documents JSONB DEFAULT '[]',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  cac_number TEXT,
  professional_licence_number TEXT,
  years_in_operation INTEGER,
  specialisations TEXT[],
  destinations_served TEXT[],
  average_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_escrow_volume_ngn NUMERIC DEFAULT 0,
  total_escrow_transactions INTEGER DEFAULT 0,
  platform_fee_pct NUMERIC DEFAULT 5,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === ESCROW DEALS ===
CREATE TABLE escrow_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES platform_partners(id) NOT NULL,
  client_user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_amount_ngn NUMERIC NOT NULL,
  platform_fee_ngn NUMERIC NOT NULL,
  partner_payout_ngn NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disputed', 'refunded', 'cancelled')),
  milestones JSONB DEFAULT '[]',
  savings_goal_id UUID REFERENCES savings_goals(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === GOAL GIFTS (DIASPORA) ===
CREATE TABLE goal_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES savings_goals(id) NOT NULL,
  recipient_user_id UUID REFERENCES users(id) NOT NULL,
  giver_name TEXT NOT NULL,
  giver_email TEXT,
  giver_country TEXT,
  amount_paid_foreign NUMERIC NOT NULL,
  foreign_currency TEXT NOT NULL,
  fx_rate_used NUMERIC NOT NULL,
  amount_credited_ngn NUMERIC NOT NULL,
  platform_fee_ngn NUMERIC NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  gift_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === RLS POLICIES ===
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own financial profile"
  ON financial_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all financial profiles"
  ON financial_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users read own certificates"
  ON platform_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can verify a certificate by number"
  ON platform_certificates FOR SELECT USING (TRUE);

CREATE POLICY "Active partners visible to authenticated users"
  ON platform_partners FOR SELECT USING (status = 'active' OR auth.uid() IS NOT NULL);

CREATE POLICY "Deal parties can read their deals"
  ON escrow_deals FOR SELECT USING (
    auth.uid() = client_user_id OR
    EXISTS (SELECT 1 FROM platform_partners WHERE id = partner_id AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Recipients can read their gifts"
  ON goal_gifts FOR SELECT USING (auth.uid() = recipient_user_id);

-- Admin policies for all new tables
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['financial_profiles','platform_certificates','platform_partners','escrow_deals','goal_gifts']
  LOOP
    EXECUTE format('CREATE POLICY "Admins manage %I" ON %I FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin''))', t, t);
  END LOOP;
END $$;

-- === USERS TABLE ADDITIONS ===
ALTER TABLE users ADD COLUMN IF NOT EXISTS global_profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS income_estimate_usd_monthly NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- === INDEXES ===
CREATE INDEX IF NOT EXISTS idx_financial_profiles_user ON financial_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_certificates_user ON platform_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_certificates_number ON platform_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_platform_partners_status ON platform_partners(status, partner_type);
CREATE INDEX IF NOT EXISTS idx_escrow_deals_client ON escrow_deals(client_user_id);
CREATE INDEX IF NOT EXISTS idx_escrow_deals_partner ON escrow_deals(partner_id);
CREATE INDEX IF NOT EXISTS idx_goal_gifts_goal ON goal_gifts(goal_id);

-- === CERTIFICATE NUMBER SEQUENCE ===
CREATE SEQUENCE IF NOT EXISTS certificate_seq START 1000;
```

---

## Phase 0b — Financial Profile Calculation Function

```sql
CREATE OR REPLACE FUNCTION calculate_financial_profile(user_id_input UUID)
RETURNS VOID AS $$
DECLARE
  total_deposited NUMERIC := 0;
  goal_count INTEGER := 0;
  completed_goals INTEGER := 0;
  avg_monthly NUMERIC := 0;
  consistency INTEGER := 0;
  has_uk BOOLEAN := FALSE;
  docs_verified INTEGER := 0;
  services_done INTEGER := 0;
  tenure INTEGER := 0;
  trust INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_deposited
  FROM deposits WHERE user_id = user_id_input AND status = 'confirmed';

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO goal_count, completed_goals
  FROM savings_goals WHERE user_id = user_id_input;

  SELECT COALESCE(AVG(monthly_total), 0) INTO avg_monthly
  FROM (
    SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) as monthly_total
    FROM deposits WHERE user_id = user_id_input AND status = 'confirmed'
    GROUP BY month
  ) monthly;

  SELECT CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - u.created_at)) / (30 * 24 * 3600) < 1 THEN 0
    ELSE LEAST(100, ROUND(
      (SELECT COUNT(DISTINCT DATE_TRUNC('month', created_at)) FROM deposits WHERE user_id = user_id_input AND status = 'confirmed')
      /
      GREATEST(1, EXTRACT(EPOCH FROM (NOW() - u.created_at)) / (30 * 24 * 3600))
      * 100
    ))
  END INTO consistency
  FROM users u WHERE u.id = user_id_input;

  SELECT COUNT(*) > 0 INTO has_uk
  FROM service_orders so
  JOIN service_packages sp ON sp.id = so.service_package_id
  WHERE so.user_id = user_id_input AND sp.category = 'company_registration' AND sp.destination = 'UK' AND so.status = 'completed';

  SELECT COUNT(*) INTO docs_verified
  FROM document_requests WHERE user_id = user_id_input AND status = 'verified';

  SELECT COUNT(*) INTO services_done
  FROM service_orders WHERE user_id = user_id_input AND status = 'completed';

  SELECT ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)
  INTO tenure FROM users WHERE id = user_id_input;

  trust := 0;
  IF total_deposited >= 100000 THEN trust := trust + 10; END IF;
  IF total_deposited >= 500000 THEN trust := trust + 10; END IF;
  IF total_deposited >= 1000000 THEN trust := trust + 10; END IF;
  IF consistency >= 50 THEN trust := trust + 15; END IF;
  IF consistency >= 80 THEN trust := trust + 15; END IF;
  IF docs_verified >= 1 THEN trust := trust + 10; END IF;
  IF docs_verified >= 3 THEN trust := trust + 10; END IF;
  IF services_done >= 1 THEN trust := trust + 15; END IF;
  IF tenure >= 90 THEN trust := trust + 5; END IF;

  INSERT INTO financial_profiles (
    user_id, total_deposited_ngn, total_goals_created, total_goals_completed,
    average_monthly_deposit_ngn, deposit_consistency_score,
    has_uk_company, documents_verified_count, services_completed,
    platform_tenure_days, trust_score, last_calculated
  )
  VALUES (
    user_id_input, total_deposited, goal_count, completed_goals,
    avg_monthly, consistency,
    has_uk, docs_verified, services_done,
    tenure, LEAST(trust, 100), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_deposited_ngn = EXCLUDED.total_deposited_ngn,
    total_goals_created = EXCLUDED.total_goals_created,
    total_goals_completed = EXCLUDED.total_goals_completed,
    average_monthly_deposit_ngn = EXCLUDED.average_monthly_deposit_ngn,
    deposit_consistency_score = EXCLUDED.deposit_consistency_score,
    has_uk_company = EXCLUDED.has_uk_company,
    documents_verified_count = EXCLUDED.documents_verified_count,
    services_completed = EXCLUDED.services_completed,
    platform_tenure_days = EXCLUDED.platform_tenure_days,
    trust_score = EXCLUDED.trust_score,
    last_calculated = NOW();

  UPDATE users SET trust_score = LEAST(trust, 100) WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 0c — Financial Profile Trigger Points

The `calculate_financial_profile` function must be triggered at these points (from `sprint_17_18_priority_order.md` Item 4.1):

**Trigger 1 — After deposit confirmation:**

Modify `POST /api/admin/deposits/confirm/route.ts` (or the `confirm_deposit` RPC if modifiable). After the deposit is confirmed, fire a fire-and-forget call to recalculate the user's financial profile:

```typescript
// Fire-and-forget — after deposit confirmed
fetch("/api/financial-profile/recalculate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: deposit.user_id }),
}).catch(() => {});
```

**Trigger 2 — On profile page load when stale:**

The Global Profile server page (`/dashboard/profile/page.tsx`) already auto-recalculates if `last_calculated > 24h` (specified in Phase 1 below).

**API route to trigger recalculation:**

Create `src/app/api/financial-profile/recalculate/route.ts`:

```typescript
// POST — admin-only endpoint to recalculate financial profile
// Called by trigger points — uses service client
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await request.json();
  // Only allow admins or the user themselves
  if (userId !== user.id) {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (!roleData || roleData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await adminSupabase.rpc("calculate_financial_profile", { user_id_input: userId });

  return NextResponse.json({ success: true });
}
```

---

## Phase 1 — Global Opportunity Profile

### Files to Create

| # | File | Action |
|---|------|--------|
| 1.1 | `src/app/(dashboard)/dashboard/profile/page.tsx` | Create — server component, fetches all profile data |
| 1.2 | `src/components/dashboard/profile/GlobalProfile.tsx` | Create — client component, 3-column profile page |
| 1.3 | `src/types/database.ts` | Update — add `financial_profiles`, `platform_certificates`, `users` new columns |

### 1.1 — Server Page (`src/app/(dashboard)/dashboard/profile/page.tsx`)

Server component with `force-dynamic`. Fetches:
- `users` row (profile, trust_score, skills, languages, readiness data)
- `financial_profiles` row
- `savings_goals` active (goal_name, current_balance, target_amount, destination, status)
- `service_orders` last 5 (with package name, destination)
- `activity_log` vault uploads (last 10)
- `platform_certificates` issued (type, number, issued_at, expires_at, is_valid)

Auto-recalculates `financial_profiles` if stale (>24h since last_calculated).

Uses service client (`createAdminClient` from `@supabase/supabase-js`) for all queries.

### 1.2 — Client Component (`src/components/dashboard/profile/GlobalProfile.tsx`)

**"use client"** — 3-column layout on desktop, 2 on tablet, 1 on mobile:

**Left column — Identity:**
- Profile completion indicator (circular progress bar)
  - Name (10) + Phone (10) + Country (10) + Skills (10) + Languages (5) + Destination (15) + Income range (5) + Passport uploaded (20) + 2nd doc uploaded (15) = 100
  - Shows "Your profile is X% complete — complete it to unlock the Trust Certificate"
- Name, email, phone, country_of_residence, member since
- Skills tag editor (type + Enter, max 10, saves to `users.skills`)
- Languages tag editor (same pattern, saves to `users.languages`)
- Income estimate dropdown (`/mo` ranges → converted to USD monthly)
- LinkedIn URL input field
- Trust score badge (from `financial_profiles.trust_score`)
- Readiness score ring (from `users.readiness_score`)

**Centre column — Financial Standing:**
- Total saved (lifetime deposits from `financial_profiles.total_deposited_ngn`)
- Average monthly deposit with explanation
- Deposit consistency score with color indicator
- Active goals summary (progress bars, max 5)
- Service orders history (status badges, package names)
- Alumni status badge if applicable

**Right column — Global Profile:**
- Destination interests (from readiness_destination or primary_destination)
- Documents in vault (icons per type, from activity_log vault events)
- Certificates issued (with verify links, expiry warnings)
- Opportunities unlocked hint (profile completeness → more opportunities)

**Bottom — full-width "Opportunities available to you right now":**
- Pulls from eligibility_pathways (Sprint 13) applied to user's profile
- Shows 3 matched pathways with match type (HIGH/GOOD/POSSIBLE) + direct link

### 1.3 — Sidebar + Navigation

**Modify:** `src/components/dashboard/shell/Sidebar.tsx`
Add after Home:
```typescript
{ href: "/dashboard/profile", label: "My Profile", icon: "User" },
```

---

## Phase 2 — Proof of Funds Certificate

### Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 2.1 | `src/app/api/certificates/proof-of-funds/route.ts` | Create — POST endpoint |
| 2.2 | `src/app/(public)/verify/[code]/page.tsx` | Create — public verification page |
| 2.3 | `src/components/public/certificates/VerificationPage.tsx` | Create — green/red verification UI |
| 2.4 | `src/app/api/certificates/[code]/download/route.ts` | Create — PDF download |
| 2.5 | `src/app/(dashboard)/dashboard/profile/certificates/page.tsx` | Create — certificate list + request form |
| 2.6 | `package.json` | Modify — add `@react-pdf/renderer` |

### 2.1 — Issue Certificate API (`POST /api/certificates/proof-of-funds`)

Validates:
- User is authenticated
- Goal belongs to user, is active
- `goal.current_balance >= 50000`
- Fee of ₦15,000 must be paid via deposit flow (stores `fee_deposit_id`)

Generates:
- Certificate number: `SWP-POF-{YEAR}-{XXXXXX}` using `certificate_seq`
- Data snapshot: holder name, email, goal name, destination, current balance, 28-day minimum balance, deposit history (90 days), goal created_at
- Verification URL: `https://swiipt.com/verify/{certificateNumber}`
- Expiry: 30 days from issuance

### 2.2 — Verify Page (`/verify/[code]`)

Public page, no login required. Queries `platform_certificates` by `certificate_number`.

**Green state** (valid, not expired):
- ✓ "Certificate Verified" header
- Certificate details: number, type, holder, balance, issue date, expiry
- Swiipt footer with company details

**Red state** (invalid or expired):
- ✕ "Certificate Invalid / Expired" header
- Explanation text
- "Issue date" vs "Expired date" display

### 2.3 — VerificationPage Component

Shared between Proof of Funds and Trust Certificate. Renders differently based on `certificate_type`:
- `proof_of_funds`: shows balance data, 28-day minimum
- `trust_certificate`: shows behavioral data (tenure, consistency, services completed)

### 2.4 — PDF Download (`GET /api/certificates/[code]/download`)

Uses `@react-pdf/renderer` to generate A4 PDF with:
- Swiipt logo + company details header
- Certificate title: "PROOF OF FUNDS CERTIFICATE"
- Certificate number (monospace)
- Holder details table
- Balance table (Current Balance, 28-Day Min, New Deposits, Total 90 Days)
- Deposit history table
- Issue + expiry dates
- QR code (to verification URL)
- Legal statement about funds being held in verified savings goal
- Signature block: "Issued by Swiipt Technologies Limited, Lagos Nigeria"

### 2.5 — Certificate List Page (`/dashboard/profile/certificates`)

Lists all user's certificates. "Request new certificate" button opens goal selector modal:
- Shows only active goals with `balance >= ₦50,000`
- User selects a goal
- User confirms fee payment (redirects to deposit flow for ₦15,000)
- On fee confirmation, POST to `/api/certificates/proof-of-funds`
- Certificate appears in list with download + verify link

---

## Phase 3 — Swiipt Trust Certificate

### Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 3.1 | `src/app/api/certificates/trust/route.ts` | Create — POST endpoint |

### 3.1 — Issue Trust Certificate API (`POST /api/certificates/trust`)

Functionally identical to Proof of Funds but:
- No `goalId` parameter needed — uses `financial_profiles` data
- Data snapshot: platform tenure, deposit consistency score, total lifetime deposits, services completed, documents verified, readiness score
- No minimum balance check
- Certificate number: `SWP-TC-{YEAR}-{XXXXXX}`
- Pricing: ₦10,000 per certificate
- Validity: 90 days
- Fee collected via deposit flow (`fee_deposit_id`)

Reuses the same `VerificationPage.tsx` component — renders trust certificate data differently.

Reuses the same PDF download endpoint — generates A4 with behavioral data columns instead of goal/balance data.

---

## Phase 4 — Agent Escrow Portal

### Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 4.1 | `src/app/(public)/partners/apply/page.tsx` | Create — partner self-registration |
| 4.2 | `src/app/api/partners/apply/route.ts` | Create — POST endpoint for registration |
| 4.3 | `src/app/(dashboard)/dashboard/find-agent/page.tsx` | Create — agent directory (server) |
| 4.4 | `src/components/dashboard/agents/PartnerCard.tsx` | Create — agent card component |
| 4.5 | `src/app/(dashboard)/dashboard/find-agent/[partnerId]/page.tsx` | Create — agent detail page |
| 4.6 | `src/app/api/escrow/create-deal/route.ts` | Create — POST to create escrow deal |
| 4.7 | `src/app/api/escrow/complete-milestone/route.ts` | Create — POST to complete milestone |
| 4.8 | `src/app/(admin)/admin/partners/page.tsx` | Create — admin partner list |
| 4.9 | `src/app/(admin)/admin/partners/[id]/page.tsx` | Create — admin partner detail + approve |
| 4.10 | `src/components/admin/shell/AdminSidebar.tsx` | Modify — add Partners nav link |

### 4.1 — Partner Registration (`/partners/apply`)

Public page. Form fields:
- Full name, business name (optional)
- Email, phone
- Partner type (dropdown: immigration_lawyer, visa_agent, relocation_consultant, etc.)
- CAC number, professional licence number
- Years in operation
- Specialisations (multi-select tags)
- Destinations served (multi-select tags)
- Verification documents upload (PDF/images, Supabase Storage)

On submit: POST to `/api/partners/apply` → creates `platform_partners` with `status = 'pending'` → inserts into `notifications` table (type: `partner_application`, broadcast to all admins, with partner name and type in `event_data`).

### 4.2 — Agent Directory (`/dashboard/find-agent`)

Server component. Fetches `platform_partners` where `status = 'active'`.
Filter bar: partner_type, destination, rating sort.
Renders grid of `PartnerCard` components.

### 4.3 — PartnerCard Component

Shows: agent name, business name, specialisations (tag pills), destinations, rating stars, total transactions count, "Work with this agent →" button.

### 4.4 — Agent Detail Page (`/dashboard/find-agent/[partnerId]`)

Full profile: verification badges, experience, specialisations, destinations, review stats, escrow volume.
"Create escrow deal" form section:
- Deal title, description
- Total amount (₦)
- Milestones (dynamic add/remove):
  - Title, description, percentage of total
  - Auto-calculates amount_ngn per milestone
- Creates `escrow_deals` record + linked `savings_goals` on submit

### 4.5 — Create Deal API (`POST /api/escrow/create-deal`)

On create:
1. Creates `escrow_deals` record with milestones JSONB
2. Creates `savings_goals` for client (locked, name = deal title, target = total_amount_ngn, category = 'custom')
3. Returns `{ dealId, savingsGoalId }`

Client deposits into the savings goal. Admin or partner triggers milestone completion.

### 4.6 — Complete Milestone API (`POST /api/escrow/complete-milestone`)

Input: `{ dealId, milestoneId }`.
Two-step: partner marks complete → admin confirms (mirrors deposit confirmation pattern).
On admin confirmation: releases milestone amount to partner (via platform), platform retains fee, notifications to both parties.

### 4.7 — Admin Partners Page (`/admin/partners`)

Lists all partner applications with status badges.
Filters: status (pending/active/suspended/rejected), partner_type.
Approve/reject buttons with mandatory notes (admin_audit_log).

### 4.8 — Admin Partner Detail (`/admin/partners/[id]`)

Shows verification documents, full profile.
Action buttons: Approve, Reject, Suspend.
Commission rate setting (`platform_fee_pct`).
Transaction history with escrow deals.

### 4.9 — Admin Sidebar

Add after "Subscribers":
```typescript
{ href: "/admin/partners", label: "Partners", icon: "Handshake" },
```

### 4.10 — Dashboard Sidebar

Add after "Rewards":
```typescript
{ href: "/dashboard/find-agent", label: "Find an Agent", icon: "Handshake" },
```

---

## Phase 5 — Goal Gift from Diaspora

### Prerequisites
- Stripe account connected to Swiipt UK Ltd company
- `npm install stripe @stripe/stripe-js`
- Add to Vercel environment variables:
  - `STRIPE_SECRET_KEY` — Stripe secret key (UK company account)
  - `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key

### Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 5.1 | `src/app/(public)/gift/[goalId]/page.tsx` | Create — public gift page |
| 5.2 | `src/app/api/gifts/create-session/route.ts` | Create — Stripe Checkout session |
| 5.3 | `src/app/api/gifts/webhook/route.ts` | Create — Stripe webhook handler |
| 5.4 | `src/components/dashboard/goals/GoalDetailView.tsx` | Modify — add "Share gift link" button |

### 5.1 — Gift Page (`/gift/[goalId]`)

Public page, no login required. Fetches goal by ID (limited info: goal name, holder's first name, progress, target amount).

UI elements:
- Goal holder's name and progress bar
- Gift amount selector: ₦10,000, ₦25,000, ₦50,000, Custom
- Currency selector: NGN | GBP | USD | EUR | CAD
- Giver name input (required)
- Giver email (optional — for confirmation receipt)
- Gift message textarea (max 200 chars)
- "Send gift" button → POST to `/api/gifts/create-session`

### 5.2 — Create Checkout Session (`POST /api/gifts/create-session`)

Input: `{ goalId, amount, foreignCurrency, giverName, giverEmail, message }`

Logic:
1. Verify goal exists and is active
2. Get current FX rate from `currencies` table for `foreignCurrency → NGN`
3. Calculate `amount_credited_ngn` after platform fee (1.5%)
4. Create `goal_gifts` record with `status = 'pending'`
5. Create Stripe Checkout session:
   - `line_items`: single item with name "Gift to {holder_first_name}'s goal"
   - `amount`: in foreign currency smallest unit
   - `currency`: foreign currency
   - `success_url`: redirect to /gift/{goalId}/success
   - `cancel_url`: redirect to /gift/{goalId}
   - `metadata`: `{ goal_gift_id, goal_id, recipient_user_id }`
6. Return `{ checkoutUrl }`

### 5.3 — Webhook Handler (`POST /api/gifts/webhook`)

Stripe webhook endpoint (signed by `STRIPE_WEBHOOK_SECRET`).

On `checkout.session.completed`:
1. Find `goal_gifts` record by `stripe_session_id`
2. Apply FX rate to get NGN amount
3. Deduct platform fee (1.5%)
4. `UPDATE savings_goals SET current_balance = current_balance + amount_credited_ngn WHERE id = goal_id`
5. `UPDATE goal_gifts SET status = 'completed', stripe_payment_intent_id = paymentIntent`
6. Create `activity_log` entry (type: `goal_gift_received`)
7. Create notification for recipient (`type: 'gift_received'`, linking to goal detail page)
8. Send gift received confirmation email to giver (via Resend — optional, dependent on `RESEND_API_KEY`)
9. Send notification to recipient via in-app notification + WhatsApp template if available

From the sprint_17_claude_code.md checklist: "Recipient notified via notification, email, and WhatsApp." Implement notifications using the existing `notifications` table insert pattern.

### 5.4 — Share Gift Link Button

Modify `GoalDetailView.tsx`: add button after existing action buttons:
"🎁 Share gift link" → copies `{origin}/gift/{goal.id}` → shows "Link copied ✓" for 2 seconds.

---

## Database Types Update

Add to `src/types/database.ts`:

```typescript
export interface FinancialProfile {
  id: string;
  user_id: string;
  total_deposited_ngn: number;
  total_goals_created: number;
  total_goals_completed: number;
  average_monthly_deposit_ngn: number;
  deposit_consistency_score: number;
  longest_streak_weeks: number;
  primary_destination: string | null;
  secondary_destination: string | null;
  estimated_move_timeline: string | null;
  relocation_intent_score: number;
  has_uk_company: boolean;
  has_us_llc: boolean;
  has_uae_company: boolean;
  is_sme_owner: boolean;
  identity_verified: boolean;
  documents_verified_count: number;
  services_completed: number;
  platform_tenure_days: number;
  trust_score: number;
  last_calculated: string;
  created_at: string;
}

export interface PlatformCertificate {
  id: string;
  user_id: string;
  certificate_type: 'proof_of_funds' | 'trust_certificate';
  certificate_number: string;
  goal_id: string | null;
  data_snapshot: any;
  verification_url: string;
  is_valid: boolean;
  expires_at: string;
  fee_paid_ngn: number;
  fee_deposit_id: string | null;
  issued_at: string;
  created_at: string;
}

export interface PlatformPartner {
  id: string;
  name: string;
  business_name: string | null;
  email: string;
  phone: string | null;
  partner_type: 'immigration_lawyer' | 'visa_agent' | 'relocation_consultant' | 'trade_agent' | 'recruitment_agency' | 'education_consultant';
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  verification_documents: any[];
  verified_by: string | null;
  verified_at: string | null;
  cac_number: string | null;
  professional_licence_number: string | null;
  years_in_operation: number | null;
  specialisations: string[];
  destinations_served: string[];
  average_rating: number;
  total_reviews: number;
  total_escrow_volume_ngn: number;
  total_escrow_transactions: number;
  platform_fee_pct: number;
  stripe_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EscrowDeal {
  id: string;
  partner_id: string;
  client_user_id: string;
  title: string;
  description: string | null;
  total_amount_ngn: number;
  platform_fee_ngn: number;
  partner_payout_ngn: number;
  status: 'active' | 'completed' | 'disputed' | 'refunded' | 'cancelled';
  milestones: EscrowMilestone[];
  savings_goal_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EscrowMilestone {
  id: string;
  title: string;
  description: string;
  pct_of_total: number;
  amount_ngn: number;
  status: 'pending' | 'completed' | 'disputed';
  completed_at: string | null;
}

export interface GoalGift {
  id: string;
  goal_id: string;
  recipient_user_id: string;
  giver_name: string;
  giver_email: string | null;
  giver_country: string | null;
  amount_paid_foreign: number;
  foreign_currency: string;
  fx_rate_used: number;
  amount_credited_ngn: number;
  platform_fee_ngn: number;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  gift_message: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  completed_at: string | null;
  created_at: string;
}
```

---

## Build Sequence (Phase Order)

```
PHASE 0 — Database + SQL function
  ├── Run SQL migration (5 tables + users columns + RLS + indexes + sequence)
  ├── Create calculate_financial_profile SQL function
  ├── Create POST /api/financial-profile/recalculate trigger endpoint
  ├── Update src/types/database.ts
  └── Add fire-and-forget trigger in deposit confirmation route

PHASE 1 — Global Opportunity Profile
  ├── Create /dashboard/profile/page.tsx
  ├── Create GlobalProfile.tsx client component
  └── Modify Sidebar.tsx — add "My Profile" link

PHASE 2 — Proof of Funds Certificate
  ├── Create POST /api/certificates/proof-of-funds
  ├── Create verify/[code] page + VerificationPage.tsx
  ├── npm install @react-pdf/renderer
  ├── Create GET /api/certificates/[code]/download
  └── Create /dashboard/profile/certificates page

PHASE 3 — Trust Certificate
  └── Create POST /api/certificates/trust (reuses verify + download)

PHASE 4 — Agent Escrow Portal
  ├── Create /partners/apply page + API
  ├── Create /dashboard/find-agent + PartnerCard + agent detail + create deal
  ├── Create escrow API routes (create-deal, complete-milestone)
  ├── Create admin partners pages (list + detail)
  ├── Modify AdminSidebar — add "Partners"
  └── Modify dashboard Sidebar — add "Find an Agent"

PHASE 5 — Goal Gift from Diaspora
  ├── npm install stripe @stripe/stripe-js
  ├── Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to Vercel
  ├── Create /gift/[goalId] public page
  ├── Create POST /api/gifts/create-session (Stripe Checkout)
  ├── Create POST /api/gifts/webhook (Stripe webhook handler)
  ├── Configure Stripe webhook endpoint in Stripe dashboard
  └── Modify GoalDetailView — add "Share gift link" button
```

---

## Acceptance Tests

### Phase 1 — Global Profile
1. Visit `/dashboard/profile` — all 3 columns load
2. Add a skill (type "JavaScript" + Enter) — saves to `users.skills`
3. Add a language (type "French" + Enter) — saves to `users.languages`
4. Select income range — saves to `users.income_estimate_usd_monthly`
5. Profile completion percentage updates based on filled fields
6. Trust score badge shows from `financial_profiles`
7. Readiness score ring shows from `users`

### Phase 2 — Proof of Funds
1. Visit `/dashboard/profile/certificates` — see "Request new certificate"
2. Select an active goal with balance ≥ ₦50,000 — fee deposit initiated
3. After fee confirmed — certificate appears in list
4. Open verify URL — green "Certificate Verified" page
5. Download PDF — A4 document with all data
6. Expire the certificate (wait or set `expires_at` past) — verify shows red state

### Phase 3 — Trust Certificate
1. Request trust certificate — uses `financial_profiles` data
2. Certificate number: `SWP-TC-YEAR-XXXXXX`
3. Verify page shows behavioral data (tenure, consistency, services)
4. PDF downloads with behavioral columns

### Phase 4 — Agent Escrow
1. Visit `/partners/apply` — submit application → `platform_partners` created with `status = pending`
2. Admin visits `/admin/partners` — sees pending application
3. Admin approves → status becomes `active`
4. User visits `/dashboard/find-agent` — sees approved partner
5. Click "Work with this agent" → create escrow deal with milestones
6. Deal creates `escrow_deals` + linked `savings_goals`
7. Client deposits into goal → deposit confirmed → milestone completion flow available

### Phase 5 — Diaspora Gifts
1. Visit a goal detail page → click "🎁 Share gift link"
2. Open link in incognito → see goal holder name + progress
3. Select ₦25,000 → GBP currency → enter name + message → click "Send gift"
4. Redirected to Stripe Checkout
5. Complete payment with test card
6. Webhook fires → `goal_gifts.status = 'completed'`
7. Goal balance increases by credited amount (minus 1.5% fee)
8. Recipient receives notification

---

## What This Document Excludes (Sprint 18 Items)

- Career profile onboarding flow (`/dashboard/opportunities/onboarding`)
- Career segments table and seeding
- Opportunities table and feed
- Dashboard home restructure (`/dashboard` → `/dashboard/home`)
- Middleware cookie-based redirect
- Success stories, achievement cards
- Viral campaigns
- Affiliate University
- OpportunityScore real count update
- AI opportunity refresh

These are Sprint 18 items, not Sprint 17. Sprint 17 builds ONLY the 5 features above.

---

*Sprint 17 Build Plan*
*July 2026 · Swiipt | swiipt.com*
*Sources: sprint_17_claude_code.md, sprint_16_18_conflict_resolution.md, sprint_17_18_priority_order.md*
