// src/pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuth();

  const user = auth?.user;
  const setUser = auth?.setUser;
  const checkAuth = auth?.checkAuth;

  const [activeTab, setActiveTab] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle token from Google OAuth callback
  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");

    if (err) {
      if (err === "admin_use_form") {
        setActiveTab("admin");
        setError("Admin must login with email & password");
      } else {
        setError("Authentication failed. Please try again.");
      }
      return;
    }

    if (token) {
      localStorage.setItem("access_token", token);
      // Fetch profile, redirect setelah user ter-set
      if (checkAuth) {
        checkAuth();
      }
    }
  }, [searchParams, checkAuth]);

  // Redirect jika sudah login — INI yang handle semua redirect
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

  // Google login
  const handleGoogleLogin = () => {
    window.location.href = `${
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
    }/auth/google`;
  };

  // Admin login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/admin/login", { email, password });

      // Simpan token
      localStorage.setItem("access_token", data.accessToken);

      // Force full page reload — AuthContext akan fetch profile & redirect ke /admin
      window.location.href = "/admin";
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md animate-slide-up">
        <div className="border-2 border-retro-green p-8 relative">
          <span
            className="absolute -top-3 left-8 bg-retro-black px-3
              font-mono text-retro-green text-xs tracking-widest"
          >
            AUTHENTICATION
          </span>

          <div className="text-center mb-8">
            <div className="font-retro text-6xl text-retro-white mb-2">
              SIGN IN
            </div>
            <p className="font-sport text-retro-white/50 tracking-wide">
              Access your running dashboard
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex mb-6 border-b-2 border-retro-green/20">
            <button
              onClick={() => {
                setActiveTab("user");
                setError("");
              }}
              className={`flex-1 py-3 font-retro text-lg tracking-widest transition-colors relative ${
                activeTab === "user"
                  ? "text-retro-green"
                  : "text-retro-white/30 hover:text-retro-white/50"
              }`}
            >
              USER
              {activeTab === "user" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-retro-green" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("admin");
                setError("");
              }}
              className={`flex-1 py-3 font-retro text-lg tracking-widest transition-colors relative ${
                activeTab === "admin"
                  ? "text-retro-green"
                  : "text-retro-white/30 hover:text-retro-white/50"
              }`}
            >
              ADMIN
              {activeTab === "admin" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-retro-green" />
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 border border-red-400/50 bg-red-400/10 text-red-400 font-mono text-xs tracking-wider">
              {error}
            </div>
          )}

          {/* USER Tab — Google Login */}
          {activeTab === "user" && (
            <div>
              <button
                onClick={handleGoogleLogin}
                className="btn-retro bg-retro-green text-retro-black font-retro tracking-widest
                  w-full py-4 text-lg flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#005BAC" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#005BAC" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#005BAC" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#005BAC" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
              <p className="font-mono text-[11px] text-retro-white/25 text-center mt-6 leading-relaxed">
                For regular users. Your data is secured and never shared with third parties.
              </p>
            </div>
          )}

          {/* ADMIN Tab — Email/Password Form */}
          {activeTab === "admin" && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pacelab.com"
                  required
                  className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider"
                />
              </div>
              <div>
                <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-retro bg-retro-green text-retro-black font-retro tracking-widest
                  w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "SIGNING IN..." : "SIGN IN →"}
              </button>
              <p className="font-mono text-[11px] text-retro-white/25 text-center mt-4 leading-relaxed">
                Admin access only. Contact administrator for credentials.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
