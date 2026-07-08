# Opportunity Ingestion Pipeline — Investigation Report

## Executive Summary

Swiipt is NOT a job platform — it is a **global opportunity platform** covering every type of opportunity for every type of human: scholarships, fellowships, visa programmes, sports trials, remote work, internships, training, grants, trade shows, freelance gigs, healthcare placements, skilled trade work, entrepreneurship, and more. The current pipeline only supports RSS feeds and processes at most 3-4 working sources. To reach thousands of opportunities across ALL segments, we need to expand to free APIs, fix the RSS parser, and build a proper cover image system (no gradient fallback). This report covers: the full opportunity landscape, current limitations, scaling strategies per segment, and cover image approaches.

---

## 1. The Full Opportunity Landscape — What Swiipt Covers

### 9 Opportunity Types

| # | Type | Emoji | Description |
|---|------|-------|-------------|
| 1 | `job` | 💼 | Employment opportunities worldwide |
| 2 | `scholarship` | 🎓 | Academic scholarships, fully funded programmes |
| 3 | `fellowship` | 🏆 | Research fellowships, professional fellowships |
| 4 | `visa_programme` | 🛂 | Work visas, residency programmes, citizenship |
| 5 | `sports_trial` | ⚽ | Football trials, academy invitations, agent representation |
| 6 | `remote_work` | 💻 | Remote job listings, digital nomad opportunities |
| 7 | `internship` | 📋 | Internships, graduate programmes |
| 8 | `training` | 📚 | Professional training, certifications, courses |
| 9 | `grant` | 💰 | Business grants, research grants, funding |

### 10 Career Segments

| # | Segment | Who They Are |
|---|---------|-------------|
| 1 | `job_seeker` | People looking for international employment |
| 2 | `student` | Students seeking scholarships, fellowships, study abroad |
| 3 | `healthcare` | Nurses, doctors, healthcare workers seeking UK/UAE/Canada placements |
| 4 | `tech_professional` | Developers, designers, product people seeking remote/relocation |
| 5 | `footballer` | Football players seeking trials, academies, agent representation |
| 6 | `sports_professional` | Athletes across basketball, athletics, swimming, etc. |
| 7 | `freelancer` | Freelancers and creators seeking international clients |
| 8 | `entrepreneur` | Business owners seeking trade shows, market entry, expansion |
| 9 | `trade_worker` | Electricians, plumbers, construction workers seeking Gulf/Europe |
| 10 | `caregiver` | Caregivers and domestic workers seeking UK/Canada/UAE placements |

### Extended Types (Supported in UI, Not Yet in DB Schema)

The FallbackTile component already supports 17+ types including: `competition`, `conference`, `exchange`, `trade_show`, `trial`, `healthcare`, `residency`, `citizenship`, `funding`, `contest`, `accelerator`, `award`. These could be added to the `opportunity_types` table to expand the platform's scope.

---

## 2. Evidence-First Architecture — The Core Mental Model

### Current Mental Model (Wrong)
```
Source → Opportunity
```
The system collects "opportunities" directly. This limits the platform to only handle formats that look like opportunities from the start.

### Proposed Mental Model (Correct)
```
Source → Evidence → Enrichment → Opportunity
```
The system collects **evidence** first. Everything entering the pipeline is an Evidence object — raw, unvalidated, unclassified. Only after processing does it become an Opportunity.

### What Is an Evidence Object?

Every piece of data entering the system, regardless of format, becomes an Evidence object:

| Input Format | Evidence Type | Example |
|---|---|---|
| RSS item | `rss` | BBC News RSS feed entry |
| API response | `api` | RemoteOK JSON job listing |
| Email | `email` | Partner sending opportunity via email |
| Partner submission | `partner` | Organisation submitting via API |
| PDF | `pdf` | University scholarship PDF announcement |
| Government announcement | `government` | Embassy visa bulletin update |
| Facebook post | `social_facebook` | Football academy posting trials on Facebook |
| LinkedIn post | `social_linkedin` | Company announcing graduate programme |
| Telegram message | `messaging` | Scholarship alert from Telegram channel |
| Football academy website | `web` | Academy page with trial dates |
| Trade fair page | `web` | 10times.com listing for Canton Fair |
| University page | `web` | University scholarship page |
| Visa bulletin | `government` | Monthly visa bulletin from embassy |
| Manual admin entry | `manual` | Admin pasting a URL or typing details |
| URL paste | `url` | Admin pasting a URL for AI prefill |
| Watcher change detection | `watcher` | Page changed since yesterday, new content detected |

### Evidence Object Structure

```typescript
interface Evidence {
  id: string;
  evidence_type: 'rss' | 'api' | 'web' | 'email' | 'partner' | 'pdf' | 
                  'government' | 'social_facebook' | 'social_linkedin' | 
                  'messaging' | 'manual' | 'url' | 'watcher';
  raw_data: JSONB;           // Original data exactly as received
  source_url: string | null; // Where it came from
  source_name: string | null;
  content_hash: string;      // For dedup and change detection
  captured_at: TIMESTAMPTZ;  // When we received it
  enrichment_status: 'pending' | 'processing' | 'enriched' | 'failed';
  opportunity_id: string | null; // Set after enrichment creates an Opportunity
}
```

### Why Evidence-First Matters

1. **Future-proof:** When a new input format appears (e.g., WhatsApp broadcast, podcast mention, radio announcement), you just add a new Evidence ingestion adapter. The enrichment pipeline stays unchanged.

2. **Audit trail:** You keep the original raw data forever. If the source changes or disappears, you still have the original evidence.

3. **Re-processing:** If the AI enrichment improves, you can re-process old Evidence objects to extract better Opportunities.

4. **Quality control:** You can inspect Evidence before it becomes an Opportunity. Admin review happens at the Evidence stage, not the Opportunity stage.

5. **Multi-source merging:** The same Opportunity can be created from multiple Evidence objects (e.g., a scholarship announced on both the university website and a news RSS feed). Evidence linking handles dedup at the Opportunity level.

---

## 3. Current Pipeline — What Actually Works

### Ingest Flow
```
opportunity_sources → [INGEST] → opportunity_queue → [PROCESS-QUEUE] → AI enrichment → opportunities
```

### Critical Limitations

