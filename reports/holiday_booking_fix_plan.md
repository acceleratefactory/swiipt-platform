# Holiday "Book Directly" Fix — Implementation Plan

## Root Cause

`POST /api/holidays/book` generates a reference number + bank details + logs to `activity_log` and sends an admin notification, but **never persists a booking record** to any database table. The booking exists only in the user's browser tab — once they close the modal, it's gone. Admin sees nothing, customer gets no follow-up.

## Existing Pattern (Service Orders)

The working `service_orders` flow establishes the pattern:
1. `POST /api/services/order` → inserts into `service_orders` table → returns orderId + reference + bankDetails
2. `POST /api/services/direct-payment/confirm` → updates `service_orders.status` to `"payment_submitted"` → notifies admin
3. `DirectPaymentFlow.tsx` → shows bank details + "I Have Transferred the Payment ✓" button
4. `/admin/orders` → queries `service_orders` → renders `OrdersTable`
5. `/admin/orders/[id]` → `OrderDetailView` with status management

## Implementation Steps (6 files total)

### Step 1 — Add `holiday_bookings` table type to `src/types/database.ts`

Insert after the `holiday_packages` table definition (~line 456):

```typescript
holiday_bookings: {
  Row: {
    id: string
    user_id: string
    package_id: string
    reference: string
    travellers: number
    currency: string
    total_price: number
    status: string
    created_at: string
    updated_at: string
  }
  Insert: Omit<Database["public"]["Tables"]["holiday_bookings"]["Row"], "id" | "created_at" | "updated_at" | "status">
  Update: Partial<Database["public"]["Tables"]["holiday_bookings"]["Insert"]>
  Relationships: [
    {
      foreignKeyName: "holiday_bookings_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "users"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "holiday_bookings_package_id_fkey"
      columns: ["package_id"]
      referencedRelation: "holiday_packages"
      referencedColumns: ["id"]
    }
  ]
}
```

Status values mirror the service orders pattern (just the subset we need): `payment_pending` → `payment_submitted` → `payment_confirmed` → `completed` | `cancelled`.

---

### Step 2 — Update `src/app/api/holidays/book/route.ts`

**Changes:**
- Add `import { createServiceClient } from "@/lib/supabase/service";` (fixes the anon-key RLS issue since this is a write)
- After generating `ref`, insert a `holiday_bookings` record with `status: "payment_pending"`
- Return `bookingId: data.id` alongside existing `reference`, `totalPrice`, `currency`, `bankDetails`

The INSERT mirrors `src/app/api/services/order/route.ts:72-87` pattern (insert with `.select().single()`).

---

### Step 3 — Create `src/app/api/holidays/confirm-payment/route.ts`

**Pattern:**
- Mirrors `src/app/api/services/direct-payment/confirm/route.ts` exactly
- `POST` with `{ bookingId }`
- Updates `holiday_bookings.status` to `"payment_submitted"` where `id = bookingId AND user_id = user.id`
- Inserts admin notification (`"holiday_payment_submitted"`, action_url: `"/admin/holiday-bookings"`)
- Returns `{ success: true }`

---

### Step 4 — Update `src/components/dashboard/holidays/HolidayBookingFlow.tsx`

**Changes:**

Replace the current `result` display block (lines 66-115) so that after showing bank details + reference, instead of just a "Close" button, we add:

- **"I Have Transferred the Payment ✓"** button — mirrors `DirectPaymentFlow.tsx:82-97` exactly
  - Calls `POST /api/holidays/confirm-payment` with `{ bookingId: result.bookingId }`
  - Shows loading state ("Submitting...") while in flight
  - On success, transitions to a "Thank you, your payment has been submitted for verification" screen with close button
  - On error, shows error text

- **Close button** remains as a fallback

- Add `bookingId` extraction: currently the book route doesn't return `bookingId`, so Step 2 must add it first

---

### Step 5 — Update `src/app/(admin)/admin/holidays/page.tsx`

**Changes:**

This page currently only shows the holiday packages management table. After the `HolidayPackagesTable` section, add a second section:

- Query `holiday_bookings` with user names (via JOIN or separate fetch — use the same pattern as `admin/orders/page.tsx:22-37`)
- Add booking status filter bar (mirrors `OrdersTable.tsx` status filter pattern)
- Show table: User name/email, Package title, Travellers, Total price, Status badge, Created date
- Use the same `statusColors` badge pattern from `OrdersTable.tsx` (yellow for pending, blue for submitted, green for confirmed)

---

### Step 6 — Add "Holiday Bookings" to admin sidebar

Find the sidebar/nav component and add a link:
```
{ label: "Holiday Bookings", href: "/admin/holidays" }
```
Since we're putting the bookings table on the same `/admin/holidays` page (just below the packages table), no new route needed. If it's better as a separate page, create `src/app/(admin)/admin/holiday-bookings/page.tsx` and add a sidebar link for it.

## Files Summary

| # | File | Change |
|---|------|--------|
| 1 | `src/types/database.ts` | Add `holiday_bookings` table type |
| 2 | `src/app/api/holidays/book/route.ts` | Insert booking record + fix anon-key client |
| 3 | `src/app/api/holidays/confirm-payment/route.ts` | **New** — update status + notify admin |
| 4 | `src/components/dashboard/holidays/HolidayBookingFlow.tsx` | Add "I Have Transferred" button after bank details |
| 5 | `src/app/(admin)/admin/holidays/page.tsx` | Add bookings query + table below packages |
| 6 | Sidebar component | Add link to holiday bookings |

## What This Fixes

| Gap | Fixed By |
|-----|----------|
| No DB table | Step 1 + 2 |
| No booking record created | Step 2 |
| No "I Have Transferred" button | Step 4 |
| No payment confirmation API | Step 3 |
| No admin booking dashboard | Step 5 |
| Admin notification goes to dead `/admin/orders` | Step 3 (action_url → `/admin/holidays`) |
| No customer notification | Step 2 + 3 (success response + confirmation screen) |
| No status tracking | Step 1 + 2 + 3 (full lifecycle) |
| No user booking history | Not covered — out of scope (requires user-facing history page) |
