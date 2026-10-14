// src/pages/ProfilePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../services/api";
import toast from "react-hot-toast";
import LockIcon from "../components/ui/LockIcon";
import { getFieldLabel, getProfileCompletion } from "../utils/profileCompletion";

// Penanda kecil untuk field wajib yang masih kosong.
function RequiredBadge({ filled }) {
  const { t } = useLanguage();
  return (
    <span
      className={
        "ml-2 border px-1.5 py-[1px] font-mono text-[9px] tracking-[0.14em] " +
        (filled
          ? "border-retro-green/40 text-retro-green/60"
          : "border-retro-warn/60 text-retro-warn")
      }
    >
      {filled ? "OK" : t("profileRequiredMark")}
    </span>
  );
}

export default function ProfilePage() {
  const auth = useAuth();
  const user = auth?.user;
  const setUser = auth?.setUser;
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  const completion = useMemo(() => getProfileCompletion(user), [user]);
  const missingKeys = new Set(completion.missingKeys);

  // Bila profil belum lengkap, form langsung terbuka supaya user bisa mengisi.
  const [isEditing, setIsEditing] = useState(() => !completion.isComplete);
  const notifiedRef = useRef(false);

  // Beri tahu sekali saat diarahkan ke sini karena menu terkunci.
  useEffect(() => {
    if (location.state?.profileRequired && !notifiedRef.current) {
      notifiedRef.current = true;
      toast.error(t("profileLockedToast"), { id: "profile-locked" });
    }
  }, [location.state, t]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    age: user?.age || "",
    weight_kg: user?.weight_kg || "",
    height_cm: user?.height_cm || "",
    gender: user?.gender || "",
    community_name: user?.community_name || "",
    community_origin: user?.community_origin || "",
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put("/user/profile", data),
    onSuccess: (res) => {
      const updated = res.data?.user;
      if (updated && setUser) setUser(updated);

      const nextCompletion = getProfileCompletion(updated);
      setIsEditing(false);

      if (nextCompletion.isComplete) {
        toast.success(t("profileSavedUnlocked"), { id: "profile-saved" });
        // Kembali ke menu yang tadi mau dibuka, kalau ada.
        const target = location.state?.from?.pathname;
        navigate(target && target !== "/profile" ? target : "/dashboard", { replace: true });
      } else {
        toast.success(t("profileSaved"), { id: "profile-saved" });
      }
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
    } catch {
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

        {/* Banner: akses terkunci sampai profil lengkap */}
        {!completion.isComplete && (
          <div className="border-2 border-retro-warn/60 bg-retro-warn/10 p-5">
            <div className="flex flex-wrap items-start gap-4">
              <LockIcon className="h-8 w-8 shrink-0 text-retro-warn" />
              <div className="min-w-[220px] flex-1 space-y-2">
                <h2 className="font-retro text-2xl tracking-widest text-retro-warn">
                  {t("profileBannerTitle")}
                </h2>
                <p className="font-mono text-[11px] leading-relaxed tracking-[0.14em] text-retro-white/60">
                  {t("profileBannerDesc")}
                </p>

                {/* progress bar */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-2 w-full max-w-xs border border-retro-warn/50 bg-retro-black/40">
                    <div
                      className="h-full bg-retro-warn transition-all"
                      style={{ width: `${completion.percent}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-retro-warn">
                    {completion.completedCount}/{completion.total}
                  </span>
                </div>

                <div className="pt-1">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-retro-white/45">
                    {t("profileMissingFields")}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {completion.missing.map((field) => (
                      <li
                        key={field.key}
                        className="border border-retro-warn/50 px-2 py-[3px] font-mono text-[10px] tracking-[0.14em] text-retro-warn"
                      >
                        {getFieldLabel(field, language)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-retro bg-retro-warn px-5 py-3 font-retro text-base tracking-widest text-retro-black"
                >
                  {t("fillNow")} →
                </button>
              )}
            </div>
          </div>
        )}

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
                  <label className="mb-2 flex flex-wrap items-center gap-2 font-sport text-sm tracking-wider text-retro-white/50">
                    FULL NAME :
                    <RequiredBadge filled={!missingKeys.has("name")} />
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter Your Full Name"
                    className={`input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed${missingKeys.has("name") ? " border-retro-warn/70" : ""}`}
                  />
                </div>

                {/* Row: Age + Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 flex flex-wrap items-center gap-2 font-sport text-sm tracking-wider text-retro-white/50">
                    AGE :
                    <RequiredBadge filled={!missingKeys.has("age")} />
                  </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData((f) => ({ ...f, age: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Enter Your Age"
                      className={`input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed${missingKeys.has("age") ? " border-retro-warn/70" : ""}`}
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex flex-wrap items-center gap-2 font-sport text-sm tracking-wider text-retro-white/50">
                    GENDER
                    <RequiredBadge filled={!missingKeys.has("gender")} />
                  </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData((f) => ({ ...f, gender: e.target.value }))}
                      disabled={!isEditing}
                      className={`input-retro w-full px-4 py-3 font-sport text-sm tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed${missingKeys.has("gender") ? " border-retro-warn/70" : ""}`}
                    >
                      <option value="">Select Your Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Row: Weight + Height */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 flex flex-wrap items-center gap-2 font-sport text-sm tracking-wider text-retro-white/50">
                    WEIGHT (KG) :
                    <RequiredBadge filled={!missingKeys.has("weight_kg")} />
                  </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData((f) => ({ ...f, weight_kg: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Enter Your Weight (KG)"
                      className={`input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed${missingKeys.has("weight_kg") ? " border-retro-warn/70" : ""}`}
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex flex-wrap items-center gap-2 font-sport text-sm tracking-wider text-retro-white/50">
                    HEIGHT (CM) :
                    <RequiredBadge filled={!missingKeys.has("height_cm")} />
                  </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height_cm}
                      onChange={(e) => setFormData((f) => ({ ...f, height_cm: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Enter Your Height (CM)"
                      className={`input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed${missingKeys.has("height_cm") ? " border-retro-warn/70" : ""}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">NAMA KOMUNITAS</label><input value={formData.community_name} onChange={(e) => setFormData((f) => ({ ...f, community_name: e.target.value }))} disabled={!isEditing} placeholder="Enter Your Community" className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50" /></div>
                  <div><label className="block font-sport text-sm text-retro-white/50 tracking-wider mb-2">ASAL KOMUNITAS</label><input value={formData.community_origin} onChange={(e) => setFormData((f) => ({ ...f, community_origin: e.target.value }))} disabled={!isEditing} placeholder="Enter Your Community Address" className="input-retro w-full px-4 py-3 font-sport text-sm tracking-wider disabled:opacity-50" /></div>
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
    community_name: user?.community_name || "",
    community_origin: user?.community_origin || "",
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
