# Investigation: Why the Payment Pending Confirmation Modal Doesn't Auto-Close

## The Root Cause (Found)

**The goal deposit flow uses `window.location.reload()` (hard page reload). Our group buy flow uses `router.refresh()` (soft refresh). They are fundamentally different mechanisms.**

### How Goal Deposit Auto-Close Works

```
GoalDetailView
├── state: activeSection = "deposit" (when modal is open)
├── {activeSection === "deposit" && <GoalDepositFlow ... />}
└── Realtime callback: window.location.reload()
    → FULL page reload
    → ALL client state is LOST (including activeSection = "deposit")
    → activeSection resets to "overview"
    → GoalDepositFlow is NOT rendered → modal is GONE
    → Updated page data loads with fresh server data
```

### How Group Buy Auto-Close FAILS

```
GroupDetailActions
├── state: showPaymentModal = true (when modal is open)
├── {showPaymentModal && <GroupBuyPaymentModal ... />}
└── Realtime callback: router.refresh()
    → SOFT refresh — only re-renders server components
    → Client state is PRESERVED (showPaymentModal stays true)
    → GroupBuyPaymentModal is STILL rendered → modal stays open
    → Page behind modal updates, but modal is unaffected
```

### Why This Happens

`router.refresh()` in Next.js App Router:
- Re-fetches server component data
- Re-renders server components with fresh data
- **Does NOT reset client component state**

So when `router.refresh()` is called:
1. `showPaymentModal` stays `true` (client state, not affected)
2. `GroupBuyPaymentModal` stays rendered
3. The modal's `step` stays at "confirmation"
4. The "Payment pending confirmation" text stays visible

When the user clicks "Back to groups":
1. `onPaymentComplete` is called
2. `setShowPaymentModal(false)` is called ← THIS is what closes the modal
3. `router.refresh()` updates the page behind the modal

**The "Back to groups" button works because it explicitly sets `showPaymentModal = false`. The Realtime/polling callback only calls `router.refresh()` which does NOT close the modal.**

### Why Polling Also Fails

The polling does the same thing:
```tsx
if (rec?.status === "paid") {
  router.refresh();  // Same problem — doesn't close modal
}
```

It refreshes the page but doesn't close the modal.

## The Fix

The Realtime and polling callbacks need to **explicitly close the modal** in addition to refreshing the page:

```tsx
// Realtime callback AND polling callback should do:
setShowPaymentModal(false);  // Close the modal
router.refresh();             // Refresh the page data
```

This is exactly what the "Back to groups" button does:
```tsx
onPaymentComplete={() => {
  setShowPaymentModal(false);  // ← THIS closes the modal
  router.refresh();             // ← This refreshes the page
}}
```

## Files That Need Change

Only `GroupDetailActions.tsx` needs to be modified:

1. **Realtime callback** (line 78-80): Add `setShowPaymentModal(false)` before `router.refresh()`
2. **Polling callback** (line 97-99): Add `setShowPaymentModal(false)` before `router.refresh()`

## Why GoalDepositFlow Doesn't Need This

GoalDepositFlow uses `window.location.reload()` which resets ALL client state. This is a full browser reload that:
- Clears all React state
- Clears all client-side caches
- Re-fetches everything from the server
- Rebuilds the entire React tree from scratch

This is a "nuclear" approach — it works but is heavy. The group buy flow uses a lighter approach (`router.refresh()`) which requires explicit state management.

## Risk Assessment

The fix is minimal and safe:
- Only adds `setShowPaymentModal(false)` to two callbacks
- `router.refresh()` continues to work for page data updates
- No changes to any other files
- No changes to the modal component itself

---

*Generated: 2026-06-27*
*Status: Root cause identified, fix clear*
