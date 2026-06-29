# Sprint 16 System 2 — Post-Deployment Gap Analysis

## Summary

The 6-phase System 2 build (trade show group savings) delivered tables, APIs, basic pages, and sidebar entries. However, user testing reveals 5 critical gaps that prevent the feature from being fully functional. This report documents each gap with root cause, impact, and proposed fix.

---

## Gap 1: Admin CRUD (Edit/Add Trade Shows)

### Status
❌ **Broken** — Admin trade shows page is read-only

### Root Cause
The admin page at `src/app/(admin)/admin/trade-shows/page.tsx:88-113` renders a static `<table>` with data-only cells. There is no:
- Edit link/button on any row
- "Add Trade Show" button
- Clickable row behavior
- No admin upsert/toggle API endpoint exists
- No form component (`TradeShowForm.tsx`)
- No `new/` or `[id]/` page routes

### Sprint 16 Doc Spec
> "Shows all trade shows with edit button for each."

### Impact
Admins cannot add new trade shows, edit existing ones, or toggle active/inactive. The entire trade show catalog is hardcoded to the 6 seed rows. Adding or updating trade shows requires direct SQL access.

### Fix Required
1. **API route:** `POST /api/admin/trade-shows/upsert` — mirror `services/upsert/route.ts` pattern
2. **API route:** `POST /api/admin/trade-shows/toggle` — mirror `services/toggle/route.ts` pattern
3. **Form component:** `TradeShowForm.tsx` — mirror `ServicePackageForm.tsx` pattern
4. **Table component:** `TradeShowsTable.tsx` (client component) — with toggle + edit link
5. **Pages:** `new/page.tsx` (create form), `[id]/page.tsx` (edit form)
6. **Rewrite admin list page** to use client table component

### Fields
The `trade_shows` table has these fields for the form:
`name`, `location_city`, `location_country`, `venue`, `event_date_start`, `event_date_end`, `registration_deadline`, `category`, `base_cost_solo_ngn`, `base_cost_group_ngn`, `min_group_size`, `max_group_size`, `description`, `invitation_letter_fee_ngn`, `image_url`, `is_active`

---

## Gap 2: Create Group Page Returns 404

### Status
❌ **Broken** — Link navigates to non-existent route

### Root Cause
`src/app/(dashboard)/dashboard/trade-shows/[showId]/page.tsx:167` links to:
```html
<a href={`/dashboard/trade-shows/create?showId=${show.id}`}>
  Create my own group
</a>
```
No route file exists at `/dashboard/trade-shows/create/page.tsx`. The API endpoint `POST /api/trade-shows/create-group` exists (verified working), but no UI page calls it.

### Sprint 16 Doc Spec
> "Create a new group page with form for trade show group creation."

### Impact
Users see a 404 error page when clicking "Create my own group" on any trade show detail page. The only way to create a group is to use the API directly.

### Fix Required
**Option A (Recommended — Modal):** Add a "Create Group" modal to the show detail page. This avoids a separate page navigation, mirrors the Group Buy create flow, and keeps the user in context.

**Option B (Page):** Create `src/app/(dashboard)/dashboard/trade-shows/create/page.tsx` with a server component that reads `showId` from query params, fetches the trade show, and renders a form.

The API route already exists and works — this is purely a UI gap.

---

## Gap 3: No Dashboard Join Flow

### Status
⚠️ **Limited** — Join requires 3 clicks through separate pages

### Root Cause
The catalog page (`src/app/(dashboard)/dashboard/trade-shows/page.tsx`) shows `TradeShowCard` components that link to the show detail page. The show detail page shows open groups with "Join →" links. The user must:
1. Click a card → show detail page
2. Scroll to find open groups
3. Click "Join →" → group detail page
4. Click "Join this group" button

There is no inline "Join" button on the catalog page cards, no "Join group" option on the show detail page without going into a specific group, and no quick-join CTA.

### Sprint 16 Doc Spec
> "Join groups from the discovery page."

### Impact
High friction for joining groups. Users may not discover groups easily, reducing group formation.

### Fix Required
1. Add "Open groups" count badge to `TradeShowCard` with quick-join link
2. Add inline "Join first open group" button on the show detail page (if user is not a member)
3. Add "Create group" CTA on the catalog page when no groups exist for a show

---

## Gap 4: Discount Is Hardcoded

### Status
⚠️ **Limited** — Discount computed from seed data, not configurable

### Root Cause
In `TradeShowCard.tsx:22-24` and `show detail page:40-42`, the savings percentage is computed:
```typescript
const savingsPct = show.base_cost_group_ngn
  ? Math.round((1 - show.base_cost_group_ngn / show.base_cost_solo_ngn) * 100)
  : 0;
```
This is purely derived from the seed data prices. There is no:
- Admin-configurable discount tier system
- `platform_settings` entry for trade show discounts
- Admin UI to configure discount percentages

