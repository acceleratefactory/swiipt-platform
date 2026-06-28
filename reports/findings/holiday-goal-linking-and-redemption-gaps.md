# Investigation: Holiday Package — Goal Linking & Goal Redemption Gaps

## Problem Statement

When a user creates a savings goal for a holiday package (via "Save toward this"), the holiday page does not recognize the existing goal on subsequent visits. The page continues to show "Save toward this" as if no goal exists. Additionally, once the goal is funded, there is no way to use those savings to pay for the holiday booking — only "pay via bank transfer" is available.

### Symptoms
- **"Save toward this"** always creates a NEW goal, even if one already exists for that package
- **Holiday detail page** never indicates that a goal exists for this trip
- **"Book directly"** only offers bank transfer — no option to use goal savings
- **No goal_redemption** path exists in the holiday booking flow

---

## Root Cause Analysis: 5 Gaps

### Gap 1 — No `linked_holiday_package_id` on `savings_goals`

The `savings_goals` table has `linked_service_package_id` (services-only naming) but no counterpart for holiday packages. Goals created via "Save toward this" set `goal_category = 'holiday_package'` and `destination = pkg.destination`, but these fields are not unique enough to match a goal to a specific package. A user could have multiple goals with `goal_category: 'holiday_package'` for the same destination.

**Affected file:** `src/types/database.ts` (savings_goals Row type, lines 64-90)

### Gap 2 — Server Page Doesn't Fetch Goal Fields Needed for Matching

The server page (`holidays/[id]/page.tsx`) fetches goals but only selects `id, goal_name, current_balance, currency, status`. It does NOT fetch `goal_category` or `destination`, so the client component has insufficient data to match goals against the current holiday package.

**Affected file:** `src/app/(dashboard)/dashboard/holidays/[id]/page.tsx` (lines 27-31)

### Gap 3 — `HolidayBookingFlow.handleSave()` Always Creates a New Goal

The `handleSave()` function in `HolidayBookingFlow.tsx` directly inserts a new `savings_goals` row without first checking whether a goal already exists for this package. It also does not populate `linked_service_package_id` (which exists but is never used). The `activeGoals` prop is passed but never referenced.

**Affected file:** `src/components/dashboard/holidays/HolidayBookingFlow.tsx` (lines 50-71)

### Gap 4 — No `goal_id` Column on `holiday_bookings`

Unlike `service_orders.goal_id` (which links a service order to the goal used for payment), `holiday_bookings` has no `goal_id` column. Even if goal redemption were added to the booking flow, there would be no way to record which goal was used.

**Affected file:** `src/types/database.ts` (holiday_bookings Row type)

### Gap 5 — Holiday Booking API Doesn't Support Goal Redemption

The `POST /api/holidays/book` route does not accept `goalId` or `paymentMethod` parameters. It only supports direct bank transfer. The `holiday_bookings` API and confirm-payment flow have no mechanism for goal balance deduction.

**Affected files:**
- `src/app/api/holidays/book/route.ts`
- `src/app/api/holidays/confirm-payment/route.ts`

### Comparison with Working Service Flow

| Aspect | Services (Working) | Holidays (Broken) |
|--------|-------------------|-------------------|
| Goal linking to order | `service_orders.goal_id` ✅ | No `goal_id` on `holiday_bookings` ❌ |
| Goal deduction on payment | `deduct_goal_balance` RPC ✅ | No deduction flow ❌ |
| Milestone discount | 15% discount applied ✅ | No discount logic ❌ |
| Credit auto-apply | Applied via `apply_credit_to_order` ✅ | No credit logic ❌ |
| Payment methods | goal_redemption + direct_payment ✅ | direct_payment only ❌ |
| Existing goal detection | User manually selects a goal in OrderFlow ❌ | No detection at all ❌ |

---

## Solution Approach

The fix has two independent goals that should be implemented in order:

**Phase 1 — Remember existing goals:** Make the holiday page detect and show goals created for this package. Stop creating duplicate goals.

**Phase 2 — Enable goal redemption:** Allow users to pay for holiday bookings using goal savings (mirrors the service order flow).

---

## Implementation Plan — Phase 1: Remember Existing Goals

### Step 1 — Add `linked_holiday_package_id` to `savings_goals`

Add a new column to enable explicit goal-to-holiday-package linking.

**SQL:**
```sql
ALTER TABLE savings_goals 
ADD COLUMN linked_holiday_package_id UUID REFERENCES holiday_packages(id) ON DELETE SET NULL;
```

**TypeScript:** Add `linked_holiday_package_id: string | null` to the `savings_goals` Row type in `src/types/database.ts`.

### Step 2 — Populate `linked_holiday_package_id` When Creating Goal

In `HolidayBookingFlow.tsx`, update `handleSave()` to:
- Set `linked_holiday_package_id: pkg.id` when inserting the goal
- Add a duplicate-prevention check before inserting:
  ```sql
  SELECT id FROM savings_goals 
  WHERE user_id = $userId 
    AND linked_holiday_package_id = $packageId 
    AND status = 'active'
  ```
- If an existing goal is found, show a "You already have a goal for this trip" message and link to it instead of creating a duplicate

### Step 3 — Detect Existing Goals on Holiday Detail Page

