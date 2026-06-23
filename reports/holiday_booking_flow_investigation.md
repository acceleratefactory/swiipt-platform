# Holiday "Book Directly" Flow — End-to-End Investigation

**Date:** 2026-06-23  
**Scope:** Full trace of the holiday "Book directly" flow from UI to database to admin  
**Status:** INCOMPLETE — Critical gaps found in data persistence, user confirmation, admin visibility, and notifications

---

## 1. Executive Summary

The "Book directly" flow for holidays appears functional from the user's perspective (they see bank details and a reference number), but **the booking is never persisted** in any dedicated database table, **the user has no way to confirm they have sent payment**, **the admin has no dashboard to view holiday bookings**, and **no notification is sent to the customer**. The flow ends with a modal showing bank details and a "Close" button — nothing more.

---

## 2. File Inventory & Role in the Flow

### 2.1 Dashboard Pages

| File | Role |
|------|------|
| src/app/(dashboard)/dashboard/holidays/page.tsx | Server component. Fetches holiday_packages, user preferred_currency, and active savings_goals. Renders HolidayGrid. |
| src/app/(dashboard)/dashboard/holidays/[id]/page.tsx | Server component. Fetches a single holiday_packages row by ID. Renders HolidayDetailView. |

### 2.2 Dashboard UI Components

| File | Role |
|------|------|
| src/components/dashboard/holidays/HolidayGrid.tsx | Client component. Renders package cards with destination/duration filters. Both "Save toward this" and "Book directly" buttons call setSelectedPackage(pkg) which opens HolidayBookingFlow in a modal. **No separate action for each button** — both open the same flow. |
| src/components/dashboard/holidays/HolidayDetailView.tsx | Client component. Renders full package detail. Both buttons call setShowBooking(true) which opens HolidayBookingFlow in a modal. Same pattern as Grid. |
| src/components/dashboard/holidays/HolidayBookingFlow.tsx | Client component. **Core of the broken flow.** Has two modes: "save" (inserts into savings_goals) and "book" (POST to /api/holidays/book). The "book" flow: shows traveller count selector and price, calls API, receives { reference, totalPrice, bankDetails }, displays bank transfer details. **CRITICAL MISSING PIECE: No "I Have Transferred" button.** Only a "Close" button. |

### 2.3 API Routes

| File | Role |
|------|------|
| src/app/api/holidays/book/route.ts | **The only holiday booking API.** Accepts POST with { packageId, travellers, currency }. Generates reference SWP-HOL-..., looks up bank details from platform_settings, inserts activity_log entry, inserts notifications row for admin. **Does NOT create any booking/order record.** **Does NOT create any customer notification.** |
| src/app/api/admin/holidays/upsert/route.ts | Admin-only. Creates/updates holiday_packages rows. Not part of the booking flow. |
| src/app/api/admin/holidays/toggle/route.ts | Admin-only. Toggles is_active on holiday_packages. Not part of the booking flow. |

### 2.4 Admin Pages

| File | Role |
|------|------|
| src/app/(admin)/admin/holidays/page.tsx | Lists holiday **packages** for CRUD (create, edit, toggle active). **No booking management.** |
| src/app/(admin)/admin/holidays/new/page.tsx | Create new holiday package. Not part of booking flow. |
| src/app/(admin)/admin/holidays/[id]/page.tsx | Edit holiday package. Not part of booking flow. |
| src/app/(admin)/admin/orders/page.tsx | Lists service_orders records. **Does NOT query any holiday booking data.** The holiday booking notification points here (action_url: "/admin/orders"), but holiday bookings are never stored in service_orders. |
| src/app/(admin)/admin/orders/[id]/page.tsx | Detail view for a service_orders record. Not relevant to holiday bookings. |
| src/app/(admin)/admin/notifications/page.tsx | Admin broadcast notification history. Shows activity_log for notification_broadcast events. Does not display incoming holiday booking notifications. |

### 2.5 Admin Components

| File | Role |
|------|------|
| src/components/admin/holidays/HolidayPackagesTable.tsx | Table for managing holiday packages (CRUD). Not related to bookings. |
| src/components/admin/holidays/HolidayPackageForm.tsx | Form for creating/editing holiday packages. Not related to bookings. |
| src/components/admin/shell/AdminShell.tsx | Admin layout. Passes pendingDeposits and pendingWithdrawals counts. **No pending holiday bookings count.** |
| src/components/admin/shell/AdminSidebar.tsx | Admin sidebar nav. Has "Orders" (service_orders) and "Holidays" (package management). **No Holiday Bookings nav item.** |

