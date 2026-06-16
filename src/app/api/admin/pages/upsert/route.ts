import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const {
    id, url_prefix, slug, title, subtitle, destination, category, segment,
    hero_headline, hero_subtext, hero_cta_label, hero_cta_url,
    process_steps, requirements, faqs,
    cost_calculator_destination, cost_calculator_service_type,
    success_story_name, success_story_role, success_story_quote, success_story_destination,
    related_page_slugs,
    meta_title, meta_description, meta_keywords, og_image_url,
    recommended_goal_template_id, published,
  } = body;

  const serviceClient = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = serviceClient as any;

  const safeRecommendedGoalTemplateId = recommended_goal_template_id || null;

  if (id) {
    const { data, error } = await db
      .from("niche_pages")
      .update({
        url_prefix, slug, title, subtitle, destination, category, segment,
        hero_headline, hero_subtext, hero_cta_label, hero_cta_url,
        process_steps, requirements, faqs,
        cost_calculator_destination, cost_calculator_service_type,
        success_story_name, success_story_role, success_story_quote, success_story_destination,
        related_page_slugs,
        meta_title, meta_description, meta_keywords, og_image_url,
        recommended_goal_template_id: safeRecommendedGoalTemplateId, published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } else {
    // Check if slug already exists before inserting
    const { data: existing } = await db
      .from("niche_pages")
      .select("id, title")
      .eq("url_prefix", url_prefix)
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        error: `A page with slug "/${url_prefix}/${slug}" already exists ("${existing.title}"). Choose a different slug.`,
      }, { status: 409 });
    }

    const { data, error } = await db
      .from("niche_pages")
      .insert({
        url_prefix, slug, title, subtitle, destination, category, segment,
        hero_headline, hero_subtext, hero_cta_label, hero_cta_url,
        process_steps, requirements, faqs,
        cost_calculator_destination, cost_calculator_service_type,
        success_story_name, success_story_role, success_story_quote, success_story_destination,
        related_page_slugs,
        meta_title, meta_description, meta_keywords, og_image_url,
        recommended_goal_template_id: safeRecommendedGoalTemplateId, published, created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }
}
