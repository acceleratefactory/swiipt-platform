# Investigation: Service Payment Flow vs Group Buy Payment Flow

## Executive Summary

The service payment flow (`OrderFlow` → `DirectPaymentFlow` → `POST /api/services/order` → `POST /api/services/direct-payment/confirm`) has a **critical recovery gap** — identical to the one we just fixed for group buy, but with no recovery path at all.

**Group buy** now has full recovery: resume button, cancel button, user_confirmed_at discriminator, admin transitions, cron cleanup. **Service** has none of this.

---

## Flow Comparison

### Group Buy Flow (FIXED)

```
Dashboard → Click "Pay now" → Modal opens
  → DirectPaymentStep useEffect → POST /api/group-buy/pay
    → Creates order/booking + sets group_buy_members.status = pending_payment
    → Stores payment_reference on group_buy_members
    → Sets user_confirmed_at = null
  → Shows bank details + reference
  → User closes modal → membership stuck at pending_payment

  RECOVERY:
  → "Continue Payment →" button visible on group detail page
  → Modal reopens → ResumeDirectPaymentStep
  → Shows bank details + "I Have Transferred"
  → POST /api/group-buy/confirm-payment → sets user_confirmed_at
  → Admin sees status → confirms → membership → paid
  → Cron cleans up abandoned (unconfirmed) and expired (24h post-confirm)
```

### Service Flow (NOT FIXED)

```
Services page → Click service → "Pay directly via bank transfer"
  → DirectPaymentFlow useEffect → POST /api/services/order
    → Creates service_orders row with status = payment_pending
    → Returns orderReference (NOT persisted to DB — only in API response)
  → Shows bank details + reference
  → User closes modal → order stuck at payment_pending

  NO RECOVERY:
  → No "Continue Payment" button anywhere
  → No resume mechanism
  → No cancel mechanism for user
  → No user_confirmed_at column on service_orders
  → No admin transition from payment_pending → payment_submitted
  → Cron only cleans up deposits, not service orders
  → Only escape: contact admin to manually set withdrawn
```

---

## Critical Discrepancies

### 1. Reference Not Persisted (Service)

**Group buy:** `payment_reference` column on `group_buy_members` — set by `POST /api/group-buy/pay`
**Service:** Reference generated in API response (`SWP-ORD-{prefix}-{timestamp}`) but **never stored** in `service_orders`

- `service_orders` has no `reference` column
- Reference is returned to the client in the API response body
- If user closes modal, the reference is lost
- Resume flow would have no way to show the reference

**Impact:** Even if we add a resume mechanism, we can't show the payment reference on resume.

### 2. No Resume Button (Service)

**Group buy:** `GroupDetailActions.tsx` renders amber "Continue Payment →" button when `status === "pending_payment"`
**Service:** `ServiceOrderCard.tsx` renders status badge + "View Details" → navigates to detail page — no resume option

- `ServiceOrderCard.tsx:112` — status badge for `payment_pending` shows "⏳ Awaiting payment"
- No conditional button for resuming direct payment
- User has no way to get back to the bank details screen

### 3. No User Confirmation Step (Service)

**Group buy:** `POST /api/group-buy/confirm-payment` sets `user_confirmed_at` timestamp
**Service:** `POST /api/services/direct-payment/confirm` just updates status to `payment_submitted` — no confirmation timestamp

- Group buy discriminates: `user_confirmed_at IS NULL` = resumable, `NOT NULL` = confirmed
- Service has no equivalent — `payment_pending` is the only state between order creation and admin confirmation
- No way to distinguish "user hasn't confirmed yet" from "user confirmed but admin hasn't acted"

### 4. No Cancel Mechanism (Service)

**Group buy:** `POST /api/group-buy/cancel-payment` — reverts membership to `committed`, cancels linked order/booking
**Service:** No cancel endpoint for service orders

- User can't cancel a `payment_pending` order
- Admin can set `cancelled` but there's no user-facing cancel

### 5. No Admin Resume Transition (Service)

**Group buy:** Admin can set `pending_payment → ["paid", "committed", "withdrawn"]`
**Service:** Admin can only set `payment_pending → ["payment_submitted", "payment_confirmed", "cancelled"]`

- No `committed` equivalent for service (revert to pre-payment state)
- `payment_submitted` = "I've sent the money" (user confirmation)
- But admin can manually set this without user confirming — bypasses the confirmation step

### 6. No Cron Cleanup (Service)

**Group buy:** `POST /api/group-buy/expire` — cleans up abandoned (unconfirmed) and expired (24h post-confirm) memberships
**Service:** `GET /api/messaging/scheduled/expire-deposits` — only cleans up deposits, not service orders

- `payment_pending` service orders never expire
- Orphaned orders accumulate in the database

---

## Risk Assessment

| Issue | Severity | Exploitable? | Group Buy Status |
|-------|----------|-------------|-----------------|
| Reference not persisted | High | Yes — user closes modal, can't resume with correct reference | Fixed (stores on membership) |
| No resume button | High | Yes — user can't get back to payment screen | Fixed (amber button) |
| No confirmation timestamp | Medium | Yes — admin can't tell if user actually sent money | Fixed (user_confirmed_at) |
| No cancel mechanism | Medium | Yes — user stuck with pending order, can't cancel | Fixed (cancel endpoint) |
| No cron cleanup | Low | Accumulates orphaned rows over time | Fixed (expire route) |
| No admin revert | Low | Admin can't undo accidental payment_pending | Fixed (committed transition) |

---

## Service Orders — What Would Need to Change

To bring service payment flow to parity with group buy recovery:

1. **Add `reference` column to `service_orders`** — persist the generated reference
2. **Add `user_confirmed_at` column to `service_orders`** — same discriminator pattern
3. **Create `GET /api/services/payment-status`** — check for resumable pending order
4. **Create `POST /api/services/cancel-payment`** — user can cancel pending order
5. **Modify `POST /api/services/direct-payment/confirm`** — set `user_confirmed_at` instead of status change
6. **Add resume button to `ServiceOrderCard.tsx`** — for `payment_pending` with `user_confirmed_at IS NULL`
7. **Add resume step to `DirectPaymentFlow.tsx`** — show bank details from DB, not API response
8. **Add `payment_pending → ["payment_submitted", "committed", "cancelled"]` to admin transitions**
9. **Add cleanup to cron** — expire abandoned service orders

---

## Recommendation

The service payment flow needs the same treatment we just gave group buy. The fixes are surgical and follow the same proven pattern.

**Estimated effort:** 9 steps (mirrors group buy implementation)

**Priority:** High — same UX gap, same orphaned order risk, same user frustration.

---

*Generated: 2026-06-26*
*Status: Investigation complete — ready for implementation planning*