Compare with Group Buy which has `group_buy_discounts` in `platform_settings` and a discount tier map.

### Sprint 16 Doc Spec
> "Admin can set discount tiers from settings."

### Impact
Admin cannot run promotions or adjust savings percentages. The "Save X%" text is hardcoded to whatever price ratio the seed data happened to specify.

### Fix Required
1. Add `trade_show_discounts` key to `platform_settings` seed (e.g., `{"min_group_size": {"5": 10, "10": 15, "20": 20}}`)
2. Add discount logic to the API/utility functions
3. Optionally add to admin settings UI (`PlatformSettingsForm.tsx`)
4. Update `TradeShowCard` and show detail page to use discount tiers

---

## Gap 5: No Dedicated Payment Modal

### Status
⚠️ **Limited** — Links to generic goal deposit flow, no dedicated payment UX

### Root Cause
The group detail page (`src/app/(dashboard)/dashboard/trade-shows/groups/[groupId]/page.tsx:175`) links to:
```html
<a href={`/dashboard/goals/${myGoal.id}`}>Start saving my share →</a>
```
This takes users to the generic goal detail page where they must find the "Add Funds" button, go through the generic `GoalDepositFlow` modal (3-step: amount → bank details → pending), and manage deposits separately. There is no:
- Dedicated payment modal within the trade show group context
- Payment status auto-refresh after deposit confirmation
- "All members funded → group advances" notification
- Trade-show-specific payment UX showing group funding progress

### Sprint 16 Doc Spec
> "In-group payment modal with progress tracking."

### Impact
Users leaving the group context to pay results in drop-off. No cohesive payment experience. No visibility into when the group becomes fully funded.

### Fix Required
1. Create `TradeShowGroupPaymentModal.tsx` — dedicated payment modal within the group detail page
2. Add Realtime subscription for deposit/trade show member status changes
3. Add auto-refresh when member becomes "funded"
4. Show group funding progress within the modal
5. Notify user when group is fully funded

---

## Priority Matrix

| Gap | Priority | Effort | UX Impact | Admin Impact |
|-----|----------|--------|-----------|--------------|
| 1. Admin CRUD | 🔴 Critical | Medium | Low | High (no catalog mgmt) |
| 2. Create Group 404 | 🔴 Critical | Low | High (broken flow) | None |
| 3. No Join Flow | 🟡 High | Low | High (friction) | None |
| 4. Hardcoded Discount | 🟡 High | Low | Medium | Medium |
| 5. No Payment Modal | 🟡 High | Medium | High (drop-off) | None |

## Recommended Build Order

### Phase 1 — Create Group Modal (fixes Gap 2)
- Create modal on show detail page so "Create my own group" works
- Low effort, unblocks the primary user flow

### Phase 2 — Join Flow (fixes Gap 3)
- Add open group count + quick-join to catalog page cards
- Add inline join CTA on show detail page
- Low effort, reduces friction

### Phase 3 — Admin CRUD (fixes Gap 1)
- API routes (upsert + toggle)
- Form component + table component
- new/edit pages
- Medium effort, enables catalog management

### Phase 4 — Payment Modal (fixes Gap 5)
- Dedicated trade show group payment modal
- Realtime subscription for funding status
- Medium effort, improves conversion

### Phase 5 — Discount Settings (fixes Gap 4)
- `platform_settings` entry for trade show discounts
- Update UI to use configurable discount tiers
- Low effort, enables promotions

## References
- `src/app/(admin)/admin/trade-shows/page.tsx` — Read-only admin page (Gap 1)
- `src/app/(dashboard)/dashboard/trade-shows/[showId]/page.tsx:167` — 404 link (Gap 2)
- `src/app/(dashboard)/dashboard/trade-shows/page.tsx` — No join CTAs (Gap 3)
- `src/components/dashboard/trade-shows/TradeShowCard.tsx:22-24` — Hardcoded discount (Gap 4)
- `src/app/(dashboard)/dashboard/trade-shows/groups/[groupId]/page.tsx:175` — Generic goal link (Gap 5)
- `src/components/dashboard/groups/GroupBuyPaymentModal.tsx` — Reference pattern for Gap 5
- `src/app/api/admin/services/upsert/route.ts` — Reference pattern for Gap 1
- `src/components/admin/services/ServicePackageForm.tsx` — Reference pattern for Gap 1
- `src/components/admin/services/ServicePackagesTable.tsx` — Reference pattern for Gap 1
