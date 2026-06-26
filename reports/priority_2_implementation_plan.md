# Sprint 16 Priority 2 — Surgical Implementation Plan

**Approach:** Option B — Full mirror of services payment flow
**Target:** Replace the single-button bank-transfer-only group buy payment with a 4-step modal identical to `OrderFlow.tsx`
**Expected result:** Group buy members can choose Goal Redemption or Direct Payment, see credit auto-apply, get bank details (if Direct), confirm payment, and see live status updates via Realtime.

---

## Overview: What Each File Does

| # | Action | File | What Changes |
|---|--------|------|-------------|
| **1** | **CREATE** | `src/components/dashboard/groups/GroupBuyPaymentModal.tsx` | 4-step modal (mirrors `OrderFlow.tsx`) |
| **2** | **MODIFY** | `src/app/api/group-buy/pay/route.ts` | Accept `paymentMethod` + `goalId`; add goal redemption + credit auto-apply |
| **3** | **CREATE** | `src/app/api/group-buy/confirm-payment/route.ts` | User confirms bank transfer sent |
| **4** | **MODIFY** | `src/components/dashboard/groups/GroupDetailActions.tsx` | Strip inline pay flow; embed `GroupBuyPaymentModal` |
| **5** | **MODIFY** | `src/app/(dashboard)/dashboard/groups/[id]/page.tsx` | Fetch active goals + wallet credits; pass to actions |
| **6** | **MODIFY** | `src/app/api/admin/groups/update-status/route.ts` | Allow `paid` member transition |
| **7** | **SQL** | `reports/priority_2_migration.sql` | Enable Realtime on `group_buy_members` |
| **8** | **MODIFY** | `reports/group_buy_payment_flow_investigation.md` | Update with implementation reference |

---

## Step-by-Step: File 1 — GroupBuyPaymentModal.tsx (CREATE)

**Path:** `src/components/dashboard/groups/GroupBuyPaymentModal.tsx`
**Pattern:** Exact mirror of `src/components/dashboard/services/OrderFlow.tsx` at lines 1–298
**Input Props:**

```ts
interface GroupBuyPaymentModalProps {
  group: {
    id: string;
    item_type: 'holiday_package' | 'service';
    group_price_ngn: number;
    original_price_ngn: number;
    title: string;
    status: string;
  };
  activeGoals: Array<{
    id: string;
    goal_name: string;
    current_balance: number;
    currency: string;
    milestone_100_unlocked: boolean;
    status: string;
  }>;
  walletCredits: number;
  preferredCurrency: string;
  onClose: () => void;
  onPaymentComplete: () => void;
}
```

**States (4-step):**

### Step: "choose_payment"
| Element | Source | Detail |
|---------|--------|--------|
| Overlay + modal shell | `OrderFlow.tsx:66–74` | Fixed overlay + centered modal, 520px width, same z-index |
| Header | `OrderFlow.tsx:75–80` | Group title + destination (omit destination for group buy) → group title |
| Step title | `OrderFlow.tsx:84` | "How would you like to pay?" |
| Price display | `OrderFlow.tsx:85–87` | "Group price: ₦{group_price_ngn}" |
| Credit auto-apply banner | `OrderFlow.tsx:89–121` | If `walletCredits > 0`, show teal banner with breakdown: original → credit → you pay |
| 100% credit (free) | `OrderFlow.tsx:123–147` | If `walletCredits >= groupPrice`, single "Confirm order — ₦0 to pay" button (calls pay API with `paymentMethod: "direct_payment"`, auto-confirms since 0 to pay) |
| Goal redemption button | `OrderFlow.tsx:150–165` | "🎯 Pay from savings goal" — disabled if no eligible goals (balance ≥ 50% of price) |
| Direct payment button | `OrderFlow.tsx:167–174` | "💳 Pay directly via bank transfer" |
| Error display | `OrderFlow.tsx:177–179` | Inline error text |
| Cancel | `OrderFlow.tsx:181–183` | Close modal button |

