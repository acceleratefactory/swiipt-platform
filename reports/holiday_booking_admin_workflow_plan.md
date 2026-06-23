# Holiday Booking Admin Workflow — Implementation Plan

## Current State

The holiday "Book directly" flow now works end-to-end for the customer:
1. User books → `holiday_bookings` record created (`status: payment_pending`)
2. User clicks "I Have Transferred" → status updated to `payment_submitted`
3. Admin sees booking in HolidayBookingsPanel on `/admin/holidays`

## What's Missing

| Gap | Details |
|-----|---------|
| No admin confirm payment | Admin sees "payment submitted" but can't mark it confirmed |
| No document request flow | No way to request passport/visa docs after payment confirmation |
| No customer notification | User gets no in-app notification when admin acts |
| No audit trail | Status changes not logged |
| No wallet transaction history | Holiday payments don't appear in user's wallet transaction list |
| No mobility score | User doesn't earn mobility points for completing a holiday |

## Existing Reusable Patterns (from service_orders)

| Pattern | File | How to Adapt |
|---------|------|-------------|
| Status update API | `POST /api/admin/orders/update-status` | Create `POST /api/admin/holidays/update-booking-status` — same transition map + notifications + audit log |
| Request documents API | `POST /api/admin/orders/request-documents` | Create `POST /api/admin/holidays/request-documents` — reuses `document_requests` table (`order_id` has no FK, accepts holiday booking IDs) |
| Booking detail page | `admin/orders/[id]/page.tsx` + `OrderDetailView.tsx` | Create `admin/holidays/bookings/[id]/page.tsx` + `HolidayBookingDetail.tsx` |
| Wallet transaction history | `dashboard/wallet/page.tsx` merges deposits + withdrawals + gifts | Add holiday bookings as 4th data source in the composite merge |
| Mobility score | `increment_mobility_score` RPC | Call on `completed` transition (existing RPC, no new SQL needed) |
| Customer notifications | `userNotifications` map in update-status route | Same pattern — per-status notification when admin updates booking |

## Key Design Decision: `document_requests` Reuse

The `document_requests` table has an `order_id` column with **no FK constraint** — it's a plain UUID string. This means it can already accept `holiday_bookings.id` values. The existing user-facing document upload UI (`DocumentRequestsList`, `DocumentUploadCard`) queries by `user_id`, so holiday document requests would display automatically on the `/dashboard/documents` page without changes.

**No new table needed.** We insert document requests with:
- `order_id = holiday_booking.id`
- `user_id = holiday_booking.user_id`

## Implementation Steps

### Step 1 — Add notes columns to `holiday_bookings` type + DB

Add `case_manager_notes` and `internal_notes` columns to the `holiday_bookings` Row/Insert/Update types in `database.ts`, and provide SQL to add them to the database table.

### Step 2 — Create `POST /api/admin/holidays/update-booking-status/route.ts`

Mirrors `POST /api/admin/orders/update-status/route.ts` exactly.

**Status transitions:**
```
payment_pending:    → ["payment_submitted", "cancelled"]
payment_submitted:  → ["payment_confirmed", "cancelled"]
payment_confirmed:  → ["documents_requested", "in_progress", "completed", "cancelled"]
in_progress:        → ["completed", "cancelled"]
cancelled:          → []
```

**Side effects per transition:**
- `payment_confirmed` → sends user notification
- `in_progress` → sends user notification
- `completed` → sends user notification + awards mobility score (+200 via `increment_mobility_score` RPC)
- All transitions → `admin_audit_log` insert

**Notification map (per status):**
```typescript
const userNotifications: Record<string, { title: string; body: string }> = {
  payment_confirmed: {
    title: "Payment confirmed ✓",
    body: "Your holiday payment has been confirmed. We will begin processing your booking.",
  },
  documents_requested: {
    title: "Documents needed",
    body: "Your case manager has requested documents for your holiday booking. Please upload them.",
  },
  in_progress: {
    title: "Booking in progress",
    body: "Your holiday booking is being processed by our team.",
  },
  completed: {
    title: "Holiday booking completed 🎉",
    body: "Your holiday booking is complete! Get ready for your trip.",
  },
  cancelled: {
    title: "Booking cancelled",
    body: "Your holiday booking has been cancelled. Please contact support if you have questions.",
  },
};
```

### Step 3 — Create `POST /api/admin/holidays/request-documents/route.ts`