| Issue | Detail |
|---|---|
| **Only RSS works** | `api`, `scraper`, `manual` source types have zero implementation |
| **Hand-rolled RSS parser** | Regex-based, misses Atom feeds, namespaces, media enclosures |
| **No API handler** | `api` type sources are selected but silently skipped |
| **No scraper** | `scraper` type sources are dead |
| **No OG fetch in pipeline** | All auto-published items have `cover_image_url = null` |
| **No feed item cap** | Could process thousands of items per source in one run |
| **20-item batch limit** | Process-queue processes only 20 items per invocation |
| **1-hour global cooldown** | High-frequency sources throttled to hourly pulls |
| **Type defaults to "job"** | If AI doesn't classify correctly, non-job opportunities get misclassified |
| **No sports_professional sources** | Zero sources for this segment |
| **No caregiver sources** | Zero sources for this segment |

### Of 22 Re-Seeded Sources — Reality Check

| Type | Count | Actually Working? |
|---|---|---|
| RSS | 6 | 3-4 real feeds (Scholars4Dev, Opportunity Desk, Health Careers UK, We Work Remotely) |
| API | 5 | 1 real API (RemoteOK). Stack Overflow Jobs and GitHub Jobs shut down in 2022 |
| Scraper | 7 | 0 — no scraper implementation |
| Manual | 4 | 0 — excluded from ingest query |

**Bottom line: 3-4 real RSS feeds are the only working data source.**

---

## 4. Sources by Segment — Where to Find Thousands of Opportunities

### Segment 1: Job Seekers (💼)

**Free APIs:**

| API | Auth | Volume | URL |
|---|---|---|---|
| Himalayas | None | Unlimited, paginated | `https://himalayas.app/jobs/api` |
| Arbeitnow | None | Unlimited | `https://www.arbeitnow.com/api/job-board-api` |
| RemoteOK | None | Full feed | `https://remoteok.com/api` |
| Adzuna | API key (free) | 250/month | `https://api.adzuna.com/v1/api/jobs` |
| Jooble | API key (free) | 1000/month | `https://jooble.org/api/` |
| USAJOBS | API key (free) | 1000/hour | `https://data.usajobs.gov/api` |
| Juju | API key (free) | Millions | `https://www.juju.com/` |
| Careerjet | API key (free) | Limited | `https://public.api.careerjet.net/` |

**RSS Feeds:**

| Feed | URL |
|---|---|
| We Work Remotely | `https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss` |
| FlexJobs | `https://www.flexjobs.com/rss` |
| Jobs.ac.uk | `https://www.jobs.ac.uk/feed/` |
| UK Government | `https://www.gov.uk/search/all.rss` |
| Govt Jobs Blog | `https://www.govtjobsblog.in/feed/` |

**Estimated volume: 50,000-200,000+ unique job opportunities**

### Segment 2: Students & Scholars (🎓)

**Free APIs:**

| API | Auth | Volume | URL |
|---|---|---|---|
| ScholarshipAPI | API key | 7,000+ scholarships | `https://api.scholarshipapi.com/v1/search` |

**RSS Feeds:**

| Feed | URL |
|---|---|
| Scholars4Dev | `https://www.scholars4dev.com/feed/` |
| Opportunity Desk | `https://opportunitydesk.org/category/scholarships/feed/` |
| Scholarship Union | `https://scholarshipunion.com/feed/` |
| Scholars Portal | `https://scholarsportal.com/feed/` |
| Gilman Scholarship | `https://www.gilmanscholarship.org/feed/` |
| HKU Legal Scholarship | `http://researchblog.law.hku.hk/feeds/posts/default?alt=rss` |

**Scraping targets (high volume):**

| Source | Volume | URL |
|---|---|---|
| Scholarship Positions | 1000+ | `https://www.scholarshippositions.com/` |
| ScholarshipPortal | 500+ | `https://www.scholarship-portal.com/` |
| Bold.org | 240+ | `https://bold.org/scholarships/` |
| BigFuture (College Board) | 1000+ | `https://bigfuture.collegeboard.org/scholarships` |
| MastersPortal | 200+ | `https://www.mastersportal.com/scholarships` |

**Estimated volume: 10,000-30,000+ scholarships worldwide**

### Segment 3: Healthcare Professionals (🏥)

**RSS Feeds:**

| Feed | URL |
|---|---|
| Health Careers UK | `https://www.healthcareers.nhs.uk/feed` |
| NHS Jobs | `https://www.jobs.nhs.uk/feed` |
| Nursing Jobs Australia | RSS available |
| Doctors Net UK | `https://www.doctors.net.uk/feed/jobs` |

**Scraping targets:**

| Source | Volume | URL |
|---|---|---|
| NHS Jobs International | 500+ | `https://www.jobs.nhs.uk/` |
| NurseConnect UAE | 200+ | UAE healthcare recruitment |
| Health Recruitment International | 300+ | International healthcare |
| Medacs Healthcare | 400+ | `https://www.medacs.com/` |

**Estimated volume: 2,000-5,000+ healthcare opportunities**

### Segment 4: Tech Professionals (💻)

**Free APIs:**

| API | Auth | Volume | URL |
|---|---|---|---|
| RemoteOK | None | Full feed | `https://remoteok.com/api` |
| Findwork | API key | Unlimited | `https://findwork.dev/api/` |
| GraphQL Jobs | None | Unlimited | `https://graphqljobs.com/` |
| DevITjobs UK | None | Unlimited | `https://devitjobs.co.uk/` |

**RSS Feeds:**

| Feed | URL |
|---|---|
| We Work Remotely | `https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss` |
| RemoteOK | `https://remoteok.com/remote-jobs.rss` |

**Estimated volume: 10,000-50,000+ tech opportunities**

### Segment 5: Footballers (⚽)

**Sources:**

| Source | Type | URL |
|---|---|---|
| TransferMarkt | Scraper | `https://www.transfermarkt.com/` |
| Right to Dream Academy | Manual | `https://www.righttodream.com/` |
| Aspire Academy Qatar | Manual | `https://www.aspire.qa/` |
| IMG Academy | Manual | `https://www.imgacademy.com/` |
| Scout7 Africa | API | Football scouting platform |
| World Football Academy | Manual | `https://www.worldfootballacademy.com/` |
| Global Football Trials UK | Manual | `https://www.globalfootballtrials.com/` |
| API-Football | API (free tier) | `https://www.api-football.com/` — fixtures, teams, transfer data |