### 2.6 Supporting Infrastructure (relevant patterns)

| File | Role |
|------|------|
| src/types/database.ts | TypeScript definitions for all DB tables. **There is NO holiday_bookings or holiday_payments table defined.** The closest tables are: holiday_packages (package definitions), savings_goals (for "save toward this"), service_orders (for service orders, NOT holidays), notifications (used but limited), activity_log (used for logging). |
| src/components/dashboard/services/DirectPaymentFlow.tsx | **Reference implementation** of how service direct payment works correctly — includes a working "I Have Transferred the Payment" button and a POST /api/services/direct-payment/confirm endpoint. Holiday flow has no equivalent. |
| src/app/api/services/order/route.ts | **Reference implementation** — creates a service_orders record, applies credit, inserts admin notification, logs activity. Holiday booking does none of this. |
| src/app/api/services/direct-payment/confirm/route.ts | **Reference implementation** — updates service_orders status to payment_submitted, creates admin notification. No holiday equivalent exists. |
| src/app/api/admin/orders/update-status/route.ts | Admin order status management for service_orders. No holiday equivalent. |

---

## 3. Complete Flow Trace — What Happens

### Step-by-step trace of "Book directly"

1. **User clicks "Book directly"** on a holiday package card (HolidayGrid.tsx line 120-125) or on the detail page (HolidayDetailView.tsx line 90-96).

2. **Modal opens** showing HolidayBookingFlow (HolidayBookingFlow.tsx) with the action selector — user clicks "Book directly" (line 139).

3. **Traveller count and currency selectors** shown (lines 162-193). User adjusts travellers, sees auto-calculated total.

4. **User clicks "Pay via bank transfer"** (line 208-214). Calls handleBook().

5. **handleBook()** (lines 47-63) POSTs to /api/holidays/book with { packageId, travellers, currency }.

6. **Server-side POST /api/holidays/book** (book/route.ts):
   - Authenticates user (OK)
   - Fetches holiday package (OK)
   - Calculates pricePerPerson * travellers (OK)
   - Generates reference SWP-HOL-{userPrefix}-{timestamp} (OK)
   - Fetches bank details from platform_settings (OK)
   - **Inserts activity_log** row with event_type: "holiday_booking_initiated" (OK)
   - **Inserts notifications** row with user_id: null (admin notification) and action_url: "/admin/orders" (OK)
   - **Returns** { success, reference, totalPrice, currency, bankDetails } (OK)
   - **MISSING: Never creates a service_orders record or any booking record**
   - **MISSING: Never creates a customer notification**

7. **Client receives response** (HolidayBookingFlow.tsx line 56-57), sets result state.

8. **Result screen renders** (lines 66-116):
   - Shows "Booking initiated!" (OK)
   - Shows reference number (OK)
   - Shows bank details (bank name, account name, account number) (OK)
   - Shows total price (OK)
   - **Shows "Close" button only** — user can dismiss the modal
   - **MISSING: No "I Have Transferred" button** (contrast with DirectPaymentFlow.tsx which has one)
   - **MISSING: No confirmation for the user that their booking is tracked**

9. **User closes modal** — booking information is lost (no persistence beyond activity_log).

### What the Admin Sees

- A notification appears in the notifications table with type: "holiday_booking" and action_url: "/admin/orders"
- **But when admin visits /admin/orders**, the page queries service_orders table — which contains no holiday booking records
- **The admin sees nothing related to the holiday booking**
- The admin holidays page (/admin/holidays) only manages packages, not bookings
- There is no badge/badge counter on the admin sidebar for pending holiday bookings

### What the Customer Sees/Receives

- The modal with bank details (temporary, dismissable)
- **No email confirmation**
- **No SMS notification**
- **No in-app notification** (the notifications insert has user_id: null — admin-only)
- **No persistent booking record** they can view later

---

## 4. Identified Gaps (Break Points)

### GAP 1 — No Database Table for Holiday Bookings (CRITICAL)

