# Admin Affiliate Management — Complete Build Plan

## Overview

Build a full admin control panel for the affiliate system (Sprint 18 Phase A + F). Currently, the affiliate tables (`affiliate_modules`, `affiliate_module_progress`, `affiliate_status`) exist with RLS policies allowing admin SELECT on `affiliate_status` and ALL on `affiliate_modules`, but **no admin UI, API routes, or components exist** to actually manage affiliates. This plan fills that gap.

## Relevant Tables

| Table | Purpose | Existing RLS |
|-------|---------|--------------|
| `affiliate_status` | Per-user tier, earnings, codes, ranks, university points | Admin SELECT only — no INSERT/UPDATE/DELETE |
| `affiliate_modules` | University course content | Admin ALL (SELECT/INSERT/UPDATE/DELETE) |
| `affiliate_module_progress` | Module completion tracking per user | **No admin policy at all** — user-only SELECT |
| `activity_log` | Audit trail for all significant actions | Used for withdrawal logging |

## What Admin Needs

### 1. Affiliate Dashboard / Overview
- Total affiliates count
- Affiliates by tier breakdown (starter/bronze/silver/gold/platinum)
- Total pending earnings across all affiliates
- Total paid out (withdrawn) across all affiliates
- Total converted referrals

### 2. Affiliate List (read + manage)
- Table: user name, email, tier, affiliate code, total referrals, pending earnings, total earned, modules completed, last activity
- Filters: by tier, by date range, search by name/email/code
- Actions: view detail, manually set tier

### 3. Affiliate Detail (read + manage)
- Profile info: name, email, phone, join date
- Affiliate stats: tier, code, total/pending/withdrawn earnings, referral counts (total/converting/conversion rate)
- University progress: modules completed, points, certificate issued
- Referral list: who they referred, status, commission earned
- Earnings history: timeline of earnings, withdrawals
- Admin actions: override tier, reset code, adjust earnings

### 4. Individual Affiliate Detail (full drill-down)
- **All referrals:** every user they referred, sorted by date, with referral status (pending/converted/expired), commission earned per referral, and the service order that triggered it (package name, amount, date)
- **Conversion sources:** which service orders generated commission for each referral — links directly to the order in the admin Orders page
- **Earnings timeline:** chronological list of every commission earned (amount, referral name, service, date), every manual adjustment (amount, admin name, reason), every withdrawal (amount, date, status)
- **Module completion:** full list of affiliate university modules, which ones completed, when, points earned per module, certificate issue status
- **Sub-affiliates (Gold/Platinum only):** who they recruited as sub-affiliates, sub-affiliate earnings, override commissions earned from sub-affiliate activity
- **Admin actions panel:** change tier, adjust earnings (with reason), reset affiliate code, view as user (preview their dashboard experience)
- Navigate from affiliate list by clicking any row → `/admin/affiliates/[userId]`

### 5. Withdrawal Queue (approve/reject)
- Table: affiliate name, amount requested, date, tier, status
- Filters: by status (requested/approved/rejected), date range
- Actions: approve (mark as paid), reject (with reason)
- **Note:** Current withdraw route (`POST /api/affiliate/withdraw`) deducts inline without admin approval. This plan adds an approval step — the user flow becomes: request withdrawal → admin approves → earnings released.

### 6. Commission Dispute Resolution
- **Manual adjustment button** on the affiliate detail page: "Credit commission" and "Deduct earnings"
- Each adjustment requires a **reason field** (min 10 chars) that is logged to `admin_audit_log` with admin identity, previous value, new value, and reason
- Adjustments also create an `activity_log` entry for the affiliate so they can see the adjustment in their earnings timeline
- Notification sent to affiliate when manual adjustment is made: "Admin adjusted your earnings: ₦X — {reason}"
- The same adjustment API is used to retroactively credit a commission when a dispute is resolved in the affiliate's favor

