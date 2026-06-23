# Holiday Booking Flow — Testing Walkthrough

## Prerequisites

1. **SQL must be run** — Open Supabase SQL Editor, paste and run `reports/holiday_bookings_migration.sql`. This creates the `holiday_bookings` table.
2. **Vercel must be deployed** — Verify the deployment finished successfully (check Vercel dashboard). The latest commits (`2bcc96f`) include all 12 commits.
3. **You need at least one active holiday package** — Create one via `/admin/holidays` → "+ New package".

---

## 1. Regular User — Book a holiday

1. Go to **Dashboard → Holidays**
2. Click on a package → **"Book directly"**
3. Fill in travellers/currency → submit
4. **Expect**: See booking success screen with:
   - Reference number (`SWP-HOL-...`)
   - Total price
   - Bank transfer details (account name, number, bank)
5. Click **"I Have Transferred the Payment ✓"** button
6. **Expect**: Status changes to "Transfer submitted" with confirmation message
7. Go to **Dashboard → Wallet**
8. **Expect**: After admin confirms payment, the holiday booking appears in the transaction list (filter by "Holiday Bookings" type)

---

## 2. Admin — View and confirm booking

1. Go to **/admin/holidays**
2. **Expect**: See "Booking Requests" panel below the packages table — the new booking appears with status "Payment Submitted"
3. Click the booking row
4. **Expect**: Detail page at `/admin/holidays/bookings/[id]` with:
   - **Left column**: Booking summary card showing User, Package, Reference, Travellers, Total, Status badge, Created date
   - **Status update panel**: Dropdown to change status, Case Manager Notes textarea, Internal Notes textarea, "Update Status" button
   - **Right column**: Document request form + list of requested documents
5. Change status to **"payment_confirmed"** → click "Update Status"
6. **Expect**: Status badge updates, user notification created

---

## 3. Admin — Request documents

1. On the same booking detail page, use the **Document Request** form
2. Enter document name (e.g. "Passport") + instructions (e.g. "Upload clear copy")
3. Click "Request Document"
4. **Expect**: Status changes to "Docs Requested", document appears in the list below
5. As the **user**: Go to **Dashboard → Documents**
6. **Expect**: The document request visible and ready for upload

---

## 4. Admin — Complete booking

1. On the booking detail page, change status to **"completed"**
2. **Expect**: Status badge updates, user notification created
3. **Behind the scenes**: User's mobility score increases by +200 points

---

## Common issues

| Symptom | Likely cause |
|---------|-------------|
| "Booking Requests" panel is empty | `holiday_bookings` table doesn't exist — run the SQL |
| Wallet doesn't show holiday bookings | Missing RLS SELECT policy — included in the SQL migration |
| "I Have Transferred" button not visible | Old Vercel build — check deployment status |
| Admin can't see /admin/holidays | User missing `admin` or `case_manager` role in `user_roles` table |
| 500 error when booking | Vercel env vars missing `SUPABASE_SERVICE_ROLE_KEY` |