**Evidence:** The full database schema in src/types/database.ts has no holiday_bookings or holiday_payments table. The service_orders table exists but is designed for service_packages (visa, residency, etc.), not holiday packages.

**Impact:** Holiday "bookings" are not persisted anywhere. After the user closes the modal, the only trace is:
- An activity_log entry (event_type: "holiday_booking_initiated")
- An admin notification with user_id: null

Neither of these constitutes a trackable booking record. There is no way to know:
- Which users have booked
- Which packages they booked
- Whether payment was made
- The booking status

### GAP 2 — No Booking Record Creation in the API (CRITICAL)

**Evidence:** The POST /api/holidays/book route (src/app/api/holidays/book/route.ts) calculates the price, generates a reference, fetches bank details, logs activity, and creates an admin notification — but **never inserts a record into any bookings/orders table**.

**Contrast with the service order flow** (src/app/api/services/order/route.ts) which:
1. Creates a service_orders record with user_id, package_id, payment_method, pricing, status
2. Applies credits if available
3. Creates admin notification with action_url: "/admin/orders"
4. Logs activity

The holiday API does step 3 and 4 but **skips step 1 entirely**.

### GAP 3 — No "I Have Transferred" Confirmation Button (CRITICAL)

**Evidence:** HolidayBookingFlow.tsx (lines 66-116) shows the result screen with bank details and only a "Close" button. Compare with DirectPaymentFlow.tsx which has an "I Have Transferred the Payment" button that calls POST /api/services/direct-payment/confirm.

**Impact:** After seeing their bank details, the user has no way to tell the system "I have sent the money." They simply close the modal and the booking is forgotten. There is no mechanism to:
- Update the booking status to "payment submitted"
- Notify the admin that payment has been sent
- Track when payment was submitted

### GAP 4 — No Payment Confirmation API (CRITICAL)

**Evidence:** There is no /api/holidays/confirm-payment or /api/holidays/confirm route. The only holiday API route is POST /api/holidays/book.

**Contrast:** The services flow has POST /api/services/direct-payment/confirm which updates the order status to payment_submitted and notifies admin.

### GAP 5 — No Admin Dashboard for Holiday Bookings (HIGH)

**Evidence:**
- /admin/holidays manages packages only (CRUD)
- /admin/orders queries service_orders only
- No admin page queries for "holiday bookings" or reads from a booking table
- Admin sidebar has no "Holiday Bookings" nav item
- Admin layout does not count pending holiday bookings
- The notification action_url: "/admin/orders" leads to a page that shows no holiday booking data

**Impact:** Even if bookings were stored, there is no admin interface to view, filter, or manage them. Admin would need to dig through activity_log to find holiday_booking_initiated events.

### GAP 6 — No Customer Notification (HIGH)

**Evidence:** The notifications.insert call in POST /api/holidays/book uses user_id: null, which creates a system/admin-level notification only. No notification is created for the user.

**Contrast:** The service order flow creates user-specific notifications when status changes (src/app/api/admin/orders/update-status/route.ts lines 99-106).

**Impact:** The customer receives no confirmation that their booking was received. No email, no in-app notification, no SMS.

### GAP 7 — No Booking Status Tracking (MEDIUM)

**Evidence:** There is no status field, no transition logic, and no mechanism to track a booking through stages like initiated -> payment_pending -> payment_submitted -> payment_confirmed -> confirmed.

**Contrast:** service_orders has a full status workflow (src/app/api/admin/orders/update-status/route.ts).

### GAP 8 — No Booking History for Users (MEDIUM)

**Evidence:** There is no dashboard page or component that shows users their past or pending holiday bookings. No holiday_bookings table to query.

---

## 5. Comparison: Working "Save Toward This" vs. Broken "Book Directly"

| Aspect | "Save Toward This" | "Book Directly" |
|--------|-------------------|-----------------|
| UI button exists | Yes | Yes |
| Data persisted | Yes — savings_goals table | **No — no booking table exists** |
| API endpoint | Direct Supabase insert | POST /api/holidays/book |
| Creates DB record | savings_goals row | **No record created** |
| Admin visibility | Goals visible on user profile | **No admin visibility** |
| User confirmation | In-app message | In-app message only |
| User notification | None specific | None |
| Follow-up action | User can deposit toward goal | **No "I Have Transferred" button** |
| Status tracking | active/completed/withdrawn/cancelled | **None — no status field** |