### 7. Sub-Affiliate Tree Visibility
- On the affiliate detail page (for Gold/Platinum affiliates), a **"Sub-Affiliates" tab** shows:
  - Tree view: parent affiliate → sub-affiliate → sub-affiliate's referrals (expandable)
  - Per sub-affiliate: name, email, tier, total earned, total referred, date they joined under the parent
  - Override earnings: how much commission the parent earned FROM each sub-affiliate's referrals
  - Summary at top: total override earnings from sub-affiliates, total sub-affiliates, sub-affiliate-converted referrals
- This requires querying `users.referred_by` chains and `affiliate_status` for the referral tree

### 8. University Module Management (CRUD)
- List modules (title, type, duration, order, points, free/premium)
- Create module (title, subtitle, content type, content body, duration, order, points, free flag)
- Edit module
- Delete module (with check for existing progress records)
- Reorder modules (drag or numeric order)

### 9. Leaderboard Management (optional oversight)
- View current monthly leaderboard
- View all-time leaderboard
- Reset monthly leaderboard (admin trigger)

### 10. Module Preview as User
- Every module in the modules list and edit page has a **"Preview as user"** button
- Opens the module in a modal or new tab at `/admin/affiliates/modules/[id]/preview` — renders the same `ModuleDetailView.tsx` component that the dashboard uses, but in an admin context
- The admin sees exactly what a user sees: title, content body (rendered markdown), duration, points, and the "Complete" button (which either shows as completed or disabled in preview mode)
- No test account creation needed — the preview route fetches module content and renders the public view component directly

---

## Phases

### Phase A — Database & RLS

**A-1: Add RLS policies for admin INSERT/UPDATE on `affiliate_status`**
```sql
-- Allow admin UPDATE on affiliate_status (for tier overrides, adjustment of earnings)
CREATE POLICY "Admins update affiliate status" ON affiliate_status
  FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Allow admin INSERT on affiliate_status (for manual creation/override)
CREATE POLICY "Admins insert affiliate status" ON affiliate_status
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
```

**A-2: Add RLS policy for admin SELECT on `affiliate_module_progress`**
```sql
-- Currently no admin access to module progress — needed for admin to view user university completion
CREATE POLICY "Admins read all module progress" ON affiliate_module_progress
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
```

**A-3: Add `affiliate_withdrawals` table (approval queue)**
```sql
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount_ngn NUMERIC(14, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_id UUID REFERENCES users(id),
  admin_note TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_status ON affiliate_withdrawals (status);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_user ON affiliate_withdrawals (user_id);
```

**A-4: RLS for `affiliate_withdrawals`**
- User: SELECT own rows, INSERT own rows
- Admin: SELECT all, UPDATE status

**A-5: Update `POST /api/affiliate/withdraw` to create a withdrawal request instead of inline deduction**
- Change from direct `pending_earnings_ngn -= amount` to inserting into `affiliate_withdrawals` with status `pending`
- Admin then approves via admin panel

**SQL file:** `admin_affiliates_phase_a.sql`

---

### Phase B — Admin API Routes

All routes use **service client** (bypasses RLS) following the existing admin API pattern.

**B-1: `GET /api/admin/affiliates`**
- Query: `affiliate_status` JOIN `users` (email, full_name, phone, created_at)
- Returns: paginated list with total count, tier breakdown stats
- Query params: `tier`, `search` (name/email/code), `page`, `limit`
- Response: `{ affiliates: [...], total, tiers: { starter: N, bronze: N, ... }, totalPendingEarnings, totalWithdrawn }`

**B-2: `GET /api/admin/affiliates/[id]`** (full drill-down)
- Query: `affiliate_status` JOIN `users`, plus separate queries for:
  - **All referrals:** `referrals` JOIN `users` where `referrer_id = user_id`, with `commission_status`, `created_at`, and joined user's `full_name`, `email`
  - **Conversion sources:** `referrals` JOIN `service_orders` (via `referrals.referred_id` → `service_orders.user_id`) to show which service orders triggered each commission — includes `service_packages.name`, `final_price`, `status`, `created_at`
  - **Module progress:** `affiliate_module_progress` JOIN `affiliate_modules` — module title, type, completed_at, points_earned, order_in_course
  - **Earnings timeline:** union of `activity_log` (affiliate_commission, affiliate_adjustment, affiliate_withdrawal events) and `affiliate_withdrawals` — combined chronological feed
  - **Sub-affiliates (if tier = gold or platinum):** query `users` where `referred_by = user_id`, JOIN `affiliate_status` for their earnings, tier, and referral counts — plus override commission calculations from referral chain
