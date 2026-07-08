import { createHash } from "crypto";

export interface NormalizedJob {
  title: string;
  organisation: string;
  description: string;
  url: string;
  deadline: string | null;
  salary: string | null;
  location: string;
  tags: string[];
  remote: boolean;
}

function computeHash(data: string): string {
  return createHash("sha256").update(data).digest("hex").slice(0, 64);
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

function normalizeToEvidence(
  jobs: NormalizedJob[],
  sourceUrl: string,
  sourceName: string
) {
  return jobs
    .filter((j) => j.url && j.title)
    .map((j) => ({
      evidence_type: "api" as const,
      raw_data: {
        title: j.title,
        organisation: j.organisation,
        description: j.description,
        url: j.url,
        deadline: j.deadline,
        salary: j.salary,
        location: j.location,
        tags: j.tags,
        remote: j.remote,
      },
      source_url: sourceUrl,
      source_name: sourceName,
      content_hash: computeHash(j.url + j.title),
    }));
}

// ─── Himalayas (no auth, paginated) ────────────────────────────
export async function fetchHimalayas(
  maxItems: number = 100
): Promise<ReturnType<typeof normalizeToEvidence>> {
  const allJobs: NormalizedJob[] = [];
  let page = 1;
  const perPage = 50;

  while (allJobs.length < maxItems) {
    const url = `https://himalayas.app/jobs/api?page=${page}&limit=${perPage}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Swiipt-Bot/1.0 (opportunities@swiipt.com)" },
    });
    if (!res.ok) break;

    const data = await res.json();
    const items = data.jobs || data || [];
    if (items.length === 0) break;

    for (const item of items) {
      allJobs.push({
        title: item.title || "",
        organisation: item.company_name || item.company || "",
        description: stripHtml(item.description || item.content || ""),
        url: item.url
          ? item.url.startsWith("http")
            ? item.url
            : `https://himalayas.app${item.url}`
          : "",
        deadline: item.deadline || item.expiry || null,
        salary: item.salary || null,
        location: item.location || "",
        tags: item.tags || item.sectors || [],
        remote: item.remote || false,
      });
    }

    page++;
    if (items.length < perPage) break;
  }

  return normalizeToEvidence(
    allJobs.slice(0, maxItems),
    "https://himalayas.app/jobs/api",
    "Himalayas"
  );
}

// ─── Arbeitnow (no auth) ───────────────────────────────────────
export async function fetchArbeitnow(): Promise<
  ReturnType<typeof normalizeToEvidence>
> {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "Swiipt-Bot/1.0 (opportunities@swiipt.com)" },
  });
  if (!res.ok) return [];

  const data = await res.json();
  const items = data.data || data || [];

  const jobs: NormalizedJob[] = items.map((item: any) => ({
    title: item.title || "",
    organisation: item.company_name || item.company || "",
    description: stripHtml(item.description || ""),
    url: item.url || item.apply_url || "",
    deadline: null,
    salary: item.salary || null,
    location: item.location || "",
    tags: item.tags || [],
    remote: item.remote || false,
  }));

  return normalizeToEvidence(
    jobs,
    "https://www.arbeitnow.com/api/job-board-api",
    "Arbeitnow"
  );
}

// ─── Adzuna (free API key) ─────────────────────────────────────
export async function fetchAdzuna(
  country: string = "gb",
  maxItems: number = 100
): Promise<ReturnType<typeof normalizeToEvidence>> {
  const apiKey = process.env.ADZUNA_API_KEY;
  const appId = process.env.ADZUNA_APP_ID;
  if (!apiKey || !appId) return [];

  const res = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${apiKey}&results_per_page=${Math.min(maxItems, 50)}&content-type=application/json`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const items = data.results || [];

  const jobs: NormalizedJob[] = items.map((item: any) => ({
    title: item.title || "",
    organisation: item.company?.display_name || "",
    description: stripHtml(item.description || ""),
    url: item.redirect_url || "",
    deadline: item.created || null,
    salary: item.salary_min
      ? `${item.salary_min}–${item.salary_max || ""} ${item.salary_currency || ""}`.trim()
      : null,
    location: item.location?.display_name || "",
    tags: item.tags || [],
    remote: false,
  }));

  return normalizeToEvidence(
    jobs.slice(0, maxItems),
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1`,
    "Adzuna"
  );
}

