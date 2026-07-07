# Swiipt — Complete Platform Knowledge Base

## 🚀 START HERE — For New Agent Onboarding

**You are joining after Sprint 19 (Opportunity Feed, Pipeline, AI Service, Ads).** Do not start from scratch. Read this first.

### Current State
- **Sprint 19 — Opportunity Feed & Intelligence System** — fully built, SQL migrations pending (14 files need running in Supabase Editor in order). See `reports/sprint_19_complete_walkthrough.md` for full walkthrough. Master spec: `docs/Sprint_19_Unified.md`. Implementation plan: `docs/Sprint_19_Implementation_Plan.md`.
- **Sprint 16, System 2 (Trade Show Group Savings)** — built and deployed. Paused before booking phase.
- **Sprint 16, System 3 (Opportunity Score)** — built and deployed.
- **Sprint 18 — Feed, Growth Mechanics, Affiliates** — built and deployed.
- Groups can: form → members join with invite link → members save into locked goals → admin confirms deposits → group reaches `funded`
- **Paused before booking phase** — the `funded → booking → confirmed → completed` pipeline is NOT built. See `reports/sprint_16_trade_show_booking_flow_analysis.md` for the plan.

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
2. Read `reports/sprint_19_complete_walkthrough.md` for the full Sprint 19 walkthrough
3. **To activate Sprint 19:** Run all 14 SQL migrations in Supabase SQL Editor in order (listed in the walkthrough §15)
4. Read `reports/sprint_16_trade_show_booking_flow_analysis.md` for the booking phase plan
5. Read the relevant sprint SQL files in `swiipt/` for schema context
6. Ask the user: "Has the booking phase been validated with real users yet? Or should I build it?"

### Current Pending Items
| Priority | Item | Status |
|----------|------|--------|
| 1 | Sprint 19 — Run 14 SQL migrations in Supabase Editor | ⏳ 14 SQL files ready, execute in order (see §15 of walkthrough) |
| 2 | Sprint 19 — Verify live: feed, pipeline, signals, ads, search | ⏳ After SQL migrations |
| 3 | Trade Show Group Booking Phase (paused) | ⏳ `reports/sprint_16_trade_show_booking_flow_analysis.md` |
| 4 | Group Buy ⏱→✅ transition in modal | ⏳ `reports/group-buy-pending-confirmed-transition-plan.md` |
| 5 | Dashboard Home Restructure — feed as primary screen | ⏳ `docs/sprint_17_18_priority_order.md` (routing change in middleware.ts) |
| 6 | Affiliate Management — env vars, pg_cron SQL, e2e testing | ⏳ Sessions 30-32 ops remain |

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
- **43 tables** total (Sprint 0 foundation: 24 tables; expanded through sprints — see §6 for full list)
- RLS enabled on all tables — service client bypasses for admin operations
- Realtime enabled on: `deposits`, `notifications`, `document_requests`, `savings_goals`, `leaderboard_entries`, `holiday_bookings`
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

## 6. ALL 36 DATABASE TABLES

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

### Opportunity Feed & Intelligence (Sprint 19)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `opportunity_types` | Data-driven opportunity type catalog (9 seed types) | id, slug, label, emoji, bg_color, text_color, is_active |
| `opportunity_signals` | User behavioural signals on opportunities | user_id, opportunity_id, signal_type (view/expand/save/apply/dismiss/share/like/dwell_short/dwell_long/comment), metadata JSONB |
| `user_interest_model` | Per-user 7-layer interest scores | user_id, scores JSONB (segment, country, type, recency, engagement, source, diversity), last_computed_at |
| `opportunity_comments` | Phase B comments on opportunities (table only, no UI yet) | user_id, opportunity_id, body, is_flagged |
| `opportunity_queue` | Raw ingested items awaiting processing | source_id, raw_data JSONB, status (pending/processing/published/rejected/error), ai_result JSONB, needs_review, review_reason |
| `opportunity_sources` | Source registry with trust tiers | name, url, source_type, trust_tier (trusted/standard/review_all), default_segment, format (rss/json/api/manual), is_active, last_error, error_count, is_degraded |
| `feed_ads` | Injected sponsored ads | headline, body, cta_label, cta_url, cover_image_url, status (active/paused/ended/draft), impressions, clicks |

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