### Step: "goal_select"
| Element | Detail |
|---------|--------|
| Title | "Select a goal to pay from" |
| Goal cards | Each goal: name, balance, 15% discount badge if `milestone_100_unlocked` |
| Selected state | Teal border + teal pale background |
| Eligible filter | `activeGoals.filter(g => g.current_balance >= group.group_price_ngn * 0.5)` |
| Back button | Returns to step 1 |
| Confirm button | Calls `POST /api/group-buy/pay` with `{ groupBuyId, paymentMethod: "goal_redemption", goalId }` |
| On success | `setStep("confirmation")` |

### Step: "direct_payment" (inline, no sub-component)
| Element | Detail |
|---------|--------|
| Init API call | `useEffect` → `POST /api/group-buy/pay` with `{ groupBuyId, paymentMethod: "direct_payment" }` |
| Loading state | "Generating payment details..." (same as `DirectPaymentFlow.tsx:46`) |
| Amount display | `{currency} {orderData.finalPrice.toLocaleString()}` |
| Bank details | Bank name, account number, account name |
| Reference display | Monospace teal reference with copy button |
| Narration warning | Amber banner: "Include reference in transfer narration" |
| Confirm button | "I Have Transferred the Payment ✓" → calls `POST /api/group-buy/confirm-payment` with `{ groupBuyId }` |
| On success | `setStep("confirmation")` |

### Step: "confirmation"
| Element | Detail |
|---------|--------|
| Emoji | 🎉 |
| Title | "Payment initiated!" (Direct) or "Payment successful!" (Goal Redemption) |
| Message | Goal redemption: "Payment deducted from your goal." Direct: "Transfer the amount to the bank details above." |
| Credit applied banner | If `creditApplied > 0`, show teal banner |
| Back button | "Back to groups →" calls `onPaymentComplete()` which refreshes + redirects |
| Realtime subscription | `useEffect` subscribes to `group_buy_members` channel, filters by `groupBuyId` + `userId`, updates UI when status changes to `paid` (admin confirms) |
| Notification | On Realtime status = `paid`, show inline banner "Payment confirmed by admin ✓" |

**Important behavioral changes from current `GroupDetailActions.tsx`:**
- After confirming payment (Direct), the modal closes and the group detail page shows the member status as `pending_payment`
- The status badge on the member list updates live via Realtime when admin confirms → `paid`

---

## Step-by-Step: File 2 — POST /api/group-buy/pay (MODIFY)

**Path:** `src/app/api/group-buy/pay/route.ts`
**Current behavior (lines 1–183):**
- Always direct payment
- Creates `holiday_bookings` or `service_orders`
- Returns bank details

**New behavior:**

```ts
// NEW props accepted:
const { groupBuyId, travellers, paymentMethod, goalId } = await request.json();
// paymentMethod: "goal_redemption" | "direct_payment" (default: "direct_payment")
// goalId: string (required if paymentMethod === "goal_redemption")
```

**Logic changes by section:**

### A. Validation (lines 14–49) — KEEP all existing, ADD:
```ts
if (paymentMethod === "goal_redemption" && !goalId) {
  return NextResponse.json({ error: "goalId is required for goal redemption." }, { status: 400 });
}
```

### B. Goal Redemption — INSERT before price calc (before line 51):
```ts
let milestoneDiscount = 0;
if (paymentMethod === "goal_redemption") {
  // Fetch goal + validate ownership + check milestone discount
  const { data: goal } = await supabase
    .from("savings_goals")
    .select("milestone_100_unlocked, current_balance")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();
  
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  if (goal.current_balance < totalPrice) {
    return NextResponse.json({ error: "Insufficient goal balance." }, { status: 400 });
  }
  
  if (goal.milestone_100_unlocked) {
    const { data: discountSetting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "milestone_100_discount_pct")
      .single();
    milestoneDiscount = Number(discountSetting?.value || 15) / 100;
    totalPrice = totalPrice * (1 - milestoneDiscount);
  }
}
```

