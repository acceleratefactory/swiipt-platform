# Investigation: Holiday Goal Payment Not Available

## User Report

1. Created a goal for a holiday package via "Save toward this" ✓
2. Funded the goal to 100% of the trip price ✓
3. Went back to the holiday detail page → **"Save toward this" button still showing** (goal card not visible)
4. Clicked "Save toward this" again → modal shows two options
5. Clicked "Save toward this trip" → **"Goal already exists"** message with "View goal →" and "Close" buttons
6. Clicked "Book directly" → only **bank transfer** option shown (no "Pay from goal" button)

## Root Cause Analysis

### Root Cause 1: The `existingGoal` server-side prop is never refreshed after goal creation

**File:** `src/app/(dashboard)/dashboard/holidays/[id]/page.tsx:34-40`
**File:** `src/components/dashboard/holidays/HolidayDetailView.tsx:26`

The `existingGoal` prop is fetched ONCE by the server component at page load. When the user creates a goal inside `HolidayBookingFlow` (a client component) and closes the modal, the server does NOT re-render. The `existingGoal` prop in `HolidayDetailView` remains `null`.

The flow:
1. Page loads → server queries `savings_goals` for `linked_holiday_package_id` → returns `null` (no goal yet) → `existingGoal = null`
2. User opens modal → creates goal → `handleSave()` inserts with `linked_holiday_package_id: pkg.id`
3. Modal shows "Goal created!" → user clicks "Close" → `onClose = () => setShowBooking(false)` → modal closes
4. `HolidayDetailView` still has **`existingGoal = null`** (server never re-ran)
5. User sees "Save toward this" button — this is the stale render

Even if the user navigates "back" using the browser button, the page is served from bfcache (back-forward cache) and the server component does NOT re-execute.

**Secondary symptom:** Because `existingGoal` is null, the `HolidayBookingFlow` at line 336 (`existingGoal && existingGoal.current_balance >= totalPrice`) evaluates to `false`, so the goal payment button is never shown.

### Root Cause 2: SQL migrations have not been applied to the Supabase database

**Files:** `fix_holiday_goal_linking_step1.sql`, `fix_holiday_goal_redemption_step4.sql`

These SQL files exist in the repository but have **never been executed in the Supabase SQL Editor**. The `linked_holiday_package_id` column on `savings_goals` and the `goal_id` column on `holiday_bookings` do not exist in the production database.

**Impact:**
- Server query at `page.tsx:34-40` — `.eq("linked_holiday_package_id", params.id)` — fails silently (column unknown → `{ data: null, error }` with `.maybeSingle()` → `existingGoal = null`)
- Client duplicate check at `HolidayBookingFlow.tsx:55-61` — same query, same failure
- Goal insert at `HolidayBookingFlow.tsx:74-84` — would also fail if the column doesn't exist
- Booking insert at `book/route.ts:88` — `goal_id: goalId || null` — would fail if column doesn't exist

**Why user sees "Goal already exists" despite column possibly missing:** If the user tested locally with a Supabase instance that has the column, OR if the column was added through some other mechanism. But in production, the column almost certainly does not exist.

### Root Cause 3: The "existing_goal" result screen has no path to "Book directly with goal payment"

**File:** `src/components/dashboard/holidays/HolidayBookingFlow.tsx:163-244`

When the duplicate check triggers, the result screen shows:
- 💡 "Goal already exists" title
- Message + "View goal →" link
- **"Close" button** (only)

There is no "Book directly" button on this screen. The user must:
1. Click "Close" (returns to detail page)
2. Click "Book directly" (opens modal fresh, new `action`)
3. Go through travellers/currency form again
4. Only then see the payment options

Even if they do this, step 2-4 requires `existingGoal` to be populated, which depends on Root Cause 1 & 2 being fixed.

## Issues Found

### Issue A — HolidayBookingFlow doesn't refresh parent state
`HolidayBookingFlow` creates a goal in `handleSave()` but never calls back to `HolidayDetailView` to update its `existingGoal` state. `HolidayDetailView` has no local state for `existingGoal` — it relies entirely on the server prop.

### Issue B — "existing_goal" result screen lacks "Book directly" button
After showing the existing goal, the user must take two separate actions (close modal → reopen with "Book directly") instead of being offered a button to proceed immediately.

### Issue C — `handleSave()` duplicate check uses `linked_holiday_package_id` which may not exist in DB
The client-side query at line 55-61 depends on the column existing. If it doesn't, the error is silently swallowed (`maybeSingle()` returns null) and the user would be allowed to create a duplicate goal (the insert would also fail due to the unknown column).

### Issue D — HolidayDetailView grid layout uses `pkg.price_per_person_ngn` instead of the correct currency price
Line 137: `existingGoal.current_balance >= (pkg.price_per_person_ngn || 0)` always compares against NGN price, even if the goal was created in a different currency. The goal's currency might differ from the price being compared.

## Recommended Fixes

### Fix 1: Refresh the page after goal creation
In `HolidayBookingFlow.tsx`, after successful goal creation (line 86), call `router.refresh()` before or instead of setting the result. This forces a server re-render that will populate the `existingGoal` prop. The user should see the updated state immediately.

Alternatively, in `HolidayDetailView.tsx`, add client-side query for existing goal (separate from the server prop) that re-fetches after the modal closes. But this duplicates logic.

**Best approach:** Add `router.refresh()` in `handleSave()` on success, then show the result screen. When the user closes the result, the page re-renders with the correct `existingGoal` prop.

### Fix 2: Apply SQL migrations in Supabase
Run both SQL files in the Supabase SQL Editor:
```sql
ALTER TABLE savings_goals ADD COLUMN linked_holiday_package_id UUID REFERENCES holiday_packages(id) ON DELETE SET NULL;
ALTER TABLE holiday_bookings ADD COLUMN goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL;
```

### Fix 3: Add "Book directly" button to the "existing_goal" result screen
In `HolidayBookingFlow.tsx`, when `result.type === "existing_goal"`, add a button that calls `setAction("book")` to transition directly to the booking form with the existing goal in context.

### Fix 4: Update grid balance comparison to use the correct currency price
In `HolidayDetailView.tsx:137`, change `pkg.price_per_person_ngn` to use the correct currency price based on the goal's currency or the preferred currency.

### Fix 5: Re-fetch existingGoal when `showBooking` modal opens
In `HolidayDetailView.tsx`, when the user clicks "Book directly" to open the modal, fetch the latest `existingGoal` from the client-side Supabase client before passing it to `HolidayBookingFlow`. This ensures fresh data even if the server prop is stale.
