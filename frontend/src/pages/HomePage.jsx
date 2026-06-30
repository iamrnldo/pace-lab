// src/pages/HomePage.jsx
import HeroSection from "../components/sections/HeroSection";
import StatsSection from "../components/sections/StatsSection";
import CalculatorGrid from "../components/sections/CalculatorGrid";
import HowItWorks from "../components/sections/HowItWorks";

export default function HomePage() {
  // ❌ Hapus pt-28 atau pt-[xxx]
  // MainLayout sudah handle paddingTop otomatis
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <CalculatorGrid />
      <HowItWorks />
    </div>
  );
}