- Returns: full affiliate profile with stats, all referrals with conversion sources, module progress, earnings timeline, sub-affiliate tree

**B-3: `POST /api/admin/affiliates/[id]/update-tier`**
- Body: `{ tier: "bronze"|"silver"|"gold"|"platinum" }`
- Action: UPDATE `affiliate_status.tier`, log to `admin_audit_log`

**B-4: `POST /api/admin/affiliates/[id]/adjust-earnings`** (dispute resolution)
- Body: `{ field: "pending_earnings_ngn"|"total_earned_ngn"|"withdrawn_earnings_ngn", amount: number, reason: string }`
- Validation: `reason` is required, min 10 characters (must explain the dispute or adjustment)
- Action: UPDATE the field, record previous value + new value + reason + admin_id in `admin_audit_log`
- Also INSERT into `activity_log`: `{ user_id, event_type: "affiliate_manual_adjustment", event_data: { field, amount, reason, admin_id } }`
- Send notification to affiliate: `{ user_id, type: "earnings_adjusted", title: "Earnings adjusted by admin", body: "₦{amount} {field} — {reason}" }`
- This endpoint is the single point of resolution for commission disputes — admin can credit pending earnings, adjust total earned, or reverse erroneous credits

**B-5: `GET /api/admin/affiliates/withdrawals`**
- Query: `affiliate_withdrawals` JOIN `users`
- Query params: `status` (pending/approved/rejected), `page`, `limit`
- Returns: paginated withdrawal requests with user info

**B-6: `POST /api/admin/affiliates/withdrawals/[id]/process`**
- Body: `{ action: "approve"|"reject", note?: string }`
- Action:
  - Approve: UPDATE status → "approved", set `admin_id`, `processed_at`, deduct `pending_earnings_ngn`, add to `withdrawn_earnings_ngn`
  - Reject: UPDATE status → "rejected", set `admin_id`, `admin_note`, `processed_at` (restore pending earnings if already deducted)
- Log to `admin_audit_log` + user notification

**B-7: `GET /api/admin/affiliates/modules`**
- Query: `affiliate_modules` ORDER BY `order_in_course ASC`
- Returns: all modules

**B-8: `POST /api/admin/affiliates/modules`**
- Body: `{ title, subtitle, content_type, content_body, duration_minutes, order_in_course, is_free, points_on_completion }`
- Action: INSERT into `affiliate_modules`

**B-9: `PUT /api/admin/affiliates/modules/[id]`**
- Body: partial module fields
- Action: UPDATE `affiliate_modules`

**B-10: `DELETE /api/admin/affiliates/modules/[id]`**
- Action: DELETE `affiliate_modules` (with check: if any progress records exist, block deletion)
- Response: 409 Conflict if module has progress records

**B-11: `POST /api/admin/affiliates/reorder-modules`**
- Body: `{ moduleIds: string[] }` (ordered array)
- Action: UPDATE `order_in_course` for each module based on array index

**New directory:** `src/app/api/admin/affiliates/` with sub-routes

---

### Phase C — Admin Pages & Components

**C-1: Sidebar Nav Entry**
- Add "Affiliates" to `AdminSidebar.tsx` after "Campaigns" (index 16, shifting AI Providers and below by 1)
- Icon: `Users` or `Award` or `Percent`
- Sub-items or single entry linking to `/admin/affiliates`

