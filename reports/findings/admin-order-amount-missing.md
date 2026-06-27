# Investigation: Admin Order Amount Missing ("Amount: -")

## Finding

The admin Service Orders detail page and the Orders table list page both show "Amount: -" for every order, regardless of payment method (goal_redemption or direct_payment). All other fields (User, Email, Service, Destination, Payment, Order date, Status) display correctly.

**Root cause:** The component references a non-existent column `price_paid` on the `service_orders` table. This column has never existed in the database schema, in any SQL migration, or in the TypeScript type definitions. Since `order.price_paid` is always `undefined`, the ternary expression renders the fallback dash.

### Affected Files

| File | Line | Issue |
|------|------|-------|
| `src/components/admin/orders/OrderDetailView.tsx` | 86 | `order.price_paid ? ... : '-'` — `price_paid` does not exist |
| `src/components/admin/orders/OrdersTable.tsx` | 74 | Same pattern — always shows `-` |

### What Actually Exists in the Database

The `service_orders` table was queried with `.select("*")` (fetches all columns). The actual columns include:
- `final_price` — the amount charged after discounts and credit application (**correct field to use**)
- `original_price` — the package price before discounts
- `ngn_equivalent` — NGN conversion at time of payment
- `payment_currency` — the currency the user paid in (not the column being used, which is `currency`)

### Secondary Issue

The component also references `order.currency` (line 86), but the actual database column is `payment_currency`. This means the currency label always falls back to `'NGN'` regardless of the actual payment currency.

---

## Solution

Replace the non-existent column references with the correct existing columns:

| Wrong Reference | Correct Column | Reason |
|----------------|----------------|--------|
| `order.price_paid` | `order.final_price` | `final_price` holds the actual charged amount after all discounts and credit |
| `order.currency` | `order.payment_currency` | `payment_currency` stores the currency the user paid with |

No database migration, API changes, or type definition updates are needed. The data is already being fetched and stored correctly — the display layer simply references the wrong field names.

---

## Implementation Plan

### Step 1 — Fix OrderDetailView.tsx (line 86)

Change `order.price_paid` to `order.final_price` and `order.currency` to `order.payment_currency` in the amount display line. The ternary structure stays the same — if `final_price` is truthy, format it with the currency; otherwise show dash.

### Step 2 — Fix OrdersTable.tsx (line 74)

Apply the same replacement (`price_paid` → `final_price`, `currency` → `payment_currency`) in the table row component that displays amount for each order.

### Step 3 — Verify

- Build: `npm run build` — confirm zero TypeScript errors
- Check both the Orders list page and the individual Order detail page to confirm the amount now displays correctly
- Test with orders using different payment methods (goal_redemption, direct_payment) and different currencies

### No Changes Required

- No SQL migration — the correct columns already exist
- No API route changes — the server page already fetches `*` (all columns including `final_price` and `payment_currency`)
- No type definition changes — `final_price` and `payment_currency` are already in the `service_orders` Row type in `src/types/database.ts`
- No other components reference `price_paid` — the search confirms it only appears in these two files