**Estimated volume: 500-2,000+ football opportunities**

### Segment 6: Sports Professionals (🏆)

**Sources:**

| Source | Type | URL |
|---|---|---|
| API-Sports | API (free tier) | `https://api-sports.io/` — 12 sports, 2000+ leagues |
| Sportmonks | API (trial) | `https://www.sportmonks.com/` |
| iSports API | API (trial) | `https://www.isportsapi.com/` |
| ProSwim | Manual | Swimming career opportunities |
| BasketballAfrica League | Manual | BAL opportunities |

**Estimated volume: 1,000-5,000+ sports opportunities**

### Segment 7: Freelancers & Creators (🎨)

**Free APIs:**

| API | Auth | Volume | URL |
|---|---|---|---|
| Himalayas | None | Unlimited | `https://himalayas.app/jobs/api` |
| Arbeitnow | None | Unlimited | `https://www.arbeitnow.com/api/job-board-api` |

**Scraping targets:**

| Source | Volume | URL |
|---|---|---|
| Upwork | 100,000+ | `https://www.upwork.com/` (ToS risk) |
| Fiverr | 50,000+ | `https://www.fiverr.com/` (ToS risk) |
| Freelancer.com | 50,000+ | `https://www.freelancer.com/` |
| Toptal | 1,000+ | `https://www.toptal.com/` |
| Contra | 5,000+ | `https://www.contra.com/` |
| PeoplePerHour | 10,000+ | `https://www.peopleperhour.com/` |

**Estimated volume: 5,000-20,000+ freelance opportunities**

### Segment 8: Entrepreneurs & SMEs (🚀)

**Sources:**

| Source | Type | URL |
|---|---|---|
| Canton Fair | Manual | `https://www.cantonfair.org.cn/` |
| GITEX Global | Manual | `https://www.gitex.com/` |
| Y Combinator | RSS | `https://www.ycombinator.com/blog/` |
| Global Entrepreneurship Network | RSS | `https://www.gen.global/` |
| Seedstars | Manual | `https://seedstars.com/` |
| African Business Heroes | Manual | `https://africanbusinessheroes.com/` |
| 10times.com | Scraper | `https://10times.com/` — 100,000+ trade shows/expos worldwide |
| Global Events Pedia | Scraper | `https://globaleventspedia.com/` — international trade fairs |
| ExpoSaga | Scraper | `https://exposaga.com/` — exhibitions worldwide |

**Estimated volume: 5,000-50,000+ trade shows, expos, and business opportunities**

### Segment 9: Skilled Trade Workers (🔧)

**Sources:**

| Source | Type | URL |
|---|---|---|
| Trade Jobs Abroad | RSS | International trade job listings |
| Construction Jobs International | RSS | Construction opportunities worldwide |
| Skilled Trades Canada | RSS | Canadian skilled trades immigration |
| Trades UK Visa Jobs | RSS | UK trade worker visa sponsorships |
| Indeed (various) | API | General job search filtered by trade |

**Estimated volume: 2,000-10,000+ trade worker opportunities**

### Segment 10: Caregivers & Domestic Workers (❤️)

**Sources:**

| Source | Type | URL |
|---|---|---|
| NHS Care Jobs | RSS | UK caregiver placements |
| Care UK | RSS | `https://www.careuk.co.uk/` |
| Canadian Caregiver Programme | Manual | Government programme |
| UAE Domestic Worker Programme | Manual | Government programme |

**Estimated volume: 1,000-3,000+ caregiver opportunities**

---

## 5. Ingestion Methods — 6 Ways to Collect Evidence

### Method 1: RSS Feeds
The existing method. Parses XML feeds for new items. Works for news sites, job boards, scholarship aggregators, government announcements. Uses `rss-parser` npm package (replaces hand-rolled regex parser). Covers ~30% of sources.

### Method 2: APIs
REST/JSON endpoints that return structured data. Many free APIs exist (Himalayas, Arbeitnow, RemoteOK, Adzuna, Jooble, USAJOBS). Requires an adapter per API to map response to Evidence format. Covers ~25% of sources.

### Method 3: Watchers
**New ingestion method.** A watcher periodically checks a page that doesn't have RSS. The concept is simple:
- Every 24 hours, fetch the page content
- Compute a content hash (SHA-256 of the HTML body)
- Compare to yesterday's hash
- If changed: extract new content, create Evidence, send into pipeline
- If unchanged: skip

**Examples of pages to watch:**
- Embassy announcements (visa bulletins, policy changes)
- FIFA academy pages (trial dates, registration deadlines)
- University scholarship pages (new rounds, deadline extensions)
- Football trial pages (open trials, talent identification)
- Startup grant pages (new funding rounds)
- Government funding pages (new programmes)
- Trade fair pages (new events, date changes)

**Why watchers instead of scraping:**
- No headless browser (Playwright/Puppeteer)
- No proxy rotation
- No CAPTCHA solving
- Just `fetch()` + hash comparison
- If the page structure changes, the watcher still detects the change — the AI enrichment step handles extracting the relevant information from the new HTML

**Implementation:**
- `opportunity_sources` table gets a `watcher_config` JSONB column: `{ "url": "...", "selector": "main", "interval_hours": 24 }`
- A cron job runs every 6 hours, checks which watchers are due
- For each due watcher: fetch URL, hash body, compare to `last_content_hash`
- If changed: create Evidence with `evidence_type = 'watcher'`, `raw_data = { url, old_hash, new_hash, html }`
- If unchanged: update `last_checked_at` and move on

### Method 4: Manual Admin Entry
Admin creates opportunities directly via the existing admin form. Already built (`CreateOpportunityForm.tsx`). Evidence is created with `evidence_type = 'manual'`.

### Method 5: URL Paste
Admin pastes a URL, AI pre-fetches and pre-fills the opportunity form. Already built (`PasteUrlForm.tsx`). Evidence is created with `evidence_type = 'url'`.

### Method 6: Partner Submissions
Organisations submit opportunities via API or public form. Evidence is created with `evidence_type = 'partner'`. Requires authentication (API key for organisations, email verification for public form).

### Evidence Type Summary

