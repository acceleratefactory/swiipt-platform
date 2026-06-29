# Holiday Booking Flow — Pending Confirmation Gap Analysis

**Date:** 2026-06-29
**Scope:** Comparison of "pending payment confirmation" modal/state patterns across 3 payment flows
**Author:** Automated investigation

---

## 1. GOAL DEPOSIT FLOW — The Reference Pattern

### Files Examined
| File | Path |
|------|------|
| GoalDepositFlow | `C:\Users\HPM6\Desktop\Swiipt\swiipt\src\components\dashboard\goals\GoalDepositFlow.tsx` |
| GoalDetailView (parent) | `C:\Users\HPM6\Desktop\Swiipt\swiipt\src\components\dashboard\goals\GoalDetailView.tsx` |

### How the "pending" state is displayed (lines 525-597 of GoalDepositFlow.tsx)

The `pending` step (lines 525-597) renders:
- A white card with centered text and border (lines 526-534)
- A clock icon in teal circle background 64x64 (lines 536-549)
- "Payment pending confirmation" heading (lines 550-560)
- Body text: 1-4 business hours window (lines 561-566)
- Reference display in off-white pill (lines 567-579)
- "Back to goal" button (midnight bg, white text) — calls onClose (lines 580-595)

**Key characteristic:** The `pending` step is rendered inline within the goal detail page (not a modal overlay). It is a section of the page like any other step.

### X button behavior
- X button is PRESENT on steps "amount" (lines 253-263) and "instructions" (lines 386-388).
- X button is ABSENT on the "pending" step — no close/X button is rendered. The only way to dismiss it is the "Back to goal" button (lines 581-595), which calls onClose.
- There is no overlay — this is inline content, not a modal.

### Where the Realtime subscription lives
- **PARENT component** (GoalDetailView.tsx, lines 89-111).
- The subscription is set up ONCE when the component mounts (dependency on goal.id only).
- It stays active regardless of which activeSection is shown.
- On admin confirmation (status === "confirmed"), it calls window.location.reload() — a hard reload.

### Auto-close / page refresh behavior
- Hard reload (window.location.reload(), line 102).
- No polling fallback needed (deposits table was the first Realtime-enabled table in Sprint 5).
- The user sees the page refresh and the pending section disappears, replaced by updated goal balance.

### User experience timeline
| Stage | What user sees |
|-------|---------------|
| Before deposit | Goal detail page with progress ring, "Add Funds" button |
| During deposit (amount) | Inline card: currency selector + amount input |
| During deposit (instructions) | Bank details + reference with copy + "I Have Sent the Money" button |
| After clicking "I Have Sent" | Pending: clock icon + "Payment pending confirmation" + "Back to goal" button |
| After admin confirms | Page auto-reloads -> goal balance updated, pending state gone |

### Sprint Docs Reference
- Sprint 5 Phase 5 (phase_5_deposit_flow.md, line 36-39): Documents 3-step state machine.
- Sprint 5 Phase 4 (phase_4_goal_detail_page.md, line 34): "auto-reloads when deposit is confirmed".
- Sprint 5 Readiness (sprint_5_readiness_summary.md, line 169): Confirms Realtime subscription pattern.

---

## 2. GROUP BUY PAYMENT FLOW — The Applied Pattern

### Files Examined
| File | Path |
|------|------|
| GroupBuyPaymentModal | `C:\Users\HPM6\Desktop\Swiipt\swiipt\src\components\dashboard\groups\GroupBuyPaymentModal.tsx` |
| GroupDetailActions (parent) | `C:\Users\HPM6\Desktop\Swiipt\swiipt\src\components\dashboard\groups\GroupDetailActions.tsx` |

### How the "pending" state is displayed (ConfirmationStep component, lines 510-577)

The ConfirmationStep handles two paths:

**Goal redemption path (lines 521-545):**
- Party popper emoji (line 524)
- "Payment successful!" heading
- Shows credit applied if any
- "Back to groups" button

**Direct payment path (lines 548-577) — the "pending" state:**
- Clock icon in teal circle background 64x64
- "Payment pending confirmation" heading
- Body text: 1-4 business hours window (mirrors goal deposit flow)
- Travel credit applied notice (if any)
- Reference display in off-white pill
- "Back to groups" button (midnight bg, white text)

This is a close mirror of the goal deposit flow's pending state UI.

### X button / overlay behavior
- X button is hidden during confirmation step (line 91: step !== "confirmation" guard).
- Overlay click disabled during confirmation (line 78: onClick={undefined}).
- Cursor set to "default" vs "pointer" for other steps.
- No way to close the modal except "Back to groups" button.

