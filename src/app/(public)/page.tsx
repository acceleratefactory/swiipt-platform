import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import ProductCards from "@/components/landing/ProductCards";
import DestinationCards from "@/components/landing/DestinationCards";
import HolidayPackages from "@/components/landing/HolidayPackages";
import CostCalculator from "@/components/landing/CostCalculator";
import EligibilityChecker from "@/components/landing/EligibilityChecker";
import SuccessStories from "@/components/landing/SuccessStories";
import EmailCapture from "@/components/landing/EmailCapture";
import CorporateSection from "@/components/landing/CorporateSection";
import ResourcesSection from "@/components/landing/ResourcesSection";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Swiipt — Save. Move. Arrive.",
  description:
    "Save toward any destination. Book flights and holidays. Process visas, residency permits, and 2nd citizenship. One platform.",
  keywords: "Nigeria relocation, UAE visa Nigeria, Canada immigration Nigeria, UK visa Nigeria, second citizenship, remote work visa",
  openGraph: {
    title: "Swiipt — Your money moves you to the world",
    description: "Save toward any destination. Process visas, residency, and citizenship. Book flights and holidays.",
    url: "https://swiipt.com",
    siteName: "Swiipt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Swiipt — Save. Move. Arrive.",
    description: "Save toward any destination. Book flights and holidays. Process visas and residency.",
  },
  robots: { index: true, follow: true },
};

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <div id="flights"><Hero /></div>
      <StatsBar />
      <div id="services"><ProductCards /></div>
      <div id="destinations"><DestinationCards /></div>
      <div id="holidays"><HolidayPackages /></div>
      <div id="calculator"><CostCalculator /></div>
      <div id="eligibility"><EligibilityChecker /></div>
      <div id="success-stories"><SuccessStories /></div>
      <div id="visa-intelligence"><EmailCapture /></div>
      <CorporateSection />
      <ResourcesSection />
      <Footer />
    </>
  );
}