**In server page (`holidays/[id]/page.tsx`):**
- Add `linked_holiday_package_id` and `goal_category` to the goal query select list
- Add a separate query or filter to find goals where `linked_holiday_package_id === params.id`

**In `HolidayDetailView.tsx`:**
- Accept a new prop `existingGoal` (the matched goal or null)
- If `existingGoal` exists:
  - Show a teal status card: "You're saving for this trip — ₦X / ₦Y"
  - Change "Save toward this" button to "View goal →" (button linking to the goal detail page)
  - If `existingGoal.current_balance >= totalPrice`, add a "Pay with this goal" button next to "Book directly"

**In `HolidayBookingFlow.tsx`:**
- If an existing goal is detected with sufficient balance, show a payment method choice:
  - "Pay from savings goal" (goal_redemption)
  - "Pay via bank transfer" (direct_payment)

---

## Implementation Plan — Phase 2: Enable Goal Redemption for Holiday Bookings

### Step 4 — Add `goal_id` to `holiday_bookings`

**SQL:**
```sql
ALTER TABLE holiday_bookings 
ADD COLUMN goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL;
```

**TypeScript:** Add `goal_id: string | null` to the `holiday_bookings` Row type in `src/types/database.ts`.

### Step 5 — Add `goal_redemption` Support to Holiday Booking API

**In `POST /api/holidays/book/route.ts`:**
- Accept additional parameters: `goalId`, `paymentMethod`
- If `paymentMethod === "goal_redemption"`:
  - Validate goal ownership, sufficient balance (same pattern as `services/order/route.ts` lines 38-67)
  - Apply milestone discount (if `milestone_100_unlocked`, look up `milestone_100_discount_pct` from platform_settings)
  - Apply travel credits from wallet (via `apply_credit_to_order` RPC)
  - Set booking status to `"payment_confirmed"` (skip pending pipeline)
  - Call `deduct_goal_balance(goalId, finalPrice)` to deduct from goal
  - Create user notification about goal deduction
- Store `goal_id` on the booking record

### Step 6 — Add Goal Selection UI to Holiday Booking Flow

**In `HolidayBookingFlow.tsx`:**
- When user clicks "Book directly" and has a funded goal for this package, show payment method choice:
  - Option 1: "Pay from {goal_name} — {balance}" (goal_redemption)
  - Option 2: "Pay via bank transfer" (direct_payment)
- For goal_redemption:
  - Show a summary: service price, milestone discount (if applicable), credit applied (if any), final amount to deduct
  - Confirmation button: "Confirm — Deduct {amount} from my goal"
  - On success, show confirmation screen with order details

### Step 7 — Update Admin Booking Status Sync

**In `POST /api/admin/holidays/update-booking-status/route.ts`:**
- When admin confirms a booking that used goal_redemption, the status is already `payment_confirmed` (set at creation), so no additional action needed for the goal deduction itself
- If admin cancels/rejects a goal_redemption booking, consider adding logic to restore the goal balance via `increment_goal_balance` RPC (optional, lower priority)

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Duplicate goals created before this fix | High | Added duplicate check prevents new duplicates; existing duplicates remain but can be manually cleaned up |
| User has multiple goals linked to same package | Low | Duplicate check returns first match; UI shows single goal card |
| Goal with insufficient balance selected for payment | Low | Balance validation at API level (same as service flow) |
| Milestone discount + credit applied incorrectly to holiday booking | Low | Mirrors exact logic from service order route (proven working) |
| Holiday booking API change breaks existing booking flow | Low | `goalId` and `paymentMethod` are optional; existing calls without them continue to use direct_payment |

---

## Files to Modify

### Phase 1 — Remember Existing Goals

| File | Change |
|------|--------|
| `savings_goals` table (SQL) | Add `linked_holiday_package_id` column |
| `src/types/database.ts` | Add `linked_holiday_package_id` to savings_goals Row type |
| `src/app/(dashboard)/dashboard/holidays/[id]/page.tsx` | Fetch `linked_holiday_package_id` from goals; pass existing goal as prop |
| `src/components/dashboard/holidays/HolidayDetailView.tsx` | Show goal card if existing; change button to "View goal" |
| `src/components/dashboard/holidays/HolidayBookingFlow.tsx` | Add duplicate check before creating goal; link to existing goal |

### Phase 2 — Enable Goal Redemption

| File | Change |
|------|--------|
| `holiday_bookings` table (SQL) | Add `goal_id` column |
| `src/types/database.ts` | Add `goal_id` to holiday_bookings Row type |
| `src/app/api/holidays/book/route.ts` | Accept `goalId` and `paymentMethod`; handle goal_redemption |
| `src/components/dashboard/holidays/HolidayBookingFlow.tsx` | Add payment method selection; goal redemption flow |
| `src/app/api/admin/holidays/update-booking-status/route.ts` | Add goal balance restoration on cancel/reject (optional) |

### No Changes Needed

- `src/app/api/services/order/route.ts` — the reference pattern stays unchanged
- `src/app/api/admin/orders/update-status/route.ts` — same
- `deduct_goal_balance` RPC — already updated (Fix 1 from Session 13)
- `apply_credit_to_order` RPC — already exists and functional
