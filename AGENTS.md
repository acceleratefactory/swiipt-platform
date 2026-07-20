# Swiipt — Complete Platform Knowledge Base

## 🚀 START HERE — For New Agent Onboarding

**You are joining after Session 52 (5 new dedicated scrapers: Grants.gov, Intl Scholarships, EventsEye, Erasmus+, Coursera).** Do not start from scratch. Read this first. See Session 52 (§16) for the most recent work. The single most important operational rule is in §11 note: **after ANY code change, you MUST redeploy on Vercel with "Clear build cache" checked** — a plain redeploy serves stale code.

### Current State
- **Session 51 — German Translation Backfill (✅ COMPLETED 2026-07-20)** — All 3,092 German (`deu`) opportunities translated to English via local PowerShell script calling OpenCode API (`mimo-v2.5-free` model). Feed-visible opportunities jumped from ~1,294 to ~4,412. **128 non-German non-English items remain** (spa/fra/por etc.) — see pending items. The Vercel API route could never do this (no AI provider key in Vercel env, 60s function timeout). Solution: standalone `swiipt/run_translate_local.ps1` bypasses Vercel entirely — calls OpenCode API directly, updates Supabase via REST PATCH. Batch size 6, ~6s per call, ~97.5% success rate.
- **Session 42 — Vercel Stale Code Investigation (✅ RESOLVED 2026-07-11)** — Root cause was a **Vercel serving issue**: a PRE-`a215198` build was live despite all commits being pushed to `origin/main` (proven via `git log origin/main..HEAD` empty + live response with no `version` field). Fix = **Promote the `ac9aee0` deployment to Production** in Vercel dashboard (plain "Redeploy" had failed because a rollback/alias pinned production to an old commit). After promotion, live response shows `"version":3` and **`ai_generated=true` reached 258** opportunities. Added `safeSegment()` FK validation (`a611aae`) to prevent AI returning invalid `segment_slug` (e.g. "tech" vs "tech_professional") which would silently fail the INSERT. Pipeline is now publishing correctly.
- **Session 43 — Feed Cover Image Rework (✅ Rework done, ⚠️ browser render deferred → FIXED in P0#7)** — Replaced uniform gradient+emoji tiles. New system: real OG/page-hero photos where available, clean **logo-on-colour or typographic** `FallbackTile` where none (NO emoji/globe). Commits `c15f947` + `633b427`. Live distribution ≈ **58.8% real / 41.2% clean fallback / 0 SVG** across 2881 active rows. **The browser-render bug (real covers not painting, suspected ad-blocker matching the proxy `url=` param) was FIXED in P0#7** by storing covers in our own Supabase Storage bucket (`opportunity-covers`) and serving them first-party from an opaque path `/opportunity-covers/...`; external URLs that cannot be stored are still proxied through `/api/opportunities/cover` so the upstream domain stays hidden. See P0#7 below. (Replaces Session 38's 4-layer OG→Logo→AI→Branded cover system — the AI and Branded-SVG layers were removed.)
- **Session 38 — Evidence-First Architecture (✅ Built, ⚠️ Pipeline Not Yet Working)** — Evidence table, API adapters (Himalayas, Arbeitnow, RemoteOK, Adzuna, USAJOBS), cover image system, watcher system (page change detection), source health monitoring, 12 extended opportunity types, 60+ real opportunities seeded, pg_cron pipeline automation, 20+ SQL migrations, verification scripts. See `reports/opportunity_ingestion_investigation.md` for full spec.
- **Session 48 — P0 Pipeline Quality Hardening (BUILT, PENDING DEPLOY + SQL RUN)** — Fixes ingestion quality/relevance from `findings/ingestion-pipeline-quality-and-feed-engagement-audit.md` §1.1–§1.8. Covers: P0#1 source-registry integrity (14 adapter-less `trusted` sources flagged `pending_scraper`), P0#2 expiry/freshness (`expire_stale_opportunities()`), P0#3 quality gate (`evaluateQuality()` on every item, real `needs_review` queue), P0#4 cross-source URL dedupe (`normalize_url()` + `src/lib/url-normalize.ts`), P0#5 language integrity (`is_non_english` flag), P0#6 two-DB integrity diagnostic. Full detail in the §12 "P0 Pipeline Quality Hardening" block. Most of these SQL files are still UNRUN — the live pipeline currently relies on mechanical fallbacks only.
- **Session 49 — P0#7 Cover Storage + P0#1a Generic Scrapers + AI Provider Chain (BUILT, PENDING DEPLOY + SQL RUN)**
  - **P0#7 Cover Storage (fixes the Session 43 browser-render bug):** Covers are now stored in a Supabase Storage bucket `opportunity-covers` (public) and served first-party via an opaque `/opportunity-covers/...` path so ad-blockers/hotlink protection can't suppress them. `OpportunityCard.tsx` detects stored covers (`cover_image_url.includes("/opportunity-covers/")`) and serves them directly; only non-stored external URLs go through `/api/opportunities/cover`. Backfill cursor advances via `cover_stored_at`. SQL: `swiipt/p0_7_cover_storage_bucket.sql` + `swiipt/p0_7_cover_cursor_column.sql` (UNRUN).
  - **P0#1a Generic HTML Scrapers (unblocks the 14 silent `trusted` sources):** New `src/lib/html-extractor.ts` (dependency-free: JSON-LD → OG/Twitter meta → `<h1>`/`<p>`, deadline regex, sub-link discovery) + `src/lib/scraper-adapters.ts` wrapper. Ingest route (`ingest/route.ts`) now dispatches `source_type='scraper'` (added to the active-source filter). SQL `swiipt/p0_1a_register_scrapers.sql` activates DAAD, Chevening, Commonwealth, NHS, Make It In Germany, Canada IRCC, UAE Golden Visa, LinkedIn Nigeria, TransferMarkt, plus 5 RSS + 3 JSON-API sources. **Note:** the first version of that SQL missed `is_active=true` (ingest silently skipped all scrapers) — fixed in `86ec4c4`. `version:4` added to ingest response to confirm the scraper build is live.
  - **AI Provider chain hardening (commits `0e4f49d`->`589e9be`):** `enrich()` in `src/lib/ai-service.ts` now (a) supports a per-row `model` from `ai_providers`, (b) retries the WHOLE provider chain with exponential backoff (8s->16s->32s->64s, up to 4x) when EVERY provider is only rate-limited (HTTP 429) so backfills drain without manual re-runs, and (c) adapters (opencode/openrouter) try several free models in order on 429/empty. **OmniRoute is DISABLED** (`p0_ai_disable_omniroute.sql`) — it's a self-hosted gateway with no URL, only wasted a fallback slot. Provider model rows updated to current free models (`gemini-2.0-flash-001`, `gpt-oss-20b:free`, `deepseek-v4-flash-free`) via `p0_register_free_providers.sql`.
- **Session 52 — 5 New Dedicated Scrapers (BUILT, PENDING DEPLOY + SQL RUN)** — Built 5 dedicated scrapers for underserved opportunity types: grant → `grants-gov.ts` (grants.gov/search-grants), scholarship → `scholarships-com.ts` (internationalscholarships.com), trade_show → `10times.ts` (scrapes eventseye.com as primary source, 496+ trade shows/month in clean HTML table), exchange → `erasmus-plus.ts` (erasmus-plus.ec.europa.eu/opportunities), training → `coursera.ts` (coursera.org courses with __NEXT_DATA__ JSON extraction). EventsEye added as separate source `add_eventseye_source.sql`. All 6 files in `src/lib/scrapers/`. Adapter updated in `scraper-adapters.ts` (19 total entries now). TypeScript: zero errors. **Note:** 10times.com returns 403; existing RSS sources still handle 10times data. Ingest after SQL+deploy shows 91 ingested / 571 found / 127 sources processed — circuit breaker fix (Session 50) now delivering results, but API-key sources (Adzuna, Jooble, USAJOBS, Findwork) remain silent without keys.
- **Sprint 19 — Opportunity Feed & Intelligence System** — fully built, SQL migrations pending (10 files need running in Supabase Editor in order). See `reports/sprint_19_complete_walkthrough.md` for full walkthrough. Master spec: `docs/Sprint_19_Unified.md`. Implementation plan: `docs/Sprint_19_Implementation_Plan.md`.
- **Sprint 17 — Global Profile, Certificates, Agent Escrow, Diaspora Gifts** — built and deployed. 5 new DB tables, PDF generation, Stripe integration.
- **Sprint 16, System 2 (Trade Show Group Savings)** — built and deployed. Paused before booking phase.
- **Sprint 16, System 3 (Opportunity Score)** — built and deployed.
- **Sprint 18 — Feed, Growth Mechanics, Affiliates** — built and deployed.
- Groups can: form → members join with invite link → members save into locked goals → admin confirms deposits → group reaches `funded`
- **Paused before booking phase** — the `funded → booking → confirmed → completed` pipeline is NOT built. See `reports/sprint_16_trade_show_booking_flow_analysis.md` for the plan.
- **Exhaustive Career Segments & Opportunity Types** — Full lists documented: 50+ career segments, 60+ opportunity types. 12 extended types added to DB in Session 38. See `reports/opportunity_ingestion_investigation.md` §10-11 for full lists and §13 for rollout recommendations.

### What NOT to Touch
- Existing goal savings + visa redemption flows (Sprint 5)
- Service marketplace + order flow (Sprint 7)
- Holiday booking flow (Sprint 14-15 fixes)
- Group Buy (Sprint 16 System 1) — separate from Trade Shows
- Admin service client pattern (must use service role key for admin pages)
- CSS design system (Cabinet Grotesk + Plus Jakarta Sans only, no Inter)

### Key Constraints
- **3 Supabase clients:** browser (`client.ts`), server (`server.ts`), service (`service.ts`) — using wrong one causes blank pages
- **Surgical precision only** — do not refactor working code. Add new code alongside existing.
- **Payment recovery pattern** (`user_confirmed_at`, resume/cancel, Realtime + 5s polling) is the standard for all payment flows
- **Locked goals** (`is_locked = TRUE`) for trade show savings — no early exit. Money counts toward AUM.

### Where to Start
1. Read this entire AGENTS.md (platform overview, architecture, all sprints, all sessions)
2. **CRITICAL: Vercel stale code — every deploy needs "Clear build cache".** Read Session 42 + 43 below. A plain redeploy serves a PREVIOUS build (we've proven this repeatedly via `version:` fields in API responses and the live client bundle). After ANY code change, force a manual Vercel redeploy with **"Clear build cache"** checked, OR the old build stays live. This applies to P0#7 covers, P0#1a scrapers, and the AI provider chain too.
3. Read `reports/sprint_19_complete_walkthrough.md` for the full Sprint 19 walkthrough
4. **To activate Sprint 19:** Run all 10 SQL migrations in Supabase SQL Editor in order (listed in the walkthrough §15)
5. Read `reports/sprint_16_trade_show_booking_flow_analysis.md` for the booking phase plan
6. Read the relevant sprint SQL files in `swiipt/` for schema context
7. Ask the user: "Has the booking phase been validated with real users yet? Or should I build it?"

### Current Pending Items
| Priority | Item | Status |
|----------|------|--------|
| 1 | **Vercel stale code — process-queue publish failure** | ✅ RESOLVED 2026-07-11 — Promoted `ac9aee0` to Production; `version:3` live; `ai_generated=true` = 258. Pipeline publishing correctly. `safeSegment()` FK hardening in `a611aae`. |
| 2 | Sprint 19 — Run 10 SQL migrations in Supabase Editor | ⏳ 10 SQL files ready, execute in order (see §15 of walkthrough) |
| 3 | Evidence-First — Run 20+ SQL migrations in Supabase Editor | ⏳ Phase2-10, watcher, health, partner subs, seed data (see Session 38) |
| 4 | Trade Show Group Booking Phase (paused) | ⏳ `reports/sprint_16_trade_show_booking_flow_analysis.md` |
| 5 | Group Buy ⏱→✅ transition in modal | ⏳ `reports/group-buy-pending-confirmed-transition-plan.md` |
| 6 | Dashboard Home Restructure — feed as primary screen | ⏳ `docs/sprint_17_18_priority_order.md` (routing change in middleware.ts) |
| 7 | Affiliate Management — env vars, pg_cron SQL, e2e testing | ⏳ Sessions 30-32 ops remain |
| 8 | Provenance Tracking — Wire provenance JSONB to opportunities display | ✅ `ProvenanceViewer.tsx` built, needs admin page integration |
| 9 | Expand Career Segments — Add when sources exist (see §13 of ingestion report) | ⏳ Add 5-10 more segments when 3+ sources exist per segment |
| 10 | Expand Opportunity Types — Add when sources exist (see §13 of ingestion report) | ⏳ Add 5-10 more types when 3+ sources exist per type |
| 11 | **MUST BUILD: Admin Custom Cover Image Upload** | ⏳ Schema ready (`custom` in CHECK), UI not built. See §12 below for full spec. |
| 12 | ~~Feed real covers not rendering in browser~~ | ✅ RESOLVED in P0#7 — covers now stored in Supabase Storage bucket `opportunity-covers` and served first-party (opaque path); ad-blockers can't suppress them. |
| 13 | **P0 Pipeline Quality Hardening — run SQL + deploy** | ⏳ Session 48: `p0_1_source_registry_integrity.sql` … `p0_5_language_integrity.sql` UNRUN; then Redeploy + Clear build cache + `expire_stale_opportunities()` + verify two-DB (`p0_6`). |
| 14 | **P0#7 Cover Storage — run SQL + deploy** | ⏳ `p0_7_cover_storage_bucket.sql` + `p0_7_cover_cursor_column.sql` UNRUN; then Redeploy + Clear build cache + run `run_backfill_covers.ps1`. |
| 15 | **Session 52 scrapers — deploy code + run SQL** | ⏳ Code built (5 new scrapers + EventsEye) but NOT deployed — needs Redeploy + Clear build cache. SQL: `register_5_new_scraper_sources.sql` + `add_eventseye_source.sql` (READY). Then run ingest + process-queue. |
| 16 | **AI Provider chain — run SQL + set key** | ⏳ `p0_register_free_providers.sql` + `p0_ai_disable_omniroute.sql` UNRUN; all providers need API keys in Vercel env (`GEMINI_API_KEY` etc.) — without a key `enrich()` has no provider and `translate` backfill fails (pipeline still publishes via mechanical fallbacks). |
| 17 | **Translate non-English rows** | ✅ 3,092 German (`deu`) items translated (Session 51) via `swiipt/run_translate_local.ps1`. ⏳ **128 non-German items remain** (spa/fra/por etc.) — run `swiipt/run_translate_local.ps1` again to finish (it auto-picks up whatever `language` is NOT eng). |
| 18 | **Deprecate 10times RSS in favor of scraper** | ⏳ Once `10times.ts` scraper proves stable (scraping eventseye.com), consider deactivating the 10times RSS sources to avoid duplicate trade show data. |
| 19 | **User to find more sources for underserved types** | ⏳ conference, competition, exchange need more sources. User offered to manually find and report. |

## 1. PLATFORM OVERVIEW

**Swiipt** is a fintech-led global mobility platform ("Save. Move. Arrive."). Users save toward travel/relocation goals, earn milestone rewards, book flights/holidays, and execute migration services — all in one dashboard.

- **Domain:** swiipt.com | **Live URL:** https://swiipt-platform.vercel.app
- **Stack:** Next.js 14.2 (App Router) + TypeScript (strict) + Tailwind CSS 3.4 + Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment:** Vercel (auto-deploy on push to `main`)
- **Email:** Resend (transactional) + Brevo (marketing)
- **Flights API:** Duffel (v2, server-side only)
- **Multi-currency:** NGN, USD, AED, QAR, GBP, CAD, EUR (7 currencies from Sprint 0)
- **Brand:** Midnight `#06112B` / Teal `#00C896` | Fonts: Cabinet Grotesk (headings) + Plus Jakarta Sans (body) — **Inter is banned**

## 2. BUSINESS MODEL

- **Float income** on locked savings capital (goals generate treasury yield)
- **High-margin service marketplace** (visa, residency, citizenship, company setup, holiday packages)
- **Referral commissions** (10% default; Alumni can withdraw as cash)
- **Penalty income** (3% early exit fee on locked goals)
- **No KYC/BVN/NIN at signup** — email + phone only
- **Prizes NEVER payout as cash** — always locked credit (enforced at DB level: `prize_is_locked = TRUE`)

## 3. TARGET MARKETS

Nigeria (primary), UAE, Qatar, UK, Canada, Portugal, Georgia, St Kitts, Caribbean. Supports 7 currencies natively. Diaspora services identified as gap.

## 4. GIT WORKFLOW

- **Remote:** `https://github.com/acceleratefactory/swiipt-platform.git`
- **Branches:** `main` (production, protected) ← `staging` ← `develop` ← feature branches
- **Current branch:** `main`
- **Latest commit:** `a0c2a39` — Feed: always render cover tile (FallbackTile for no-image rows) + backfill correction (Session 47)
- **Deployment:** Push to `main` auto-deploys to Vercel. No CI/CD scripts — manual git push. No `.github/workflows/`.
- **Author:** `acceleratefactory` / `tech@acceleratefactory.com`

## 5. ARCHITECTURE & KEY PATTERNS

### Client Pattern (Critical)
There are **3 Supabase clients** — using the wrong one causes blank pages:

| Client | File | Key | Bypasses RLS? | Used For |
|--------|------|-----|---------------|----------|
| Browser | `src/lib/supabase/client.ts` | anon key | No | Client components (useEffect, event handlers) |
| Server | `src/lib/supabase/server.ts` | anon key | No | Server components (cookie-based auth) |
| **Service** | `src/lib/supabase/service.ts` | **service role key** | **Yes** | **Admin server components + API routes** |

**Root cause of blank admin pages:** Admin server components used the anon cookie-based client instead of `createServiceClient()`. The service client has stub cookies (`getAll` returns `[]`) because it doesn't need cookie auth.

### Auth System (Two-Layered)
1. **Edge Middleware** (`src/middleware.ts` → `src/lib/supabase/middleware.ts`): Session refresh, dashboard protection (redirect unauthed → `/login?return=`), admin protection (checks `user_roles.role = 'admin'`), suspended check (redirects → `/login?error=account_suspended`)
2. **Server-side Layout** (`src/app/(admin)/layout.tsx`): Re-verifies auth, checks `admin` or `case_manager` role via service client, fetches pending badge counts

**Admin roles:** `admin` (full access) and `case_manager` (limited to assigned orders/documents). Middleware only allows `admin`, layout allows both.

### Auth Trigger
On every new `auth.users` insert, `handle_new_user()` trigger:
- Creates `users` profile row (with auto-generated 8-char referral code)
- Creates `wallets` row (zero balances)
- Creates welcome `milestone_rewards` row (Free Qatar Tourist Visa, expires in 12 months)
- Links referral if `raw_user_meta_data->>'referral_code'` provided
- Grants +20 mobility score for account creation

### Database
- **~48 tables** total (Sprint 0 foundation: 24 tables; expanded through sprints — see §6 for full list)
- RLS enabled on all tables — service client bypasses for admin operations
- Realtime enabled on: `deposits`, `notifications`, `document_requests`, `savings_goals`, `leaderboard_entries`, `holiday_bookings`, `group_buy_members`, `service_orders`
- All pricing: multi-currency columns (NGN, USD, AED, QAR, GBP, CAD, EUR)
- Every significant action logged to `activity_log` (user_id, event_type, event_data JSONB)
- All admin destructive actions recorded in `admin_audit_log` (immutable, with previous/new values)

### Key SQL Functions
- `confirm_deposit(deposit_id, admin_id)` — Confirms deposit, updates goal balance, fires milestone checks (25/50/75/100%), awards +50 score for first deposit, sends notif
- `check_and_unlock_milestones(goal_id, user_id, pct)` — Checks percentage thresholds, inserts `milestone_rewards`, awards score, sends notifs
- `check_and_award_streak(user_id)` — Evaluates deposit frequency, awards 30-day/90-day streak prizes
- `increment_mobility_score(user_id, points)` — Atomic score increment
- `increment_goal_balance(goal_id, amount)` — Atomic balance increment with return
- `update_leaderboard_entry(user_id)` — Upserts referral count, recalculates ranks
- `calculate_readiness_score(user_id)` — Computes 0–100 readiness score (identity/financial/docs/services/engagement)
- `calculate_financial_profile(user_id)` — Computes financial profile metrics (Sprint 17)
- `next_certificate_number(cert_prefix)` — Generates sequential certificate numbers with prefix (Sprint 17)
- `check_and_update_trade_show_group_funding(group_id)` — Checks if all trade show group members are funded, updates group status (Sprint 16)
- `get_total_aum()` — Sums `total_locked_ngn` across all wallets
- `get_signups_by_day()` — Daily signup counts for analytics

### Payment Recovery Pattern
The **goal deposit flow** (`GoalDepositFlow.tsx`) has a proven payment recovery mechanism. The **group buy direct payment flow** now mirrors this pattern (implemented in Sessions 5–8):

1. **State discrimination** — `group_buy_members` tracks `user_confirmed_at` column: `NULL` = user hasn't confirmed sending yet (resumable), `NOT NULL` = user confirmed, entered admin-waiting state
2. **Detection on mount** — `useEffect` calls `GET /api/group-buy/payment-status?groupBuyId=X` to check for existing pending payments
3. **Resume UI** — "Continue Payment →" button on group detail page for `pending_payment` with `user_confirmed_at IS NULL`; modal shows saved bank details + "I Have Transferred" or "Cancel"
4. **Cancel mechanism** — `POST /api/group-buy/cancel-payment` reverts membership to `committed`, cancels linked order/booking
5. **Cron cleanup** — `POST /api/group-buy/expire` resets abandoned (unconfirmed) and expired (72h post-confirm) pending_payment memberships

**Admin confirmation sync (Critical):** When admin confirms a group buy order from the Orders page (`POST /api/admin/orders/update-status`) or Holidays page (`POST /api/admin/holidays/update-booking-status`), the routes now check if the order/booking is linked to a `group_buy_members` row and sync the membership status accordingly. Without this, admin confirmations from the Orders/Holidays page would leave members stuck at `pending_payment`.

**Service payment flow has the same gap** — `service_orders` has no `reference` column, no resume mechanism, no `user_confirmed_at`. See `reports/findings/service-vs-group-buy-payment-flows.md`.

### Design Conventions
- CSS variables only — no hardcoded hex values in components
- Mobile-first (test at 375px)
- Every async operation: loading / success / error states — no blank screens
- Payment references server-side only: format `SWP-[6CHAR_USERID]--[6CHAR_TIMESTAMP]`
- Wallet card shows greeting: "Good morning/afternoon/evening, {name} 👋"
- Data logging mandatory for every significant action

## 6. ALL 52 DATABASE TABLES

### Core (Sprint 0)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_roles` | Admin/case_manager/suspended roles | user_id, role, UNIQUE(user_id) |
| `users` | User profiles | id→auth.users, email, full_name, phone, country_of_residence, preferred_currency, mobility_score, alumni_status, referral_code, referred_by, readiness_score |
| `wallets` | Multi-currency balances | user_id UNIQUE, balance_{ngn,usd,aed,qar,gbp,cad,eur}, total_locked_ngn, total_credits_ngn |
| `currencies` | Admin-managed exchange rates | code UNIQUE, ngn_exchange_rate, is_active, last_updated_by |
| `savings_goals` | Savings goals with milestones | user_id, goal_category (9 types), target_amount, current_balance, is_locked, lock_period_months, milestone_{25,50,75,100}_unlocked, linked_service_package_id, status (active/completed/withdrawn/cancelled) |
| `deposits` | Deposit records | goal_id, amount, currency, ngn_equivalent, payment_reference UNIQUE, status (pending/confirmed/rejected/expired), user_confirmed_at, admin_confirmed_at, expires_at |
| `withdrawals` | Withdrawal requests | goal_id, gross_amount, penalty_rate, penalty_amount, net_amount, is_early_exit, status (requested/processing/completed/rejected), bank details |
| `service_packages` | Service catalog | category (10 types), name, destination, price_{currency}, is_active, is_featured, processing_weeks_min/max, badge_text, sort_order |
| `service_orders` | Service orders | user_id, goal_id, package_id, payment_method (goal_redemption/direct_payment), original_price, final_price, status (9 states), case_manager_id/notes |
| `document_requests` | Per-order document requests | order_id, user_id, document_name, is_required, status (pending/uploaded/verified/rejected), file_url, verified_by |
| `milestone_rewards` | Reward records | goal_id (NULLABLE for welcome gift), user_id, milestone_type (welcome_gift/25_percent/50_percent/75_percent/100_percent), reward_type, reward_label, redeemed, expires_at |

### Admin & Operations (Sprint 0)
| Table | Purpose |
|-------|---------|
| `platform_settings` | 38+ global config key-value pairs |
| `promotions` | Admin-created campaigns (6 types incl. Spin & Win) |
| `promotion_awards` | Who won what per promotion |
| `goal_gifts` | Friend-to-friend transfers (giver, recipient, amount) |
| `admin_audit_log` | Immutable record of every admin action |
| `corporate_clients` | B2B client management |
| `float_ledger` | T-bill allocation tracking |
| `activity_log` | User activity stream (JSONB event_data) |
| `notifications` | In-app notifications (user_id NULL = broadcast) |
| `email_subscribers` | Landing page email capture |

### Content & Landing (Sprint 13-14)
| Table | Purpose |
|-------|---------|
| `resource_guides` | Markdown guides with categories, view_count |
| `calculator_configs` | Cost calculator data (destination × service_type × family_size) |
| `eligibility_pathways` | Eligibility checker rules with condition columns |
| `niche_pages` | 20+ SEO landing pages with JSONB fields |
| `goal_templates` | 21 savings goal templates |

### Holiday Packages (Sprint 0 + addons)
| Table | Purpose |
|-------|---------|
| `holiday_packages` | Holiday offerings with multi-currency pricing |
| `holiday_bookings` | Booking records with documents + status |
| `holiday_booking_documents` | Per-booking document tracking |

### Community (Sprint 10)
| Table | Purpose |
|-------|---------|
| `community_groups` | Destination/service-based groups |
| `community_memberships` | User membership records |
| `community_threads` | Discussion threads |
| `community_replies` | Thread replies (text-only MVP) |

### Group Buy & Trade Shows (Sprint 16)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `group_buys` | Group purchase commitments (2-10 people, 72h expiry) | creator_id, item_type, holiday_package_id/service_package_id, target_size, current_size, group_price_ngn, group_discount_pct, invite_code, payment_deadline |
| `group_buy_members` | Member status tracking | user_confirmed_at, payment_reference, order_id, booking_id, paid_at |
| `trade_shows` | Admin-managed trade show catalog | name, location_city/country, event_date_start/end, category, base_cost_solo_ngn, base_cost_group_ngn, min/max_group_size, is_active |
| `trade_show_groups` | Group savings toward trade shows | organizer_id, trade_show_id, title, target_group_size, current_member_count, cost_per_person_ngn, status (forming→saving→funded→booking→confirmed→completed→cancelled), invite_code (TS- prefix), savings_deadline |
| `trade_show_group_members` | Member savings tracking | group_id, user_id, role (organizer/member), savings_goal_id, status (saving/funded/withdrawn/removed), amount_saved_ngn, funded_at |
| `readiness_score_log` | Score change audit trail | user_id, event_type, points_awarded, running_total |

### Rewards & Referrals (Sprint 0 + Sprint 9)
| Table | Purpose |
|-------|---------|
| `referrals` | Referrer-referred links with commission |
| `referral_earnings` | Commission tracking |
| `leaderboard_prizes` | Monthly prize configuration |
| `leaderboard_entries` | Rankings per period |
| `user_preferences` | Notification preferences |

### Global Profile, Certificates & Escrow (Sprint 17)
| Table | Purpose |
|-------|---------|
| `financial_profiles` | User financial profile metrics (savings velocity, consistency, readiness) |
| `platform_certificates` | Proof of Funds and Trust Certificates (SWP-PC-, SWP-TC- prefix, expiry) |
| `platform_partners` | Agent/partner registration, commission rates, status |
| `escrow_deals` | Milestone-based escrow between users and agents |
| `diaspora_gifts` | Diaspora gift funding sessions (Stripe Checkout, FX + 1.5% fee) |

### Opportunity Feed & Intelligence (Sprint 18–19)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `career_segments` | Career segment catalog (job_seeker, student, healthcare, etc.) | slug, name, icon, color, text_color |
| `opportunities` | Opportunity listings (jobs, scholarships, visas, etc.) | title, organisation, type, location_country, application_url, is_featured, cover_image_url, published_at |
| `user_opportunity_feed` | Personalised feed per user | user_id, opportunity_id, relevance_score, is_saved, is_applied, is_dismissed |
| `opportunity_types` | Data-driven opportunity type catalog (9 seed types) | slug, label, emoji, bg_color, text_color |
| `opportunity_signals` | User behavioural signals on opportunities | signal_type (view/expand/save/apply/dismiss/share/like/dwell_short/dwell_long/comment) |
| `user_interest_model` | Per-user 7-layer interest scores | scores JSONB (segment, country, type, recency, engagement, source, diversity) |
| `opportunity_comments` | Phase B comments on opportunities (table only, no UI yet) | user_id, opportunity_id, body, is_flagged |
| `opportunity_queue` | Raw ingested items awaiting processing | raw_data JSONB, status (pending/processing/published/rejected/error), needs_review |
| `opportunity_sources` | Source registry with trust tiers | trust_tier (trusted/standard/review_all), format (rss/json/api/manual) |
| `feed_ads` | Injected sponsored ads | headline, body, cta_label, cta_url, status (active/paused/ended/draft), impressions, clicks |
| `achievement_cards` | Shareable achievement cards (WhatsApp/Instagram) | card_type, is_shared_whatsapp, is_shared_instagram, is_dismissed |

### Evidence-First Pipeline (Session 38)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `evidence` | Raw evidence storage before enrichment | evidence_type (rss/api/web/email/partner/pdf/government/social_facebook/social_linkedin/messaging/manual/url/watcher), raw_data JSONB, source_url, source_name, content_hash, enrichment_status, opportunity_id |
| `watchers` | Track URLs for page change detection | url, check_interval_hours, last_checked_at, last_content_hash, is_active |
| `source_health_log` | Source pull health tracking | source_id, pulled_at, items_found, items_new, duration_ms, error_message, success |
| `partner_submissions` | External partner opportunity submissions | partner_name, partner_email, raw_data JSONB, status, enriched_opportunity_id |

## 7. FEATURE MAP — EVERY SPRINT

### Sprint 0 — Foundation
- Next.js 14 scaffold, Supabase clients (3), DB schema (24 tables), CSS design system
- RLS policies on all tables, Realtime on deposits/notifications/document_requests/savings_goals/leaderboard_entries
- Utility functions: currency formatting, payment reference generation, referral code generation
- Placeholder routes, GitHub + Vercel CI/CD setup
- Environment variables, Cabinet Grotesk + Plus Jakarta Sans fonts

### Sprint 1 — Landing Page Structure
- Navbar (transparent→solid scroll, mobile hamburger overlay)
- Hero (midnight bg, floating activity cards with staggered animations, QAR currency in card 3)
- Flight search widget (3 tabs: Flights/Holidays/Services, sub-tabs: Round Trip/One Way/Multi-City)
- StatsBar with AnimatedCounter (IntersectionObserver-triggered count-up)
- ProductCards (6 cards in 3×2 grid: Save, Flights, Holidays, Visa & Residency, 2nd Citizenship, Corporate)
- DestinationCards (9 gradient cards, midnight section bg)
- HolidayPackages (horizontal scroll with 5 packages, gradient placeholders)

### Sprint 2 — Landing Page Completion
- CostCalculator (interactive lookup table, static data → admin-controlled in Sprint 13)
- EligibilityChecker (5-question flow, static logic → DB-driven in Sprint 13)
- SuccessStories (3 testimonial cards, initials avatar)
- EmailCapture (Resend welcome email, Supabase insert, duplicate email handled gracefully)
- CorporateSection (2-column layout with B2B features)
- SEOContent (3-column link grid)
- Footer (4-column midnight bg)
- `/api/subscribe` endpoint

### Sprint 3 — Auth & Onboarding
- `handle_new_user()` DB trigger (auto-creates profile + wallet + welcome reward on signup)
- Signup: split-screen, magic link OR password, Google OAuth, referral code field
- Login: split-screen, same auth modes
- Auth callback at `/auth/callback`
- Onboarding (4 steps): Destination select → Goal setup → Referral reveal → Welcome + reward reveal
- `increment_mobility_score` RPC function
- Minimal dashboard shell for post-onboarding redirect

### Sprint 4 — Dashboard Shell & Home
- DashboardLayout (server component, fetches profile/wallet/unread count → passes to client shell)
- Sidebar (260px, midnight, 10 nav items, wallet balance card, user profile bottom)
- TopBar (sticky, page title, Add Funds, notification bell with badge, avatar)
- BottomTabs (mobile only, 5 tabs)
- NotificationDrawer (slide-over, Realtime subscription, mark-all-read)
- Home page: WelcomeBanner, WalletCard (available/locked/credits breakdown, hide/show toggle), GoalsGrid (Realtime updates, progress bars, milestone nudge), ActiveOrders, ExploreSection
- 11 placeholder pages for other dashboard tabs

### Sprint 5 — My Goals & Payment Flow
- GoalsList page with filters (all/active/completed/withdrawn)
- CreateGoalForm (reuses onboarding goal setup)
- GoalDetailView (progress ring, milestone track, action buttons)
- GoalDepositFlow (3-step: amount → bank instructions → pending confirmation)
- GoalWithdrawFlow (early exit penalty calc, bank details, confirmation checkbox)
- TransactionHistory (unified deposit + gift list)
- API: `POST /api/goals/deposit/initiate`, `POST /api/goals/withdraw/request`
- SQL: `confirm_deposit()`, `check_and_unlock_milestones()`

### Sprint 6 — Admin Dashboard
- AdminLayout (service client auth, role check, pending badge counts)
- AdminSidebar (16 nav items with pending badges, distinct gray visual style)
- Admin overview (MetricsCards, RecentActivityFeed)
- PendingDepositsTable (FIFO, Realtime, ageing highlights)
- ConfirmDepositModal (warning, notes, calls `confirm_deposit` RPC)
- WithdrawalRequestsTable + processing flow
- APIs: `POST /api/admin/deposits/confirm`, `POST /api/admin/deposits/reject`, `POST /api/admin/withdrawals/process`
- SQL: `recalculate_wallet_locked`, `get_total_aum`
- 13 placeholder admin pages

### Sprint 7 — Services Marketplace
- ServiceMarketplace (9 category filters, card grid with color coding)
- ServiceDetail (full description, pricing, processing timeline, existing order detection)
- OrderFlow (4-step modal: payment method → goal select/direct → confirmation)
- DirectPaymentFlow (bank details with unique `SWP-ORD-` reference)
- ActiveOrderTracker (9-step status timeline with case manager notes)
- API: `POST /api/services/order`, `POST /api/services/direct-payment/confirm`
- SQL: `deduct_goal_balance()`, 16 seed service packages
- Service order pipeline: initiated → payment_pending → payment_confirmed → documents_requested → documents_received → in_progress → awaiting_approval → approved → completed

### Sprint 8 — Documents & Admin Orders
- DocumentRequestsList (per-order groups with Realtime status)
- DocumentUploadCard (drag-and-drop, Supabase Storage `documents` bucket, signed URLs)
- DocumentReadinessScore (progress bar + mobility score display)
- DocumentVault (permanent storage, passport upload = +30 score, expiry tracking)
- Admin OrdersTable + OrderDetailView + DocumentRequestForm
- DocumentVerificationQueue + ReviewCard
- APIs: document upload/vault, admin order status update, document request/verify
- All docs verified → auto-advances order to `documents_received`
- Order completion: +200 score + alumni status
- Storage path: `{user_id}/{order_id}/{doc_name}-{timestamp}.{ext}`
- Admin all-read: `{user_id}/vault/{...}` — RLS policies enforce isolation

### Sprint 9 — Rewards, Gamification & Referrals
- MobilityScoreCard (6 tiers: Explorer→Legend at 0/200/400/600/800/1000)
- WinWithSwiipt (dark hero, top prize showcase)
- RewardsList (unredeemed/redeemed/expired cards)
- PrizeConvertModal (→ locked credit, min 6-month lock)
- StreakTracker (30-day = visa photos ₦5k, 90-day = visa processing ₦25k)
- Leaderboard (monthly + all-time, Realtime, top 10 + user rank)
- ReferralHub (WhatsApp share, copy link), ReferralStats (4 metrics), EarningsHistory
- GiftToFriendFlow (requires 25% milestone, max 30%/30day, find by email)
- API: `/api/rewards/convert`, `/api/referrals/track`, `/api/gifts/send`
- SQL: `update_leaderboard_entry()`, `check_and_award_streak()`, `increment_goal_balance()`

### Sprint 10 — Holidays, Community, Admin Broadcast & Promotions
- HolidayGrid + HolidayDetailView + HolidayBookingFlow (holiday booking creates activity_log entry)
- CommunityHub (gated by Mobility Score ≥200, 7 seed groups, join/open)
- GroupDiscussion + ThreadView (thread creation + text replies)
- Admin: Promotions CRUD (6 types, Spin & Win config with probability validation)
- Admin: Broadcast notifications (segment targeting, in-app/email/schedule)
- Admin: PlatformSettings (38 settings, 7 groups, inline edit with audit log)
- API: `/api/holidays/book`, community thread/reply, promotions CRUD, broadcast, settings
- New tables: `community_groups`, `threads`, `replies`, `memberships`

### Sprint 11 — Wallet, Settings & Admin Tools
- WalletSummary (6 stats: total deposited/withdrawn/penalties/available/locked/credits)
- TransactionTable (type + status filters, CSV export for visa applications)
- ProfileForm (name, phone, country, referral code display)
- CurrencyPreference (pill selector, saves to `users.preferred_currency`)
- NotificationPreferences (toggle matrix, localStorage MVP → `user_preferences` table later)
- Admin: CurrencyRatesTable (inline editable, NGN locked at 1, audit logged)
- Admin: UserListTable (search, pagination planned), UserProfileAdmin (7 tabs)
- Admin: AdminOverridePanel (8 actions, mandatory notes, audit logged)
- Admin: CorporateClients (CRUD, status badges), FloatLedger (AUM chart, auto-calc)
- API: profile/currency/notification update, admin currency/corporate/float/override/suspend
- Middleware: suspended user check added

### Sprint 12 — Flights, Destinations, Analytics & Polish
- Duffel API integration (server-side only, v2 header, 5 functions: search/offers/offer/order/places)
- FlightSearchForm (typeahead with 300ms debounce, trip type toggle, sort controls)
- FlightResultCard (legs, stops, duration, airline, price, refundable badge)
- FlightBookingConfirm (creates Duffel order, logs activity, sends notif)
- Destination detail pages (7 destinations, hardcoded content, static metadata)
- Admin Analytics (7 metric cards, 5 charts: user growth, AUM, goal distribution, conversion funnel, revenue)
- Admin ServicePackageEditor (full CRUD, multi-currency, auto-calc from NGN)
- Admin HolidayPackageEditor (same pattern)
- Global 404 page, ErrorBoundary, loading.tsx for all sections
- Mobile audit + performance targets (LCP <2.5s, CLS <0.1)
- End-to-end test journeys defined (Saver, Direct Payer, Holiday Booker)

### Sprint 13 — Landing Page Fixes & Admin Content
- **Critical fix:** Nav links → section anchors, footer links → real routes
- New tables: `resource_guides`, `calculator_configs`, `eligibility_pathways`
- CostCalculator → server component fetches from DB (replaces hardcoded data)
- EligibilityChecker → DB-driven pathways with condition matching (all ANDed)
- ResourceGuides system (CRUD, markdown rendering via react-markdown + remark-gfm)
- Admin Content Hub (3 cards: Guides, Calculator, Eligibility)
- Static pages: About, Privacy, Terms of Service
- Seed data: 18 calculator configs, 9 eligibility pathways, 3 resource guides

### Sprint 14 — Niche Landing Pages & Goal Templates
- New tables: `niche_pages` (JSONB fields for process/requirements/FAQs/related), `goal_templates`
- **20 niche landing pages** at `/move/*`, `/work/*`, `/study/*`, `/holiday/*`, `/business/*`, `/citizenship/*`, `/remote/*`, `/corporate/*`, `/student/*`, `/parents/*`
- Universal NicheLandingPage renderer (8 sub-components, conditional rendering)
- JSON-LD structured data on all niche pages
- Dynamic sitemap.xml (published pages + guides + static), robots.txt
- GoalTemplateLibrary (21 templates, pre-fills form on template select)
- Admin NichePageEditor (11 sections, dynamic add/remove for lists)
- Admin GoalTemplateEditor
- Admin SEOManager (inline meta editing, color-coded length validation)

### Sprint 15 — Bug Fixes & SEO/GEO Submission
- **Bug 1:** Welcome reward not showing — fixed `.single()` → `.order().limit(1)`, animated WelcomeBanner
- **Bug 2:** Settings not saving — added try/catch, validation, proper loading state
- **Bug 3:** No sign out — added to TopBar dropdown, Sidebar, AdminShell (3 surfaces)
- **Bug 4:** Pending payments never expire — `expires_at` column, cron job at 06:00 UTC, x-internal-secret protection
- **Bug 5:** Cannot edit/delete goals — edit modal (name + target), soft delete (status=cancelled, balance=0 required)
- **Admin service client fixes:** 12+ commits fixing blank admin pages by switching from anon to service-role client across all admin routes (settings, currencies, promotions, notifications, corporate, float, calculator, eligibility, goal templates, services, holidays)
- **Visa redemption fixes:** resume flow for abandoned payments, admin visibility, cron cleanup, error logging, dynamic hotel booking fee
- **Brevo email marketing integration:** optional, gated by env var
- **Admin subscribers page:** email subscriber management with service client
- SEO/GEO: Google Search Console, Bing Webmaster, IndexNow, Google Business Profile
- Backlink strategy (8 platforms), LLM training data (Quora, Reddit, tech pubs)
- Root layout metadata: `metadataBase`, title template `"%s — Swiipt"`, keywords, OG/Twitter

### Sprint 16 — Group Buy, Trade Shows & Readiness Score
- **System 1 — Group Buy:** 2 new tables (`group_buys`, `group_buy_members`), 72h expiry, admin-configurable discount tiers (2-10 people: 10-30%), invite code, cron for expiry
- Group buy creates holiday_bookings or service_orders on pay
- Public invite page `/join/[code]` with price comparison + countdown
- Dashboard groups list + detail with member management
- **Priority 2 (Sprint 16) — Group Buy Payment Flow (Sessions 5–8):** Full payment modal with goal redemption, direct bank transfer, travel credit auto-apply, Realtime subscription, payment recovery (resume/cancel), admin confirmation sync from all admin paths
- **System 2 — Trade Show Groups (✅ Built):** 3 tables, 6 seed trade shows, create-group + join-group APIs, catalog/discovery page, show detail page, group detail page with funding progress + member bars, admin management page, public invite page at `/join/trade-show/[code]` with `TS-` prefixed codes, sidebar nav items in both dashboard + admin. Invite code namespace resolved via prefix. `lock_type` → `is_locked=TRUE`. `goal_category='custom'`.
- **System 3 — Opportunity Score (✅ Built):** `calculate_readiness_score()` RPC created, `users.readiness_score/readiness_destination/readiness_last_calculated` columns added, `readiness_score_log` table created, `POST /api/readiness/recalculate` route created. `confirm_deposit` RPC updated to fire recalculation. `OpportunityScore.tsx` widget shows "You qualify for X opportunities today" with SVG circular progress, 5 score tiers, next-action CTA, and refresh button. Dashboard home renders it after WelcomeBanner. Score auto-recalculates via fire-and-forget triggers on: goal creation, vault document upload, service order, profile update. Admin user detail page shows readiness score in Overview tab. Temporary `opportunityCount = Math.round((score / 100) * 35)` — see Sprint 18 Upgrade Path below when real opportunities table is built.
- **Priority 4 — Goal-based holiday payment (Sessions 14-15):** Phase 1: linked_holiday_package_id on savings_goals, duplicate goal prevention, existing goal detection on detail page. Phase 2: goal_id on holiday_bookings, goal_redemption support in booking API, payment method selection UI, admin cancel reverts goal balance.
- **NicheCTA → Goal Template Connection (Session 26 post-deploy):** `NicheCTA.tsx` and `NicheHero.tsx` updated to pass `recommended_goal_template_id` through signup return URL. NicheHero converted to `"use client"` with auth check — logged-in users go directly to `/dashboard/goals/new?template={id}`, logged-out users go via `/signup?return=...`. Closes Loop 1 end-to-end.

### Sprint 17 — Global Profile, Certificates, Agent Escrow & Diaspora Gifts
- **Phase 0 — Database:** 5 new tables (`financial_profiles`, `platform_certificates`, `platform_partners`, `escrow_deals`, `diaspora_gifts`) + RLS + 6 users columns + 7 indexes + `certificate_seq` + `calculate_financial_profile()` function
- **Phase 1 — Global Profile:** `/dashboard/profile/page.tsx` (server, parallel fetches, auto-recalc if stale >24h), `GlobalProfile.tsx` (3-column client: Identity/Financial/Global), `POST /api/financial-profile/recalculate`, fire-and-forget trigger in deposit confirm route, "My Profile" at sidebar index 2
- **Phase 2 — Proof of Funds:** `POST /api/certificates/proof-of-funds` (validates goal ≥₦50K, fee deposit, 30-day expiry), public verify page at `/verify/[code]`, `ProofOfFundsDocument.tsx` (PDF via `@react-pdf/renderer`), `GET /api/certificates/[code]/download`, certificate list + request page at `/dashboard/profile/certificates`
- **Phase 3 — Trust Certificate:** `POST /api/certificates/trust` (reads `financial_profiles` + `users`, `SWP-TC-` prefix, 90-day expiry), `TrustCertificateDocument.tsx` (PDF with tenure/trust score/compliance badges)
- **Phase 4 — Agent Escrow Portal:** Public partner registration (`/partners/apply`), agent directory with filter bar (`/dashboard/find-agent`), `PartnerCard.tsx`, agent detail + escrow deal form with milestone builder, `POST /api/escrow/create-deal`, two-step `POST /api/escrow/complete-milestone` + `POST /api/escrow/admin-confirm-milestone`, admin partners list + detail with commission rate editor and audit log, sidebar entries (Partners at index 23, "Find an Agent" at index 13)
- **Phase 5 — Diaspora Gift:** Public `/fund/[goalId]` page with amount/currency/giver form, `POST /api/diaspora-gifts/create-session` (Stripe Checkout with FX rate + 1.5% fee), `POST /api/diaspora-gifts/webhook` (signature verify, goal balance increment, milestone checks, notification), "Share gift link" button in `GoalDetailView.tsx`
- **Key constraint compliance:** Table name `diaspora_gifts` (not `goal_gifts`), routes at `/api/diaspora-gifts/*` (not `/api/gifts/*`), public page at `/fund/[goalId]` (not `/gift/[goalId]`)
- **Build verified:** `npm run build` — zero TS errors across all phases

### Sprint 18 — Feed, Growth Mechanics & Affiliate Management (Built)
- **Phase C — The Feed:** `user_opportunity_feed` table, 18 seeded opportunities, personalised feed generation API (`POST /api/opportunities/feed`), track/save endpoints, `OpportunityCard.tsx` with infinite scroll/animated cards/featured placements, feed page at `/dashboard/opportunities` with filters + segment selector + detail page + onboarding flow. Achievement card triggers on order completion. `OpportunityScore.tsx` upgraded from formula to real DB count.
- **Phase D — Growth Mechanics:** `achievement_cards` table with 11 card types (`goal_created`, milestones, `goal_funded`, `service_ordered/completed`, `visa_approved`, `certificate_issued`, `joined_swiipt`, `readiness_score`). Auto-generated on key events. WhatsApp/Instagram share with Canvas 1080×1080 PNG download. `SuccessStoryPrompt` + `SuccessStoryForm` for users to share stories after service completion. `CampaignBanner` for viral campaigns. `/admin/campaigns` list + create pages with admin APIs.
- **Affiliate Management (Phase A–E):** Complete admin panel: `admin_affiliates_phase_a.sql` (RLS + `affiliate_withdrawals` table), 12 API routes (list, detail drill-down, update-tier, adjust-earnings, reset-code, withdrawals queue + process, modules CRUD + reorder), 7 admin pages + 5 components (list with stats/search/filters, detail with 5 tabs + 4 action modals, withdrawals queue with approve/reject, modules list + create/edit forms + preview, sub-affiliate tree). Phase D: pending withdrawal flow (inserts into `affiliate_withdrawals` instead of inline deduction, admin broadcast notification). Phase E: audit logs for all module CRUD. Gap fixes: view-as-user admin preview, reset-code retry loop, all-time leaderboard + reset trigger. Only ops remain: env vars, pg_cron SQL, test.
- **Commits:** Sprint 18 Phases C+D: Session 28-29 commits; Affiliates Phase A: `1260f22`, Phase B: `4b1ef84`, Phase C: `be6b190`, Phase D: `b48966e`, Phase E: `d075642`, gaps: `1b30bc6`, bottom tabs fix: `e9902b2`

### Sprint 19 — Opportunity Feed, Pipeline, AI Service, Behavioural Engine & Ads
- **Master spec:** `docs/Sprint_19_Unified.md` (3,320 lines — merged base spec + behavioral learning + pipeline + Feed/Media/Interactivity/Ads)
- **Implementation plan:** `docs/Sprint_19_Implementation_Plan.md` (817 lines — 9 source docs, phased build, 27-item verification audit, 14-step SQL execution order)
- **Complete walkthrough:** `reports/sprint_19_complete_walkthrough.md`
- **Amendments:** `docs/sprint_19_amendment_1_fix3_to_search.md` (Search/Explore replaces filter strip), `docs/sprint_19_amendment_2_zero_ai.md` (OmniRoute zero-cost AI), `docs/sprint_19_amendment_3_15_enhancements_assessment.md` (7 adopted, 8 deferred)
- **Gap resolution:** `docs/sprint_19_gap_resolution.md` (4 pre-build gaps: DB types, OG fetching, admin ads panel, comments Phase B)
- **Architecture discussion:** `docs/Sprint 19 resolution` (Opportunity Engine mental model, three-tier trust, provenance record)
- **Pre-build (data-driven types + AI Service):** SQL migration, DB types, `src/lib/opportunity-types.ts`, shared API routes, `src/lib/ai-service.ts` (OmniRoute), provider adapters (Gemini, DeepSeek), task prompts
- **§A Feed UI:** Single-column flex (max-width 680px, centered), kill list removed, search icon, detail modal with dwell tracking, media zone (cover image or FallbackTile), engagement rail (Like/Save/Share), ServiceCTA, "…more" inline expand, dismiss button, "Why you're seeing this" text
- **§B Tracked Redirect:** `GET /api/opportunities/apply` — increments count, upserts feed, redirects; broken link detection via HEAD checks
- **§C Pipeline:** `opportunity_queue` + `opportunity_sources` tables; tiered AI processing (trusted=auto, standard=format-only, review_all=admin); RSS ingest route; paste-URL AI prefill form; admin queue review page with Publish/Reject; link checker
- **§D Behavioural Engine:** 11 signal types (view/expand/save/apply/dismiss/share/like/dwell), capture endpoint, 7-layer interest model computation, batch cron-ready endpoint, feed scoring with source diversity penalty
- **§E Feed Ads:** `feed_ads` table, admin CRUD (list, create, toggle), injection every 7 positions with "Sponsored" label
- **§F Seed Data:** 62 opportunity sources across all segments, 20 extra seed opportunities
- **SQL migrations to run:** 10 files in order (see walkthrough §15 for full list)
- **Git push:** `0d681d1` on `main`

### Auth & User
- `POST /api/settings/update-profile` — Update name, phone, country
- `POST /api/settings/update-currency` — Set preferred currency
- `POST /api/settings/update-notifications` — Upsert notification prefs
- `GET /api/settings/notification-preferences` — Fetch notification prefs

### Goals & Payments
- `POST /api/goals/deposit/initiate` — Create deposit, return bank details
- `POST /api/goals/withdraw/request` — Create withdrawal request with penalty calc

### Services
- `POST /api/services/order` — Create service order (goal redemption or direct payment)
- `POST /api/services/direct-payment/confirm` — User confirms bank transfer sent

### Flights
- `GET /api/flights/search` — Duffel flight search (server-side)
- `GET /api/flights/places` — Airport typeahead
- `POST /api/flights/book` — Create Duffel booking order

### Holidays
- `POST /api/holidays/book` — Create holiday booking (supports goal_redemption + direct_payment)
- `POST /api/holidays/confirm-payment` — Confirm holiday payment (sets payment_submitted)

### Group Buy & Trade Shows
- `POST /api/group-buy/create` — Create group with discount
- `POST /api/group-buy/join` — Join via invite code
- `POST /api/group-buy/leave` — Withdraw from group
- `POST /api/group-buy/pay` — Initiate payment for filled group
- `POST /api/group-buy/expire` — Cron: expire stale groups
- `POST /api/group-buy/confirm-payment` — User confirms bank transfer sent (sets user_confirmed_at)
- `GET /api/group-buy/payment-status` — Check for existing pending payment (resumable)
- `POST /api/group-buy/cancel-payment` — Cancel pending payment and revert to `committed`
- `POST /api/trade-shows/create-group` — Creates trade show group + savings goal + membership for organizer
- `POST /api/trade-shows/join-group` — Joins via invite code, creates savings goal + membership
- `POST /api/readiness/recalculate` — Recalculate and return readiness score

### Rewards & Referrals
- `POST /api/rewards/convert` — Convert reward to locked credit
- `POST /api/rewards/redeem-visa` — Redeem Qatar visa reward
- `POST /api/rewards/upload-documents` — Upload visa support docs
- `POST /api/rewards/confirm-payment` — Confirm visa payment
- `POST /api/referrals/track` — Track referral click
- `POST /api/gifts/send` — Send gift to friend

### Documents
- `POST /api/documents/upload` — Upload to document request
- `POST /api/documents/vault-upload` — Upload to document vault
- `POST /api/documents/use-vault-doc` — Use vault doc for request

### Community
- `POST /api/community/thread` — Create thread
- `POST /api/community/reply` — Reply to thread

### Certificates & Financial Profile
- `POST /api/certificates/proof-of-funds` — Generate Proof of Funds certificate (requires goal ≥₦50K)
- `POST /api/certificates/trust` — Generate Trust Certificate
- `GET /api/certificates/[code]/download` — Download certificate PDF
- `POST /api/financial-profile/recalculate` — Recalculate financial profile

### Diaspora Gifts (Sprint 17)
- `POST /api/diaspora-gifts/create-session` — Create Stripe Checkout session for gift
- `POST /api/diaspora-gifts/webhook` — Stripe webhook handler

### Escrow (Sprint 17)
- `POST /api/escrow/create-deal` — Create escrow deal with milestones
- `POST /api/escrow/complete-milestone` — User marks milestone complete
- `POST /api/escrow/admin-confirm-milestone` — Admin confirms milestone
- `POST /api/escrow/flag-dispute` — Flag dispute on milestone
- `POST /api/escrow/resolve-dispute` — Admin resolves dispute

### Partners (Sprint 17)
- `POST /api/partners/apply` — Public partner/agent registration

### Affiliate (Sprint 18)
- `POST /api/affiliate/init` — Initialize affiliate status for user
- `POST /api/affiliate/complete-module` — Mark university module complete
- `POST /api/affiliate/upgrade-tier` — Upgrade affiliate tier
- `POST /api/affiliate/withdraw` — Request withdrawal (inserts into affiliate_withdrawals)

### Opportunities & Feed (Sprint 18–19 + Session 38)
- `POST /api/opportunities/feed` — Generate personalised feed (supports search mode via query/type/country params)
- `POST /api/opportunities/track` — Track apply/view clicks
- `POST /api/opportunities/save` — Save opportunity to feed
- `POST /api/opportunities/like` — Toggle like on opportunity
- `GET /api/opportunities/apply` — Tracked redirect: increments count, upserts feed, redirects to external URL
- `POST /api/opportunities/signal` — Capture behavioural signals (view/expand/save/apply/dismiss/share/dwell)
- `POST /api/opportunities/track-signal` — Fire service_click signal for Service CTA
- `POST /api/opportunities/refresh` — Refresh feed
- `POST /api/opportunities/paste-url` — AI-prefill from URL (admin)
- `POST /api/opportunities/compute-interest` — Compute per-user interest model
- `POST /api/opportunities/compute-interest-batch` — Cron: batch compute (max 100 users)
- `POST /api/opportunities/submit` — Partner submission with validation + enrichment → opportunity_queue
- `GET /api/opportunity-types` — List active opportunity types
- `GET /api/career-segments` — List active career segments

### Achievements & Success Stories (Sprint 18)
- `POST /api/achievements/generate-card` — Generate achievement card (11 types)
- `GET /api/achievements/list` — List user's achievement cards
- `POST /api/achievements/mark-shared` — Mark card as shared
- `POST /api/achievements/dismiss` — Dismiss card
- `POST /api/success-stories/submit` — Submit success story

### Subscriptions & Cron
- `POST /api/subscribe` — Email capture
- `GET /api/messaging/scheduled/expire-deposits` — Cron: expire stale deposits (06:00 UTC)
- `GET /api/cron/expire-visa-redemptions` — Cron: expire visa redemptions (06:30 UTC)

### Admin APIs (~75 routes)

**Deposits:** confirm, reject
**Withdrawals:** process
**Users:** override, suspend
**Orders:** update-status, request-documents
**Documents:** verify
**Services:** upsert, toggle
**Holidays:** upsert, toggle, update-booking-status, request-documents
**Pages:** upsert, toggle, delete, bulk-seed, ai-generate
**Content (guides):** CRUD
**Calculator:** upsert, toggle
**Eligibility:** upsert, delete
**Goal Templates:** upsert, toggle
**Groups:** update-status
**Trade Shows:** upsert, toggle
**Leaderboard:** award-prize, reset
**Promotions:** create, toggle
**Campaigns:** create, toggle
**Notifications:** broadcast
**Settings:** update
**Currencies:** update-rate
**SEO:** update
**Corporate:** upsert
**Float:** entry
**Visa Redemptions:** update-status
**Certificates:** revoke
**Partners:** update-status
**AI Providers:** create, toggle, test, update ([id])
**Affiliates (12 routes):** list, detail, update-tier, adjust-earnings, reset-code, withdrawals list, withdrawals process, modules list/create, modules update/delete, modules reorder
**Achievements:** generate-card, list, mark-shared, dismiss
**Opportunities:** create, toggle, update ([id]), export
**Opportunity Queue:** list (GET), publish/reject (POST), review ([id])
**Evidence:** reprocess (POST)
**Sources:** health (GET), metrics (GET), auto-downgrade (POST)
**Pipeline:** process-queue (POST) — **now checks INSERT errors** (Session 39 fix), ingest (POST), check-links (POST)
**Watchers:** check-changes (POST)
**Feed Ads:** list (GET), create (POST), toggle (POST), individual CRUD ([id])
**Backfill Covers:** POST (batch backfill cover images for opportunities)

## 9. KEY FILES REFERENCE

| Path | Purpose |
|------|---------|
| `src/middleware.ts` | Edge middleware entry (delegates to lib/supabase/middleware.ts) |
| `src/lib/supabase/middleware.ts` | Auth session refresh + route protection logic |
| `src/lib/supabase/client.ts` | Browser client (anon key, for client components) |
| `src/lib/supabase/server.ts` | Server client (anon key, cookie-based for server components) |
| `src/lib/supabase/service.ts` | **Service client** (service role key, bypasses RLS for admin) |
| `src/types/database.ts` | Full type definitions for all ~48 tables + RPCs |
| `src/app/(admin)/layout.tsx` | Admin auth gate + sidebar (service client pattern) |
| `src/components/admin/shell/AdminSidebar.tsx` | Admin sidebar nav — **31 items, add new entries here** |
| `src/app/(admin)/admin/` | All 70+ admin page routes |
| `src/app/api/admin/` | All ~67 admin API routes |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell layout |
| `src/components/dashboard/shell/Sidebar.tsx` | Dashboard sidebar nav — **17 items, add new entries here** |
| `src/app/(public)/page.tsx` | Landing page assembly |
| `src/components/landing/` | All landing page components (Navbar, Hero, etc.) |
| `src/components/dashboard/home/OpportunityScore.tsx` | **Opportunity Score widget** — SVG circle, "X opportunities today" framing, 5 tiers, refresh button |
| `src/lib/opportunity-types.ts` | Data-driven type/segment utilities (getOpportunityTypes, buildTypeStyleMap, buildSegmentMap) |
| `src/lib/ai-service.ts` | AI Service abstraction — OmniRoute priority fallback, enrich(), isAIAvailable() |
| `src/lib/ai/prompts.ts` | Task-specific prompt builders for pipeline processing |
| `src/lib/ai/providers/index.ts` | AI provider adapter interface |
| `src/lib/ai/providers/gemini.ts` | Gemini 1.5 Flash adapter |
| `src/lib/ai/providers/deepseek.ts` | DeepSeek Chat adapter |
| `src/lib/ai/providers/qwen.ts` | Qwen Plus adapter (DashScope, OpenAI-compatible) |
| `src/lib/ai/providers/omniroute.ts` | OmniRoute provider selection logic |
| `src/lib/og-fetch.ts` | OG tag extraction + image validation + fallback |
| `src/lib/evidence-adapters.ts` | **Evidence-First** — RSS, API, manual evidence creation with content hashing |
| `src/lib/api-adapters.ts` | **Evidence-First** — Himalayas, Arbeitnow, RemoteOK, Adzuna, USAJOBS API adapters |
| `src/lib/cover-image.ts` | **Evidence-First** — 4-layer cover image system (OG → Clearbit Logo → Pollinations AI → Branded Fallback) |
| `src/lib/pdf/ProofOfFundsDocument.tsx` | PDF generation for Proof of Funds certificate |
| `src/lib/pdf/TrustCertificateDocument.tsx` | PDF generation for Trust Certificate |
| `src/lib/integrations/brevo.ts` | Brevo marketing email integration |
| `src/lib/env.ts` | Environment variable helpers |
| `src/lib/group-buy-utils.ts` | Group buy + trade show invite code generation |
| `src/components/dashboard/opportunities/OpportunityCard.tsx` | Feed card — media, signals, engagement rail, ServiceCTA, dismiss |
| `src/components/dashboard/opportunities/OpportunityFeed.tsx` | Single-column feed — infinite scroll, ad injection, dismiss filtering |
| `src/components/dashboard/opportunities/OpportunityDetailModal.tsx` | Slide-up/centered detail modal with dwell tracking |
| `src/components/dashboard/opportunities/FallbackTile.tsx` | Branded fallback tile for cards without images |
| `src/components/dashboard/opportunities/ServiceCTA.tsx` | Dynamic service routing by type + country |
| `src/components/dashboard/opportunities/SearchExplore.tsx` | Search/Explore page with filters + results |
| `src/components/dashboard/opportunities/Icons.tsx` | 5 SVG engagement icons (Heart, Bubble, CurvedArrow, Bookmark, Arrow) |
| `src/components/admin/opportunities/PasteUrlForm.tsx` | AI-prefill paste-URL form for admin |
| `src/components/admin/opportunities/OpportunitiesList.tsx` | Admin opportunities list table |
| `src/components/admin/opportunities/CreateOpportunityForm.tsx` | Admin create opportunity form |
| `src/components/admin/opportunities/EditOpportunityForm.tsx` | Admin edit opportunity form |
| `src/components/admin/opportunities/OpportunityQueueList.tsx` | Admin queue review list (Publish/Reject) |
| `src/components/admin/opportunities/ProvenanceViewer.tsx` | **Evidence-First** — Provenance viewer showing source, AI model, confidence, edit history |
| `src/app/api/admin/evidence/reprocess/route.ts` | **Evidence-First** — Reprocess evidence queue |
| `src/app/api/admin/sources/health/route.ts` | **Evidence-First** — Source health summary endpoint |
| `src/app/api/admin/sources/metrics/route.ts` | **Evidence-First** — Source metrics endpoint |
| `src/app/api/admin/sources/auto-downgrade/route.ts` | **Evidence-First** — Auto-downgrade degraded sources |
| `src/app/api/admin/opportunities/backfill-covers/route.ts` | **Evidence-First** — Batch backfill cover images |
| `src/app/api/admin/opportunities/watcher/route.ts` | **Evidence-First** — Watcher endpoint for page change detection |
| `src/app/api/admin/opportunities/export/route.ts` | **Evidence-First** — Export opportunities as JSON |
| `src/components/dashboard/home/AchievementCardSection.tsx` | Achievement cards with WhatsApp/Instagram share |
| `src/components/dashboard/home/CampaignBanner.tsx` | Viral campaign banner on dashboard home |
| `src/components/dashboard/affiliate/AffiliateHub.tsx` | Affiliate dashboard with earnings, tools, leaderboard |
| `src/components/dashboard/profile/GlobalProfile.tsx` | 3-column financial/global profile |
| `src/components/public/certificates/VerificationPage.tsx` | Public certificate verification page |
| `src/app/(dashboard)/dashboard/opportunities/page.tsx` | Feed page at `/dashboard/opportunities` |
| `src/app/(dashboard)/dashboard/opportunities/search/page.tsx` | Search/Explore page |
| `src/app/(dashboard)/dashboard/opportunities/onboarding/page.tsx` | Feed onboarding flow |
| `src/app/(dashboard)/dashboard/opportunities/[opportunityId]/page.tsx` | Opportunity detail page |
| `src/app/(dashboard)/dashboard/affiliate/**` | 6 affiliate pages (hub, tools, earnings, leaderboard, university, module) |
| `src/app/(dashboard)/dashboard/find-agent/**` | Agent directory pages |
| `src/app/(public)/fund/[goalId]/**` | Diaspora gift public page |
| `src/app/(public)/verify/[code]/**` | Certificate verification page |
| `src/app/(public)/partners/apply/**` | Partner registration page |
| `src/app/(admin)/admin/opportunities/queue/page.tsx` | Admin queue review page |
| `src/app/(admin)/admin/feed-ads/page.tsx` | Admin feed ads list page |
| `src/app/(admin)/admin/feed-ads/new/page.tsx` | Admin feed ads create page |
| `docs/sprint_16_system3_build_plan.md` | System 3 build plan — conflict analysis, 7-phase implementation, Sprint 18 upgrade path |
| `docs/sprint_17_build_plan.md` | Sprint 17 build plan — 5 features (Global Profile, Certificates, Agent Escrow, Diaspora Gifts), 5 new DB tables, phase-by-phase implementation |
| `docs/sprint_18_complete_build_plan.md` | Sprint 18 build plan — Feed, Growth Mechanics, Affiliates |
| `reports/sprint_19_complete_walkthrough.md` | **Sprint 19 complete walkthrough** — all sections §A–§F, 10 SQL files, file inventory |
| `reports/sprint_19_coverage_audit.md` | Sprint 19 coverage audit |
| `reports/sprint_19_gap_analysis_report.md` | Sprint 19 gap analysis |
| `reports/sprint_19_impl_vs_unified_gap_analysis.md` | Sprint 19 implementation vs unified spec gap analysis |
| `reports/sprint_19_remaining_gaps_report.md` | Sprint 19 remaining gaps |
| `reports/opportunity_ingestion_investigation.md` | **Opportunity ingestion pipeline** — Evidence-first architecture, 6 ingestion methods, exhaustive career segments (50+) and opportunity types (60+), cover image system, provenance tracking, implementation roadmap, rollout recommendations |
| `reports/opportunity_score_testing_walkthrough.md` | Testing walkthrough for Opportunity Score — 7 trigger points, admin display |
| `reports/sprint_16_trade_show_booking_flow_analysis.md` | Trade show booking phase plan (paused) |
| `reports/group-buy-pending-confirmed-transition-plan.md` | Plan: add ⏱→✅ transition to group buy modal |
| `reports/admin_affiliate_management_build_plan.md` | Affiliate management build plan |
| `docs/movenaija_claude_code_direction_v2.md` | Master direction document (1933 lines) |
| `reports/sprint_16_investigation_report.md` | Sprint 16 investigation with 4 priorities |
| `reports/admin_api_rls_audit.md` | Audit of 33 admin API routes (22 broken) |
| `reports/payment_recovery_implementation_plan.md` | Plan to add payment resume/cancel for group buy direct payment |
| `reports/holiday_booking_flow_investigation.md` | End-to-end investigation of broken holiday booking flow |
| `reports/holiday_booking_fix_plan.md` | 6-step fix plan for holiday booking persistence |
| `reports/holiday_booking_admin_workflow_plan.md` | Admin workflow plan for holiday bookings |
| `reports/holiday_booking_testing_walkthrough.md` | Testing walkthrough for holiday booking flow |
| `reports/priority_2_implementation_plan.md` | Group buy payment flow implementation plan (Sprint 16 Priority 2) |
| `reports/realtime-payment-confirmation-implementation-plan.md` | Implementation plan for Realtime payment confirmation across all 3 flows |
| `reports/sprint_17_testing_walkthrough.md` | Sprint 17 testing walkthrough |
| `reports/findings/group-buy-payment-status-inconsistency.md` | Root cause analysis: admin confirmation from Orders/Holidays page doesn't sync group_buy_members |
| `reports/findings/service-vs-group-buy-payment-flows.md` | Comparison: service flow has same recovery gap as group buy (unfixed) |
| `reports/findings/realtime-payment-confirmation-pattern.md` | Realtime payment confirmation pattern: goal deposit vs group buy vs service |
| `reports/findings/goal-deposit-modal-pattern-investigation.md` | Investigation: goal deposit "pending" modal pattern (no X, overlay disabled, hard reload) |
| `reports/findings/service-goal-redemption-wallet-history-gaps.md` | Wallet balance + transaction history gaps for service goal redemption |
| `reports/findings/service-credit-double-deduction.md` | Credit double-deduction root cause and fix |
| `reports/findings/modal-auto-close-investigation.md` | Modal auto-close investigation (router.refresh vs window.location.reload) |
| `docs/Sprint_19_Unified.md` | **Sprint 19 master spec** — 3,320 lines, merged base + behavioral + pipeline + Feed/Media/Interactivity/Ads |
| `docs/Sprint_19_Implementation_Plan.md` | **Sprint 19 implementation plan** — 817 lines, 9 source docs, phased build, 27-item verification audit |
| `docs/sprint_19_amendment_1_fix3_to_search.md` | Amendment 1 — Search/Explore replaces always-on filter strip |
| `docs/sprint_19_amendment_2_zero_ai.md` | Amendment 2 — Zero-cost AI via OmniRoute (supersedes Haiku) |
| `docs/sprint_19_amendment_3_15_enhancements_assessment.md` | Amendment 3 — 15 enhancements assessed (7 adopted, 8 deferred) |
| `docs/sprint_19_gap_resolution.md` | 4 pre-build gaps resolved (DB types, OG fetching, ads panel, comments) |
| `docs/pre_sprint_19_data_driven_types.md` | Pre-cleanup spec for data-driven opportunity types |
| `docs/Sprint 19 resolution` | Architecture discussion — Opportunity Engine model, three-tier trust |
| `findings/process-queue-investigation.md` | **Session 39** — Process-queue INSERT failure investigation, root cause (type FK), fix plan |
| `findings/check_opportunities_state.sql` | **Session 39** — 5 diagnostic SQL queries for pipeline state verification |

## 10. PLATFORM COMPATIBILITY REGISTRY

### Critical (Breaking) — Check every sprint before creating new tables, API routes, or pages

| # | Item | Status | Impact | Resolution |
|---|------|--------|--------|------------|
| C1 | `goal_gifts` table name | TAKEN by Sprint 5 gift-to-friend feature | Any sprint adding a "gift" table will conflict | Use `diaspora_gifts` for diaspora gift schema |
| C2 | `/api/gifts/*` route namespace | TAKEN by Sprint 5 `POST /api/gifts/send` | Any sprint adding gift API routes will conflict | Use `/api/diaspora-gifts/*` for diaspora routes |
| C3 | `/gift/[goalId]` public page path | Conflicts conceptually with Sprint 5 gift system | Confusion between gift-to-friend and diaspora gift | Use `/fund/[goalId]` for diaspora gift page |
| C4 | Server Supabase client for admin RPC calls | Platform uses `createClient()` with `as any` cast, NOT `createServiceClient()` | Service client has stub cookies (`getAll` returns `[]`) causing auth failures | Use `createClient()` + `as any` cast (use `createServiceClient()` only for admin **page** queries) |

### Warning (Pattern Mismatches) — Verify against platform code before implementing

| # | Item | Platform Pattern | Wrong Pattern to Avoid |
|---|------|-----------------|----------------------|
| W1 | Admin API routes — Supabase client | `createClient()` from `@/lib/supabase/server` + `as any` cast for RPC | `createServiceClient()` from `@/lib/supabase/service` (stub cookies break auth) |
| W2 | Server components — auth + data fetch | `createClient()` from `@/lib/supabase/server` (anon key, cookie-based) | `createAdminClient` or hardcoded service role key |
| W3 | Notifications insert | `supabase.from("notifications").insert({ user_id, type, title, body, action_url, target_segment })` | Missing fields or different column names |
| W4 | Fire-and-forget server-side fetch | `fetch(url, { method: "POST", ... }).catch(() => {})` | `await fetch(...)` (blocks response) |
| W5 | Internal API fetch from server components | Uses `process.env.NEXT_PUBLIC_APP_URL` (falls back to `http://localhost:3000`) | Relative URL `/api/...` (does not resolve server-side) |
| W6 | Dashboard sidebar `navItems` array | `Sidebar.tsx` — 17 items, exact indices matter | Inserting at wrong position breaks nav order |
| W7 | Admin sidebar `navItems` array | `AdminSidebar.tsx` — 31 items, exact indices matter | Inserting at wrong position breaks nav order |
| W8 | Build verification | `npm run build` — zero TS errors (no test framework) | Assuming Jest/Vitest/Playwright exist |
| W9 | Stripe integration | Uses `process.env.STRIPE_SECRET_KEY` and `process.env.STRIPE_WEBHOOK_SECRET` | Environment variables vary by project |
| W10 | Email (transactional) | Resend via `process.env.RESEND_API_KEY` | Not Brevo for transactional |

### Current Sidebar Nav State

**Dashboard (`src/components/dashboard/shell/Sidebar.tsx`) — 17 items:**
| Index | Label | Icon |
|-------|-------|------|
| 0 | Home | Home |
| 1 | Opportunities | Zap |
| 2 | My Profile | User |
| 3 | Certificates | FileText |
| 4 | My Goals | Target |
| 5 | Services | Globe |
| 6 | Flights | Plane |
| 7 | Holidays | Umbrella |
| 8 | Groups | Users |
| 9 | Trade Shows | Globe |
| 10 | Documents | FileText |
| 11 | Rewards | Gift |
| 12 | Earn with Swiipt | DollarSign |
| 13 | Find an Agent | Handshake |
| 14 | Refer & Earn | Users |
| 15 | Community | MessageCircle |
| 16 | Wallet | Wallet |

**Admin (`src/components/admin/shell/AdminSidebar.tsx`) — 31 items:**
| Index | Label | Icon |
|-------|-------|------|
| 0 | Overview | LayoutDashboard |
| 1 | Deposits | ArrowDownCircle |
| 2 | Visa Apps | FileText |
| 3 | Withdrawals | ArrowUpCircle |
| 4 | Users | Users |
| 5 | Orders | Package |
| 6 | Documents | FileText |
| 7 | Certificates | Shield |
| 8 | Services | Globe |
| 9 | Groups | Users |
| 10 | Trade Shows | Globe |
| 11 | Content | FileEdit |
| 12 | Opportunities | Zap |
| 13 | Holiday Bookings | Umbrella |
| 14 | Currencies | DollarSign |
| 15 | Leaderboard | Trophy |
| 16 | Promotions | Tag |
| 17 | Campaigns | Megaphone |
| 18 | Feed Ads | TrendingUp |
| 19 | Affiliates | Percent |
| 20 | AI Providers | Cpu |
| 21 | Notifications | Bell |
| 22 | Subscribers | Mail |
| 23 | Partners | Handshake |
| 24 | Corporate | Building2 |
| 25 | Float Ledger | TrendingUp |
| 26 | Settings | Settings |
| 27 | Analytics | BarChart2 |
| 28 | Landing Pages | Layout |
| 29 | Goal Templates | Crosshair |
| 30 | SEO Manager | Search |

### Existing Table Name Registry (Non-Obvious Conflicts)
*Tables that future sprints might accidentally collide with:*

| Table | Sprint | Purpose | Risk for Future |
|-------|--------|---------|-----------------|
| `goal_gifts` | Sprint 5 | Friend-to-friend transfers (giver_id, recipient_id, amount) | Any new "gift" feature must use different table name |
| `group_buys` | Sprint 16 | Group purchase commitments | Any new "group" feature must check namespace |
| `trade_shows` | Sprint 16 | Trade show catalog | Any new event/catalog feature |
| `trade_show_groups` | Sprint 16 | Group savings for trade shows | Prefixed with `TS-`, separate from `GB-` groups |
| `niche_pages` | Sprint 14 | 20+ SEO landing pages with JSONB fields | Any new landing page feature |
| `holiday_bookings` | Sprint 16 | Holiday booking records | Any new booking flow |
| `readiness_score_log` | Sprint 16 | Score change audit trail | Any new scoring system |
| `diaspora_gifts` | Sprint 17 | Diaspora gift funding sessions (Stripe) | Do NOT use `goal_gifts` or `/api/gifts/*` |
| `platform_certificates` | Sprint 17 | Proof of Funds + Trust Certificates | Certificate generation, PDF, verification |
| `escrow_deals` | Sprint 17 | Milestone-based agent escrow | Any new escrow/payment milestone feature |
| `achievement_cards` | Sprint 18 | Shareable achievement cards | Any new card/achievement feature |
| `opportunity_signals` | Sprint 19 | User behavioural signals | Signal weights, interest model, feed scoring |
| `opportunity_queue` | Sprint 19 | Raw ingested pipeline items | Pipeline processing, trust tiers |

### Common Mistakes Registry

1. **Using `createServiceClient()` in API routes for auth** — Service client has stub cookies (`getAll` returns `[]`), so `getUser()` fails. Use `createClient()` from `@/lib/supabase/server`.
2. **Using relative URLs for server-side fetch** — `/api/readiness/recalculate` does not resolve from server components. Must use `process.env.NEXT_PUBLIC_APP_URL` prefix.
3. **Omitting `id` in Supabase select queries** — Caused deposit `goal_id` to be null (Sprint 16 post-deploy bug). Always include `id` when joining to parent records.
4. **Inserting sidebar nav items without checking exact indices** — Dashboard has 17 items, admin has 31. Insert at wrong position = broken nav order.
5. **Using `price_paid` for service orders** — Column does not exist. Use `final_price`.
6. **Forgetting `setShowXxx(false)` before `router.refresh()` in pending confirmation modals** — Modal stays open because `router.refresh()` preserves client state.
7. **Inline `display` style overriding Tailwind responsive classes** — `className="md:hidden"` + `style={{ display: "flex" }}` = always visible because inline styles win. Use `className="md:hidden flex"` instead.
8. **`createClient()` in component body causes subscription churn** — Every React re-render creates a new Supabase client reference, causing Realtime subscriptions to tear down and re-create. Move `createClient()` inside useEffect or use a ref. (Session 21 root cause for holiday/service modal bugs.)
9. **`window.location.reload()` vs `router.refresh()`** — `window.location.reload()` starts page navigation before React can flush batched state updates (`setShowXxx(false)` never executes). Use `router.refresh()` + `setShowXxx(false)` pattern instead. (Session 19/21.)
10. **Inline arrow callbacks for Realtime subscription callbacks** — New reference on every render causes subscription teardown. Use `useCallback` or ref-based approach. (Session 21.)
11. **`media_source` CHECK constraint requires `fetched` or `fallback`** — The constraint is `CHECK (media_source IN ('fetched','custom','fallback'))`. `custom` is reserved for future admin manual image upload. When mapping from `cover_source` (og/logo/ai/branded/none), use `cover.cover_source === "branded" || cover.cover_source === "none" ? "fallback" : "fetched"`. The `"none"` case was originally mapped to `"fetched"` which is wrong — no image exists. (Session 38 bug fix.)
12. **`type` column has FK constraint to `opportunity_types(slug)`** — The `type` column on `opportunities` references `opportunity_types(slug)`. AI enrichment returns free-form types (e.g. "visa" instead of "visa_programme", "remote" instead of "remote_work"). Any value not in the 21 seeded types causes a FK violation. The Supabase JS client returns `{ data: null, error: ... }` on INSERT failure — always check `error` before counting as published. Use `safeType()` to validate against `ALLOWED_TYPES` set before INSERT. (Session 39 root cause — all 495 evidence items were marked "enriched" but zero opportunities were created.)
13. **Supabase JS client never throws on INSERT errors** — It resolves with `{ data: null, error: PostgrestError }`. If you don't destructure and check `error`, the INSERT appears to succeed but no row is created. Always use `const { data, error } = await supabase.from(...).insert(...)` and check `error` before proceeding. (Session 39 — code marked all items as "published" regardless of INSERT success.)

## 11. SESSION HISTORY — COMPLETED WORK

> Note: Section renumbered after Sprint 17 compatibility registry (section 10) was inserted.

### Session 1 — Reward Security Fixes
- Fix 1: Remove goal-based credit conversion
- Fix 2: Qatar visa redemption flow (DB columns)
- Fix 3: Credit at service checkout
- Fix 4: Spin wheel flow
- Admin settings: hotel fee fields, dynamic pricing logic, DB columns, night selector modal

### Session 2 — Database Types & Deposit Flow
- Complete DB type definitions (36 tables, 9 RPCs) in `src/types/database.ts` (819 lines)
- Notification preferences persistence (`user_preferences` table, upsert API)
- Deposit flow resume/recovery (pending deposit detection, resume UI, 48h abandon cron)

### Session 3 — Build & Type Fixes
- Fixed unescaped quote in NotificationPreferences.tsx
- Fixed deposit Insert/Update types (status union, missing fields)
- Build verified: `npm run build` passes with zero errors

### Session 4 — Sprint 16 Investigation (Completed)
- Read entire codebase, all sprint docs, all history folders, all reports
- Understood git workflow (main/staging/develop, manual push → Vercel)
- Understood admin blank page root cause (anon client vs service client)
- Priority 1 (admin groups page: list + detail + status API) already built
- Investigation report completed with 4 priorities identified
- Full AGENTS.md knowledge base created

### Session 5 — Group Buy Payment Flow Investigation & Implementation (Completed)
- Investigated services payment flow (OrderFlow, DirectPaymentFlow, API routes) for group buy replication (Sprint 16 Priority 2)
- Identified 5 gaps: no payment method choice, no goal redemption, no credit auto-apply, no "confirm payment" step, no Realtime subscription
- Wrote investigation report + surgical implementation plan (Option B, full mirror) to `reports/`
- Implemented all 8 files file-by-file with user approval:

| # | File | Action | Status |
|---|------|--------|--------|
| 1 | `src/components/dashboard/groups/GroupBuyPaymentModal.tsx` | Create — 4-step modal | Done |
| 2 | `src/app/api/group-buy/pay/route.ts` | Modify — add payment method, goal redemption, credit auto-apply | Done |
| 3 | `src/app/api/group-buy/confirm-payment/route.ts` | Create — user confirms bank transfer sent | Done |
| 4 | `src/components/dashboard/groups/GroupDetailActions.tsx` | Modify — strip inline pay, embed modal | Done |
| 5 | `src/app/(dashboard)/dashboard/groups/[id]/page.tsx` | Modify — fetch goals + wallet credits | Done |
| 6 | `src/app/api/admin/groups/update-status/route.ts` | Modify — add `paid` transition + auto-complete + confirm linked order | Done |
| 7 | `reports/priority_2_migration.sql` | Create — enable Realtime on group_buy_members | Done |
| 8 | `reports/group_buy_payment_flow_investigation.md` | Modify — link to implementation plan | Done |

- **Key deviation from plan (improvement):** Section C credit handling — avoided double-reduction by following the live services pattern (order created at full price → RPC deducts → `remainingToPay` becomes final price)

### Session 6 — Holiday Booking Flow Fix (Completed)
- Investigated holiday "Book directly" flow — found critical gap: `POST /api/holidays/book` generated reference but never persisted a booking record
- Created `holiday_bookings` table type in `src/types/database.ts` + migration SQL (`reports/holiday_bookings_migration.sql`)
- Added "I Have Transferred the Payment" button to `HolidayBookingFlow.tsx`
- Created `POST /api/holidays/confirm-payment` endpoint (sets `payment_submitted` status)
- Added admin Holiday Bookings panel to `/admin/holidays` page
- Created admin booking detail page with status update + document request
- Created `POST /api/admin/holidays/update-booking-status` endpoint
- Created `POST /api/admin/holidays/request-documents` endpoint
- Added holiday bookings to wallet transaction history
- Added Realtime subscription for holiday booking admin confirmation
- Fixed document verification to update `holiday_bookings` status when all docs verified
- Fixed holiday booking rows clickable in admin
- Investigation report: `reports/holiday_booking_flow_investigation.md`
- Fix plan: `reports/holiday_booking_fix_plan.md`
- Admin workflow plan: `reports/holiday_booking_admin_workflow_plan.md`
- Testing walkthrough: `reports/holiday_booking_testing_walkthrough.md`
- **Deployed:** 12 commits from `26cead3` to `2bcc96f`

### Session 7 — Payment Recovery Gap Investigation & Plan (Completed)
- User reported: after selecting "Direct Bank Transfer" and closing the modal, there's no way to recover the payment or see bank details again
- Investigated the deposit resume flow (`GoalDepositFlow.tsx`, `deposits/initiate/route.ts`) as the reference pattern
- Confirmed the group buy flow eagerly sets `pending_payment` on modal open (in `DirectPaymentStep` `useEffect`)
- "Pay now" button only renders for `committed` status — disappears when status becomes `pending_payment`
- No resume UI, no cancel mechanism, no cron cleanup for `pending_payment` memberships
- Created full implementation plan at `reports/payment_recovery_implementation_plan.md` proposing:
  - `POST /api/group-buy/cancel-payment` — user can cancel pending payment and revert to `committed`
  - `GET /api/group-buy/payment-status` — check for existing pending payment
  - `user_confirmed_at` column on `group_buy_members` (mirrors `deposits` pattern)
  - "Continue Payment" button on group detail page for `pending_payment` status
  - "Resume" step in payment modal showing saved bank details
  - `pending_payment → committed` transition for admin revert
  - Cron cleanup for abandoned/expired pending payments
- Updated AGENTS.md with the recovery gap documented in section 5

### Session 8 — Payment Recovery: Implementation (Completed)
- Implemented all 9 steps of payment recovery for group buy direct payment:

| # | File | Action | Status |
|---|------|--------|--------|
| 1 | `sprint_16_group_buy_payment_recovery.sql` | Create — adds `user_confirmed_at` + `payment_reference` columns | Done |
| 2 | `src/app/api/group-buy/payment-status/route.ts` | Create — check for resumable pending payment | Done |
| 3 | `src/app/api/group-buy/cancel-payment/route.ts` | Create — cancel and revert to committed | Done |
| 4 | `src/app/api/group-buy/confirm-payment/route.ts` | Modify — set `user_confirmed_at` on confirm | Done |
| 5 | `src/app/api/group-buy/pay/route.ts` | Modify — store `payment_reference`, set `user_confirmed_at: null` | Done |
| 6 | `src/components/dashboard/groups/GroupBuyPaymentModal.tsx` | Modify — add `isResuming` prop, `direct_payment_resume` step, `ResumeDirectPaymentStep` | Done |
| 7 | `src/components/dashboard/groups/GroupDetailActions.tsx` | Modify — amber "Continue Payment →" button for `pending_payment` | Done |
| 8 | `src/app/api/admin/groups/update-status/route.ts` | Modify — `pending_payment → ["paid", "committed", "withdrawn"]` + notification | Done |
| 9 | `src/app/api/group-buy/expire/route.ts` | Modify — cron cleanup for abandoned/expired payments | Done |

- SQL migration confirmed run in Supabase (columns exist)
- Deployed to production via GitHub

### Session 9 — Payment Recovery: Bug Fixes (Completed)
- Fixed double cancel: "Switch to goal payment" button called cancel-payment in onClick AND parent's onSwitchToGoal also called it — removed direct fetch from button onClick
- Fixed payment_reference fallback: `payment-status` route falls back to `holiday_bookings.reference` when `payment_reference` is null
- Fixed error state not clearing: added `setError("")` to `onComplete`, `onCancel`, `onSwitchToGoal`
- Added `committed` to admin dropdown transitions for `pending_payment` members
- Added `res.ok` check before `window.location.reload()` in admin GroupDetailView
- Fixed `DirectPaymentStep` and `ResumeDirectPaymentStep` to check `confirm-payment` response before showing success
- Added `userConfirmedAt` prop to `GroupDetailActions` — hides "Continue Payment" when `user_confirmed_at` is set, shows teal "✓ Payment submitted — Awaiting admin confirmation" instead
- **Deployed:** Commit `2e2ad48` (bug fixes) + `8c11b22` (5 surgical fixes)

### Session 10 — Group Buy Status Sync Fix (Completed)
- **Root cause found:** Admin had 3 places to confirm payment (Groups page member dropdown, Orders page, Holidays page) but only the Groups page updated `group_buy_members.status`. Confirming from Orders/Holidays page left members stuck at `pending_payment`.
- **Fix 1a:** `POST /api/admin/orders/update-status` — after updating order, checks if linked to `group_buy_members` and syncs status (paid on confirm, committed on cancel) + all-paid auto-complete check
- **Fix 1b:** `POST /api/admin/holidays/update-booking-status` — same pattern for holiday bookings
- **Fix 2a:** Admin orders page query now joins `group_buy_members` to attach group buy info
- **Fix 2b:** `OrdersTable` shows blue "Group Buy — {status}" badge for linked orders
- **Fix 3:** Cron expire timeout extended from 24h to 72h for admin processing time
- **Deployed:** Commit `b078b96`
- **Investigation reports saved:** `reports/findings/group-buy-payment-status-inconsistency.md`, `reports/findings/service-vs-group-buy-payment-flows.md`

### Session 11 — Realtime Payment Confirmation (Completed)
- **Root cause found:** Goal deposit flow has a working Realtime subscription in `GoalDetailView.tsx` (parent component) that auto-refreshes the page when admin confirms. Group buy, holiday booking, and service flows lack this pattern — user must manually refresh after admin confirmation.
- **Investigation reports:** `reports/findings/realtime-payment-confirmation-pattern.md`, `reports/findings/realtime-payment-confirmation-implementation-plan.md`, `reports/findings/goal-deposit-modal-pattern-investigation.md`
- **Fix 1 — Group Buy:** Added Realtime subscription to `GroupDetailActions.tsx` — listens for `group_buy_members` status changes filtered by group, calls `window.location.reload()` when `status === "paid"`. Only activates when `membershipStatus === "pending_payment"` and `userConfirmedAt` is set.
- **Fix 2 — Holiday Booking:** Added server-side query in `holidays/[id]/page.tsx` to fetch existing pending/submitted booking. Added Realtime subscription to `HolidayDetailView.tsx` — listens for `holiday_bookings` status changes, shows teal/amber booking status card, hides "Book directly" when existing booking exists.
- **Fix 3 — Service:** Added `id` to `OrderRecord` interface in `ActiveOrderTracker.tsx` (data already queried, just not typed). Added Realtime subscription on `service_orders` table filtered by order ID — any admin status update triggers `router.refresh()`.
- **Pattern:** All 3 fixes mirror the proven `GoalDetailView` Realtime pattern — subscribe in parent/component, filter by record, listen for UPDATE, `window.location.reload()` on confirmation.
- **Session 11b — Group Buy Modal Fix:** Investigated goal deposit modal pattern (`reports/findings/goal-deposit-modal-pattern-investigation.md`). Key finding: goal deposit "pending" step has no X button, overlay click disabled, Realtime in parent calls `window.location.reload()` (hard reload). Applied to group buy: `GroupBuyPaymentModal.tsx` ConfirmationStep now shows ⏱ clock icon + "Payment pending confirmation" text, X button hidden, overlay click disabled during confirmation. Removed redundant Realtime from ConfirmationStep (parent has it). `GroupDetailActions.tsx` changed from `router.refresh()` to `window.location.reload()`.
- **Session 11c — Realtime Guard Fix:** Root cause: `GroupDetailActions` Realtime subscription had `!userConfirmedAt` guard that prevented activation because `userConfirmedAt` is null until modal sets it post-page-load (parent never re-renders while modal is open). Fix: removed `!userConfirmedAt` from guard — subscribe whenever `membershipStatus === "pending_payment"`.
- **Session 11d — Realtime Stability Fix:** Root cause: `router` in useEffect dependency array caused subscription to be torn down and re-created on every router reference change, creating windows where events were missed. Also `createClient()` was inside useEffect causing new client on every re-run. Fix: moved `createClient()` outside useEffect, removed `router` from deps (matches GoalDetailView pattern exactly).
- **Session 11e — Polling Fallback:** Replaced `window.location.reload()` with `router.refresh()` in Realtime callback (proven working from manual "Back to groups" button). Added 5-second polling fallback that queries `group_buy_members.status` directly via Supabase, ensuring auto-close works even if Realtime event is missed.
- **Session 11f — Modal Auto-Close Fix:** Root cause: `router.refresh()` only re-renders server components — client state (`showPaymentModal`) is preserved, so modal stays open. Goal deposit uses `window.location.reload()` which destroys ALL client state. Fix: added `setShowPaymentModal(false)` before `router.refresh()` in both Realtime and polling callbacks, matching the "Back to groups" button pattern. Investigation: `reports/findings/modal-auto-close-investigation.md`.
- **Deployed:** Commits `5804ac4`, `29a65eb`, `d97f86b`, `8c414bc`, `592e204`, `92736a8`, `c167e3d`

### Session 12 — Admin Order Amount Display Fix (Completed)
- **Finding:** Admin Orders detail page and Orders table show "Amount: -" for every order because the component references `order.price_paid` — a column that does not exist in the `service_orders` table (never created in any migration or type definition)
- **Root cause:** Typo/bug in display code — `price_paid` was used instead of `final_price` (the actual column that stores the charged amount after discounts/credits). Same for `currency` → `payment_currency`
- **Fix:** Replaced `price_paid` with `final_price` and `currency` with `payment_currency` in both `OrderDetailView.tsx:86` and `OrdersTable.tsx:74`
- **No DB changes needed** — `final_price` and `payment_currency` already exist and are correctly populated for every order
- **Investigation report:** `reports/findings/admin-order-amount-missing.md`
- **Build verified:** `npm run build` — zero TS errors

### Session 13 — Service Goal Redemption: Wallet Balance & Transaction History Fixes (Completed)
- **Finding:** Using goal savings to pay for a service order correctly deducted from `savings_goals.current_balance` but did NOT update `wallets.balance_ngn` (available balance), did NOT appear in wallet or goal transaction history, and sent no user notification
- **Root cause:** `deduct_goal_balance` RPC never adjusted `balance_ngn` for unlocked goals; transaction history UIs never queried `service_orders`; no user notification was created after goal deduction
- **Fix 1 — SQL:** Updated `deduct_goal_balance` RPC to deduct from `wallets.balance_ngn` when the goal is unlocked (mirrors `confirm_deposit` in reverse). SQL migration: `fix1_deduct_goal_balance_update.sql`
- **Fix 2 — Wallet History:** Added `service_orders` query (with `service_packages` join) to `wallet/page.tsx`. Added `service_payment` type support to `TransactionTable.tsx` (🛠️ icon, purple color, type filter pill, display label)
- **Fix 3 — Goal History:** Added `service_orders` query filtered by `goal_id` to `goals/[id]/page.tsx`. Passed through `GoalDetailView.tsx` to `TransactionHistory.tsx`. Added `service_payment` rendering (🛠️ icon, purple bg, negative amount sign, "Service payment" label)
- **Fix 4 — Notification:** Added user notification (`type: "goal_redemption"`) in `services/order/route.ts` after successful `deduct_goal_balance`, linking to the goal detail page
- **Investigation report:** `reports/findings/service-goal-redemption-wallet-history-gaps.md`
- **Build verified:** `npm run build` — zero TS errors
- **Caveat (Fix 1):** If `balance_ngn` is lower than the deduction amount, it could go slightly negative — this is a pre-existing edge case, not introduced by the fix. The original code never deducted from `balance_ngn` at all.

### Session 13b — Credit Double-Deduction Fix (Completed)
- **Finding:** When goal_redemption + credit are both used, the goal was deducted by the pre-credit amount (187,000) instead of the credit-reduced amount (172,000). Credit was consumed from wallet AND the credit value was also deducted from the goal — effectively double-counted.
- **Root cause:** In `services/order/route.ts`, credit application code ran AFTER goal deduction. `deduct_goal_balance(goalId, finalPrice)` used the pre-credit `finalPrice` (187,000), then credit reduced `finalPrice` to 172,000 — too late. The transaction history showed 172,000 (read from DB after credit updated it), but the actual goal balance reflected 187,000.
- **Fix:** Reordered three blocks in `services/order/route.ts`: bank details → credit application → goal deduction. Goal deduction now uses the credit-reduced `finalPrice`. Added `&& finalPrice > 0` guard to skip deduction if credit fully covers the cost. No SQL changes needed.
- **Investigation report:** `reports/findings/service-credit-double-deduction.md`
- **Build verified:** `npm run build` — zero TS errors

### Session 14 — Holiday Goal Linking (Phase 1) (Completed)
- **Goal:** Remember existing savings goals created for a trip, show them on holiday detail page, prevent duplicate goal creation.
- **Step 1 — SQL + types:** ALTER TABLE `savings_goals` ADD COLUMN `linked_holiday_package_id UUID REFERENCES holiday_packages(id) ON DELETE SET NULL`. Updated Row type in `database.ts`. Migration SQL: `fix_holiday_goal_linking_step1.sql`.
- **Step 2 — Duplicate check + populate link:** In `HolidayBookingFlow.handleSave()`, checks for existing goal via `linked_holiday_package_id` before inserting. Sets `linked_holiday_package_id: pkg.id` on new goals. Shows "Goal already exists" card with "View goal →" link if found.
- **Step 3 — Detect existing goal on detail page:** Server page (`holidays/[id]/page.tsx`) queries for existing goal with `linked_holiday_package_id`. `HolidayDetailView` shows "🎯 Saving for this trip" card with progress + "Continue saving →" link. Replaces "Save toward this" button when goal exists.

### Session 15 — Holiday Goal Redemption (Phase 2) (Completed)
- **Goal:** Allow users to pay for holiday bookings using goal savings (goal_redemption), with admin cancel reverting goal balance.
- **Step 4 — SQL + types:** ALTER TABLE `holiday_bookings` ADD COLUMN `goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL`. Updated Row type in `database.ts`. Migration SQL: `fix_holiday_goal_redemption_step4.sql`.
- **Step 5 — Goal redemption in booking API:** Rewrote `POST /api/holidays/book/route.ts` to accept `goalId` + `paymentMethod`. Handles milestone discount, credit auto-apply (manual wallet update), `deduct_goal_balance`, user notification. Direct payment path unchanged.
- **Step 6 — Goal selection UI in `HolidayBookingFlow.tsx`:** When user has a funded goal (balance ≥ total price), shows two payment buttons: "🎯 Pay from {goal_name}" and "✈️ Pay via bank transfer". Goal_redemption calls `handlePayFromGoal` → immediately `payment_confirmed` (no admin confirmation needed). Added `existingGoal?` optional prop for `HolidayGrid.tsx` usage.
- **Step 7 — Admin cancellation reverts goal balance:** `POST /api/admin/holidays/update-booking-status` now fetches `goal_id` + `total_price`. When cancelled with `goal_id`, restores `savings_goals.current_balance` (+ `wallets.balance_ngn` for unlocked goals).
- **Key decision:** Holiday booking credit handled via manual wallet update (not RPC) since `apply_credit_to_order` is hardcoded to `service_orders`.
- **Key decision:** `existingGoal` prop is optional in `HolidayBookingFlow` — `HolidayGrid.tsx` doesn't have existing goal data for grid packages.
- **Build verified:** `npm run build` — zero TS errors

### Session 16 — Holiday Goal Payment Flow UX Fixes (Completed)
- **Problem:** User with funded goal saw "Continue saving →" on detail page, had to click through 4 steps to reach goal payment. Grid path didn't pass goal context at all.
- **Fix 1 — Detail page CTA:** Changed button logic in `HolidayDetailView.tsx` — when goal has sufficient balance, shows "🎯 Pay with savings — ₦{balance}" (teal button) instead of "Continue saving →". Clicking it opens modal with `initialAction="book"`, skipping the action selection screen.
- **Fix 2 — Grid path:** Added `linked_holiday_package_id` to `activeGoals` query in `holidays/page.tsx`. `HolidayGrid.tsx` now finds linked goal from `activeGoals` and passes `existingGoal` + `initialAction` to `HolidayBookingFlow`.
- **Fix 3 — Stale prop workaround:** Added `detectedGoal` state in `HolidayBookingFlow` — stores the goal from the duplicate check so booking form can reference it even when server prop is null.
- **Fix 4 — In-session book button:** Added "✈️ Book directly from this goal" button on the `existing_goal` result screen, so user can proceed to booking without closing/reopening modal.
- **Investigation reports:** `reports/findings/holiday-goal-payment-not-available.md` (stale prop), `reports/findings/holiday-pay-flow-too-many-steps.md` (UX), `reports/findings/holiday-grid-missing-goal-context.md` (grid path)
- **Build verified:** `npm run build` — zero TS errors
- **Deployed:** Commits `c674754`, `fc38f66`, `b0699b2`

### Session 17 — Holiday Goal Deduction in Transaction History (Completed)
- **Problem:** Goal_redemption holiday booking deduction did not appear in the goal's transaction history on the goal detail page.
- **Root cause:** Same as Session 13 Fix 3 — `goals/[id]/page.tsx` queried `deposits`, `gifts`, `serviceOrders` but not `holiday_bookings`. `TransactionHistory.tsx` had no `holiday_payment` mapping.
- **Fix:** Added `holiday_bookings` query (with `holiday_packages(title)` join) in `page.tsx`. Passed through `GoalDetailView.tsx`. Added `holiday_payment` type in `TransactionHistory.tsx` with 🌍 icon, purple background, "Holiday payment" label.
- **Build verified:** `npm run build` — zero TS errors
- **Deployed:** Commit `5eec857`

### Session 18 — Holiday Pending Confirmation Modal (Completed)
- **Problem:** After clicking "I Have Transferred", holiday booking showed "🎉 Payment submitted!" with no auto-close on admin confirmation. User had to manually close modal. Overlay click could accidentally dismiss the pending state. No polling fallback if Realtime event missed.
- **Investigation report:** `reports/findings/holiday-pending-confirmation-gap.md` — 5 gaps identified vs goal deposit and group buy patterns.
- **Priority 1 — UI alignment:** Changed icon from 🎉 to ⏱, heading from "Payment submitted!" to "Payment pending confirmation", added "1–4 business hours" body text, "Back to holidays" button text.
- **Priority 2 — Overlay guard:** Added `bookingPending` state in `HolidayDetailView`. When pending, `onClick=undefined` + `cursor=default` prevents accidental dismissal.
- **Priority 3 — Auto-close:** Realtime callback now calls `onAdminConfirmed()` which does `setShowBooking(false); router.refresh()`. Modal auto-closes + page refreshes on admin confirmation.
- **Priority 4 — Polling fallback:** 5-second `setInterval` polls `holiday_bookings.status` — mirrors `GroupDetailActions` polling pattern exactly. Backup if Realtime event is missed.
- **Priority 5 — Parent subscription:** New `currentBookingId` state in `HolidayDetailView`. New parent-level Realtime subscription persists after modal closes, catches confirmations the user might have missed.
- **Build verified:** `npm run build` — zero TS errors
- **Deployed:** Commits `448d905`, `d6d9763`
- **Pattern note:** All 5 priorities together make the holiday booking flow match the group buy payment confirmation pattern exactly (Realtime + polling + overlay guard + parent safety net).

### Session 19 — Holiday Auto-Refresh Fix (Completed)
- **Problem:** After admin confirmation, "pending payment confirmation" → "payment confirmed" (state change worked) but page did not auto-refresh. `router.refresh()` was too subtle (no visual flash). The `existingBooking` query filtered out `payment_confirmed` bookings (line 48), so the booking card disappeared after refresh. The inline `onAdminConfirmed` arrow function caused Realtime subscription teardown/re-create on every parent re-render (race window for missed events).
- **Investigation report:** Written in session conversation (not saved as file).
- **Root causes:**
  1. `router.refresh()` is a soft refresh — no visual feedback vs goal deposit's `window.location.reload()`
  2. Line 48 of `holidays/[id]/page.tsx`: `.in("status", ["payment_pending", "payment_submitted"])` excluded `payment_confirmed` — booking card disappeared after refresh
  3. `onAdminConfirmed` was inline arrow `() => { setShowBooking(false); router.refresh(); }` — new reference on every render caused Realtime subscription to tear down and re-create
  4. `router` in useEffect dependency arrays triggered unnecessary subscription re-creation
- **Fix A — Hard reload (reverted in Session 21):** Replaced all 3 `router.refresh()` calls with `window.location.reload()`. **Reverted** — `window.location.reload()` starts page navigation before React can flush batched state updates (`setShowBooking(false)`), so modal never visually closes.
- **Fix B — Query includes confirmed (kept):** Added `"payment_confirmed"` to the IN filter. Booking card now shows "✓ Payment confirmed" after refresh.
- **Fix C — Stable callback (replaced in Session 21):** Replaced inline arrow with `useCallback`. **Replaced** with ref-based approach + inline arrow in Session 21.
- **Fix D — Deps cleanup (kept):** Removed `router` from both parent useEffect dependency arrays. Changed `[existingBooking?.id, router]` → `[existingBooking]` for lint compliance.
- **Build verified:** `npm run build` — zero TS errors
- **Deployed:** Commit `3bc15cb` (partially reverted in `1c4cdc8`)

### Session 20 — Service Orders Pending Confirmation + Auto-Refresh (Completed)
- **Problem:** Service orders had no pending confirmation waiting state, no Realtime auto-close, no polling fallback, no overlay guard. After clicking "I Have Transferred", users saw a static 🎉 success screen with no way to know if admin had confirmed payment.
- **Investigation:** 5 gaps identified vs holiday/group buy pattern:
  1. No pending confirmation modal (⏱ clock, "pending admin confirmation" text)
  2. No Realtime subscription to auto-close on admin confirmation
  3. No polling fallback (5-second interval)
  4. Overlay always dismissible (no guard during pending state)
  5. No parent-level safety net subscription after modal closes
- **File 1 — `OrderFlow.tsx` (6 changes):**
  - Added `confirmed`, `adminConfirmed` state + `createClient()`
  - Added Realtime subscription on `service_orders` table — calls `onAdminConfirmed?.()` + `setAdminConfirmed(true)` when status → `payment_confirmed`
  - Added `onPendingChange` effect for overlay guard
  - Added `onOrderCreated` effect for parent safety net
  - Added 5-second polling fallback (same pattern as holiday flow)
  - Split confirmation step: goal_redemption → existing 🎉 success (no admin needed); direct_payment → ⏱ pending / ✅ confirmed UI
  - Overlay guard: `cursor: default`, `onClick: undefined` during pending state
- **File 2 — `ServiceDetailView.tsx` (4 changes):**
  - Added `currentOrderId` state + `handleAdminConfirmed` (`useCallback`)
  - Added parent-level Realtime subscription on `service_order_live:{id}` — persists after modal closes
  - Passed `onAdminConfirmed={handleAdminConfirmed}`, `onOrderCreated={setCurrentOrderId}`
  - Auto-close: `setShowOrder(false); window.location.reload()` on admin confirmation
- **Build verified:** `npm run build` — zero TS errors
- **Deployed:** Commit `3b9f974`

### Session 21 — Subscription Churn Fix + Revert to router.refresh() (Completed)
- **Investigation:** User reported both holidays and service modals didn't auto-close and pages didn't auto-refresh after admin confirmation, despite `setAdminConfirmed(true)` working (⏱ → ✅ visible).
- **Root cause found:** `createClient()` was called in component body outside effects in `HolidayBookingFlow.tsx` and `OrderFlow.tsx`. Every React re-render (triggered by `onPendingChange` → parent re-render → child re-render) created a **new `supabase` object reference**. This appeared in both the Realtime and polling effect dependency arrays, causing both to tear down and re-create on every render — creating a window where events were missed or the callback fired against a stale closure.
- **Fix 1 — Subscription churn:** Moved `createClient()` inside each effect (Realtime + polling) in both `HolidayBookingFlow.tsx` and `OrderFlow.tsx`. Removed `supabase` from effect deps. `handleSave` got its own local `createClient()`.
- **Fix 2 — Stale closure safety:** Added `useRef` for `onAdminConfirmed` in both `HolidayBookingFlow.tsx` and `OrderFlow.tsx`. Callbacks use `onAdminConfirmedRef.current?.()` instead of `onAdminConfirmed?.()`, ensuring the latest callback is always called regardless of closure capture timing.
- **Revert — router.refresh():** After investigation, `window.location.reload()` was too aggressive — the browser page navigation starts before React can flush batched state updates (`setShowBooking(false)`). Reverted both `HolidayDetailView.tsx` and `ServiceDetailView.tsx` back to `router.refresh()` + `setShowBooking(false)` pattern. Key insight: `router.refresh()` preserves client state (allowing React to process state updates like closing the modal) while re-rendering server components. The `existingBooking` query now includes `payment_confirmed` (from Session 19 Fix B), so the booking card shows "✓ Payment confirmed" after refresh.
- **Build verified:** `npm run build` — zero TS errors
- **Deployed:** Commits `9587978`, `1c4cdc8`

### Session 22 — Group Buy Pending→Confirmed Transition Gap (Pending)

- **Investigation:** User reported group buy payment modal never transitions from ⏱ "Payment pending confirmation" to ✅ "Payment confirmed" when admin confirms payment. Unlike holiday and service flows which DO show this transition.
- **Root cause found:** `GroupBuyPaymentModal.tsx` — `ConfirmationStep` was built as a **static dead-end screen** with no `adminConfirmed` state, no Realtime subscription, and no polling fallback. The only Realtime subscription exists in the parent `GroupDetailActions.tsx` (line 66-86), which skips the ✅ step entirely and just calls `setShowPaymentModal(false); router.refresh()`.
- **Additional issue:** `GroupDetailActions.tsx:63` has `createClient()` in the component body — same subscription churn bug that Session 21 fixed for holiday/service. Was never applied to group buy.
- **Note:** The page refresh + status display (member showing as "paid") DOES work when user manually clicks "Back to groups" after admin confirmation. Only the ✅ transition inside the modal is missing.
- **Implementation plan:** `reports/group-buy-pending-confirmed-transition-plan.md`

### Key difference from holiday/service flow
| Aspect | Holiday/Service | Group Buy (current) |
|--------|----------------|---------------------|
| `adminConfirmed` state inside modal | ✅ Yes | ❌ No |
| Realtime subscription inside modal | ✅ Yes | ❌ No |
| Polling fallback inside modal | ✅ Yes | ❌ No |
| `createClient()` in component body | ❌ Fixed in S21 | ❌ Still broken |
| Conditional ⏱/✅ UI | ✅ Yes | ❌ Always ⏱ |

### Session 23 — Sprint 16 System 2 (Trade Show Group Savings) — Full Build (Completed)

- **Goal:** Build Trade Show Group Goals — SME group savings toward international trade show attendance, with group negotiation mechanics. Resolve all conflicts identified in `reports/sprint_16_system2_conflict_analysis.md` (17 findings, 4 HIGH/Critical).
- **Conflict resolutions applied:**
  - `lock_type` → used existing `is_locked=TRUE` + `maturity_date` (no column added)
  - `goal_category` → used `'custom'` (no ALTER TABLE needed)
  - Invite code namespace → `TS-` prefix + separate route `/join/trade-show/[code]`
  - `confirm_deposit` → surgically inserted trade show funding + readiness score blocks with NULL guards
  - System 3 SQL built first as prerequisite for `confirm_deposit` mod
- **6 phases, surgical precision, one approval at a time:**
  - **Phase 1:** System 3 SQL (`sprint_16_readiness_score.sql`: 3 ALTER TABLE users, readiness_score_log, calculate_readiness_score function) + `POST /api/readiness/recalculate` route
  - **Phase 2:** System 2 SQL (`sprint_16_trade_show_tables.sql`: 3 tables + 7 RLS + 5 indexes) + seed data (6 trade shows)
  - **Phase 3:** API routes (`POST /api/trade-shows/create-group`, `POST /api/trade-shows/join-group`) + `generateTradeShowInviteCode()` with `TS-` prefix in `group-buy-utils.ts`
  - **Phase 4:** Helper function `check_and_update_trade_show_group_funding()` + `confirm_deposit` RPC modified with trade show member funding UPDATE + `PERFORM calculate_readiness_score`
  - **Phase 5:** Pages + Components (`TradeShowCard.tsx`, catalog page, show detail page with cost breakdown + open groups, group detail page with funding progress + member bars + invite link, admin management page with catalog + groups tables)
  - **Phase 6:** Sidebar entries (dashboard + admin), public invite page at `/join/trade-show/[code]`, `JoinTradeShowGroup.tsx` client component, `database.ts` types updated (readiness columns, 4 new tables, 2 new RPCs)
- **Build verified:** `npm run build` — zero TS errors, zero new lint warnings across all phases
- **Deployed:** Pushed to `main` for Vercel deployment

### Session 24 — Post-Deploy: `confirm_deposit` ambiguous error + `goal_id` missing in select (Completed)
- **Problem 1:** After Sprint 16 deploy, admin got `column reference "deposit_id" is ambiguous` when confirming any deposit. Root cause: `confirm_deposit` RPC had 3 `visa_redemptions` subqueries using `deposit_id = deposit_id` where both sides could resolve to either the column or the function parameter. Previously masked by older PostgreSQL version or cached plan.
- **Fix 1:** `sprint_16_fix_ambiguous_deposit_id.sql` — qualified as `visa_redemptions.deposit_id = confirm_deposit.deposit_id` in all 3 locations. Preserved all Sprint 16 additions.
- **Problem 2 (masked by Problem 1):** After Fix 1, admin got `column "status" does not exist`. Root cause: `calculate_readiness_score` (Sprint 16 System 3) queries `referrals` with `status = 'completed'` but the column is `commission_status`.
- **Fix 2:** `sprint_16_fix_referrals_column.sql` — changed `status` → `commission_status` in `calculate_readiness_score`.
- **Problem 3 (separate):** Trade show group deposit confirmed successfully but goal `current_balance` was not credited; deposit appeared in wallet history but not goal history. Root cause: `groups/[groupId]/page.tsx:32` selected `savings_goals(goal_name, target_amount, current_balance)` — **missing `id`**. So `myGoal.id` was `undefined`, deposit created with `goal_id: null`, `confirm_deposit` entered ELSE branch (wallet credit) instead of IF branch (goal credit).
- **Fix 3:** `groups/[groupId]/page.tsx:32` — added `id` to select: `savings_goals(id, goal_name, target_amount, current_balance)`.
- **Reports written:** `reports/sprint_16_confirm_deposit_status_fix_plan.md`, `reports/sprint_16_trade_show_deposit_unlinked_goal.md`
- **SQL files created:** `swiipt/sprint_16_fix_ambiguous_deposit_id.sql`, `swiipt/sprint_16_fix_referrals_column.sql`
- **Deployed:** Commits to `main`

### Session 25 — Post-Deploy: Admin notification FK fix + Booking flow analysis (Completed)
- **Problem:** Confirming second member's deposit triggered `insert or update on table "notifications" violates foreign key constraint "notifications_user_id_fkey"`. Root cause: `check_and_update_trade_show_group_funding` at `sprint_16_trade_show_helper_fn.sql:53` selects `u.id` (user_roles's auto-generated PK) instead of `u.user_id` (the FK to users.id) for the admin notification. Only fires when all members are funded (first member's deposit didn't trigger it).
- **Fix:** `sprint_16_fix_admin_notification_user_id.sql` — changed `u.id` → `u.user_id`.
- **Booking flow analysis:** `reports/sprint_16_trade_show_booking_flow_analysis.md`
- **Decision:** **Pause here. Do not build booking phase yet.** Validate with real users first that the savings model works for trade show groups before building the `funded → booking → confirmed → completed` pipeline. The money sitting in locked goals is fine — it counts toward AUM and cannot be withdrawn.

### Session 26 — System 3: Opportunity Score (Completed)
- **Goal:** Build the Relocation Readiness Score as the Opportunity Score (user-facing framing). SQL + API were already built in Sessions 23-25. This session built the UI layer and all trigger points.
- **Naming convention (build once correctly):**
  - DB columns: `users.readiness_score` (internal, not renamed)
  - SQL function: `calculate_readiness_score()` (internal, not renamed)
  - API route: `/api/readiness/recalculate` (internal, not renamed)
  - Component: **`OpportunityScore.tsx`** (user-facing, final name from day one)
  - Display: **"You qualify for X opportunities today"** (final framing from day one)
- **7 phases, surgical precision, one approval at a time:**
  - **Phase 1:** Created `src/components/dashboard/home/OpportunityScore.tsx` — SVG circular progress (radius 54), 5 score tiers (Getting Started → Move-ready), temporary `opportunityCount = Math.round((score / 100) * 35)`, primary display "You qualify for X opportunities today", secondary display "Readiness: X/100", next-action CTA per tier, refresh button calling `POST /api/readiness/recalculate`
  - **Phase 2:** Modified `src/app/(dashboard)/dashboard/page.tsx` — added readiness score fetch from `users` table, 24-hour auto-recalc via server-side fetch to API route, renders `OpportunityScore` after `WelcomeBanner`, before `WalletCard`
  - **Phase 3:** Modified `src/components/dashboard/goals/CreateGoalForm.tsx` — added fire-and-forget `fetch("/api/readiness/recalculate")` after goal creation
  - **Phase 4:** Modified `src/app/api/documents/vault-upload/route.ts` — added fire-and-forget readiness recalc after vault document upload
  - **Phase 5:** Modified `src/app/api/services/order/route.ts` — added fire-and-forget readiness recalc after service order creation
  - **Phase 6:** Modified `src/app/api/settings/update-profile/route.ts` — added fire-and-forget readiness recalc after profile update
  - **Phase 7:** Modified `src/components/admin/users/UserProfileAdmin.tsx` — added "Readiness Score: X/100" display in admin user Overview tab
- **Build verified:** `npm run build` — zero TS errors
- **Plan file:** `docs/sprint_16_system3_build_plan.md` (detailed conflict analysis, all 8 files with full code, Sprint 18 upgrade path)

### Session 27 — Sprint 17: Global Profile, Certificates, Agent Escrow & Diaspora Gifts (Completed)

- **Phase 0 — Database:** Created `sprint_17_phase0.sql` (5 new tables: `financial_profiles`, `platform_certificates`, `platform_partners`, `escrow_deals`, `diaspora_gifts` + RLS + 6 users columns + 7 indexes + `certificate_seq` + `calculate_financial_profile()` function — all `IF NOT EXISTS` guarded). Created `sprint_17_certificate_helper.sql` (`next_certificate_number(cert_prefix)` function). Both SQL files ready to run in Supabase SQL Editor.
- **Phase 1 — Global Profile:** Created `/dashboard/profile/page.tsx` (server, parallel fetches, auto-recalc if stale >24h), `GlobalProfile.tsx` (3-column client: Identity/Financial/Global), `POST /api/financial-profile/recalculate` (auth + admin override), fire-and-forget trigger in deposit confirm route, "My Profile" at sidebar index 1.
- **Phase 2 — Proof of Funds:** Created `POST /api/certificates/proof-of-funds` (validates goal ≥₦50K, fee deposit, 30-day expiry), public verify page at `/verify/[code]` with `VerificationPage.tsx` (green/red states), `ProofOfFundsDocument.tsx` (PDF via `@react-pdf/renderer`), `GET /api/certificates/[code]/download` (dynamic import per type), certificate list + request page at `/dashboard/profile/certificates`.
- **Phase 3 — Trust Certificate:** Created `POST /api/certificates/trust` (reads `financial_profiles` + `users`, `SWP-TC-` prefix, 90-day expiry), `TrustCertificateDocument.tsx` (PDF with tenure/trust score/compliance badges). Reuses verify + download routes.
- **Phase 4 — Agent Escrow Portal:** Created 14 files across 10 build plan items. Includes: public partner registration (`/partners/apply`), agent directory with filter bar (`/dashboard/find-agent`), `PartnerCard.tsx`, agent detail + escrow deal form with milestone builder, `POST /api/escrow/create-deal`, two-step `POST /api/escrow/complete-milestone` + `POST /api/escrow/admin-confirm-milestone`, admin partners list + detail with commission rate editor and audit log, sidebar entries (Partners at index 17, "Find an Agent" at index 10).
- **Phase 5 — Diaspora Gift:** Created 4 files. Public `/fund/[goalId]` page with amount/currency/giver form, `POST /api/diaspora-gifts/create-session` (Stripe Checkout with FX rate + 1.5% fee), `POST /api/diaspora-gifts/webhook` (signature verify, goal balance increment, milestone checks, notification), "Share gift link" button in `GoalDetailView.tsx` alongside existing Gift button. Installed `stripe` + `@stripe/stripe-js`, updated `.env.example` with Stripe vars.
- **Key constraint compliance:** Table name `diaspora_gifts` (not `goal_gifts`), routes at `/api/diaspora-gifts/*` (not `/api/gifts/*`), public page at `/fund/[goalId]` (not `/gift/[goalId]`).
- **Build verified:** `npm run build` — zero TS errors across all phases.

### Session 28 — Sprint 18 Phase C: The Feed (Completed)

- **C-1:** Created `sprint_18_seed_opportunities.sql` — idempotent seed for 18 opportunities across 10 segments
- **C-2:** Created `POST /api/opportunities/feed/route.ts` — personalised feed generation with scoring (50 base + 20 featured + 15 country/role match), upserts to `user_opportunity_feed`
- **C-3:** Created `POST /api/opportunities/track/route.ts` — tracks apply/view clicks on opportunities
- **C-4:** Created `POST /api/opportunities/save/route.ts` — saves opportunity to user feed
- **C-5:** Created `OpportunityCard.tsx` — org avatar, title, location, type badge, deadline badges (red ≤7d, amber ≤14d), AI match label, salary, save/apply/share CTAs, WhatsApp share prompt, Boundless source link
- **C-6:** Created `OpportunityFeed.tsx` — infinite scroll (10 at a time), `AnimatedCard` with fade-up animation, "New this morning" section, featured card every 5th position in midnight gradient with "⭐ Top match" label, single/multi-column responsive, end-of-feed + refresh button, upgrade prompt after 3 apply clicks
- **C-7:** Upgrade prompt is referral-only ("Refer 3 friends to unlock Plus tier free") — no subscription option per conflict resolution
- **C-8:** Feed page at `/dashboard/opportunities` + detail page at `[opportunityId]` + `OpportunityFilters.tsx` + `SegmentSelector.tsx`
- **C-9:** Conflict resolution audit: found 6 discrepancies between build plan and `sprint_16_18_conflict_resolution.md`/`sprint_17_18_priority_order.md`; all fixed (AnimatedCard, featured card, upgrade prompt referral-only, OpportunityScore real count, feed page header count, achievement card trigger on order completion)
- **C-10:** `OpportunityScore.tsx` now uses real DB count from `user_opportunity_feed` (replaced temporary formula `Math.round((score / 100) * 35)`)
- **C-11:** Achievement card trigger added to `admin/orders/update-status/route.ts` for service_completed
- **Build plan:** `docs/sprint_18_complete_build_plan.md` created with all conflict resolutions reflected
- **Build verified:** `npm run build` — zero TS errors

### Session 29 — Sprint 18 Phase D: Growth Mechanics (Completed)

- **D-1a:** Created `sprint_18_phase_d_achievement_cards.sql` — `achievement_cards` table with `is_dismissed`, `is_shared_whatsapp`, `is_shared_instagram` columns. `success_stories` table already exists from prior work — no new table needed.
- **D-1b:** Created `POST /api/achievements/generate-card` — 11 card types (`goal_created`, `milestone_25/50/75`, `goal_funded`, `service_ordered`, `service_completed`, `visa_approved`, `certificate_issued`, `joined_swiipt`, `readiness_score`) with `x-internal-secret` guard
- **D-1c:** Created `AchievementCardSection.tsx` — shows 3 most recent unshared cards on dashboard home, WhatsApp/Instagram share (+ Canvas 1080×1080 PNG download for Instagram), dismiss button
- **D-1d:** Added trigger in `CreateGoalForm.tsx` for `goal_created`
- **D-1e:** Added milestone triggers in `admin/deposits/confirm/route.ts` — checks goal milestone columns after `confirm_deposit` RPC
- **D-1f:** Added trigger in `services/order/route.ts` for `service_ordered`
- **D-1g:** Added triggers in `certificates/proof-of-funds/route.ts` and `certificates/trust/route.ts` for `certificate_issued`
- **D-1h:** Added trigger in `auth/callback/route.ts` for `joined_swiipt` (new user signup)
- **D-3:** Created `SuccessStoryPrompt.tsx` — gradient prompt card shown when user has completed service + no story submitted
- **D-4:** Created `SuccessStoryForm.tsx` — modal with country, duration, cost, hardest part, advice fields, submits to API
- **D-5:** Created `POST /api/success-stories/submit` — inserts pending story, fires achievement card, sends admin notification
- **D-6a:** Created `/admin/campaigns` list page with `CampaignsList.tsx` — table with active/inactive toggle, participants, reward info
- **D-6b:** Created `/admin/campaigns/new` create form with `CreateCampaignForm.tsx` + `POST /api/admin/campaigns/create` + `POST /api/admin/campaigns/toggle` APIs
- **D-7:** Created `CampaignBanner.tsx` — fetches active viral campaigns on dashboard home, renders banner with reward details + "Participate →" CTA
- **D-8:** Added OpportunityScore mini widget in sidebar — shows opportunity count + readiness score above user profile section
- **Supporting API routes:** `GET /api/achievements/list`, `POST /api/achievements/mark-shared`, `POST /api/achievements/dismiss`
- **DB types updated:** `achievement_cards` row/insert/update types in `database.ts` (replaced old schema with new columns)
- **Build verified:** `npm run build` — zero TS errors

### Session 30 — Admin Affiliate Management: Phase A (DB/RLS) + Phase B (12 API Routes) (Completed)

- **Phase A — Database & RLS:** Created `admin_affiliates_phase_a.sql` — RLS policies (admin INSERT/UPDATE on `affiliate_status`, admin SELECT on `affiliate_module_progress`, 4 policies on `affiliate_withdrawals`), `affiliate_withdrawals` table with indexes. Types added to `database.ts`. SQL run successfully in Supabase.
- **Phase B — 12 API routes built, build passes:**
  - B-1: `GET /api/admin/affiliates` — paginated list with search/tier filter/stats
  - B-2: `GET /api/admin/affiliates/[id]` — full drill-down (user, referrals, orders, modules, timeline, sub-affiliates, withdrawals)
  - B-3: `POST /admin/affiliates/[id]/update-tier` — override tier with audit log
  - B-4: `POST /admin/affiliates/[id]/adjust-earnings` — dispute resolution with mandatory reason + notification
  - B-5: `POST /admin/affiliates/[id]/reset-code` — generate new AFF-XXXX code with audit log
  - B-6: `GET /admin/affiliates/withdrawals` — list by status with pagination
  - B-7: `POST /admin/affiliates/withdrawals/[id]/process` — approve/reject, adjust earnings, notify
  - B-8: `GET /admin/affiliates/modules` — list all modules
  - B-9: `POST /admin/affiliates/modules` — create module
  - B-10: `PUT /admin/affiliates/modules/[id]` — update module
  - B-11: `DELETE /admin/affiliates/modules/[id]` — delete (blocked if progress exists)
  - B-12: `POST /admin/affiliates/modules/reorder` — bulk reorder by ID array
- **Commits:** `1260f22` (Phase A), `4b1ef84` (Phase B)

### Session 31 — Admin Affiliate Management: Phase C (Pages + Components) (Completed)

- **C-1:** AdminSidebar — "Affiliates" nav entry after Campaigns (Percent icon)
- **C-2:** `/admin/affiliates` — list page with stats bar, search, tier filter, table, pagination (`AffiliatesList.tsx`)
- **C-3:** `/admin/affiliates/[userId]` — detail page with 5 tabs (Overview, Referrals, Earnings Timeline, University, Sub-Affiliates) + 4 action modals (change tier, adjust earnings, reset code, view as user) (`AffiliateDetail.tsx`)
- **C-4:** `/admin/affiliates/withdrawals` — pending/processed tables with approve/reject modals (`AffiliateWithdrawals.tsx`)
- **C-5:** `/admin/affiliates/modules` — table with edit/delete/preview/reorder (`AffiliateModulesList.tsx`)
- **C-6:** `/admin/affiliates/modules/new` + `/admin/affiliates/modules/[id]` — create/edit form (`ModuleForm.tsx`)
- **C-7:** SubAffiliateTree component — collapsible tree for gold/platinum affiliates (`SubAffiliateTree.tsx`)
- **C-8:** `/admin/affiliates/modules/[id]/preview` — preview with admin chrome banner, Complete button hidden
- **Commit:** `be6b190`

### Session 32 — Admin Affiliate: Phase D (Pending Withdrawal Flow) + Phase E (Audit Logs) + Gap Fixes (Completed)

- **Phase D:** Modified `POST /api/affiliate/withdraw` to insert into `affiliate_withdrawals` (pending) instead of inline deduction, added admin broadcast notification. Updated `AffiliateHub.tsx` to use client-side fetch with loading/success/error states, show ⏱ pending message, added Withdrawal History table. Updated `earnings/page.tsx` + `EarningsDashboard.tsx` with parallel withdrawal history fetch.
- **Phase E:** Added `admin_audit_log` inserts to module CREATE, UPDATE, DELETE, and REORDER routes (3 files).
- **Gap 1 — View as user:** Modified `affiliate/page.tsx` to accept `searchParams` (`userId` + `adminOverride`), uses service client to fetch target user's data, renders admin chrome banner ("🔍 Viewing as {name} — Back to admin →").
- **Gap 2 — Reset-code retry:** Added 3-attempt retry loop on `23505` collision.
- **Gap 3 — Leaderboard:** Added All-Time Standings section (top 20 by cumulative referrals from `affiliate_status`), "Reset monthly" button with confirmation + audit log, new `POST /api/admin/leaderboard/reset` route.
- **Bottom tabs mobile fix:** Removed `display: "flex"` from inline styles that was overriding Tailwind's `md:hidden` class.
- **Commits:** `b48966e` (Phase D), `d075642` (Phase E), `1b30bc6` (gaps), `e9902b2` (bottom tabs)

### Sessions 33-35 — Sprint 19: Full Build (Completed)

**Full walkthrough:** `reports/sprint_19_complete_walkthrough.md`

**Session 33 — Pre-Sprint 19 Phase 1 (Data-Driven Types + Segments):**
- Created `opportunity_types` table, added `color`/`text_color` to `career_segments`
- Created `src/lib/opportunity-types.ts` — `getOpportunityTypes()`, `buildTypeStyleMap()`, `buildSegmentMap()`
- Updated admin forms to fetch from API routes (`/api/opportunity-types`, `/api/career-segments`)
- Updated onboarding page (`SegmentSlug` → `string`)
- SQL migration: `sprint_19_pre_data_driven_types.sql`
- Build verified: zero errors

**Session 34 — Phase 2 (AI Service + OmniRoute):**
- Created `src/lib/ai-service.ts` — `enrich()`, `isAIAvailable()`, OmniRoute priority fallback
- Created `src/lib/ai/prompts.ts` — task-specific prompt builders and exports
- Created provider adapters: `gemini.ts` (Gemini 1.5 Flash), `deepseek.ts` (DeepSeek Chat), `index.ts` (interface)
- SQL: `sprint_19_phase2_ai_providers_seed.sql`
- Build verified: zero errors

**Session 35 — Sprint 19 Unified Build (all sections §A–§F):**

**§A.1 Layout:** Grid → single-column flex (max-width 680px), IntersectionObserver outside card container, `width: "100%"` on cards, `paddingBottom: 80px`. Kill list removed: "Your Opportunities" H1, subtitle, "Update interests", "You have seen all N", "Refresh" button.

**§A.2 Detail modal:** `OpportunityDetailModal.tsx` — slide-up mobile / centered desktop, Escape close, body scroll lock, sticky action bar, data-driven typeStyles, dwell time tracking.

**§A.2.1 Card anatomy:** "…more" inline expand on description; signals row (Trust ✅, Match ●●●○, ⏳ days); org logo 48px; redundant chips removed. `showAIMatch` and `userTier` props removed.

**§A.3 Media system:** SQL migration (10 columns), `src/lib/og-fetch.ts` (OG extraction + image validation), `FallbackTile.tsx` (type-colored gradient + emoji + flag + org name), media zone in card with overlaid chips.

**§A.4 Engagement rail:** SQL migration (`opportunity_signals` with like/comment, `user_interest_model`, `opportunity_comments` tables + RLS + indexes). Like button with optimistic UI + toggle endpoint. Engagement rail: Like · Save · Share · Apply.

**§A.5 ServiceCTA:** `ServiceCTA.tsx` (dynamic routing by country+type), `POST /api/opportunities/track-signal`, wired into OpportunityCard.

**§B Tracked Redirect:** `GET /api/opportunities/apply?id={id}` — validates, increments apply_click_count, upserts feed, redirects. `handleApply` calls `window.open("/api/opportunities/apply?id=...", "_blank")`.

**§C Pipeline:** SQL migration (`opportunity_queue`, `opportunity_sources`, needs_review columns, RLS, indexes). `POST /api/admin/opportunities/process-queue` (tiered AI via OmniRoute), `POST /api/admin/opportunities/ingest` (RSS + XML + dedup), `POST /api/admin/opportunities/check-links` (HEAD all URLs). `POST /api/opportunities/paste-url` (AI prefill + OG fetch), `PasteUrlForm.tsx`.

**Amendment 1 — Search:** `POST /api/opportunities/feed` accepts `{query, type, country}` → search mode (text match, no interest model). `/dashboard/opportunities/search` page with SearchBar + filter chips. `SearchExplore.tsx`.

**§D Behavioural Engine:** `POST /api/opportunities/signal` (view/expand/save/apply/dismiss/share/dwell). Signal firing in card (2s viewport view, expand on click, save/apply/share/dismiss). Dismiss button on every card. Dwell tracking in modal (dwell_long ≥30s, dwell_short <5s). `POST /api/opportunities/compute-interest` (7-layer recency-weighted model). `POST /api/opportunities/compute-interest-batch` (cron, max 100 users). Feed scoring: segment, country, type, suppression, freshness, featured, applied + source diversity penalty.

**§E Feed Ads:** `sprint_19_feed_ads.sql` (table + RLS + index). Admin API routes (list GET, create POST, toggle POST). Admin list page with status badges + pause/activate. Create form. Sidebar entry. Injection every 7 positions, "Sponsored" label.

**§F Seed Data:** `sprint_19_seed_sources.sql` (22 sources across all segments). DB types updated for all new columns/tables.

**Build verified:** zero errors. Pushed to `main`.

**Session 36 — Final 6 Gaps (End of Sprint 19):**

| Gap | What Was Built |
|-----|----------------|
| **1 — §F Seed SQL** | `sprint_19_seed_opportunities.sql` — 20 extra opportunities as standalone file |
| **2 — Admin Queue Page** | `/admin/opportunities/queue` — review interface with Publish/Reject, expand/collapse, AI data viewer |
| **3 — Queue Badge** | Red badge on Opportunities sidebar item (fetched from `opportunity_queue` count) |
| **4 — "Why You're Seeing This"** | `getReasonText()` utility + italic text in OpportunityCard |
| **5 — pg_cron SQL** | `sprint_19_cron_compute_interest.sql` — compute-interest-batch every 6h |
| **6 — 60+ Sources** | `sprint_19_seed_additional_sources.sql` — 40+ additional sources (total ~62) |

**Build verified:** zero errors. Pushed to `main` (`0d681d1`).

**SQL migrations pending:** 10 files. Run in order in Supabase SQL Editor (see walkthrough §15).

**Session 37 — Sprint 19 Gap Fixes (All 4 Phases Completed):**

| Phase | Gap | What Was Built |
|-------|-----|----------------|
| **Phase 1** | J.8 Cold-start fallback | `feed/route.ts` — trending fallback when no segment matches, null-safe profile lookups |
| **Phase 1** | J.7 Expand signal | `OpportunityCard.tsx` — "more" click fires `signalType: "expand"` |
| **Phase 1** | Dwell tracking | Already built in signal route (no-op) |
| **Phase 1** | feed_ads types | `database.ts` — `feed_ads` Row/Insert/Update types added |
| **Phase 2** | §E.5 Ad impression/click tracking | `track-impression/route.ts` + `track-click/route.ts` + IntersectionObserver + CTA click handler |
| **Phase 3** | J.5 All opportunities list | `GET /api/admin/opportunities/all` with search/type/status filters |
| **Phase 3** | J.4 Per-item review | `POST /api/admin/opportunities/[id]/review` with approve/reject/request_changes |
| **Phase 3** | J.10 Individual ad CRUD | `GET/PUT/DELETE /api/admin/feed-ads/[id]` |
| **Phase 3** | J.11 Degraded source badge | Admin opportunities page fetches degraded sources, amber badge on org column |
| **Phase 4** | J.14 Cold-start re-ranking | `feed/route.ts` — boosts by `apply_click_count` + `view_count` when `interestModel` is null |
| **Phase 4** | J.6 Public submission | `POST /api/opportunities/submit` inserts into `opportunity_queue` |
| **Phase 4** | Video autoplay | Connection-aware `shouldAutoPlay()` with `navigator.connection` checks |
| **Phase 4** | Tap-to-play | `videoRef` + onClick toggle for play/pause |
| **Phase 4** | Comment scaffold | `CommentIcon` accepts `count` prop, black badge with 99+ cap |
| **Phase 4** | "Why you're seeing this" | `getReasonText()` utility + italic text in OpportunityCard |
| **Phase 4** | Dwell tracking | Invisible timer on expand/collapse, fires `dwell_long`/`dwell_short` signals |

**Build verified:** zero errors. All Sprint 19 unified spec items complete (except §A.7 dismiss button — skipped per user request).

### Session 38 — Evidence-First Architecture, Cover Images, Watchers, Source Health (Completed)

- **Date:** July 8-9, 2026
- **Goal:** Implement the Evidence-First architecture from `reports/opportunity_ingestion_investigation.md` — evidence table, API adapters, cover image system, watcher system, source health monitoring, extended opportunity types, seed data, pipeline automation.
- **Commits:** `d2f5b27` through `0b0b695` (16 commits on `main`)

#### Phase 1 — Evidence-First Architecture (d2f5b27, 1168245)
- **New table:** `evidence` — Raw evidence storage before enrichment (evidence_type, raw_data JSONB, source_url, source_name, content_hash, enrichment_status, opportunity_id)
- **New lib:** `src/lib/evidence-adapters.ts` — `createRSSEvidence()`, `createAPIEvidence()`, `createManualEvidence()` with SHA-256 content hashing
- **New lib:** `src/lib/api-adapters.ts` — `fetchHimalayas()`, `fetchArbeitnow()`, `fetchRemoteOK()`, `fetchAdzuna()`, `fetchUSAJOBS()` adapters normalizing to Evidence format
- **New API:** `POST /api/admin/evidence/reprocess` — Reprocess failed evidence items
- **New API:** `POST /api/admin/opportunities/export` — Export opportunities as JSON
- **SQL:** `swiipt/phase2_evidence_table.sql` (evidence table DDL), `swiipt/phase2_10_migrate_queue_to_evidence.sql` (migrate queue to evidence)
- **Updated:** `src/app/api/admin/opportunities/process-queue/route.ts` — Now processes from evidence table
- **Updated:** `src/app/api/admin/opportunities/ingest/route.ts` — Now ingests to evidence table
- **Updated:** `src/app/api/opportunities/submit/route.ts` — Partner submissions with validation + enrichment
- **Updated:** `src/types/database.ts` — Added evidence, watchers, source_health_log, partner_submissions types

#### Phase 2 — Cover Image System (b8b1d80, ed21816, ec6c922)
- **New lib:** `src/lib/cover-image.ts` — 4-layer cover image system:
  - Layer 1: OG Image (from `og-fetch.ts`)
  - Layer 2: Clearbit Logo Lookup (org name → domain → logo URL)
  - Layer 3: Pollinations.ai Generated Cover (AI-generated based on type/country/keywords)
  - Layer 4: Branded Fallback (category-colored gradient + type emoji + country flag)
- **New API:** `POST /api/admin/opportunities/backfill-covers` — Batch backfill cover images for opportunities with null cover_image_url
- **Updated:** `POST /api/admin/opportunities/create` — Auto-generate cover image on creation
- **Updated:** `PUT /api/admin/opportunities/[id]` — Auto-generate cover image on update
- **Fix:** `media_source` CHECK constraint violation fixed (allows 'fallback' value)
- **Fix:** Cover images now render full-bleed (no 16:9 crop)

#### Phase 3 — Watcher System (phase4_*)
- **New table:** `watchers` — Track URLs for page change detection (url, check_interval_hours, last_checked_at, last_content_hash, is_active)
- **New table:** `source_health_log` — Source pull health tracking (source_id, pulled_at, items_found, items_new, duration_ms, error_message, success)
- **New API:** `POST /api/admin/opportunities/watcher` — Check watched URLs for changes
- **SQL:** `swiipt/phase4_watcher_table.sql`, `swiipt/phase4_watcher_cron.sql`, `swiipt/phase4_seed_watcher_sources.sql`, `swiipt/phase4_add_watcher_type.sql`

#### Phase 4 — Source Health Monitoring (health_monitoring.sql, auto-downgrade)
- **New API:** `GET /api/admin/sources/health` — Source health summary with success/failure rates, avg duration, last pull times
- **New API:** `GET /api/admin/sources/metrics` — Source metrics (total ingested, published, health status)
- **New API:** `POST /api/admin/sources/auto-downgrade` — Auto-downgrade sources with consecutive errors
- **SQL:** `swiipt/health_monitoring.sql` — source_health_log table, auto-downgrade function

#### Phase 5 — Extended Opportunity Types (03adcd0, extend_opportunities)
- **12 new types added to `opportunity_types` table:** competition, conference, exchange, trade_show, trial, healthcare, residency, citizenship, funding, contest, accelerator, award
- **SQL:** `swiipt/extend_opportunities_type_check.sql` (fix CHECK constraint), `swiipt/extended_types_additional_sources.sql` (sources for extended types)

#### Phase 6 — Seed Data (34d3f81, seed_real_opportunities.sql)
- **60+ real opportunities seeded** across all segments and types (scholarships, jobs, visas, fellowships, grants, sports trials, remote work, healthcare, trade shows)
- **SQL:** `swiipt/seed_real_opportunities.sql` (430 lines of real opportunity data)

#### Phase 7 — Pipeline Automation (bb9a94a, fcdfbff)
- **SQL:** `swiipt/phase9_pipeline_automation.sql` — pg_cron jobs for ingest (every 6h) and process-queue (every 4h)
- **SQL:** `swiipt/activate_pg_cron.sql` — Activate pg_cron extension
- **SQL:** `swiipt/phase10_concurrency_rate_limit.sql` — Concurrency control for pipeline
- **Fix:** pg_cron jobs hardcoded with actual values for Supabase compatibility (no variable references)

#### Phase 8 — Verification SQL (a95ab6f, 169d910)
- **SQL:** `swiipt/VERIFY_ALL_SETUP.sql` — Master verification query checking all tables, columns, RLS policies
- **SQL:** `swiipt/verify/01-11_*.sql` — 11 individual verification queries (tables, sources, AI providers, opportunity types, type constraint, opportunities count, evidence columns, page hashes, partner submissions, seed opportunities)

#### Phase 9 — Provenance Viewer (ProvenanceViewer.tsx)
- **New component:** `src/components/admin/opportunities/ProvenanceViewer.tsx` — 236-line admin component showing source, evidence type, AI model, confidence score, edit history, trust tier, degraded status

#### Phase 10 — Bug Fixes & Polish
- `c890f37` — Removed top match background color and "why you're seeing this" text
- `c3d1efc` — Split desired_roles string into array for text[] column
- `0097c51` — Fixed onboarding error display + hardcoded cron values
- `9fe3236` — Resolved ESLint errors in OpportunityCard (ternary expressions)

**Build verified:** `npm run build` — zero TS errors across all phases.
**Deployed:** Pushed to `main` for Vercel deployment.

### Session 39 — Process-Queue Pipeline Fix (Completed)

- **Date:** July 9, 2026
- **Goal:** Diagnose and fix why the opportunity feed shows only 54 seed items despite process-queue reporting "published" items.
- **Commits:** `7f7e23a` (fix: process-queue INSERT now checks errors + validates type against FK constraint)

#### Investigation
- User triggered process-queue manually 4 times — API returned `{"processed":339,"published":339,"needsReview":0,"rejected":0}` (all items counted as published)
- Feed still showed only 54 seed items — no AI-generated opportunities visible
- Ran diagnostic SQL:
  - `SELECT ai_generated, COUNT(*) FROM opportunities` → 54 seed, 0 AI-generated
  - `SELECT enrichment_status, COUNT(*) FROM evidence` → 495 enriched, 316 failed
  - `SELECT enriched_data->>'insert_error' FROM evidence WHERE enriched_data ? 'insert_error'` → 0 rows (no errors captured)

#### Root Cause
1. **`type` FK constraint:** The `type` column on `opportunities` has a FOREIGN KEY referencing `opportunity_types(slug)`. The `opportunity_types` table has 21 seeded types. The AI enrichment returns free-form type values (e.g. "visa", "remote", "intern"). Any value not in the 21 seeded types causes a FK violation on INSERT.
2. **No error checking:** The old process-queue code destructured only `data` from the Supabase response, never checked `error`. Every INSERT failed silently, but `published++` incremented unconditionally.
3. **Path B had no fallbacks:** Path B (standard tier, confidence ≥ 0.85) passed `enriched.title`, `enriched.organisation`, `enriched.location_country`, `enriched.type`, `enriched.cleaned_description` directly. If AI omitted any of these, NOT NULL constraint failed silently.

#### Fix (Commit 7f7e23a)
- **File:** `src/app/api/admin/opportunities/process-queue/route.ts`
- **Change 1:** Added `ALLOWED_TYPES` set (21 valid types matching `opportunity_types` table)
- **Change 2:** Added `safeType(raw, segment)` function — validates AI type against allowed set, falls back to `inferTypeFromSegment()` if invalid
- **Change 3:** Both INSERT paths (Path A: trusted tier, Path B: standard tier) now check `error` from Supabase response — failed inserts mark evidence as "failed" with `insert_error` message and increment `rejected`, NOT `published`
- **Change 4:** Path B now has raw data fallbacks for title, organisation, location_country, description (was relying entirely on AI output)

#### Current Issue
- Deploy completed, but process-queue still shows only seed items
- Most likely explanation: the curl command ran before the deploy was live (Vercel deploy delay between "build complete" and "deployment serving traffic")
- **Next steps:**
  1. Verify deploy is live (check Vercel dashboard for commit `7f7e23a`)
  2. Check Vercel function logs for `POST /api/admin/opportunities/process-queue` — expand response body to see if `rejected > 0`
  3. Reset evidence: `UPDATE evidence SET enrichment_status = 'pending' WHERE enrichment_status = 'enriched' AND opportunity_id IS NULL;`
  4. Re-run process-queue via curl
  5. Verify: `SELECT ai_generated, COUNT(*) FROM opportunities GROUP BY ai_generated;`

#### Files Modified
| File | Change |
|------|--------|
| `src/app/api/admin/opportunities/process-queue/route.ts` | Added ALLOWED_TYPES, safeType(), error checking on both INSERT paths, Path B raw data fallbacks |

#### Files Created
| File | Purpose |
|------|---------|
| `findings/process-queue-investigation.md` | Full investigation report with SQL queries and fix plan |
| `findings/check_opportunities_state.sql` | 5 diagnostic SQL queries for Supabase SQL Editor |

### Session 40 — Pipeline Deadlock Diagnosis + Fix 1 (Standard-Tier Publishing)

- **Date:** July 9, 2026
- **Trigger:** Feed still showed 0 AI opportunities (54 seed only) after Session 39 fixes + SQL migration + evidence reset + re-run.
- **New root cause (deadlock, not previously found):** `process-queue` could never publish ingested items — trusted OR standard:
  1. **Bug 1 (standard gate unsatisfiable):** `prompts.ts` uses a "format-only" prompt for `standard` tier ("Do NOT evaluate legitimacy or confidence"), so the AI never returns `confidence_score`/`is_legitimate`/`is_relevant_for_nigerians`. But the standard publish branch required all three → every standard item rejected. The only active no-auth sources (Himalayas, Arbeitnow) are `standard` tier.
  2. **Bug 2:** RSS `deadline` is set to `item.isoDate` (article publish date, always past) → mechanical `deadlineInFuture` fails → trusted RSS `mechanicalScore` drops to ~0.5, below the 0.75 Path A threshold.
  3. **Bug 3:** trusted confidence only reaches 0.92 when `mechanicalScore >= 0.75` → combined with Bug 2, trusted items fall through to rejected.
  - Secondary (deferred): S1 `ai-service.ts` reads `ai_providers` with anon cookie client; S2 OmniRoute localhost URL; S3 only `GEMINI_API_KEY` set, only in `.env.local` (confirm in Vercel).
- **Investigation report:** `findings/pipeline-deadlock-root-cause.md`
- **Fix 1 applied (Option B, approved) — Bug 1 only:** In `src/app/api/admin/opportunities/process-queue/route.ts` (single file, 3 surgical edits):
  1. Standard publish gate `confidence >= 0.85 && is_legitimate && is_relevant_for_nigerians` → `mechanicalScore >= 0.75`
  2. Path B `ai_relevance_score` → `Math.round((confidence || mechanicalScore) * 100)` (avoids 0 relevance burying items)
  3. Borderline branch `confidence >= 0.60` → `mechanicalScore >= 0.5` (routes 0.5–0.75 standard items to needsReview instead of reject)
  - Path A (trusted), review_all, scam-risk reject, both INSERT bodies + error-checking untouched. Trusted items with mechanicalScore < 0.75 now go to needsReview (was rejected) — strict improvement.
  - **Build:** `npm run build` → ✓ Compiled successfully, zero TS errors.
  - **Record:** `findings/fix1-standard-tier-publish-applied.md`
- **Fix 2 applied (approved) — Bug 2:** In `src/lib/evidence-adapters.ts` (`createRSSEvidence`, single file): changed RSS `raw_data.deadline` from `item.isoDate || null` to `null`, and added `published_date: item.isoDate || null` to preserve the publish date. `item.isoDate` is the article publish date (past), which was failing the `deadlineInFuture` mechanical check and dropping trusted RSS scores below 0.75. `api-adapters.ts` (real deadline fields) untouched. Build: ✓ zero TS errors. **Record:** `findings/fix2-rss-deadline-applied.md`
- **Fix 3 applied (approved) — Bug 3:** In `src/app/api/admin/opportunities/process-queue/route.ts` (2 aligned edits): lowered trusted threshold from `mechanicalScore >= 0.75` to `>= 0.5` on both line 83 (confidence → 0.92) and line 113 (Path A publish gate). `0.5` is the floor (below is rejected at line 44), so trusted publishing is fully decoupled from the strict 0.75 bar. Trust hierarchy preserved: trusted publishes at ≥0.5, standard at ≥0.75 (Fix 1), review_all → review. Standard gate, scam reject, INSERT bodies untouched. Build: ✓ zero TS errors. **Record:** `findings/fix3-trusted-threshold-applied.md`
- **Bugs 1–3 all fixed.** Still pending: secondaries S1 (ai-service anon client), S2 (OmniRoute localhost), S3 (Vercel env vars). Not yet committed/deployed.

### Session 40 (cont.) — Diagnostics: ruled out constraints, confirmed timeout + ghosts

- **Fixes 1–3 committed + pushed** (`8b6efed`), Vercel auto-deployed.
- **Feed still showed only 54 seed rows.** Ran live diagnostics (`findings/diagnostic-queries.sql`):
  - Evidence: `enriched 495 / failed 416 / pending 86`.
  - `insert_error`: **0 rows captured.**
  - `opportunities.type`: BOTH `fk_opportunities_type` (FK→`opportunity_types`) AND `opportunities_type_check` (CHECK) exist, both allowing all **21** types. `opportunity_types` = 21 rows. `career_segments` = 10 slugs.
- **Ruled OUT:** type constraint (Finding B) and segment_slug FK — all `safeType()`/`inferTypeFromSegment` outputs are valid.
- **Revised root cause (`findings/diagnostic-results-session40.md`):**
  1. The 495 "enriched" are **ghosts** — `opportunity_id IS NULL`, zero insert_error → marked by OLD (pre-error-checking) code. Stale.
  2. **Finding A confirmed:** `process-queue` called `getCoverImage()` per published item (OG 8s + HEAD 5s + Clearbit 5s + Pollinations 15s ≈ up to 33s/item) over `limit(100)`, with **no `maxDuration`** in `vercel.json` → serverless timeout before commit. Fix 1 made it acute by routing hundreds of standard items onto the slow cover path.

### Session 41 — Step 1: Decouple Cover Images from process-queue (Completed + deployed)

- **User approved Step 1.** Goal: get data into the feed; defer covers.
- **Change (`src/app/api/admin/opportunities/process-queue/route.ts`, 4 edits):** removed all `getCoverImage()` calls from BOTH insert paths (trusted + standard), set `cover_image_url: null` on both inserts, removed the now-unused `getCoverImage` import. Covers to be filled asynchronously by existing `POST /api/admin/opportunities/backfill-covers`.
- **Build:** `npm run build` → ✓ zero TS errors. **Commit `d61f5ce`, pushed to `main`.**
- **Provided `findings/step1-reset-and-rerun.sql`** (reset ghosts+failed→pending; verify queries).

#### Post-deploy runtime findings
- User ran `SELECT ai_generated, COUNT(*) FROM opportunities` → still `false=54, true=0`; `missing_cover=0`.
- **Full code-path audit (`findings/deep-dive-feed-still-empty.md`):** code is SOUND — types valid, segment_slug valid, data shape matches (`api-adapters.ts` normalizes to `title/organisation/description/url/deadline/salary/location`), `enrich()` never throws (raw fallbacks work), all inserted columns exist in schema, cover decoupled, insert errors captured. Also discovered **`vercel.json` has NO cron for ingest/process-queue** — pipeline runs only via Supabase pg_cron or manual curl.
- **User triggered process-queue manually** (`Invoke-RestMethod`, secret `swiipt-group-buy-secret-a1b2c3d4`) → **`processed 100, published 88, needsReview 0, rejected 12`.**
- **BUT re-querying `opportunities` STILL shows `false=54, true=0`** — the 88 "published" rows are NOT visible in the SQL editor.
  - Since error-checking would mark a failed insert as `rejected` (not `published`), an insert that returns success (`.select("id").single()` returned an id) yet leaves no visible row strongly implies **the Vercel app writes to a DIFFERENT Supabase project than the SQL editor is querying** (two-database mismatch), OR a trigger removes them. **Leading hypothesis: environment/database mismatch.**
- **NEXT (investigation, no code):** confirm two-DB hypothesis — after a process-queue run, re-check `evidence` status counts in the SQL editor (if unchanged, the app isn't touching this DB); compare Vercel `NEXT_PUBLIC_SUPABASE_URL` against the SQL editor's project ref; check whether the live app feed now shows the 88.

#### Current commit
- **Latest commit:** `d61f5ce` — fix: decouple cover-image generation from process-queue to avoid serverless timeout

### Session 42 — Vercel Stale Code Investigation (✅ RESOLVED 2026-07-11)

- **Date:** July 11, 2026
- **Goal:** Debug why process-queue produces 0 AI-generated opportunities despite all Session 39-41 fixes being deployed.
- **Commits:** `11e203c` (pre-generate UUID), `60be4d3` (debug logging), `c6de43e` (diagnose-insert route), `a215198` (remove diagnose, add version:2), `0893e9b` (vercel.json functions), `53c8977` (maxDuration), `58a8768` (nodejs runtime + version:3)

#### Investigation Steps
1. **UUID pre-generation fix** (`11e203c`): Added `crypto.randomUUID()` to pre-generate `id`, use `publishedOpp?.id ?? oppId` as fallback. Ran process-queue → `published: 33` but `linked_evidence = 0`.
2. **Debug logging** (`60be4d3`): Added `debug_oppId` and `debug_publishedOpp` to `enriched_data` in both Path A and B. Ran reset + process-queue → `enriched_data: {}` (debug fields never appeared — old code running).
3. **Diagnose-insert route** (`c6de43e`): Created standalone diagnostic endpoint to test INSERT+SELECT pattern. Got `405 Method Not Allowed` with `X-Matched-Path: /api/admin/opportunities/[id]` — route not recognized by Vercel build.
4. **Version verification** (`a215198`): Added `version: 2` to process-queue response. Deployed → response had NO `version` field. **Confirmed: Vercel serving stale code.**
5. **Force rebuild attempts:**
   - Added `functions` config to `vercel.json` → build error ("pattern doesn't match any Serverless Functions")
   - Added `export const maxDuration = 60` to route file → still old code
   - Added `export const runtime = "nodejs"` + `version: 3` → still old code

#### Key Findings
- **Vercel is NOT serving latest code changes** despite "Ready" deployments. Multiple attempts with different change types all failed.
- The process-queue function returns different results each run (reads from DB) but uses **old code logic** (`enriched_data: {}`, no `opportunity_id` set).
- New route files (diagnose-insert) are also not picked up by Vercel's build.
- `enriched_data: {}` confirms the evidence update sets `enriched_data: enriched` where `enriched` is an empty AI response object.
- All Session 39-41 fixes (safeType, error checking, cover decoupling, UUID pre-generation) **have NEVER been live** — they were deployed to GitHub but Vercel never served them.

#### Evidence State (July 11)
| enrichment_status | count |
|------------------|-------|
| pending | 1275 |
| enriched | 253 |
| failed | 147 |
| **Total** | **1675** |
| `linked_evidence` | **0** |

#### Root Cause (Confirmed)
The process-queue function that runs on Vercel is a **stale cached version** predating all Session 39-42 code changes. The old code:
- Has no `safeType()` validation
- Has no error checking on INSERT
- Has cover-image generation inline (causing timeouts)
- Sets `enriched_data: enriched` (empty object)
- Does NOT set `opportunity_id`
- Does NOT have UUID pre-generation
- Has no `maxDuration` or runtime config

#### Next Step
Trigger manual redeployment from Vercel dashboard with **"Clear build cache"** option checked.

#### Files Modified in Session 42
| File | Change |
|------|--------|
| `src/app/api/admin/opportunities/process-queue/route.ts` | Added UUID pre-generation (`oppId`), debug logging (`debug_oppId`, `debug_publishedOpp`), `version` field, `maxDuration=60`, `runtime="nodejs"` |
| `vercel.json` | Attempted `functions` config (reverted) |

#### Files Created in Session 42
| File | Purpose |
|------|---------|
| `src/app/api/admin/opportunities/diagnose-insert/route.ts` | Diagnostic INSERT+SELECT test endpoint (deleted — Vercel routing issue) |

---

### Session 43 — Feed Cover Image Rework: Real Photos + Clean Fallback (✅ Rework done, ⚠️ browser render deferred)

- **Dates:** July 11–15, 2026
- **Goal:** Kill the uniform gradient+emoji tiles in the opportunity feed. Show real photos (OG / page hero) where available; clean professional fallback (logo-on-colour or typographic) where not — never a guessed/AI-generated SVG.
- **Commits:** `465d3e9` (2c employer logo via logo.dev name endpoint), `5052f58` (OG-first, branded fallback; drop logo-as-cover + Pollinations), `ba12dab` (proxy external covers via first-party SSRF-guarded route), `c15f947` (stream proxy + redesign FallbackTile + page-hero scraping + drop guessed SVG), `633b427` (backfill paging fix).
- **(Replaces Session 38's 4-layer OG → Logo → AI → Branded cover system — the AI and Branded-SVG layers were removed.)**

#### New cover system
- **`src/lib/og-fetch.ts`** — Enhanced to extract a real **page hero** (not just `og:image`): tries JSON-LD/schema.org `image`, then Twitter large card `twitter:image`, then the first sizeable `<img>` on the page. `ICON_HINTS` filter rejects favicons/icons; `validateImage` rejects images smaller than ~4KB; `absolutize` resolves relative URLs.
- **`src/lib/cover-image.ts`** — `getCoverImage()` now returns the real OG/page-hero URL or `null` with `cover_source:"none"`. **Removed** the guesswork: no `TYPE_COLORS`, no `TYPE_ICONS`, no generated branded SVG (`generateBrandedSVG`/`generateBrandedCover` deleted), no AI (Pollinations) layer.
- **`src/app/api/opportunities/cover/route.ts`** — New first-party cover proxy. `GET ?url=...` SSRF-guards the URL (http/https only; blocks private/loopback/link-local via `dns.lookup`), fetches it, verifies `content-type` is an image, **streams** the upstream body back (fixes the old 4.5MB buffer / function-timeout collapse that silently killed larger OG images), `maxDuration=60`, returns `Cache-Control: public, max-age=86400, immutable` + `Access-Control-Allow-Origin: *`. No response-size cap.
- **`src/components/dashboard/opportunities/FallbackTile.tsx`** — Redesigned. When `logoUrl` present: white chip + logo + title caption on a type-colour background (logo-on-colour). Otherwise: typographic colour card (type gradient + title + org + type/country chip + monogram first letter). **No emoji, no globe icon.**
- **`src/components/dashboard/opportunities/OpportunityCard.tsx`** — `coverSrc` = `/api/opportunities/cover?url=<encoded>` for any http(s) `cover_image_url`. `<img onError>` → single retry (`coverRetry`, appends `&r=`), then renders `FallbackTile` with `title` + `org_logo_url`. (`OpportunityDetailModal.tsx` does not exist; `FallbackTile` is only used in the card.)
- **`src/app/api/admin/opportunities/backfill-covers/route.ts`** — For no-image rows now sets `media_source="fallback"`, `media_type="none"`, `cover_image_url=null` (was leaving them to a guessed SVG). Cursor changed to `.is("media_source", null).order("id").limit(50)` (see bug fix below).

#### Backfill & DB
- Reset all active rows: `UPDATE opportunities SET cover_image_url=NULL, media_source=NULL WHERE status='active'`.
- **Backfill bug** (`c15f947` → `633b427`): the route selected `.is("cover_image_url", null).is("org_logo_url", null)` which kept re-selecting the same null rows forever (count inflated past 2881 with only ~59 getting images). Fixed by filtering on `.is("media_source", null)` so each row is processed once. After the fix, a clean run processed **2881** active rows once and self-terminated with "No opportunities need cover images".
- **Live distribution (sampled 1000 of 2881 active):** **588 real ("fetched") / 412 fallback (null cover) / 0 leftover SVG ≈ 58.8% real, 41.2% clean fallback.** The only upstream source that reliably fails (blocks/timeouts) is `scholarsportal.com` — 2/24 in proxy sampling.

#### Verification performed
- Live proxy (curl) returns valid `image/png` (valid PNG signature, ~235KB) for real covers; 22/24 OK.
- Feed route uses `select("*")` and spreads rows, so `cover_image_url` is in the payload.
- Production client bundle (live chunk `5069-…`) references `proxyRef` + `coverUrlRef`, confirming the proxy code is live.
- Build passed; committed + pushed both `c15f947` and `633b427`; redeployed with **Clear build cache** (Vercel stale-code pattern bit us again — see below).

#### Deferred bug — feed real images not rendering in browser (⚠️ OPEN, paused by user)
- **Symptom:** User confirms gradients/emoji are gone (FallbackTile redesign worked). But NO real images show in the live feed. DevTools → Network shows the `cover?url=` requests return **HTTP 200** (proxy healthy). Desktop shows the typographic monogram tile (green bg); mobile shows the logo-on-colour tile. i.e. the cards render `FallbackTile`, not the `<img>` — for fetched rows the image branch isn't taken / the photo isn't painted.
- **Confirmed NOT the cause:** proxy validity (200 + real PNG), feed payload shape (`select("*")`), production bundle (proxy code live).
- **Leading hypotheses (not yet isolated):** (a) browser ad-blocker/extension matching the `url=` param or upstream domain (`og-images.arbeitnow.com`, etc.); (b) `<img>` layout/CSS (zero height / hidden) so the photo never paints even when requested; (c) `coverFailed` firing in-browser despite a 200 (decode/Content-Length mismatch).
- **User decision:** pause feed work and move to other tasks; revisit later. **Recommended fix when we return:** store images at backfill time and serve an opaque `/media/<id>.jpg` (no upstream URL exposed to the browser → defeats ad-blockers), OR debug the `OpportunityCard` render path / `hasCover` condition.
- **Diagnostic still needed from user:** hard-refresh, DevTools → Network, report status of `cover?url=` requests (200 / blocked / absent); also test incognito with extensions off.

#### Recurring lesson (Vercel stale code — again)
- Every code deploy still requires a **manual Vercel Redeploy with "Clear build cache"**. A plain redeploy served a pre-`c15f947` build (verified via the live client bundle). Logged here so the next session doesn't re-chase it.

#### Files Modified in Session 43
| File | Change |
|------|--------|
| `src/lib/og-fetch.ts` | page-hero extraction (JSON-LD/Twitter/first img), `ICON_HINTS`, `validateImage`, `absolutize` |
| `src/lib/cover-image.ts` | OG→null only; removed `TYPE_COLORS`/`TYPE_ICONS`/generated SVG/AI layers |
| `src/app/api/opportunities/cover/route.ts` | streaming first-party SSRF-guarded cover proxy, `maxDuration=60` |
| `src/components/dashboard/opportunities/FallbackTile.tsx` | logo-on-colour + typographic tiles, no emoji |
| `src/components/dashboard/opportunities/OpportunityCard.tsx` | proxy `coverSrc` + `coverRetry` single retry + `FallbackTile` props (`title`, `logoUrl`) |
| `src/app/api/admin/opportunities/backfill-covers/route.ts` | no-image → fallback/null; `media_source=null` cursor |

---

### Session 44 — Feed Personalization (Fix 1 built, uncommitted)

- **Date:** July 15, 2026
- **Goal:** Implement Fix 1 of the approved feed personalization plan (`reports/findings/feed-personalization-and-ux-plan.md` + addendum). Interest/intent-driven feed across ALL segments (football excluded), learned from dwell/time + search behaviour, re-ranked per-session. Fixes 2 (unending loop), 3 (distinct top match), 4 (hidden scrollbar) are planned but NOT built yet.
- **Approved on defaults:** (a) small segment-self boost ON; (b) recompute both per-session + 6h cron.
- **Global hard exclusion:** `footballer` segment + `sports_trial` type (via `isExcluded()` in the shared scorer). `sports_professional` is NOT excluded.
- **No segment filter** — everyone sees all active opps except football; soft segment-self boost only (+15).

#### Files created / modified
| File | Change |
|------|--------|
| `src/lib/opportunity-feed-score.ts` | NEW shared scorer `scoreOpportunities(opps, ctx)` — football exclusion, soft segment-self boost (+15), ported segment/country/type scores, desired_roles scholarship/job match, suppression, freshness, featured, applied-suppression, source-diversity penalty; returns scored+sorted array |
| `src/app/(dashboard)/dashboard/opportunities/page.tsx` | Rewritten — drops `segment_slug` filter, fetches full active pool, calls `scoreOpportunities` with profile + interestModel + appliedIds, passes ranked `allOpportunities` to `OpportunityFeed` |
| `src/app/api/opportunities/feed/route.ts` | Refactored to use `scoreOpportunities` (removed duplicated scoring); football exclusion in feed mode; keeps search mode; ad injection every 7th |
| `src/app/api/opportunities/compute-interest/route.ts` | Added `INTEREST_TYPE_WEIGHTS` making `dwell_long` (3.0) + `view` (1.5) dominate `apply`/`share` (1.0) — time spent is the dominant signal |
| `src/app/api/opportunities/signal/route.ts` | Added `search: 3.0` to `SIGNAL_WEIGHTS` |
| `src/lib/feed-signals.ts` | NEW client tracker `trackSignal(oppId, type)` — fires signal + triggers per-session recompute after 5 signals |
| `src/app/api/opportunities/recompute-interest/route.ts` | NEW authenticated wrapper — verifies session, calls `compute-interest` (internal secret) server-to-server |
| `src/components/dashboard/opportunities/OpportunityCard.tsx` | All 6 signal calls (view/dwell/apply/save/share/expand) now route through `trackSignal` |
| `src/components/dashboard/opportunities/SearchExplore.tsx` | Search/filter now logs `search` signal via `trackSignal` (so search counts toward per-session recompute) |

#### Notes
- `npm run build` passes (exit 0). Lint-clean (the new route's unused `request` arg renamed to `_request`).
- **Not committed / not deployed.** When deploying, Vercel still requires **Redeploy + Clear build cache** (stale-code pattern recurs — see Session 42/43).
- `compute-interest` produces `user_interest_model`; the feed page re-ranks on `router.refresh()` (triggered on tab refocus in page.tsx) — so per-session recompute shifts the feed when the user returns to the tab.
- Deferred cover-image browser-render bug (Session 43 item 12) still OPEN and unresolved.

---

### Session 45 — Feed UX: Fix 2 (looping feed) + Fix 3 (distinct top matches) + Fix 4 (hidden scrollbar)

- **Date:** July 15, 2026
- **Goal:** Complete Fixes 2-4 of the approved feed personalization plan (`reports/findings/feed-personalization-and-ux-plan.md`). Fix 1 shipped in Session 44 (`8d68bc3`).
- **Fix 2 — Unending/looping feed** (`OpportunityFeed.tsx`): replaced the finite `visible.slice()` + `isDone` hard-stop with a `buildDisplayed(count)` builder that cycles through the ranked pool. `DisplayItem` carries `loopIndex`/`posInLoop`; composite React keys `` `${opp.id}-${loopIndex}` `` avoid collisions; a soft "You're all caught up — more for you" divider renders at the start of each new cycle (`loopIndex > 0 && posInLoop === 0`); sentinel always renders (true infinite loop, safe via unique keys + existing IntersectionObserver recycling).
- **Fix 3 — Distinct top matches** (`OpportunityFeed.tsx`): replaced the single repeated `topMatch` ref with a `useMemo` `topMatches` list (filter `relevanceScore >= 70` `TOP_MATCH_THRESHOLD`, sort desc, dedupe by id, cap `TOP_MATCH_COUNT=8`). Each 5th slot features the next distinct match via `featuredSlotIndex = (index+1)/5 - 1`; stops once all shown once (no repeats). Kept the on-screen collision guard. Labels: "⭐ Top match for your profile" (first) / "✨ Also for you" (subsequent). Single-match case shows once, never repeats.
- **Fix 4 — Instagram-style hidden scrollbar:** dashboard scrolls on the **window** (outer div `minHeight:100vh`, no bounded height, `<main overflowY:auto>` grows to content). Added `.no-scrollbar` utility to `globals.css`; new route-scoped `HideScrollbar.tsx` toggles the class on `document.documentElement` + `<main>` on mount and removes on unmount (rendered from the feed page), so only the opportunities route hides its scrollbar — other dashboard/admin pages keep normal scrollbars. Scrolling stays fully functional.
- **Files:** `src/components/dashboard/opportunities/OpportunityFeed.tsx`, `src/app/globals.css`, `src/components/dashboard/opportunities/HideScrollbar.tsx` (new), `src/app/(dashboard)/dashboard/opportunities/page.tsx`.
- **Build:** `npm run build` → exit 0 (only pre-existing router-dep + affiliate dynamic-server notices). **Not deployed yet at time of writing** — when deploying, Vercel needs **Redeploy + Clear build cache** (stale-code pattern).
- **All 4 feed fixes now complete.** Deferred cover-image browser-render bug (Session 43 item 12) still OPEN.

---

### Session 46 — Non-English opportunity filtering (Step 1 of 2: "filter now")

- **Date:** July 16, 2026
- **Problem:** Users saw opportunities in German and other languages. Root cause: foreign-language ingest sources (notably **Arbeitnow**, a Germany-focused API in `src/lib/api-adapters.ts`, plus EU RSS feeds) and the AI enrich prompt never enforced/translated to English. No `language` column existed anywhere.
- **User decision:** approved **"Filter now + translate later"** (two-step) and approved adding the **`franc`** library. This session did **Step 1 (filter)** only. **Step 2 (AI translation of the enrich prompt + backfill-translate) is NOT done yet.**
- **Dependency:** installed **`franc@5`** (v6 is ESM-only and awkward in Next 14 route handlers; v5 is CommonJS). No bundled types → added ambient `src/types/franc.d.ts`. Calibration: on description-length text franc is accurate (en→eng, de→deu, fr→fra, nl→nld); only very short strings misfire (English→`sco`/`und`). So we treat **`eng`, `sco`, `und` (and NULL) as English/keep**, hide any other confidently-detected language.
- **Files created:**
  - `swiipt/add_opportunity_language.sql` — `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS language TEXT;` + index. **Must be run in Supabase SQL editor.**
  - `src/types/franc.d.ts` — ambient module declaration for franc v5.
  - `src/lib/language.ts` — `detectLanguage()`, `detectOpportunityLanguage(title, desc)` (ISO 639-3 or `und`), `isEnglishCode()`. `MIN_LENGTH=25`; `ENGLISH_CODES={eng,sco,und}`.
  - `src/app/api/admin/opportunities/backfill-language/route.ts` — x-internal-secret + service client; tags rows where `language IS NULL` in batches of 500 (local detection, no network); returns per-language counts. **Run repeatedly until "No opportunities need language detection".**
- **Files modified:**
  - `src/app/api/admin/opportunities/process-queue/route.ts` — both insert paths now write `language: detectOpportunityLanguage(title, description)` so new pipeline items are tagged.
  - `src/lib/opportunity-feed-score.ts` — `isExcluded()` now also drops non-English (`language` set and not in `{eng,sco,und}`) — dependency-free string check, covers page + feed route since both use the shared scorer.
  - `src/app/api/opportunities/feed/route.ts` — added `.or("language.is.null,language.in.(eng,sco,und)")` to BOTH the search query (search bypasses the scorer, so this is essential) and the feed query (payload trim).
  - `src/app/(dashboard)/dashboard/opportunities/page.tsx` — same `.or(...)` filter on the pool query; added `language?` to local `Oppty` interface.
- **Incremental-safe:** filter keeps `language IS NULL`, so nothing disappears until the backfill tags rows; German rows drop out as they're tagged `deu` etc.
- **Build:** `npm run build` → exit 0, franc imports cleanly, backfill route compiled. Not committed/deployed yet.
- **Deploy checklist for this fix:** (1) run `swiipt/add_opportunity_language.sql` in Supabase; (2) deploy with **Redeploy + Clear build cache** (stale-code pattern); (3) POST `/api/admin/opportunities/backfill-language` with `x-internal-secret` header repeatedly until done.
### Session 46 — Step 2 (translate-and-keep) built

- **Goal:** keep good foreign-language opportunities by translating them to English rather than only hiding them.
- **Enrich prompt (new items):** `src/lib/ai/prompts.ts` — added a shared `ENGLISH_RULE` ("translate any non-English field to natural English; every returned field MUST be English") injected into BOTH tiers of `buildProcessQueuePrompt`. So the process-queue pipeline now produces English opportunities going forward; `detectOpportunityLanguage` then tags them `eng`.
- **New `translate` task:** added `"translate"` to the `AIEnrichRequest.task` union (`src/lib/ai/providers/index.ts`) and `buildTranslatePrompt(data)` in prompts.ts — a translate-only prompt (preserve meaning/facts, no summarising) returning JSON `{title, description, organisation, requirements}`. All providers use `buildDefaultPrompt` + JSON parse, so no provider changes were needed.
- **Backfill route:** `src/app/api/admin/opportunities/backfill-translate/route.ts` — x-internal-secret + service client; selects rows where `language` is set and NOT in `(eng,sco,und)` (batch 15, since each row hits the AI); calls `enrich({task:"translate"})`; writes translated title/description/organisation/requirements; **re-detects** the translated text with franc and sets `language='eng'` only if it now reads as English (else keeps the detected code so it's retried next run and stays hidden until it's genuinely English). Guards against empty AI output (counts as failed, row unchanged). Run repeatedly until "No non-English opportunities to translate". **Depends on an active AI provider being configured** (historically flaky pipeline).
- **Build:** `npm run build` → exit 0, `translate` task + backfill-translate route compiled. Not committed/deployed yet.
- **Deploy note:** after the Step 1 filter is live and rows are tagged, run backfill-translate to convert existing `deu`/`fra`/... rows to English (they then reappear in the feed). New pipeline items are English automatically via the enrich prompt.

---

### Session 47 — Feed interaction fixes, ServiceCTA routing, Instagram-style covers, UX polish, cover-tile fix

- **Date:** July 16, 2026
- **Goal:** Fix broken/mismatched feed-card interactions, kill ServiceCTA 404s, make cards Instagram-style, and stop hundreds of cards rendering with no cover. Findings source of truth: `findings/feed-interactions-investigation.md`.
- **Deploy pattern (unchanged):** every code change requires a manual Vercel **Redeploy + Clear build cache** (stale-code pattern; Vercel CLI not authenticated locally, so the user deploys).

#### Feed interaction fixes (commits `fa2e76d`, `fa23662`, `b391fd6`)
- **Fix 1 — Like hydration:** `page.tsx` queries `opportunity_signals` (signal_type='like') → `likedIds`; maps `is_liked` + `like_count`. `OpportunityFeed.tsx` Oppty interface + `feed/route.ts` `hydrateLikes()` on search results. **Decision:** `is_liked` only; `like_count` reflects the user's own state (0/1) because `opportunity_signals` RLS is owner-only (`sprint_19_engagement_sql.sql:73`) — global counts deferred.
- **Fix 3 — Save toggle:** `OpportunityCard.tsx handleSave` sends `saved: next`; `save/route.ts` reads `body.saved` and upserts `is_saved:<bool>` + `saved_at: timestamp|null` (was previously insert-only, couldn't un-save).
- **Fix 4 — Source / Read-full-guide link:** `OpportunityCard.tsx` + `[opportunityId]/page.tsx` link to `application_url` (fallback `source_url`) behind an `^https?://` guard; invalid → plain "Source: {name}" text.
- **Fix 2 — Comment button:** opens the detail page (`router.push('/dashboard/opportunities/{id}')`) — **Option A**. Full comment thread deferred (`opportunity_comments` table exists, RLS enabled but no policies yet).
- **Fix 5 — ServiceCTA 404s:** visa → `/dashboard/services`; scholarship/fellowship/grant → `/dashboard/goals/new?opportunity={id}`; trade_show → `/dashboard/trade-shows`.
- **Option 3 — ServiceCTA label/dest alignment:** scholarship/fellowship/grant checked first (savings-goal label + goals URL); any `VISA_TYPES` match → `/dashboard/services` regardless of country; **removed** the `COUNTRY_SLUGS` map that caused Global fall-through → 404 / disappearing CTA.

#### Instagram-style covers (commits `2e12bad`, `497d6fc`)
- **4:5 media frame:** image / video / `FallbackTile` wrappers set to `aspectRatio: 4/5`.
- **No hard-crop for landscape:** `OpportunityCard.tsx` image branch uses `coverIsPortrait` state + `onLoad` natural-dimension check — portrait images → `4/5` + `object-fit: cover`; landscape/square → natural ratio, `height:auto` (uncropped). Video + `FallbackTile` stay 4:5.

#### UX polish (commit `4c1fb04`)
- **Full-width featured cards:** the "⭐ Top match for your profile" / "✨ Also for you" wrapper had `padding: 0.5rem` on all sides, insetting the featured card ~16px narrower than regular cards. Changed to `paddingTop: 0.5rem` only → featured cards now go edge-to-edge like the rest. (`OpportunityFeed.tsx`)
- **Double auto-refresh fixed:** there were two `router.refresh()` triggers — a mount effect (redundant, page is already SSR-fresh) and the focus effect. Removed the `router.refresh()` from the mount effect (kept `scrollTo(top)`); kept the focus-based auto-refresh only. So returning to the tab refreshes once, not twice. (`OpportunityFeed.tsx`)

#### Cover-tile fix — hundreds of cards showed no cover (commit `a0c2a39`)
- **Root cause:** `OpportunityCard.tsx` gated the entire media zone (video → image → `FallbackTile`) behind `opp.media_type !== "none"`. The Session 43 backfill tagged every no-real-image row `media_type="none"` (+ `media_source="fallback"`, `cover_image_url=null`), so those ~41% of rows (hundreds) skipped the media zone entirely — including the branded `FallbackTile` that was *meant* to render for them — and showed only a tiny org-name header.
- **Frontend fix:** removed the `media_type==="none"` gate so the media zone always renders. `hasCover = cover_image_url && media_source !== "fallback"` still routes no-image rows to `FallbackTile`. Fixes all existing rows instantly, no DB migration. Deleted the now-dead compact-header branch.
- **Backfill correction:** `backfill-covers/route.ts` now tags no-image rows `media_type="image"` (not `"none"`) so future rows are consistent; `media_source="fallback"` remains the flag that selects the FallbackTile.
- **Optional DB cleanup (not required for the fix):** `UPDATE opportunities SET media_type='image' WHERE media_source='fallback' AND media_type='none';`

#### Session 47 commit log (on `main`)
| Commit | What |
|--------|------|
| `cbc1248` | Session 46 language filter + translate-hidden (Step 1/2) |
| `fa2e76d` | Fix 1 (like hydration) + Fix 3 (save toggle) + Fix 4 (source link) + Fix 2 (comment → detail) |
| `fa23662` | Fix 5 — ServiceCTA 404 routing |
| `b391fd6` | Option 3 — ServiceCTA label/dest alignment, removed COUNTRY_SLUGS |
| `2e12bad` | Feed cards → 4:5 media frame |
| `497d6fc` | Landscape covers uncropped (portrait 4:5 cover, landscape natural ratio) |
| `4c1fb04` | Full-width featured cards + fix double auto-refresh |
| `a0c2a39` | Always render cover tile (FallbackTile for no-image rows) + backfill correction |

#### Still OPEN after Session 47 (resolved/advanced in later sessions)
- **Deferred cover browser-render bug (Session 43 item 12):** ✅ RESOLVED in P0#7 — covers now stored in Supabase Storage bucket `opportunity-covers` and served first-party (opaque `/opportunity-covers/...` path); ad-blockers/hotlink protection can no longer suppress them. `OpportunityCard.tsx` serves stored covers directly; only non-stored external URLs proxy through `/api/opportunities/cover`.
- **Comment thread (Fix 2 Option A only):** `opportunity_comments` UI + RLS policies not built.
- **Global like counts:** deferred pending non-owner-readable count source for `opportunity_signals`.

---

### Session 48 — P0 Pipeline Quality Hardening (BUILT 2026-07-17)

- **Goal:** Fix ingestion pipeline quality/relevance gaps from `findings/ingestion-pipeline-quality-and-feed-engagement-audit.md` §1.1–§1.8 (NOT feed-engagement or user-submission items — those deferred).
- **Approach:** Source-registry fix = (B) quick-fix now + (A) build real scrapers as follow-up. The 14 valuable `trusted` sources are NOT disabled forever — they were flagged `source_status='pending_scraper'` (rows preserved) pending real scrapers (which landed in Session 49 as P0#1a).
- **What was built (code + SQL migrations in `swiipt/`):**
  1. **P0#1 Source registry integrity** — `swiipt/p0_1_source_registry_integrity.sql` flags the 14 adapter-less sources `pending_scraper`; `swiipt/p0_1_followup_scrapers.sql` lists them as follow-up (flip back to `active` per-source). Ingest route now skips non-`active` sources.
  2. **P0#2 Expiry & freshness** — `swiipt/p0_2_expiry_freshness.sql` adds `expire_stale_opportunities()` (deadline+7d grace, or 120d TTL for no-deadline) + daily pg_cron. Feed already filters `is_active=true`, so expired rows auto-drop.
  3. **P0#3 Quality gate** — `swiipt/p0_3_quality_gate_columns.sql` adds `ai_quality_score`/`is_scam_risk`/`quality_reason`. `process-queue/route.ts` runs `evaluateQuality()` on EVERY item (spam-pattern rejection, strengthened mechanical gate: title>15, desc>80, valid http(s) URL, org required for trusted), rejects <0.4, queues 0.4–0.6 to **real review** (`needs_review`, not "failed"), publishes ≥0.6. `review_all` tier now also routes to real review queue (was misrouted to "failed").
  4. **P0#4 Cross-source dedupe** — `swiipt/p0_4_cross_source_dedupe.sql` adds `normalized_url` (strips trackers, lowercases host, http→https) on `evidence`+`opportunities` + `normalize_url()` SQL fn + backfill. New `src/lib/url-normalize.ts` mirrors it; ingest + process-queue dedupe on `normalized_url`.
  5. **P0#5 Language integrity** — `swiipt/p0_5_language_integrity.sql` ensures `language` column + adds generated `is_non_english` flag + index. `src/lib/language.ts` adds a non-English stopword backstop. Feeds filter on `is_non_english`.
  6. **P0#6 Two-DB integrity verify** — Diagnostic only (`findings/p0_6_two_db_integrity_verification.md`). Confirm Vercel `NEXT_PUBLIC_SUPABASE_URL` == SQL-editor project ref (`frmvjjgblbapdjgszvdi`).
- **Commit:** `84112be` (P0 pipeline quality hardening). Most P0 SQL files remain UNRUN at time of writing.

### Session 49 — P0#7 Cover Storage + P0#1a Generic Scrapers + AI Provider Chain (2026-07-17 → 07-18)

- **P0#7 Cover Storage (fixes Session 43 browser-render bug):** New Supabase Storage bucket `opportunity-covers` (public). Covers stored at backfill time; `OpportunityCard.tsx` serves stored covers first-party via opaque `/opportunity-covers/...` so ad-blockers/hotlink protection can't suppress them. Non-stored external URLs still proxy through `/api/opportunities/cover`. Backfill cursor advances via `cover_stored_at`. SQL: `swiipt/p0_7_cover_storage_bucket.sql`, `swiipt/p0_7_cover_cursor_column.sql`. Backfill script: `swiipt/run_backfill_covers.ps1`. Commits `695d54c` (store in Storage), `a9b5c30` (cursor picks up fetched external covers), `420b7a8` (backfill cursor fix), `a9b5c30`.
- **P0#1a Generic HTML Scrapers (unblocks the 14 silent `trusted` sources):** New `src/lib/html-extractor.ts` (dependency-free: JSON-LD → OG/Twitter meta → `<h1>`/`<p>`, deadline regex, sub-link discovery, 15s timeout, SwiiptBot UA) + `src/lib/scraper-adapters.ts` wrapper. Ingest route (`ingest/route.ts`) now dispatches `source_type='scraper'` (added to the active-source filter `.in("source_type", ["rss","api","scraper"])`). `version:4` added to ingest response to confirm the scraper build is live. SQL `swiipt/p0_1a_register_scrapers.sql` activates DAAD, Chevening, Commonwealth, NHS Jobs International, Make It In Germany, Canada IRCC Express Entry, UAE Golden Visa News, LinkedIn Nigeria Remote, TransferMarket Africa Trials (scraper) + 5 RSS + 3 JSON-API sources. **Gotcha:** the first version of that SQL missed `is_active=true` (ingest silently skipped all scrapers → 0 web evidence); fixed in `86ec4c4`. Commits `7dce61c` (scraper), `0a29f48` (version:4), `86ec4c4` (is_active fix).
- **AI Provider chain hardening (commits `0e4f49d`→`589e9be`, 2026-07-18):**
  - `src/lib/ai-service.ts` `enrich()`: supports per-row `model` from `ai_providers`; retries the WHOLE provider chain with exponential backoff (8s→16s→32s→64s, up to 4x) when EVERY provider is only rate-limited (HTTP 429) so backfills drain without manual re-runs; never throws.
  - Adapters `opencode.ts` / `openrouter.ts` try several free models in order on 429/empty response (4-deep chain: `deepseek-v4-flash-free` → `mimo-v2.5-free` → `north-mini-code-free` → `hy3-free`). Per-row model override via `OPENCODE_MODEL` / `OPENCODE_MODELS` / `OPENROUTER_MODEL` env vars.
  - Empty/parsed-empty AI responses now treated as failure (fall through to next provider) instead of silently returning nothing.
  - **OmniRoute DISABLED** (`swiipt/p0_ai_disable_omniroute.sql`) — self-hosted gateway, always "fetch failed" without `OMNIROUTE_URL`.
  - `swiipt/p0_register_free_providers.sql` updates the 3 working provider rows to current free models (`gemini-2.0-flash-001`, `openai/gpt-oss-20b:free`, `deepseek-v4-flash-free`) + priorities (opencode 10 / gemini 20 / openrouter 30 / deepseek 40 / qwen 50 / omniroute 60). `swiipt/fix_provider_priority.sql` also present. Commit `589e9be`.
  - **Status:** All these SQL files are UNRUN; all providers need API keys in Vercel env (`GEMINI_API_KEY`, etc.). Without a key, `enrich()` has no provider — pipeline still publishes via mechanical fallbacks, but `translate` backfill fails 100%.
- **Current HEAD at time of writing:** `589e9be` (fix(ai): update stale ai_providers models + priorities).

---

## 12. PENDING / FUTURE BUILD

### Sprint 19 SQL Migrations (10 files — run in order)
- **Order matters.** Run in Supabase SQL Editor in the sequence listed in `reports/sprint_19_complete_walkthrough.md` §15.
- Files: `sprint_19_pre_data_driven_types.sql`, `sprint_19_media_system.sql`, `sprint_19_engagement_sql.sql`, `sprint_19_pipeline_sql.sql`, `sprint_19_phase2_ai_providers_seed.sql`, `sprint_19_feed_ads.sql`, `sprint_19_seed_sources.sql`, `sprint_19_seed_opportunities.sql`, `sprint_19_seed_additional_sources.sql`, `sprint_19_cron_compute_interest.sql`

### Evidence-First SQL Migrations (20+ files — run in order)
- **Order matters.** Run in Supabase SQL Editor in phase order.
- **Phase 2:** `phase2_evidence_table.sql`, `phase2_10_migrate_queue_to_evidence.sql`
- **Phase 4:** `phase4_add_watcher_type.sql`, `phase4_seed_watcher_sources.sql`, `phase4_watcher_table.sql`, `phase4_watcher_cron.sql`
- **Phase 5:** `phase5_scale_sources.sql`
- **Phase 7:** `phase7_extended_type_sources.sql`
- **Phase 9:** `phase9_pipeline_automation.sql`, `activate_pg_cron.sql`
- **Phase 10:** `phase10_concurrency_rate_limit.sql`
- **Health:** `health_monitoring.sql`
- **Extended Types:** `extend_opportunity_types.sql` (already run), `fix_opportunities_type_check.sql`
- **Partners:** `gap2_5_partner_submissions.sql`
- **Seed:** `seed_real_opportunities.sql`
- **Verification:** `VERIFY_ALL_SETUP.sql`, `verify/01-11_*.sql`

### Dashboard Home Restructure (Feed as Primary Screen)
- **Plan file:** `docs/sprint_17_18_priority_order.md` (lines 29-50)
- **Change:** After login, users who completed career profile onboarding land on `/dashboard/opportunities` (feed) instead of `/dashboard` (metrics home). Users who haven't completed onboarding land on `/dashboard/opportunities/onboarding`.
- **File to modify:** `src/middleware.ts` — add post-login routing logic after auth confirmation
- **Existing dashboard home moves to:** `/dashboard/home`
- **Status:** Planned, not built

### Trade Show Group Booking Phase (Paused — Validate with users first)
- **Plan file:** `reports/sprint_16_trade_show_booking_flow_analysis.md`
- **When to build:** After validating the savings model works for real trade show groups
- **Flow:** `funded → booking → confirmed → completed`
- **Admin action:** "Initiate booking" on a funded group → deducts from all funded members' goals via `deduct_goal_balance` (existing pattern from holiday/service flows) → creates document requests → moves group to `booking` status
- **Direct pay option:** For members who don't save (late joiners, cash-rich, corporate). Deposit not linked to a goal; admin marks as paid manually. Add later, not MVP.
- **Active Applications:** When built, trade show bookings **must** appear under the "Active Applications" section on the dashboard home feed (alongside service orders and holiday bookings). The dashboard home page will need to query `trade_show_groups` where the user is a member and status is `booking` or `confirmed`.
- **Money while sitting:** Locked savings goals (`is_locked = TRUE`) count toward `wallets.total_locked_ngn` (treasury float). Members cannot withdraw. Admin can cancel and funds remain in goals.

### Group Buy ⏱→✅ Transition
- **Plan file:** `reports/group-buy-pending-confirmed-transition-plan.md`
- **Files to modify:**
  - `src/components/dashboard/groups/GroupBuyPaymentModal.tsx` — Add `confirmed`, `adminConfirmed` states; Realtime subscription; polling fallback; update `ConfirmationStep` UI to show ⏱/✅
  - `src/components/dashboard/groups/GroupDetailActions.tsx` — Fix `createClient()` in component body (same pattern as Session 21)
- **Pattern to follow:** Holiday flow (`HolidayBookingFlow.tsx` lines 24-76 for state + effects; lines 180-203 for conditional UI)

### Sprint 18 Upgrade Path — Replace Temporary Opportunity Count Formula ✅ DONE
- The temporary formula `Math.round((score / 100) * 35)` has been replaced with a real `user_opportunity_feed` count query. `OpportunityScore` now receives `opportunityCount` as a prop from both the home page and the layout (for sidebar). No further action needed.

### Affiliate Management — Operational Items Remaining
- **Env vars:** Set up any required environment variables for affiliate system (check `.env.example` for new vars added in Sessions 30-32)
- **pg_cron SQL:** Run pg_cron SQL for affiliate-related automation (if applicable — check `admin_affiliates_phase_a.sql`)
- **End-to-end testing:** Test full affiliate flow: signup → referral → commission → withdrawal request → admin approval
- **Status:** Code complete (Sessions 30-32), ops not verified

### Evidence-First — Operational Items Remaining
- **SQL migrations:** Run all 20+ SQL files in Supabase SQL Editor in phase order
- **Vercel stale serverless code (RESOLVED in Session 42, RECURS in Session 43)** — Session 42 was fixed by promoting `ac9aee0` to Production; the process-queue fixes are now live (`ai_generated=true` reached 258). The same stale-build pattern recurred in Session 43 — a plain redeploy served a pre-`c15f947` build until we used **Redeploy + Clear build cache**. Rule of thumb: after ANY code change, force a clean Vercel redeploy or the old build stays live.
- **Provenance integration:** Wire `ProvenanceViewer.tsx` into admin opportunity detail page
- **Testing:** Test ingest → evidence → process-queue → opportunities pipeline end-to-end
- **Status:** Code complete (Session 38), pipeline fix blocked by Vercel stale code (Session 42)

### P0 Pipeline Quality Hardening (Sessions 48 — 2026-07-17) ✅ BUILT, PENDING DEPLOY + SQL RUN
- **Goal:** Fix the ingestion pipeline quality/relevance gaps from `findings/ingestion-pipeline-quality-and-feed-engagement-audit.md` §1.1–§1.8 (NOT the feed-engagement or user-submission items — those deferred).
- **Approach approved by user:** Source-registry fix = **(B) quick-fix now + (A) build real scrapers as follow-up**. We do NOT disable the 14 valuable sources forever — they are flagged `source_status='pending_scraper'` (rows preserved) and scheduled for real scrapers.
- **What was built (code + SQL migrations in `swiipt/`):**
  1. **P0#1 Source registry integrity** — `swiipt/p0_1_source_registry_integrity.sql` flags the 14 adapter-less sources `pending_scraper`; `swiipt/p0_1_followup_scrapers.sql` lists them as a follow-up build (flip back to `active` per-source as each scraper lands). Ingest route now skips non-`active` sources.
  2. **P0#2 Expiry & freshness** — `swiipt/p0_2_expiry_freshness.sql` adds `expire_stale_opportunities()` (deadline+7d grace, or 120d TTL for no-deadline) + daily pg_cron. Feed already filters `is_active=true`, so expired rows auto-drop.
  3. **P0#3 Quality gate** — `swiipt/p0_3_quality_gate_columns.sql` adds `ai_quality_score`/`is_scam_risk`/`quality_reason`. `process-queue/route.ts` now runs `evaluateQuality()` on EVERY item (spam-pattern rejection, strengthened mechanical gate: title>15, desc>80, valid http(s) URL, org required for trusted), rejects <0.4, queues 0.4–0.6 to **real review** (`needs_review`, not "failed"), publishes ≥0.6. `review_all` tier now also routes to real review queue (was misrouted to "failed").
  4. **P0#4 Cross-source dedupe** — `swiipt/p0_4_cross_source_dedupe.sql` adds `normalized_url` (strips trackers, lowercases host, http→https) on `evidence`+`opportunities` + `normalize_url()` SQL fn + backfill. New `src/lib/url-normalize.ts` mirrors it; ingest + process-queue dedupe on `normalized_url` (catches same job across Himalayas/RemoteOK/etc.).
  5. **P0#5 Language integrity** — `swiipt/p0_5_language_integrity.sql` ensures `language` column + adds generated `is_non_english` flag + index. `src/lib/language.ts` adds a non-English **stopword backstop** so short German/French titles franc returns as `und` are still caught. Feeds filter on `is_non_english`.
  6. **P0#6 Two-DB integrity verify** — Diagnostic only (`findings/p0_6_two_db_integrity_verification.md`). User must confirm Vercel `NEXT_PUBLIC_SUPABASE_URL` == SQL-editor project ref (`frmvjjgblbapdjgszvdi`). No code.
- **P0#7 Cover Storage (BUILT in Session 49):** Covers stored in Supabase Storage bucket `opportunity-covers` (public) and served first-party via opaque `/opportunity-covers/...` path — defeats ad-blockers/hotlink protection (the root cause of the Session 43 browser-render bug). `OpportunityCard.tsx` detects stored covers (`cover_image_url.includes("/opportunity-covers/")`) and serves them directly; only non-stored external URLs proxy through `/api/opportunities/cover`. Backfill cursor advances via `cover_stored_at`. SQL `swiipt/p0_7_cover_storage_bucket.sql` + `swiipt/p0_7_cover_cursor_column.sql` (UNRUN). Backfill script: `swiipt/run_backfill_covers.ps1`.
- **Deploy checklist (user deploys — Vercel CLI not authed locally):**
   1. Run SQL in order: `p0_1_source_registry_integrity.sql`, `p0_2_expiry_freshness.sql`, `p0_3_quality_gate_columns.sql`, `p0_4_cross_source_dedupe.sql`, `p0_5_language_integrity.sql` (all idempotent, Supabase SQL Editor).
   2. **Redeploy + Clear build cache** (stale-code pattern — see §11 note).
   3. Run `SELECT expire_stale_opportunities();` once to clean existing stale rows.
   4. Run `findings/p0_6_two_db_integrity_verification.md` checks.
   5. Re-run ingest + process-queue; verify `ai_generated` count + `enrichment_status` distribution.

### FUTURE BUILD: User-Submitted Opportunities (NOT built — do not forget)
- **Decision (2026-07-17):** Deferred. Only a B2B **partner** submission exists today (`partner_submissions` table + `POST /api/opportunities/submit`, API-key auth). There is **NO logged-in-user submission** feature.
- **What is missing:** (a) `opportunity_submissions` (user) table (mirror `partner_submissions` + `user_id` + `ai_quality_score` + `rejection_reason`); (b) session-auth submit API `POST /api/opportunities/user-submit` (validate title/description/url, rate-limit per user, dup-URL + banned-domain checks); (c) QC via the existing `buildPublicSubmissionPrompt` (prompts.ts:119) → auto-publish if score high, else `needs_review`; (d) dashboard UI "＋ Share an opportunity" modal; (e) admin review in existing `admin/opportunities/queue`; (f) "Shared by {name}" attribution on cards (fuels social feed).
- **Note:** Nothing currently promotes ANY submission (partner or user) into `opportunities` — that promotion flow is also missing and must be built with this.
- **Source of truth:** `findings/ingestion-pipeline-quality-and-feed-engagement-audit.md` §3.

### MUST BUILD: Admin Custom Cover Image Upload (Priority 10)
- **Status:** Schema ready, UI/API not built. DO NOT forget this.
- **Why it exists:** The `media_source` CHECK constraint includes `'custom'` (reserved for admin manual image override). The `OpportunityCard.tsx` rendering already handles `custom` correctly (`hasCover = cover_image_url && media_source !== "fallback"` — `custom` passes). The schema and rendering are ready; only the admin UI and API layers need to be built.
- **Two implementation options:**

#### Option A — URL Paste (Recommended, ~68 lines, 4 files)
Surgical, no new infrastructure. Admin pastes an image URL (Imgur, company CDN, etc.).

| # | File | Change | Lines |
|---|------|--------|-------|
| 1 | `src/components/admin/opportunities/CreateOpportunityForm.tsx` | Add `coverImageUrl` state + optional URL input field + pass to JSON body | ~15 |
| 2 | `src/components/admin/opportunities/EditOpportunityForm.tsx` | Add `coverImageUrl` state + URL input with current value + image preview + clear button + pass to JSON body | ~30 |
| 3 | `src/app/api/admin/opportunities/create/route.ts` | Check `body.cover_image_url` before calling `getCoverImage()`. If provided, write directly with `media_source = "custom"` and skip auto-generation | ~8 |
| 4 | `src/app/api/admin/opportunities/[id]/route.ts` | Add `"cover_image_url"` to `allowedFields` array. When `body.cover_image_url` present, write directly with `media_source = "custom"` and skip auto-regeneration. When empty string sent, revert to auto-generation (`shouldRegenerateCover = true`) | ~15 |

**Key logic for create/route.ts:**
```typescript
// After opportunity insert, before getCoverImage() call:
if (body.cover_image_url) {
  await (supabase as any)
    .from("opportunities")
    .update({ cover_image_url: body.cover_image_url, media_source: "custom", media_type: "image" })
    .eq("id", data.id);
  return NextResponse.json({ success: true, id: data.id });
}
```

**No SQL migrations needed.** `custom` is already in the CHECK constraint. `cover_image_url` column already exists.

#### Option B — Direct File Upload (~200 lines, 6+ files)
Full file upload with Supabase Storage. More complex but allows drag-and-drop.

| # | File | Change | Lines |
|---|------|--------|-------|
| 1 | New Supabase Storage bucket | `cover-images` bucket with public read policies | SQL setup |
| 2 | New `src/app/api/admin/opportunities/upload-cover/route.ts` | POST route: accept multipart form, upload to `cover-images` bucket, return public URL | ~40 |
| 3 | `src/components/admin/opportunities/CreateOpportunityForm.tsx` | Add file input with drag-and-drop, upload on select, store URL in state | ~30 |
| 4 | `src/components/admin/opportunities/EditOpportunityForm.tsx` | Same file input + current image preview + remove button | ~40 |
| 5 | `src/app/api/admin/opportunities/create/route.ts` | Same as Option A — check `body.cover_image_url` | ~8 |
| 6 | `src/app/api/admin/opportunities/[id]/route.ts` | Same as Option A — add to allowedFields | ~15 |

**Recommendation: Build Option A first.** It covers 90% of use cases. Option B can be added as a follow-up if direct file upload is needed.

### DEFERRED REMINDER: AI Provider Key Needed for Translation (do not forget)
- **Date flagged:** 2026-07-17 (P0 pipeline verification); still relevant after Session 49.
- **Status:** DEFERRED by user — leave as-is for now; pipeline + feed are working without it (mechanical fallbacks publish English-sourced items).
- **Symptom observed:** `backfill-translate` returns `translated=0 failed=15` on every call; `ai_generated` + English feed rows are fine, but **~2,752 non-English opportunities (2743 `deu`, plus spa/por/fra/etc.) stay hidden** from the feed via the `is_non_english` filter (P0#5).
- **Root cause:** Provider rows are `is_active=true` but have **no API key** in Vercel env (`GEMINI_API_KEY` etc.), so `enrich()` has no working provider. `process-queue` still publishes because it uses mechanical fallbacks (no AI needed); `translate` REQUIRES an AI call and fails 100%. OmniRoute is DISABLED (self-hosted gateway, no URL). The active fallback chain is opencode (primary, free) → gemini → openrouter → deepseek/qwen (all need keys).
- **To re-enable later (recovers ~2,752 feed rows):** add ONE provider key to Vercel env + run the provider/SQL setup, then re-run the translate backfill:
   1. First run `swiipt/p0_register_free_providers.sql` + `swiipt/p0_ai_disable_omniroute.sql` in Supabase (sets current free models + priorities, disables OmniRoute).
   2. Get a free key: https://aistudio.google.com/apikey (Gemini); or any OpenCode Zen / OpenRouter free key.
   3. Vercel dashboard → Settings → Environment Variables → add the matching key (`GEMINI_API_KEY`, `OPENCODE_API_KEY`, `OPENROUTER_API_KEY`, etc.).
   4. Redeploy (any commit) with **Clear build cache** (env baked at build time).
   5. `cd C:\Users\User\Desktop\Swiipt\Swiipt\swiipt; .\run_backfill_translate.ps1`
- **Verify after:** `SELECT is_non_english, count(*) FROM opportunities GROUP BY is_non_english;` — `true` count should drop sharply as rows become `eng`.
- **Note:** This is the ONLY blocker to showing non-English-sourced opportunities. Nothing else is broken.

## 14. SESSION 50 — THROUGHPUT ROOT CAUSE (2026-07-19) — user complaint: 20 working sources produce only ~27 new opps in 15h

### The actual problem (not translate, not dead URLs)
- User's real concern: scrapers used to fetch ~1000/day; with 20 working sources they now get only ~27 NEW opportunities in 15 hours. Prior sessions over-diagnosed side quests (translate, dead URLs, dedupe) and missed the core throughput collapse.
- `diag_feed_visible.sql` result: **opportunities = 5,020 total, feed_visible (is_active + not non_english + language in eng/sco/und) = 1,294.** So data exists; the pipe is throttled, not empty.

### ROOT CAUSE — ingest circuit breaker + cooldown (src/app/api/admin/opportunities/ingest/route.ts)
1. **Permanent circuit break:** old `isCircuitOpen()` returned true if `is_degraded` (set after 5 consecutive errors). Degraded NEVER reset, so any flaky source was **silently skipped forever** → sources died one by one → throughput collapsed to a trickle.
2. **6h cooldown** per source (`pull_frequency_hours || 6`) capped each source at 4 pulls/day regardless of health.

### FIXES APPLIED (session 50 — code committed `a45f6d5`, pushed to main)
- `isCircuitOpen()` rewritten to be **time-based**: now only skips a source if it has >=3 errors AND the last error was within the last 1h. Degraded sources recover automatically after the cooldown instead of being permanently disabled.
- Cooldown capped at **1h** (`Math.min(pull_frequency_hours || 6, 1)`) so healthy sources are re-pulled ~24x/day.
- Added `last_error_at` to the `SourceRecord` TS interface (the DB column already existed; the interface omitted it — that was the only type error).
- SQL file `swiipt/p0_reset_source_throttle.sql` was written but **FAILED to run** (see "USER RUN ATTEMPT" below) — it references `is_degraded` which does NOT exist on `opportunity_sources`.

### USER RUN ATTEMPT (2026-07-19, afternoon) — what actually happened
- **Deploy status: UNKNOWN.** User did NOT confirm a Redeploy + Clear build cache was done. The code fix may or may not be live.
- `.\run_ingest.ps1` output: `ingested=4, version=4, sources_processed=109, items_found=527, items_per_minute=1, error_rate_pct=11`.
  - **Only 4 new opportunities ingested**, and only 109 of ~157 sources were even *processed* (the rest were skipped by cooldown/circuit/rate-limit). `items_per_minute=1` shows the run was crawling, not parallelised.
  - **NOTE:** `version=4` confirms the P0#1a scraper build (Session 49) is live, but does NOT confirm the Session 50 circuit-breaker fix is live (no version bump was added for it).
- `.\run_process_queue.ps1` output: `attempt 1: processed=4 published=0 rejected=0 needsReview=4` → `attempt 2: processed=0 ...` → DONE. So process-queue only saw 4 items and published ZERO (4 went to review). This means the volume problem is upstream (ingest), NOT process-queue.
- `swiipt/p0_reset_source_throttle.sql` **FAILED**:
  ```
  Failed to run sql query: ERROR: 42703: column "is_degraded" of relation "opportunity_sources" does not exist
  LINE 11:     is_degraded = false,
  ```
  - **KEY DISCOVERY:** `opportunity_sources` has NO `is_degraded` column. The ingest code (line 22 `is_degraded: boolean` in `SourceRecord`, line 185 `is_degraded: shouldDegrade` on update) writes/reads a column that does not exist in the DB — so either (a) the ingest code was never run against this schema, or (b) a migration creating `is_degraded`/`consecutive_errors`/`last_error`/`last_error_at` was never applied. **This means the circuit-breaker logic in the code references columns that may not exist on the live table** — a likely cause of the throttle/crawl behaviour. The actual throttle columns need verification against the live schema before any fix can be trusted.

### ACTION REQUIRED (user must run — these are NOT done automatically)
1. **Verify the live `opportunity_sources` schema** — run in Supabase:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name='opportunity_sources' ORDER BY ordinal_position;
   ```
   Confirm whether `consecutive_errors`, `last_error`, `last_error_at`, `is_degraded`, `pull_frequency_hours`, `last_pulled_at` actually exist. The fix code assumes they do; the failed SQL proves `is_degraded` does NOT.
2. **Redeploy with "Clear build cache"** so the Session 50 circuit-breaker fix is actually live (unknown if done).
3. If columns are missing, **run the missing migration** that adds them (the ingest route cannot throttle correctly without `consecutive_errors`/`last_error_at`). Without these, the circuit breaker is a no-op or erroring.
4. Fix `swiipt/p0_reset_source_throttle.sql` to only UPDATE columns that exist (drop `is_degraded` if absent; or add it via migration first).
5. Re-run `.\run_ingest.ps1` then `.\run_process_queue.ps1`. Expect far more than 4 if the throttle is truly fixed.

### Still separate / unresolved
- **Schema/code mismatch is the prime suspect now.** The ingest route's `SourceRecord` and its UPDATEs assume columns (`is_degraded` proven missing, possibly others) that were never migrated to `opportunity_sources`. Any helper assuming these columns (auto-downgrade route, health route) is also at risk.
- Translate backfill (non-English → eng): **German done** (3,092 items, Session 51). **128 non-German items remain** (spa/fra/por etc.) — run `swiipt/run_translate_local.ps1` again to finish (it translates any remaining `is_non_english = true` rows regardless of language code).
- `p0_deactivate_dead_sources.sql` (XPRIZE/Lanyrd/500 Startups/Nomad List/Erasmus/Grants.gov) and `p0_disable_dead_providers.sql` (gemini/openrouter) still need manual SQL run in Supabase.

## 15. SESSION 51 — GERMAN TRANSLATION BACKFILL (2026-07-20)

**Goal:** Translate 3,092 hidden German (`deu`) opportunities to English and make them feed-visible.

### The Problem (real root cause of prior failures)
- `swiipt/run_backfill_translate.ps1` called `www.swiipt.com/api/admin/opportunities/backfill-translate` — a Vercel serverless function with **no working AI provider key** in Vercel env and **60s Hobby plan timeout**.
- The Vercel route calls `enrich()` which needs a configured AI provider with keys. No keys = no translations. Even if keys existed, 15 items per batch at 5-30s each would time out.
- The errors "failed=15" were the function timing out or the AI provider failing, not a problem with the items.

### Solution: Local PowerShell via OpenCode API
Wrote `swiipt/run_translate_local.ps1` — a standalone script that:
1. **Fetches** items from Supabase via Management API SQL endpoint (SELECT)
2. **Translates** via OpenCode API (`mimo-v2.5-free` model, batch of 6, `max_tokens=4000`, ~6s/call)
3. **Updates** via Supabase Data API REST PATCH (sets `language='eng'`, omits `is_non_english` which is a generated column)

### Key Details
- **Model:** `mimo-v2.5-free` via `https://opencode.ai/zen/v1/chat/completions` with OpenCode API key
- **Batch size:** 6 titles per call (tested: 6.2s for 6 titles vs 4.6s for 3 — 2x throughput for 35% more time)
- **Rate:** ~18 items/min, ~3,092 items in ~3 hours (across 3 runs due to bash tool timeout)
- **Success rate:** ~97.5% (77 failures out of 3,092 — typically single chars returned by model edge case)
- **Feed impact:** `is_active=true AND is_non_english=false` went from ~1,294 → **4,412** (3.4x increase)

### DB Update Approach (critical — don't use Management API SQL for writes)
- **SELECT:** Supabase Management API `POST /v1/projects/{ref}/database/query` — works fine
- **UPDATE:** Does NOT work via Management API (returns 400 with empty body for UPDATE/INSERT)
- **PATCH:** Use Supabase Data API REST `PATCH /rest/v1/opportunities?id=eq.{id}` with service role key — works (returns 204)
- **Generated column:** `is_non_english` is a generated column — omit it from PATCH body. Setting `language='eng'` auto-computes `is_non_english=false`.
- **JSON escaping:** Must manually construct JSON string (PowerShell `ConvertTo-Json` escapes single quotes as `\u0027` which breaks SQL). Escape backslashes first, then double quotes.

### Script Location
`C:\Users\User\Desktop\Swiipt\Swiipt\swiipt\run_translate_local.ps1`

To re-run for remaining items (128 non-German non-English):
```powershell
cd Swiipt\swiipt
.\run_translate_local.ps1
```

### Remaining
- **128 items** in spa/fra/por etc. still hidden. The script is language-agnostic — it translates whatever has `is_non_english = true`. Just re-run it.

## 16. SESSION 52 — 5 NEW DEDICATED SCRAPERS (2026-07-20)

**Goal:** Build dedicated scrapers for 5 underserved opportunity types — grants, scholarships, trade shows, exchanges, and training — to shift the feed ratio from ~92% jobs toward 40–50% non-job content across 21 opportunity types.

### Background
- The P0#1a generic HTML extractor (`html-extractor.ts`) works but produces shallow results (JSON-LD → OG meta → h1 fallback).
- 5 high-value sources were identified: Grants.gov (grant), Scholarships.com (scholarship), 10times Events (trade_show), Erasmus+ Programme (exchange), Coursera Free Courses (training).
- The user approved building dedicated scrapers for these sources.

### Pre-Build Research Findings
| Source | Target URL | Status | Result |
|--------|-----------|--------|--------|
| **Grants.gov** | `/search-grants` | ✅ Accessible (41KB) | Server-rendered HTML with grant listing links |
| **Scholarships.com** | `/` | ❌ Cloudflare-blocked | Used alternative: `internationalscholarships.com` (✅ 50KB, Yii2 PHP site) |
| **10times Events** | `/events` | ❌ 403 Forbidden | Used alternative: `eventseye.com/fairs/d1_trade-shows_august_0.html` (✅ 48KB, clean `<table class="tradeshows">`) |
| **Erasmus+ Programme** | `/programme-guide/...` | ❌ Connection closed | Used `/opportunities` page (✅ 191KB, accessible) |
| **Coursera Free Courses** | `/courses?query=free` | ✅ Accessible (840KB) | React SSR with `__NEXT_DATA__` JSON embedded |

### Files Created
| File | Type | URL | Approach |
|------|------|-----|----------|
| `src/lib/scrapers/grants-gov.ts` | grant | `grants.gov/search-grants` | HTML link + card extraction, opportunity number parsing |
| `src/lib/scrapers/scholarships-com.ts` | scholarship | `internationalscholarships.com` | Multi-source (Intl Scholarships + Scholarships.com fallback), detail follow for deadlines |
| `src/lib/scrapers/10times.ts` | trade_show | `eventseye.com/fairs/...` (primary) + `10times.com` (fallback) | Clean `<table class="tradeshows">` parsing with name/desc/venue/date columns. Eventseye has 400–1,600+ trade shows/month |
| `src/lib/scrapers/erasmus-plus.ts` | exchange | `erasmus-plus.ec.europa.eu/opportunities` | Link + card extraction from 191KB page |
| `src/lib/scrapers/coursera.ts` | training | `coursera.org/courses?query=free` | 3-tier: `__NEXT_DATA__` JSON → JSON-LD → HTML cards |

### File Modified
`src/lib/scraper-adapters.ts` — Added 5 imports + 8 SCRAPER_MAP entries (19 total):
- `grantsGovScraper` → "Grants.gov"
- `scholarshipsScraper` → "Scholarships.com", "International Scholarships"
- `tenTimesScraper` → "10times Events", "EventsEye Trade Shows"
- `erasmusPlusScraper` → "Erasmus+ Programme"
- `courseraScraper` → "Coursera Free Courses"

### SQL Migrations Created
| File | Purpose | Status |
|------|---------|--------|
| `swiipt/register_5_new_scraper_sources.sql` | Register all 5 sources (handles existing `pending_scraper` rows for Grants.gov, Erasmus+) | ✅ User ran successfully |
| `swiipt/add_eventseye_source.sql` | Add EventsEye Trade Shows as separate source | ⏳ User needs to run |

### Ingest Result (post-SQL, pre-deploy of new scraper code)
```
ingested=91, version=4, sources_processed=127, items_found=571, items_per_minute=21, error_rate_pct=10
```
- **91 ingested** — best result since the Session 50 circuit-breaker fix (was 4 previously)
- **version=4** confirms P0#1a scraper build is live
- **API-key sources silent** — Adzuna, Jooble, USAJOBS, Findwork need API keys set in Vercel env
- **~13 sources errored** (10%) — some are expected (e.g., 10times blocks, some dead URLs)

### Notes
- **10times.com** returns 403 — existing RSS sources for 10times continue to provide trade show data
- **Scholarships.com** Cloudflare-blocked — International Scholarships (accessible Yii2 site) is the primary source
- **Coursera** uses `__NEXT_DATA__` JSON extraction as primary path — if the embedded data format changes, falls through to JSON-LD → HTML cards → generic fallback
- **EventsEye** is a new discovery — 400–1,600+ trade shows per month in a clean HTML table. Much better than the blocked 10times.
- **No API keys needed for scrapers** — they use HTTP fetch only (no third-party API auth required)

### Deploy Checklist
1. ✅ SQL `register_5_new_scraper_sources.sql` — RUN by user
2. ⏳ SQL `add_eventseye_source.sql` — still needs run
3. ⏳ **Redeploy with Clear build cache** — code is NOT live until this happens
4. ⏳ Run `.\run_ingest.ps1` → `.\run_process_queue.ps1` — expect scraper-sourced evidence from all 5 new sources
5. ⏳ Set API keys in Vercel env for Adzuna/Jooble/USAJOBS/Findwork if desired

## 13. VERIFICATION SCRIPTS
