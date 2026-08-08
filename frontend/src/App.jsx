import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/layout/AdminLayout";
import AuthGuard from "./components/auth/AuthGuard";
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

          {/* Calculator — protected */}
          <Route
            path="calculator"
            element={
              <AuthGuard>
                <CalculatorPage />
              </AuthGuard>
            }
          />

          {/* Dashboard — protected */}
          <Route
            path="dashboard"
            element={
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            }
          />

          {/* Create Training Program — protected */}
          <Route
            path="create-training-program"
            element={
              <AuthGuard>
                <CreateTrainingProgramPage />
              </AuthGuard>
            }
          />

          {/* 2. TAMBAHKAN RUTE MY TRAINING PROGRAMS DISINI */}
          <Route
            path="my-training-programs"
            element={
              <AuthGuard>
                <MyTrainingProgramsPage />
              </AuthGuard>
            }
          />

          {/* Profile — protected */}
          <Route
            path="profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
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
            background: "#0C6FBA",
            color: "#FFFFFF",
            border: "2px solid #DFF5FF",
            borderRadius: "0",
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: "16px",
            letterSpacing: "0.05em",
          },
          success: {
            iconTheme: { primary: "#DFF5FF", secondary: "#005BAC" },
          },
        }}
      />
    </BrowserRouter>
  );
}