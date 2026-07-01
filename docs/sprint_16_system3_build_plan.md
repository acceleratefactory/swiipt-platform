# Sprint 16 System 3 — Opportunity Score (was Readiness Score) Implementation Plan

## Naming Convention (Build Once, Use Correct Names From Day One)

| Layer | Name | Rationale |
|-------|------|-----------|
| DB column | `users.readiness_score` (keep) | Internal — users never see column name. No rename needed |
| SQL function | `calculate_readiness_score()` (keep) | Internal — not user-facing |
| API route | `/api/readiness/recalculate` (keep) | Internal — not user-facing |
| **Component file** | **`OpportunityScore.tsx`** | User-facing — must use final name |
| **Display text** | **"You qualify for X opportunities today"** | User-facing — must use final framing |

---

## Current State vs Original Spec — Conflict Analysis

### What's Already Built (DO NOT MODIFY)

| Item | File/SQL | Status |
|------|----------|--------|
| Users table columns | `sprint_16_readiness_score.sql` — ALTER TABLE users: `readiness_score`, `readiness_destination`, `readiness_last_calculated` | ✅ Done |
| Score log table | `sprint_16_readiness_score.sql` — `readiness_score_log` with RLS + index | ✅ Done |
| calculate_readiness_score RPC | `sprint_16_readiness_score.sql` — PostgreSQL function (identity 20pt, financial 30pt, documents 20pt, services 15pt, engagement 15pt) | ✅ Done |
| confirm_deposit recalc trigger | `sprint_16_confirm_deposit_mod.sql` — `PERFORM calculate_readiness_score(dep.user_id)` added | ✅ Done |
| Readiness API route | `src/app/api/readiness/recalculate/route.ts` — POST endpoint, admin client calls RPC | ✅ Done |
| Database types | `src/types/database.ts` — readiness columns on users, readiness_score_log table, calculate_readiness_score RPC signature | ✅ Done |

### Conflicts Found — Original Spec vs Current Platform

| # | Original Spec | Current Reality | Conflict |
|---|---------------|-----------------|----------|
| 1 | `POST /api/goals/create/route.ts` — add recalc call | **Route does not exist.** Goal creation is **client-side** in `CreateGoalForm.tsx` | Must add fire-and-forget `fetch("/api/readiness/recalculate")` in the client component instead |
| 2 | `src/app/api/documents/vault-upload/route.ts` — add recalc | Route exists but uses browser Supabase client; readiness RPC may not be callable via client | Must add fire-and-forget `fetch("/api/readiness/recalculate")` using native fetch, not Supabase RPC |
| 3 | `src/app/api/services/order/route.ts` — add recalc | Route exists, uses server client | Must add fire-and-forget fetch after successful order creation |
| 4 | `src/app/api/settings/update-profile/route.ts` — add recalc | Route exists, uses server client | Must add fire-and-forget fetch after successful profile update |
| 5 | Dashboard home uses `adminSupabase` (service role) | Dashboard home uses `createClient()` (server component, anon key) | Cannot call `calculate_readiness_score` RPC directly in server component. Must either: (A) fetch readiness_score from users table directly, or (B) call the `/api/readiness/recalculate` HTTP route using server-side fetch |
| 6 | Admin user page shows readiness score via inline display | `UserProfileAdmin.tsx` renders identity fields as a flat grid. Readiness score is not shown. | Must add readiness score card to the Overview tab |
| 7 | 24-hour auto-recalc on dashboard load | Not implemented | Must add recalculation logic to dashboard page.tsx server component |
| 8 | Component named `ReadinessScore.tsx` | **Does not exist** | Must be created as **`OpportunityScore.tsx`** from day one |

---

## Build Plan — 8 Files, Surgical Precision

### Phase 1: OpportunityScore Widget Component

**File:** `src/components/dashboard/home/OpportunityScore.tsx` — **CREATE**

Key framing changes from original spec:
- **Primary display:** "You qualify for {opportunityCount} opportunities today" (large, prominent)
- **Secondary display:** "Readiness: {score}/100" (smaller, below)
- **opportunityCount** = `Math.round((score / 100) * 35)` — temporary formula, replaced in Sprint 18 with real count from `user_opportunity_feed`
- **Tier messages** reference unlocking more opportunities
- **Component name** is `OpportunityScore` not `ReadinessScore`

