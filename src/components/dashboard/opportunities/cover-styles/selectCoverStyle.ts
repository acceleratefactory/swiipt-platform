const STYLE_A_TYPES = new Set(["scholarship", "fellowship", "grant", "award"]);
const STYLE_B_TYPES = new Set(["visa_programme", "internship", "training", "residency", "healthcare"]);
const STYLE_C_TYPES = new Set(["competition", "conference", "exchange"]);
const STYLE_D_TYPES = new Set(["trade_show", "job", "remote_work", "trial", "sports_trial", "citizenship"]);

export type CoverStyle = "A" | "B" | "C" | "D";

export function selectCoverStyle(type: string): CoverStyle {
  if (STYLE_A_TYPES.has(type)) return "A";
  if (STYLE_B_TYPES.has(type)) return "B";
  if (STYLE_C_TYPES.has(type)) return "C";
  if (STYLE_D_TYPES.has(type)) return "D";
  return "A";
}

export function getTypeMeta(type: string): { label: string } {
  const map: Record<string, string> = {
    scholarship: "Scholarship",
    fellowship: "Fellowship",
    grant: "Grant",
    award: "Award",
    visa_programme: "Visa Programme",
    internship: "Internship",
    training: "Training",
    residency: "Residency",
    healthcare: "Healthcare",
    competition: "Competition",
    conference: "Conference",
    exchange: "Exchange",
    trade_show: "Trade Show",
    job: "Job",
    remote_work: "Remote Work",
    trial: "Trial",
    sports_trial: "Sports Trial",
    citizenship: "Citizenship",
  };
  const label = map[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { label };
}
