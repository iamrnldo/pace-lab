// Test: penguncian menu sampai profil pelari lengkap.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  REQUIRED_FIELD_KEYS,
  REQUIRED_PROFILE_FIELDS,
  getFieldLabel,
  getMissingFieldLabels,
  getProfileCompletion,
  isProfileComplete,
} from "../utils/profileCompletion.js";

const read = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");
const compact = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");

// Pengguna hasil login Google: hanya email + nama dari akun Google.
const NEW_USER = {
  id: "u-1",
  email: "runner@example.com",
  name: "Runner Baru",
  role: "user",
  age: null,
  weight_kg: null,
  height_cm: null,
  gender: null,
};

const COMPLETE_USER = {
  ...NEW_USER,
  age: 28,
  weight_kg: 62.5,
  height_cm: 170,
  gender: "male",
};

const ADMIN_USER = { id: "a-1", email: "admin@example.com", name: "Admin", role: "admin" };

test("pengguna baru tanpa data antropometri terkunci (4 dari 5 field kosong)", () => {
  const completion = getProfileCompletion(NEW_USER);

  assert.equal(completion.isComplete, false);
  assert.equal(completion.isLocked, true);
  assert.equal(completion.total, 5);
  assert.equal(completion.completedCount, 1);
  assert.equal(completion.percent, 20);
  assert.deepEqual(completion.missingKeys, ["age", "gender", "weight_kg", "height_cm"]);
  assert.equal(isProfileComplete(NEW_USER), false);
});

test("profil lengkap membuka akses", () => {
  const completion = getProfileCompletion(COMPLETE_USER);

  assert.equal(completion.isComplete, true);
  assert.equal(completion.isLocked, false);
  assert.equal(completion.percent, 100);
  assert.deepEqual(completion.missing, []);
  assert.equal(isProfileComplete(COMPLETE_USER), true);
});

test("profil sebagian terkunci dan menyebut field yang kurang", () => {
  const partial = { ...NEW_USER, age: 30, gender: "female" };
  const completion = getProfileCompletion(partial);

  assert.equal(completion.isLocked, true);
  assert.deepEqual(completion.missingKeys, ["weight_kg", "height_cm"]);
  assert.equal(completion.completedCount, 3);

  assert.deepEqual(getMissingFieldLabels(partial, "id"), ["BERAT (KG)", "TINGGI (CM)"]);
  assert.deepEqual(getMissingFieldLabels(partial, "en"), ["WEIGHT (KG)", "HEIGHT (CM)"]);
});

test("nilai di luar batas wajar tetap dianggap belum lengkap", () => {
  const reject = [
    { age: 0 },
    { age: 200 },
    { age: "abc" },
    { age: 28.5 },
    { weight_kg: 0 },
    { weight_kg: -5 },
    { weight_kg: 900 },
    { height_cm: 0 },
    { height_cm: 500 },
    { gender: "other-gender" },
    { name: "  " },
  ];

  reject.forEach((patch) => {
    const completion = getProfileCompletion({ ...COMPLETE_USER, ...patch });
    assert.equal(
      completion.isComplete,
      false,
      `${JSON.stringify(patch)} seharusnya belum lengkap`,
    );
  });
});

test("nilai angka dalam bentuk string (hasil input form) diterima", () => {
  const fromForm = {
    ...COMPLETE_USER,
    age: "28",
    weight_kg: "62.5",
    height_cm: "170",
    name: "  Runner Baru  ",
  };
  const completion = getProfileCompletion(fromForm);

  assert.equal(completion.isComplete, true);
  assert.deepEqual(completion.missingKeys, []);
});

test("gender 'other' tetap diterima, admin tidak dikunci", () => {
  assert.equal(getProfileCompletion({ ...COMPLETE_USER, gender: "other" }).isComplete, true);

  const admin = getProfileCompletion(ADMIN_USER);
  assert.equal(admin.isAdmin, true);
  assert.equal(admin.isComplete, true);
  assert.equal(admin.isLocked, false);
});

test("tanpa user (belum login) tidak dianggap terkunci oleh util ini", () => {
  const completion = getProfileCompletion(null);
  assert.equal(completion.hasUser, false);
  assert.equal(completion.isLocked, false);
  assert.equal(completion.isComplete, false);
  assert.equal(getMissingFieldLabels(null).length, REQUIRED_PROFILE_FIELDS.length);
});

test("setiap field wajib punya label dua bahasa dan validasi", () => {
  assert.deepEqual(REQUIRED_FIELD_KEYS, ["name", "age", "gender", "weight_kg", "height_cm"]);
  REQUIRED_PROFILE_FIELDS.forEach((field) => {
    assert.ok(field.label?.id && field.label?.en, `${field.key} butuh label id & en`);
    assert.equal(typeof field.validate, "function", `${field.key} butuh validate()`);
    assert.ok(getFieldLabel(field, "id").length > 0);
    assert.ok(getFieldLabel(field, "en").length > 0);
  });
});

test("ProfileGuard mengarahkan ke /profile, bukan ke halaman lain", () => {
  const guard = read("../components/auth/ProfileGuard.jsx");

  assert.ok(guard.includes('to="/profile"'), "harus redirect ke /profile");
  assert.ok(guard.includes("profileRequired: true"), "harus membawa penanda profileRequired");
  assert.ok(guard.includes("from: location"), "harus menyimpan tujuan semula");
  assert.ok(guard.includes("isProfileComplete"), "memakai status kelengkapan dari AuthContext");
  assert.ok(guard.includes("replace"), "redirect memakai replace agar tidak menumpuk history");
});

