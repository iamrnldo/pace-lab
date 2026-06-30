// src/components/layout/MainLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MarqueeBanner from "./MarqueeBanner";

export default function MainLayout() {
  const { pathname } = useLocation();
  const [offset, setOffset] = useState(0);

  // Hitung total tinggi header + marquee
  useEffect(() => {
    const calculate = () => {
      const header = document.querySelector("header");
      const marquee = document.querySelector("[data-marquee]");
      const h = (header?.offsetHeight || 0) + (marquee?.offsetHeight || 0);
      setOffset(h);
    };

    // Delay sedikit biar DOM ready
    const timer = setTimeout(calculate, 50);
    window.addEventListener("resize", calculate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculate);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-retro-black retro-grid scanlines">
      <Header />
      <MarqueeBanner />
      <main className="relative z-10" style={{ paddingTop: `${offset}px` }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
