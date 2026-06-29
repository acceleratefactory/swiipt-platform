# Group Buy — Add Pending→Confirmed (⏱→✅) Transition in Payment Modal

## Problem

When a user pays via group buy direct bank transfer and admin confirms payment, the `ConfirmationStep` inside `GroupBuyPaymentModal` always shows ⏱ "Payment pending confirmation" — it never transitions to ✅ "Payment confirmed". The user must manually click "Back to groups" to close the modal, then the page refreshes and shows the member marked as "paid".

Compare with holiday and service flows which DO transition to ✅ inside the modal before closing/refreshing.

## Root Cause

`GroupBuyPaymentModal.tsx` — `ConfirmationStep` (lines 548-577) was built as a **static dead-end screen**:

- Has **no `adminConfirmed` state** — always renders ⏱ unconditionally
- Has **no Realtime subscription** inside the modal to detect `group_buy_members.status → "paid"`
- Has **no polling fallback** — no 5-second status check
- The only Realtime subscription is in the parent `GroupDetailActions.tsx:66-86`, which just calls `setShowPaymentModal(false); router.refresh()` — it **skips the ✅ transition entirely**

Additionally, `GroupDetailActions.tsx:63` has `createClient()` in the component body (same bug Session 21 fixed for holiday/service), causing subscription churn — every render tears down and re-creates the Realtime channel.

## Implementation Plan

Two files need changes:

### File 1: `GroupBuyPaymentModal.tsx`

**What:** Add `confirmed`, `adminConfirmed` states + Realtime subscription + polling fallback + pass `adminConfirmed` to `ConfirmationStep`.

#### Step 1 — Add imports and state

Add `useRef` to the import from React (currently only `useEffect, useState`):
```ts
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
```

Add state variables after existing state (after line 50):
```ts
const [confirmed, setConfirmed] = useState(false);
const [adminConfirmed, setAdminConfirmed] = useState(false);
const onPaymentCompleteRef = useRef(onPaymentComplete);
onPaymentCompleteRef.current = onPaymentComplete;
```

#### Step 2 — Set `confirmed = true` when user submits transfer

In the `DirectPaymentStep.onComplete` callback (line 264-267), add `setConfirmed(true)`:
```tsx
onComplete={(result) => {
  setOrderResult(result);
  setConfirmed(true);
  setStep("confirmation");
}}
```

Same for `ResumeDirectPaymentStep.onComplete` (line 278-282).

#### Step 3 — Add Realtime subscription effect

After the existing `useEffect` for `isResuming` (line 65), add:
```tsx
// Realtime: detect admin confirmation and transition to ✅
useEffect(() => {
  if (!confirmed || adminConfirmed || !group.id) return;
  const supabase = createClient();
  const channel = supabase
    .channel(`group_buy_member_payment:${group.id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "group_buy_members",
        filter: `group_buy_id=eq.${group.id}`,
      },
      (payload: any) => {
        if (payload.new?.user_id === userId && payload.new?.status === "paid") {
          setAdminConfirmed(true);
          onPaymentCompleteRef.current?.();
        }
      }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [confirmed, adminConfirmed, group.id]);