test("semua menu terproteksi memakai ProfileGuard, halaman profile dikecualikan", () => {
  const app = compact(read("../App.jsx"));

  assert.ok(app.includes("import ProfileGuard from"), "ProfileGuard harus diimpor");

  const protectedRoutes = [
    "calculator",
    "dashboard",
    "create-training-program",
    "my-training-programs",
  ];
  protectedRoutes.forEach((route) => {
    const start = app.indexOf(`path="${route}"`);
    assert.ok(start > -1, `rute ${route} harus ada`);
    const block = app.slice(start, start + 200);
    assert.ok(
      block.includes("<Protected>"),
      `rute ${route} harus dibungkus <Protected> (ProfileGuard aktif)`,
    );
  });

  const profileRouteStart = app.indexOf('path="profile"');
  const profileBlock = app.slice(profileRouteStart, profileRouteStart + 220);
  assert.ok(
    profileBlock.includes("<Protected requireProfile={false}>"),
    "rute profile harus tetap bisa diakses walau profil belum lengkap",
  );
  assert.ok(
    app.includes("requireProfile ? <ProfileGuard>"),
    "komponen Protected harus memakai ProfileGuard secara default",
  );
});

test("Header mengunci menu: ikon gembok, chip status, dan arah ke /profile", () => {
  const header = compact(read("../components/layout/Header.jsx"));

  assert.ok(header.includes("LockIcon"), "Header memakai ikon gembok");
  assert.ok(header.includes("isProfileLocked"), "Header membaca status kunci dari AuthContext");
  assert.ok(header.includes('navigate("/profile"'), "klik menu terkunci mengarah ke /profile");
  assert.ok(header.includes("profileLockedToast"), "ada pesan toast saat menu terkunci");
  assert.ok(header.includes("profileIncompleteChip"), "ada chip status di strip atas");
  assert.ok(header.includes("completeProfileNow"), "tombol CTA mobile berubah jadi 'lengkapi profil'");
  // jumlah menu terkunci mengikuti jumlah field yang kosong
  assert.ok(header.includes("missing?.length"), "chip menampilkan jumlah field yang belum lengkap");
});

test("ProfilePage menampilkan banner kunci, penanda field wajib, dan membuka akses setelah lengkap", () => {
  const page = compact(read("../pages/ProfilePage.jsx"));

  assert.ok(page.includes("profileBannerTitle"), "banner 'akses terkunci' ada");
  assert.ok(page.includes("profileBannerDesc"), "penjelasan menu yang terkunci ada");
  assert.ok(page.includes("profileMissingFields"), "daftar field yang kurang ada");
  assert.ok(page.includes("getProfileCompletion"), "memakai util kelengkapan profil");
  assert.ok(page.includes("RequiredBadge"), "setiap field wajib punya penanda");
  assert.ok(page.includes("profileSavedUnlocked"), "toast khusus saat profil jadi lengkap");
  assert.ok(page.includes("navigate(target"), "user dikembalikan ke menu tujuan semula");
  assert.ok(
    page.includes("useState(() => !completion.isComplete)"),
    "form otomatis terbuka saat profil belum lengkap",
  );
});

test("LoginPage mengarahkan pengguna baru ke /profile, bukan dashboard", () => {
  const login = compact(read("../pages/LoginPage.jsx"));

  assert.ok(login.includes("isProfileComplete"), "halaman login memeriksa kelengkapan profil");
  assert.ok(
    /isProfileComplete[\s\S]{0,160}navigate\("\/profile"/.test(login) ||
      /navigate\("\/profile"[\s\S]{0,160}isProfileComplete/.test(login),
    "pengguna dengan profil belum lengkap diarahkan ke /profile",
  );
});

test("UI kunci profil memakai token tema (bukan warna amber tetap)", () => {
  const files = [
    "../components/layout/Header.jsx",
    "../pages/ProfilePage.jsx",
    "../components/layout/ThemeSettingsModal.jsx",
  ];

  files.forEach((file) => {
    const source = read(file);
    assert.equal(
      /amber-\d/.test(source),
      false,
      `${file} tidak boleh memakai kelas amber-* hardcode (tidak terbaca di tema terang)`,
    );
  });

  // token tema untuk peringatan harus dipakai di kedua tempat utama
  assert.ok(read("../components/layout/Header.jsx").includes("retro-warn"));
  assert.ok(read("../pages/ProfilePage.jsx").includes("retro-warn"));

  // variabel warn tersedia di Tailwind & CSS default
  assert.ok(read("../../tailwind.config.js").includes("--retro-warn"));
  assert.ok(read("../index.css").includes("--retro-warn"));
});

test("AuthContext menyediakan isProfileLocked & profileCompletion", () => {
  const context = compact(read("../context/AuthContext.jsx"));

  assert.ok(context.includes("getProfileCompletion"), "AuthContext memakai util kelengkapan");
  assert.ok(context.includes("profileCompletion"), "mengekspor objek profileCompletion");
  assert.ok(context.includes("isProfileComplete:"), "mengekspor isProfileComplete");
  assert.ok(context.includes("isProfileLocked:"), "mengekspor isProfileLocked");
});
