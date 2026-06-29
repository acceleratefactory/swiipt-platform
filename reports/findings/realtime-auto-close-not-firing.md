# Realtime Auto-Close Not Firing — Root Cause Investigation

**Date:** 2026-06-29
**Author:** Investigation agent
**Scope:** Holiday booking and service order pending confirmation modal not auto-closing on admin payment confirmation, despite Session 21 subscription churn fix.

---

## Symptoms

1. User creates a holiday booking via direct bank transfer
2. User clicks "I Have Transferred the Payment" — modal enters pending state (⏱ clock, "Payment pending confirmation")
3. Admin confirms payment in admin panel (status → `payment_confirmed`)
4. **Result:** Modal stays open indefinitely. Page does not refresh. No auto-close.
5. Same behavior for service orders.

The `setAdminConfirmed(true)` state change was confirmed working (⏱ → ✅ icon appeared), proving the polling/Realtime callback fires. But the parent's `setShowBooking(false); router.refresh()` never executes.

---

## Root Cause 1 (PRIMARY): Realtime never enabled on `holiday_bookings` table

### The missing SQL

The file `reports/enable_holiday_bookings_realtime.sql` exists with the correct command:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY holiday_bookings;
```

### Evidence it was never run

- **AGENTS.md Session 6** ("Holiday Booking Flow Fix"): Mentions creating the table, RLS policies, API routes, and admin pages. Mentions "Added Realtime subscription for holiday booking admin confirmation" — but **never mentions running any SQL to enable Realtime on the table**.
- **`reports/holiday_bookings_migration.sql`**: Creates the table structure, enables RLS, creates indexes, adds updated-at trigger — but **does NOT add the table to the `supabase_realtime` publication**.
- **Contrast — `group_buy_members`**: The migration `reports/priority_2_migration.sql` (single line: `ALTER PUBLICATION supabase_realtime ADD TABLE group_buy_members;`) was **explicitly confirmed as run** in Session 8: "SQL migration confirmed run in Supabase."
- **Contrast — `deposits`**: Enabled via `sprint5_phase1_sql.sql` as part of the original Sprint 5 foundation.

### Impact

Without `ALTER PUBLICATION supabase_realtime ADD TABLE ONLY holiday_bookings;`, the Realtime system does not publish changes to this table. The subscription in `HolidayBookingFlow.tsx:30-47` connects to the Realtime server successfully, but **never receives any events** for this table. This is a silent failure — no error, no warning.

### The same gap for `service_orders`

- There is **no SQL file anywhere in the entire codebase** that adds `service_orders` to the `supabase_realtime` publication.
- The subscription in `OrderFlow.tsx:66-86` also silently never fires.
- The `ActiveOrderTracker.tsx` subscription also silently never fires (but `ActiveOrderTracker` uses `router.refresh()` on any status update, not just `payment_confirmed`, and it has its own separate subscription channel — same issue).

---

## Root Cause 2 (CONTRIBUTING): Polling fallback has no error handling

The 5-second polling in `HolidayBookingFlow.tsx:63-75` is the backup when Realtime fails:

```tsx
const supabase = createClient();
const interval = setInterval(async () => {
  const { data } = await supabase
    .from("holiday_bookings")
    .select("status")
    .eq("id", result.bookingId)
    .single();
  if (data?.status === "payment_confirmed") {
    setAdminConfirmed(true);
    onAdminConfirmedRef.current?.();
  }
}, 5000);
```

### The bug

`.single()` returns `{ data, error }`. The code destructures only `data` and **discards `error`**. If the query encounters any issue:
- RLS blocks access (shouldn't happen for the user's own booking, but possible with cookie/auth timing issues)
- Row not found (booking ID doesn't match — unlikely but possible)
- Network error (transient connection issue)
- Rate limiting

...then `data` is `null`, `data?.status` is `undefined`, the condition `data?.status === "payment_confirmed"` evaluates to `false`, and the polling silently continues forever. The user sees no indication anything is wrong — the modal just stays open.

### RLS policy confirmation

The existing RLS policy on `holiday_bookings` should allow the user's polling query:

```sql
CREATE POLICY "Users can view own holiday bookings"
  ON holiday_bookings FOR SELECT
  USING (auth.uid() = user_id);
