# Swiipt — Complete Platform Knowledge Base

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
- **36 tables** total (Sprint 0 foundation: 24 tables; expanded through sprints)
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
| `trade_shows` | Admin-managed trade show catalog | |
| `trade_show_groups` | Group savings toward trade shows | |
| `trade_show_group_members` | Member savings tracking | |
| `readiness_score_log` | Score change audit trail | |

### Rewards & Referrals (Sprint 0 + Sprint 9)
| Table | Purpose |
|-------|---------|
| `referrals` | Referrer-referred links with commission |
| `referral_earnings` | Commission tracking |
| `leaderboard_prizes` | Monthly prize configuration |
| `leaderboard_entries` | Rankings per period |
| `user_preferences` | Notification preferences |

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
- **System 2 — Trade Show Groups:** 3 new tables (`trade_shows`, `trade_show_groups`, `trade_show_group_members`), SME group savings toward trade show attendance, linked savings goals
- **System 3 — Readiness Score:** 0-100 scale, `calculate_readiness_score()` RPC, SVG circular progress on dashboard home, fire-and-forget triggers in deposit/order/document APIs
- **Remaining:** Priority 3 (travel credit + Realtime for group buy), Priority 4 (goal-based holiday payment)

## 8. API ROUTES — COMPLETE INDEX

### Auth & User
- `POST /api/settings/update-profile` — Update name, phone, country
- `POST /api/settings/update-currency` — Set preferred currency
- `POST /api/settings/update-notifications` — Upsert notification prefs
- `GET /api/settings/notification-preferences` — Fetch notification prefs

### Goals & Payments
- `POST /api/goals/deposit/initiate` — Create deposit, return bank details
- `POST /api/goals/withdraw/request` — Create withdrawal request with penalty calc
- `POST /api/readiness/recalculate` — Recalculate and return readiness score

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
- `POST /api/trade-shows/create-group` / `join-group`
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

### Admin APIs (36 routes)

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
**Leaderboard:** award-prize
**Promotions:** create, toggle
**Notifications:** broadcast
**Settings:** update
**Currencies:** update-rate
**SEO:** update
**Corporate:** upsert
**Float:** entry
**Visa Redemptions:** update-status

## 9. KEY FILES REFERENCE

| Path | Purpose |
|------|---------|
| `src/middleware.ts` | Edge middleware entry (delegates to lib/supabase/middleware.ts) |
| `src/lib/supabase/middleware.ts` | Auth session refresh + route protection logic |
| `src/lib/supabase/client.ts` | Browser client (anon key, for client components) |
| `src/lib/supabase/server.ts` | Server client (anon key, cookie-based for server components) |
| `src/lib/supabase/service.ts` | **Service client** (service role key, bypasses RLS for admin) |
| `src/types/database.ts` | Full type definitions for all 36 tables + RPCs |
| `src/app/(admin)/layout.tsx` | Admin auth gate + sidebar (service client pattern) |
| `src/components/admin/shell/AdminSidebar.tsx` | Admin sidebar nav (add new entries here) |
| `src/app/(admin)/admin/` | All 42+ admin page routes |
| `src/app/api/admin/` | All 36 admin API routes |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell layout |
| `src/components/dashboard/shell/Sidebar.tsx` | Dashboard sidebar nav |
| `src/app/(public)/page.tsx` | Landing page assembly |
| `src/components/landing/` | All landing page components (Navbar, Hero, etc.) |
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

## 10. SESSION HISTORY — COMPLETED WORK

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

## 11. VERIFICATION SCRIPTS

- **Build:** `npm run build` — pass with zero TS errors
- **Dev:** `npm run dev` — start without errors
- **Lint:** `npm run lint`
- No test framework installed — would need Jest/Vitest/Playwright setup from scratch