### Where the Realtime subscription lives
- **PARENT component** (GroupDetailActions.tsx, lines 66-104).
- Two-layer approach:
  1. Realtime subscription (lines 66-86): Listens for UPDATE on group_buy_members filtered by group_buy_id.
  2. Polling fallback (lines 89-104): Every 5 seconds queries group_buy_members.status directly.
- When status === "paid": calls setShowPaymentModal(false); router.refresh().

### Auto-close / page refresh behavior
- Dual mechanism: Realtime + polling fallback (5s interval).
- router.refresh() (not window.location.reload()) — refreshes server components.
- Modal closes first via setShowPaymentModal(false).

### User experience timeline
| Stage | What user sees |
|-------|---------------|
| Before payment | Group detail with amber "Continue Payment" or "Pay now" button |
| In modal | Payment method selection / goal select / direct payment |
| Direct payment step | Bank details, reference, "I Have Transferred" button |
| Confirmation step | Clock icon + "Payment pending confirmation" + reference + "Back to groups" |
| After admin confirms | Modal auto-closes -> page refreshes -> card shows "Awaiting admin confirmation" |

---

## 3. HOLIDAY BOOKING FLOW — The Gap

### Files Examined
| File | Path |
|------|------|
| HolidayBookingFlow | `C:\Users\HPM6\Desktop\Swiipt\swiipt\src\components\dashboard\holidays\HolidayBookingFlow.tsx` |
| HolidayDetailView (parent) | `C:\Users\HPM6\Desktop\Swiipt\swiipt\src\components\dashboard\holidays\HolidayDetailView.tsx` |
| Server page | `C:\Users\HPM6\Desktop\Swiipt\swiipt\src\app\dashboard\dashboard\holidays\[id]\page.tsx` |

### What the "confirmed" state looks like (lines 147-167 of HolidayBookingFlow.tsx)

Uses a single `confirmed` boolean with `adminConfirmed` sub-state:
- confirmed = false -> user sees bank transfer details
- confirmed = true, adminConfirmed = false -> "Payment submitted!" with party popper
- confirmed = true, adminConfirmed = true -> "Payment confirmed!" with checkmark

### The 5 Specific Gaps

#### Gap 1: Wrong icon/state for "pending" (HolidayBookingFlow.tsx, line 151)
- Uses party popper instead of clock icon.
- Says "Payment submitted!" instead of "Payment pending confirmation".
- Implies success/completion rather than waiting state.

#### Gap 2: Overlay click not disabled during pending (HolidayDetailView.tsx, line 174)
- Modal overlay onClick always calls setShowBooking(false) with no step guard.
- User can accidentally dismiss the pending state by clicking outside the modal.

#### Gap 3: No polling fallback (HolidayBookingFlow.tsx)
- Only Realtime subscription, no 5-second Supabase query fallback.
- If Realtime event is missed (WebSocket disconnect, tab backgrounded), modal never auto-updates.

#### Gap 4: No auto-close on admin confirmation (HolidayBookingFlow.tsx, line 40)
- Realtime callback only sets setAdminConfirmed(true) — no close or refresh.
- Parent's router.refresh() does not close modal (showBooking is client state).

#### Gap 5: Realtime subscription in modal (HolidayBookingFlow.tsx, lines 26-46)
- Subscription inside modal with cleanup on unmount.
- If user closes modal before admin confirms, channel is destroyed.

### Where the Realtime subscription lives
| Location | Scope | Problem |
|----------|-------|---------|
| Inside modal (HolidayBookingFlow, lines 26-46) | Only while modal is open and confirmed=true | If user closes modal, subscription is lost |
| In parent (HolidayDetailView, lines 32-53) | On page load if existingBooking exists | Catches admin confirmation but does not auto-close modal |

### Auto-close / page refresh behavior
- Inside modal: setAdminConfirmed(true) only updates text. No auto-close.
- Parent component: router.refresh() refreshes server components. Modal stays open.
- No polling fallback.

---

## 4. SIDE-BY-SIDE COMPARISON

| Aspect | Goal Deposit (Reference) | Group Buy (Applied) | Holiday Booking (Gap) |
|--------|-------------------------|---------------------|-----------------------|
| UI icon for pending | Clock (teal circle) | Clock (teal circle) for direct payment | Party popper (implies success) |
| Heading text | "Payment pending confirmation" | "Payment pending confirmation" / "Payment successful!" | "Payment submitted!" / "Payment confirmed!" |
| X button hidden? | Yes (no X rendered) | Yes (step guard) | No X in component, but overlay click closes (no guard) |
| Overlay click disabled? | N/A (inline) | Yes (onClick=undefined) | No (always calls setShowBooking(false)) |
| Where Realtime lives | Parent (persists) | Parent (persists) | Both modal + parent (modal sub cleans up on unmount) |
| Subscribed table | deposits | group_buy_members | holiday_bookings |
| Filter | goal_id=eq.{id} | group_buy_id=eq.{id} + user_id check | id=eq.{bookingId} |
| Auto-close mechanism | window.location.reload() | setShowPaymentModal(false); router.refresh() | setAdminConfirmed(true) — no auto-close |
| Polling fallback | None | Yes — 5s interval | None |
| Post-confirmation user action | None (auto-reloads) | None (auto-closes) | Must click "Close" manually |
| Risk of missed Realtime | Low | Low (dual) | Medium |

