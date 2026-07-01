# Opportunity Score — Testing Walkthrough

## Not Hardcoded

The "18 opportunities today" you saw is **not hardcoded**. It's computed from your actual readiness score using the temporary formula:

```typescript
function getOpportunityCount(score: number): number {
  return Math.round((score / 100) * 35);
}
```

So if you saw 18: `18 = Math.round((score / 100) * 35)` → `score ≈ 51/100`. That's your real `readiness_score` from `calculate_readiness_score()` RPC, which evaluates identity, financial, documents, services, and engagement factors.

**When Sprint 18 builds a real `user_opportunity_feed` table**, this formula will be replaced with a live database count of unlocked, non-dismissed opportunities.

---

## 7 Trigger Points (How to Test)

The score auto-recalculates via fire-and-forget `fetch("/api/readiness/recalculate").catch(() => {})` at these points:

### 1. Dashboard Load (24h auto-recalc)
- Every time you visit the dashboard, the server fetches your current `readiness_score` from the `users` table
- If 24+ hours have passed since `readiness_last_calculated`, a server-side fetch to `/api/readiness/recalculate` fires silently
- **To test:** Visit dashboard → see score. Note: no visual indicator for the auto-recalc; it silently updates the DB value and will show on next page load.

### 2. Refresh Button (manual recalc)
- The Opportunity Score widget has a ↻ Refresh button
- Click it → calls `POST /api/readiness/recalculate` → spinner shows → score updates
- **To test:** Click refresh, watch the spinner, verify the score/value changes

### 3. Create a Goal (in CreateGoalForm.tsx:142)
- After `increment_mobility_score` RPC, fires a fire-and-forget recalc
- **To test:** Go to Goals → Create Goal → fill form → submit → return to dashboard → refresh score

### 4. Upload a Document to Vault (in vault-upload/route.ts:114)
- After passport mobility score block, fires a fire-and-forget recalc
- **To test:** Go to Documents → Upload to vault (especially passport → +30 mobility score) → dashboard → refresh score

### 5. Order a Service (in services/order/route.ts)
- After `activity_log` insert, fires a fire-and-forget recalc
- **To test:** Go to Services → place an order → dashboard → refresh score

### 6. Update Profile (in settings/update-profile/route.ts)
- After successful profile update and before returning, fires a fire-and-forget recalc
- **To test:** Go to Settings → update name/phone/country → dashboard → refresh score

### 7. Admin Deposit Confirmation (in confirm_deposit RPC)
- The `confirm_deposit` RPC already has `PERFORM calculate_readiness_score(dep.user_id)` from `sprint_16_confirm_deposit_mod.sql`
- No additional fire-and-forget needed — this is called directly in the RPC (not via HTTP)
- **To test:** As admin, confirm a deposit → check that user's readiness score updates (visible in admin user profile or user dashboard)

---

## Admin Display

The admin user detail page (`UserProfileAdmin.tsx`) shows "Readiness Score: X/100" in the Overview tab at `src/components/admin/users/UserProfileAdmin.tsx:179`.

---

## Notes

- All recalc triggers are **fire-and-forget** — they never block the user action
- If the `/api/readiness/recalculate` call fails, the user action (goal create, document upload, etc.) still succeeds
- The 24-hour auto-recalc on dashboard load also silently fails — the DB score is better than nothing
- The temporary `opportunityCount` formula (`Math.round((score / 100) * 35)`) caps at 35 opportunities when score is 100/100
