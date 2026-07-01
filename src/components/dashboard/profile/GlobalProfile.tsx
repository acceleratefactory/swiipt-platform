"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface GlobalProfileProps {
  profile: {
    id: string; email: string; full_name: string; phone: string | null;
    country_of_residence: string | null; preferred_currency: string;
    created_at: string; mobility_score: number; alumni_status: boolean;
    readiness_score: number; readiness_destination: string | null;
    global_profile_complete: boolean; trust_score: number;
    income_estimate_usd_monthly: number | null;
    skills: string[] | null; languages: string[] | null; linkedin_url: string | null;
  };
  financialProfile: {
    total_deposited_ngn: number; total_goals_created: number;
    total_goals_completed: number; average_monthly_deposit_ngn: number;
    deposit_consistency_score: number; longest_streak_weeks: number;
    primary_destination: string | null; secondary_destination: string | null;
    estimated_move_timeline: string | null; relocation_intent_score: number;
    documents_verified_count: number; services_completed: number;
    platform_tenure_days: number; trust_score: number;
    has_uk_company: boolean; has_us_llc: boolean; has_uae_company: boolean;
    is_sme_owner: boolean; identity_verified: boolean;
  } | null;
  goals: Array<{
    id: string; goal_name: string; current_balance: number;
    target_amount: number; destination: string | null; status: string;
  }>;
  serviceOrders: Array<{
    id: string; status: string; created_at: string;
    service_packages: { id: string; name: string; category: string; destination: string } | null;
  }>;
  vaultDocuments: Array<{
    event_data: Record<string, string>; created_at: string;
  }>;
  certificates: Array<{
    certificate_type: string; certificate_number: string;
    issued_at: string; expires_at: string; is_valid: boolean;
  }>;
}

const INCOME_OPTIONS = [
  { value: "", label: "Select range" },
  { value: "500", label: "Under $500/mo" },
  { value: "1500", label: "$500 – $1,500/mo" },
  { value: "3000", label: "$1,500 – $3,000/mo" },
  { value: "5000", label: "$3,000 – $5,000/mo" },
  { value: "10000", label: "$5,000 – $10,000/mo" },
  { value: "20000", label: "$10,000+ /mo" },
];

function getConsistencyColor(score: number): string {
  if (score >= 80) return "var(--teal)";
  if (score >= 50) return "#B45309";
  return "#DC2626";
}

function getTrustColor(score: number): string {
  if (score >= 70) return "var(--teal)";
  if (score >= 40) return "#B45309";
  return "#6B7280";
}

function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

function getDocumentType(doc: { event_data: Record<string, string> }): string {
  return doc.event_data?.document_type || "unknown";
}

function getDocumentIcon(docType: string): string {
  switch (docType) {
    case "passport": return "🛂";
    case "id_card": return "🪪";
    case "bank_statement": return "🏦";
    case "proof_of_address": return "📍";
    case "degree": return "🎓";
    default: return "📄";
  }
}