### C. Direct Payment — Credit auto-apply (before line 51):
```ts
let creditApplied = 0;
if (paymentMethod === "direct_payment") {
  const { data: wallet } = await supabase
    .from("wallets")
    .select("total_credits_ngn")
    .eq("user_id", user.id)
    .single();
  
  if (wallet?.total_credits_ngn > 0 && totalPrice > 0) {
    const applied = Math.min(wallet.total_credits_ngn, totalPrice);
    totalPrice = totalPrice - applied;
    creditApplied = applied;
  }
}
```

### D. Service order creation (lines 120–179) — MODIFY:
When `item_type === "service"`, change the insert:
```ts
const { data: order } = await (serviceClient as any)
  .from("service_orders")
  .insert({
    user_id: user.id,
    package_id: groupBuy.service_package_id,
    goal_id: paymentMethod === "goal_redemption" ? goalId : null,
    payment_method: paymentMethod,
    payment_currency: "NGN",
    milestone_discount_pct: milestoneDiscount * 100,
    original_price: pkg?.price_ngn || groupBuy.original_price_ngn,
    final_price: totalPrice,
    ngn_equivalent: totalPrice,
    credits_applied: creditApplied,
    status: paymentMethod === "goal_redemption" ? "payment_confirmed" : "initiated",
  })
  .select("id")
  .single();
```

If `paymentMethod === "goal_redemption"`:
```ts
await (serviceClient as any).rpc("deduct_goal_balance", {
  goal_id_input: goalId,
  amount_input: totalPrice,
});
```

If `paymentMethod === "direct_payment"` and `creditApplied > 0`:
```ts
await (serviceClient as any).rpc("apply_credit_to_order", {
  order_id_input: order.id,
  user_id_input: user.id,
  credit_amount_to_apply: creditApplied,
});
// If credits cover the full amount, auto-confirm
if (totalPrice <= 0) {
  await (serviceClient as any).from("service_orders")
    .update({ status: "payment_confirmed" })
    .eq("id", order.id);
}
```

### E. Membership update (lines 86–92) — MODIFY:
```ts
const memberUpdate: any = { status: paymentMethod === "goal_redemption" ? "paid" : "pending_payment" };
if (groupBuy.item_type === "holiday_package") memberUpdate.booking_id = booking.id;
if (groupBuy.item_type === "service") memberUpdate.order_id = order.id;
if (paymentMethod === "goal_redemption") memberUpdate.paid_at = new Date().toISOString();
await (serviceClient as any).from("group_buy_members").update(memberUpdate).eq("id", membership.id);
```

### F. Activity logging (lines 94–98) — ENHANCE:
```ts
await (serviceClient as any).from("activity_log").insert({
  user_id: user.id,
  event_type: "group_buy_payment_initiated",
  event_data: {
    group_buy_id: groupBuyId,
    item_type: groupBuy.item_type,
    payment_method: paymentMethod,
    booking_id: booking?.id,
    order_id: order?.id,
    total_price: totalPrice,
    credit_applied: creditApplied,
    milestone_discount_pct: milestoneDiscount * 100,
    travellers,
  },
});
```

### G. Response (lines 107–117) — ENHANCE:
```ts
return NextResponse.json({
  success: true,
  paymentMethod,
  paymentType: groupBuy.item_type === "holiday_package" ? "holiday_booking" : "service_order",
  bookingId: booking?.id,
  orderId: order?.id,
  reference: ref,
  totalPrice,
  finalPrice: totalPrice,
  originalPrice: groupBuy.original_price_ngn,
  creditApplied,
  currency: "NGN",
  travellers,
  packageName: pkg?.title || pkg?.name || "",
  bankDetails: paymentMethod === "direct_payment" ? bankDetails : null,
});
```