**C-2: Affiliates List Page** (`/admin/affiliates/page.tsx`)
- Server component with search/filter params
- Renders `AffiliatesList.tsx` client component
- Table columns: Name, Email, Tier, Code, Referrals, Pending Earnings, Total Earned, Modules, Actions
- **Each row is clickable** → navigates to `/admin/affiliates/[userId]` for full drill-down
- Tier badges colored: starter (gray), bronze (#CD7F32), silver (#C0C0C0), gold (#FFD700), platinum (#E5E4E2)
- Search input (name, email, code), tier filter dropdown
- Pagination
- Top stats bar: total affiliates, total pending, total paid, by-tier breakdown

**C-3: Affiliate Detail Page** (`/admin/affiliates/[userId]/page.tsx`)
- Server component fetches full affiliate data via `GET /api/admin/affiliates/[userId]`
- Renders `AffiliateDetail.tsx` client component
- Tabbed sections (5 tabs):
  1. **Overview** — name, email, phone, join date (from `auth.users`), tier badge, affiliate code, maturity (active since), readiness/mobility score summary
  2. **Referrals & Conversions** — table of ALL referrals with: referred user name, email, date referred, commission status (pending/converted/expired), converted flag, and LINK to the service order that triggered the commission (if converted) — click opens `admin/orders/[orderId]` in new tab. Filters: status, date range
  3. **Earnings Timeline** — chronological feed combining: commission earned (amount, referral, service, date), manual adjustments (amount, admin name, reason, date), withdrawals (amount, date, status). Color-coded: green for credits, red for deductions, amber for pending withdrawals
  4. **University** — module-by-module progress: title, type, points, completed_at (or "Not started"), certificate issue status. Shows overall completion % and university_points total
  5. **Sub-Affiliates** (only visible if tier = gold or platinum) — tree view: parent → sub-affiliate → sub-affiliate's referrals. Per sub-affiliate: name, email, tier, total earned, total referrals, override commission earned by parent, date joined under parent. Summary card at top: total override earnings, total sub-affiliates, avg sub-affiliate conversion rate
- **Admin Actions Panel** (right sidebar or top section):
  - **Change tier** — dropdown (starter/bronze/silver/gold/platinum) + confirm modal. Logs to `admin_audit_log` with previous tier
  - **Adjust earnings** — form with: field selector (pending/total/withdrawn), amount input (positive or negative), **required reason** textarea (min 10 chars). Confirm modal shows preview of new balance before committing
  - **Reset affiliate code** — generates new `AFF-XXXXXXXX` code, logs old code + new code to `admin_audit_log`
  - **View as user** — opens `/dashboard/affiliate?user={userId}&adminOverride=true` in new tab for previewing what the affiliate sees

**C-4: Withdrawals Page** (`/admin/affiliates/withdrawals/page.tsx`)
- Server component with status filter
- Renders `AffiliateWithdrawals.tsx` client component
- Table: User, Amount, Tier, Date, Status, Actions
- Status badges: pending (amber), approved (green), rejected (red)
- Approve/Reject buttons with confirmation modal
- Reason text field for rejection

**C-5: Modules List Page** (`/admin/affiliates/modules/page.tsx`)
- Server component
- Renders `AffiliateModulesList.tsx` client component
- Table: Order, Title, Type (badge: article/video/template), Duration, Points, Free, Actions
- "New Module" button → `/admin/affiliates/modules/new`
- Edit/Delete buttons per row
- Up/Down reorder buttons (or drag)

**C-6: Module Create/Edit Page** (`/admin/affiliates/modules/new/page.tsx` and `/admin/affiliates/modules/[id]/page.tsx`)
- Server component
- Renders `ModuleForm.tsx` client component
- Fields: title, subtitle, content_type (select: article/video/template), content_body (textarea/markdown editor), duration_minutes, order_in_course, is_free (checkbox), points_on_completion
- API call on submit → redirect to modules list

**C-7: Sub-Affiliate Tree Component** (`SubAffiliateTree.tsx`)
- Renders inside the affiliate detail page's "Sub-Affiliates" tab
- Tree view with collapsible rows: each sub-affiliate expands to show their referrals
- Per-row: avatar (initials), name, email, tier badge, total earned, total referred, override commission earned by parent
- Summary header: total override earnings, sub-affiliate count, avg conversion rate
- Fetch data from `GET /api/admin/affiliates/[id]` (sub-affiliates nested in response)

**C-8: Module Preview Page** (`/admin/affiliates/modules/[id]/preview/page.tsx`)
- Server component: fetches module content, renders the dashboard-side `ModuleDetailView.tsx` component directly
- Wraps in a thin admin chrome with a "Back to modules" link and "This is a preview" banner at top
- The "Complete" button in the preview is **disabled** or shown as "Complete" (if already completed by the viewing admin) — no actual progress is recorded
- No auth check beyond admin role — this route reuses the admin layout's role verification
- Accessed from the modules list via a "Preview as user" button on each row, and from the module edit form via the same button

**New components directory:** `src/components/admin/affiliates/`

---

### Phase D — Update Existing Withdraw Route

**D-1: Modify `POST /api/affiliate/withdraw`**
- Current behavior: deducts `pending_earnings_ngn` inline, no admin oversight
- New behavior: inserts into `affiliate_withdrawals` with `status: "pending"`, returns `{ success: true, withdrawalId }`
- Keep the same validation (tier !== "starter", has enough pending_earnings)
- Notify user that withdrawal is pending admin approval

**D-2: Modify dashboard `AffiliateHub.tsx` withdraw UI**
- After requesting withdrawal, show "Withdrawal requested — pending admin approval" instead of instant success
- Add withdrawal history section showing status of past requests

---

### Phase E — Notifications & Activity Logging

**E-1: Admin Notification on New Withdrawal Request**
- When user requests withdrawal, notify admin via notifications table
- `{ user_id: null (broadcast), type: "affiliate_withdrawal_requested", title: "New withdrawal request", body: "₦X by {name}", action_url: "/admin/affiliates/withdrawals" }`

**E-2: User Notification on Withdrawal Processed**
- When admin approves/rejects, notify user
- Approved: `{ user_id, type: "withdrawal_approved", title: "Withdrawal approved", body: "₦X has been approved" }`
- Rejected: `{ user_id, type: "withdrawal_rejected", title: "Withdrawal rejected", body: "Reason: {note}" }`

**E-3: Admin Audit Log for All Actions**
- Tier changes, earnings adjustments, module CRUD all logged to `admin_audit_log`

---

## DB Types to Update (`src/types/database.ts`)

Add types for:
- `affiliate_withdrawals` Row/Insert/Update

---

## File Manifest

### New Files
```
src/app/(admin)/admin/affiliates/page.tsx                              # Affiliates list
src/app/(admin)/admin/affiliates/[userId]/page.tsx                     # Affiliate detail (full drill-down)
src/app/(admin)/admin/affiliates/withdrawals/page.tsx                  # Withdrawals queue
src/app/(admin)/admin/affiliates/modules/page.tsx                      # Modules list
src/app/(admin)/admin/affiliates/modules/new/page.tsx                  # Create module
src/app/(admin)/admin/affiliates/modules/[id]/page.tsx                 # Edit module
src/app/(admin)/admin/affiliates/modules/[id]/preview/page.tsx         # Module preview (as user)
src/app/api/admin/affiliates/route.ts                                  # List affiliates + stats
src/app/api/admin/affiliates/[id]/route.ts                             # Affiliate detail (referrals, conversions, orders, sub-affiliates, timeline)
src/app/api/admin/affiliates/[id]/update-tier/route.ts                 # Override tier
src/app/api/admin/affiliates/[id]/adjust-earnings/route.ts             # Dispute resolution (required reason, audit log, notification)
src/app/api/admin/affiliates/[id]/reset-code/route.ts                  # Reset affiliate code
src/app/api/admin/affiliates/withdrawals/route.ts                      # List withdrawals
src/app/api/admin/affiliates/withdrawals/[id]/process/route.ts         # Approve/reject withdrawal
src/app/api/admin/affiliates/modules/route.ts                          # List + create modules
src/app/api/admin/affiliates/modules/[id]/route.ts                     # Update + delete module
src/app/api/admin/affiliates/modules/reorder/route.ts                  # Reorder modules
src/components/admin/affiliates/AffiliatesList.tsx                     # List table + filters + tier stats bar
src/components/admin/affiliates/AffiliateDetail.tsx                    # Detail view (5 tabs + admin actions panel)
src/components/admin/affiliates/AffiliateWithdrawals.tsx               # Withdrawals table + approve/reject modals
src/components/admin/affiliates/AffiliateModulesList.tsx               # Modules CRUD table + Preview button
src/components/admin/affiliates/ModuleForm.tsx                         # Create/edit module form
src/components/admin/affiliates/SubAffiliateTree.tsx                   # Expandable sub-affiliate tree view
admin_affiliates_phase_a.sql                                           # RLS + withdrawals table
```

### Modified Files
```
src/components/admin/shell/AdminSidebar.tsx               # Add nav entry
src/app/api/affiliate/withdraw/route.ts                   # Switch to request-based
src/components/dashboard/affiliate/AffiliateHub.tsx        # Update withdraw UI
src/types/database.ts                                     # Add new types
```

---

## Build Order

| Phase | Files | Dependencies |
|-------|-------|-------------|
| Phase A | SQL file | None — run in Supabase first |
| Phase B | 13 API routes (incl. reset-code, preview) | Phase A (for DB schema) |
| Phase C | 8 admin pages + 7 components (incl. sub-affiliate tree, module preview) | Phase B (for API calls) |
| Phase D | Modify withdraw route + hub | Phase A (withdrawals table) |
| Phase E | Notifications | Phase A–D (all features live) |

---

## Key Design Decisions

1. **Service client for all admin API routes** — follows existing admin pattern, bypasses RLS. The SQL Phase A adds RLS policies as a safety net, but admin API routes use service client for consistency.

2. **Withdrawal approval workflow** — current inline deduction becomes a request→approve flow. This gives admin oversight of payouts. The user dashboard withdraw button creates a pending request instead of instant payout.

3. **Module deletion blocked if progress exists** — prevents accidental deletion of content that users have completed. Admin would need to delete progress records first or deactivate the module instead.

4. **Admin audit trail for every action** — tier changes, earnings adjustments, withdrawal approvals/rejections, module CRUD all logged to `admin_audit_log` with previous/new values and admin identity.

5. **No commission rate management** — commission rates are based on tier (starter/bronze/silver/gold/platinum) and are defined in the `check_and_upgrade_tier` RPC logic. Adding admin-configurable rates is deferred — not needed for MVP.

6. **Affiliate detail page uses `userId`, not `affiliate_status.id`** — route is `/admin/affiliates/[userId]`. This ensures URLs are stable even if the affiliate_status row is recreated, and matches the pattern used by other admin detail pages (`/admin/users/[id]`).

7. **Dispute resolution requires mandatory reason** — every earnings adjustment must include a reason (min 10 characters). No silent adjustments. This ensures every commission dispute outcome is documented and auditable. The reason appears in both `admin_audit_log` and the affiliate's `activity_log`.

8. **Sub-affiliate tree queries user referral chain** — sub-affiliates are identified via `users.referred_by` (the parent's `users.referral_code`). The chain depth is limited to 2 levels (parent → sub-affiliate → sub-affiliate's referrals) to avoid infinite recursion. Override commissions are calculated by identifying which `referrals` in the sub-affiliate's tree converted and applying the parent's override percentage.

9. **Module preview reuses dashboard component** — the preview route at `/admin/affiliates/modules/[id]/preview` directly imports and renders `ModuleDetailView.tsx` (the same component the dashboard uses). No duplication, no iframe. A `previewMode` prop disables the "Complete" button so no progress is recorded.
