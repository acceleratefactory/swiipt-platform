# Sprint 17 — Testing Walkthrough

## Prerequisites
- Run `sprint_17_certificate_helper.sql` in Supabase SQL Editor (adds `next_certificate_number` function)
- Add Stripe env vars to Vercel: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Configure Stripe webhook endpoint → `https://swiipt-platform.vercel.app/api/diaspora-gifts/webhook`
- Run `npm run build` locally before testing on Vercel

---

## Phase 1 — Global Profile

### Test 1.1 — Profile page loads
1. Log in as a regular user
2. Navigate to `/dashboard/profile`
3. **Expected:** 3-column layout loads (Identity | Financial | Global)
4. Identity column shows: completion circle, personal info, skills/languages tag editors, income dropdown, trust/readiness badges
5. Financial column shows: 6 metric cards, business badges, active goals
6. Global column shows: destinations, vault docs, certificates

### Test 1.2 — Add a skill
1. In the Skills section, type "JavaScript" and press Enter
2. **Expected:** Tag pill appears, auto-saves
3. Refresh the page — skill persists

### Test 1.3 — Add a language
1. In the Languages section, type "French" and press Enter
2. **Expected:** Tag pill appears, auto-saves

### Test 1.4 — Income dropdown
1. Click the income estimate selector
2. Select a range (e.g., "$3,000 – $5,000/month")
3. **Expected:** Value saves, completion percentage updates

### Test 1.5 — Profile completion
1. Fill in name, phone, country, skills, languages, income
2. **Expected:** Completion circle progress increases as fields are filled

### Test 1.6 — Trust score badge
1. If `financial_profiles` has a `trust_score`, the badge shows the score
2. **Expected:** Badge displays in Identity column

### Test 1.7 — Readiness score ring
1. **Expected:** Readiness score ring shows in Identity column (from `users.readiness_score`)

### Test 1.8 — Auto-recalculate trigger
1. Make a deposit and have an admin confirm it
2. **Expected:** `financial_profiles` is recalculated automatically (fire-and-forget POST to `/api/financial-profile/recalculate`)

---

## Phase 2 — Proof of Funds Certificate

### Test 2.1 — Certificate list page
1. Navigate to `/dashboard/profile/certificates`
2. **Expected:** "Request new certificate" button visible, list of existing certificates (if any)

### Test 2.2 — Request Proof of Funds
1. Click "Request new certificate"
2. Select "Proof of Funds" as type
3. Select an active goal with balance ≥ ₦50,000
4. **Expected:** Fee deposit flow initiates (₦15,000), shows bank details

### Test 2.3 — Fee deposit and certificate issuance
1. Complete the ₦15,000 fee deposit
2. Admin confirms the fee deposit
3. **Expected:** Certificate appears in the list with number `SWP-POF-2026-XXXXXX`

### Test 2.4 — Verify certificate (valid)
1. Click the "Verify" link on a valid certificate
2. **Expected:** `/verify/[code]` page shows green "Certificate Verified" header
3. Shows: certificate number, holder name, issue/expiry dates, goal summary, issuer badge

### Test 2.5 — Download PDF
1. Click "Download PDF" on a certificate
2. **Expected:** A4 PDF downloads with: goal summary, current balance, deposit history, platform branding

### Test 2.6 — Verify certificate (expired)
1. (Admin) Set `expires_at` to a past date in the `platform_certificates` table
2. Refresh the verify page
3. **Expected:** Red "Certificate Expired" state with appropriate message

---

## Phase 3 — Trust Certificate

### Test 3.1 — Request Trust Certificate
1. Navigate to `/dashboard/profile/certificates`
2. Click "Request new certificate"
3. Select "Trust Certificate" as type
4. **Expected:** Fee deposit flow initiates (₦10,000)

### Test 3.2 — Trust Certificate number format
1. Complete the fee deposit
2. **Expected:** Certificate number format: `SWP-TC-2026-XXXXXX`

### Test 3.3 — Verify Trust Certificate
1. Click the verify link
2. **Expected:** Green verification state, shows behavioral data:
   - Platform tenure
   - Deposit consistency score
   - Services completed count
   - Trust score
   - Compliance badges