```

The browser client (`createClient()` from `@/lib/supabase/client.ts`) uses `@supabase/ssr` `createBrowserClient`, which reads the auth access token from cookies. If the user is logged in, the RLS should resolve to allow SELECT on rows where `user_id = auth.uid()`.

However, there could be edge cases where cookie/auth state is not fully initialized when the polling starts.

---

## What Session 21 actually fixed

Session 21 (commits `9587978`, `1c4cdc8`) fixed **subscription churn**:

- **Root cause found:** `createClient()` was called in the component body outside effects in `HolidayBookingFlow.tsx` and `OrderFlow.tsx`. Every React re-render (triggered by `onPendingChange` → parent re-render → child re-render) created a **new `supabase` object reference**. This appeared in both the Realtime and polling effect dependency arrays, causing both to tear down and re-create on every render — creating windows where events were missed or callbacks fired against a stale closure.

- **Fix applied:** Moved `createClient()` inside each effect, removed `supabase` from effect deps. Added `useRef` for `onAdminConfirmed` callbacks to prevent stale closure issues.

- **Verdict on the fix:** This fix was **necessary but addressed the wrong layer**. Even with perfectly stable subscriptions that never churn, the Realtime events would **never arrive** because the table was never added to the `supabase_realtime` publication.

The subscription churn was a real bug that would cause missed events even if Realtime was enabled. But the primary root cause — Realtime not being enabled on the tables — was never addressed.

---

## The full chain of failure

```
Admin clicks "Confirm payment" in admin panel
  → POST /api/admin/holidays/update-booking-status ✓
    → Updates holiday_bookings.status to "payment_confirmed" ✓
    → Realtime event: NEVER FIRES (table not in publication)
    → Polling query (5s interval):
      → If query succeeds: finds payment_confirmed, calls callback ✓
      → If query fails silently (discarded error): never resolves ✗
        → onAdminConfirmed callback: NEVER CALLED
          → setShowBooking(false): NEVER EXECUTED → modal stays open
          → router.refresh(): NEVER EXECUTED → page does not refresh
```

---

## Required fixes

1. **Run the Realtime migration for `holiday_bookings`:**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE ONLY holiday_bookings;
   ```
   File exists at `reports/enable_holiday_bookings_realtime.sql` — needs to be run in Supabase SQL Editor.

2. **Create and run Realtime migration for `service_orders`:**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE ONLY service_orders;
   ```
   No file exists yet for this — needs to be created and run.

3. **Add error handling to polling fallback** in `HolidayBookingFlow.tsx` and `OrderFlow.tsx`:
   - Log errors so they're visible (console.error or a visible error state)
   - Consider showing a user-facing message if polling fails after N attempts

---

## Verification after fix

1. Run the Realtime SQL migrations in Supabase
2. Deploy code changes
3. Test: User creates holiday booking → admin confirms → modal should auto-close and page should refresh within 5 seconds (polling) or instantly (Realtime)
4. Test: User creates service order → admin confirms → same expected behavior

---

## Files referenced

| File | Role |
|------|------|
| `src/components/dashboard/holidays/HolidayBookingFlow.tsx` | Contains Realtime + polling subscriptions for holiday bookings |
| `src/components/dashboard/services/OrderFlow.tsx` | Contains Realtime + polling subscriptions for service orders |
| `src/components/dashboard/holidays/HolidayDetailView.tsx` | Parent component with `onAdminConfirmed` callback + safety net subscription |
| `src/components/dashboard/services/ServiceDetailView.tsx` | Parent component with `onAdminConfirmed` callback + safety net subscription |
| `src/app/api/admin/holidays/update-booking-status/route.ts` | Admin API that updates booking to `payment_confirmed` |
| `src/app/api/admin/orders/update-status/route.ts` | Admin API that updates order to `payment_confirmed` |
| `reports/enable_holiday_bookings_realtime.sql` | SQL to enable Realtime on `holiday_bookings` (NEVER RUN) |
| `reports/holiday_bookings_migration.sql` | Table creation migration (does NOT enable Realtime) |
| `reports/priority_2_migration.sql` | Enables Realtime on `group_buy_members` (WAS RUN — contrast this) |
| `sprint5_phase1_sql.sql` | Enables Realtime on `deposits` (WAS RUN — contrast this) |
