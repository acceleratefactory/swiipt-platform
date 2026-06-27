# Investigation: Goal Redemption for Services — Wallet Balance & Transaction History Not Updated

## Problem Statement

When a user pays for a service order using goal savings (goal_redemption):
- ✅ Goal balance is correctly deducted (savings_goals.current_balance decreases)
- ✅ Goal progress bar updates in real time
- ❌ Wallet "Total Balance" box does not update
- ❌ Wallet "Available" balance does not decrease
- ❌ Goal transaction history does not show the spend
- ❌ Wallet transaction history does not show the spend
- ❌ No notification is sent to the user

This affects all goal_redemption service payments regardless of whether the goal is locked or unlocked.

---

## Investigation Findings

### How Goal Redemption Works (Current Flow)

**File:** `src/app/api/services/order/route.ts`

When `paymentMethod === "goal_redemption"`:
1. Goal existence, ownership, and sufficient balance are validated (lines 38–67)
2. Order is created with `status: "payment_confirmed"` (line 84) — skips the pending pipeline
3. `deduct_goal_balance` RPC is called (lines 91–97) — deducts from goal and recalculates `total_locked_ngn`
4. Activity log entry `"service_ordered"` is created (line 143)
5. Admin notification `"new_order"` is sent (lines 135–141)

### What `deduct_goal_balance` RPC Does

**File:** `sprint_7_sql_seed.sql` (lines 4–20)

```sql
UPDATE savings_goals SET current_balance = current_balance - amount_input WHERE id = goal_id_input;

UPDATE wallets SET total_locked_ngn = (
  SELECT COALESCE(SUM(current_balance), 0)
  FROM savings_goals
  WHERE user_id = (SELECT user_id FROM savings_goals WHERE id = goal_id_input)
    AND is_locked = TRUE AND status = 'active'
)
WHERE user_id = (SELECT user_id FROM savings_goals WHERE id = goal_id_input);
```

**This RPC:**
- Deducts from `savings_goals.current_balance` ✅
- Recalculates `wallets.total_locked_ngn` (sum of locked goals only) ✅
- Does NOT update `wallets.balance_ngn` ❌
- Does NOT create a transaction history record ❌
- Does NOT create a notification ❌

### How the Working Goal Deposit Flow Updates Wallet

**File:** `sprint5_confirm_deposit.sql` (the `confirm_deposit` RPC)

When a deposit is confirmed:
- Adds to `savings_goals.current_balance`
- **If goal is unlocked:** adds to `wallets.balance_ngn` (line 29–33)
- Recalculates `wallets.total_locked_ngn`
- Awards +50 mobility score (first deposit)
- Creates `activity_log` entry with `event_type: 'deposit_confirmed'`
- Creates a user notification

### How Wallet Balance Is Displayed

**File:** `src/app/(dashboard)/dashboard/page.tsx` (line 16)

Wallet data is fetched directly from the `wallets` table — no aggregation or computation:
- `balance_ngn` → "Available" balance
- `total_locked_ngn` → "Locked" balance
- `total_credits_ngn` → "Credits" balance
- Sum of all three → "Total balance"

### How Transaction History Is Queried

**Wallet page:** `src/app/(dashboard)/dashboard/wallet/page.tsx` (lines 12–101)
- Queries: `deposits`, `withdrawals`, `goal_gifts`, `holiday_bookings`
- Does NOT query: `service_orders`

**Goal detail page:** `src/components/dashboard/goals/TransactionHistory.tsx` (lines 40–63)
- Queries: `deposits`, `goal_gifts`
- Does NOT query: `service_orders`

---

## Root Cause Analysis: 3 Gaps

### Gap 1 — `deduct_goal_balance` RPC Does Not Update `wallets.balance_ngn`

**Severity:** High (incorrect balance display)

The `deduct_goal_balance` RPC was created in Sprint 7 and only handles two things:
1. `savings_goals.current_balance` deduction
2. `wallets.total_locked_ngn` recalculation

It never checks `savings_goals.is_locked` and never adjusts `wallets.balance_ngn`.

**For unlocked goals:** When a deposit is made, `confirm_deposit` correctly adds to `balance_ngn`. But when that same unlocked goal is later spent via service redemption, `deduct_goal_balance` never subtracts from `balance_ngn`. Result: "Available" balance shows money that has already been spent.

**For locked goals:** The locked balance is already excluded from `balance_ngn` (it only contributes to `total_locked_ngn`), so the wallet display is less wrong — but `total_locked_ngn` is correctly recalculated.

### Gap 2 — No Transaction History Entry Created for Service Redemption

