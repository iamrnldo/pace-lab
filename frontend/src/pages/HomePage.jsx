// src/pages/HomePage.jsx
import { useAuth } from "../context/AuthContext";
import HeroSection from "../components/sections/HeroSection";
import StatsSection from "../components/sections/StatsSection";
import CalculatorGrid from "../components/sections/CalculatorGrid";
import HowItWorks from "../components/sections/HowItWorks";

export default function HomePage() {
  const auth = useAuth();
  const user = auth?.user;

  return (
    <div>
      <HeroSection />
      <StatsSection />
      {/* CalculatorGrid hanya muncul setelah login */}
      {user && <CalculatorGrid />}
      <HowItWorks />
    </div>
  );
}