| Method | Evidence Type | Coverage | Cost | Status |
|---|---|---|---|---|
| RSS | `rss` | ~30% | $0 | Built |
| APIs | `api` | ~25% | $0 | Not built |
| Watchers | `watcher` | ~20% | $0 | Not built |
| Manual | `manual` | ~10% | $0 | Built |
| URL Paste | `url` | ~10% | $0 | Built |
| Partners | `partner` | ~5% | $0 | Not built |
| **Total** | | **100%** | **$0** | |

---

## 6. Cover Image System — No Gradient Fallback

### Current State
- `og-fetch.ts` exists but is NOT wired into the pipeline (gap J.9)
- All auto-published items show FallbackTile (gradient + emoji)
- Only paste-URL admin feature uses OG extraction
- The gradient fallback looks cheap and unprofessional

### The Problem with Gradient Fallback
- Every opportunity looks the same — just a colored gradient with an emoji
- No visual differentiation between opportunities
- Users scroll past gradient tiles because they look like placeholders
- Social media platforms use real images — our feed should too

### Cover Image Strategy — 4 Layers (Priority Order)

**Layer 1: OG Image Extraction (Immediate — $0)**
- Wire `fetchOGMedia()` into `process-queue/route.ts`
- Fetch `og:image`, `twitter:image` from the opportunity URL
- Validate image exists and is accessible
- Coverage: ~60-70% of opportunities have OG images
- Cost: $0 (just HTTP requests)
- This alone covers the majority of opportunities

**Layer 2: Organisation Logo Lookup (Immediate — $0)**
- Many organisations have standard logos (Google, NHS, Chevening, DAAD, etc.)
- Build a logo cache: map `organisation` → `logo_url`
- Use Clearbit Logo API: `https://logo.clearbit.com/{domain}` (free, no auth)
- For known organisations, fetch and cache their logo
- Coverage: ~20-30% of opportunities from known organisations
- Cost: $0

**Layer 3: AI-Generated Cover Images (For Items Without OG Images)**
- Use **Pollinations.ai** — free, no auth, generates images from text prompts
- Prompt template: `"Professional {type} opportunity cover image, {organisation}, {country}, modern clean design, high quality, no text"`
- Generate once on publish, cache the image URL
- Coverage: 100% of remaining items without images
- Cost: $0 (Pollinations.ai is free)
- Quality: Good enough for social media feed cards

**Layer 4: Branded Template Images (Fallback — $0)**
- If Pollinations fails, generate a branded template using server-side rendering
- NOT the current gradient — a proper designed template with:
  - Type-specific photography (e.g., graduation cap for scholarships, stethoscope for healthcare, football for sports)
  - Country flag overlay
  - Organisation name in clean typography
  - Swiipt brand watermark
- Use Node.js `canvas` or `sharp` to render as PNG
- This is the LAST resort, not the first
- Cost: $0 (server-side rendering)

### Cover Image Priority Flow
```
Opportunity ingested
  → Try OG image extraction (Layer 1)
    → Found? Use it. Done.
    → Not found? Try org logo lookup (Layer 2)
      → Found? Use it. Done.
      → Not found? Generate AI image (Layer 3)
        → Success? Use it. Done.
        → Failed? Generate branded template (Layer 4)
```

### Expected Coverage
| Layer | Coverage | Cost |
|---|---|---|
| OG Image | ~60-70% | $0 |
| Org Logo | ~10-15% | $0 |
| AI Generated | ~15-25% | $0 |
| Branded Template | ~1-3% | $0 |
| **Total with images** | **~97-100%** | **$0** |

---

## 7. Provenance Tracking — Every Opportunity Knows Why It Exists

### The Problem
Without provenance tracking, you can't answer:
- Where did this opportunity come from?
- Who edited it?
- Which AI extracted it?
- Which source created it?
- Why was it approved?
- Is this source still trustworthy?

### Provenance Record Structure

Every Opportunity should carry its full history:

```typescript
interface ProvenanceRecord {
  // Source provenance
  source_id: string;              // Which opportunity_source created this
  source_evidence_id: string;     // Which Evidence object originated this
  evidence_type: string;          // rss, api, watcher, manual, url, partner
  
  // AI extraction provenance
  ai_model: string | null;        // e.g., "gemini-1.5-flash", "deepseek-chat"
  ai_prompt_version: string;      // Which prompt version was used
  ai_confidence: number;          // 0-1, how confident was the AI
  ai_raw_response: JSONB | null;  // Full AI response for debugging
  
  // Human provenance
  created_by: string | null;      // admin user_id if manually created
  edited_by: string[];            // array of user_ids who edited
  edited_at: TIMESTAMPTZ[];       // array of edit timestamps
  approved_by: string | null;     // admin who approved (for review_all tier)
  approved_at: TIMESTAMPTZ | null;
  
  // Quality provenance
  confidence_history: JSONB;      // Array of { score, reason, timestamp }
  // Example: [
  //   { "score": 0.85, "reason": "ai_extraction", "timestamp": "2026-01-15T10:00:00Z" },
  //   { "score": 0.92, "reason": "admin_review", "timestamp": "2026-01-15T11:30:00Z" }
  // ]
  
  // Source trust provenance
  source_trust_tier: string;      // trusted, standard, review_all
  source_degraded: boolean;       // Has source been downgraded?
  source_degraded_at: TIMESTAMPTZ | null;
  
  // Timestamps
  captured_at: TIMESTAMPTZ;       // When Evidence was captured
  enriched_at: TIMESTAMPTZ | null; // When AI enrichment happened
  published_at: TIMESTAMPTZ | null; // When published to feed
}
```

### Where Provenance Is Used

1. **Admin review queue:** When reviewing `review_all` items, admin sees the full provenance chain — source, AI extraction, confidence scores
2. **Source trust management:** If a source consistently produces low-quality items, its trust tier can be downgraded. Provenance records show the pattern.
3. **Re-processing:** When AI models improve, old Evidence can be re-enriched. Provenance tracks which model version produced which opportunity.
4. **Dispute resolution:** If a user reports a fake opportunity, provenance shows exactly where it came from, who approved it, and what the AI confidence was.
5. **Source analytics:** Track which sources produce the most saves, applies, and engaged users. Double down on high-quality sources.
6. **Audit compliance:** For regulatory purposes, every published item has a complete trail from capture to publication.

