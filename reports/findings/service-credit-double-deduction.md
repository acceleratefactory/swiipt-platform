# Investigation: Credit Applied Twice — Goal Deduction + Wallet Credit Consumed

## Problem Statement

When paying for a service with goal_redemption and having available credit, the credit amount is both:
1. ✅ Correctly consumed from `wallets.total_credits_ngn` (goes to 0)
2. ❌ **Also over-deducted from the goal balance** — the goal is deducted by the pre-credit amount, ignoring that credit already reduced the cost

### Real Example

| Item | Expected | Actual |
|------|----------|--------|
| Goal balance before | 2,000,000 | 2,000,000 |
| Service price | 220,000 | 220,000 |
| 15% milestone discount | -33,000 | -33,000 |
| Price after discount | 187,000 | 187,000 |
| Credit (15,000) | -15,000 | -15,000 |
| **Amount deducted from goal** | **172,000** | **187,000** |
| Goal balance after | **1,828,000** | **1,813,000** |
| Credit balance after | 0 | 0 |
| **Discrepancy** | — | **15,000 missing from goal** |

Goal transaction history shows 172,000 deducted, but actual balance is 1,813,000 (= 2,000,000 - 187,000). The credit value (15,000) was deducted twice — once from credit (correct) and once from the goal (incorrect).

---

## Root Cause

**The credit is applied AFTER the goal is deducted, so the goal is deducted by the full pre-credit amount.**

File: `src/app/api/services/order/route.ts`

### Current Code Flow

```
Line 54:  finalPrice = 187,000       ← after 15% milestone discount
Line 82:  order.final_price = 187,000 ← inserted into DB

LINE 91-96:  deduct_goal_balance(goalId, 187,000) ← BUG: deducted BEFORE credit
  → Goal: 2,000,000 - 187,000 = 1,813,000

LINE 118-141: apply_credit_to_order(order.id, user.id, 15,000)
  → RPC reads final_price = 187,000 from DB
  → credit_to_use = 15,000
  → remaining_to_pay = 187,000 - 15,000 = 172,000
  → Updates service_orders.final_price = 172,000 in DB
  → Credits consumed: 0
  → Returns 172,000

LINE 134:  finalPrice = 172,000       ← local var updated, but goal already deducted
```

The `deduct_goal_balance` RPC at line 93 uses `finalPrice = 187,000`. By the time credit is applied at line 127, the goal has already been deducted by the higher amount. The credit application correctly reduces the `finalPrice` to 172,000 and updates the DB record, but the goal deduction has already happened with the wrong amount.

### Why Transaction History Shows 172,000

The wallet and goal transaction history both read `service_orders.final_price` from the database, which was updated by `apply_credit_to_order` RPC to 172,000. So the history appears correct, but the actual goal balance (1,813,000) reflects the pre-credit deduction (187,000).

### Secondary Issue: Balance Check Rejects Valid Transactions

The goal balance check at lines 57-66 validates `goal.current_balance >= finalPrice` where `finalPrice = 187,000`. If a user has exactly 180,000 in their goal with 15,000 in credits, this check would reject the transaction even though after credits they only need to pay 172,000 (which they have). The check is conservatively correct but unnecessarily restrictive.

---

## Solution

**Reorder the operations: apply credit BEFORE deducting from the goal.**

The credit application must run first so that `finalPrice` is reduced to `remainingToPay` before `deduct_goal_balance` uses it. The goal deduction should also be guarded to only fire when `finalPrice > 0` (credit may have fully covered the cost).

### What Changes

- Move the credit block (lines 118-141) to run BEFORE the goal deduction (lines 91-106)
- Change the goal deduction condition from `if (goal_redemption && goalId)` to `if (goal_redemption && goalId && finalPrice > 0)` — skip deduction if credit fully covered the cost
- The notification body will automatically use the credit-reduced amount since it reads `finalPrice`
- All other logic stays identical

### What Does NOT Change

- No SQL changes needed
- No type definition changes
- No changes to `deduct_goal_balance` RPC
- No changes to `apply_credit_to_order` RPC
- No changes to wallet or transaction history UI
- The goal balance check remains conservatively checking against pre-credit `finalPrice` (safe, just slightly restrictive for edge cases)

### New Code Flow

```
Line 54:   finalPrice = 187,000           ← after discount
Line 82:   order.final_price = 187,000    ← inserted into DB

LINE 118-141: apply_credit_to_order(...)
  → remaining_to_pay = 172,000
  → Updates DB final_price = 172,000
  → finalPrice = 172,000                   ← local var updated

LINE 91-96:  deduct_goal_balance(goalId, 172,000) ← NOW uses credit-reduced amount
  → Goal: 2,000,000 - 172,000 = 1,828,000  ← CORRECT
```

---

## Implementation Plan

### Step 1 — Restructure `services/order/route.ts`

In `src/app/api/services/order/route.ts`, reorder three code blocks:

**Current order:**
1. Order creation (lines 72-89)
2. Goal deduction (lines 91-106) ← too early
3. Bank details (lines 108-116)
4. Credit application (lines 118-141) ← too late
5. Admin notification + activity log (lines 143-156)

**Fixed order:**
1. Order creation (lines 72-89)
2. Bank details (lines 108-116) — no dependency on credit
3. Credit application (lines 118-141) — moved up
4. Goal deduction (lines 91-106) — moved down, uses credit-reduced `finalPrice`
5. Admin notification + activity log (lines 143-156)

**Specific changes:**
- Add `&& finalPrice > 0` to the goal deduction condition (skip if credit fully covered)
- The notification inside the goal deduction block will now correctly show the credit-reduced amount

### Step 2 — Verify

- `npm run build` — zero TS errors
- Test with goal_redemption + credit:
  - Goal balance should be deducted by `finalPrice - creditApplied` (not `finalPrice`)
  - Credit balance should go to 0
  - Transaction history should correctly show the reduced amount
  - Notification should show the reduced amount
- Test without credit: goal deducted by full `finalPrice` (no regression)
- Test credit fully covering the cost: no goal deduction (guarded by `finalPrice > 0`)
- Test direct_payment with credit: no regression (credit flow unchanged)
