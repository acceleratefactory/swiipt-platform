# Feed Personalization, Unending Loop & UX Fixes — Discussion + Fix Plan

**Date:** 2026-07-15
**Context:** User raised 3 feed concerns. This document explains the current behaviour (grounded in code), confirms understanding, and lays out the one-by-one fix approach. **No code written yet** — this is the agreed plan to implement later.

---

## Confirmed understanding of the 3 concerns

1. **Interest/intent-driven, cross-domain, unending feed (football excluded).**
   The feed must show everything related to the user's learned interest & intent, *across* opportunity types (e.g. a job seeker should also see scholarships, fellowships, etc.), excluding football. The system learns interest/intent over time and re-ranks the feed accordingly — interest-matched content first, everything else after. The feed must be effectively **unending** (loop/recycle), not a finite list that ends.

2. **No visible scrollbar (Instagram-style).**
   The feed page should scroll like Instagram — functional scrolling via wheel/trackpad/touch/keyboard — but the visible scrollbar should be hidden.

3. **"Top match" card must not repeat every 5 cards.**
   Today a single "Top match for your profile" card is injected after every 5th card and is the *same* highest-relevance item each time. Requirement: show distinct top matches (multiple different ones if they genuinely match the interest); if there aren't enough distinct matches, show each **once** and then stop — never repeat the same card every 5 positions.

---

## Key finding from code review (important)

There are **two** feed code paths and they disagree:

- **`src/app/(dashboard)/dashboard/opportunities/page.tsx`** (the real feed page) — a server component that queries `opportunities` directly and filters by `segment_slug === segmentSlug` (lines 45, 73), with a trending fallback when <5 matches (lines 75-81). It does **NOT** use the interest model at all. It only reads a pre-stored `relevanceScore` from `user_opportunity_feed` / `ai_relevance_score`.
- **`src/app/api/opportunities/feed/route.ts`** — contains the full personalization engine (segment_scores, country_scores, type_scores, desired_roles, `scholarship_interest`, suppression, freshness, source diversity) but this route is only used by **Search/Explore** (`SearchExplore.tsx`), **not** by the main feed page.

**Conclusion:** the "learning" engine already exists but is **not wired into the main feed**. Fixing concern #1 means connecting the page to that engine (or extracting the scoring into a shared lib used by both).

---

## Fix 1 — Interest/intent-driven, cross-domain, football-excluded feed

### Current behaviour
`page.tsx:73` builds the candidate pool as **only the user's own segment**:
```text
segmentOpps = allOpportunities.filter(o => o.segment_slug === segmentSlug)
```
So a `job_seeker` only sees `job_seeker`-segment rows — scholarships (a different `type` and possibly different segment) never surface. The interest model in `feed/route.ts` is bypassed entirely.

### How I will fix it (one by one)
1. **Broaden the candidate pool to ALL active opportunities** instead of just the user's segment. Replace the `segment_slug` filter with a fetch of the full active pool (already available via `oppRes` at `page.tsx:45`, which selects `*`). This is what enables cross-domain surfacing.
2. **Apply a global football exclusion** for every user: drop rows where `segment_slug === 'footballer'` (and optionally `type === 'sports_trial'`). The `footballer` segment is defined in `src/app/api/admin/opportunities/process-queue/route.ts:304`. This is a hard filter, not a soft score penalty, so football never appears in anyone's feed.
3. **Rank the whole pool with the interest/intent model.** Reuse the scoring already built in `feed/route.ts` (segment_scores, country_scores, type_scores, desired_roles match, `scholarship_interest`, freshness, featured, applied-suppression, source-diversity penalty). Extract this into a shared function (e.g. `scoreOpportunities(opps, { profile, interestModel })`) and call it from the page. This makes a job seeker who engages with scholarships see scholarships rise to the top over time.
4. **Serve interest-first, others after.** The pool is already sorted by `relevanceScore` desc, so the top of the feed = best interest/intent matches, the tail = weaker/other matches. No extra work beyond step 3.
5. **Add related-type affinity (optional but recommended).** To make cross-domain surfacing immediate (not only after the model has learned), add a baseline boost for types adjacent to the user's segment (e.g. `job_seeker` → also `scholarship`, `fellowship`, `internship`, `training`; `student` → `scholarship`, `internship`, `job`). This gives cross-interest content a head start before signals accumulate.
6. **Learning over time (already supported, just connect it).** Signals are captured by `POST /api/opportunities/signal` and the model is recomputed by `POST /api/opportunities/compute-interest` (cron every 6h). Because the page re-reads the live interest model on every load, the feed automatically re-ranks as the model updates. Optionally trigger `compute-interest` after a user accrues enough new signals (e.g. every N signals) so the shift is near-real-time rather than waiting for the 6h cron.