### H. Handle 100% credit (free order) — NEW early return:
If `paymentMethod === "direct_payment"` and credits cover 100% of price:
- Create order with `status: "payment_confirmed"`
- Update membership to `paid` immediately
- Return success with no bank details
- Skip `confirm-payment` step entirely

---

## Step-by-Step: File 3 — POST /api/group-buy/confirm-payment (CREATE)

**Path:** `src/app/api/group-buy/confirm-payment/route.ts`
**Pattern:** Mirror of `src/app/api/services/direct-payment/confirm/route.ts` lines 1–28

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { groupBuyId } = await request.json();
  if (!groupBuyId) {
    return NextResponse.json({ error: "groupBuyId is required." }, { status: 400 });
  }

  // Validate membership + current status
  const { data: membership } = await (serviceClient as any)
    .from("group_buy_members")
    .select("id, status, order_id, booking_id")
    .eq("group_buy_id", groupBuyId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Membership not found." }, { status: 404 });
  }
  if (membership.status !== "pending_payment") {
    return NextResponse.json({ error: "Payment already confirmed or not initiated." }, { status: 400 });
  }

  // Update membership status (stays pending_payment — admin will set to paid)
  // For service_orders: update to payment_submitted
  if (membership.order_id) {
    await (serviceClient as any)
      .from("service_orders")
      .update({ status: "payment_submitted" })
      .eq("id", membership.order_id);
  }

  // For holiday_bookings: update status to payment_submitted
  if (membership.booking_id) {
    await (serviceClient as any)
      .from("holiday_bookings")
      .update({ status: "payment_submitted" })
      .eq("id", membership.booking_id);
  }

  // Notify admin
  await (serviceClient as any).from("notifications").insert({
    user_id: null,
    type: "group_buy_payment_submitted",
    title: "Group buy payment submitted",
    body: "A user has submitted payment for a group buy. Confirm in admin panel.",
    action_url: "/admin/groups",
    target_segment: null,
  });

  // Activity log
  await (serviceClient as any).from("activity_log").insert({
    user_id: user.id,
    event_type: "group_buy_payment_confirmed_by_user",
    event_data: { group_buy_id: groupBuyId, membership_id: membership.id },
  });

  return NextResponse.json({ success: true, status: "payment_submitted" });
}
```

---

## Step-by-Step: File 4 — GroupDetailActions.tsx (MODIFY)

**Path:** `src/components/dashboard/groups/GroupDetailActions.tsx`
**Current:** Lines 1–222, inline pay flow + success view
**New design:**

### A. Props — ADD:
```ts
interface GroupDetailActionsProps {
  // ... existing props ...
+ activeGoals: Array<{
+   id: string;
+   goal_name: string;
+   current_balance: number;
+   currency: string;
+   milestone_100_unlocked: boolean;
+   status: string;
+ }>;
+ walletCredits: number;
+ preferredCurrency: string;
}
```

### B. State — MODIFY:
```ts
- const [paying, setPaying] = useState(false);
- const [payResult, setPayResult] = useState<any>(null);
- const [payError, setPayError] = useState("");
+ const [showPaymentModal, setShowPaymentModal] = useState(false);
```
Remove: `paying`, `payResult`, `payError` states (moved to modal)

### C. Handler — REPLACE:
```ts
- async function handlePay() { ... }
+ function handlePayClick() {
+   setShowPaymentModal(true);
+ }
```

### D. Render — REPLACE the pay section (lines 142–164):
```ts
{groupStatus === "filled" && membershipStatus === "committed" && (
  <button
    onClick={handlePayClick}
    style={{
      width: "100%",
      padding: "1rem",
      background: "var(--teal)",
      color: "var(--midnight)",
      fontWeight: 700,
      fontSize: "1rem",
      borderRadius: "var(--radius-md)",
      border: "none",
      cursor: "pointer",
    }}
  >
    Pay now — ₦{group.group_price_ngn.toLocaleString()} →
  </button>
)}
```

### E. Remove the `payResult` block (lines 85–131) entirely.

### F. Add modal:
```ts
{showPaymentModal && (
  <GroupBuyPaymentModal
    group={groupData}
    activeGoals={activeGoals}
    walletCredits={walletCredits}
    preferredCurrency={preferredCurrency}
    onClose={() => setShowPaymentModal(false)}
    onPaymentComplete={() => {
      setShowPaymentModal(false);
      router.refresh();
    }}
  />
)}
```

**Note:** `groupData` needs to be passed as a prop or constructed from existing props. Either pass the full group object, or change the component to receive it as a prop.

---

## Step-by-Step: File 5 — Group Detail Page (MODIFY)

**Path:** `src/app/(dashboard)/dashboard/groups/[id]/page.tsx`
**Current:** Lines 1–173

### A. Fetch user's active goals (after line 36):
```ts
const { data: activeGoals } = await (serviceClient as any)
  .from("savings_goals")
  .select("id, goal_name, current_balance, currency, milestone_100_unlocked, status")
  .eq("user_id", user.id)
  .eq("status", "active");
