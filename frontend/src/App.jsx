import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/layout/AdminLayout";
import AuthGuard from "./components/auth/AuthGuard";
import ProfileGuard from "./components/auth/ProfileGuard";
import RoleGuard from "./components/auth/RoleGuard";
import HomePage from "./pages/HomePage";
import CalculatorPage from "./pages/CalculatorPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import CreateTrainingProgramPage from "./pages/CreateTrainingProgramPage";
import MyTrainingProgramsPage from "./pages/MyTrainingProgramsPage"; // 1. PASTIKAN IMPORT INI ADA
import NotFoundPage from "./pages/NotFoundPage";
import AdminPage from "./pages/AdminPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminUserLogPage from "./pages/AdminUserLogPage";
import AdminAdminLogPage from "./pages/AdminAdminLogPage";
import AdminProfilePage from "./pages/AdminProfilePage";

// Rute yang butuh login. `requireProfile` mengunci menu sampai profil lengkap.
function Protected({ children, requireProfile = true }) {
  return (
    <AuthGuard>
      {requireProfile ? <ProfileGuard>{children}</ProfileGuard> : children}
    </AuthGuard>
  );
}

export default function App() {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });
    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />

          {/* Calculator — protected (butuh profil lengkap) */}
          <Route
            path="calculator"
            element={
              <Protected>
                <CalculatorPage />
              </Protected>
            }
          />

          {/* Dashboard — protected */}
          <Route
            path="dashboard"
            element={
              <Protected>
                <DashboardPage />
              </Protected>
            }
          />

          {/* Create Training Program — protected */}
          <Route
            path="create-training-program"
            element={
              <Protected>
                <CreateTrainingProgramPage />
              </Protected>
            }
          />

          {/* 2. TAMBAHKAN RUTE MY TRAINING PROGRAMS DISINI */}
          <Route
            path="my-training-programs"
            element={
              <Protected>
                <MyTrainingProgramsPage />
              </Protected>
            }
          />

          {/* Profile — protected, TETAP bisa diakses walau profil belum lengkap */}
          <Route
            path="profile"
            element={
              <Protected requireProfile={false}>
                <ProfilePage />
              </Protected>
            }
          />

          {/* 3. PINDAHKAN NOT FOUND KE PALING BAWAH DI DALAM LAYOUT */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <RoleGuard role="admin">
                <AdminLayout />
              </RoleGuard>
            </AuthGuard>
          }
        >
          <Route index element={<AdminPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="logs/user" element={<AdminUserLogPage />} />
          <Route path="logs/admin" element={<AdminAdminLogPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgb(var(--retro-gray))",
            color: "rgb(var(--retro-white))",
            border: "2px solid rgb(var(--retro-green))",
            borderRadius: "0",
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: "16px",
            letterSpacing: "0.05em",
          },
          success: {
            iconTheme: {
              primary: "rgb(var(--retro-green))",
              secondary: "rgb(var(--retro-black))",
            },
          },
        }}
      />
    </BrowserRouter>
  );
}