**Result:** a job-seeking user sees jobs first, then scholarships/fellowships they're interested in, no football, and the mix shifts as they interact.

---

## Fix 2 — Unending / looping feed

### Current behaviour
`OpportunityFeed.tsx:140` sets `isDone = displayed.length >= visible.length`. Pagination stops at `visible.slice(0, page*PAGE_SIZE)` (lines 85, 97). Once the finite `scoredSegment` list is exhausted, the feed ends (the component shows an end spacer at lines 186-188 and stops observing the sentinel).

### How I will fix it (one by one)
1. **Detect end-of-list, then loop instead of stopping.** When `displayed.length >= visible.length`, instead of setting `isDone`, advance `page` and start appending from the **beginning of the pool again** (optionally re-shuffled with a time-based seed so each loop feels fresh).
2. **Avoid React key collisions.** Today cards use `key={opp.id}` (`OpportunityFeed.tsx:154`). On re-loop the same `opp.id` repeats → duplicate-key warning + state bugs. Fix: make the key composite, e.g. `` `${opp.id}-${loopIndex}` ``, where `loopIndex` increments each full cycle.
3. **Add a soft "You're all caught up — more for you" divider** at the start of each new loop so the repeat reads as intentional discovery (Instagram-style "Suggested for you"), rather than an obvious duplicate.
4. **Keep performance sane.** Cap how many times we re-loop (e.g. 3-5 cycles) before showing a final "That's everything for now" state, OR keep looping indefinitely but cap rendered DOM by recycling. Given current volumes (~2.8k active rows) a few loops is fine; indefinite loop is acceptable because keys are unique and React unmounts off-screen cards via the existing IntersectionObserver pattern.

**Result:** the feed never hard-ends; it recycles interest-ranked content in cycles, each card keyed uniquely.

---

## Fix 3 — "Top match" shows distinct cards, never repeats every 5

### Current behaviour
`OpportunityFeed.tsx:74-82` computes `topMatch.current = bestOpp` — the **single** highest-relevance item. Lines 147-151 inject it after every 5th card (`(index + 1) % 5 === 0`) provided the current card isn't already that top item. So the **same** card is repeated at positions 5, 10, 15, … — exactly what the user noticed.

