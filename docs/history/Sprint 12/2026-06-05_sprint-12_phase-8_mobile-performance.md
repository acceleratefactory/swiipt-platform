# Sprint 12 — Phase 8: Mobile / Performance

**Completed:** 2026-06-05

## What was built

### Modified files (9)

| File | Change |
|------|--------|
| **Mobile Responsiveness** | |
| `src/components/admin/shell/AdminShell.tsx` | Added hamburger button (`Menu` icon), `sidebarOpen` state, overlay click-to-close |
| `src/components/admin/shell/AdminSidebar.tsx` | Split into desktop sidebar + mobile drawer with slide-in/out animation; added `open`/`onClose` props; links close drawer on click |
| `src/app/globals.css` | Added responsive CSS for `.admin-sidebar-desktop` / `.admin-sidebar-mobile` (breakpoint 768px), responsive table utilities (`.hide-mobile`, `.table-toggle-btn`), removed duplicate Google Fonts `@import`, fixed font variable usage |
| `src/components/dashboard/shell/BottomTabs.tsx` | Added `paddingBottom: "env(safe-area-inset-bottom, 0px)"` for notched phones |
| `src/components/dashboard/shell/DashboardShell.tsx` | Lazy-loaded `BottomTabs` via `next/dynamic` with `ssr: false` |
| **Performance** | |
| `src/components/landing/Hero.tsx` | Lazy-loaded `FlightSearchWidget` via `next/dynamic` with `ssr: false` |
| `src/app/layout.tsx` | Added `<link rel="preconnect">` and `<link rel="dns-prefetch">` for `cdn.fontshare.com` (Cabinet Grotesk CDN), removed stale comments |
| `src/app/globals.css` | Removed `@import url(...)` for Plus Jakarta Sans (duplicated next/font loading) |
| `src/components/admin/services/ServicePackagesTable.tsx` | Added `min-width: 400px` on table, responsive column hiding (category/destination/sort/badge hide on mobile), touch-friendly toggle buttons |
| `src/components/admin/holidays/HolidayPackagesTable.tsx` | Added `min-width: 400px` on table, responsive column hiding (destination/nights/slots hide on mobile), touch-friendly toggle buttons |

### What it does

- **Admin panel now fully responsive**: hamburger menu on mobile (<768px), slide-in drawer with 16 nav items, overlay backdrop, close on nav click or overlay click
- **Notched phone support**: BottomTabs now respect `safe-area-inset-bottom`
- **Lazy loading**: BottomTabs, FlightSearchWidget no longer block initial render
- **Faster font loading**: preconnect + dns-prefetch for Fontshare CDN saves ~200-500ms
- **Reduced font payload**: removed duplicate Google Fonts @import (next/font handles it with preloading)
- **Mobile-friendly tables**: non-essential columns hidden on mobile, toggle buttons have larger touch targets, table has minimum width to prevent excessive shrinking
- **CSS variable consistency**: body font family now uses `var(--font-body)` set by next/font

## Build Results

```
✓ Zero TypeScript errors, zero ESLint errors, zero warnings
```

## Route Count Growth

| Stage | Routes |
|-------|--------|
| Phase 7 (baseline) | 84 |
| **Phase 8** (Mobile/Performance) | **84** (no new routes, all infrastructure improvements) |
