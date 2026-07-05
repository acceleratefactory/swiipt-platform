import { createClient as createAdminClient } from "@supabase/supabase-js";

export interface OpportunityType {
  slug: string;
  name: string;
  emoji: string | null;
  bg_color: string;
  text_color: string;
  sort_order: number;
  is_active: boolean;
}

export interface CareerSegment {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  bg_color: string | null;
  text_color: string | null;
  is_active: boolean;
  sort_order: number;
}

export type TypeStyleMap = Record<string, { bg: string; color: string; label: string }>;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getOpportunityTypes(): Promise<OpportunityType[]> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("opportunity_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data || [];
}

export async function getCareerSegments(): Promise<CareerSegment[]> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("career_segments")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data || [];
}

export function buildTypeStyleMap(types: OpportunityType[]): TypeStyleMap {
  const map: TypeStyleMap = {};
  for (const t of types) {
    map[t.slug] = { bg: t.bg_color, color: t.text_color, label: t.name };
  }
  return map;
}

export function buildSegmentMap(segments: CareerSegment[]): Record<string, { name: string; icon: string | null; bg: string | null; color: string | null }> {
  const map: Record<string, any> = {};
  for (const s of segments) {
    map[s.slug] = { name: s.name, icon: s.icon, bg: s.bg_color, color: s.text_color };
  }
  return map;
}