### Sprint 19 — Opportunity Feed, Pipeline, AI Service, Behavioural Engine & Ads (Built — SQL Pending)
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
- **SQL migrations to run:** 14 files in order (see walkthrough §15 for full list)
- **Git push:** `0d681d1` on `main`

### Sprint 18 — Feed, Growth Mechanics & Affiliate Management (Built)
- **Phase C — The Feed:** `user_opportunity_feed` table, 18 seeded opportunities, personalised feed generation API (`POST /api/opportunities/feed`), track/save endpoints, `OpportunityCard.tsx` with infinite scroll/animated cards/featured placements, feed page at `/dashboard/opportunities` with filters + segment selector + detail page + onboarding flow. Achievement card triggers on order completion. `OpportunityScore.tsx` upgraded from formula to real DB count.
- **Phase D — Growth Mechanics:** `achievement_cards` table with 11 card types (`goal_created`, milestones, `goal_funded`, `service_ordered/completed`, `visa_approved`, `certificate_issued`, `joined_swiipt`, `readiness_score`). Auto-generated on key events. WhatsApp/Instagram share with Canvas 1080×1080 PNG download. `SuccessStoryPrompt` + `SuccessStoryForm` for users to share stories after service completion. `CampaignBanner` for viral campaigns. `/admin/campaigns` list + create pages with admin APIs.
- **Affiliate Management (Phase A–E):** Complete admin panel: `admin_affiliates_phase_a.sql` (RLS + `affiliate_withdrawals` table), 12 API routes (list, detail drill-down, update-tier, adjust-earnings, reset-code, withdrawals queue + process, modules CRUD + reorder), 7 admin pages + 5 components (list with stats/search/filters, detail with 5 tabs + 4 action modals, withdrawals queue with approve/reject, modules list + create/edit forms + preview, sub-affiliate tree). Phase D: pending withdrawal flow (inserts into `affiliate_withdrawals` instead of inline deduction, admin broadcast notification). Phase E: audit logs for all module CRUD. Gap fixes: view-as-user admin preview, reset-code retry loop, all-time leaderboard + reset trigger. Only ops remain: env vars, pg_cron SQL, test.
- **Commits:** Sprint 18 Phases C+D: Session 28-29 commits; Affiliates Phase A: `1260f22`, Phase B: `4b1ef84`, Phase C: `be6b190`, Phase D: `b48966e`, Phase E: `d075642`, gaps: `1b30bc6`, bottom tabs fix: `e9902b2`

## 8. API ROUTES — COMPLETE INDEX

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
- `POST /api/holidays/book` — Create holiday booking
- `POST /api/holidays/confirm-payment` — Confirm holiday payment

### Group Buy & Trade Shows
- `POST /api/group-buy/create` — Create group with discount
- `POST /api/group-buy/join` — Join via invite code
- `POST /api/group-buy/leave` — Withdraw from group
- `POST /api/group-buy/pay` — Initiate payment for filled group
- `POST /api/group-buy/expire` — Cron: expire stale groups
- `POST /api/trade-shows/create-group` — Creates trade show group + savings goal + membership for organizer
- `POST /api/trade-shows/join-group` — Joins via invite code, creates savings goal + membership
- `POST /api/readiness/recalculate` — Recalculate and return readiness score
- `GET /api/group-buy/payment-status` — Check for existing pending payment (resumable)
- `POST /api/group-buy/cancel-payment` — Cancel pending payment and revert to `committed`

