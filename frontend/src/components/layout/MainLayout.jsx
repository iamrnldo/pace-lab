// src/components/layout/MainLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MarqueeBanner from "./MarqueeBanner";

export default function MainLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-retro-black retro-grid scanlines">
      <Header />
      <MarqueeBanner />
      <main className="relative z-10 pt-[104px] md:pt-[132px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
