# Sprint 12 — Phase 7: Production Readiness

**Completed:** 2026-06-05

## What was built

### New files (14)

| File | Description |
|------|-------------|
| **Error Boundaries** | |
| `src/app/global-error.tsx` | Global error boundary — catches errors in root layout (full HTML document) |
| `src/app/error.tsx` | Root error boundary — catch-all page-level errors |
| `src/app/(dashboard)/error.tsx` | Dashboard-specific error boundary |
| `src/app/(admin)/error.tsx` | Admin-specific error boundary |
| `src/app/(auth)/error.tsx` | Auth-specific error boundary |
| `src/app/(public)/error.tsx` | Public-specific error boundary |
| `src/app/not-found.tsx` | Custom 404 page with branded UI |
| **Loading States** | |
| `src/app/loading.tsx` | Root loading spinner (centered, animated) |
| `src/app/(dashboard)/loading.tsx` | Dashboard skeleton — sidebar + content grid placeholders |
| `src/app/(admin)/loading.tsx` | Admin skeleton — sidebar + content area placeholders |
| `src/app/(auth)/loading.tsx` | Auth loading spinner |
| **SEO & Discoverability** | |
| `src/app/robots.ts` | robots.txt — allow public pages, disallow dashboard/admin/api, link sitemap |
| `src/app/sitemap.ts` | XML sitemap — 10 URLs (home, login, signup, 7 destination pages) |
| **Environment Validation** | |
| `src/lib/env.ts` | Runtime env validation — throws on missing `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`, optional fallbacks for Duffel/Resend keys |

### Modified files (3)

| File | Change |
|------|--------|
| `next.config.mjs` | Added security headers: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy (camera/mic/geo blocked), HSTS (2 years, preload) |
| `src/app/(public)/page.tsx` | Added `export const metadata` with title/description/OpenGraph |
| `src/app/(auth)/login/page.tsx` | Added `export const metadata` with page-specific title/description |
| `src/app/(auth)/signup/page.tsx` | Added `export const metadata` with page-specific title/description |

### What it does

- **Error boundaries** at every route level: global (catches layout crashes), root, dashboard, admin, auth, public — each with consistent branded UI and "Try again" button
- **Custom 404** with large "404" heading, subtitle, and "Go home" link
- **Loading skeletons** for dashboard (sidebar + card grid) and admin (sidebar + content area) — no flash of blank page
- **robots.txt** — allows all crawlers on public content, blocks dashboard/admin/API routes, points to sitemap
- **Sitemap** — 10 URLs with proper priorities (home=1.0, destinations=0.9, signup=0.8)
- **Security headers** — CSP-light via restrictive Permissions-Policy, clickjacking protection (DENY), MIME sniffing prevention, HSTS for HTTPS enforcement
- **Env validation** — `requireEnv()` throws immediately if critical Supabase keys are missing at startup

## Build Results

```
✓ Zero TypeScript errors, zero ESLint errors, zero warnings
```

## Route Count Growth

| Stage | Routes |
|-------|--------|
| Phase 6 (baseline) | 84 |
| **Phase 7** (Production Readiness) | **84** (no new routes, only error/loading/SEO infrastructure) |
