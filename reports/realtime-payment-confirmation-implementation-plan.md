# Implementation Plan: Realtime Payment Confirmation for Group Buy, Holiday Booking & Services

## Goal

Mirror the proven goal deposit Realtime pattern across all three payment flows. When admin confirms payment, the user's page auto-reloads and shows the updated status instantly — no manual refresh needed.

---

## Reference: Goal Deposit Pattern (What We're Mirroring)

```
GoalDetailView (parent component)
  └── useEffect: subscribe to `deposits` table
      ├── Filter: goal_id=eq.{goalId}
      ├── Event: UPDATE
      └── Callback: if status === "confirmed" → window.location.reload()
```

**Key:** Realtime lives in the **parent component**, NOT the modal. Subscription persists after modal closes.

---

## Gap Analysis

| Flow | Current Realtime Location | Problem | Fix |
|------|--------------------------|---------|-----|
| **Group Buy** | `ConfirmationStep` (inside modal) | Subscription destroyed when modal closes | Add Realtime to `GroupDetailActions.tsx` |
| **Holiday Booking** | `HolidayBookingFlow.tsx` (inside modal) | Subscription destroyed when modal closes; no status shown on detail page | Add Realtime to `HolidayDetailView.tsx` + show booking status |
| **Service** | Nowhere | No Realtime at all | Add Realtime to `ActiveOrderTracker.tsx` |

---

## Fix 1: Group Buy — Realtime in GroupDetailActions

### File
`src/components/dashboard/groups/GroupDetailActions.tsx`

### What to Add

Add a `useEffect` with a Supabase Realtime subscription that:
- Subscribes to `group_buy_members` table
- Filters by `group_buy_id=eq.{groupId}`
- Listens for `UPDATE` events
- When `status === "paid"` for the current user → calls `router.refresh()`

### When It Fires

1. User clicks "I Have Transferred" → modal shows confirmation step
2. User closes modal → `GroupDetailActions` shows static "Awaiting admin" card
3. Admin confirms → `group_buy_members.status` updates to `paid`
4. Realtime fires → `router.refresh()` → page reloads with fresh data
5. User sees "Paid ✓" status without manual refresh

### Conditions

- Only subscribe when `membershipStatus === "pending_payment"` (user is waiting for admin)
- Clean up subscription on unmount or when status changes

### Existing ConfirmationStep Realtime

Keep the Realtime in `ConfirmationStep` as-is — it provides instant feedback while the modal is open. The new subscription in `GroupDetailActions` is the backup for after the modal closes.

---

## Fix 2: Holiday Booking — Realtime in HolidayDetailView

### File
`src/components/dashboard/holidays/HolidayDetailView.tsx`

### Current State

- `HolidayBookingFlow.tsx` already has a Realtime subscription (lines 23-43) — but it's trapped inside the modal
- `HolidayDetailView.tsx` shows package details + "Book directly" button — no booking status, no Realtime

### What to Add

1. **Fetch existing booking** — On the holiday detail page, check if the user already has a booking for this package. The server component (`page.tsx`) should query `holiday_bookings` for the current user + package_id and pass it as a prop.

2. **Show booking status** — If an existing booking exists with status `payment_submitted` or `payment_pending`, show a teal/amber status card (similar to group buy's "Awaiting admin confirmation") instead of or alongside the "Book directly" button.

3. **Add Realtime subscription** — Add a `useEffect` that:
   - Subscribes to `holiday_bookings` table
   - Filters by `id=eq.{bookingId}`
   - Listens for `UPDATE` events
   - When `status === "payment_confirmed"` → calls `router.refresh()`

### Server Component Change

`src/app/(dashboard)/dashboard/holidays/[id]/page.tsx` needs to:
- Query `holiday_bookings` for `user_id = current user` AND `package_id = page param` AND `status IN ('payment_pending', 'payment_submitted')`
- Pass the existing booking (if any) as a prop to `HolidayDetailView`

### When It Fires

1. User books holiday → modal shows bank details → clicks "I Have Transferred" → modal shows confirmation (with its own Realtime)
2. User closes modal → holiday detail page shows "Booking submitted — Awaiting admin confirmation" card
3. Admin confirms → `holiday_bookings.status` updates to `payment_confirmed`
4. Realtime fires → `router.refresh()` → page reloads with fresh booking status

### Existing HolidayBookingFlow Realtime

Keep the Realtime in `HolidayBookingFlow.tsx` as-is — it provides instant feedback while the modal is open.

---

## Fix 3: Service — Realtime in ActiveOrderTracker

### File
`src/components/dashboard/services/ActiveOrderTracker.tsx`

### Current State

- Pure presentational component — receives `order` as props, renders 9-step timeline
- No Realtime, no state updates after mount
- User must manually refresh to see status changes

### What to Add

Add a `useEffect` with a Supabase Realtime subscription that:
- Subscribes to `service_orders` table
- Filters by `id=eq.{orderId}`
- Listens for `UPDATE` events
- When status changes → calls `router.refresh()`

### When It Fires

1. User places service order → modal shows "Order placed!" → closes
2. User sees `ActiveOrderTracker` on service detail page — static timeline
3. Admin confirms → `service_orders.status` updates to `payment_confirmed`
4. Realtime fires → `router.refresh()` → page reloads with fresh timeline
5. User sees updated status step highlighted without manual refresh

### Note on Case Manager Notes

The Realtime subscription should also listen for `case_manager_notes` changes, so when the case manager adds notes, the user sees them instantly.

---

## Implementation Order

| # | Flow | File | Change | Risk |
|---|------|------|--------|------|
| 1 | Group Buy | `GroupDetailActions.tsx` | Add `useEffect` + Realtime subscription | Low — additive only |
| 2 | Holiday Booking | `src/app/(dashboard)/dashboard/holidays/[id]/page.tsx` | Add booking query + pass as prop | Low — server component, additive |
| 3 | Holiday Booking | `HolidayDetailView.tsx` | Add booking status card + Realtime subscription | Low — additive only |
| 4 | Service | `ActiveOrderTracker.tsx` | Add `useEffect` + Realtime subscription | Low — additive only |

**Total: 4 files modified, 0 files created**

---

## Verification

After each fix:
1. `npm run build` — must pass with zero errors
2. Manual test: open payment flow → close modal → confirm as admin → verify page auto-reloads
3. Verify subscription cleanup on unmount (no memory leaks)

---

*Generated: 2026-06-27*
*Status: Ready for implementation*