export default function GlobalProfile({
  profile, financialProfile, goals, serviceOrders, vaultDocuments, certificates,
}: GlobalProfileProps) {
  const supabase = createClient();

  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [languages, setLanguages] = useState<string[]>(profile.languages || []);
  const [langInput, setLangInput] = useState("");
  const [income, setIncome] = useState(profile.income_estimate_usd_monthly?.toString() || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const linkedInChanged = linkedinUrl !== (profile.linkedin_url || "");
      if (linkedInChanged) {
        setSaving("LinkedIn URL");
        const { error } = await supabase.from("users").update({ linkedin_url: linkedinUrl || null }).eq("id", profile.id);
        if (!cancelled) {
          if (error) setSaveError(error.message);
          else setSaving(null);
        }
      }
    }, 1000);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedinUrl]);

  async function addSkill() {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.length >= 10 || skills.includes(trimmed)) return;
    const updated = [...skills, trimmed];
    setSkills(updated);
    setSkillInput("");
    setSaving("Skills");
    const { error } = await supabase.from("users").update({ skills: updated }).eq("id", profile.id);
    if (error) setSaveError(error.message);
    else setSaving(null);
  }

  async function removeSkill(skill: string) {
    const updated = skills.filter((s) => s !== skill);
    setSkills(updated);
    setSaving("Skills");
    const { error } = await supabase.from("users").update({ skills: updated }).eq("id", profile.id);
    if (error) setSaveError(error.message);
    else setSaving(null);
  }

  async function addLanguage() {
    const trimmed = langInput.trim();
    if (!trimmed || languages.includes(trimmed)) return;
    const updated = [...languages, trimmed];
    setLanguages(updated);
    setLangInput("");
    setSaving("Languages");
    const { error } = await supabase.from("users").update({ languages: updated }).eq("id", profile.id);
    if (error) setSaveError(error.message);
    else setSaving(null);
  }

  async function removeLanguage(lang: string) {
    const updated = languages.filter((l) => l !== lang);
    setLanguages(updated);
    setSaving("Languages");
    const { error } = await supabase.from("users").update({ languages: updated }).eq("id", profile.id);
    if (error) setSaveError(error.message);
    else setSaving(null);
  }

  async function handleIncomeChange(value: string) {
    setIncome(value);
    const numValue = value ? parseFloat(value) : null;
    setSaving("Income");
    const { error } = await supabase.from("users").update({ income_estimate_usd_monthly: numValue }).eq("id", profile.id);
    if (error) setSaveError(error.message);
    else setSaving(null);
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" });

  const docsByType: Record<string, { count: number; latest: string }> = {};
  for (const doc of vaultDocuments) {
    const t = getDocumentType(doc);
    if (!docsByType[t]) docsByType[t] = { count: 0, latest: doc.created_at };
    docsByType[t].count++;
    if (doc.created_at > docsByType[t].latest) docsByType[t].latest = doc.created_at;
  }
  const vaultDocTypes = Object.keys(docsByType);

  const hasPassport = vaultDocTypes.includes("passport");

  const completionScore = (() => {
    let score = 0;
    if (profile.full_name?.trim()) score += 10;
    if (profile.phone?.trim()) score += 10;
    if (profile.country_of_residence?.trim()) score += 10;
    if (skills.length > 0) score += 10;
    if (languages.length > 0) score += 5;
    if (profile.readiness_destination) score += 15;
    if (income) score += 5;
    if (hasPassport) score += 20;
    if (vaultDocTypes.length >= 2) score += 15;
    return Math.min(score, 100);
  })();

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionScore / 100) * circumference;

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", margin: 0 }}>Global Opportunity Profile</h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0.25rem 0 0 0" }}>Your complete profile — manage your identity, finances, and credentials</p>
      </div>

      {saveError && (
        <div style={{ padding: "0.75rem 1rem", background: "#FEE2E2", color: "#DC2626", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.8125rem" }}>
          Error saving {saving}: {saveError}
          <button onClick={() => setSaveError(null)} style={{ marginLeft: "0.75rem", background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontWeight: 700 }}>✕</button>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem",
        alignItems: "start",
      }}>
        {/* === LEFT COLUMN — IDENTITY === */}
        <div style={{
          background: "white", borderRadius: "var(--radius-xl)", padding: "1.5rem",
          border: "1px solid var(--border)",
        }}>
          {/* Profile completion circle */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
              <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="48" cy="48" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="6" />
                <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--teal)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: "stroke-dashoffset 0.8s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)" }}>{completionScore}%</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--midnight)", margin: 0 }}>Profile completeness</p>
              <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0.25rem 0 0 0" }}>
                {completionScore < 100 ? "Complete your profile to unlock the Trust Certificate" : "Profile complete ✓"}
              </p>
            </div>
          </div>

          {/* Personal info */}
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.75rem 0" }}>Personal Information</h3>
            <div style={{ fontSize: "0.8125rem", color: "#374151", lineHeight: 1.8 }}>
              <div><strong>Name:</strong> {profile.full_name}</div>
              <div><strong>Email:</strong> {profile.email}</div>
              <div><strong>Phone:</strong> {profile.phone || "—"}</div>
              <div><strong>Country:</strong> {profile.country_of_residence || "—"}</div>
              <div><strong>Member since:</strong> {memberSince}</div>
            </div>
          </div>

          {/* Skills editor */}
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>Skills {skills.length > 0 && <span style={{ fontWeight: 400, color: "#6B7280", fontSize: "0.75rem" }}>({skills.length}/10)</span>}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
              {skills.map((skill) => (
                <span key={skill} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "2px 8px", background: "var(--teal)", color: "var(--midnight)", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 }}>
                  {skill}
                  <button onClick={() => removeSkill(skill)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--midnight)", padding: 0, fontSize: "0.8125rem", lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
            {skills.length < 10 && (
              <div style={{ display: "flex", gap: "0.375rem" }}>
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="Type a skill + Enter"
                  style={{ flex: 1, padding: "0.375rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none" }}
                />
              </div>
            )}
          </div>

          {/* Languages editor */}
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>Languages</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
              {languages.map((lang) => (
                <span key={lang} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "2px 8px", background: "#E5E7EB", color: "#374151", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 }}>
                  {lang}
                  <button onClick={() => removeLanguage(lang)} style={{ background: "none", border: "none", cursor: "pointer", color: "#374151", padding: 0, fontSize: "0.8125rem", lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <input
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLanguage(); } }}
                placeholder="Type a language + Enter"
                style={{ flex: 1, padding: "0.375rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none" }}
              />
            </div>
          </div>

          {/* Income estimate */}
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>Income Estimate</h3>
            <select
              value={income}
              onChange={(e) => handleIncomeChange(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white", outline: "none" }}
            >
              {INCOME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* LinkedIn URL */}
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>LinkedIn URL</h3>
            <input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              style={{ width: "100%", padding: "0.5rem 0.625rem", fontSize: "0.8125rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Trust & Readiness badges */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120, padding: "0.75rem", background: "var(--off-white)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "0.6875rem", color: "#6B7280", marginBottom: "0.25rem" }}>TRUST SCORE</div>
              <div style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: getTrustColor(financialProfile?.trust_score || profile.trust_score || 0) }}>
                {financialProfile?.trust_score || profile.trust_score || 0}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 120, padding: "0.75rem", background: "var(--off-white)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "0.6875rem", color: "#6B7280", marginBottom: "0.25rem" }}>READINESS</div>
              <div style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--teal)" }}>
                {profile.readiness_score}
              </div>
            </div>
          </div>
        </div>

        {/* === CENTRE COLUMN — FINANCIAL STANDING === */}
        <div style={{
          background: "white", borderRadius: "var(--radius-xl)", padding: "1.5rem",
          border: "1px solid var(--border)",
        }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 1rem 0" }}>Financial Standing</h2>

          {financialProfile ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <MetricCard label="Total Saved" value={formatNgn(financialProfile.total_deposited_ngn)} />
                <MetricCard label="Avg Monthly Deposit" value={formatNgn(Math.round(financialProfile.average_monthly_deposit_ngn))} sub="From confirmed deposits" />
                <MetricCard label="Consistency" value={`${financialProfile.deposit_consistency_score}%`} color={getConsistencyColor(financialProfile.deposit_consistency_score)} sub="Regularity of deposits" />
                <MetricCard label="Longest Streak" value={`${financialProfile.longest_streak_weeks} weeks`} sub="Consecutive weeks" />
                <MetricCard label="Goals Created" value={financialProfile.total_goals_created.toString()} />
                <MetricCard label="Goals Completed" value={financialProfile.total_goals_completed.toString()} />
              </div>

              {/* Business indicators */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                {financialProfile.has_uk_company && <Badge label="UK Company" />}
                {financialProfile.has_us_llc && <Badge label="US LLC" />}
                {financialProfile.has_uae_company && <Badge label="UAE Company" />}
                {financialProfile.is_sme_owner && <Badge label="SME Owner" />}
                {financialProfile.identity_verified && <Badge label="Identity Verified" color="var(--teal)" />}
              </div>

              {profile.alumni_status && (
                <div style={{ padding: "0.5rem 0.75rem", background: "#FEF3C7", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", fontWeight: 600, color: "#92400E", marginBottom: "1rem" }}>
                  ⭐ Alumni — Completed services
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: "0.8125rem", color: "#6B7280" }}>Financial profile not yet calculated. Save a deposit to generate your profile.</p>
          )}

          {/* Active goals */}
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>
            Active Goals {goals.length > 0 && <span style={{ fontWeight: 400, color: "#6B7280", fontSize: "0.75rem" }}>({goals.length})</span>}
          </h3>
          {goals.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "#6B7280", marginBottom: "1rem" }}>No active goals yet.</p>
          ) : (
            <div style={{ marginBottom: "1rem" }}>
              {goals.slice(0, 5).map((goal) => {
                const pct = goal.target_amount > 0 ? Math.round((goal.current_balance / goal.target_amount) * 100) : 0;
                return (
                  <div key={goal.id} style={{ marginBottom: "0.625rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#374151", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 600 }}>{goal.goal_name}</span>
                      <span>{formatNgn(goal.current_balance)} / {formatNgn(goal.target_amount)}</span>
                    </div>
                    <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: "var(--teal)", borderRadius: 3, transition: "width 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "#6B7280", marginTop: "0.125rem" }}>{pct}% · {goal.destination || "No destination"}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Service orders */}
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>
            Recent Services {serviceOrders.length > 0 && <span style={{ fontWeight: 400, color: "#6B7280", fontSize: "0.75rem" }}>({serviceOrders.length})</span>}
          </h3>
          {serviceOrders.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "#6B7280" }}>No service orders yet.</p>
          ) : (
            <div>
              {serviceOrders.map((order) => (
                <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#374151" }}>{order.service_packages?.name || "Unknown service"}</div>
                    <div style={{ fontSize: "0.6875rem", color: "#6B7280" }}>{order.service_packages?.destination || ""}</div>
                  </div>
                  <span style={{
                    padding: "2px 6px", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600,
                    background: order.status === "completed" ? "var(--teal)" : order.status === "initiated" || order.status === "payment_pending" ? "#FEF3C7" : "#E5E7EB",
                    color: order.status === "completed" ? "white" : order.status === "initiated" || order.status === "payment_pending" ? "#92400E" : "#374151",
                  }}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === RIGHT COLUMN — GLOBAL PROFILE === */}
        <div style={{
          background: "white", borderRadius: "var(--radius-xl)", padding: "1.5rem",
          border: "1px solid var(--border)",
        }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 1rem 0" }}>Global Profile</h2>

          {/* Destinations */}
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>Destinations</h3>
            {profile.readiness_destination || financialProfile?.primary_destination ? (
              <div style={{ fontSize: "0.8125rem", color: "#374151", lineHeight: 1.8 }}>
                <div><strong>Primary:</strong> {financialProfile?.primary_destination || profile.readiness_destination || "—"}</div>
                {financialProfile?.secondary_destination && <div><strong>Secondary:</strong> {financialProfile.secondary_destination}</div>}
                {financialProfile?.estimated_move_timeline && <div><strong>Timeline:</strong> {financialProfile.estimated_move_timeline}</div>}
              </div>
            ) : (
              <p style={{ fontSize: "0.8125rem", color: "#6B7280" }}>No destination set. Complete your readiness assessment.</p>
            )}
          </div>

          {/* Vault documents */}
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>
              Documents in Vault {vaultDocTypes.length > 0 && <span style={{ fontWeight: 400, color: "#6B7280", fontSize: "0.75rem" }}>({vaultDocuments.length})</span>}
            </h3>
            {vaultDocTypes.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "#6B7280" }}>No documents uploaded. Go to <a href="/dashboard/documents" style={{ color: "var(--teal)", textDecoration: "none" }}>Documents</a>.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {vaultDocTypes.map((type) => (
                  <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.625rem", background: "var(--off-white)", borderRadius: "var(--radius-md)", fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>
                    <span>{getDocumentIcon(type)}</span>
                    <span>{type.replace(/_/g, " ")}</span>
                    {docsByType[type].count > 1 && <span style={{ color: "#6B7280" }}>×{docsByType[type].count}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificates */}
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", margin: "0 0 0.5rem 0" }}>
              Certificates {certificates.length > 0 && <span style={{ fontWeight: 400, color: "#6B7280", fontSize: "0.75rem" }}>({certificates.length})</span>}
            </h3>
            {certificates.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "#6B7280" }}>No certificates issued yet.</p>
            ) : (
              <div>
                {certificates.map((cert) => {
                  const isExpired = !cert.is_valid || new Date(cert.expires_at) < new Date();
                  return (
                    <div key={cert.certificate_number} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#374151" }}>
                          {cert.certificate_type === "proof_of_funds" ? "Proof of Funds" : "Trust Certificate"}
                        </div>
                        <div style={{ fontSize: "0.6875rem", color: "#6B7280" }}>
                          {cert.certificate_number} · Issued {new Date(cert.issued_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        {isExpired ? (
                          <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600, background: "#FEE2E2", color: "#DC2626" }}>Expired</span>
                        ) : (
                          <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600, background: "var(--teal)", color: "white" }}>Valid</span>
                        )}
                        <a href={`/verify/${cert.certificate_number}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)", textDecoration: "none", fontSize: "0.75rem", fontWeight: 600 }}>
                          Verify →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Opportunities hint */}
          <div style={{ padding: "1rem", background: "var(--off-white)", borderRadius: "var(--radius-md)" }}>
            <p style={{ fontSize: "0.8125rem", color: "#374151", margin: 0, lineHeight: 1.5 }}>
              <strong style={{ color: "var(--midnight)" }}>🔓 Unlock more opportunities</strong><br />
              {completionScore < 100
                ? `Your profile is ${completionScore}% complete. Adding more information increases your visibility to agents and unlocks premium opportunities.`
                : "Your profile is complete! You have access to all available opportunities."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ padding: "0.75rem", background: "var(--off-white)", borderRadius: "var(--radius-md)" }}>
      <div style={{ fontSize: "0.6875rem", color: "#6B7280", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 800, color: color || "var(--midnight)" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.625rem", color: "#9CA3AF", marginTop: "0.125rem" }}>{sub}</div>}
    </div>
  );
}

function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600, background: `${color || "#E5E7EB"}`, color: color ? "white" : "#374151" }}>
      {label}
    </span>
  );
}