### Provenance in the Database

Add a `provenance` JSONB column to the `opportunities` table:

```sql
ALTER TABLE opportunities ADD COLUMN provenance JSONB DEFAULT '{}'::jsonb;
```

The JSONB column stores the full provenance record. This is flexible — different evidence types can have different provenance shapes. The AI enrichment step populates the AI fields. The publish step populates the approval fields. The edit step appends to the edited_by/edited_at arrays.

### Provenance Query Examples

```sql
-- Find all opportunities from a specific source
SELECT * FROM opportunities WHERE provenance->>'source_id' = 'abc123';

-- Find all opportunities approved by a specific admin
SELECT * FROM opportunities WHERE provenance->>'approved_by' = 'admin-user-id';

-- Find opportunities with low AI confidence
SELECT * FROM opportunities 
WHERE (provenance->>'ai_confidence')::float < 0.7;

-- Track source quality over time
SELECT 
  source_id,
  AVG((provenance->>'ai_confidence')::float) as avg_confidence,
  COUNT(*) as total_items,
  SUM(CASE WHEN is_saved THEN 1 ELSE 0 END) as saves
FROM opportunities
GROUP BY source_id;
```

---

## 8. Implementation Roadmap

### Phase 1 — Fix What's Broken (1-2 days)
- Wire `fetchOGMedia()` into `process-queue/route.ts`
- Add feed item cap (max 100 per source per run)
- Increase process-queue batch from 20 to 100 items
- Remove 1-hour global cooldown (replace with per-source configurable cooldown)
- Replace hand-rolled RSS parser with `rss-parser` npm package
- Remove dead sources (GitHub Jobs, Stack Overflow Jobs)
- Fix type defaulting — AI should classify non-job types correctly

### Phase 2 — Evidence-First Architecture (3-5 days)
- Create `evidence` table with columns: `id`, `evidence_type`, `raw_data` (JSONB), `source_url`, `source_name`, `content_hash`, `captured_at`, `enrichment_status`, `opportunity_id`
- Define `evidence_type` enum with 13 values: `rss`, `api`, `web`, `email`, `partner`, `pdf`, `government`, `social_facebook`, `social_linkedin`, `messaging`, `manual`, `url`, `watcher`
- Add `provenance` JSONB column to `opportunities` table
- Create Evidence ingestion adapters for all 6 methods (RSS, API, Watcher, Manual, URL, Partner)
- Update pipeline to process Evidence → Opportunity (enrichment step)
- Add provenance tracking to pipeline (populate `provenance` JSONB on publish)
- Migrate existing `opportunity_queue` items to Evidence format

### Phase 3 — Add Free APIs (2-3 days)
- Implement `api` source type handler in `ingest/route.ts`
- Add Himalayas API adapter (no auth, paginated)
- Add Arbeitnow API adapter (no auth)
- Add Adzuna adapter (free API key)
- Add Jooble adapter (free API key)
- Add USAJOBS adapter (free API key)
- Add Findwork adapter (free API key)
- Test each with real data

### Phase 4 — Watchers (2-3 days)
- Add `watcher_config` JSONB column to `opportunity_sources` table
- Add `last_content_hash` and `last_checked_at` columns to `opportunity_sources`
- Create watcher cron job (runs every 6 hours, checks which watchers are due)
- Implement content hash comparison (SHA-256 of HTML body)
- Create Evidence with `evidence_type = 'watcher'` when content changes
- Add 10+ initial watchers for embassy pages, FIFA academy, university scholarships, government funding

### Phase 5 — Scale Sources by Segment (1-2 weeks)
- Add 20+ real RSS feeds across ALL segments (not just jobs)
- Add 15+ free API sources across ALL segments
- Add source health monitoring (error rates, empty feeds)
- **Job Seekers RSS:** We Work Remotely, FlexJobs, Jobs.ac.uk, UK Government, Govt Jobs Blog
- **Job Seekers APIs:** Himalayas, Arbeitnow, RemoteOK, Adzuna, Jooble, USAJOBS, Juju, Careerjet
- **Students RSS:** Scholars4Dev, Opportunity Desk, Scholarship Union, Scholars Portal, Gilman Scholarship
- **Students APIs:** ScholarshipAPI
- **Healthcare RSS:** Health Careers UK, NHS Jobs
- **Healthcare APIs:** Health eCareers
- **Tech RSS:** Hacker News Who's Hiring, Remote OK Blog
- **Tech APIs:** Findwork, Remotive
- **Sports RSS:** FIFA.com, BBC Sport
- **Sports APIs:** API-Sports, Sportmonks
- **Entrepreneur RSS:** 10times.com, Global Events Pedia, AngelList
- **Entrepreneur APIs:** Crunchbase (limited free)
- **Caregiver RSS:** Care.com, UK Care Jobs
- **Trade Worker RSS:** GulfTalent, Trade Jobs UK

### Phase 6 — Cover Image System (3-5 days)
- Wire OG fetch into pipeline (Layer 1)
- Build org logo cache with Clearbit (Layer 2)
- Integrate Pollinations.ai for AI-generated covers (Layer 3)
- Build branded template renderer as final fallback (Layer 4)
- Test across all opportunity types

### Phase 7 — Expanded Types (1 week)
- Add new types to `opportunity_types` table: `competition`, `conference`, `exchange`, `trade_show`, `residency`, `citizenship`, `funding`, `contest`, `accelerator`, `award`
- Update AI prompts to recognise new types
- Update FallbackTile to use new type gradients only as LAST resort

### Phase 8 — Partner Submissions (2-3 days)
- Build `POST /api/opportunities/submit` public endpoint for organisations
- Add API key authentication for partner organisations
- Add rate limiting (max 100 submissions per partner per day)
- Create partner submission queue (separate from admin queue)
- Add partner submission validation (required fields, URL format, duplicate check)
- Build partner dashboard showing submission status and published opportunities

### Phase 9 — Provenance Analytics (3-5 days)
- Build admin dashboard showing source quality metrics (avg confidence, saves per source)
- Build provenance inspector (click any opportunity to see full history)
- Build source trust auto-downgrade (if avg confidence < 0.6 for 30 days, auto-downgrade tier)
- Build re-processing queue UI (old Evidence can be re-enriched with improved AI)
- Add provenance query endpoints for admin analytics
- Add provenance export (CSV/JSON for external analysis)

