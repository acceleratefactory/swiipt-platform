# Group Buy Payment Flow Investigation — Sprint 16 Priority 2

**Date:** 2026-06-26
**Goal:** Understand the complete services payment flow so it can be replicated for group buy.
**Implementation plan:** See `reports/priority_2_implementation_plan.md`

---

## 1. Current State

### Group Buy Pay Endpoint (`POST /api/group-buy/pay`)
- **File:** `src/app/api/group-buy/pay/route.ts`
- Only supports **direct payment** (bank transfer) — no other option exists.
- For holiday packages: creates `holiday_bookings` record with `status: "payment_pending"`.
- For services: creates `service_orders` record with `status: "payment_pending"` and `payment_method: "direct_payment"`.
- Updates `group_buy_members.status` to `"pending_payment"`.
- Returns bank details from `platform_settings`.
- Has a `travellers` param for holiday packages.

### Group Buy Pay UI (`GroupDetailActions.tsx`)
- **File:** `src/components/dashboard/groups/GroupDetailActions.tsx`
- Single button: "Pay now — ₦ group price"
- Calls `POST /api/group-buy/pay` with only `{ groupBuyId }`.
- On success: displays bank details (reference, total, bank name/account).
- No payment method choice — always bank transfer.
- No goal selection, no credit deduction.
- No "confirm payment" step.

---

## 2. Services Payment Flow (Target Pattern)

### OrderFlow Modal (`src/components/dashboard/services/OrderFlow.tsx`)
4-step modal (multi-step dialog):

| Step | Description |
|------|-------------|
| **Step 1: Payment Method** | User chooses between **Goal Redemption** (deduct from savings goal) or **Direct Payment** (bank transfer). Shows available balance per goal if Goal Redemption selected. |
| **Step 2: Goal Select** | (Only if Goal Redemption) Lists eligible savings goals linked to service category. Shows current balance vs target. User picks a goal to redeem from. |
| **Step 3: Summary** | Shows service details, selected payment method, amount to pay. If Direct Payment: shows credit auto-apply amount (unused credit deducted first). If Goal Redemption: shows goal balance and remaining after deduction. |
| **Step 4: Result** | On success: shows order ID, reference, next steps. If Direct Payment: shows bank details. |

### DirectPaymentFlow (`src/components/dashboard/services/DirectPaymentFlow.tsx`)
- Shows bank transfer details with unique reference number (`SWP-ORD-...`).
- **Credit auto-apply:** Checks user's `wallets.total_credits_ngn`. If credits exist, they're automatically deducted from the total, and the user only pays the remainder.
- After seeing bank details, user has a **"Confirm Payment"** button.
- On confirm: calls `POST /api/services/direct-payment/confirm` → sets order status to `payment_pending`.

### Services Order API (`POST /api/services/order/route.ts`)
- Receives: `packageId`, `paymentMethod`, `goalId` (if goal redemption).
- **If Goal Redemption:**
  - Validates goal belongs to user, has sufficient balance, is not locked (or lock period allows).
  - Creates `service_orders` with `payment_method: "goal_redemption"`.
  - Calls `deduct_goal_balance()` RPC to deduct from goal.
  - Sets status to `payment_confirmed` immediately (no bank transfer needed).
- **If Direct Payment:**
  - Creates `service_orders` with `payment_method: "direct_payment"`.
  - Calculates credits to auto-apply from `wallets.total_credits_ngn`.
  - Sets `final_price = price - credits`, `credits_applied = credits`.
  - Status stays `initiated` until user confirms via `direct-payment/confirm`.
  - Generates unique reference `SWP-ORD-{userPrefix}-{timestamp}`.

### Direct Payment Confirm API (`POST /api/services/direct-payment/confirm/route.ts`)
- Receives: `orderId`.
- Validates order exists, belongs to user, status is `"initiated"`.
- Updates `service_orders.status` to `"payment_pending"`.
- Logs to `activity_log` with `event_type: "direct_payment_confirmed"`.

### Admin Order Confirmation (`POST /api/admin/orders/update-status/route.ts`)
- Admin reviews payment proof and updates `service_orders.status` → `"payment_confirmed"`.
- If goal redemption, user skips this step (auto-confirmed).

### Admin Order Detail Components
- Admin sees order timeline, payment method, amount, status.
- Can update status through dropdown.

### Realtime Subscription
- `OrderFlow.tsx` subscribes to Realtime on `service_orders` table to update UI when status changes.
- Admin also sees real-time updates on order queues.

---

## 3. Gap Analysis: Group Buy vs Services Payment Flow