### Test 3.4 — Download Trust Certificate PDF
1. Click "Download PDF"
2. **Expected:** PDF with: platform tenure, trust score, goals, compliance badges

### Test 3.5 — Certificates page shows both types
1. **Expected:** Both POF and TC certificates appear in the list with correct type labels

---

## Phase 4 — Agent Escrow Portal

### Test 4.1 — Partner registration (public)
1. Visit `/partners/apply` (incognito or logged out)
2. **Expected:** Form renders with all fields
3. Fill in: name, business name, email, phone
4. Select partner type: "Immigration Lawyer"
5. Enter CAC number, licence number, years in operation
6. Add specialisations (multi-select tags)
7. Add destinations served (multi-select tags)
8. Upload a PDF verification document
9. Submit
10. **Expected:** Success message, `platform_partners` record created with `status = 'pending'`

### Test 4.2 — Admin receives notification
1. Log in as admin
2. **Expected:** Notification with type `partner_application` appears in notification drawer
3. Click notification → navigates to `/admin/partners/[id]`

### Test 4.3 — Admin partner list
1. Navigate to `/admin/partners`
2. **Expected:** Table shows all partner applications with status badges
3. Use status filter (Pending/Active/Suspended/Rejected)
4. Use type filter (Immigration Lawyer, Visa Agent, etc.)
5. Click a row → navigates to detail page

### Test 4.4 — Admin approves partner
1. On `/admin/partners/[id]`
2. **Expected:** Shows full profile, verification documents with links
3. Enter admin note (e.g., "Documents verified, CAC check passed")
4. Click ✓ Approve
5. **Expected:** Status changes to `active`, audit log entry created

### Test 4.5 — Commission rate setting
1. On the same partner detail page
2. Find the "Commission Rate" section
3. Change the percentage (e.g., 5% → 7%)
4. Click "Update"
5. **Expected:** Fee updates, audit log records the change

### Test 4.6 — Agent directory
1. Log in as a regular user
2. Navigate to `/dashboard/find-agent`
3. **Expected:** Grid of active partners with PartnerCard components
4. Use filter bar: filter by type, filter by destination, sort by rating/deals/name
5. **Expected:** Cards show: agent name, business name, specialisations (tag pills), destinations, rating ★ X.X, deal count

### Test 4.7 — Agent detail + create escrow deal
1. Click "Work with this agent →" on a card
2. **Expected:** Full profile page with verification badges, experience, specialisations, destinations, review stats, escrow volume
3. Scroll to "Create escrow deal" form
4. Enter: deal title, description, total amount (₦500,000)
5. Add milestone 1: title "Visa consultation", description "Initial consultation", percentage 30%
6. Add milestone 2: title "Application processing", percentage 50%
7. Add milestone 3: title "Visa approval", percentage 20%
8. **Expected:** Amount auto-calculates per milestone (₦150K/₦250K/₦100K), allocation shows 100%
9. Submit
10. **Expected:** Escrow deal created, returned `dealId` and `savingsGoalId`

### Test 4.8 — Milestone completion flow
1. Client deposits into the linked savings goal
2. Admin confirms the deposit
3. (Client or admin) marks milestone 1 as complete via API
4. **Expected:** Milestone status becomes `completed_pending_admin`
5. Admin uses `POST /api/escrow/admin-confirm-milestone`
6. **Expected:** Milestone becomes `completed`, client receives notification
7. If all milestones done, deal becomes `completed`

### Test 4.9 — Admin partner detail — reject/suspend
1. Navigate to a pending partner
2. Enter admin note
3. Click ✕ Reject
4. **Expected:** Status changes to `rejected`
5. For an active partner, click "Suspend"
6. **Expected:** Status changes to `suspended`

---

## Phase 5 — Diaspora Gift

### Test 5.1 — Share gift link
1. Log in, navigate to a goal detail page
2. **Expected:** Two buttons visible: "🎁 Gift" (existing) and "🎁 Share gift link" (new)
3. Click "🎁 Share gift link"
4. **Expected:** "Link copied ✓" feedback for 2 seconds
5. URL copied: `{origin}/fund/{goalId}`

