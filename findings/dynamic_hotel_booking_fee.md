# Dynamic Hotel Booking Fee — Implementation Plan

## Goal
Make the hotel booking fee configurable from admin settings (no hardcoded values), support a minimum of 3 nights, and let customers add extra nights with incremental pricing.

---

## Overview

```
Admin sets these in platform_settings:
  hotel_base_fee_usd   = 150   (covers 3 nights)
  hotel_extra_night_fee_usd = 50  (per extra night)

Customer sees on modal:
  3 nights (base):     $150
  Extra nights (2):    $100  ← if they choose 5 total
  ─────────────────
  Total:               $250
```

Existing flow (Info → Payment → Pending → Upload → Complete) stays intact. Only the $150 hardcode becomes dynamic + customers can increase nights.

---

## Files to Modify (no new files needed)

### 1. Admin — Settings page
**File:** `src/app/admin/settings/page.tsx` (or wherever admin settings are)
**Or** a simpler route: `src/app/api/admin/settings/route.ts` if there's a generic settings CRUD.

Add three keys to be stored in `platform_settings` table:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `hotel_base_fee_usd` | numeric | 150 | Base fee covering 3 nights |
| `hotel_extra_night_fee_usd` | numeric | 50 | Fee per additional night |
| `hotel_min_nights` | numeric | 3 | Minimum nights (static, not customer-facing editable) |

**Action:** If admin settings page already has a section for editing platform_settings keys, just add these three fields. If not, create a simple admin settings section for visa/hotel configuration.

### 2. API — Redeem Visa Initiation
**File:** `src/app/api/rewards/redeem-visa/route.ts`

**Changes:**
- Accept `nights` in the POST body (default: 3, must be >= `hotel_min_nights`)
- Fetch `hotel_base_fee_usd` and `hotel_extra_night_fee_usd` from `platform_settings`
- Calculate total fee:
  ```
  base_fee = hotel_base_fee_usd
  extra_nights = MAX(0, nights - hotel_min_nights)
  extra_fee = extra_nights * hotel_extra_night_fee_usd
  total_usd = base_fee + extra_fee
  total_ngn = CEIL(total_usd * usd_to_ngn_rate)
  ```
- Store `nights` and `total_usd` in the `visa_redemptions` record (add columns, see DB section)
- Create deposit for `total_ngn`
- Return `totalUsd`, `totalNgn`, `nights`, `baseFeeUsd`, `extraFeeUsd` in response

### 3. Database — New columns on visa_redemptions
**File:** `sprint_15_fix3.sql` (add to migration)

```sql
ALTER TABLE visa_redemptions ADD COLUMN IF NOT EXISTS nights INTEGER DEFAULT 3;
ALTER TABLE visa_redemptions ADD COLUMN IF NOT EXISTS total_fee_usd NUMERIC DEFAULT 150;
ALTER TABLE visa_redemptions ADD COLUMN IF NOT EXISTS base_fee_usd NUMERIC DEFAULT 150;
ALTER TABLE visa_redemptions ADD COLUMN IF NOT EXISTS extra_fee_usd NUMERIC DEFAULT 0;
```

### 4. Modal — QatarVisaRedeemModal.tsx
**File:** `src/components/dashboard/rewards/QatarVisaRedeemModal.tsx`

**Changes:**

#### Info step:
- Add a night selector (number input or +/- buttons, min=3, no max)
- Show price breakdown live:
  ```
  3 nights (base):     $150
  Extra nights (2):    $100    (shown only if > 3)
  ─────────────────
  Total:               $XXX
  ```
- Remove hardcoded `(150 * 1600)` — use API response values
- Text update: "To redeem it, you need to pay the hotel booking fee. The base fee of **$150 USD** covers **3 nights**. You can extend your stay by adding extra nights."

#### Initiate API call:
- Pass `nights` in request body

#### Payment step:
- Show breakdown table: Base fee (3 nights), Extra nights fee, Total
- Replace hardcoded `"Hotel booking fee"` label with dynamic total
- Use `redemptionData.totalNgn` for the amount (already NGN equivalent)
- Show `redemptionData.nights` in the details

#### handleInitiate function:
- Collect `nights` from state (default 3)
- Pass to API

### 5. State changes in modal
Add to existing state:
```typescript
const [nights, setNights] = useState(3);
```

---

## Data Flow Summary

```
Admin → platform_settings (hotel_base_fee_usd, hotel_extra_night_fee_usd)
         ↓
Customer opens modal → Info step
         ↓
Customer selects nights (default 3)
         ↓
POST /api/rewards/redeem-visa { rewardId, nights }
         ↓
API fetches platform_settings + usd rate
Calculates total
Creates visa_redemption (with nights breakdown)
Creates deposit for total NGN
Returns { totalUsd, totalNgn, baseFeeUsd, extraFeeUsd, nights, ... }
         ↓
Modal shows Payment step with full breakdown
         ↓
Rest of flow unchanged (Pending → Upload → Complete)
```

---

## What Does NOT Change

- Upload documents flow
- Payment pending step
- Complete step
- RewardsList button
- WelcomeBanner button
- upload-documents API route
- Notification logic

---

## Checklist

- [ ] Add `hotel_base_fee_usd`, `hotel_extra_night_fee_usd`, `hotel_min_nights` to `platform_settings`
- [ ] Add admin UI to edit these settings
- [ ] Add DB columns: `nights`, `total_fee_usd`, `base_fee_usd`, `extra_fee_usd` to `visa_redemptions`
- [ ] Update `redeem-visa/route.ts` to accept `nights`, calculate dynamically
- [ ] Update `QatarVisaRedeemModal.tsx` with night selector + dynamic price breakdown
- [ ] Remove all hardcoded `150` and `1600` references from the modal
- [ ] Verify existing flow (payment_pending → upload → complete) is untouched