| Feature | Services Payment | Group Buy (Current) | Needed? |
|---------|-----------------|-------------------|---------|
| Payment method choice (Goal Redemption / Direct Payment) | ✅ | ❌ Always direct | Yes |
| Goal selection & balance check | ✅ | ❌ | Yes |
| Credit auto-apply from wallet | ✅ | ❌ | Yes |
| Unique reference generation | ✅ (server) | ✅ (server, similar pattern) | Already exists |
| Direct payment bank details display | ✅ | ✅ (basic) | Already exists |
| "Confirm payment" step (user notifies sent) | ✅ | ❌ | Yes |
| Admin confirmation flow | ✅ (via update-status) | ✅ (generic, via update-status) | Already works |
| Realtime subscription for live status | ✅ | ❌ | Yes (nice to have) |
| Travellers field (holiday packages) | N/A (services only) | ✅ | Already exists |
| Activity logging | ✅ | ✅ (basic) | Yes |
| Error states / loading states | ✅ | ✅ (minimal) | Improve |
| Milestone discount handling | ✅ (order flow) | ❌ (uses group_price_ngn) | Works as-is |

### Key Issues
1. **No payment method choice** — group buy always forces bank transfer. Users with savings goals cannot redeem from goals for group buy purchases.
2. **No credit deduction** — users with wallet credits (from referrals, prizes, streaks) must still pay the full amount. Credits should auto-apply.
3. **No "confirm payment" step** — after seeing bank details, there's no way for the user to signal they've sent the money. The order stays in limbo.
4. **Single-file payment UI** — unlike services (4-step modal), group buy payment is a single button → success view. No summary, no method selection.
5. **Realtime missing** — no live status update when admin confirms payment.

---

## 4. Recommendations for Group Buy Payment Upgrade

### Option A: Light (Minimal changes, reuse existing patterns)
1. Add payment method choice to `GroupDetailActions.tsx` — a pill selector between "Pay from goal" and "Bank transfer".
2. Extend `POST /api/group-buy/pay` to handle `paymentMethod` and `goalId`.
3. If Goal Redemption: validate goal balance ≥ group price, call `deduct_goal_balance()`, set membership status to `paid` immediately.
4. If Direct Payment: add credit auto-apply from `wallets.total_credits_ngn`, reduce `final_price`, generate reference.
5. Add "Confirm Payment" button and a `POST /api/group-buy/confirm-payment` endpoint.
6. Subscribe to Realtime on `group_buy_members` for status updates.

### Option B: Full (Reuse OrderFlow pattern)
1. Build a multi-step group buy payment modal (reuse `OrderFlow.tsx` component with group-specific params).
2. Full method selection → goal select → summary → result steps.
3. Everything from Option A plus summary/confirmation modal.
4. Integrates with existing `OrderFlow` component (pass group buy context).

### Files to modify (Option A approach):
| File | Change |
|------|--------|
| `src/components/dashboard/groups/GroupDetailActions.tsx` | Add payment method selector, goal picker, confirm button. Add Realtime subscription. |
| `src/app/api/group-buy/pay/route.ts` | Accept `paymentMethod` + `goalId`. Add goal redemption logic, credit auto-apply. |
| `src/app/api/group-buy/confirm-payment/route.ts` | **New:** user confirms bank transfer sent. |
| `src/app/(dashboard)/dashboard/groups/[id]/page.tsx` | Pass additional data (user's goals, wallet credits) to GroupDetailActions. |

---

## 5. Key Learnings from Services Flow

- **Goal Redemption** is the preferred UX path for users with savings goals — it's frictionless (auto-confirmed, no waiting for bank transfer).
- **Direct Payment** must always show credits auto-applied — users should see the reduced amount upfront.
- **Reference format** `SWP-{prefix}-{userPrefix}-{timestamp}` — keep consistent across the platform.
- **Status pipeline matters:** `initiated` → (user confirms) → `payment_pending` → (admin confirms) → `payment_confirmed`.
- **Activity logging** is mandatory for every payment action — audit trail for compliance.
- **Realtime** keeps the UI snappy — status changes appear without page refresh.

---

## 6. Related Files for Reference

| File | Purpose |
|------|---------|
| `src/components/dashboard/services/OrderFlow.tsx` | 4-step payment modal (target pattern) |
| `src/components/dashboard/services/DirectPaymentFlow.tsx` | Bank transfer UI with credit auto-apply |
| `src/app/api/services/order/route.ts` | Service order creation API |
| `src/app/api/services/direct-payment/confirm/route.ts` | User confirms bank transfer sent |
| `src/app/api/admin/orders/update-status/route.ts` | Admin confirms payments |
| `src/app/api/group-buy/pay/route.ts` | Current stub group buy pay endpoint |
| `src/components/dashboard/groups/GroupDetailActions.tsx` | Current group buy payment UI |
| `src/app/(dashboard)/dashboard/groups/[id]/page.tsx` | Group detail page (passes props) |
| `reports/sprint_16_investigation_report.md` | Original Sprint 16 priorities |