```

### B. Fetch wallet credits (after goals):
```ts
const { data: wallet } = await (serviceClient as any)
  .from("wallets")
  .select("total_credits_ngn")
  .eq("user_id", user.id)
  .single();
const walletCredits = wallet?.total_credits_ngn || 0;
```

### C. Pass to component (line 105–116):
```ts
<GroupDetailActions
  // ... existing props ...
+ groupData={group}
+ activeGoals={activeGoals || []}
+ walletCredits={walletCredits}
+ preferredCurrency={user.preferred_currency || "NGN"}
/>
```

**Also pass `groupData` as new prop** — or refactor GroupDetailActions to accept the full group object, simplifying the existing individual props.

### D. Preferred currency fetch:
Add after the user fetch:
```ts
const { data: profile } = await supabase
  .from("users")
  .select("preferred_currency")
  .eq("id", user.id)
  .single();
const preferredCurrency = profile?.preferred_currency || "NGN";
```

---

## Step-by-Step: File 6 — Admin Groups Update-Status (MODIFY)

**Path:** `src/app/api/admin/groups/update-status/route.ts`
**Current:** Lines 1–153

### A. Member status transitions (line 13) — ADD `paid`:
```ts
const validMemberStatusTransitions: Record<string, string[]> = {
  committed: ["withdrawn"],
  pending_payment: ["paid", "withdrawn"],    // ← added "paid"
  paid: [],
  withdrawn: [],
};
```

### B. Handle `paid` transition — ADD after line 129 (within the member transition block):
```ts
if (newMemberStatus === "paid") {
  // Mark group_buy_members.paid_at
  await (adminSupabase as any)
    .from("group_buy_members")
    .update({ paid_at: new Date().toISOString() })
    .eq("id", memberId);

  // Check if ALL members are now paid → auto-complete group
  const { data: allMembers } = await (adminSupabase as any)
    .from("group_buy_members")
    .select("status")
    .eq("group_buy_id", member.group_buy_id);

  const allPaid = allMembers?.every((m: any) => m.status === "paid");
  if (allPaid) {
    await (adminSupabase as any)
      .from("group_buys")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", member.group_buy_id);
  }

  // Also confirm the linked order/booking if exists
  if (member.order_id) {
    await (adminSupabase as any)
      .from("service_orders")
      .update({ status: "payment_confirmed" })
      .eq("id", member.order_id);
  }
  if (member.booking_id) {
    await (adminSupabase as any)
      .from("holiday_bookings")
      .update({ status: "confirmed" })
      .eq("id", member.booking_id);
  }
}
```

### C. Notification for `paid` — ADD to the notification block:
```ts
const memberNotifications: Record<string, { title: string; body: string }> = {
  paid: { title: "Payment confirmed ✓", body: "Your group buy payment has been confirmed by an admin." },
  withdrawn: { title: "Membership updated", body: "Your membership has been updated to withdrawn by an admin." },
};
```

---

## Step-by-Step: File 7 — DB Migration (CREATE)

**Path:** `reports/priority_2_migration.sql`

```sql
-- Sprint 16 Priority 2: Enable Realtime for group_buy_members
ALTER PUBLICATION supabase_realtime ADD TABLE group_buy_members;
```

---

## Step-by-Step: File 8 — Update Investigation Report

**Path:** `reports/group_buy_payment_flow_investigation.md`
**Action:** Add link to this implementation plan at the top.

---

## Dependency Order (Must Execute Sequentially)

```
1. SQL migration (File 7)        — can run anytime, no code dependency
2. API: pay route (File 2)        —必须先于 UI 调用
3. API: confirm-payment (File 3)  — depends on File 2 response format
4. Modal component (File 1)       — depends on File 2 + File 3 API contracts
5. Admin: update-status (File 6)  — must handle `paid` before users get confirmed
6. Group detail page (File 5)     —新增数据获取
7. GroupDetailActions (File 4)    — depends on Files 1 + 5 props
```

---

## What You Should Expect After Implementation

**User flow for Goal Redemption:**
1. Opens group detail → sees "Pay now — ₦50,000 →" button
2. Clicks → modal opens, Step 1 shows two options
3. Selects "Pay from savings goal" → Step 2 lists eligible goals with balances
4. Selects goal → confirms → `deduct_goal_balance` called, `service_orders` created as `payment_confirmed`
5. Membership immediately → `paid`,  group detail page refreshes, status badge shows "Paid ✓"
6. If all members paid → group auto-completes

**User flow for Direct Payment:**
1. Opens group detail → sees "Pay now" button
2. Clicks → modal Step 1 shows credit banner (if credits exist)
3. Selects "Bank transfer" → Step 3 shows bank details + reference
4. Transfers money → clicks "I Have Transferred the Payment ✓"
5. Membership → `pending_payment`, `service_orders` → `payment_submitted`
6. Admin sees notification → confirms via admin panel (update-status → `paid`)
7. Membership → `paid`, Realtime updates UI live
8. User sees "Payment confirmed by admin ✓" banner without page refresh

**Edge cases handled:**
- 100% credit coverage → auto-confirmed, no bank transfer needed
- Insufficient goal balance → goal not shown in selection
- No eligible goals → Goal Redemption button disabled with tooltip
- Goal with 100% milestone → 15% discount auto-applied
- Expired payment window → blocked by existing validation
- Duplicate confirm → idempotent (status check prevents double-confirm)
- Credit partially covers → remaining amount shown as "You pay"

---

## Files Not Modified

| File | Reason |
|------|--------|
| `src/app/api/group-buy/create/route.ts` | No change needed |
| `src/app/api/group-buy/join/route.ts` | No change needed |
| `src/app/api/group-buy/leave/route.ts` | No change needed |
| `src/app/api/group-buy/expire/route.ts` | No change needed (cron expiry handles `pending_payment` members) |
| `src/app/(public)/join/[code]/page.tsx` | Public invite page unchanged |
| `src/app/(dashboard)/dashboard/groups/page.tsx` | List page unchanged (only detail page affected) |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Goal redemption deducts but order creation fails | Low | Use DB transaction (if possible) or order of operations: create order → then deduct (rollback via support ticket if deduct fails) |
| Credit applied twice (pay API + confirm API) | None | Credit applied only in pay API, confirm API doesn't touch credits |
| Admin transitions member to `paid` but linked order not confirmed | Low | File 6 handles this — always updates linked order/booking when member → `paid` |
| Realtime subscription memory leak | Low | Clean up subscription in `useEffect` return (standard React pattern) |