### Phase 10 — Concurrent Processing (2-3 days)
- Implement parallel source processing with configurable concurrency (default: 5)
- Add rate limiting per API source (respect API limits)
- Add priority queue (trusted sources process first)
- Add processing metrics (items/minute, error rate, avg processing time)
- Add circuit breaker (pause source if 3 consecutive failures)

---

## 9. Expected Volume After Fixes

| Segment | Current | After Phase 3 |
|---|---|---|
| Job Seekers | ~30 | 50,000-200,000 |
| Students/Scholars | ~5 | 10,000-30,000 |
| Healthcare | ~3 | 2,000-5,000 |
| Tech Professionals | ~5 | 10,000-50,000 |
| Footballers | ~0 | 500-2,000 |
| Sports Professionals | ~0 | 1,000-5,000 |
| Freelancers | ~0 | 5,000-20,000 |
| Entrepreneurs | ~2 | 5,000-50,000 |
| Trade Workers | ~0 | 2,000-10,000 |
| Caregivers | ~0 | 1,000-3,000 |
| **TOTAL** | **~45** | **86,500-375,000** |

**With deduplication and quality filtering, expect 20,000-100,000+ unique opportunities available at any time across all segments.**

---

## 10. Complete Career Segments — Exhaustive List

The platform currently has 10 career segments. The following is a comprehensive list of ALL career segments the platform should eventually support. This is NOT the current implementation — this is the full vision for a robust, globally-complete platform.

### Current Career Segments (10)
| Slug | Name | Description |
|---|---|---|
| `job_seeker` | Job Seekers | General employment seekers |
| `student` | Students | Undergraduate and graduate students |
| `healthcare` | Healthcare Workers | Doctors, nurses, healthcare professionals |
| `tech_professional` | Tech Professionals | Software engineers, IT professionals |
| `footballer` | Footballers | Football/soccer players |
| `sports_professional` | Sports Professionals | Athletes in other sports |
| `freelancer` | Freelancers | Independent contractors, gig workers |
| `entrepreneur` | Entrepreneurs | Business founders, startup owners |
| `trade_worker` | Trade Workers | Electricians, plumbers, mechanics |
| `caregiver` | Caregivers | Elderly care, childcare, disability support |

### Additional Career Segments to Add (40+)

**Academic & Research:**
| Slug | Name | Description |
|---|---|---|
| `academic` | Academics | Professors, researchers, lecturers |
| `researcher` | Researchers | Lab scientists, research fellows |
| `postdoc` | Postdoctoral Fellows | Postdoctoral researchers |
| `phd_candidate` | PhD Candidates | Doctoral students |

**Creative & Media:**
| Slug | Name | Description |
|---|---|---|
| `creative` | Creatives | Artists, designers, musicians, writers |
| `journalist` | Journalists | Reporters, editors, content creators |
| `media_professional` | Media Professionals | Broadcasting, film, entertainment |
| `fashion_professional` | Fashion Professionals | Fashion design, modeling, styling |
| `beauty_professional` | Beauty Professionals | Cosmetology, aesthetics |

**Legal & Finance:**
| Slug | Name | Description |
|---|---|---|
| `lawyer` | Lawyers | Attorneys, legal professionals |
| `accountant` | Accountants | Finance, accounting professionals |
| `banking_professional` | Banking Professionals | Banking, financial services |

**Education:**
| Slug | Name | Description |
|---|---|
| `teacher` | Teachers | K-12 educators, tutors |
| `educator` | Educators | Education administrators, specialists |

**Engineering & Science:**
| Slug | Name | Description |
|---|---|
| `engineer` | Engineers | Civil, mechanical, electrical engineers |
| `scientist` | Scientists | Research scientists, lab professionals |
| `architect` | Architects | Building design, urban planning |

**Healthcare (Extended):**
| Slug | Name | Description |
|---|---|
| `nurse` | Nurses | Specialized nursing professionals |
| `dentist` | Dentists | Dental professionals |
| `pharmacist` | Pharmacists | Pharmaceutical professionals |
| `veterinarian` | Veterinarians | Animal healthcare |
| `therapist` | Therapists | Physical therapy, occupational therapy |

**Skilled Trades (Extended):**
| Slug | Name | Description |
|---|---|
| `construction_worker` | Construction Workers | Construction managers, site workers |
| `mechanic` | Mechanics | Automotive, industrial mechanics |
| `welder` | Welders | Welding, fabrication professionals |

**Transport & Logistics:**
| Slug | Name | Description |
|---|---|
| `pilot` | Pilots | Aviation professionals |
| `maritime_professional` | Maritime Professionals | Ship crew, marine professionals |
| `logistics_professional` | Logistics Professionals | Supply chain, warehousing |
| `driver` | Drivers | Truck, delivery drivers |

**Hospitality & Service:**
| Slug | Name | Description |
|---|---|
| `hospitality_professional` | Hospitality Professionals | Hotels, restaurants, tourism |
| `chef` | Chefs | Culinary professionals |
| `retail_professional` | Retail Professionals | Sales, merchandising |

**Public Service:**
| Slug | Name | Description |
|---|---|
| `government_official` | Government Officials | Public sector, civil service |
| `military_personnel` | Military Personnel | Armed forces, defense |
| `police_officer` | Police Officers | Law enforcement |
| `firefighter` | Firefighters | Fire services |
| `diplomat` | Diplomats | Foreign service, international relations |

**Sports & Fitness:**
| Slug | Name | Description |
|---|---|
| `coach` | Coaches | Sports coaches, trainers |
| `fitness_professional` | Fitness Professionals | Personal trainers, gym instructors |
| `sports_manager` | Sports Managers | Sports management, administration |

**Nonprofit & Social Impact:**
| Slug | Name | Description |
|---|---|
| `nonprofit_worker` | Nonprofit Workers | NGO, charity workers |
| `social_worker` | Social Workers | Community development |
| `environmentalist` | Environmentalists | Conservation, sustainability |

**Agriculture & Natural Resources:**
| Slug | Name | Description |
|---|---|
| `farmer` | Farmers | Farming, agribusiness |
| `miner` | Miners | Mining, oil & gas |
| `energy_professional` | Energy Professionals | Renewable energy, power |

