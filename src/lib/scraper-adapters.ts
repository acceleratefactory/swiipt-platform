import { createScraperEvidence as extract } from "./html-extractor";
import type { EvidenceRecord } from "./evidence-adapters";
import { daadScraper } from "./scrapers/daad";
import { devpostScraper } from "./scrapers/devpost";
import { euFundingScraper } from "./scrapers/eu-funding";
import { unScraper } from "./scrapers/un-opportunities";
import { schwarzmanScraper } from "./scrapers/schwarzman";
import { ukVisaScraper } from "./scrapers/uk-visas";
import { grantsGovScraper } from "./scrapers/grants-gov";
import { scholarshipsScraper } from "./scrapers/scholarships-com";
import { tenTimesScraper } from "./scrapers/10times";
import { erasmusPlusScraper } from "./scrapers/erasmus-plus";
import { courseraScraper } from "./scrapers/coursera";
import { scholars4devScraper } from "./scrapers/scholars4dev";
import { britishCouncilScraper } from "./scrapers/british-council";
import { fulbrightScraper } from "./scrapers/fulbright";
import { gatesCambridgeScraper } from "./scrapers/gates-cambridge";
import { hnWhoIsHiringScraper } from "./scrapers/hn-whoishiring";
import { peoplePerHourScraper } from "./scrapers/peopleperhour";
import { africanBusinessHeroesScraper } from "./scrapers/african-business-heroes";
import { seedstarsScraper } from "./scrapers/seedstars";
import { alliedHealthScraper } from "./scrapers/allied-health";
import { nursingJobsAuScraper } from "./scrapers/nursing-jobs-au";
import { globalFootballTrialsScraper } from "./scrapers/global-football-trials";
import { angellistScraper } from "./scrapers/angellist";
import { indeedRemoteScraper } from "./scrapers/indeed-remote";
import { glassdoorRemoteScraper } from "./scrapers/glassdoor-remote";

type ScraperFn = (
  pageUrl: string,
  sourceName: string,
  maxItems?: number
) => Promise<EvidenceRecord[]>;

const SCRAPER_MAP: Record<string, ScraperFn> = {
  "DAAD Scholarships": daadScraper,
  "Devpost Hackathons": devpostScraper,
  "European Commission Funding": euFundingScraper,
  "UN Volunteers": unScraper,
  "WHO Internships": unScraper,
  "UNESCO Internships": unScraper,
  "Schwarzman Scholars": schwarzmanScraper,
  "UK Global Talent Visa": ukVisaScraper,
  "EU Blue Card": ukVisaScraper,
  "Germany Opportunity Card": ukVisaScraper,
  "Canada Global Talent Stream": ukVisaScraper,
  "Australia Global Talent Visa": ukVisaScraper,
  "Portugal D7 Visa": ukVisaScraper,
  "Spain Digital Nomad Visa": ukVisaScraper,
  "Grants.gov": grantsGovScraper,
  "Scholarships.com": scholarshipsScraper,
  "International Scholarships": scholarshipsScraper,
  "10times Events": tenTimesScraper,
  "EventsEye Trade Shows": tenTimesScraper,
  "Erasmus+ Programme": erasmusPlusScraper,
  "Coursera Free Courses": courseraScraper,
  "Scholars4Dev": scholars4devScraper,
  "British Council Scholarships": britishCouncilScraper,
  "Fulbright Program": fulbrightScraper,
  "Gates Cambridge": gatesCambridgeScraper,
  "HN Who Is Hiring": hnWhoIsHiringScraper,
  "AngelList Talent": angellistScraper,
  "Indeed Global Remote": indeedRemoteScraper,
  "Glassdoor Remote Jobs": glassdoorRemoteScraper,
  "PeoplePerHour": peoplePerHourScraper,
  "African Business Heroes": africanBusinessHeroesScraper,
  "Seedstars World": seedstarsScraper,
  "Allied Health Careers": alliedHealthScraper,
  "Nursing Jobs Australia": nursingJobsAuScraper,
  "Global Football Trials UK": globalFootballTrialsScraper,
};

export async function createScraperEvidence(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const dedicated = SCRAPER_MAP[sourceName];
  if (dedicated) {
    try {
      const result = await dedicated(pageUrl, sourceName, maxItems);
      if (result.length > 0) return result;
    } catch {
      // fall through to generic extractor
    }
  }
  return extract(pageUrl, sourceName, maxItems);
}