### Rewards & Referrals
- `POST /api/rewards/convert` — Convert reward to locked credit
- `POST /api/rewards/redeem-visa` — Redeem Qatar visa reward
- `POST /api/rewards/upload-documents` — Upload visa support docs
- `POST /api/rewards/confirm-payment` — Confirm visa payment
- `POST /api/referrals/track` — Track referral click
- `POST /api/gifts/send` — Send gift to friend

### Documents
- `POST /api/documents/upload` — Upload to document request
- `POST /api/documents/vault` — Upload to document vault
- `POST /api/documents/use-vault-doc` — Use vault doc for request

### Community
- `POST /api/community/thread` — Create thread
- `POST /api/community/reply` — Reply to thread

### Subscriptions & Cron
- `POST /api/subscribe` — Email capture
- `GET /api/messaging/scheduled/expire-deposits` — Cron: expire stale deposits (06:00 UTC)
- `GET /api/cron/expire-visa-redemptions` — Cron: expire visa redemptions (06:30 UTC)

### Admin APIs (52 routes)

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
**Leaderboard:** award-prize, reset
**Promotions:** create, toggle
**Notifications:** broadcast
**Settings:** update
**Currencies:** update-rate
**SEO:** update
**Corporate:** upsert
**Float:** entry
**Visa Redemptions:** update-status
**Affiliates (12 routes):** list, detail, update-tier, adjust-earnings, reset-code, withdrawals list, withdrawals process, modules list/create, modules update/delete, modules reorder
**Achievements:** generate-card, list, mark-shared, dismiss
**Campaigns:** create, toggle
**Opportunities:** create, toggle, update
**Opportunity Queue:** list (GET), publish/reject (POST)
**Ingest:** ingest RSS/API sources (POST, internal)
**Link Checker:** check-links (POST, internal)
**Feed:** generate (POST), signal capture (POST), like toggle (POST), apply redirect (GET), save (POST), track (POST), track-signal (POST), paste-url AI-prefill (POST)
**Interest Model:** compute-interest (POST), compute-interest-batch (POST, cron)
**Feed Ads:** list (GET), create (POST), toggle (POST)
**Opportunity Types:** list (GET)
**Career Segments:** list (GET)
**Certificates:** revoke
**Partners:** update-status
**AI Providers:** create, toggle, test, update

## 9. KEY FILES REFERENCE