**Real Estate:**
| Slug | Name | Description |
|---|---|
| `real_estate_professional` | Real Estate Professionals | Property agents, developers |

**Telecommunications:**
| Slug | Name | Description |
|---|---|
| `telecom_professional` | Telecom Professionals | Network, telecom |

**Military & Defense:**
| Slug | Name | Description |
|---|---|
| `veteran` | Veterans | Military veterans transitioning to civilian careers |

**Life Stage Segments:**
| Slug | Name | Description |
|---|---|
| `recent_graduate` | Recent Graduates | Within 2 years of graduation |
| `career_changer` | Career Changers | Switching careers |
| `returning_parent` | Returning Parents | Returning to workforce after parental leave |
| `retiree` | Retirees | Semi-retired, seeking part-time work |
| `gap_year` | Gap Year | Taking a gap year |
| `expatriate` | Expatriates | Living and working abroad |
| `immigrant` | Immigrants | New immigrants seeking opportunities |
| `refugee` | Refugees | Displaced persons seeking opportunities |

**Total Career Segments: 50+**

---

## 11. Complete Opportunity Types — Exhaustive List

The platform currently has 9 opportunity types. The following is a comprehensive list of ALL opportunity types the platform should eventually support. This is NOT the current implementation — this is the full vision for a robust, globally-complete platform.

### Current Opportunity Types (9)
| Slug | Label | Description |
|---|---|---|
| `job` | Job | Full-time, part-time employment |
| `scholarship` | Scholarship | Academic scholarships |
| `fellowship` | Fellowship | Research/professional fellowships |
| `visa_programme` | Visa Programme | Visa programmes, work permits |
| `sports_trial` | Sports Trial | Sports trials, talent identification |
| `remote_work` | Remote Work | Remote work opportunities |
| `internship` | Internship | Internship programmes |
| `training` | Training | Training programmes, workshops |
| `grant` | Grant | Grants, funding |

### Additional Opportunity Types to Add (50+)

**Employment & Work:**
| Slug | Label | Description |
|---|---|---|
| `apprenticeship` | Apprenticeship | Structured learning + work |
| `co_op` | Co-op | Co-operative education |
| `contract` | Contract | Fixed-term contract work |
| `temporary` | Temporary | Temporary positions |
| `seasonal` | Seasonal | Seasonal work (harvest, tourism) |
| `part_time` | Part-time | Part-time positions |
| `volunteer` | Volunteer | Volunteer positions |
| `freelance_gig` | Freelance Gig | Short freelance projects |
| `consulting` | Consulting | Consulting engagements |

**Education & Learning:**
| Slug | Label | Description |
|---|---|---|
| `course` | Course | Online/offline courses |
| `workshop` | Workshop | Workshops, bootcamps |
| `certification` | Certification | Professional certifications |
| `language_programme` | Language Programme | Language learning |
| `study_abroad` | Study Abroad | International study |
| `exchange_programme` | Exchange Programme | Student exchange |
| `summer_school` | Summer School | Summer academic programmes |
| `winter_school` | Winter School | Winter academic programmes |
| `gap_year_programme` | Gap Year Programme | Structured gap year |

**Research & Academic:**
| Slug | Label | Description |
|---|---|---|
| `research_position` | Research Position | Research roles |
| `postdoc_position` | Postdoc Position | Postdoctoral positions |
| `visiting_scholar` | Visiting Scholar | Visiting academic positions |
| `academic_exchange` | Academic Exchange | Academic exchange |
| `fieldwork` | Fieldwork | Field research |
| `clinical_rotation` | Clinical Rotation | Medical clinical rotations |
| `practicum` | Practicum | Practical training |

**Entrepreneurship & Startup:**
| Slug | Label | Description |
|---|---|---|
| `accelerator` | Accelerator | Startup accelerator programmes |
| `incubator` | Incubator | Business incubation |
| `seed_funding` | Seed Funding | Early-stage funding |
| `pitch_competition` | Pitch Competition | Startup pitch events |
| `hackathon` | Hackathon | Innovation competitions |
| `innovation_challenge` | Innovation Challenge | Innovation programmes |
| `business_plan_competition` | Business Plan Competition | Business plan contests |

**Arts & Culture:**
| Slug | Label | Description |
|---|---|---|
| `residency` | Residency | Artist/scholar residencies |
| `art_exhibition` | Art Exhibition | Exhibition opportunities |
| `performance` | Performance | Performance opportunities |
| `cultural_programme` | Cultural Programme | Cultural immersion |
| `film_festival` | Film Festival | Film festival submissions |
| `writing_residency` | Writing Residency | Writing programmes |

**Travel & Cultural Exchange:**
| Slug | Label | Description |
|---|---|---|
| `work_and_travel` | Work and Travel | Work + travel programmes |
| `working_holiday` | Working Holiday | Working holiday visas |
| `au_pair` | Au Pair | Au pair programmes |
| `camp_counselor` | Camp Counselor | Summer camp positions |
| `cultural_exchange` | Cultural Exchange | Cultural exchange |
| `homestay` | Homestay | Homestay programmes |

**Professional Development:**
| Slug | Label | Description |
|---|---|---|
| `leadership_programme` | Leadership Programme | Leadership development |
| `mentorship` | Mentorship | Mentorship matching |
| `executive_education` | Executive Education | Executive programmes |
| `management_training` | Management Training | Management training |
| `industry_programme` | Industry Programme | Industry-specific training |

**Funding & Investment:**
| Slug | Label | Description |
|---|---|---|
| `venture_capital` | Venture Capital | VC funding |
| `angel_investment` | Angel Investment | Angel funding |
| `crowdfunding` | Crowdfunding | Crowdfunding campaigns |
| `microfinance` | Microfinance | Micro-loans |
| `scholarship_fund` | Scholarship Fund | Scholarship funding |

**Competitions & Recognition:**
| Slug | Label | Description |
|---|---|---|
| `competition` | Competition | General competitions |
| `award` | Award | Awards, prizes |
| `prize` | Prize | Prize competitions |
| `recognition` | Recognition | Recognition programmes |
| `honor` | Honor | Honor societies |