---

## 6. What Needs to Be Built

To fix this flow, the following must be implemented:

1. **New DB table: holiday_bookings** (or extend service_orders to support holiday packages)
   - Fields: id, user_id, package_id, travellers, currency, total_price, reference_number, status (initiated/payment_pending/payment_submitted/payment_confirmed/confirmed/cancelled), bank_details_snapshot, created_at, updated_at, user_confirmed_at, admin_confirmed_at, confirmed_by

2. **Update POST /api/holidays/book**: Insert a row into holiday_bookings table with status "initiated" or "payment_pending"

3. **New API route: POST /api/holidays/confirm-payment** (or similar): Allow user to mark payment as sent, update status to payment_submitted, notify admin

4. **New API route: POST /api/admin/holidays/bookings/update-status**: Admin confirmation of holiday booking payments

5. **New admin page: /admin/holidays/bookings**: List all holiday bookings with filtering by status, user info, package info

6. **Update HolidayBookingFlow.tsx**: Add an "I Have Transferred" button after showing bank details (following the pattern in DirectPaymentFlow.tsx)

7. **Add user notification**: Create a notification for the user when booking is initiated and when status changes

8. **Add admin notification with correct action URL**: Point to /admin/holidays/bookings (once it exists) instead of /admin/orders

9. **Add pending bookings badge to admin sidebar**: Similar to the pending deposits badge

10. **Add holiday bookings section to user dashboard**: Allow users to view their booking history and status

---

## 7. Summary Table of All Files Involved

| File | Purpose | Role in Flow | Status |
|------|---------|-------------|--------|
| src/app/(dashboard)/dashboard/holidays/page.tsx | Holiday packages listing page | Entry point | OK |
| src/app/(dashboard)/dashboard/holidays/[id]/page.tsx | Single package detail page | Entry point | OK |
| src/components/dashboard/holidays/HolidayGrid.tsx | Package cards grid | Triggers booking modal | OK |
| src/components/dashboard/holidays/HolidayDetailView.tsx | Package detail view | Triggers booking modal | OK |
| src/components/dashboard/holidays/HolidayBookingFlow.tsx | Booking flow (save or book) | Core UI — calls API, shows result | **GAP 3** — Missing confirmation button |
| src/app/api/holidays/book/route.ts | Book API endpoint | Generates ref, returns bank details | **GAP 2, 6** — No record created, no customer notification |
| src/types/database.ts | DB type definitions | Schema reference | **GAP 1** — No holiday_bookings table |
| src/app/(admin)/admin/holidays/page.tsx | Admin package management | Not for bookings | OK (not part of flow) |
| src/app/(admin)/admin/holidays/[id]/page.tsx | Admin package edit | Not for bookings | OK |
| src/app/(admin)/admin/holidays/new/page.tsx | Admin package create | Not for bookings | OK |
| src/components/admin/holidays/HolidayPackagesTable.tsx | Admin package table | Not for bookings | OK |
| src/components/admin/holidays/HolidayPackageForm.tsx | Admin package form | Not for bookings | OK |
| src/app/api/admin/holidays/upsert/route.ts | Admin upsert API | Not for bookings | OK |
| src/app/api/admin/holidays/toggle/route.ts | Admin toggle API | Not for bookings | OK |
| src/app/(admin)/admin/orders/page.tsx | Admin service orders | Dead-end for holiday notifs | **GAP 5** — Wrong destination |
| src/components/admin/shell/AdminShell.tsx | Admin layout | Passes counts to sidebar | **GAP 5** — No booking count |
| src/components/admin/shell/AdminSidebar.tsx | Admin sidebar nav | Navigation | **GAP 5** — No bookings link |
| src/components/dashboard/services/DirectPaymentFlow.tsx | Service direct payment (reference) | Shows correct pattern | **Reference** — Has confirmation button |
| src/app/api/services/order/route.ts | Service order API (reference) | Shows correct pattern | **Reference** — Creates DB record |
| src/app/api/services/direct-payment/confirm/route.ts | Service payment confirm (reference) | Shows correct pattern | **Reference** — Updates status, notifies |
| src/app/api/admin/orders/update-status/route.ts | Admin order status (reference) | Shows correct pattern | **Reference** — Status workflow |
