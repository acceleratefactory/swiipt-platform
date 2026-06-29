# Investigation: Holiday Goal Deduction Not Showing in Goal Transaction History

## User Report

After paying for a holiday booking using goal savings (goal_redemption), the deduction appears in the wallet transaction history but does NOT appear in the goal's transaction history on the goal detail page.

## Root Cause

The goal transaction history pipeline has three layers, and holiday bookings are missing from all of them:

### Layer 1: Server query — `goals/[id]/page.tsx`

The server fetches these transaction sources for a goal (lines 23-48):
- `deposits` — confirmed deposits into the goal
- `milestone_rewards` — milestone unlocks (not shown in TransactionHistory)
- `gifts` — sent/received gifts
- `serviceOrders` — added in Session 13 for service goal redemptions

**Missing:** `holiday_bookings` filtered by `goal_id`

### Layer 2: Prop pass-through — `GoalDetailView.tsx`

Receives `serviceOrders` as prop (line 68) and passes it to `TransactionHistory` (line 384). The component's props interface (lines 63-80) has `serviceOrders: any[]` but no `holidayBookings` field.

### Layer 3: Rendering — `TransactionHistory.tsx`

The `allTransactions` array (lines 43-78) maps:
- `deposits` → `deposit` type
- `gifts` → `gift_sent` / `gift_received` type  
- `serviceOrders` → `service_payment` type (added Session 13)

**Missing:** No `holidayBookings` mapping → no `holiday_payment` type

The rendering section (lines 114-214) has special handling for `isServicePayment` (line 122) with purple background and "🛠️" icon (lines 139-147). Holiday bookings need similar handling.

## Fix Plan (3 files, surgical)

### 1. `goals/[id]/page.tsx` — Add holiday_bookings query
After the `serviceOrders` query (line 49), add:
```ts
const { data: holidayBookings } = await (supabase as any)
    .from("holiday_bookings")
    .select("*, holiday_packages(title)")
    .eq("goal_id", params.id)
    .order("created_at", { ascending: false });
```
And pass `holidayBookings={holidayBookings || []}` to `GoalDetailView`.

### 2. `GoalDetailView.tsx` — Accept and pass through
Add `holidayBookings: any[]` to the props interface (line 77 area) and pass it to `TransactionHistory` (line 384 area).

### 3. `TransactionHistory.tsx` — Map into transactions
Add `holidayBookings` to the component props and map each booking into `allTransactions` as a `holiday_payment` type with:
- Negative amount sign (`-`)
- 🌍 icon and "Holiday payment" label
- `holiday_packages.title` as `fromTo`