| Path | Purpose |
|------|---------|
| `src/middleware.ts` | Edge middleware entry (delegates to lib/supabase/middleware.ts) |
| `src/lib/supabase/middleware.ts` | Auth session refresh + route protection logic |
| `src/lib/supabase/client.ts` | Browser client (anon key, for client components) |
| `src/lib/supabase/server.ts` | Server client (anon key, cookie-based for server components) |
| `src/lib/supabase/service.ts` | **Service client** (service role key, bypasses RLS for admin) |
| `src/types/database.ts` | Full type definitions for all 43 tables + RPCs |
| `src/app/(admin)/layout.tsx` | Admin auth gate + sidebar (service client pattern) |
| `src/components/admin/shell/AdminSidebar.tsx` | Admin sidebar nav (add new entries here) |
| `src/app/(admin)/admin/` | All 42+ admin page routes |
| `src/app/api/admin/` | All 36 admin API routes |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell layout |
| `src/components/dashboard/shell/Sidebar.tsx` | Dashboard sidebar nav |
| `src/app/(public)/page.tsx` | Landing page assembly |
| `src/components/landing/` | All landing page components (Navbar, Hero, etc.) |
| `src/components/dashboard/home/OpportunityScore.tsx` | **Opportunity Score widget** — SVG circle, "X opportunities today" framing, 5 tiers, refresh button |
| `docs/sprint_16_system3_build_plan.md` | System 3 build plan — conflict analysis, 7-phase implementation, Sprint 18 upgrade path |
| `docs/sprint_17_build_plan.md` | Sprint 17 build plan — 5 features (Global Profile, Certificates, Agent Escrow, Diaspora Gifts), 5 new DB tables, phase-by-phase implementation |
| `reports/opportunity_score_testing_walkthrough.md` | Testing walkthrough for Opportunity Score — 7 trigger points, admin display |
| `docs/movenaija_claude_code_direction_v2.md` | Master direction document (1933 lines) |
| `reports/sprint_16_investigation_report.md` | Sprint 16 investigation with 4 priorities |
| `reports/admin_api_rls_audit.md` | Audit of 33 admin API routes (22 broken) |
| `reports/payment_recovery_implementation_plan.md` | Plan to add payment resume/cancel for group buy direct payment |
| `reports/holiday_booking_flow_investigation.md` | End-to-end investigation of broken holiday booking flow |
| `reports/holiday_booking_fix_plan.md` | 6-step fix plan for holiday booking persistence |
| `reports/holiday_booking_admin_workflow_plan.md` | Admin workflow plan for holiday bookings |
| `reports/holiday_booking_testing_walkthrough.md` | Testing walkthrough for holiday booking flow |
| `reports/priority_2_implementation_plan.md` | Group buy payment flow implementation plan (Sprint 16 Priority 2) |
| `reports/findings/group-buy-payment-status-inconsistency.md` | Root cause analysis: admin confirmation from Orders/Holidays page doesn't sync group_buy_members |
| `reports/findings/service-vs-group-buy-payment-flows.md` | Comparison: service flow has same recovery gap as group buy (unfixed) |
| `reports/findings/realtime-payment-confirmation-pattern.md` | Realtime payment confirmation pattern: goal deposit vs group buy vs service |
| `reports/realtime-payment-confirmation-implementation-plan.md` | Implementation plan for Realtime payment confirmation across all 3 flows |
| `reports/findings/goal-deposit-modal-pattern-investigation.md` | Investigation: goal deposit "pending" modal pattern (no X, overlay disabled, hard reload) |
| `sprint_16_group_buy_payment_recovery.sql` | SQL migration: adds `user_confirmed_at` + `payment_reference` to `group_buy_members` |
| `sprint_16_group_buy_tables.sql` | SQL migration: creates `group_buys` + `group_buy_members` tables |
| `reports/priority_2_migration.sql` | SQL: enables Realtime on `group_buy_members` |
| `reports/holiday_bookings_migration.sql` | SQL migration: creates `holiday_bookings` table |
| `docs/history/` | Sprint history files (Sprint 10, Sprint 12 phases) |
| `sprint_16_readiness_score.sql` | SQL: System 3 readiness score columns, function, log table |
| `sprint_16_trade_show_tables.sql` | SQL: 3 trade show tables + RLS + indexes |
| `sprint_16_trade_show_seed.sql` | SQL: 6 trade show seed rows |
| `sprint_16_trade_show_helper_fn.sql` | SQL: check_and_update_trade_show_group_funding helper |
| `sprint_16_confirm_deposit_mod.sql` | SQL: confirm_deposit updated with trade show + readiness blocks |
| `reports/sprint_16_system2_conflict_analysis.md` | Conflict analysis: System 2 vs existing codebase (17 findings) |
| `reports/sprint_16_system2_build_plan.md` | Complete 6-phase build plan with resolved conflicts |
| `reports/sprint_16_analysis_and_plan.md` | Sprint 16 investigation with 4 priorities |
| `reports/group-buy-pending-confirmed-transition-plan.md` | Plan: add ⏱→✅ transition to group buy modal |
| `reports/findings/realtime-auto-close-not-firing.md` | Superseded: earlier investigation into auto-close (incorrect root cause) |
| `docs/Sprint_19_Unified.md` | **Sprint 19 master spec** — 3,320 lines, merged base + behavioral + pipeline + Feed/Media/Interactivity/Ads |
| `docs/Sprint_19_Implementation_Plan.md` | **Sprint 19 implementation plan** — 817 lines, 9 source docs, phased build, 27-item verification audit |
| `docs/sprint_19_amendment_1_fix3_to_search.md` | Amendment 1 — Search/Explore replaces always-on filter strip |
| `docs/sprint_19_amendment_2_zero_ai.md` | Amendment 2 — Zero-cost AI via OmniRoute (supersedes Haiku) |
| `docs/sprint_19_amendment_3_15_enhancements_assessment.md` | Amendment 3 — 15 enhancements assessed (7 adopted, 8 deferred) |
| `docs/sprint_19_gap_resolution.md` | 4 pre-build gaps resolved (DB types, OG fetching, ads panel, comments) |
| `docs/pre_sprint_19_data_driven_types.md` | Pre-cleanup spec for data-driven opportunity types |
| `docs/Sprint 19 resolution` | Architecture discussion — Opportunity Engine model, three-tier trust |
| `src/lib/opportunity-types.ts` | Data-driven type/segment utilities (getOpportunityTypes, buildTypeStyleMap, buildSegmentMap) |
| `src/lib/ai-service.ts` | AI Service abstraction — OmniRoute priority fallback, enrich(), isAIAvailable() |
| `src/lib/ai/prompts.ts` | Task-specific prompt builders for pipeline processing |
| `src/lib/ai/providers/gemini.ts` | Gemini 1.5 Flash adapter |
| `src/lib/ai/providers/deepseek.ts` | DeepSeek Chat adapter |
| `src/lib/og-fetch.ts` | OG tag extraction + image validation + fallback |
| `src/components/dashboard/opportunities/OpportunityCard.tsx` | Feed card — media, signals, engagement rail, ServiceCTA, dismiss |
| `src/components/dashboard/opportunities/OpportunityFeed.tsx` | Single-column feed — infinite scroll, ad injection, dismiss filtering |
| `src/components/dashboard/opportunities/OpportunityDetailModal.tsx` | Slide-up/centered detail modal with dwell tracking |
| `src/components/dashboard/opportunities/FallbackTile.tsx` | Branded fallback tile for cards without images |
| `src/components/dashboard/opportunities/ServiceCTA.tsx` | Dynamic service routing by type + country |
| `src/components/dashboard/opportunities/SearchExplore.tsx` | Search/Explore page with filters + results |
| `src/components/admin/opportunities/PasteUrlForm.tsx` | AI-prefill paste-URL form for admin |
| `src/components/admin/opportunities/OpportunitiesList.tsx` | Admin opportunities list table |
| `src/components/admin/opportunities/CreateOpportunityForm.tsx` | Admin create opportunity form |
| `src/components/admin/opportunities/EditOpportunityForm.tsx` | Admin edit opportunity form |
| `src/components/admin/opportunities/OpportunityQueueList.tsx` | Admin queue review list (Publish/Reject) |
| `src/app/(dashboard)/dashboard/opportunities/page.tsx` | Feed page at `/dashboard/opportunities` |
| `src/app/(dashboard)/dashboard/opportunities/search/page.tsx` | Search/Explore page |
| `src/app/(dashboard)/dashboard/opportunities/[opportunityId]/page.tsx` | Opportunity detail page |
| `src/app/(admin)/admin/opportunities/queue/page.tsx` | Admin queue review page |
| `src/app/(admin)/admin/feed-ads/page.tsx` | Admin feed ads list page |
| `src/app/(admin)/admin/feed-ads/new/page.tsx` | Admin feed ads create page |

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
| W6 | Dashboard sidebar `navItems` array | `Sidebar.tsx` — 12 items, exact indices matter | Inserting at wrong position breaks nav order |
| W7 | Admin sidebar `navItems` array | `AdminSidebar.tsx` — 30 items, exact indices matter | Inserting at wrong position breaks nav order |
| W8 | Build verification | `npm run build` — zero TS errors (no test framework) | Assuming Jest/Vitest/Playwright exist |
| W9 | Stripe integration | Uses `process.env.STRIPE_SECRET_KEY` and `process.env.STRIPE_WEBHOOK_SECRET` | Environment variables vary by project |
| W10 | Email (transactional) | Resend via `process.env.RESEND_API_KEY` | Not Brevo for transactional |