```tsx
"use client";
import { useState } from "react";

interface OpportunityScoreProps {
  score: number;
  destination: string | null;
  userId: string;
}

function getOpportunityCount(score: number): number {
  // Temporary formula — replaced in Sprint 18 with real count from user_opportunity_feed
  return Math.round((score / 100) * 35);
}

function getScoreTier(score: number): { label: string; color: string; message: string; nextAction: string; ctaHref: string } {
  if (score < 20) return {
    label: "Getting started",
    color: "#6B7280",
    message: "Complete your profile to unlock more opportunities tailored to you.",
    nextAction: "Complete your profile",
    ctaHref: "/dashboard/settings",
  };
  if (score < 40) return {
    label: "Building foundation",
    color: "#B45309",
    message: "Create a savings goal and unlock opportunities that match your financial goals.",
    nextAction: "Create a savings goal",
    ctaHref: "/dashboard/goals",
  };
  if (score < 60) return {
    label: "Making progress",
    color: "#0D9488",
    message: "Upload your passport and key documents to unlock more opportunities.",
    nextAction: "Upload your passport",
    ctaHref: "/dashboard/documents",
  };
  if (score < 80) return {
    label: "Well prepared",
    color: "var(--teal)",
    message: "Order a service to unlock premium opportunities.",
    nextAction: "Order a service",
    ctaHref: "/dashboard/services",
  };
  return {
    label: "Move-ready",
    color: "#059669",
    message: "You are ready to move. Book your travel and start your new chapter.",
    nextAction: "Book your move",
    ctaHref: "/dashboard/flights",
  };
}

export default function OpportunityScore({ score, destination, userId }: OpportunityScoreProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [currentScore, setCurrentScore] = useState(score);
  const tier = getScoreTier(currentScore);
  const opportunityCount = getOpportunityCount(currentScore);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/readiness/recalculate", { method: "POST" });
      const data = await res.json();
      if (data.score !== undefined) setCurrentScore(data.score);
    } catch {
      // Fire-and-forget — don't block UI
    }
    setRefreshing(false);
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #06112B, #1A3560)",
      borderRadius: "var(--radius-xl)",
      padding: "1.5rem",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "1.5rem",
      flexWrap: "wrap",
    }}>
      {/* Circular progress */}
      <div style={{ position: "relative", width: 128, height: 128, flexShrink: 0 }}>
        <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={tier.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.875rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
            {currentScore}
          </span>
          <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>/ 100</span>
        </div>
      </div>

      {/* Score details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: `${tier.color}22`, color: tier.color }}>
            {tier.label}
          </span>
          {destination && (
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              → {destination}
            </span>
          )}
        </div>
        <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "white", marginBottom: "0.25rem" }}>
          You qualify for <span style={{ color: "var(--teal)" }}>{opportunityCount} opportunities</span> today
        </p>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>
          Readiness: {currentScore}/100
        </p>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: "0.875rem" }}>
          {tier.message}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a href={tier.ctaHref} style={{ padding: "0.5rem 1rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.8125rem", borderRadius: "var(--radius-sm)", textDecoration: "none" }}>
            {tier.nextAction} →
          </a>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ padding: "0.5rem 0.875rem", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.15)", cursor: refreshing ? "not-allowed" : "pointer" }}
          >
            {refreshing ? "Updating..." : "Refresh score"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Key differences from original spec:**
- Component named `OpportunityScore` not `ReadinessScore`
- `getOpportunityCount(score)` function — temporary formula: `Math.round((score / 100) * 35)`
- Primary display: "You qualify for {opportunityCount} opportunities today" with teal highlight on count
- Secondary display: "Readiness: {score}/100" in subtle text
- Tier messages reference unlocking opportunities (e.g., "upload your passport to unlock more opportunities")
- Refresh button re-calculates score AND opportunity count automatically

---

### Phase 2: Dashboard Home Integration

**File:** `src/app/(dashboard)/dashboard/page.tsx` — **MODIFY**

**Changes:**
1. Add import for `OpportunityScore` component
2. Add server-side fetch for user readiness data (from `users` table, not RPC — RPC needs service role)
3. Add 24-hour auto-recalc logic calling the HTTP route
4. Render `OpportunityScore` after `WelcomeBanner`, before `WalletCard`

```typescript
// NEW IMPORT — add at top with other imports
import OpportunityScore from "@/components/dashboard/home/OpportunityScore";

// NEW DATA FETCH — add inside the existing Promise.all block
const readinessRes = supabase
  .from("users")
  .select("readiness_score, readiness_destination, readiness_last_calculated")
  .eq("id", user.id)
  .single();