**Government & Public Service:**
| Slug | Label | Description |
|---|---|---|
| `civil_service` | Civil Service | Government positions |
| `peace_corps` | Peace Corps | Peace Corps programmes |
| `diplomatic_programme` | Diplomatic Programme | Diplomatic positions |
| `military_service` | Military Service | Military positions |
| `government_internship` | Government Internship | Government internships |

**Professional Events:**
| Slug | Label | Description |
|---|---|---|
| `conference` | Conference | Professional conferences |
| `summit` | Summit | Industry summits |
| `trade_fair` | Trade Fair | Trade fairs, exhibitions |
| `networking_event` | Networking Event | Professional networking |
| `expo` | Expo | Industry expos |

**Social Impact:**
| Slug | Label | Description |
|---|---|---|
| `social_enterprise` | Social Enterprise | Social enterprise programmes |
| `impact_investment` | Impact Investment | Impact investing |
| `community_service` | Community Service | Community service |
| `development_programme` | Development Programme | International development |

**Visa & Immigration:**
| Slug | Label | Description |
|---|---|---|
| `visa_programme` | Visa Programme | Visa programmes |
| `work_permit` | Work Permit | Work permits |
| `permanent_residency` | Permanent Residency | PR programmes |
| `citizenship` | Citizenship | Citizenship programmes |
| `citizenship_by_investment` | Citizenship by Investment | CBI programmes |
| `golden_visa` | Golden Visa | Golden visa programmes |

**Relocation & Mobility:**
| Slug | Label | Description |
|---|---|---|
| `relocation_package` | Relocation Package | Relocation assistance |
| `expatriate_assignment` | Expatriate Assignment | Expat positions |
| `international_transfer` | International Transfer | Internal transfers |
| `global_mobility` | Global Mobility | Mobility programmes |

**Total Opportunity Types: 60+**

---

## 12. Key Technical Decisions Needed

1. **RSS parser:** Replace regex with `rss-parser` npm package (handles Atom, namespaces, enclosures)
2. **API adapter pattern:** Create a generic adapter interface so each API source type has its own parser
3. **Feed item cap:** Add `.limit(100)` to ingest query per source
4. **OG fetch wiring:** Call `fetchOGMedia()` in process-queue when `cover_image_url` is null
5. **Cover image system:** 4-layer approach (OG → Logo → AI → Template), no gradient fallback
6. **AI image generation:** Use Pollinations.ai (free) for items without OG images
7. **New opportunity types:** Add `trade_show`, `residency`, `citizenship`, `competition`, `conference` to `opportunity_types` table
8. **Source health monitoring:** Track error rates, empty feeds, degraded sources
9. **Batch processing:** Increase process-queue batch from 20 to 100 items
10. **Concurrent processing:** Process multiple sources in parallel (with rate limiting)

---

## 13. Recommendations — Rollout Strategy

### The Rule: Never Add a Segment/Type Without Sources

Every career segment and opportunity type you add to the UI creates a promise to users: "We have opportunities for you." If the category is empty, users feel misled and leave.

**The rule is simple: Only add a new segment or type when you have 3+ real, working sources for it.**

### What "When Sources Exist" Means

A "source" is a real, working data feed that produces opportunities for that segment or type. It's not a placeholder. It's not a TODO. It's a live RSS feed, API endpoint, or watcher that is actively producing data.

**Example — Adding `footballer` segment:**
- ❌ Don't add `footballer` to the UI just because you want to support footballers
- ✅ Add `footballer` when you have 3+ working sources:
  1. FIFA.com RSS feed (real)
  2. Transfermarkt API (real)
  3. Academy websites watcher (real)

**Example — Adding `hackathon` type:**
- ❌ Don't add `hackathon` to the UI just because hackathons exist
- ✅ Add `hackathon` when you have 3+ working sources:
  1. Devpost RSS feed (real)
  2. MLH API (real)
  3. HackerNews "Who is hiring" watcher (real)

### Rollout Phases

| Phase | Segments | Types | When to Do It | What Triggers It |
|---|---|---|---|---|
| **Now** | 10 | 9 | Immediately | Already have data |
| **Phase 2** | 15-20 | 15-20 | After API adapters built | When Himalayas, Arbeitnow, Adzuna, USAJOBS are working |
| **Phase 3** | 25-35 | 25-35 | After watchers built | When embassy, university, FIFA watchers are working |
| **Phase 4** | 40-50 | 40-50 | After partner submissions work | When organisations start submitting directly |
| **Full** | 50+ | 60+ | Platform mature | When every segment has 3+ active sources |

### What Triggers Phase 2

Phase 2 happens when:
1. The `api` source type handler is built (currently silently skips API sources)
2. At least 5 free API adapters are working (Himalayas, Arbeitnow, RemoteOK, Adzuna, USAJOBS)
3. You can verify that new opportunities appear in the feed from these APIs within 24 hours

**Estimated time to Phase 2:** 1-2 weeks of focused work on API adapters.

### What Triggers Phase 3

Phase 3 happens when:
1. The watcher system is built (content hash comparison)
2. At least 5 watchers are running (embassy pages, FIFA academy, university scholarships, government funding, trade fairs)
3. Watchers are producing real Evidence objects that become Opportunities

**Estimated time to Phase 3:** 2-3 weeks after Phase 2.

### What Triggers Phase 4

Phase 4 happens when:
1. Partner submission API is built (organisations can submit directly)
2. At least 3 organisations are actively submitting opportunities
3. The `partner` evidence type is working end-to-end

**Estimated time to Phase 4:** 1-2 months after Phase 3 (requires outreach to organisations).

### How to Add a New Segment or Type (When Ready)

Adding a new segment or type is a database-only change — no code changes needed:

1. **Check sources:** Do you have 3+ working sources for this segment/type?
2. **Insert into database:** Add row to `career_segments` or `opportunity_types` table
3. **Add AI prompt context:** Update AI prompts to recognise the new type (optional but recommended)
4. **Add to onboarding:** If it's a career segment, add to the onboarding flow
5. **Monitor:** Watch for 7 days — are opportunities appearing? Are users selecting it?

### What NOT to Do

- **Don't add all 50 segments at once.** Users will see 40 empty categories.
- **Don't add a type just because a competitor has it.** Add it when you have data for it.
- **Don't promise "we cover everything" before you do.** Start with what you have, expand methodically.
- **Don't skip the source requirement.** An empty category is worse than no category.
