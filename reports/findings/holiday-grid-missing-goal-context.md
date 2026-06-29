# Investigation: Holiday Grid Modal Not Passing Goal Context

## The "Detail Page" Confusion

There are TWO entry points to `HolidayBookingFlow`:

| Entry | File | Line | Has `existingGoal`? | Has `initialAction`? |
|-------|------|------|---------------------|----------------------|
| Holiday detail page | `HolidayDetailView.tsx` | 177 | ✅ Yes (from server) | ✅ Yes (my fix) |
| Holiday grid modal | `HolidayGrid.tsx` | 152 | ❌ No | ❌ No |

The user is using the **holiday grid** (`/dashboard/holidays`), not the detail page (`/dashboard/holidays/[id]`). The grid page lists all packages. Clicking a package opens `HolidayBookingFlow` in a modal — but `existingGoal` is never passed.

## Root Cause

Two layers deep:

### Layer 1: `holidays/page.tsx` line 14 — query missing `linked_holiday_package_id`

```ts
supabase.from("savings_goals").select("id, goal_name, current_balance, currency, status")...
```

The `activeGoals` query selects `id, goal_name, current_balance, currency, status`. It does NOT include `linked_holiday_package_id`. Without this column, the grid component has no way to match a goal to a package.

### Layer 2: `HolidayGrid.tsx` lines 147-161 — modal opens without goal

```tsx
<HolidayBookingFlow
  pkg={selectedPackage}
  preferredCurrency={preferredCurrency}
  activeGoals={activeGoals}
  userId={userId}
  onClose={() => setSelectedPackage(null)}
/>
```

No `existingGoal` prop, no `initialAction` prop. The modal opens to the action selection screen regardless of whether the user has a funded goal for this package.

## Why the Detail Page Fix Didn't Help

My previous fix changed `HolidayDetailView.tsx` (line 138-169) to show "🎯 Pay with savings" when `existingGoal` has sufficient balance. This works on the **detail page** (`/dashboard/holidays/[id]`). But users are accessing packages from the **grid page** (`/dashboard/holidays`), which doesn't pass the goal context.

## Fix Plan (2 files, surgical)

### Fix 1: `holidays/page.tsx` — add `linked_holiday_package_id` to query

Line 14, add `linked_holiday_package_id` to the select:

```ts
supabase.from("savings_goals").select("id, goal_name, current_balance, currency, status, linked_holiday_package_id")...
```

### Fix 2: `HolidayGrid.tsx` — find and pass linked goal when opening modal

Before rendering `HolidayBookingFlow`, find the goal linked to this package:

```tsx
const linkedGoal = activeGoals.find((g: any) => g.linked_holiday_package_id === selectedPackage.id);
```

Then pass it, along with `initialAction` when balance is sufficient:

```tsx
<HolidayBookingFlow
  pkg={selectedPackage}
  preferredCurrency={preferredCurrency}
  activeGoals={activeGoals}
  userId={userId}
  existingGoal={linkedGoal}
  initialAction={linkedGoal?.current_balance >= selectedPackage.price_per_person_ngn ? "book" : undefined}
  onClose={() => setSelectedPackage(null)}
/>
```

## Summary

| Before | After |
|--------|-------|
| Grid modal has no goal context | Grid modal finds linked goal from `activeGoals` |
| Action selection screen always shows | Skips to booking form when goal is funded |
| 4 steps to payment | 2 steps to payment |
