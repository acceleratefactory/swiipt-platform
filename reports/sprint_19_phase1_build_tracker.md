# Sprint 19 Gap Fix — Phase 1: Interest Model Completeness

**Goal:** Fix the behavioural interest engine so the feed personalizes correctly. The interest model is missing 2 of 11 signal types (expand, dwell) and new users get empty feeds.

**Spec References:** §D.4 (signal capture), §D.6 (feed scoring), §A.0 #4 (never dead end), §E.1.1 (feed_ads types)

**Approval required before building. Build one task at a time.**

---

## Task 1 — Cold-Start Fallback in Feed (J.8)

**Spec:** §A.0 principle #4 — "Infinite, never a dead end. No Refresh button, no 'you've seen all.' When curated matches run low, widen the ranking and keep loading."

**Problem:** `src/app/api/opportunities/feed/route.ts` lines 68-85 — when `interestModel` is null (new user) or no opportunities match the user's segment, the feed returns empty. No fallback to trending/featured content exists.

**What to build:**
- In `feed/route.ts`, after the scored + filtered opportunities are computed, check if the result is empty or has fewer than 5 items
- If so, query for trending/featured opportunities across ALL segments (not just the user's segment)
- Sort by `apply_click_count` desc + `published_at` desc + `is_featured` desc
- Append these to the existing results (deduplicating by opportunity ID)
- This ensures new users always see content, and users in niche segments don't hit dead ends

**File:** `src/app/api/opportunities/feed/route.ts`

**Verify:** `npm run build` passes

---

## Task 2 — Fire Expand Signal on "more" Click

**Spec:** §D.4 — "On card click (expand): Add to the onClick that expands the card ('more' click): `fetch('/api/opportunities/signal', { opportunityId, signalType: 'expand' })`"

**Problem:** `OpportunityCard.tsx` fires `view`, `save`, `apply`, `like`, `share` signals but NOT `expand`. The interest model misses engagement intent — the system doesn't know when a user taps "more" to read the full description.

**What to build:**
- In `OpportunityCard.tsx`, find the onClick handler for the "more" button and the card body click that sets `descExpanded(true)`
- Add a fire-and-forget fetch call: `fetch("/api/opportunities/signal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId: opportunity.id, signalType: "expand" }) })`
- This fires alongside the existing expand logic — do not block UI

**File:** `src/components/dashboard/opportunities/OpportunityCard.tsx`

**Verify:** `npm run build` passes

---

## Task 3 — Dwell Tracking (dwell_long / dwell_short)

**Spec:** §D.4 — "Add dwell time tracking to OpportunityCard.tsx (expanded state): Track time between expand → collapse. dwell_long fires when card expanded for 30+ seconds. dwell_short fires when card collapsed in under 5 seconds."

**Problem:** The interest model has `dwell_long` (weight 2.5) and `dwell_short` (weight -0.5) signal types defined in the DB and signal route, but no code ever fires them. The system can't distinguish between a user who read an opportunity carefully vs one who expanded and immediately collapsed.

**What to build:**
- In `OpportunityCard.tsx`:
  - Add a `useRef` for `dwellStartedAt` (number | null)
  - Add a `useEffect` that tracks: when `descExpanded` becomes true, set `dwellStartedAt.current = Date.now()`
  - When `descExpanded` becomes false and `dwellStartedAt.current` is not null, calculate `dwellMs = Date.now() - dwellStartedAt.current`
  - If `dwellMs >= 30000`, fire signal `dwell_long`
  - If `dwellMs < 5000`, fire signal `dwell_short`
  - Otherwise do nothing (normal reading time)
  - Reset `dwellStartedAt.current = null` after firing
  - All signal calls are fire-and-forget (do not block UI)

**File:** `src/components/dashboard/opportunities/OpportunityCard.tsx`

**Verify:** `npm run build` passes

---

## Task 4 — Add feed_ads Types to database.ts (J.1)

**Spec:** §E.1.1 defines the `feed_ads` table schema. §J.1 identifies that TypeScript types are missing.

**Problem:** `src/types/database.ts` has no `feed_ads` type definition. All API routes that touch ads (`feed/route.ts`, `admin/feed-ads/route.ts`, `admin/feed-ads/[id]/toggle/route.ts`) use `(supabase as any)` to bypass type checking.

**What to build:**
- In `src/types/database.ts`, add `feed_ads` Row, Insert, and Update types matching the SQL schema in `sprint_19_feed_ads.sql`:
  - `id: string` (UUID)
  - `ad_type: string` ('internal' | 'external')
  - `advertiser_name: string | null`
  - `headline: string`
  - `body: string | null`
  - `cover_image_url: string | null`
  - `video_url: string | null`
  - `media_type: string` (default 'image')
  - `cta_label: string` (default 'Learn more')
  - `cta_url: string`
  - `target_segments: string[] | null`
  - `target_countries: string[] | null`
  - `frequency: number` (default 7)
  - `priority: number` (default 1)
  - `status: string` ('draft' | 'active' | 'paused' | 'ended')
  - `starts_at: string | null` (TIMESTAMPTZ)
  - `ends_at: string | null` (TIMESTAMPTZ)
  - `budget_impressions: number | null`
  - `impression_count: number` (default 0)
  - `click_count: number` (default 0)
  - `created_at: string` (TIMESTAMPTZ)
- Add `feed_ads` to the `Database["public"]["Tables"]` union

**File:** `src/types/database.ts`

**Verify:** `npm run build` passes, existing ad routes no longer need `(supabase as any)`

---

## Status

| Task | Status | Approved | Built | Verified |
|------|--------|----------|-------|----------|
| 1 — Cold-start fallback | ⏳ Pending | ⬜ | ⬜ | ⬜ |
| 2 — Expand signal | ⏳ Pending | ⬜ | ⬜ | ⬜ |
| 3 — Dwell tracking | ⏳ Pending | ⬜ | ⬜ | ⬜ |
| 4 — feed_ads types | ⏳ Pending | ⬜ | ⬜ | ⬜ |
