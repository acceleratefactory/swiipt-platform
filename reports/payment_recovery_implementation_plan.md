# Group Buy Payment Recovery — Implementation Plan

## Problem Statement

When a user selects "Direct Bank Transfer" in the group buy payment modal, `POST /api/group-buy/pay` immediately sets the membership status to `pending_payment` and creates a linked order/booking. If the user closes the modal *before* clicking "I Have Transferred the Payment ✓", there is no way to:

1. Re-open the modal to see the bank details/reference again
2. Continue the payment from where they left off
3. Switch to goal redemption instead
4. Cancel the pending payment and start fresh

The user is stuck — the "Pay now" button only renders for `committed` status, and the only escape is contacting an admin.

---

## Reference Pattern: Goal Deposit Resume Flow

The **goal deposit flow** (`GoalDepositFlow.tsx`) solves this exact problem with a proven 3-part pattern:

### Part 1 — Detection on mount
```
GoalDepositFlow mounts
  └─ useEffect → GET /api/goals/deposit/initiate?goalId=X
       └─ checks: deposits WHERE status='pending' AND user_confirmed_at IS NULL
            └─ found → setStep("resume"), show saved bank details + 2 actions
            └─ not found → show normal amount form
```

### Part 2 — GET endpoint for pending check
```
GET /api/goals/deposit/initiate?goalId=X
  └─ returns { hasPending, depositId, reference, amount, bankDetails }
  └─ State discrimination: status='pending' AND user_confirmed_at IS NULL
```

### Part 3 — POST handler also checks
```
POST /api/goals/deposit/initiate
  └─ before creating new deposit, checks for existing pending
  └─ found → returns { ...existingData, resumed: true }
  └─ not found → creates new deposit
```

### Part 4 — Resume UI with two actions
```
Resume screen:
  ├─ Info banner: "You have a pending deposit that was not yet confirmed..."
  ├─ Saved details: Amount, Reference, Bank, Account number, Account name
  ├─ [I Have Sent the Money ✓] → sets user_confirmed_at + expires_at → enters admin-waiting
  └─ [Cancel & start new] → sets status='cancelled' → shows fresh form
```

### Part 5 — Cron cleanup
```
Cron at 06:00 UTC:
  └─ Expire deposits WHERE expires_at < now() (24h after "I Have Sent")
  └─ Abandon deposits WHERE created_at < 48h AND user_confirmed_at IS NULL
```

---

## Proposed Solution: Full Deposit-Style Resume for Group Buy

Mirror the proven deposit pattern with group-buy-specific adjustments:

### New State Discrimination Column

Add `user_confirmed_at TIMESTAMPTZ` to `group_buy_members`:
- `NULL` = user never confirmed sending the payment → **resumable**
- `NOT NULL` = user has confirmed sending → entered admin-waiting state

This is the exact same pattern as `deposits.user_confirmed_at`.

### Migration SQL

```sql
-- Add user_confirmed_at to group_buy_members for payment recovery
ALTER TABLE group_buy_members ADD COLUMN user_confirmed_at TIMESTAMPTZ DEFAULT NULL;

-- Add pending_payment → committed transition for admin revert
-- (no SQL change needed — update validMemberStatusTransitions in code)
```

---

## Files to Modify/Create

### File 1: `src/app/api/group-buy/payment-status/route.ts` — CREATE

**Purpose:** GET endpoint to check for existing pending payment. Mirror of `GET /api/goals/deposit/initiate`.

**Logic:**
```
GET /api/group-buy/payment-status?groupBuyId=X
  ├─ Authenticate user
  ├─ Query group_buy_members WHERE:
  │    group_buy_id = groupBuyId
  │    user_id = currentUser
  │    status = 'pending_payment'
  │    user_confirmed_at IS NULL
  └─ If found: return { hasPending: true, reference, totalPrice, creditApplied,
       bankDetails (from platform_settings), orderId/bookingId }
  └─ If not found: return { hasPending: false }
```

**Details:**
- Bank details come from `platform_settings` (same as deposit flow & pay route)
- Reference is reconstructed from the linked `service_orders` or `holiday_bookings` row
- Total price and credit applied come from the linked order/booking
- No membership status change — this is read-only

---

### File 2: `src/app/api/group-buy/cancel-payment/route.ts` — CREATE

