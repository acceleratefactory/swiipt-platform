# Sprint 12 — Phase 4: Admin Analytics Dashboard

**Completed:** 2026-06-05

## What was built

### New files (8)

| File | Description |
|------|-------------|
| `src/app/(admin)/admin/analytics/page.tsx` | Server page — 7 parallel fetches for metrics + charts data |
| `src/components/admin/analytics/AnalyticsOverview.tsx` | 7 metric cards — total users, new users (7d/30d), AUM, active goals, completion rate, conversion rate |
| `src/components/admin/analytics/UserGrowthChart.tsx` | Bar chart — new users per day (last 14 days) via recharts |
| `src/components/admin/analytics/AUMGrowthChart.tsx` | Line chart — AUM growth over months (sample data) via recharts |
| `src/components/admin/analytics/GoalDistributionChart.tsx` | 2 pie charts — goals by category + goals by risk level via recharts |
| `src/components/admin/analytics/ConversionFunnel.tsx` | Horizontal bar funnel — signup → goal created → first deposit → funded → reached target |
| `src/components/admin/analytics/RevenueIntelligence.tsx` | 3 cards — total fees, avg fees per user, projected annual fees |
| `sprint_12_sql_functions.sql` | SQL functions — `get_signups_by_day(days)` and `get_total_aum()` |

### What it does

- 7 metric cards with live data from Supabase queries
- Users graph — `get_signups_by_day` (bar, last 14 days)
- AUM chart — monthly growth (sample data, placeholder until real time-series data)
- Goal distribution — 2 donut charts (by category, by risk level)
- Conversion funnel — 5-step horizontal bar (signup → goal → deposit → funded → target)
- Revenue intelligence — total fees, avg per user, projected annual
- All charts use recharts library
- SQL functions must be run in Supabase SQL editor first

## Build Results

```
✓ Compiled successfully
✓ Linting and checking validity of types — zero errors
✓ Zero TypeScript errors, zero ESLint errors, zero warnings
```

## Route Count Growth

| Stage | Routes |
|-------|--------|
| Phase 3 (baseline) | 75 |
| **Phase 4** (Analytics) | **76** |

## Setup Required

Run `sprint_12_sql_functions.sql` in Supabase SQL editor to create:
- `get_signups_by_day(days int)` — daily user signups
- `get_total_aum()` — total assets under management