**Severity:** Medium (invisible financial activity)

There is no unified `transaction_history` table in the database. Each activity type lives in its own source table:

| Activity | Source Table | Included in Wallet Page? | Included in Goal Page? |
|----------|-------------|--------------------------|------------------------|
| Deposit | `deposits` | Yes | Yes |
| Withdrawal | `withdrawals` | Yes | No |
| Gift | `goal_gifts` | Yes | Yes |
| Holiday booking | `holiday_bookings` | Yes | No |
| **Service redemption** | **`service_orders`** | **No** | **No** |

The service order route creates an `activity_log` entry (`event_type: 'service_ordered'`), but no transaction history UI queries `activity_log` for display purposes.

### Gap 3 — No User Notification for Goal Deduction

**Severity:** Low (user experience)

When a service order is created via goal_redemption, a notification is sent to admins (`new_order`) but no notification is sent to the user whose goal was deducted. Compare with the deposit flow which sends a `deposit_confirmed` notification to the user.

---

## Solution Recommendations

### Fix 1 — Update `deduct_goal_balance` RPC to Adjust `wallets.balance_ngn`

Modify the `deduct_goal_balance` function to:
1. Check if the goal is locked (`savings_goals.is_locked`)
2. If **unlocked:** deduct `amount_input` from `wallets.balance_ngn`
3. If **locked:** the balance was never in `balance_ngn`, so no change needed (locked goals are already excluded from available balance)
4. Keep existing `total_locked_ngn` recalculation (handles locked goals correctly)

This matches the inverse of what `confirm_deposit` does — it adds to `balance_ngn` for unlocked deposits, so the deduction should subtract from `balance_ngn` for unlocked redemptions.

### Fix 2 — Add `service_orders` to Transaction History Queries

**Option A (Recommended — minimal change):** Add `service_orders` as a source table in both wallet and goal transaction history queries.

- In `src/app/(dashboard)/dashboard/wallet/page.tsx`: add a `service_orders` query alongside `deposits`, `withdrawals`, `goal_gifts`, and `holiday_bookings`. Map to a `"service_payment"` type for display.
- In `src/components/dashboard/goals/TransactionHistory.tsx`: add a `service_orders` query filtered by `goal_id` alongside `deposits` and `goal_gifts`.

**Option B (future improvement):** Create a unified `transaction_history` table or materialized view that all financial UIs query from. This would consolidate deposits, withdrawals, gifts, holiday bookings, and service orders into a single source. Higher effort but cleaner architecture.

### Fix 3 — Add User Notification for Goal Deduction

In the service order route, after successful goal deduction (`deduct_goal_balance`), create a user-facing notification with type `"goal_redemption"` or `"service_paid"` notifying the user that their goal was used to pay for the service.

---

## Implementation Plan

### Step 1 — Update `deduct_goal_balance` SQL Function

Modify the RPC to:
- Accept the goal ID and amount
- Deduct from `savings_goals.current_balance`
- Check `savings_goals.is_locked` for the goal
- If unlocked: deduct from `wallets.balance_ngn`
- Recalculate `wallets.total_locked_ngn` (existing logic)
- Add `RETURNS void` (stays the same)

No changes needed in `src/types/database.ts` — the RPC signature stays the same.

### Step 2 — Add Service Orders to Wallet Transaction History Page

In `src/app/(dashboard)/dashboard/wallet/page.tsx`:
- Add a Supabase query for `service_orders` joined with `service_packages` to get the service name
- Add `"service_payment"` to the type filter options
- Map service orders to the transaction display format (amount as negative, description as service name, status from order status)

### Step 3 — Add Service Orders to Goal Transaction History Component

In `src/components/dashboard/goals/TransactionHistory.tsx`:
- Add a Supabase query for `service_orders` filtered by `goal_id`
- Display as a deduction entry (negative amount) with the service name
- Use the order `created_at` as the transaction date

### Step 4 — Add User Notification for Goal Redemption

In `src/app/api/services/order/route.ts`:
- After successful `deduct_goal_balance` call, insert a notification for the user
- Type: `"goal_redemption"` or reuse `"service_ordered"` with the user as recipient
- Message: "Your {goal_name} goal was used to pay for {service_name} — {amount} {currency}"

### Step 5 — Verify

- `npm run build` — zero TS errors
- Create a service order using goal_redemption
- Check: wallet "Available" balance decreases
- Check: wallet "Total balance" decreases
- Check: wallet transaction history shows the service payment
- Check: goal transaction history shows the service payment
- Check: user receives a notification about the deduction
