// src/pages/ProfilePage.jsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const auth = useAuth();
  const user = auth?.user;
  const setUser = auth?.setUser;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    age: user?.age || "",
    weight_kg: user?.weight_kg || "",
    height_cm: user?.height_cm || "",
    gender: user?.gender || "",
    max_heart_rate: user?.max_heart_rate || "",
    resting_hr: user?.resting_hr || "",
    unit_preference: user?.unit_preference || "metric",
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put("/user/profile", data),
    onSuccess: (res) => {
      const updated = res.data?.user;
      if (updated && setUser) setUser(updated);
      toast.success("Profile updated!");
      setIsEditing(false);
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  // Avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("avatar", file);

      const { data } = await api.post("/user/avatar", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.user && setUser) {
        setUser(data.user);
      }
      setAvatarPreview(null);
      toast.success("Avatar updated!");
    } catch (err) {
      toast.error("Failed to upload avatar");
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const displayAvatar = avatarPreview || (user?.avatar_url
    ? (user.avatar_url.startsWith("http")
        ? user.avatar_url
        : `${import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:5000"}${user.avatar_url}`)
    : null);

  return (
    <div className="min-h-screen pt-[120px] pb-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Title */}
        <div>
          <h1 className="font-retro text-3xl md:text-4xl text-retro-white tracking-wider">
            PROFILE
          </h1>
          <p className="font-mono text-xs text-retro-white/30 tracking-widest mt-1">
            YOUR RUNNER PROFILE & SETTINGS
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="card-retro p-6 flex flex-col items-center text-center">
            {/* Avatar — clickable */}
            <div className="relative group mb-4">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={user.name}
                  className="w-24 h-24 border-3 border-retro-green object-cover"
                />
              ) : (
                <div className="w-24 h-24 border-3 border-retro-green flex items-center justify-center bg-retro-gray">
                  <span className="font-retro text-4xl text-retro-green">
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              )}

              {/* Upload overlay */}
              <label
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <svg className="w-6 h-6 text-retro-green animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-retro-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            <h2 className="font-retro text-2xl text-retro-white tracking-wider">
              {user?.name || "USER"}
            </h2>
            <p className="font-mono text-xs text-retro-green/60 tracking-wider mt-1">
              {user?.email}
            </p>

            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 border border-retro-green/30 bg-retro-green/5">
              <svg className="w-4 h-4 text-retro-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-mono text-[11px] text-retro-green tracking-widest uppercase">
                {user?.role || "user"}
              </span>
            </div>

            {/* Quick stats */}
            <div className="w-full mt-6 pt-4 border-t border-retro-green/20 space-y-3">
              {user?.age && (
                <div className="flex items-center justify-between">
                  <span className="font-sport text-sm text-retro-white/40">Age</span>
                  <span className="font-mono text-xs text-retro-green">{user.age} yrs</span>
                </div>
              )}
              {user?.weight_kg && (
                <div className="flex items-center justify-between">
                  <span className="font-sport text-sm text-retro-white/40">Weight</span>
                  <span className="font-mono text-xs text-retro-green">{user.weight_kg} kg</span>
                </div>
              )}
              {user?.height_cm && (
                <div className="flex items-center justify-between">
                  <span className="font-sport text-sm text-retro-white/40">Height</span>
                  <span className="font-mono text-xs text-retro-green">{user.height_cm} cm</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-sport text-sm text-retro-white/40">Member Since</span>
                <span className="font-mono text-xs text-retro-white/50">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
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
                    RUNNER PROFILE
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
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    disabled={!isEditing}
                    className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Row: Age + Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                      AGE
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData((f) => ({ ...f, age: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="25"
                      className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                      GENDER
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData((f) => ({ ...f, gender: e.target.value }))}
                      disabled={!isEditing}
                      className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Row: Weight + Height */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                      WEIGHT (KG)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData((f) => ({ ...f, weight_kg: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="70.5"
                      className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                      HEIGHT (CM)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height_cm}
                      onChange={(e) => setFormData((f) => ({ ...f, height_cm: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="175"
                      className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Row: Max HR + Resting HR */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                      MAX HEART RATE
                    </label>
                    <input
                      type="number"
                      value={formData.max_heart_rate}
                      onChange={(e) => setFormData((f) => ({ ...f, max_heart_rate: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="190"
                      className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                      RESTING HR
                    </label>
                    <input
                      type="number"
                      value={formData.resting_hr}
                      onChange={(e) => setFormData((f) => ({ ...f, resting_hr: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="60"
                      className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Unit Preference */}
                <div>
                  <label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">
                    UNIT PREFERENCE
                  </label>
                  <select
                    value={formData.unit_preference}
                    onChange={(e) => setFormData((f) => ({ ...f, unit_preference: e.target.value }))}
                    disabled={!isEditing}
                    className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="metric">Metric (km, kg)</option>
                    <option value="imperial">Imperial (mi, lbs)</option>
                  </select>
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
                          age: user?.age || "",
                          weight_kg: user?.weight_kg || "",
                          height_cm: user?.height_cm || "",
                          gender: user?.gender || "",
                          max_heart_rate: user?.max_heart_rate || "",
                          resting_hr: user?.resting_hr || "",
                          unit_preference: user?.unit_preference || "metric",
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
          </div>
        </div>
      </div>
    </div>
  );
}
