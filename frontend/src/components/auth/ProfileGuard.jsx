// src/components/auth/ProfileGuard.jsx
// Mengunci seluruh menu aplikasi selama profil runner belum lengkap.
// Pengguna diarahkan ke halaman Profile untuk melengkapi data terlebih dahulu.
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@context/AuthContext";

export default function ProfileGuard({ children }) {
  const { user, loading, isProfileComplete } = useAuth();
  const location = useLocation();

  // AuthGuard di atasnya sudah menangani keadaan loading; ini hanya jaring aman.
  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isProfileComplete) {
    return (
      <Navigate
        to="/profile"
        state={{ profileRequired: true, from: location }}
        replace
      />
    );
  }

  return children;
}