// ─── Jooble (free API key) ─────────────────────────────────────
export async function fetchJooble(
  keyword: string = "remote"
): Promise<ReturnType<typeof normalizeToEvidence>> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(`https://jooble.org/api/${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords: keyword, location: "" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];

  const data = await res.json();
  const items = data.jobs || [];

  const jobs: NormalizedJob[] = items.map((item: any) => ({
    title: item.title || "",
    organisation: item.company || "",
    description: stripHtml(item.snippet || item.description || ""),
    url: item.url || item.link || "",
    deadline: item.date || null,
    salary: item.salary || null,
    location: item.location || "",
    tags: [],
    remote: false,
  }));

  return normalizeToEvidence(
    jobs,
    "https://jooble.org/api/",
    "Jooble"
  );
}

// ─── USAJOBS (free API key) ────────────────────────────────────
export async function fetchUSAJOBS(
  maxItems: number = 100
): Promise<ReturnType<typeof normalizeToEvidence>> {
  const apiKey = process.env.USAJOBS_API_KEY;
  const email = process.env.USAJOBS_EMAIL;
  if (!apiKey || !email) return [];

  const res = await fetch(
    `https://data.usajobs.gov/api/search?ResultsPerPage=${Math.min(maxItems, 25)}`,
    {
      headers: {
        "Host": "data.usajobs.gov",
        "User-Agent": email,
        "Authorization-Key": apiKey,
      },
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const items = data.SearchResult?.SearchResultItems || [];

  const jobs: NormalizedJob[] = items.map((item: any) => {
    const match = item.MatchedObjectDescriptor || {};
    return {
      title: match.PositionTitle || "",
      organisation: match.OrganizationName || "",
      description: stripHtml(match.UserArea?.Details?.JobSummary || ""),
      url: match.PositionURI || match.ApplyURI?.[0] || "",
      deadline: match.ApplicationCloseDate || null,
      salary: match.PositionRemuneration?.[0]
        ? `${match.PositionRemuneration[0].MinimumRange}–${match.PositionRemuneration[0].MaximumRange} ${match.PositionRemuneration[0].RateIntervalCode || ""}`.trim()
        : null,
      location: match.PositionLocation?.[0]
        ? `${match.PositionLocation[0].CityName}, ${match.PositionLocation[0].CountryName}`
        : "",
      tags: match.PositionSchedule?.map((s: any) => s.Name) || [],
      remote: match.PositionLocation?.some(
        (l: any) => l.CityName === "Multiple Locations" || l.CountryName === "Remote"
      ) || false,
    };
  });

  return normalizeToEvidence(
    jobs,
    "https://data.usajobs.gov/api/search",
    "USAJOBS"
  );
}

// ─── Findwork (free API key) ───────────────────────────────────
export async function fetchFindwork(): Promise<
  ReturnType<typeof normalizeToEvidence>
> {
  const apiKey = process.env.FINDWORK_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://findwork.dev/api/jobs/", {
    headers: { Authorization: `Token ${apiKey}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];

  const data = await res.json();
  const items = data.results || [];

  const jobs: NormalizedJob[] = items.map((item: any) => ({
    title: item.role || "",
    organisation: item.company_name || "",
    description: stripHtml(item.text || item.description || ""),
    url: item.url || item.apply_url || "",
    deadline: item.date_posted || null,
    salary: null,
    location: item.location || "",
    tags: item.employment_type ? [item.employment_type] : [],
    remote: item.remote || false,
  }));

  return normalizeToEvidence(
    jobs,
    "https://findwork.dev/api/jobs/",
    "Findwork"
  );
}

// ─── Dispatcher ────────────────────────────────────────────────
export async function fetchFromAPI(
  sourceName: string,
  sourceUrl: string,
  maxItems: number = 100
): Promise<Array<{
  evidence_type: "api";
  raw_data: Record<string, any>;
  source_url: string;
  source_name: string;
  content_hash: string;
}>> {
  const name = sourceName.toLowerCase();
  if (name.includes("himalayas")) return fetchHimalayas(maxItems);
  if (name.includes("arbeitnow") || name.includes("arbeit"))
    return fetchArbeitnow();
  if (name.includes("adzuna")) return fetchAdzuna("gb", maxItems);
  if (name.includes("jooble")) return fetchJooble();
  if (name.includes("usajobs") || name.includes("usa jobs"))
    return fetchUSAJOBS(maxItems);
  if (name.includes("findwork")) return fetchFindwork();

  // Fallback: generic JSON fetch
  const res = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "Swiipt-Bot/1.0 (opportunities@swiipt.com)" },
  });
  if (!res.ok) return [];

  const data = await res.json();
  const items = Array.isArray(data) ? data : data.data || data.results || [];
  return normalizeToEvidence(
    items.slice(0, maxItems).map((item: any) => ({
      title: item.title || item.role || "",
      organisation: item.company_name || item.company || item.organisation || "",
      description: stripHtml(item.description || item.snippet || item.text || ""),
      url: item.url || item.link || item.apply_url || item.redirect_url || "",
      deadline: item.deadline || item.date || item.created || null,
      salary: item.salary || null,
      location: item.location || "",
      tags: item.tags || [],
      remote: item.remote || false,
    })),
    sourceUrl,
    sourceName
  );
}