---

## 5. EXACT LINE NUMBERS FOR KEY SECTIONS

### Goal Deposit Flow — Reference Pattern
| What | File | Lines |
|------|------|-------|
| Pending step rendering | `GoalDepositFlow.tsx` | 525-597 |
| Clock icon | `GoalDepositFlow.tsx` | 536-549 |
| "Payment pending confirmation" heading | `GoalDepositFlow.tsx` | 550-560 |
| No X button in pending | `GoalDepositFlow.tsx` | 525-597 |
| Realtime subscription (parent) | `GoalDetailView.tsx` | 89-111 |
| Hard reload on confirm | `GoalDetailView.tsx` | 102 |
| onClose passes setActiveSection("overview") | `GoalDetailView.tsx` | 368 |

### Group Buy Payment Flow — Applied Pattern
| What | File | Lines |
|------|------|-------|
| ConfirmationStep component | `GroupBuyPaymentModal.tsx` | 510-577 |
| Clock icon for direct payment | `GroupBuyPaymentModal.tsx` | 550-551 |
| "Payment pending confirmation" heading | `GroupBuyPaymentModal.tsx` | 552-554 |
| No X button guard | `GroupBuyPaymentModal.tsx` | 91 |
| Overlay disabled guard | `GroupBuyPaymentModal.tsx` | 78 |
| Realtime subscription (parent) | `GroupDetailActions.tsx` | 66-86 |
| Polling fallback (parent) | `GroupDetailActions.tsx` | 89-104 |
| Auto-close + refresh | `GroupDetailActions.tsx` | 79-81, 99-101 |
| Modal open with isResuming | `GroupDetailActions.tsx` | 252-266 |

### Holiday Booking Flow — The Gaps
| What | File | Lines |
|------|------|-------|
| confirmed state rendering | `HolidayBookingFlow.tsx` | 147-167 |
| Party popper icon (should be clock) | `HolidayBookingFlow.tsx` | 151 |
| "Payment submitted!" heading (should be pending) | `HolidayBookingFlow.tsx` | 153 |
| Inner Realtime subscription | `HolidayBookingFlow.tsx` | 26-46 |
| Callback only sets state, no auto-close | `HolidayBookingFlow.tsx` | 40 |
| Overlay click, no guard | `HolidayDetailView.tsx` | 173-174 |
| Parent Realtime subscription | `HolidayDetailView.tsx` | 32-53 |
| Parent refresh on confirm | `HolidayDetailView.tsx` | 47 |
| Server query for existingBooking | `holidays/[id]/page.tsx` | 43-51 |
| Modal open button | `HolidayDetailView.tsx` | 172-188 |
| "I Have Transferred" button | `HolidayBookingFlow.tsx` | 222-244 |

---

## 6. RECOMMENDED FIXES

### Priority 1 — Align pending UI with established pattern
**Files:** HolidayBookingFlow.tsx (lines 147-167)
- Change party popper to clock icon when adminConfirmed === false
- Change heading from "Payment submitted!" to "Payment pending confirmation"
- Add the 1-4 business hours body text (copy from GroupBuyPaymentModal.tsx lines 555-558)

### Priority 2 — Disable overlay dismissal during pending
**File:** HolidayDetailView.tsx (line 174)
- Pass isPending prop from HolidayBookingFlow up to HolidayDetailView
- When isPending === true, set overlay onClick to undefined

### Priority 3 — Add auto-close behavior
**File:** HolidayBookingFlow.tsx (line 40)
- After setAdminConfirmed(true), call a new onAutoClose prop
- In HolidayDetailView.tsx, implement handleAutoClose that does setShowBooking(false); router.refresh()

### Priority 4 — Add polling fallback
**File:** HolidayBookingFlow.tsx
- Add a useEffect with setInterval that polls holiday_bookings.status every 5 seconds
- Mirror the pattern in GroupDetailActions.tsx lines 89-104

### Priority 5 — Move Realtime subscription to parent
**File:** HolidayDetailView.tsx (lines 32-53)
- Ensure parent subscription triggers when booking is newly created
- Consider removing inner subscription from HolidayBookingFlow.tsx once parent is robust

---

*Report generated from source code analysis of Swiipt platform, Sprint 5/6 docs, and Session 11 findings.*
