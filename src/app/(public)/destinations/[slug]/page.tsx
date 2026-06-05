import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DestinationHero from "@/components/public/destinations/DestinationHero";
import DestinationPathways from "@/components/public/destinations/DestinationPathways";
import DestinationRequirements from "@/components/public/destinations/DestinationRequirements";
import DestinationCostBreakdown from "@/components/public/destinations/DestinationCostBreakdown";
import DestinationFAQ from "@/components/public/destinations/DestinationFAQ";
import DestinationCTA from "@/components/public/destinations/DestinationCTA";

const destinationData: Record<string, any> = {
  "uae-residency": {
    name: "UAE Residency",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    heroGradient: "linear-gradient(135deg, #1a6b9e, #0d3d5c)",
    tagline: "Live and work in one of the world's most connected cities.",
    overview: "The UAE offers one of the most accessible residency permit systems in the world for skilled professionals. With no income tax, world-class infrastructure, and a multicultural environment, it remains the top destination for Nigerians relocating abroad.",
    pathways: [
      { name: "Employment Residence Permit", description: "For professionals with a UAE job offer. Employer-sponsored. Most common route.", duration: "8–12 weeks", price: "From ₦850,000" },
      { name: "Freelancer / Self-Employment Visa", description: "For freelancers and self-employed professionals. Requires proof of income.", duration: "8–12 weeks", price: "From ₦950,000" },
      { name: "UAE Free Zone Company + Residence", description: "Register a company in a UAE Free Zone and obtain residency as the company owner.", duration: "4–8 weeks", price: "From ₦1,200,000" },
    ],
    requirements: [
      "Valid international passport (minimum 6 months validity)",
      "Passport photographs (biometric standard)",
      "Medical fitness certificate from UAE-approved centre",
      "Emirates ID application (processed after arrival)",
      "Employment contract or business licence",
      "Bank statement (3 months)",
    ],
    costs: { service_fee: 850000, government_fee: 280000, medical_fee: 45000, travel_estimate: 320000, first_month_setup: 650000 },
    processing_weeks: "8–12",
    success_rate: 94,
    faqs: [
      { q: "Do I need a job offer before applying?", a: "For the employment route, yes. For the freelancer or company routes, you do not need a job offer." },
      { q: "Can my family join me?", a: "Yes. Once you have your residence permit, you can sponsor your spouse and children for dependent visas." },
      { q: "How long is the residence permit valid?", a: "Standard permits are valid for 2 years, renewable. Long-term Golden Visas are available for 5 or 10 years." },
      { q: "Do I need to be in the UAE during the process?", a: "For most employment permits, you need to be in the UAE for the medical examination and Emirates ID biometrics." },
    ],
  },
  "canada-express-entry": {
    name: "Canada Express Entry",
    country: "Canada",
    flag: "🇨🇦",
    heroGradient: "linear-gradient(135deg, #c0392b, #8e44ad)",
    tagline: "One of the most respected permanent residency pathways in the world.",
    overview: "Canada's Express Entry system is a points-based immigration system that manages applications for three federal immigration programs. Your Comprehensive Ranking System (CRS) score determines your chances of receiving an Invitation to Apply (ITA) for Permanent Residence.",
    pathways: [
      { name: "Federal Skilled Worker (FSW)", description: "For skilled workers with at least one year of skilled work experience.", duration: "16–24 weeks after ITA", price: "From ₦1,200,000" },
      { name: "Canadian Experience Class (CEC)", description: "For those who already have Canadian work experience.", duration: "12–16 weeks after ITA", price: "From ₦980,000" },
      { name: "Provincial Nominee Program (PNP)", description: "Enhanced nomination from a province can add 600 CRS points, virtually guaranteeing an ITA.", duration: "Varies by province", price: "From ₦1,400,000" },
    ],
    requirements: [
      "Valid passport",
      "Educational Credential Assessment (ECA) from a designated body",
      "IELTS or CELPIP language test results (minimum CLB 7)",
      "Work experience documentation (NOC codes)",
      "Police clearance certificate",
      "Medical examination by designated panel physician",
      "Proof of funds (varies by family size)",
    ],
    costs: { service_fee: 1200000, government_fee: 450000, language_test: 95000, eca_fee: 45000, travel_estimate: 480000, first_month_setup: 980000 },
    processing_weeks: "16–24",
    success_rate: 88,
    faqs: [
      { q: "What is a good CRS score?", a: "Recent draws have had cutoffs between 480–540. We assess your profile and advise on score-boosting strategies." },
      { q: "Do I need a job offer?", a: "No, but a valid job offer from a Canadian employer adds 50–200 points to your CRS score." },
      { q: "Can my family immigrate with me?", a: "Yes. Your spouse or common-law partner and dependent children are included in your application." },
      { q: "What is the minimum bank balance required?", a: "For a single applicant: CAD 13,757. This increases with family size. You must demonstrate these funds are accessible." },
    ],
  },
  "uk-skilled-worker": {
    name: "UK Skilled Worker Visa",
    country: "United Kingdom",
    flag: "🇬🇧",
    heroGradient: "linear-gradient(135deg, #2c3e50, #3498db)",
    tagline: "Work legally in the UK with a path to Indefinite Leave to Remain.",
    overview: "The UK Skilled Worker visa allows you to come to or stay in the UK to do an eligible job with an approved employer. You need to be sponsored by a UK employer who holds a valid sponsorship licence.",
    pathways: [
      { name: "Skilled Worker Visa (Sponsored)", description: "Requires a valid Certificate of Sponsorship from a UK-licensed employer.", duration: "8–16 weeks", price: "From ₦1,100,000" },
      { name: "Health and Care Worker Visa", description: "For medical professionals working in the NHS or UK social care. Reduced fees.", duration: "6–10 weeks", price: "From ₦750,000" },
      { name: "Graduate Visa", description: "For recent UK university graduates. 2–3 year open work visa with no job offer needed.", duration: "4–8 weeks", price: "From ₦680,000" },
    ],
    requirements: [
      "Valid passport",
      "Certificate of Sponsorship from UK employer",
      "Job offer paying at least the minimum salary threshold (£26,200 or role minimum, whichever is higher)",
      "English language proof (IELTS Academic B1 or equivalent)",
      "Tuberculosis (TB) test certificate",
      "Bank statements showing financial requirement (£1,270 held for 28 days)",
    ],
    costs: { service_fee: 1100000, government_fee: 520000, tb_test: 25000, travel_estimate: 520000, first_month_setup: 1200000 },
    processing_weeks: "8–16",
    success_rate: 87,
    faqs: [
      { q: "Do I need a job offer before applying?", a: "Yes. The Skilled Worker visa requires a Certificate of Sponsorship from a UK-licensed employer." },
      { q: "Can I bring my family?", a: "Yes. Your partner and children under 18 can apply as your dependants." },
      { q: "How long until I can apply for ILR (permanent residence)?", a: "After 5 continuous years on a Skilled Worker visa, you can apply for Indefinite Leave to Remain." },
    ],
  },
  "qatar-residency": {
    name: "Qatar Residency Permit",
    country: "Qatar",
    flag: "🇶🇦",
    heroGradient: "linear-gradient(135deg, #8B4513, #D4A017)",
    tagline: "Build your career in one of the Gulf's fastest-growing economies.",
    overview: "Qatar's residency permit (RP) is an employer-sponsored document that allows foreign nationals to live and work in Qatar legally. The permit is tied to your employer and must be renewed periodically.",
    pathways: [
      { name: "Employment Residence Permit", description: "Standard employer-sponsored residence permit for employed workers.", duration: "8–12 weeks", price: "From ₦750,000" },
      { name: "Investment/Business Residence", description: "For business owners and investors in Qatar.", duration: "10–16 weeks", price: "From ₦1,500,000" },
    ],
    requirements: ["Valid passport", "Employment contract", "Medical fitness certificate", "Police clearance certificate", "Educational certificates (attested)", "Passport photographs"],
    costs: { service_fee: 750000, government_fee: 240000, medical_fee: 40000, travel_estimate: 290000, first_month_setup: 580000 },
    processing_weeks: "8–12",
    success_rate: 93,
    faqs: [
      { q: "Who sponsors the residence permit?", a: "Your employer in Qatar sponsors your residence permit. You cannot apply independently without an employer." },
      { q: "Can I bring my family?", a: "Yes, if your salary meets Qatar's family sponsorship thresholds (typically QAR 10,000+ per month)." },
    ],
  },
  "portugal-remote-work": {
    name: "Portugal D8 Digital Nomad Visa",
    country: "Portugal",
    flag: "🇵🇹",
    heroGradient: "linear-gradient(135deg, #e74c3c, #f39c12)",
    tagline: "EU residency for remote workers and digital nomads.",
    overview: "Portugal's D8 visa (Digital Nomad Visa) allows remote workers and freelancers earning income from non-Portuguese sources to live in Portugal for up to 1 year, renewable for 2-year periods. After 5 years, you can apply for permanent residency or citizenship.",
    pathways: [
      { name: "D8 Passive/Remote Income Visa", description: "For remote workers, freelancers, and those with passive income from non-Portuguese sources.", duration: "12–18 weeks", price: "From ₦950,000" },
      { name: "D7 Passive Income Visa", description: "For those with regular passive income (rental, dividends, pension).", duration: "12–18 weeks", price: "From ₦880,000" },
    ],
    requirements: ["Valid passport", "Proof of regular remote income (minimum €3,040/month)", "NHR tax regime registration (recommended)", "Accommodation proof in Portugal", "Health insurance", "Criminal record certificate", "Bank statements"],
    costs: { service_fee: 950000, government_fee: 280000, health_insurance: 85000, travel_estimate: 650000, first_month_setup: 850000 },
    processing_weeks: "12–18",
    success_rate: 85,
    faqs: [
      { q: "What is the minimum income requirement?", a: "Currently €3,040/month (4× Portugal minimum wage). This changes periodically — we verify current thresholds at application time." },
      { q: "Can I work for Portuguese companies?", a: "The D8 visa is for income earned from outside Portugal. Working for a Portuguese employer requires a different visa." },
    ],
  },
  "second-citizenship": {
    name: "Second Citizenship Programs",
    country: "Caribbean & Pacific",
    flag: "🌍",
    heroGradient: "linear-gradient(135deg, #1abc9c, #16a085)",
    tagline: "A second passport opens doors no single nationality can.",
    overview: "Citizenship by investment (CBI) programs allow individuals to obtain a second passport by making a qualifying investment in the host country. The most established programs offer visa-free access to 140–160+ countries.",
    pathways: [
      { name: "Grenada CBI", description: "USD 150,000 minimum donation to the National Transformation Fund. Includes E-2 Treaty Investor visa eligibility for the USA.", duration: "12–20 weeks", price: "From ₦2,500,000 (service fee only)" },
      { name: "St Kitts & Nevis CBI", description: "USD 250,000 minimum. One of the oldest and most respected CBI programs. Visa-free to 156+ countries.", duration: "12–18 weeks", price: "From ₦2,500,000 (service fee only)" },
      { name: "Dominica CBI", description: "USD 100,000 minimum. Most affordable CBI in the Caribbean. Visa-free to 140+ countries.", duration: "8–14 weeks", price: "From ₦2,200,000 (service fee only)" },
      { name: "Vanuatu DSP", description: "USD 130,000. Fastest CBI program globally — 30–60 day processing. Strong Asian visa access.", duration: "4–8 weeks", price: "From ₦2,000,000 (service fee only)" },
    ],
    requirements: ["Valid passport", "Clean police clearance (all countries of residence)", "Medical certificate", "Proof of investment funds (source of funds documentation)", "Due diligence compliance documents", "Passport photographs"],
    costs: { service_fee: 2500000, government_fee_note: "Government fees vary: USD 100,000–250,000+ (not included in service fee)", travel_estimate: 480000 },
    processing_weeks: "8–20",
    success_rate: 91,
    faqs: [
      { q: "Is the government investment fee included in your service fee?", a: "No. Our service fee covers the application management. The investment (donation or real estate purchase) is paid directly to the host government and is not included." },
      { q: "Which program gives USA access?", a: "Grenada's CBI program is the only Caribbean CBI that includes E-2 Treaty Investor visa eligibility for the United States." },
      { q: "Can my family be included?", a: "Yes. All CBI programs allow you to include a spouse, children, and in some cases parents and siblings in the same application." },
    ],
  },
  "company-registration": {
    name: "Company Registration",
    country: "UK, USA & UAE",
    flag: "🏢",
    heroGradient: "linear-gradient(135deg, #2c3e50, #4ca1af)",
    tagline: "Receive international payments legally. Access Stripe, PayPal, and global banking.",
    overview: "Millions of Nigerian freelancers and business owners cannot receive payments from Stripe, PayPal, or international clients because Nigerian-registered businesses are not supported by many global payment platforms. Registering a company in the UK, USA, or UAE solves this instantly.",
    pathways: [
      { name: "UK Limited Company", description: "Registered at Companies House. Enables Stripe UK, PayPal, Wise, and UK banking. Most popular for freelancers.", duration: "3–7 business days", price: "From ₦180,000" },
      { name: "US LLC (Wyoming)", description: "US Limited Liability Company. Enables Stripe US, PayPal US, Mercury Bank, and USD billing. Ideal for SaaS and app businesses.", duration: "5–10 business days", price: "From ₦220,000" },
      { name: "UAE Free Zone Company", description: "Enables Stripe UAE (via partner), UAE banking, and tax-efficient business structure. Includes 1-year trade licence.", duration: "3–6 weeks", price: "From ₦1,200,000" },
    ],
    requirements: ["Valid passport", "Proof of address", "Director/shareholder details", "Business activity description"],
    costs: { uk_service_fee: 180000, us_service_fee: 220000, uae_service_fee: 1200000 },
    processing_weeks: "varies",
    success_rate: 99,
    faqs: [
      { q: "Do I need to travel to register a UK or US company?", a: "No. Both can be registered entirely remotely. UAE registration may require a short visit for some Free Zones." },
      { q: "Will I need to pay tax in the UK or USA?", a: "Tax obligations depend on your situation. We provide general guidance and recommend consulting a tax professional for your specific circumstances." },
      { q: "How do I open a Stripe account after registration?", a: "Once your company is registered, we provide step-by-step guidance on applying for Stripe and opening a compatible business bank account." },
    ],
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const dest = destinationData[params.slug];
  if (!dest) return { title: "Destination not found" };
  return {
    title: `${dest.name} — Swiipt`,
    description: dest.overview.slice(0, 155),
    openGraph: { title: dest.name, description: dest.tagline },
  };
}

export default async function DestinationPage({ params }: { params: { slug: string } }) {
  const dest = destinationData[params.slug];
  if (!dest) notFound();

  const supabase = createClient();
  const { data: packages } = await supabase
    .from("service_packages")
    .select("id, name, price_ngn, processing_weeks_min, processing_weeks_max, badge_text")
    .eq("is_active", true)
    .ilike("destination", `%${dest.country.split(",")[0]}%`);

  return (
    <div>
      <DestinationHero dest={dest} />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem" }}>
        <DestinationPathways pathways={dest.pathways} />
        <DestinationRequirements requirements={dest.requirements} />
        <DestinationCostBreakdown costs={dest.costs} />
        <DestinationFAQ faqs={dest.faqs} />
        <DestinationCTA slug={params.slug} destName={dest.name} packages={packages || []} />
      </div>
    </div>
  );
}
