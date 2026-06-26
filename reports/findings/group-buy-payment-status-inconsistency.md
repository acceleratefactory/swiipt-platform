# Investigation: Group Buy "Paying" Status Stuck After Admin Confirmation

## Problem Statement

User created a group with 2 members. Both completed payment (clicked "I Have Transferred"). Admin confirmed both payments. But in the group members section, both still show "Paying" (`pending_payment`) instead of "Paid" (`paid`).

---

## Root Cause Found

**The admin has 3 different places to confirm a payment, but only 1 of them updates `group_buy_members.status`.** If the admin confirms from the wrong place, the member stays stuck at `pending_payment` forever.

### The 3 Admin Confirmation Paths

| Path | What it updates | Updates `group_buy_members.status`? | Triggers all-paid auto-complete? |
|------|----------------|-------------------------------------|----------------------------------|
| Admin Groups page → Member dropdown → "paid" | `group_buy_members` + linked order/booking | **YES** | **YES** |
| Admin Orders page → Set order to `payment_confirmed` | `service_orders` only | **NO** | **NO** |
| Admin Holidays page → Set booking to `payment_confirmed` | `holiday_bookings` only | **NO** | **NO** |

**This is the bug.** The `POST /api/admin/orders/update-status` route at line 68 only updates `service_orders`:

```ts
await (adminSupabase as any).from("service_orders").update(updateData).eq("id", orderId);
```

It does NOT check if this order is linked to a `group_buy_members` row, and does NOT update the membership status. Same issue exists in `POST /api/admin/holidays/update-booking-status`.

---

## Full Flow Trace

### What SHOULD Happen (happy path)

1. User clicks "Pay now" → `DirectPaymentStep` → `POST /api/group-buy/pay`
   - Creates `holiday_bookings` or `service_orders` (status: `initiated`/`payment_pending`)
   - Sets `group_buy_members.status = "pending_payment"`, `user_confirmed_at = null`
2. User clicks "I Have Transferred" → `POST /api/group-buy/confirm-payment`
   - Sets `user_confirmed_at = NOW()` on membership
   - Sets linked order/booking to `payment_submitted`
   - **Membership status stays `pending_payment`** (correct — waiting for admin)
3. Admin goes to Groups page → selects member → sets to "paid"
   - `POST /api/admin/groups/update-status` with `newMemberStatus: "paid"`
   - Sets `group_buy_members.status = "paid"`, `paid_at = NOW()`
   - Sets linked order/booking to `payment_confirmed`/`confirmed`
   - Checks if all members paid → auto-completes group
4. User sees "Paid ✓" on group detail page ✓

### What ACTUALLY Happened (broken path)

1. Same as above ✓
2. Same as above ✓
3. Admin goes to **Orders page** → finds the order → sets to `payment_confirmed`
   - `POST /api/admin/orders/update-status` with `newStatus: "payment_confirmed"`
   - Updates `service_orders.status = "payment_confirmed"` ✓
   - **Does NOT update `group_buy_members.status`** ✗
   - **Does NOT check all-paid auto-complete** ✗
4. User still sees "Paying" (`pending_payment`) ✗

---

## Additional Issues Found

### Issue 2: `confirm-payment` doesn't change membership status

`POST /api/group-buy/confirm-payment` (line 45-48) only sets `user_confirmed_at`:

```ts
await (serviceClient as any)
  .from("group_buy_members")
  .update({ user_confirmed_at: new Date().toISOString() })
  .eq("id", membership.id);
```

It does NOT update `status` from `pending_payment`. This is by design (admin confirms = status change), but it means the membership stays at `pending_payment` between user confirmation and admin confirmation. If the admin never uses the group member status update endpoint, the status never changes.

### Issue 3: Admin Orders page has no group buy indicator

`src/app/(admin)/admin/orders/page.tsx` queries `service_orders` without joining `group_buy_members`. The admin has no way to know which orders are linked to a group buy, making it easy to confirm from the wrong place.

### Issue 4: Cron expire resets confirmed-but-unprocessed members

`POST /api/group-buy/expire` (line 42-46) catches members where `user_confirmed_at < 24h ago`:

```ts
.or(`user_confirmed_at.is.null,user_confirmed_at.lt.${twentyFourHoursAgo}`);
```

This means if the admin doesn't confirm within 24 hours of the user clicking "I Have Transferred", the member gets reset to `committed` and their order/booking gets cancelled. This is aggressive — 24h is short for admin processing.

### Issue 5: `committed` transition cancels linked records but doesn't check status

When admin sets member to `committed` (revert), the `update-status` route cancels linked orders/bookings regardless of their current status. If the order is already `payment_confirmed`, it gets downgraded to `cancelled`.

---

## Why Both Members Show "Paying"

Based on the user's report, the most likely scenario:

1. Both users completed payment (clicked "I Have Transferred")
2. Admin confirmed both from the **Orders page** (not the Groups page member dropdown)
3. Orders updated to `payment_confirmed` ✓
4. `group_buy_members.status` stayed at `pending_payment` for both ✗
5. Group detail page renders `memberStatusLabels["pending_payment"]` = "Paying"

---

## Fixes Required

### Fix 1: Make `orders/update-status` and `holidays/update-booking-status` aware of group buys

When updating an order/booking to `payment_confirmed`, check if it's linked to a `group_buy_members` row and update that row's status too.

**Files to modify:**
- `src/app/api/admin/orders/update-status/route.ts`
- `src/app/api/admin/holidays/update-booking-status/route.ts`

### Fix 2: Add group buy indicator to admin Orders page

Show which orders are linked to group buys so admins know to use the group member status update instead.

**File to modify:**
- `src/app/(admin)/admin/orders/page.tsx`
- `src/components/admin/orders/OrdersTable.tsx`

### Fix 3: Extend cron expire timeout or remove the aggressive reset

24h is too short. Change to 72h or remove the `user_confirmed_at.lt` condition entirely (only expire truly abandoned = `user_confirmed_at IS NULL`).

**File to modify:**
- `src/app/api/group-buy/expire/route.ts`

---

*Generated: 2026-06-26*
*Status: Root cause identified — 3 fixes proposed*
