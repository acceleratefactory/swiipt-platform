import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import ProductCards from "@/components/landing/ProductCards";
import DestinationCards from "@/components/landing/DestinationCards";
import HolidayPackages from "@/components/landing/HolidayPackages";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <StatsBar />
      <ProductCards />
      <DestinationCards />
      <HolidayPackages />
    </main>
  );
}
