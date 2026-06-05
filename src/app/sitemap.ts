import type { MetadataRoute } from "next";

const destinations = [
  "united-kingdom", "canada", "united-arab-emirates", "australia",
  "malaysia", "south-africa", "schengen",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://swiipt.com";

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
  ];

  const destinationPages = destinations.map((slug) => ({
    url: `${baseUrl}/destinations/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...destinationPages];
}