### Test 5.2 — Public diaspora gift page
1. Open the link in incognito (no login)
2. **Expected:** Page shows:
   - "Support {name}'s goal" heading
   - Goal name with progress bar (₦X / ₦Y)
   - Gift amount selector: ₦10K, ₦25K, ₦50K, Custom
   - Currency selector: NGN, GBP, USD, EUR, CAD
   - Your name (required input)
   - Email (optional)
   - Gift message textarea (max 200 chars)
   - "Send gift" button

### Test 5.3 — Select amount and currency
1. Select ₦25,000 preset
2. Switch currency to GBP
3. **Expected:** Button text updates to show equivalent in GBP

### Test 5.4 — Custom amount
1. Click "Custom" button
2. Enter ₦75,000
3. **Expected:** Amount input appears, submit button shows the custom amount

### Test 5.5 — Submit gift form
1. Enter name: "Jane Gift"
2. Enter message: "Good luck with your move!"
3. Click "Send gift — £X"
4. **Expected:** Redirected to Stripe Checkout page

### Test 5.6 — Complete Stripe payment
1. On Stripe Checkout, use test card: `4242 4242 4242 4242`
2. Complete the payment
3. **Expected:** Redirected back to `/fund/{goalId}?success=true`
4. **Expected:** Success page shows "Gift sent successfully!" with "Send another gift" link

### Test 5.7 — Webhook processing
1. After Stripe payment, the webhook fires
2. **Expected:**
   - `diaspora_gifts` record updated to `status = 'completed'`
   - `savings_goals.current_balance` incremented by credited amount (minus 1.5% fee)
   - `stripe_payment_intent_id` saved
   - `activity_log` entry created (`type: diaspora_gift_received`)
   - Notification sent to recipient: "🎁 Jane Gift sent you a gift!"

### Test 5.8 — Goal balance reflects gift
1. Log in as the goal holder
2. Navigate to the goal detail page
3. **Expected:** Current balance has increased by the credited NGN amount
4. Transaction history shows the gift

### Test 5.9 — Goal holder notification
1. Check notification drawer
2. **Expected:** "🎁 Jane Gift sent you a gift!" notification with action link to the goal

---

## Admin Verification

### Nav sidebar
- Dashboard sidebar: "My Profile" at index 1, "Find an Agent" at index 10
- Admin sidebar: "Partners" at index 17 (after Subscribers, before Corporate)

### API routes
Verify these endpoints exist and return proper responses:

| Method | Route | Expected |
|--------|-------|----------|
| POST | `/api/financial-profile/recalculate` | 200 with `{ success: true, profile: {...} }` |
| POST | `/api/certificates/proof-of-funds` | 200 with `{ success: true, certificate: {...} }` |
| POST | `/api/certificates/trust` | 200 with `{ success: true, certificate: {...} }` |
| GET | `/api/certificates/[code]/download` | 200 with PDF buffer |
| POST | `/api/partners/apply` | 200 with `{ success: true, partner: {...} }` |
| POST | `/api/escrow/create-deal` | 200 with `{ dealId, savingsGoalId }` |
| POST | `/api/escrow/complete-milestone` | 200 with `{ success: true, status: "completed_pending_admin" }` |
| POST | `/api/escrow/admin-confirm-milestone` | 200 with `{ success: true, allCompleted: boolean }` |
| POST | `/api/admin/partners/update-status` | 200 with `{ success: true }` |
| POST | `/api/diaspora-gifts/create-session` | 200 with `{ checkoutUrl: string }` |
| POST | `/api/diaspora-gifts/webhook` | 200 with `{ received: true }` |

---

## Post-Deployment Checklist

- [ ] Run `sprint_17_certificate_helper.sql` in Supabase SQL Editor
- [ ] Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to Vercel env vars
- [ ] Configure Stripe webhook in Stripe Dashboard → `https://swiipt-platform.vercel.app/api/diaspora-gifts/webhook`
- [ ] Verify `npm run build` passes on CI
- [ ] Spot-check all 5 phases on production after deploy