Mirrors `POST /api/admin/orders/request-documents/route.ts` exactly.

- Accepts `{ bookingId, documents: [{ document_name, instructions }] }`
- Inserts into existing `document_requests` table with `order_id = bookingId`, `user_id = booking.user_id`
- Updates `holiday_bookings.status` to `"documents_requested"` + sets `documents_requested_at` timestamp
- Sends user notification listing document names

**Note:** `document_requests.order_id` is polymorphic (no FK), so holiday booking IDs work natively.

### Step 4 — Create booking detail page

**`src/app/(admin)/admin/holidays/bookings/[id]/page.tsx`** (server component):
- Fetches booking + user + holiday package + document_requests in parallel
- Passes enriched data to `HolidayBookingDetail` client component

**`src/components/admin/holidays/HolidayBookingDetail.tsx`** (client component):
Mirrors `OrderDetailView.tsx`:
- **Order summary card** — User, Package, Reference, Travellers, Total, Status badge, Created date
- **Status update panel** — Dropdown with valid transitions, case manager notes textarea, internal notes textarea, "Update status" button
- **Document request form** — Same as `DocumentRequestForm.tsx` (reuses existing pattern)
- **Documents list** — Shows requested docs with status badges + "View" link if uploaded

**Admin sidebar:** Add a "Holiday Bookings" link pointing to `/admin/holidays/bookings` (list page) — or keep the existing `/admin/holidays` as the list page and add the detail page as nested under it.

### Step 5 — Add wallet transaction history for holiday bookings

Update `src/app/(dashboard)/dashboard/wallet/page.tsx`:

Add a 4th data source to the composite transactions merge:
```typescript
const { data: holidayBookings } = await supabase
  .from("holiday_bookings")
  .select("*, holiday_packages(title)")
  .eq("user_id", user.id)
  .in("status", ["payment_confirmed", "completed"]);

// Map to transaction format:
...(holidayBookings || []).map((b: any) => ({
  id: b.id,
  type: "holiday_booking" as const,
  amount: b.total_price,
  currency: b.currency,
  ngn_equivalent: b.total_price,
  status: b.status,
  date: b.created_at,
  reference: b.reference,
  package_title: b.holiday_packages?.title || "Holiday booking",
  confirmed_at: b.updated_at,
}))
```

This mirrors the existing pattern exactly — deposits, withdrawals, gifts, and now holiday bookings are all merged into a single sorted list.

### Step 6 — Database migration SQL

Provide the user with a SQL script to run in Supabase Editor:
```sql
-- Add notes columns to holiday_bookings
ALTER TABLE holiday_bookings 
ADD COLUMN case_manager_notes TEXT DEFAULT NULL,
ADD COLUMN internal_notes TEXT DEFAULT NULL,
ADD COLUMN documents_requested_at TIMESTAMPTZ DEFAULT NULL;
```

## Files Summary

| # | Step | File | Change |
|---|------|------|--------|
| 1 | Step 1 | `src/types/database.ts` | Add `case_manager_notes`, `internal_notes`, `documents_requested_at` to `holiday_bookings` Row/Insert/Update |
| 2 | Step 2 | `src/app/api/admin/holidays/update-booking-status/route.ts` | **New** — status transitions + notifications + audit + mobility |
| 3 | Step 3 | `src/app/api/admin/holidays/request-documents/route.ts` | **New** — document request creation |
| 4 | Step 4 | `src/app/(admin)/admin/holidays/bookings/[id]/page.tsx` | **New** — booking detail server page |
| 5 | Step 4 | `src/components/admin/holidays/HolidayBookingDetail.tsx` | **New** — booking detail + status update + document request |
| 6 | Step 5 | `src/app/(dashboard)/dashboard/wallet/page.tsx` | Add holiday bookings to transaction history |
| 7 | Step 6 | - | SQL migration (notes columns) |

## What This Fixes

| Gap | Fixed By |
|------|----------|
| No admin confirm payment | Step 2 (update-booking-status API) |
| No document request flow | Step 3 (request-documents API + reuses `document_requests` table) |
| No customer notification | Step 2 + 3 (per-status `userNotifications` map) |
| No audit trail | Step 2 (`admin_audit_log` insert) |
| No wallet transaction history | Step 5 (add holiday bookings to wallet page) |
| No mobility score | Step 2 (`increment_mobility_score` RPC on `completed`) |