**Purpose:** Allow user to cancel a pending payment and revert to `committed`. Mirror of the "Cancel & start new" button in deposit flow.

**Logic:**
```
POST /api/group-buy/cancel-payment
  body: { groupBuyId }
  ├─ Authenticate user
  ├─ Find membership WHERE:
  │    group_buy_id = groupBuyId
  │    user_id = currentUser
  │    status = 'pending_payment'
  │    user_confirmed_at IS NULL
  ├─ If not found → error
  ├─ Update membership: status = 'committed', order_id = null, booking_id = null
  ├─ Cancel linked service_order (set status = 'cancelled') if exists
  ├─ Cancel linked holiday_booking (set status = 'cancelled') if exists
  ├─ Log activity
  └─ Return { success: true }
```

**Important:** This reverts the membership to `committed` so the user can:
- Start a fresh payment (new bank details, new reference)
- Choose a different payment method (goal redemption)

---

### File 3: `src/app/api/group-buy/pay/route.ts` — MODIFY

**Current problem:** Sets membership to `pending_payment` immediately when `DirectPaymentStep` mounts.

**Changes:**

**3a — Add user_confirmed_at to the update (line 240/138):**
```ts
// Current:
const memberUpdate: any = { status: membershipStatus, order_id: order.id };
// New:
const memberUpdate: any = { status: membershipStatus, order_id: order.id, user_confirmed_at: null };
```

**3b — Add guard against re-initiation when already in pending_payment** (around line 51):
```ts
// Current:
if (membership.status !== "committed") {
  return NextResponse.json({ error: "Payment already initiated..." }, { status: 400 });
}
// New: allow re-initiation if user never confirmed (but only via cancel → renew flow)
// Keep as-is — cancel-then-renew happens via cancel-payment API first
```

**3c — When confirm-payment is called (i.e., user says "I Have Sent"), set user_confirmed_at:**
Already handled in `confirm-payment/route.ts` — just add `user_confirmed_at: new Date().toISOString()` to that route.

---

### File 4: `src/app/api/group-buy/confirm-payment/route.ts` — MODIFY

**Changes:**

**4a — Set user_confirmed_at when user confirms:**
```ts
// After updating order/booking status, also set:
await (serviceClient as any)
  .from("group_buy_members")
  .update({ user_confirmed_at: new Date().toISOString() })
  .eq("id", membership.id);
```

**4b — Update guard to also check user_confirmed_at:**
```ts
// Current:
if (membership.status !== "pending_payment") { ... }
// Keep as-is — status check is sufficient, user_confirmed_at is additional marker
```

---

### File 5: `src/components/dashboard/groups/GroupDetailActions.tsx` — MODIFY

**Changes:**

**5a — Add "Continue Payment" button for pending_payment state** (after line 119):
```tsx
{groupStatus === "filled" && membershipStatus === "pending_payment" && (
  <div style={{ marginBottom: "1.5rem" }}>
    <button
      onClick={handlePayClick}
      style={{
        width: "100%",
        padding: "1rem",
        background: "#FEF3C7",
        color: "#92400E",
        fontWeight: 700,
        fontSize: "1rem",
        borderRadius: "var(--radius-md)",
        border: "1px solid #FDE68A",
        cursor: "pointer",
      }}
    >
      Continue payment → (₦{groupData.group_price_ngn.toLocaleString()})
    </button>
  </div>
)}
```

**5b — Pass `isResuming` flag to payment modal** to skip the `choose_payment` step and go directly to showing saved bank details:
```tsx
{showPaymentModal && (
  <GroupBuyPaymentModal
    group={groupData}
    activeGoals={activeGoals}
    walletCredits={walletCredits}
    preferredCurrency={preferredCurrency}
    userId={currentUserId}
    isResuming={membershipStatus === "pending_payment"}  // NEW
    onClose={() => setShowPaymentModal(false)}
    onPaymentComplete={() => {
      setShowPaymentModal(false);
      router.refresh();
    }}
  />
)}
```

---

### File 6: `src/components/dashboard/groups/GroupBuyPaymentModal.tsx` — MODIFY

**Changes:**

**6a — Add `isResuming` prop** (line 25):
```tsx
isResuming?: boolean;
```

