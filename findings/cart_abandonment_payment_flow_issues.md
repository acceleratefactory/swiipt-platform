# Cart Abandonment & Payment Flow Issues

## Current Flow (Broken)

```
Info Step → [Continue] → POST /api/rewards/redeem-visa → Payment Step
                                                              ↓
                                          Creates deposit (status: "pending")
                                          Creates visa_redemption (status: "pending_payment")
                                          ↓
                                    User sees bank details + reference
                                          ↓
                                    [I Have Sent the Payment ✓]
                                          ↓
                                    Payment Pending (user_confirmed_at SHOULD be set here)
```

---

## Issue 1: Premature Deposit Creation

### Where it happens
`src/app/api/rewards/redeem-visa/route.ts` lines 108-119

```typescript
// This runs BEFORE the user clicks "I Have Sent the Payment"
await (supabase as any).from("deposits").insert({
  user_id: user.id,
  amount: totalNgn,
  payment_reference: reference,
  status: "pending",
  ...
});
```

### Why it's wrong
The deposit is created at the moment the user clicks "Continue — Pay hotel booking", **not** when they click "I Have Sent the Payment ✓". This means:

- Every abandoned payment creates a **pending deposit** that appears in the wallet's transaction history
- The wallet page (`src/app/(dashboard)/dashboard/wallet/page.tsx` line 14-17) fetches ALL deposits with no status filter, so `pending` deposits are shown alongside `confirmed` ones
- Admins see these phantom deposits in their pending deposits table
- There's no way to distinguish between "user clicked continue and abandoned" vs "user actually sent money and confirmed"

### Root cause
The `handlePaymentConfirmed()` function in `QatarVisaRedeemModal.tsx` (lines 47-53) has a TODO comment referencing `user_confirmed_at` but never actually calls an API to update the deposit. It just sets the step to `payment_pending`:

```typescript
async function handlePaymentConfirmed() {
    // User claims they have sent the payment
    // We update the deposit user_confirmed_at    ← STILL A COMMENT, NOT IMPLEMENTED
    // The deposit reference is in redemptionData.reference
    // Find the deposit and mark user_confirmed_at
    setStep("payment_pending");                     ← NO API CALL
}
```

---

## Issue 2: No Way to Resume an Abandoned Payment

### Where it happens
`src/app/api/rewards/redeem-visa/route.ts` lines 25-41

```typescript
// Check if user already has a pending visa redemption
const { data: existing } = await (supabase as any)
    .from("visa_redemptions")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("reward_id", rewardId)
    .not("status", "eq", "cancelled")
    .maybeSingle();

if (existing) {
    return NextResponse.json({
      redemptionId: existing.id,
      status: existing.status,
      alreadyStarted: true,          // ← Returns this flag
    });
}
```

### What happens next

The API returns `{ alreadyStarted: true, redemptionId, status }`. But the modal's `handleInitiate()` (lines 25-45) **does not check for `alreadyStarted`**:

```typescript
const data = await res.json();
setLoading(false);
if (!res.ok) {
    setError(data.error || "Failed to initiate. Please try again.");
    return;
}
setRedemptionData(data);             // ← Sets data = { alreadyStarted: true }
setStep("payment");                  // ← Goes to payment step
```

### Why it shows $0

The payment step displays:

```tsx
<span>₦{Number(redemptionData?.totalNgn || redemptionData?.bookingFeeNgn || 0).toLocaleString()}</span>
```

When `alreadyStarted: true` is returned, the response contains `redemptionId` and `status` but **no** `totalNgn`, `bookingFeeNgn`, or any fee fields. So every value falls through to `0`, and the user sees:

```
Base fee (3 nights):     ₦0 (~$0)
Total:                    ₦0 (~$0)
Bank:                     Swiipt Account
Account number:           —
Account name:             —
Payment reference:        (empty or undefined)
```

This is confusing and alarming for the customer.

---

## Issue 3: No Admin Visibility for Abandoned Payments

### Current admin views

1. **Pending deposits table** (`src/components/admin/deposits/PendingDepositsTable.tsx`)
   - Shows deposits where `status = "pending"` AND `user_confirmed_at IS NOT NULL`
   - The filter is on line 37: `if (payload.new.status === "pending" && payload.new.user_confirmed_at)`
   - Since `user_confirmed_at` is never set (Issue 1), abandoned visa deposits don't appear here
   - But they still exist as `pending` deposits with `user_confirmed_at = null`

2. **User profile admin page** (`src/app/(admin)/admin/users/[id]/page.tsx`)
   - Shows ALL deposits for a user (line 19)
   - No filter or flag for "abandoned" vs "active" visa redemptions
   - No link between deposits and visa_redemptions

3. **No visa_redemptions admin view**
   - There's no admin page or table to view visa redemptions specifically
   - The `visa_redemptions` table has `booking_fee_deposit_id` column (nullable FK to deposits) but it's never populated by the API

---

## Recommended Solutions

### Fix 1: Defer Deposit Creation Until User Confirms Payment

**API changes** (`redeem-visa/route.ts`):
- Remove the deposit creation from the `POST /redeem-visa` handler (lines 108-119)
- Create a new endpoint: `POST /api/rewards/redeem-visa/confirm-payment`
- This endpoint should:
  1. Accept `{ redemptionId }`
  2. Verify the redemption exists and is in `pending_payment` status
  3. Create the deposit with `status: "pending"` and set `user_confirmed_at = NOW()`
  4. Update the `visa_redemptions` record with the `booking_fee_deposit_id`
  5. Return the deposit details