// Add to Promise.all destructuring:
const [profileRes, walletRes, goalsRes, ordersRes, welcomeRewardRes, readinessRes] = await Promise.all([
  // ... existing queries ...
  readinessRes, // <-- add this
]);

// NEW READINESS COMPUTATION — after the existing data extraction block (~line 29):
const readinessProfile = readinessRes.data as unknown as {
  readiness_score: number | null;
  readiness_destination: string | null;
  readiness_last_calculated: string | null;
} | null;

let readinessScore = readinessProfile?.readiness_score || 0;
const needsRecalculation = !readinessProfile?.readiness_last_calculated ||
  new Date(readinessProfile.readiness_last_calculated) < new Date(Date.now() - 24 * 60 * 60 * 1000);

if (needsRecalculation) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const recalcRes = await fetch(`${appUrl}/api/readiness/recalculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const recalcData = await recalcRes.json();
    if (recalcData.score !== undefined) readinessScore = recalcData.score;
  } catch {
    // Silently fail — score from DB is better than nothing
  }
}

// NEW RENDER — add after WelcomeBanner, before WalletCard (~line 37):
<OpportunityScore
  score={readinessScore}
  destination={readinessProfile?.readiness_destination || null}
  userId={user.id}
/>
```

**Key design decision:** The original spec suggested calling `calculate_readiness_score` RPC directly from the server component. However, the existing dashboard page uses `createClient()` (anon key server client), not the service role admin client. The RPC requires service role permissions. Two solutions:
- **Option A (chosen):** `fetch()` the `/api/readiness/recalculate` HTTP route from the server component — the route handles auth and uses the admin client internally
- **Option B:** Switch dashboard page to use `createServiceClient()` from service.ts — **REJECTED** because it would break existing queries that depend on RLS filtering

**Sprint 18 upgrade path:** Add `user_opportunity_feed` query after readiness fetch, pass `opportunityCount` as a prop instead of computing it inside the component.

---

### Phase 3: Goal Creation Trigger

**File:** `src/components/dashboard/goals/CreateGoalForm.tsx` — **MODIFY**

**Location:** After line 139 (`await supabase.rpc("increment_mobility_score", ...)`) and before line 141 (`setLoading(false)`)

**Add fire-and-forget recalculation:**

```typescript
// After line 139 — fire-and-forget opportunity/readiness score recalculation
fetch("/api/readiness/recalculate", { method: "POST" }).catch(() => {});
```

**Conflict note:** Original spec referenced `POST /api/goals/create/route.ts` which does not exist. Goal creation is client-side only. Fire-and-forget fetch is the correct pattern here.

---

### Phase 4: Document Vault Upload Trigger

**File:** `src/app/api/documents/vault-upload/route.ts` — **MODIFY**

**Location:** After the existing passport mobility score block (after line 48: `if (documentType === "passport") { ... }`) and before the return statement.

**Add fire-and-forget recalculation:**

```typescript
// After the existing mobility score block — fire-and-forget opportunity/readiness score recalculation
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
fetch(`${appUrl}/api/readiness/recalculate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
}).catch(() => {});
```

**Conflict note:** The original spec referenced calling the RPC directly. Using the HTTP route is safer because:
1. The route handles authentication properly (requires user session)
2. The route uses service role key internally
3. Avoids potential permission issues with calling SECURITY DEFINER functions from the client

---

### Phase 5: Service Order Trigger

**File:** `src/app/api/services/order/route.ts` — **MODIFY**

**Location:** After the activity_log insert (line ~156), before the return statement.

**Add fire-and-forget recalculation:**

```typescript
// After the activity_log insert — fire-and-forget opportunity/readiness score recalculation
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
fetch(`${appUrl}/api/readiness/recalculate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
}).catch(() => {});
```

---

### Phase 6: Profile Update Trigger

**File:** `src/app/api/settings/update-profile/route.ts` — **MODIFY**

**Location:** After the successful update response (line ~28, after the `if (error)` check), before the return statement.

**Add fire-and-forget recalculation:**

```typescript
// After the error check — fire-and-forget opportunity/readiness score recalculation
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
fetch(`${appUrl}/api/readiness/recalculate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
}).catch(() => {});
```

---

### Phase 7: Admin User Detail — Readiness Score Display

**File:** `src/components/admin/users/UserProfileAdmin.tsx` — **MODIFY**

**Location:** In the Overview tab, after the existing "Mobility Score" entry in the Identity section grid (line 34).

This is admin-facing, so the label says "Readiness Score" (internal name). Users never see this.

**Add a new grid entry after line 34:**

```typescript
["Readiness Score", profile?.readiness_score != null ? `${profile.readiness_score}/100` : "—"],
```

**Change line 35 from:**
```typescript
].map(([label, value]) => (
```
**to:**
```typescript
["Readiness Score", profile?.readiness_score != null ? `${profile.readiness_score}/100` : "—"],
].map(([label, value]) => (
```

**Conflict note:** The data is already fetched (`profile = profileRes.data` with `select("*")` on users). No server-side query changes needed.

---

## Summary: All 8 Files

| # | File | Action |
|---|------|--------|
| 1 | `src/components/dashboard/home/OpportunityScore.tsx` | **CREATE** — Widget with SVG circle, tier messaging, "X opportunities today" framing, refresh button |
| 2 | `src/app/(dashboard)/dashboard/page.tsx` | **MODIFY** — Add readiness fetch, 24h auto-recalc, render OpportunityScore |
| 3 | `src/components/dashboard/goals/CreateGoalForm.tsx` | **MODIFY** — Add fire-and-forget recalc after goal creation |
| 4 | `src/app/api/documents/vault-upload/route.ts` | **MODIFY** — Add fire-and-forget recalc after vault upload |
| 5 | `src/app/api/services/order/route.ts` | **MODIFY** — Add fire-and-forget recalc after order creation |
| 6 | `src/app/api/settings/update-profile/route.ts` | **MODIFY** — Add fire-and-forget recalc after profile update |
| 7 | `src/components/admin/users/UserProfileAdmin.tsx` | **MODIFY** — Add readiness score display in Overview tab |
| 8 | N/A — `confirm_deposit` RPC | **ALREADY DONE** |

---

## Build Order (Recommended)

| Step | File | Risk | Reason |
|------|------|------|--------|
| 1 | Create Goal Form trigger | 🔵 Low | Client-side only, no dependencies |
| 2 | Documents vault upload trigger | 🔵 Low | Standalone API route, no deps |
| 3 | Services order trigger | 🔵 Low | Standalone API route, no deps |
| 4 | Profile update trigger | 🔵 Low | Standalone API route, no deps |
| 5 | OpportunityScore widget | 🟡 Medium | New component, test visually |
| 6 | Dashboard home integration | 🟡 Medium | Depends on widget existing |
| 7 | Admin user page | 🔵 Low | Data already available, display only |

**Steps 1–4 can be done in parallel.** Steps 5–6 must be sequential.

---

## Sprint 18 Upgrade Path (Future Reference)

When Sprint 18 builds the real opportunities system:

1. **Create `user_opportunity_feed` table** — stores unlocked/dismissed opportunities per user
2. **Replace the temporary formula** in `getOpportunityCount()`:
   ```typescript
   // Remove:
   // return Math.round((score / 100) * 35);
   // Replace with real count passed as prop from server:
   async function getOpportunityCount(userId: string): Promise<number> {
     const { count } = await adminSupabase
       .from("user_opportunity_feed")
       .select("*", { count: "exact", head: true })
       .eq("user_id", userId)
       .eq("is_unlocked", true)
       .eq("is_dismissed", false);
     return count || 0;
   }
   ```
3. **Pass `opportunityCount` as a prop** from `dashboard/page.tsx` to `OpportunityScore` — no component code changes needed

**Zero rework.** The component name, file path, display framing, and prop interface all stay the same. Only the data source changes.

---

## Verification

```bash
npm run build    # Must pass with zero TS errors
npm run lint     # Must pass with no new warnings
```

Test each trigger point:
1. Create a goal → dashboard score + opportunity count updates
2. Upload a document to vault → score + opportunity count updates
3. Place a service order → score + opportunity count updates
4. Update profile → score + opportunity count updates
5. Admin confirms deposit → score auto-updates (already built)
6. Dashboard home shows correct opportunity count + tier + next action
7. "You qualify for X opportunities today" renders with teal highlight on count
8. "Readiness: X/100" shows correctly below the primary message
9. Refresh button re-calculates and updates UI
10. Admin user page shows readiness score
11. Score never exceeds 100 or goes below 0
12. Opportunity count is always `Math.round((score / 100) * 35)` for range 0–35

---

*System 3 Implementation Plan (Opportunity Score framing) — July 2026*
*Platform: Swiipt | swiipt.com*
*Based on Sprint 16 original spec + Vision document naming. Built once, correctly. Zero Sprint 18 rework.*
