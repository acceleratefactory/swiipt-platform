"use client";

import { useCallback } from "react";

const COUNTRY_SLUGS: Record<string, string> = {
  "uk": "uk",
  "united kingdom": "uk",
  "usa": "usa",
  "united states": "usa",
  canada: "canada",
  germany: "germany",
  sweden: "sweden",
  denmark: "denmark",
  uae: "uae",
  qatar: "qatar",
  australia: "australia",
  china: "china",
  netherlands: "netherlands",
  france: "france",
  portugal: "portugal",
  georgia: "georgia",
};

const VISA_TYPES: Record<string, string> = {
  scholarship: "study",
  study: "study",
  visa_programme: "work",
  job: "work",
  remote_work: "work",
  internship: "work",
  residency: "residency",
  citizenship: "citizenship",
  training: "study",
  exchange: "study",
};

function getServiceUrl(type: string, country: string, oppId: string, serviceUrl?: string | null): string | null {
  if (serviceUrl) return serviceUrl;

  const countrySlug = COUNTRY_SLUGS[country.toLowerCase().trim()];
  const visaType = VISA_TYPES[type];

  if (visaType && countrySlug) {
    return `/services/${countrySlug}-${visaType}-visa`;
  }

  if (type === "scholarship" || type === "fellowship" || type === "grant") {
    return `/goals/new?opportunity=${oppId}`;
  }

  if (type === "trade_show") {
    return "/trade-shows";
  }

  return null;
}

function getCTALabel(type: string, country: string): string {
  const base = country.split(",")[0].trim();
  const visaType = VISA_TYPES[type];

  if (visaType && visaType !== "residency" && visaType !== "citizenship") {
    return `Need a ${base} ${visaType} visa? We can help`;
  }
  if (visaType === "residency") {
    return `Moving to ${base}? Let us guide you`;
  }
  if (visaType === "citizenship") {
    return `${base} citizenship? Start here`;
  }
  if (type === "scholarship" || type === "fellowship" || type === "grant") {
    return "Create a savings goal for this opportunity";
  }
  if (type === "trade_show") {
    return "Join a trade show group and save together";
  }
  return `Explore services for ${base}`;
}

interface Props {
  type: string;
  location_country: string;
  opportunityId: string;
  service_url?: string | null;
}

export default function ServiceCTA({ type, location_country, opportunityId, service_url }: Props) {
  const url = getServiceUrl(type, location_country, opportunityId, service_url);

  const handleClick = useCallback(() => {
    fetch("/api/opportunities/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId, action: "view" }),
    }).catch(() => {});
    fetch("/api/opportunities/track-signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId, signal_type: "service_click" }),
    }).catch(() => {});
  }, [opportunityId]);

  if (!url) return null;

  return (
    <a
      href={url}
      onClick={handleClick}
      style={{
        fontSize: "0.75rem",
        color: "#000000",
        fontWeight: 600,
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        marginTop: "0.5rem",
      }}
    >
      {"\uD83C\uDFAF"} {getCTALabel(type, location_country)} &rarr;
    </a>
  );
}