### Current Sidebar Nav State

**Dashboard (`src/components/dashboard/shell/Sidebar.tsx`):**
| Index | Label | Icon |
|-------|-------|------|
| 0 | Home | Home |
| 1 | My Goals | Target |
| 2 | Services | Globe |
| 3 | Flights | Plane |
| 4 | Holidays | Umbrella |
| 5 | Groups | Users |
| 6 | Trade Shows | Globe |
| 7 | Documents | FileText |
| 8 | Rewards | Gift |
| 9 | Refer & Earn | Users |
| 10 | Community | MessageCircle |
| 11 | Wallet | Wallet |

**Admin (`src/components/admin/shell/AdminSidebar.tsx`):**
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
| 18 | Affiliates | Percent |
| 19 | AI Providers | Cpu |
| 20 | Notifications | Bell |
| 21 | Subscribers | Mail |
| 22 | Partners | Handshake |
| 23 | Corporate | Building2 |
| 24 | Float Ledger | TrendingUp |
| 25 | Settings | Settings |
| 26 | Analytics | BarChart2 |
| 27 | Landing Pages | Layout |
| 28 | Goal Templates | Crosshair |
| 29 | SEO Manager | Search |

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

### Common Mistakes Registry

1. **Using `createServiceClient()` in API routes for auth** — Service client has stub cookies (`getAll` returns `[]`), so `getUser()` fails. Use `createClient()` from `@/lib/supabase/server`.
2. **Using relative URLs for server-side fetch** — `/api/readiness/recalculate` does not resolve from server components. Must use `process.env.NEXT_PUBLIC_APP_URL` prefix.
3. **Omitting `id` in Supabase select queries** — Caused deposit `goal_id` to be null (Sprint 16 post-deploy bug). Always include `id` when joining to parent records.
4. **Inserting sidebar nav items without checking exact indices** — Dashboard has 12 items, admin has 24. Insert at wrong position = broken nav order.
5. **Using `price_paid` for service orders** — Column does not exist. Use `final_price`.
6. **Forgetting `setShowXxx(false)` before `router.refresh()` in pending confirmation modals** — Modal stays open because `router.refresh()` preserves client state.
7. **Inline `display` style overriding Tailwind responsive classes** — `className="md:hidden"` + `style={{ display: "flex" }}` = always visible because inline styles win. Use `className="md:hidden flex"` instead.

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

**SQL migrations pending:** 14 files. Run in order in Supabase SQL Editor (see walkthrough §15).

---

## 12. PENDING / FUTURE BUILD

### Sprint 19 SQL Migrations (14 files — run in order)
- **Order matters.** Run in Supabase SQL Editor in the sequence listed in `reports/sprint_19_complete_walkthrough.md` §15.
- Files: `sprint_19_pre_data_driven_types.sql`, `sprint_19_phase2_ai_providers_seed.sql`, `sprint_19_media_system.sql`, `sprint_19_engagement_sql.sql`, `sprint_19_pipeline_sql.sql`, `sprint_19_feed_ads.sql`, `sprint_19_seed_sources.sql`, `sprint_19_seed_opportunities.sql`, `sprint_19_seed_additional_sources.sql`, `sprint_19_cron_compute_interest.sql`, `sprint_19_cron_ingest.sql`, `sprint_19_cron_process_queue.sql`, `sprint_19_cron_check_links.sql`, `sprint_19_source_health.sql`

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

## 13. VERIFICATION SCRIPTS
- **Build:** `npm run build` — pass with zero TS errors
- **Lint:** `npm run lint`
- No test framework installed — would need Jest/Vitest/Playwright setup from scratch
