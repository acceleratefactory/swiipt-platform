# Investigation: Holiday Pay Flow Has Too Many Steps

## Current User Journey (when funded goal exists)

**Step 1** — Holiday detail page shows:
- "Continue saving →" link (takes user to goal page, away from booking)
- "Book directly" button

**Step 2** — Click "Book directly" → modal opens to initial action screen showing:
- "🎯 Save toward this trip"
- "✈️ Book directly"
(Neither option indicates the user already has a funded goal ready to pay)

**Step 3** — Click "Book directly" again → travellers/currency form

**Step 4** — Fill in details → "Pay from {goal_name}" button appears

**Step 5** — Click "Pay from {goal_name}" → payment confirmed

**Total: 4 clicks after page load to reach payment**

## Problem

The primary CTA "Continue saving →" directs the user to the goal detail page — away from the booking flow. Even if they click "Book directly", they must navigate two intermediate screens (action selection + form) before seeing the goal payment option. The goal payment flow is buried.

## Root Cause Analysis

### File: `HolidayDetailView.tsx` lines 137-161

```tsx
{existingGoal ? (
    <a href={`/dashboard/goals/${existingGoal.id}`}>Continue saving →</a>
) : (
    <button>Save toward this</button>
)}
```

The condition only checks `if (existingGoal)` — it does NOT check whether the balance is sufficient. When the user has already fully funded their goal, "Continue saving" is misleading and not actionable toward booking.

### File: `HolidayBookingFlow.tsx` lines 258-295

The initial action screen shows "Save toward this trip" and "Book directly" regardless of whether the user already has a goal for this package. When `existingGoal` is passed as a prop, the initial screen should adapt to show the funded state.

## Recommended Fix

Two coordinated changes:

### Fix A: Detail page — change CTA when goal has sufficient balance

In `HolidayDetailView.tsx`, change the button logic:

```
if (!existingGoal) → "Save toward this"
if (existingGoal && balance < totalPrice) → "Continue saving →" (link to goal)
if (existingGoal && balance >= totalPrice) → "🎯 Pay with savings" (opens modal)
```

The "🎯 Pay with savings" button should open `HolidayBookingFlow` and pass an initial action of `"book"` so the modal skips the action selection screen and goes straight to the travellers/currency form with payment options.

**Implementation approach:**
Add a state `initialAction` and pass it to `HolidayBookingFlow`. When `initialAction = "book"`, the component skips the `!action` screen and renders the booking form directly.

### Fix B: HolidayBookingFlow — accept initial action prop

Add an optional `initialAction` prop. When `initialAction === "book"`, the component initializes `action = "book"` instead of `null`, skipping the first screen.

### Fix C: Booking form — surface goal payment more prominently

When the user reaches the booking form and a funded goal exists, pre-select "Pay from goal" as the primary option (teal, prominent) with "Bank transfer" as secondary (outline style). This signals which path is recommended.

## UX improvement summary

| Before | After |
|--------|-------|
| "Continue saving →" (off to goal page) | "🎯 Pay with savings" (opens booking) |
| 4 clicks to reach payment | 2 clicks to reach payment |
| Goal option hidden behind 2 screens | Goal option shown immediately |
| User must re-select action | Action pre-selected based on state |

This is a pure UX change — no API route changes, no database changes, no new props in the data pipeline. Only `HolidayDetailView.tsx` and `HolidayBookingFlow.tsx` need edits.
