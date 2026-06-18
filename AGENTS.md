# Session Tracking

## Goal
Complete the reward system security fixes from `docs/reward_system_security_fixes.md`.

## Progress
### Done
- **Fix 1** — Remove goal-based credit conversion
- **Fix 2** — Qatar visa redemption flow
- **Fix 3** — Credit at service checkout
- **Fix 4** — Spin wheel
- **Number 1** — Admin settings: hotel fee fields
- **Number 2** — API: dynamic pricing logic
- **Number 3** — DB columns for dynamic pricing
- **Number 4-5** — Modal: night selector + dynamic breakdown

### Outstanding Issues
- Premature deposit creation (deposit created before "I Have Sent the Payment")
- No resume flow for abandoned payments (alreadyStarted not handled in modal)
- Abandoned payments show as $0 on return
- No admin visibility for abandoned visa redemptions
- No recovery email flow for abandoned payments

### Documents Created
- `findings/run_this_in_supabase.sql` — SQL migration for visa_redemptions columns
- `findings/cart_abandonment_payment_flow_issues.md` — Full analysis + recommended fixes