**6b — On mount, if isResuming, check for pending payment details** (new useEffect):
```tsx
useEffect(() => {
  if (!isResuming) return;
  async function checkPending() {
    const res = await fetch(`/api/group-buy/payment-status?groupBuyId=${group.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.hasPending) {
        // Restore saved payment data
        setOrderResult(data);
        setStep("direct_payment_resume");  // new step type
      }
    }
  }
  checkPending();
}, [group.id, isResuming]);
```

**6c — Add new step type `"direct_payment_resume"`** (line 34):
```ts
type PaymentStep = "choose_payment" | "goal_select" | "direct_payment" | 
                   "direct_payment_resume" | "confirmation";
```

**6d — Add resume step render** (new `ResumeDirectPaymentStep` component):

This is similar to `DirectPaymentStep` but instead of calling `/api/group-buy/pay` (which would fail since membership is `pending_payment`), it reads the saved `orderResult` data and displays the same bank details + reference UI.

```tsx
{step === "direct_payment_resume" && (
  <ResumeDirectPaymentStep
    orderData={orderResult}
    groupId={group.id}
    preferredCurrency={preferredCurrency}
    onComplete={(result) => {
      setOrderResult(result);
      setStep("confirmation");
    }}
    onCancel={async () => {
      // Call cancel-payment API → revert to committed
      const res = await fetch("/api/group-buy/cancel-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupBuyId: group.id }),
      });
      if (res.ok) {
        setOrderResult(null);
        setStep("choose_payment");  // Start fresh
      }
    }}
    onError={(msg) => setError(msg)}
  />
)}
```

**6e — Create `ResumeDirectPaymentStep` component:**

Props:
- `orderData`: The saved payment details (reference, bankDetails, finalPrice, creditApplied)
- `groupId`: string
- `preferredCurrency`: string
- `onComplete`: (result) => void
- `onCancel`: () => void
- `onError`: (msg) => void

UI (mirrors deposit resume pattern):
1. Info banner: "You have a pending payment that was not yet confirmed. You can continue where you left off, switch to goal payment, or cancel it."
2. Saved details: Amount, Reference, Bank, Account number, Account name
3. Warning: "Include reference in your transfer narration"
4. Actions:
   - [I Have Transferred the Payment ✓] → calls `/api/group-buy/confirm-payment`, then `onComplete`
   - [Switch to goal payment] → calls `/api/group-buy/cancel-payment`, then shows step `choose_payment` again
   - [Cancel payment] → calls `/api/group-buy/cancel-payment`, then `onClose`

---

### File 7: `src/app/api/group-buy/expire/route.ts` — MODIFY

**Changes:**

**7a — Add cleanup for abandoned pending_payment memberships:**

After the existing expiry logic for `open` groups, add:
```
Find group_buy_members WHERE:
  status = 'pending_payment'
  user_confirmed_at IS NULL
  joined_at < 48 hours ago
  → Cancel linked order/booking
  → Set membership status = 'committed' (revert)
  → Send notification: "Your pending payment session expired. 
     No charges were made. You can start a new payment."
```

**7b — Add cleanup for expired user-confirmed payments:**

```
Find group_buy_members WHERE:
  status = 'pending_payment'
  user_confirmed_at IS NOT NULL
  user_confirmed_at < 24 hours ago AND admin hasn't set to paid
  → If linked order exists: set order status = 'cancelled'
  → If linked booking exists: set booking status = 'cancelled'
  → Set membership status = 'expired'
  → Send notification: "Your payment was not confirmed within 24 hours. Contact support."
