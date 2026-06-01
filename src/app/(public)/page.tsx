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
import SEOContent from "@/components/landing/SEOContent";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <StatsBar />
      <ProductCards />
      <DestinationCards />
      <HolidayPackages />
      <CostCalculator />
      <EligibilityChecker />
      <SuccessStories />
      <EmailCapture />
      <CorporateSection />
      <SEOContent />
      <Footer />
    </main>
  );
}
