import Script from "next/script";
import NicheHero from "./NicheHero";
import NicheProcess from "./NicheProcess";
import NicheCostBreakdown from "./NicheCostBreakdown";
import NicheRequirements from "./NicheRequirements";
import NicheFAQ from "./NicheFAQ";
import NicheSuccessStory from "./NicheSuccessStory";
import NicheCTA from "./NicheCTA";
import NicheRelated from "./NicheRelated";

export default function NicheLandingPage({ page, configs, relatedPages }: {
  page: any;
  configs: any[];
  relatedPages: any[];
}) {
  const costConfig = page.cost_calculator_destination && page.cost_calculator_service_type
    ? configs.find((c: any) =>
        c.destination === page.cost_calculator_destination &&
        c.service_type === page.cost_calculator_service_type &&
        c.family_size === "solo"
      )
    : null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": page.title,
    "description": page.meta_description || page.subtitle,
    "provider": {
      "@type": "Organization",
      "name": "Swiipt",
      "url": "https://swiipt.com",
    },
    "areaServed": "Nigeria",
    "serviceType": page.category,
  };

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <Script
        id="structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <NicheHero page={page} />
      {(page.process_steps || []).length > 0 && <NicheProcess steps={page.process_steps} />}
      {costConfig && <NicheCostBreakdown config={costConfig} />}
      {(page.requirements || []).length > 0 && <NicheRequirements requirements={page.requirements} />}
      {page.success_story_quote && <NicheSuccessStory page={page} />}
      {(page.faqs || []).length > 0 && <NicheFAQ faqs={page.faqs} />}
      <NicheCTA page={page} />
      {relatedPages.length > 0 && <NicheRelated pages={relatedPages} />}
    </div>
  );
}