```

Note: `userId` is destructured but currently prefixed with underscore (`userId: _userId`). Change to `userId` on line 41.

#### Step 4 — Add polling fallback

After the Realtime effect, add:
```tsx
// Polling fallback: check every 5s in case Realtime missed an event
useEffect(() => {
  if (!confirmed || adminConfirmed || !group.id) return;
  const supabase = createClient();
  const interval = setInterval(async () => {
    const { data, error } = await supabase
      .from("group_buy_members")
      .select("status")
      .eq("group_buy_id", group.id)
      .eq("user_id", userId)
      .maybeSingle();
    const rec = data as { status: string } | null;
    if (rec?.status === "paid" && !error) {
      setAdminConfirmed(true);
      onPaymentCompleteRef.current?.();
    }
  }, 5000);
  return () => clearInterval(interval);
}, [confirmed, adminConfirmed, group.id]);
```

Note: uses `.maybeSingle()` (not `.single()`) to avoid throwing on "no rows found". Also checks `error` to fix the silent-failure bug from holiday/service polling.

#### Step 5 — Pass `adminConfirmed` to `ConfirmationStep`

In the ConfirmationStep render (line 307-312), pass the prop:
```tsx
{step === "confirmation" && (
  <ConfirmationStep
    orderResult={orderResult}
    symbol={symbol}
    adminConfirmed={adminConfirmed}
    onDone={onPaymentComplete}
  />
)}
```

#### Step 6 — Update `ConfirmationStep` function

Change the function signature from:
```tsx
function ConfirmationStep({
  orderResult,
  symbol,
  onDone,
}: {
  orderResult: any;
  symbol: string;
  onDone: () => void;
})
```

To:
```tsx
function ConfirmationStep({
  orderResult,
  symbol,
  adminConfirmed,
  onDone,
}: {
  orderResult: any;
  symbol: string;
  adminConfirmed: boolean;
  onDone: () => void;
})
```

Update the direct payment confirmation UI (lines 548-577) to conditionally show ⏱ or ✅, matching the holiday pattern:
```tsx
return (
  <div style={{ textAlign: "center" }}>
    <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>{adminConfirmed ? '✅' : '⏱'}</p>
    <h3 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
      {adminConfirmed ? 'Payment confirmed!' : 'Payment pending confirmation'}
    </h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
      {adminConfirmed ? (
        <>Your group payment has been confirmed. You're all set!</>
      ) : (
        <>Your payment has been submitted.</>
      )}
    </p>
    {!adminConfirmed && (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
        This usually takes 1–4 business hours.
      </p>
    )}
    <button onClick={onDone} style={{ padding: '0.75rem 1.5rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
      {adminConfirmed ? 'Close' : 'Back to groups'}
    </button>
  </div>
);
```

#### Step 7 — Unprefix `userId`

Change `userId: _userId` to `userId` in the destructuring (line 41) so it's available for the effects.

#### Step 8 — Fix overlay guard

The overlay guard at line 78 currently checks `step === "confirmation"`. Update it to also respect the confirmed+not-yet-closed state:
```tsx
<div onClick={confirmed ? undefined : onClose} ... />
```
This ensures:
- Before user submits payment: clicking overlay closes modal ✓ (existing behavior)
- After user submits (confirmed), overlay click is disabled — user must use the button ✓ (holiday pattern)

### File 2: `GroupDetailActions.tsx`

**What:** Fix `createClient()` in component body (same as Session 21 fix for holiday/service).

#### Step 9 — Move `createClient()` inside effects

Remove `const supabase = createClient();` from line 63 (component body).

Inside the Realtime effect (line 66-86), add `const supabase = createClient();` at the start of the effect body. Remove `supabase` from the dependency array (line 86):
```tsx
useEffect(() => {
  if (!showPaymentModal) return; // optional guard — no need to subscribe when modal isn't open
  const supabase = createClient();
  // ... rest of the effect
  return () => { supabase.removeChannel(channel); };
}, [groupId, currentUserId]); // supabase removed from deps
```

Inside the polling effect (line 88-104), add `const supabase = createClient();` at the start. Remove `supabase` and `router` from deps (line 104, matching holiday pattern):
```tsx
useEffect(() => {
  const supabase = createClient();
  // ... rest of the effect
}, [groupId, currentUserId]); // supabase and router removed from deps
```

This prevents the subscription/polling from being torn down and re-created on every parent re-render.

### Summary of Changes

| File | Change | Why |
|------|--------|-----|
| `GroupBuyPaymentModal.tsx` | Add `confirmed`, `adminConfirmed` states | Track pending→confirmed transition |
| `GroupBuyPaymentModal.tsx` | Add `useRef` for `onPaymentComplete` | Stable callback reference (same pattern as holiday) |
| `GroupBuyPaymentModal.tsx` | Add Realtime subscription effect | Detect admin confirmation inside modal |
| `GroupBuyPaymentModal.tsx` | Add polling fallback effect | Backup if Realtime event missed |
| `GroupBuyPaymentModal.tsx` | Set `confirmed=true` on user transfer submit | Activate subscriptions |
| `GroupBuyPaymentModal.tsx` | Pass `adminConfirmed` to `ConfirmationStep` | Enable conditional UI |
| `GroupBuyPaymentModal.tsx` | Update `ConfirmationStep` UI | Show ⏱→✅ based on `adminConfirmed` |
| `GroupBuyPaymentModal.tsx` | Fix overlay guard for pending state | Prevent accidental dismiss |
| `GroupBuyPaymentModal.tsx` | Unprefix `userId` prop | Make userId available for Realtime filter |
| `GroupDetailActions.tsx` | Move `createClient()` inside effects | Fix subscription churn (Session 21 pattern) |
| `GroupDetailActions.tsx` | Remove `supabase` from effect deps | Prevent unnecessary re-subscribes |

### What stays the same

- The `GroupDetailActions.tsx` Realtime subscription + polling stay as-is (they become a safety net for after the modal closes)
- The `ConfirmationStep` for goal_redemption (🎉 screen) stays unchanged
- The `DirectPaymentStep`, `ResumeDirectPaymentStep`, and other sub-components stay unchanged
- The overlay background and modal container stay the same

### Verification

1. User opens group buy payment modal → selects direct bank transfer → clicks "I Have Transferred"
2. Modal shows ⏱ "Payment pending confirmation" with "Back to groups" button
3. Admin confirms payment in admin panel (`pending_payment → paid`)
4. Within 5 seconds: modal transitions to ✅ "Payment confirmed!" with "Close" button
5. User clicks "Close" → modal closes, page refreshes, member shows as "paid"