```

---

### File 8: `src/app/api/admin/groups/update-status/route.ts` — MODIFY

**Changes:**

**8a — Add `pending_payment → committed` transition for admin revert:**
```ts
const validMemberStatusTransitions: Record<string, string[]> = {
  committed: ["withdrawn"],
  pending_payment: ["paid", "withdrawn", "committed"],  // added "committed"
  paid: [],
  withdrawn: [],
};
```

**8b — Handle `committed` transition (revert pending_payment back):**

When admin transitions `pending_payment → committed`:
```
├─ Cancel linked service_order (set status = 'cancelled') if exists
├─ Cancel linked holiday_booking (set status = 'cancelled') if exists
├─ Set membership.order_id = null, booking_id = null
├─ Reset user_confirmed_at = null
├─ Log audit trail
└─ Send notification: "Your payment session was reset by an admin."
```

---

### File 9: Admin UI — Add `committed` as an allowed action for `pending_payment` members

**File:** `src/components/admin/groups/GroupDetailView.tsx`

**Changes:**
- In the member action dropdown/buttons for `pending_payment` status, add a "Reset to committed" option
- This calls `POST /api/admin/groups/update-status` with `newMemberStatus: "committed"`

---

## Dependency Order

```
1. SQL: Add user_confirmed_at column          — can run anytime, no code dependency
2. API: payment-status GET (File 1)           — must exist before UI checks
3. API: cancel-payment POST (File 2)          — must exist before UI actions
4. API: pay route (File 3)                    — small tweak to include user_confirmed_at
5. API: confirm-payment route (File 4)        — small tweak to set user_confirmed_at
6. API: expire route (File 7)                 — cron cleanup for abandoned payments
7. Modal component (File 6)                   — resume step + ResumeDirectPaymentStep
8. GroupDetailActions (File 5)                — "Continue Payment" button + isResuming flag
9. Admin update-status API (File 8)           — add committed transition
10. Admin UI (File 9)                         — add "Reset to committed" button
11. API: admin update-status route (File 8b)  — handle committed transition (cleanup)
```

---

## User Flows After Implementation

### Flow A: Normal Direct Payment (happy path, no change)
```
1. Open modal → choose_payment → select "Bank transfer"
2. See bank details → transfer money → click "I Have Transferred"
3. Modal shows confirmation → admin confirms → done
```

### Flow B: Close modal before confirming (NEW — recovery)
```
1. Open modal → choose_payment → select "Bank transfer"
2. See bank details → close modal
3. Membership = pending_payment, user_confirmed_at = NULL
4. Group detail page shows amber "Continue Payment →" button
5. Click → modal opens directly to saved bank details
6. Options:
   a. [I Have Transferred ✓] → completes payment (same as Flow A)
   b. [Switch to goal] → cancels pending, shows payment choice again
   c. [Cancel payment] → reverts to committed, user can restart later
```

### Flow C: Abandoned — never came back (NEW — timeout)
```
1. User got bank details, closed modal, never returned
2. After 48h: cron job finds abandoned pending_payment
3. Reverts to committed (no charges made, group slot preserved)
4. Sends notification: "Your payment session expired. No charges made."
```

### Flow D: Admin resets a stuck user (NEW — admin tool)
```
1. User contacts support saying "I closed the payment modal"
2. Admin opens group detail → sees member status = "Paying"
3. Admin can either:
   a. Mark as "paid" (if user actually transferred)
   b. "Reset to committed" (if user needs to restart)
4. User's membership reverts to committed, they can pay again
```

---

## Edge Cases Handled

| Edge Case | How It's Handled |
|-----------|-----------------|
| User closes modal after seeing bank details | "Continue Payment" button appears on group detail page |
| User closes modal and opens on different device | Payment-status API is server-side, works cross-device |
| Group expires while user has pending_payment | Cron cleanup reverts to committed (or marks expired if user_confirmed) |
| Admin confirms payment after user clicked "I Have Sent" | Normal flow — admin sets to `paid` |
| User clicks "I Have Sent" twice | Guard: `user_confirmed_at` already set, confirm-payment rejects duplicate |
| User clicks "Continue Payment" after admin already set to `paid` | API returns `hasPending: false` → modal shows fresh payment options |
| User has pending_payment but group was cancelled by admin | Admin's group-cancel logic should also handle members (already exists) |

---

## Files NOT Modified

| File | Reason |
|------|--------|
| `src/app/api/group-buy/create/route.ts` | No change needed |
| `src/app/api/group-buy/join/route.ts` | No change needed |
| `src/app/api/group-buy/leave/route.ts` | No change needed |
| `src/app/(public)/join/[code]/page.tsx` | Public invite page unchanged |
| `src/app/(dashboard)/dashboard/groups/page.tsx` | List page unchanged |
| `src/components/dashboard/groups/GroupBuyCard.tsx` | Card component unchanged |
| `src/components/dashboard/groups/CountdownTimer.tsx` | No change needed |
| `src/components/dashboard/groups/CreateGroupBuyModal.tsx` | No change needed |
