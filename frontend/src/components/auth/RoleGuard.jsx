// src/components/auth/RoleGuard.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@context/AuthContext";

export default function RoleGuard({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-black">
        <div className="flex flex-col items-center gap-4">
          <div className="font-retro text-4xl text-retro-green animate-pulse">
            LOADING
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-retro-green animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not logged in — AuthGuard should handle this, but fallback
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role — redirect to home
  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