### How I will fix it (one by one)
1. **Build a deduplicated list of top matches, not a single one.** Instead of `topMatch = bestOpp`, compute `topMatches = [...visible].sort(by relevanceScore).filter(distinct).slice(0, K)` where `K` is, say, the top 5-8 distinct high-relevance items (define "high-relevance" as `relevanceScore >= threshold`, e.g. ≥ 70, so we only feature things that genuinely match).
2. **Inject a different one at each 5th slot, rotating through the list.** Maintain a counter; at slot `n` inject `topMatches[n % topMatches.length]` — but **only if we haven't already shown all of them**. Once every distinct top match has appeared once, **stop injecting** (no repeat).
3. **Never inject the card that is already on screen at that position** (already guarded at line 151) — keep that guard.
4. **Edge case (user's exact ask):** if there is only 1 distinct top match, it appears once (e.g. after the first 5 cards) and then never again — matching "if not [multiple], it should just show once and not show again."
5. **Optional polish:** label could stay "⭐ Top match for your profile" for the first, and "✨ Also for you" for subsequent distinct ones, to signal variety.

**Result:** the featured slot showcases genuinely different interest matches, each shown exactly once, with no repetitive same-card spam.

---

## Fix 4 — Hide the scrollbar (Instagram-style)

### Current behaviour
The feed page (`page.tsx`) renders inside the dashboard layout with no custom scroll container — it scrolls via the **window** (or the dashboard content scroll area). The native vertical scrollbar is therefore visible. The user wants it hidden like Instagram while scrolling stays fully functional.

### How I will fix it (one by one)
1. **Add a `.no-scrollbar` utility class** (CSS only, no logic change). The standard cross-browser recipe:
   - `scrollbar-width: none;` (Firefox)
   - `-ms-overflow-style: none;` (legacy Edge/IE)
   - `&::-webkit-scrollbar { display: none; }` (Chrome/Safari/Edge)
2. **Apply it to the scroll container** that owns the feed scroll — the dashboard content/scroll area (and/or the feed wrapper at `page.tsx:91-92`). Because `scrollbar-width: none` only hides the visual bar (scrolling via wheel, trackpad, touch, keyboard, and programmatic `scrollTo` all still work), this is safe and non-breaking.
3. **Scope it, don't nuke the global scrollbar blindly.** Apply only to the feed/dashboard scroll region so admin pages and modals keep normal scroll behaviour where needed. (If the whole dashboard already scrolls on `window`, we apply the class to `html`/`body` **only within the opportunities route** via a scoped wrapper, or to the dashboard shell's scroll container.)

**Note:** This is purely visual. No data, ranking, or behaviour changes.

---

## Summary of files touched (planned, no code yet)

| File | Change |
|------|--------|
| `src/app/(dashboard)/dashboard/opportunities/page.tsx` | Broaden pool to all active opps; add global football exclusion; call shared interest scoring instead of segment-only filter; pass full ranked pool to `OpportunityFeed` |
| `src/app/api/opportunities/feed/route.ts` | (Reuse) extract scoring into shared lib; ensure football exclusion + cross-type affinity present |
| `src/lib/opportunity-feed-score.ts` (new, proposed) | Shared `scoreOpportunities()` used by both page and API so logic isn't duplicated |
| `src/components/dashboard/opportunities/OpportunityFeed.tsx` | Loop pagination (unique composite keys, "caught up" divider); replace single `topMatch` with deduplicated `topMatches` rotated once each; stop after all shown |
| Dashboard scroll container / `globals.css` (or scoped CSS) | Add `.no-scrollbar` utility; apply to feed scroll region |
| `src/app/api/opportunities/compute-interest/route.ts` | (Optional) trigger near-real-time recompute after N new signals so the feed shifts as the user learns |

## Open questions for the user (not blockers)
- **Loop cap:** indefinite loop, or cap at N cycles then "That's everything"? (Recommend: a few cycles, then a calm end-state — or truly infinite; user said "maybe you have to loop it", so lean infinite with unique keys.)
- **Cross-type affinity rules:** hard-code segment→related-type boosts, or rely purely on learned signals? (Recommend: light hard-coded baseline + learned signals on top.)
- **Football scope:** exclude only the `footballer` segment, or also `sports_trial` type and any sports-related types? (Recommend: `footballer` segment + `sports_trial` type as a global hard filter.)

---

## Addendum — Full cross-segment visibility (review of `opportunity_ingestion_investigation.md`)

**Reviewed:** `reports/opportunity_ingestion_investigation.md` — §9 Opportunity Types, §10 Career Segments, and the Extended Types list.

### The 9 opportunity types (data-driven, `opportunity_types` table)
`job` 💼, `scholarship` 🎓, `fellowship` 🏆, `visa_programme` 🛂, `sports_trial` ⚽, `remote_work` 💻, `internship` 📋, `training` 📚, `grant` 💰.

