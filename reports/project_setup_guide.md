# Swiipt — Project Setup Guide

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| Git | Clone repository | `winget install git.git` or https://git-scm.com |
| Node.js 18+ | Next.js runtime | `winget install OpenJS.NodeJS.LTS` or https://nodejs.org |
| npm | Package manager | Ships with Node.js |
| Visual Studio Code | Editor (recommended) | `winget install Microsoft.VisualStudioCode` or https://code.visualstudio.com |
| OpenCode CLI | AI coding assistant | Follow instructions at https://opencode.ai |

---

## Step 1 — Clone the Repository

```powershell
cd C:\Users\<YourUser>\Desktop
git clone https://github.com/acceleratefactory/swiipt-platform.git Swiipt
cd Swiipt
```

---

## Step 2 — Install Dependencies

```powershell
npm install
```

---

## Step 3 — Set Up Environment Variables

Create `swiipt/.env.local` (if it doesn't already exist from the clone):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_SECRET=<any-random-string>
```

Get keys from: Supabase Dashboard → Project Settings → API

---

## Step 4 — Verify It Runs

```powershell
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Step 5 — Point OpenCode to the Project

```powershell
# From the swiipt directory:
cd C:\Users\<YourUser>\Desktop\Swiipt\swiipt
opencode
```

OpenCode will auto-detect the project. It reads `AGENTS.md` for full context.

---

## Step 6 — Verify OpenCode Has Context

Once in OpenCode, ask:

```
what is the current state of the project?
```

It should respond with Sprint 16, Trade Show Group Savings, paused booking phase, and post-deployment fixes.

---

## Git Quick Reference

```powershell
git branch           # check current branch
git log --oneline -10  # recent commits
git pull origin main   # get latest
git add -A             # stage all
git commit -m "msg"    # commit
git push origin main   # deploy (auto-deploys to Vercel)
```

---

## Build Verification

```powershell
npm run build
```

Zero TypeScript errors required. Pre-existing eslint warnings are acceptable.

---

## Key Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Complete project knowledge base — read this first |
| `src/types/database.ts` | All 36 table types + RPCs |
| `src/lib/supabase/service.ts` | Admin service client (bypasses RLS) |
| `reports/sprint_16_trade_show_booking_flow_analysis.md` | Booking phase plan (paused) |
| `reports/project_setup_guide.md` | This file |
