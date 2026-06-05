# Sprint 12 — Phase 6: Admin Holiday Package Management

**Completed:** 2026-06-05

## What was built

### New files (7)

| File | Description |
|------|-------------|
| `src/app/(admin)/admin/holidays/page.tsx` | Server page — list all holiday packages with table (replaced Sprint 8 placeholder) |
| `src/app/(admin)/admin/holidays/new/page.tsx` | Server page — create new holiday package |
| `src/app/(admin)/admin/holidays/[id]/page.tsx` | Server page — edit existing holiday package |
| `src/components/admin/holidays/HolidayPackagesTable.tsx` | Client component — sortable table with inline active/inactive toggle, edit links, low-slot warning |
| `src/components/admin/holidays/HolidayPackageForm.tsx` | Client component — 7-currency pricing, auto-calc toggle, inclusions list, active/featured toggles |
| `src/app/api/admin/holidays/upsert/route.ts` | POST API — create or update holiday package (admin/case_manager only) |
| `src/app/api/admin/holidays/toggle/route.ts` | POST API — inline active/inactive toggle (admin only) |

### What it does

- List all holiday packages in a styled table with destination, nights, price, slots, active status
- Inline active/inactive toggle (click dot to toggle)
- Low-slot warning (≤6 spots shown in red)
- Create new holiday packages with full form
- Edit existing packages (title, destination, description, duration, slots, inclusions, pricing)
- 7-currency per-person pricing with auto-calc toggle from NGN
- Inclusions as comma-separated text (stored as JSON array)
- Original price field for discount display on frontend
- Admin-only API routes with Supabase auth + `user_roles` check

## Build Results

```
✓ Zero TypeScript errors, zero ESLint errors, zero warnings
```

## Route Count Growth

| Stage | Routes |
|-------|--------|
| Phase 5 (baseline) | 80 |
| **Phase 6** (Holidays) | **84** |

### New routes (4)

| Route | Description |
|-------|-------------|
| `/admin/holidays` | List page (replaced placeholder) |
| `/admin/holidays/new` | Create page |
| `/admin/holidays/[id]` | Edit page |
| `POST /api/admin/holidays/toggle` | Active/inline toggle API |
