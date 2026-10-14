// src/components/layout/MainLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import Header from "./Header";
import Footer from "./Footer";
import MarqueeBanner from "./MarqueeBanner";

export default function MainLayout() {
  const { pathname } = useLocation();
  const { zoneVars } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div
      className="min-h-screen bg-retro-black retro-grid scanlines"
      style={zoneVars.main}
    >
      {/* zona HEADER — header + strip marquee memakai palette yang sama */}
      <div style={zoneVars.header}>
        <Header />
        <MarqueeBanner />
      </div>
      <main className="relative z-10 pt-[104px] md:pt-[132px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
