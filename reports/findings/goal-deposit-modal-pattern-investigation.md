# Investigation: Goal Deposit "Pending" Modal Pattern

## Goal

Understand how the goal deposit flow keeps the modal open during admin confirmation and auto-closes on confirmed — then replicate for group buy, holiday booking, and services.

## How the Goal Deposit Flow Works

### The Modal (`GoalDepositFlow.tsx`)

The modal has 4 steps: `amount` → `instructions` → `pending` → (page reload closes it)

**Step "pending" (lines 525–597) — the key:**
- Shows a centered card with clock icon ⏱
- Heading: "Payment pending confirmation"
- Text: "We will confirm your transfer and update your balance within 1–4 business hours"
- Reference number displayed
- **NO X button** — the close button is removed
- **NO overlay click-to-close** — but the overlay `div onClick={onClose}` still exists in the DOM (lines 78–79), however the "pending" step renders INSIDE the modal content area, so clicking the overlay would still trigger `onClose`. The difference is there's no visible X button in the header.
- Only exit: "Back to goal" button at the bottom → calls `onClose()`

### The Parent (`GoalDetailView.tsx`)

Has a Realtime subscription (lines 83–100):
```tsx
useEffect(() => {
  const channel = supabase
    .channel(`deposits:${goal.id}`)
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "deposits",
      filter: `goal_id=eq.${goal.id}`,
    }, (payload) => {
      if ((payload.new as { status: string }).status === "confirmed") {
        window.location.reload();  // <-- THIS closes the modal
      }
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [goal.id]);
```

### The Flow (End to End)

1. User clicks "Add funds" → modal opens at "amount" step
2. User enters amount → clicks "Get payment details" → moves to "instructions" step
3. User sees bank details + reference → clicks "I Have Sent the Money ✓"
4. `user_confirmed_at` is set on the deposit → modal moves to "pending" step
5. **Modal stays open** showing "Payment pending confirmation" — no X, only "Back to goal"
6. User can click "Back to goal" to close manually, OR wait
7. Admin confirms deposit → `deposits.status` updates to "confirmed"
8. Realtime subscription in `GoalDetailView` fires → `window.location.reload()`
9. Page reloads → modal is gone (state not persisted) → goal balance updated

### Critical Design Decisions

| Decision | Goal Deposit | Group Buy (Current) | Holiday (Current) | Service (Current) |
|----------|-------------|---------------------|-------------------|-------------------|
| Confirmation icon | ⏱ clock | 🎉 party | ✓ checkmark | none |
| Heading text | "Payment pending confirmation" | "Payment initiated!" | "✓ Payment submitted" | none |
| X button visible | No | Yes (in modal header) | Yes (in modal header) | N/A |
| Overlay click closes | Technically yes, but no visible close button | Yes | Yes | N/A |
| Close mechanism | "Back to goal" button only | "Back to groups →" button | "Close" button | N/A |
| Realtime location | **Parent** (GoalDetailView) | **Inside modal** (ConfirmationStep) | **Inside modal** (HolidayBookingFlow) | **Nowhere** |
| Auto-close on confirm | Yes — `window.location.reload()` in parent | No — just shows green banner inside modal | No — just shows green banner inside modal | No |

## What's Wrong with Current Implementation

### Group Buy (`GroupBuyPaymentModal.tsx` — ConfirmationStep)

1. **Wrong icon/text** — Shows 🎉 "Payment initiated!" instead of ⏱ "Payment pending confirmation"
2. **X button visible** — Modal header has X button (inherited from parent modal structure at line 79)
3. **Realtime trapped in modal** — ConfirmationStep has its own Realtime subscription (lines 524–548), but when admin confirms it only sets `adminConfirmed = true` to show a green banner. It does NOT close the modal or reload the page.
4. **Page reload in wrong place** — GroupDetailActions has the Realtime subscription that calls `router.refresh()`, but this only updates the parent page data. The modal stays open showing the green banner.

### Holiday Booking (`HolidayBookingFlow.tsx`)

1. Same issues as group buy — Realtime inside modal, no auto-close
2. Confirmation step shows static "Payment submitted for review" with a Close button

### Service (`ActiveOrderTracker.tsx`)

1. No modal at all — user sees a static timeline after closing the order flow
2. Realtime was added to ActiveOrderTracker but it's on the parent page, not in a modal

## The Fix Pattern (What to Replicate)

For each flow, the confirmation/pending step must:

1. **Show clock icon ⏱** — not party emoji or checkmark
2. **Heading: "Payment pending confirmation"** — consistent across all flows
3. **No X button** — remove close button from modal header when in pending state
4. **No overlay click-to-close** — disable overlay click when in pending state
5. **Explanatory text** — "We will confirm your transfer within 1–4 business hours"
6. **Only exit: "Back to [page]" button** — user explicitly chooses to close
7. **Realtime in PARENT component** — not inside the modal. Parent listens for status change → `window.location.reload()` → modal disappears (state not persisted)

### Specific Changes Needed

#### Group Buy (`GroupBuyPaymentModal.tsx`)
- **ConfirmationStep**: Change icon from 🎉 to ⏱, change heading to "Payment pending confirmation", remove "Back to groups →" button text to just show waiting state
- **Modal overlay**: When step is "confirmation" or "direct_payment_resume" with `userConfirmedAt`, disable `onClick={onClose}` on overlay
- **Modal header X**: Hide X button when in pending confirmation state
- **ConfirmationStep Realtime**: REMOVE the Realtime subscription from ConfirmationStep (it's redundant — parent already has it)
- **GroupDetailActions.tsx**: Already has Realtime subscription that calls `router.refresh()` — this will handle auto-close

#### Holiday Booking (`HolidayBookingFlow.tsx`)
- Same pattern: clock icon, "Payment pending confirmation", no close, Realtime in parent

#### Service (new confirmation step needed)
- Service flow currently has no modal confirmation — needs one added to `OrderFlow.tsx` or `DirectPaymentFlow.tsx`

## Files to Modify (When Approved)

| # | File | Change |
|---|------|--------|
| 1 | `GroupBuyPaymentModal.tsx` | Fix ConfirmationStep: clock icon, pending text, hide X/overlay when pending |
| 2 | `HolidayBookingFlow.tsx` | Fix confirmation step: clock icon, pending text, hide close when pending |
| 3 | Parent components | Ensure Realtime subscriptions call `window.location.reload()` (not just `router.refresh()`) |

## Key Insight

The goal deposit flow uses `window.location.reload()` (hard reload) in the parent's Realtime callback. Our current implementation uses `router.refresh()` (soft refresh). The hard reload is what truly closes the modal and resets all client state. `router.refresh()` may not fully reset the modal state.

---

*Generated: 2026-06-27*
*Status: Investigation complete, awaiting approval to implement*
