# Investigation: Realtime Payment Confirmation Pattern

## Problem Statement

The goal deposit flow has live Realtime payment confirmation — when admin confirms, the user's page auto-reloads and shows the updated balance instantly. The group buy flow has a Realtime subscription but it's trapped inside the modal. Once the modal closes, the user has no live feedback. The service flow has no Realtime at all.

---

## How Goal Deposit Realtime Works (Reference Pattern)

### Architecture

The Realtime subscription lives in **`GoalDetailView.tsx`** (the parent component), NOT in the modal (`GoalDepositFlow.tsx`).

```
GoalDetailView (parent)
  ├── Realtime subscription: deposits table, filter by goal_id
  │   └── On status === "confirmed" → window.location.reload()
  └── GoalDepositFlow (modal)
      └── Steps: amount → instructions → pending → (admin confirms → page reloads)
```

### The Event Chain

1. User opens deposit modal → enters amount → sees bank details → clicks "I Have Sent the Money"
2. Modal transitions to `"pending"` step: "Payment pending confirmation — We will confirm within 1-4 business hours"
3. User can close the modal — the Realtime subscription in `GoalDetailView` stays active
4. Admin confirms in `PendingDepositsTable` → calls `confirm_deposit` RPC
5. RPC updates `deposits.status = "confirmed"` → fires `postgres_changes` UPDATE event
6. `GoalDetailView` receives the event → sees `status === "confirmed"` → calls `window.location.reload()`
7. Page reloads with fresh data: updated `current_balance`, new milestones, confirmed deposit in history

### Key Design Decisions

- **Realtime in parent, not modal** — subscription persists after modal closes
- **`window.location.reload()` as update mechanism** — blunt but reliable for multi-source data (balance, milestones, deposits, rewards)
- **Full page reload** — avoids complex state management
- **User sees "pending" step while waiting** — a dedicated waiting screen with reference number

---

## How Group Buy Realtime Currently Works

### Architecture

The Realtime subscription lives in **`ConfirmationStep`** (inside `GroupBuyPaymentModal.tsx`), which is a child of the modal.

```
GroupDetailActions (parent)
  ├── No Realtime subscription
  ├── Shows static "Awaiting admin confirmation" card
  └── GroupBuyPaymentModal (modal)
      └── ConfirmationStep
          └── Realtime subscription: group_buy_members, filter by group_buy_id
              └── On status === "paid" && user_id === currentUser → sets adminConfirmed = true
```

### The Problem

1. User opens modal → selects "Pay directly via bank transfer" → sees bank details
2. User clicks "I Have Transferred" → calls `confirm-payment` API → sets `user_confirmed_at`
3. Modal transitions to `ConfirmationStep` — Realtime subscription activates
4. **If user keeps modal open** and admin confirms → teal "Payment confirmed by admin" banner appears ✓
5. **If user closes modal** (clicks "Back to groups") → Realtime subscription is destroyed
6. `GroupDetailActions` shows static teal card: "Payment submitted — Awaiting admin confirmation"
7. **No Realtime on the group detail page** — user must manually refresh to see changes

### What's Missing

| Component | Goal Deposit | Group Buy |
|-----------|-------------|-----------|
| Realtime in parent component | **YES** (`GoalDetailView`) | **NO** (`GroupDetailActions` has none) |
| Realtime survives modal close | **YES** | **NO** |
| Auto page reload on admin confirm | **YES** | **NO** |
| Dedicated "pending" waiting screen | **YES** (modal step) | **PARTIAL** (static card, no live updates) |

---

## How Service Realtime Currently Works

### Architecture

There is **NO Realtime subscription** anywhere in the service payment flow.

```
OrderFlow (modal)
  └── DirectPaymentFlow
      └── Shows bank details → user clicks "I Have Transferred"
          └── Calls confirm API → modal shows static "Order placed!" → closes

ServiceDetailPage (SSR)
  └── ActiveOrderTracker
      └── Reads status on page load — NO Realtime
```

### What Happens

1. User sees bank details → clicks "I Have Transferred" → modal shows "Order placed!" → closes
2. **No waiting screen** — modal closes immediately
3. Admin confirms → user gets a notification but no live page update
4. User must manually visit service detail page to see updated status in `ActiveOrderTracker`

---

## The Gap Summary

### Group Buy: Realtime Trapped in Modal

The Realtime subscription in `ConfirmationStep` works correctly but is destroyed when the modal closes. The parent component (`GroupDetailActions`) has no Realtime, so after modal closure the user sees a static card with no live updates.

**To match the goal deposit pattern:** Add a Realtime subscription to `GroupDetailActions` (or the group detail page) that listens for `group_buy_members` status changes and triggers `router.refresh()` when the member becomes `paid`.

### Service: No Realtime Anywhere

The service flow has no Realtime at all. The modal closes immediately after "I Have Transferred" with a static confirmation message. The `ActiveOrderTracker` reads status only on page load.

**To match the goal deposit pattern:** Add a Realtime subscription to the service detail page (or `ActiveOrderTracker`) that listens for `service_orders` status changes and triggers `router.refresh()` when the order becomes `payment_confirmed`.

---

## Recommended Fix Pattern (No Code — Just Architecture)

### For Group Buy

Add a Realtime subscription to `GroupDetailActions.tsx` (or the group detail page SSR component):

```
GroupDetailActions
  └── useEffect: subscribe to group_buy_members table
      ├── Filter: group_buy_id=eq.{groupId}
      ├── Event: UPDATE
      └── Callback: if status changed to "paid" for current user → router.refresh()
```

This means:
- User clicks "I Have Transferred" → modal shows confirmation step (with its own Realtime as backup)
- User closes modal → group detail page shows static "Awaiting admin" card
- Admin confirms → `group_buy_members.status` updates → Realtime fires → `router.refresh()` → page reloads with fresh data
- User sees updated status without manual refresh

### For Service

Add a Realtime subscription to `ActiveOrderTracker.tsx` or the service detail page:

```
ServiceDetailPage or ActiveOrderTracker
  └── useEffect: subscribe to service_orders table
      ├── Filter: id=eq.{orderId}
      ├── Event: UPDATE
      └── Callback: if status changed → router.refresh()
```

This means:
- User closes modal after "I Have Transferred" → sees static "Awaiting confirmation" in order tracker
- Admin confirms → `service_orders.status` updates → Realtime fires → `router.refresh()` → page reloads
- User sees updated status without manual refresh

---

## Files to Modify (Investigation Only)

| File | Change | Priority |
|------|--------|----------|
| `src/components/dashboard/groups/GroupDetailActions.tsx` | Add Realtime subscription for `group_buy_members` status changes | **High** |
| `src/components/dashboard/services/ActiveOrderTracker.tsx` or `src/app/(dashboard)/dashboard/services/[id]/page.tsx` | Add Realtime subscription for `service_orders` status changes | **High** |

---

*Generated: 2026-06-27*
*Status: Investigation complete — ready for implementation planning*
