"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface CareerSegment {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  destination: string | null;
  target_amount_ngn: number;
  icon: string;
  segment: string | null;
}

type SegmentSlug =
  | "job_seeker" | "student" | "healthcare" | "tech_professional"
  | "footballer" | "sports_professional" | "freelancer"
  | "entrepreneur" | "trade_worker" | "caregiver";

interface ProfileData {
  current_role?: string;
  years_experience?: number;
  highest_qualification?: string;
  desired_roles?: string[];
  desired_countries?: string[];
  current_level?: string;
  field_of_study?: string;
  ielts_score?: number;
  target_countries?: string[];
  scholarship_interest?: boolean;
  position?: string;
  age?: number;
  current_club?: string;
  video_url?: string;
  primary_skill?: string;
  github_url?: string;
  employment_preference?: string;
  primary_platform?: string[];
  hourly_rate_range?: string;
  business_type?: string;
  years_trading?: number;
  export_interest?: boolean;
  trade_show_interest?: boolean;
}

interface VisaStatus {
  passport_status: string;
  ielts_status: string;
  timeline: string;
}

export default function OnboardingPage() {
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [segments, setSegments] = useState<CareerSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [visaStatus, setVisaStatus] = useState<VisaStatus>({
    passport_status: "",
    ielts_status: "",
    timeline: "",
  });
  const [goalTemplates, setGoalTemplates] = useState<GoalTemplate[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: segs } = await supabase
        .from("career_segments")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (segs) setSegments(segs as unknown as CareerSegment[]);
    }
    load();
  }, [supabase]);

  async function handleSegmentSelect(slug: string) {
    setSelectedSegment(slug);
    setStep(2);

    const { data: templates } = await supabase
      .from("goal_templates")
      .select("*")
      .eq("is_active", true)
      .or(`segment.eq.${slug},segment.is.null`)
      .order("sort_order")
      .limit(3);

    if (templates) setGoalTemplates(templates as unknown as GoalTemplate[]);
  }

  function updateProfile(fields: Partial<ProfileData>) {
    setProfileData((prev) => ({ ...prev, ...fields }));
  }

  function handleStep2Next() {
    setStep(3);
  }

  function handleStep3Next() {
    setStep(4);
  }

  async function handleComplete() {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const careerProfile = {
        user_id: user.id,
        segment_slug: selectedSegment,
        current_role: profileData.current_role || null,
        years_experience: profileData.years_experience || null,
        highest_qualification: profileData.highest_qualification || null,
        desired_roles: profileData.desired_roles || null,
        desired_countries: profileData.desired_countries || null,
        current_level: profileData.current_level || null,
        field_of_study: profileData.field_of_study || null,
        target_universities: profileData.target_countries || null,
        scholarship_interest: profileData.scholarship_interest || null,
        position: profileData.position || null,
        current_club: profileData.current_club || null,
        video_url: profileData.video_url || null,
        passport_status: visaStatus.passport_status || null,
        ielts_score: visaStatus.ielts_status === "not_applicable" ? null
          : visaStatus.ielts_status === "not_taken" ? null
          : visaStatus.ielts_status === "under_6" ? 5.5
          : visaStatus.ielts_status === "6_to_6.5" ? 6.0
          : visaStatus.ielts_status === "7_plus" ? 7.0
          : null,
        availability: visaStatus.timeline || null,
      }; 

      const { error: profileError } = await (supabase as any)
        .from("career_profiles")
        .upsert(careerProfile);

      if (profileError) throw profileError;

      // Fire-and-forget feed generation
      fetch("/api/opportunities/feed", { method: "POST" }).catch(() => {});

      document.cookie = "swiipt_onboarding_complete=1; path=/; max-age=2592000; samesite=lax";
      window.location.href = "/dashboard/opportunities";
    } catch {
      setSubmitting(false);
    }
  }

  function renderStepIndicator() {
    return (
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "2rem" }}>
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: s === step ? "var(--teal)" : "var(--gray-300)",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      {renderStepIndicator()}

      {step === 1 && (
        <div>
          <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", textAlign: "center", marginBottom: "0.375rem" }}>
            What describes you best?
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "2rem" }}>
            We will personalise your opportunity feed.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {segments.map((seg) => (
              <button
                key={seg.id}
                onClick={() => handleSegmentSelect(seg.slug)}
                style={{
                  padding: "1.25rem",
                  borderRadius: "var(--radius-lg)",
                  border: selectedSegment === seg.slug ? "2px solid var(--teal)" : "1px solid var(--gray-200)",
                  background: selectedSegment === seg.slug ? "rgba(0,200,150,0.05)" : "white",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{seg.icon}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>{seg.name}</h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{seg.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && selectedSegment && (
        <div>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.25rem" }}>
            Tell us about yourself
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            This helps us match the best opportunities to your profile.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {renderSegmentFields()}
          </div>

          <button
            onClick={handleStep2Next}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 2rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "0.875rem",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            Continue →
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.25rem" }}>
            Passport & visa status
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            This helps us show you time-sensitive opportunities.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.5rem" }}>Passport status</label>
              <select
                value={visaStatus.passport_status}
                onChange={(e) => setVisaStatus((p) => ({ ...p, passport_status: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--gray-300)", fontSize: "0.875rem" }}
              >
                <option value="">Select...</option>
                <option value="no_passport">No passport yet</option>
                <option value="applied">Applied but not received</option>
                <option value="valid_passport">Valid passport</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.5rem" }}>IELTS / English test status</label>
              <select
                value={visaStatus.ielts_status}
                onChange={(e) => setVisaStatus((p) => ({ ...p, ielts_status: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--gray-300)", fontSize: "0.875rem" }}
              >
                <option value="">Select...</option>
                <option value="not_taken">Not taken</option>
                <option value="under_6">Score under 6</option>
                <option value="6_to_6.5">Score 6.0-6.5</option>
                <option value="7_plus">Score 7.0+</option>
                <option value="not_applicable">Not applicable</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.5rem" }}>Your timeline</label>
              <select
                value={visaStatus.timeline}
                onChange={(e) => setVisaStatus((p) => ({ ...p, timeline: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--gray-300)", fontSize: "0.875rem" }}
              >
                <option value="">Select...</option>
                <option value="3_to_6_months">3-6 months</option>
                <option value="6_to_12_months">6-12 months</option>
                <option value="1_to_2_years">1-2 years</option>
                <option value="exploring">Just exploring</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStep3Next}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 2rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "0.875rem",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            Continue →
          </button>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.25rem" }}>
            Based on your profile
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Here is what we recommend you save toward:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {goalTemplates.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--gray-200)",
                  background: "white",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)" }}>{t.name}</h3>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{t.description}</p>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--teal)" }}>
                      Target: ₦{t.target_amount_ngn.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <a
                    href={`/dashboard/goals/new?template=${t.id}`}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "var(--teal)",
                      color: "var(--midnight)",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                      borderRadius: "var(--radius-sm)",
                      textDecoration: "none",
                    }}
                  >
                    Start this goal →
                  </a>
                  <span style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>Skip for now</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleComplete}
            disabled={submitting}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 2rem",
              background: submitting ? "var(--gray-300)" : "var(--teal)",
              color: submitting ? "var(--text-muted)" : "var(--midnight)",
              fontWeight: 700,
              fontSize: "0.875rem",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: submitting ? "not-allowed" : "pointer",
              width: "100%",
            }}
          >
            {submitting ? "Setting up your feed..." : "Go to my opportunities →"}
          </button>
        </div>
      )}
    </div>
  );

  function renderSegmentFields() {
    const slug = selectedSegment as SegmentSlug;

    const fieldStyle: React.CSSProperties = {
      width: "100%",
      padding: "0.625rem 0.75rem",
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--gray-300)",
      fontSize: "0.875rem",
    };
    const labelStyle: React.CSSProperties = {
      display: "block",
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: "var(--midnight)",
      marginBottom: "0.375rem",
    };

    const renderText = (key: keyof ProfileData, label: string, placeholder?: string) => (
      <div key={key}>
        <label style={labelStyle}>{label}</label>
        <input
          style={fieldStyle}
          placeholder={placeholder}
          value={(profileData[key] as string) || ""}
          onChange={(e) => updateProfile({ [key]: e.target.value })}
        />
      </div>
    );

    const renderNumber = (key: keyof ProfileData, label: string) => (
      <div key={key}>
        <label style={labelStyle}>{label}</label>
        <input
          type="number"
          style={fieldStyle}
          value={(profileData[key] as number) || ""}
          onChange={(e) => updateProfile({ [key]: parseInt(e.target.value) || 0 })}
        />
      </div>
    );

    const renderSelect = (key: keyof ProfileData, label: string, options: { value: string; label: string }[]) => (
      <div key={key}>
        <label style={labelStyle}>{label}</label>
        <select
          style={fieldStyle}
          value={(profileData[key] as string) || ""}
          onChange={(e) => updateProfile({ [key]: e.target.value })}
        >
          <option value="">Select...</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );

    const renderMultiCheckbox = (key: keyof ProfileData, label: string, options: string[]) => (
      <div key={key}>
        <label style={labelStyle}>{label}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {options.map((opt) => {
            const selected = ((profileData[key] as string[]) || []).includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const current = (profileData[key] as string[]) || [];
                  updateProfile({
                    [key]: selected ? current.filter((c) => c !== opt) : [...current, opt],
                  });
                }}
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "20px",
                  border: selected ? "2px solid var(--teal)" : "1px solid var(--gray-300)",
                  background: selected ? "rgba(0,200,150,0.1)" : "white",
                  color: selected ? "var(--teal)" : "var(--text-secondary)",
                  fontWeight: selected ? 700 : 400,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );

    switch (slug) {
      case "job_seeker":
        return (
          <>
            {renderText("current_role", "Current role", "e.g. Software Engineer, Accountant, Nurse")}
            {renderNumber("years_experience", "Years of experience")}
            {renderSelect("highest_qualification", "Highest qualification", [
              { value: "ssce", label: "SSCE" },
              { value: "ond", label: "OND" },
              { value: "hnd", label: "HND" },
              { value: "bsc", label: "BSc" },
              { value: "msc", label: "MSc" },
              { value: "mba", label: "MBA" },
              { value: "phd", label: "PhD" },
            ])}
            {renderText("desired_roles", "Desired roles (comma-separated, up to 5)", "e.g. Full Stack Developer, Product Manager")}
            {renderMultiCheckbox("desired_countries", "Desired countries", ["UK", "Canada", "UAE", "Germany", "Netherlands", "Australia", "USA", "Remote"])}
          </>
        );

      case "student":
        return (
          <>
            {renderText("current_level", "Current level", "e.g. 200 Level, Final Year, Masters 1")}
            {renderText("field_of_study", "Field of study", "e.g. Computer Science, Medicine, Law")}
            {renderNumber("ielts_score", "IELTS score (or leave blank if not taken)")}
            {renderMultiCheckbox("target_countries", "Target countries for study", ["UK", "Canada", "USA", "Germany", "Australia", "Netherlands", "Ireland", "UAE"])}
            {renderSelect("scholarship_interest", "Scholarship interest", [
              { value: "true", label: "Yes — I need full funding" },
              { value: "false", label: "No — I can self-fund" },
            ])}
          </>
        );

      case "footballer":
        return (
          <>
            {renderSelect("position", "Position", [
              { value: "gk", label: "GK" },
              { value: "cb", label: "CB" },
              { value: "lb", label: "LB" },
              { value: "rb", label: "RB" },
              { value: "cdm", label: "CDM" },
              { value: "cm", label: "CM" },
              { value: "cam", label: "CAM" },
              { value: "lw", label: "LW" },
              { value: "rw", label: "RW" },
              { value: "st", label: "ST" },
            ])}
            {renderNumber("age", "Age")}
            {renderText("current_club", "Current club (optional)", "e.g. Shooting Stars FC")}
            {renderText("video_url", "Highlight video URL (optional)", "YouTube or Vimeo link")}
          </>
        );

      case "healthcare":
        return (
          <>
            {renderSelect("current_role", "Current role", [
              { value: "rn", label: "RN (Registered Nurse)" },
              { value: "doctor", label: "Doctor" },
              { value: "pharmacist", label: "Pharmacist" },
              { value: "physiotherapist", label: "Physiotherapist" },
              { value: "lab_scientist", label: "Lab Scientist" },
              { value: "other", label: "Other" },
            ])}
            {renderNumber("years_experience", "Years of experience")}
            {renderNumber("ielts_score", "IELTS score")}
          </>
        );

      case "tech_professional":
        return (
          <>
            {renderSelect("primary_skill", "Primary skill", [
              { value: "frontend", label: "Frontend (React, Next.js)" },
              { value: "backend", label: "Backend (Node, Python, Go)" },
              { value: "mobile", label: "Mobile (React Native, Flutter)" },
              { value: "data", label: "Data Science / ML" },
              { value: "design", label: "UI/UX Design" },
              { value: "devops", label: "DevOps / Cloud" },
              { value: "blockchain", label: "Blockchain / Web3" },
            ])}
            {renderNumber("years_experience", "Years of experience")}
            {renderText("github_url", "GitHub / portfolio URL (optional)")}
            {renderSelect("employment_preference", "Employment preference", [
              { value: "remote", label: "Remote only" },
              { value: "relocation", label: "Open to relocation" },
              { value: "both", label: "Both remote and relocation" },
            ])}
          </>
        );

      case "freelancer":
        return (
          <>
            {renderMultiCheckbox("primary_platform", "Primary platforms", ["Upwork", "Fiverr", "Toptal", "Freelancer.com", "LinkedIn", "Own clients"])}
            {renderSelect("hourly_rate_range", "Hourly rate range (USD)", [
              { value: "under_20", label: "Under $20" },
              { value: "20_50", label: "$20–$50" },
              { value: "50_100", label: "$50–$100" },
              { value: "over_100", label: "Over $100" },
            ])}
          </>
        );

      case "entrepreneur":
        return (
          <>
            {renderText("business_type", "Business type", "e.g. Export trading, Tech startup, Consultancy")}
            {renderNumber("years_trading", "Years in business")}
            {renderSelect("export_interest", "Export interest", [
              { value: "true", label: "Yes — I want to export" },
              { value: "false", label: "Not yet" },
            ])}
            {renderSelect("trade_show_interest", "Trade show interest", [
              { value: "true", label: "Yes — I want to attend trade shows" },
              { value: "false", label: "Not interested" },
            ])}
          </>
        );

      default:
        return (
          <>
            {renderText("current_role", "Current role / profession", "e.g. Electrician, Chef, Driver")}
            {renderNumber("years_experience", "Years of experience")}
          </>
        );
    }
  }
}
