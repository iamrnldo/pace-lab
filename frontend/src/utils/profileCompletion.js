// src/utils/profileCompletion.js
// ─────────────────────────────────────────────────────────────────────────────
// Aturan kelengkapan profil runner.
//
// Pengguna baru (mis. daftar lewat Google) belum punya data antropometri, sehingga
// program latihan tidak bisa dihitung dengan benar. Karena itu seluruh menu
// aplikasi dikunci sampai profil lengkap, dan pengguna diarahkan ke halaman
// Profile.
//
// Field wajib bisa diubah cukup dengan mengedit REQUIRED_PROFILE_FIELDS.
// Field komunitas sengaja OPSIONAL (tidak semua pelari punya komunitas) — kalau
// mau ikut diwajibkan, pindahkan entrinya dari OPTIONAL_PROFILE_FIELDS ke
// REQUIRED_PROFILE_FIELDS.
// ─────────────────────────────────────────────────────────────────────────────

const isFilledText = (value) => typeof value === "string" && value.trim().length >= 2;

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isAge = (value) => {
  const parsed = toNumber(value);
  return parsed !== null && Number.isInteger(parsed) && parsed > 0 && parsed < 120;
};

const isWeight = (value) => {
  const parsed = toNumber(value);
  return parsed !== null && parsed > 0 && parsed < 400;
};

const isHeight = (value) => {
  const parsed = toNumber(value);
  return parsed !== null && parsed > 0 && parsed < 300;
};

const isGender = (value) => ["male", "female", "other"].includes(String(value || "").toLowerCase());

export const REQUIRED_PROFILE_FIELDS = [
  { key: "name", label: { en: "FULL NAME", id: "NAMA LENGKAP" }, validate: isFilledText },
  { key: "age", label: { en: "AGE", id: "USIA" }, validate: isAge },
  { key: "gender", label: { en: "GENDER", id: "JENIS KELAMIN" }, validate: isGender },
  { key: "weight_kg", label: { en: "WEIGHT (KG)", id: "BERAT (KG)" }, validate: isWeight },
  { key: "height_cm", label: { en: "HEIGHT (CM)", id: "TINGGI (CM)" }, validate: isHeight },
];

export const OPTIONAL_PROFILE_FIELDS = [
  { key: "community_name", label: { en: "COMMUNITY NAME", id: "NAMA KOMUNITAS" } },
  { key: "community_origin", label: { en: "COMMUNITY ORIGIN", id: "ASAL KOMUNITAS" } },
];

export const REQUIRED_FIELD_KEYS = REQUIRED_PROFILE_FIELDS.map((field) => field.key);

export function getFieldLabel(field, language = "id") {
  return field.label?.[language] || field.label?.id || field.key;
}

// Status kelengkapan profil. Admin tidak dikunci karena memakai area terpisah.
export function getProfileCompletion(user) {
  const total = REQUIRED_PROFILE_FIELDS.length;

  if (!user) {
    return {
      hasUser: false,
      isAdmin: false,
      isComplete: false,
      isLocked: false,
      missing: REQUIRED_PROFILE_FIELDS,
      missingKeys: REQUIRED_FIELD_KEYS,
      completedCount: 0,
      total,
      percent: 0,
    };
  }

  if (user.role === "admin") {
    return {
      hasUser: true,
      isAdmin: true,
      isComplete: true,
      isLocked: false,
      missing: [],
      missingKeys: [],
      completedCount: total,
      total,
      percent: 100,
    };
  }

  const missing = REQUIRED_PROFILE_FIELDS.filter((field) => !field.validate(user[field.key]));
  const completedCount = total - missing.length;

  return {
    hasUser: true,
    isAdmin: false,
    isComplete: missing.length === 0,
    isLocked: missing.length > 0,
    missing,
    missingKeys: missing.map((field) => field.key),
    completedCount,
    total,
    percent: Math.round((completedCount / total) * 100),
  };
}

export function isProfileComplete(user) {
  return getProfileCompletion(user).isComplete;
}

// Daftar label field yang masih kosong (untuk banner & pesan toast).
export function getMissingFieldLabels(user, language = "id") {
  return getProfileCompletion(user).missing.map((field) => getFieldLabel(field, language));
}

export default getProfileCompletion;
