// src/router.jsx
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@components/layout/MainLayout";
import AdminLayout from "@components/layout/AdminLayout";
import AuthGuard from "@components/auth/AuthGuard";
import RoleGuard from "@components/auth/RoleGuard";

import HomePage from "@pages/HomePage";
import CalculatorPage from "@pages/CalculatorPage";
import DashboardPage from "@pages/DashboardPage";
import HistoryPage from "@pages/HistoryPage";
import ProfilePage from "@pages/ProfilePage";
import AdminPage from "@pages/AdminPage";
import LoginPage from "@pages/LoginPage";
import NotFoundPage from "@pages/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "calculator", element: <CalculatorPage /> },
      { path: "login", element: <LoginPage /> },
      {
        path: "dashboard",
        element: (
          <AuthGuard>
            <DashboardPage />
          </AuthGuard>
        ),
      },
      {
        path: "history",
        element: (
          <AuthGuard>
            <HistoryPage />
          </AuthGuard>
        ),
      },
      {
        path: "profile",
        element: (
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        ),
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <AuthGuard>
        <RoleGuard role="admin">
          <AdminLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [{ index: true, element: <AdminPage /> }],
  },
  { path: "*", element: <NotFoundPage /> },
]);

export default router;
