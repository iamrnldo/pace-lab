// src/components/admin/AdminProfileSection.jsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

export default function AdminProfileSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const updateMutation = useMutation({
    mutationFn: (data) => adminService.updateAdminProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-profile"] });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="font-retro text-3xl md:text-4xl text-retro-white tracking-wider">
          ADMIN PROFILE
        </h1>
        <p className="font-mono text-xs text-retro-white/30 tracking-widest mt-1">
          ACCOUNT SETTINGS & INFORMATION
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card-retro p-6 flex flex-col items-center text-center">
          {/* Avatar */}
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-24 h-24 border-3 border-retro-green mb-4"
            />
          ) : (
            <div className="w-24 h-24 border-3 border-retro-green flex items-center justify-center bg-retro-gray mb-4">
              <span className="font-retro text-4xl text-retro-green">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </span>
            </div>
          )}

          <h2 className="font-retro text-2xl text-retro-white tracking-wider">
            {user?.name || "ADMIN"}
          </h2>
          <p className="font-mono text-xs text-retro-green/60 tracking-wider mt-1">
            {user?.email}
          </p>

          <div className="mt-4 flex items-center gap-2 px-3 py-1.5 border border-red-400/30 bg-red-400/5">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-mono text-[11px] text-red-400 tracking-widest">
              ADMINISTRATOR
            </span>
          </div>

          {/* Stats */}
          <div className="w-full mt-6 pt-4 border-t border-retro-green/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-sport text-sm text-retro-white/40">Role</span>
              <span className="font-mono text-xs text-retro-green uppercase tracking-wider">
                {user?.role || "admin"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sport text-sm text-retro-white/40">Joined</span>
              <span className="font-mono text-xs text-retro-white/50">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sport text-sm text-retro-white/40">Last Login</span>
              <span className="font-mono text-xs text-retro-white/50">
                {user?.last_login_at
                  ? new Date(user.last_login_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="card-retro p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-retro-green/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-retro-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="font-retro text-xl text-retro-white tracking-wider">
                  EDIT PROFILE
                </h2>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-retro px-4 py-2 text-sm font-sport tracking-wider"
                >
                  EDIT
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                  disabled={!isEditing}
                  className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, email: e.target.value }))
                  }
                  disabled={!isEditing}
                  className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Actions */}
              {isEditing && (
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="btn-retro btn-retro-solid px-6 py-2.5 font-sport tracking-wider text-sm disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "SAVING..." : "SAVE CHANGES"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || "",
                        email: user?.email || "",
                      });
                    }}
                    className="btn-retro px-6 py-2.5 font-sport tracking-wider text-sm"
                  >
                    CANCEL
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Security Info */}
          <div className="card-retro p-6 mt-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 border-2 border-retro-green/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-retro-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="font-retro text-xl text-retro-white tracking-wider">
                SECURITY
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-retro-gray-light/10">
                <div>
                  <p className="font-sport text-sm text-retro-white/70 tracking-wider">
                    Authentication
                  </p>
                  <p className="font-mono text-[10px] text-retro-white/30 mt-0.5">
                    Google OAuth 2.0
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider px-2.5 py-1 border border-retro-green/30 text-retro-green bg-retro-green/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-retro-green" />
                  CONNECTED
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-retro-gray-light/10">
                <div>
                  <p className="font-sport text-sm text-retro-white/70 tracking-wider">
                    Account Status
                  </p>
                  <p className="font-mono text-[10px] text-retro-white/30 mt-0.5">
                    Your account is fully active
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider px-2.5 py-1 border border-emerald-400/30 text-emerald-400 bg-emerald-400/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
