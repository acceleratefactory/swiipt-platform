import { enrich } from "@/lib/ai-service";

export interface CleanerInput {
  rawTitle: string;
  rawDescription: string;
  rawRequirements: string | null;
  rawSalary: string | null;
  rawDeadline: string | null;
  organisation: string;
  locationCountry: string;
  opportunityType: string;
}

export interface CleanerOutput {
  success: boolean;
  failure_reason?: string;
  title: string;
  description: string;
  full_description: string;
  requirements: string;
  funding_display: string;
  deadline: string | null;
  editorial_score: number;
}

export async function cleanOpportunityContent(input: CleanerInput): Promise<CleanerOutput> {
  try {
    const response = await enrich({
      task: "content-clean",
      data: input,
    });

    if (!response.success || !response.enriched) {
      return failure("Content cleaner API error");
    }

    const result = response.enriched;

    if (result.success === false) {
      return failure(result.failure_reason || "Content cleaner could not process this opportunity");
    }

    return {
      success: true,
      failure_reason: undefined,
      title: (result.title || "").slice(0, 80),
      description: (result.description || "").slice(0, 200),
      full_description: (result.full_description || "").slice(0, 600),
      requirements: (result.requirements || "").slice(0, 300),
      funding_display: (result.funding_display || "").slice(0, 80),
      deadline: result.deadline || null,
      editorial_score: Math.min(100, Math.max(0, result.editorial_score || 0)),
    };
  } catch {
    return failure("Content cleaner API error");
  }
}

function failure(reason: string): CleanerOutput {
  return {
    success: false,
    failure_reason: reason,
    title: "",
    description: "",
    full_description: "",
    requirements: "",
    funding_display: "",
    deadline: null,
    editorial_score: 0,
  };
}