**Modal changes** (`QatarVisaRedeemModal.tsx`):
- `handlePaymentConfirmed()` should call the new API endpoint
- Only then set step to `payment_pending`

### Fix 2: Handle `alreadyStarted` in the Modal

**Modal changes** (`QatarVisaRedeemModal.tsx`):
- In `handleInitiate()`, after checking `res.ok`, check for `data.alreadyStarted`
- If `alreadyStarted`, call a new API endpoint to fetch existing redemption details:
  `GET /api/rewards/redeem-visa?redemptionId={id}`
- This endpoint returns the visa_redemption record + bank details + reference
- Show the payment step with the correct amounts from the existing record

**New API endpoint** (`GET /api/rewards/redeem-visa`):
- Accepts `redemptionId` query param
- Fetches the visa_redemption + bank settings + deposit (if exists)
- Returns the same shape as `POST` response so the payment step works identically

### Fix 3: Admin Visibility for Abandoned Payments

**Database additions** (`visa_redemptions` table):
- Add `expires_at TIMESTAMPTZ` — when the payment window closes (e.g., 24h after creation)
- Add `abandoned_at TIMESTAMPTZ` — set when a scheduled job marks it abandoned
- Add `deposit_id UUID REFERENCES deposits(id)` — link to the deposit (same as `booking_fee_deposit_id` but populated by confirm-payment)

**Cron job** (`/api/cron/expire-visa-redemptions`):
- Runs daily
- Marks visa_redemptions as `status = 'cancelled'` where `expires_at < NOW()` AND `status = 'pending_payment'`
- Logs these to `activity_log` with `action = 'visa_redemption_abandoned'`

**Admin page** (`/admin/visa-redemptions`):
- New admin page to view all visa redemptions
- Columns: User, Status, Amount, Reference, Created, Expires, Actions
- Filters: All | Pending Payment | Abandoned | Completed
- Show abandoned ones with "Abandoned" badge

### Fix 4: Abandoned Payment Recovery Emails

**Database**: The `visa_redemptions` table can serve as the cart abandonment tracking source.

**Scheduled email flow**:

1. When `status = 'pending_payment'` for > 2 hours, send a **soft reminder** email:
   - "You started your Qatar visa application — complete your payment to proceed"
   - Includes the reference number and bank details
   - Link to dashboard to continue

2. When `status = 'pending_payment'` for > 20 hours (before 24h expiry), send a **final reminder**:
   - "Your payment window is closing — don't lose your progress"
   - Same details as above

3. When `status` changes to `cancelled` (abandoned), the reward `redeemed` flag should be reset to `false` so the user can re-initiate

**Implementation**: Uses the existing Vercel cron (`vercel.json` already has a cron at `0 6 * * *`). Add a new function that:
- Queries `visa_redemptions` where `status = 'pending_payment'` AND `created_at < NOW() - INTERVAL '2 hours'`
- Checks if a reminder was already sent (add `reminder_sent_at` column)
- Sends email via Resend (already in dependencies)
- Updates `reminder_sent_at`

### Fix 5: Re-initiate After Abandonment

When a visa_redemption is cancelled/expired:
- The milestone_reward's `redeemed` should be set back to `false` (or the check should also allow rewards where a cancelled visa_redemption exists)
- The user can click "Redeem Visa" again and start fresh
- The API should allow creating a new redemption if the previous one is cancelled

Current check (line 32) already excludes cancelled statuses:
```typescript
.not("status", "eq", "cancelled")
```

So if the cron sets status to `cancelled`, the existing redemption check will not block re-initiation. But the milestone_reward still has `redeemed = false` (it was never set to `true`). Actually, looking at the code, the milestone_reward's `redeemed` is only set when a credit conversion happens (via `add_credit_to_wallet` RPC). The visa flow doesn't set `redeemed = true` on the reward. So the reward is always available as long as no active (non-cancelled) visa_redemption exists.

---

## Summary of Changes Needed

| # | Area | Change | Priority |
|---|------|--------|----------|
| 1 | API | Defer deposit creation to confirm-payment endpoint | High |
| 2 | Modal | Call confirm-payment API on "I Have Sent the Payment" | High |
| 3 | Modal | Handle `alreadyStarted` — fetch existing redemption data | High |
| 4 | API | New GET endpoint to fetch existing redemption details | High |
| 5 | DB | Add `expires_at`, `abandoned_at`, `reminder_sent_at` columns | Medium |
| 6 | Admin | New visa_redemptions admin page | Medium |
| 7 | Cron | Abandonment expiry job | Medium |
| 8 | Email | Recovery reminder emails via Resend | Low |

---

## Data Flow After Fix

```
Info Step → [Continue] → POST /api/rewards/redeem-visa
                                    ↓
                          Creates visa_redemption (status: "pending_payment")
                          Returns { redemptionId, totalNgn, bankDetails, reference }
                          (NO deposit created yet)
                                    ↓
                          Payment Step
                          (user sees bank details + reference)
                                    ↓
                          [I Have Sent the Payment ✓]
                                    ↓
                          POST /api/rewards/redeem-visa/confirm-payment
                                    ↓
                          Creates deposit (status: "pending", user_confirmed_at: NOW())
                          Updates visa_redemption (booking_fee_deposit_id set)
                                    ↓
                          Payment Pending

If user abandons during Payment Step:
  → No deposit exists → wallet is clean
  → User can come back, click Redeem Visa
  → API returns alreadyStarted + full redemption data
  → Modal resumes Payment Step with correct amounts
  → User completes from where they left off

If user abandons for > 24h:
  → Cron marks visa_redemption as cancelled
  → User can start fresh (previous cancelled record doesn't block)
```
