/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.jsx
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "@services/authService";
import { getProfileCompletion } from "../utils/profileCompletion";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return null;
      const data = await authService.getProfile();
      setUser(data.user);
      return data.user;
    } catch {
      localStorage.removeItem("access_token");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Dijalankan setelah render pertama (bukan setState sinkron di dalam effect).
    let cancelled = false;
    const run = () => {
      if (!cancelled) checkAuth();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
    }
  }, []);

  const isAdmin = user?.role === "admin";

  // Status kelengkapan profil (dipakai ProfileGuard, Header, dan ProfilePage).
  const profileCompletion = useMemo(() => getProfileCompletion(user), [user]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      logout,
      isAdmin,
      checkAuth,
      profileCompletion,
      isProfileComplete: profileCompletion.isComplete,
      isProfileLocked: profileCompletion.isLocked,
    }),
    [user, loading, logout, isAdmin, checkAuth, profileCompletion],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