### The 10 career segments (`career_segments` table)
`job_seeker`, `student`, `healthcare`, `tech_professional`, `footballer`, `sports_professional`, `freelancer`, `entrepreneur`, `trade_worker`, `caregiver`.

### Extended types (supported in `FallbackTile` UI, NOT yet in DB schema)
`competition`, `conference`, `exchange`, `trade_show`, `trial`, `healthcare`, `residency`, `citizenship`, `funding`, `contest`, `accelerator`, `award`. When these are added to `opportunity_types`, they join the universal pool automatically — no segment gating.

### Design decision from user (overrides the earlier "related-type affinity" idea)
**Do NOT limit the feed by segment.** The candidate pool is effectively the entire active catalogue, minus football. Specifically:
- **Global hard exclusion (everyone):** `type = 'sports_trial'` and `segment_slug = 'footballer'`. **`sports_professional` is NOT excluded** — they see everything else, same as every other segment (user confirmed).
- **Everyone sees everything else**, across all 10 segments and all 9 (soon 21) types.

### What each segment should emphasise at first (soft nudge only — NOT a filter)
- **`job_seeker`** → naturally interested in: healthcare jobs, entrepreneurship, trade, caregiver, grants, training, internships, remote work, visa programmes, fellowships, **and scholarships**. i.e. the whole catalogue except football.
- **`student`** → scholarship, remote work, internship, training, grant, **and everything else** except football.
- **All other segments** (`healthcare`, `tech_professional`, `freelancer`, `entrepreneur`, `trade_worker`, `caregiver`, `sports_professional`) → same rule: see everything except football, with a mild boost for their own segment's types so the feed opens relevant before broadening.

So the initial ordering = (global football exclusion) + (small segment-self boost) + (freshness/featured), and then the **learned interest model takes over and re-ranks** as the user engages. No hard segment filter means a job seeker can absolutely surface a scholarship or a fellowship, and vice versa.

### Learning from "what they spend most time on" — capturing every signal
The user wants the system to learn interest/intent from **all** available behavioural data, especially time spent. Current capture points:
- `POST /api/opportunities/signal` — view (2s in viewport), expand, save, apply, dismiss, share, like, dwell (`dwell_long` ≥30s, `dwell_short` <5s).
- `GET /api/opportunities/apply` — external click-through (strong intent).
- `POST /api/opportunities/track` — apply/view clicks.
- Detail modal dwell timer (`OpportunityDetailModal`).
- Profile intent fields — `desired_roles`, `desired_countries`, `scholarship_interest` (`career_profiles`), already used in `feed/route.ts`.

**Additions to make "time spent" the dominant signal:**
1. **Weight dwell/time-on-card heavily in `compute-interest`.** A card a user lingers on (especially `dwell_long`, and ideally finer-grained view duration) is the strongest interest signal — stronger than a save/like. Ensure `type_scores` / `segment_scores` accrue mostly from dwell, not just binary actions.
2. **Capture search & filter usage as intent.** `SearchExplore.tsx` already queries `/api/opportunities/feed` with `query/type/country` — log those as signals so searching "scholarship" or filtering by a country teaches the model.
3. **Capture scroll-depth / impression-with-engagement** so passive interest (reading without clicking) is still learned.
4. **Near-real-time recompute.** Trigger `compute-interest` after a user accrues enough new signals (e.g. every N signals in a session) so the feed visibly shifts within the same session, not only on the 6h cron.
5. **"Why you're seeing this"** (`getReasonText()`) already explains ranking — keep it; it builds trust as the feed personalises.

### Updated Fix 1 (replaces the earlier version)
- Pool = all active opportunities **except** `sports_trial` / `footballer`.
- Soft segment-self boost only (no filter).
- Rank by shared interest model; dwell-weighted learning re-ranks over time.
- Interest matches first, others after (sort by relevanceScore desc).

### Updated open questions
- Should the segment-self boost be on, off, or user-tunable? (Recommend: on, small, so the feed opens relevant then broadens.)
- Recompute cadence: per-session vs 6h cron? (Recommend: both — cron + a session-based trigger after N signals.)
