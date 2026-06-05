# Sprint 12 — Phase 5: Admin Service Package Management

**Completed:** 2026-06-05

## What was built

### New files (7)

| File | Description |
|------|-------------|
| `src/app/(admin)/admin/services/page.tsx` | Server page — list all service packages with table |
| `src/app/(admin)/admin/services/new/page.tsx` | Server page — create new service package |
| `src/app/(admin)/admin/services/[id]/page.tsx` | Server page — edit existing service package |
| `src/components/admin/services/ServicePackagesTable.tsx` | Client component — sortable table with inline active/inactive toggle, edit links |
| `src/components/admin/services/ServicePackageForm.tsx` | Client component — 7-currency pricing, auto-calc toggle, category select, active/featured toggles |
| `src/app/api/admin/services/upsert/route.ts` | POST API — create or update service package (admin-only) |
| `src/app/api/admin/services/toggle/route.ts` | POST API — inline active/inactive toggle (admin-only) |

### What it does

- List all service packages in a styled table
- Inline active/inactive toggle (click dot to toggle)
- Create new service packages with full form
- Edit existing packages (name, description, category, destination, pricing, sort order, badge, active/featured)
- 7-currency pricing: NGN is primary; USD, AED, QAR, GBP, CAD, EUR auto-calculated from NGN via toggle
- Hardcoded exchange rates: NGN/USD ~1650, NGN/AED ~449, NGN/QAR ~453, NGN/GBP ~2090, NGN/CAD ~1210, NGN/EUR ~1780
- Category select with predefined options (study_abroad, relocation, tourism, business_setup, visa_assistance, others)
- Admin-only API routes with Supabase auth + `user_roles` check
- Server-side validation for required fields

## Build Results

```
✓ Compiled successfully
✓ Linting and checking validity of types — zero errors
✓ Zero TypeScript errors, zero ESLint errors, zero warnings
```

## Route Count Growth

| Stage | Routes |
|-------|--------|
| Phase 4 (baseline) | 76 |
| **Phase 5** (Services) | **80** |

### New routes (4)

| Route | Description |
|-------|-------------|
| `/admin/services` | List page |
| `/admin/services/new` | Create page |
| `/admin/services/[id]` | Edit page |
| `POST /api/admin/services/toggle` | Active/inline toggle API |
