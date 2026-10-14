// src/utils/themeUtils.js
// ─────────────────────────────────────────────────────────────────────────────
// PACELAB PRO — Template color engine.
//
// Semua warna template dipetakan ke CSS variables (--retro-*) supaya utility
// Tailwind (`bg-retro-black`, `text-retro-green`, dst) bisa berubah runtime.
// Ada 3 zona yang bisa diatur terpisah: HEADER, MAIN (isi halaman), FOOTER.
// ─────────────────────────────────────────────────────────────────────────────

export const THEME_STORAGE_KEY = "pacelab_theme";

export const THEME_ZONES = ["header", "main", "footer"];

export const ZONE_LABEL_KEYS = {
  header: "zoneHeader",
  main: "zoneMain",
  footer: "zoneFooter",
};

// Warna sumber per zona. Default = palette biru/putih PaceLab.
export const DEFAULT_ZONE_COLORS = {
  bg: "#005BAC", // -> --retro-black
  accent: "#DFF5FF", // -> --retro-green
  text: "#FFFFFF", // -> --retro-white
};

// Nilai CSS variable default (dipertahankan identik dengan desain lama supaya
// tema default 100% sama dengan sebelum fitur ini ada).
export const DEFAULT_ZONE_VARS = {
  "--retro-black": "0 91 172",
  "--retro-white": "255 255 255",
  "--retro-green": "223 245 255",
  "--retro-green-dark": "191 234 255",
  "--retro-green-light": "0 174 239",
  "--retro-gray": "12 111 186",
  "--retro-gray-mid": "22 127 207",
  "--retro-gray-light": "92 174 226",
  "--retro-warn": "255 205 83",
};

export const THEME_COLOR_KEYS = ["bg", "accent", "text"];

export const DEFAULT_THEME_VARS_KEYS = Object.keys(DEFAULT_ZONE_VARS);

export const COLOR_LABEL_KEYS = {
  bg: "colorBackground",
  accent: "colorAccent",
  text: "colorText",
};

export function createDefaultZoneColors() {
  return { ...DEFAULT_ZONE_COLORS };
}

export function createDefaultTheme() {
  return {
    header: createDefaultZoneColors(),
    main: createDefaultZoneColors(),
    footer: createDefaultZoneColors(),
  };
}

// ── Shading otomatis untuk tema terang ──────────────────────────────────────
// Beberapa palette (mis. cream/beige) hanya berisi warna terang, sehingga tidak
// ada pasangan yang cukup kontras untuk teks. Helper ini menggelapkan warna
// (tetap dalam keluarga hue yang sama) sampai target kontras WCAG tercapai.
export const SHADE_TARGET = "#120F0D";

export function shadeToContrast(hex, againstHex, targetRatio = 4.5, options = {}) {
  const source = normalizeHex(hex);
  const against = normalizeHex(againstHex);
  if (!source || !against) return source || normalizeHex(hex) || hex;
  if (contrastRatio(source, against) >= targetRatio) return source;

  const toward = normalizeHex(options.toward) || SHADE_TARGET;
  const steps = 200;
  for (let step = 1; step <= steps; step += 1) {
    const candidate = mixHex(source, toward, step / steps);
    if (candidate && contrastRatio(candidate, against) >= targetRatio) {
      return candidate;
    }
  }
  return mixHex(source, toward, 1) || source;
}

// ── Preset palet siap pakai (diterapkan ke 3 zona sekaligus) ─────────────────
export const THEME_PRESETS = [
  // Catatan: id "pocari" dipertahankan (internal) agar tidak ada referensi yang
  // putus; yang tampil ke pengguna adalah label di bawah.
  {
    id: "pocari",
    label: "DEFAULT COLOR",
    hint: {
      en: "PaceLab default palette",
      id: "Palette default PaceLab",
    },
    colors: { bg: "#005BAC", accent: "#DFF5FF", text: "#FFFFFF" },
  },
  {
    id: "carbon",
    label: "CARBON",
    colors: { bg: "#0B0F14", accent: "#00E5A0", text: "#F1F7F8" },
  },
  {
    id: "sunset",
    label: "SUNSET",
    colors: { bg: "#2B1055", accent: "#FF8A3D", text: "#FFF1E0" },
  },
  {
    id: "mono",
    label: "MONOCHROME",
    colors: { bg: "#101010", accent: "#E8E8E8", text: "#FFFFFF" },
  },
  // Versi reverse dari MONOCHROME: setiap channel dibalik (255 - x), sehingga
  // #101010 -> #EFEFEF (latar), #E8E8E8 -> #171717 (aksen), #FFFFFF -> #000000 (teks).
  {
    id: "mono-v2",
    label: "MONOCHROME V2",
    isNew: true,
    hint: {
      en: "Monochrome reversed — light theme",
      id: "Kebalikan monochrome — tema terang",
    },
    swatches: ["#FFFFFF", "#EFEFEF", "#E8E8E8", "#171717", "#101010"],
    colors: { bg: "#EFEFEF", accent: "#171717", text: "#000000" },
  },
  // Palette cream & beige (semua warna terang), jadi dijalankan sebagai TEMA
  // TERANG: latar memakai cream asli, sedangkan aksen dan teks diturunkan
  // (shade) dari warna palette yang sama sampai kontras WCAG tercapai.
  {
    id: "warm-sand",
    label: "WARM SAND",
    hint: {
      en: "Warm cream & beige — light theme",
      id: "Cream & beige hangat — tema terang",
    },
    swatches: ["#EDEDE9", "#D6CCC2", "#F5EBE0", "#E3D5CA", "#D5BDAF"],
    colors: {
      bg: "#F5EBE0",
      accent: shadeToContrast("#D5BDAF", "#F5EBE0", 4.5),
      text: shadeToContrast("#D6CCC2", "#F5EBE0", 10),
    },
  },
];

// ── Konversi warna ───────────────────────────────────────────────────────────
// Terima "#abc", "abc", "#AABBCC", dengan/tanpa spasi -> "#AABBCC"
export function normalizeHex(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    const [r, g, b] = raw.split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  return null;
}

export function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const toHex = (channel) =>
    Math.max(0, Math.min(255, Math.round(channel)))
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// "0 91 172" — format yang dipakai Tailwind: rgb(var(--retro-black) / <alpha>)
export function hexToTriplet(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
}

export function mixHex(hexA, hexB, ratio) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const t = Math.max(0, Math.min(1, Number(ratio) || 0));
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

export function isSameColor(hexA, hexB) {
  const a = normalizeHex(hexA);
  const b = normalizeHex(hexB);
  return Boolean(a) && a === b;
}

// Mengunci warna agar selalu kontras terhadap latar. Warna bisa perlu
// DIGELAPKAN (latar terang) atau DITERANGKAN (latar sedang/gelap), jadi kedua
// arah dicoba dan dipilih perubahan yang paling dekat dengan warna aslinya.
export const LIGHTEN_TARGET = "#FFFFFF";

export function ensureContrast(hex, againstHex, targetRatio = 4.5) {
  const source = normalizeHex(hex);
  const against = normalizeHex(againstHex);
  if (!source || !against) return source || null;
  if (contrastRatio(source, against) >= targetRatio) return source;

  const steps = 200;
  let darkened = null;
  let lightened = null;

  for (let step = 1; step <= steps; step += 1) {
    if (!darkened) {
      const candidate = mixHex(source, SHADE_TARGET, step / steps);
      if (candidate && contrastRatio(candidate, against) >= targetRatio) darkened = candidate;
    }
    if (!lightened) {
      const candidate = mixHex(source, LIGHTEN_TARGET, step / steps);
      if (candidate && contrastRatio(candidate, against) >= targetRatio) lightened = candidate;
    }
    if (darkened && lightened) break;
  }

  if (darkened && lightened) {
    const darkDistance = Math.abs(relativeLuminance(darkened) - relativeLuminance(source));
    const lightDistance = Math.abs(relativeLuminance(lightened) - relativeLuminance(source));
    return darkDistance <= lightDistance ? darkened : lightened;
  }
  return darkened || lightened || mixHex(source, LIGHTEN_TARGET, 1) || source;
}

// Warna peringatan (kunci profil). Dipakai lewat CSS variable `--retro-warn`
// supaya otomatis menyesuaikan tema terang maupun gelap.
export const WARN_COLOR = "#FBBF24";

// ── Kontras (WCAG) ───────────────────────────────────────────────────────────
export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  );
}

export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

// "good" >= 4.5 : "fair" >= 3 : "low"
export function getContrastLevel(hexA, hexB) {
  const ratio = contrastRatio(hexA, hexB);
  if (ratio >= 4.5) return "good";
  if (ratio >= 3) return "fair";
  return "low";
}

// ── Variabel CSS per zona ────────────────────────────────────────────────────
export function buildZoneVars(zoneColors) {
  const bg = normalizeHex(zoneColors?.bg) || DEFAULT_ZONE_COLORS.bg;
  const accent = normalizeHex(zoneColors?.accent) || DEFAULT_ZONE_COLORS.accent;
  const text = normalizeHex(zoneColors?.text) || DEFAULT_ZONE_COLORS.text;

  const isDefault =
    isSameColor(bg, DEFAULT_ZONE_COLORS.bg) &&
    isSameColor(accent, DEFAULT_ZONE_COLORS.accent) &&
    isSameColor(text, DEFAULT_ZONE_COLORS.text);

  if (isDefault) return { ...DEFAULT_ZONE_VARS };

  // Pada tema terang (latar lebih terang dari teks), state hover accent harus
  // jadi lebih GELAP supaya teks di atas tombol accent tetap terbaca.
  const isLightTheme =
    relativeLuminance(bg) > relativeLuminance(text);
  const accentShadeTarget = isLightTheme ? text : bg;
  const accentDarkMix = isLightTheme ? 0.18 : 0.28;
  const accentLightMix = isLightTheme ? 0.38 : 0.55;

  return {
    // warna dasar
    "--retro-black": hexToTriplet(bg),
    "--retro-white": hexToTriplet(text),
    "--retro-green": hexToTriplet(accent),
    // turunan accent: dipakai untuk hover button & badge
    "--retro-green-dark": hexToTriplet(mixHex(accent, accentShadeTarget, accentDarkMix)),
    "--retro-green-light": hexToTriplet(mixHex(accent, accentShadeTarget, accentLightMix)),
    // turunan surface/border: campuran background ke arah warna teks
    // warna peringatan (kunci profil) yang tetap terbaca di tema terang/gelap
    "--retro-warn": hexToTriplet(ensureContrast(WARN_COLOR, bg, 4.5)),
    "--retro-gray": hexToTriplet(mixHex(bg, text, 0.14)),
    "--retro-gray-mid": hexToTriplet(mixHex(bg, text, 0.26)),
    "--retro-gray-light": hexToTriplet(mixHex(bg, text, 0.45)),
  };
}

// Objek style React untuk sebuah zona (dipakai sebagai inline style).
export function buildZoneStyle(zoneColors) {
  return buildZoneVars(zoneColors);
}

// Tulis variabel MAIN ke <html> supaya body, scrollbar, portal, dan toast ikut.
export function applyRootVars(theme, rootElement) {
  const root =
    rootElement ||
    (typeof document !== "undefined" ? document.documentElement : null);
  if (!root) return null;
  const vars = buildZoneVars(theme?.main || DEFAULT_ZONE_COLORS);
  Object.entries(vars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
  return vars;
}

// ── Validasi & persistensi ───────────────────────────────────────────────────
export function sanitizeTheme(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const theme = {};
  THEME_ZONES.forEach((zone) => {
    const zoneSource =
      source[zone] && typeof source[zone] === "object" ? source[zone] : {};
    theme[zone] = {
      bg: normalizeHex(zoneSource.bg) || DEFAULT_ZONE_COLORS.bg,
      accent: normalizeHex(zoneSource.accent) || DEFAULT_ZONE_COLORS.accent,
      text: normalizeHex(zoneSource.text) || DEFAULT_ZONE_COLORS.text,
    };
  });
  return theme;
}

function resolveStorage(storage) {
  if (storage) return storage;
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadTheme(storage) {
  const store = resolveStorage(storage);
  if (!store) return createDefaultTheme();
  try {
    const raw = store.getItem(THEME_STORAGE_KEY);
    if (!raw) return createDefaultTheme();
    return sanitizeTheme(JSON.parse(raw));
  } catch {
    return createDefaultTheme();
  }
}

export function saveTheme(theme, storage) {
  const store = resolveStorage(storage);
  const safeTheme = sanitizeTheme(theme);
  if (!store) return safeTheme;
  try {
    store.setItem(THEME_STORAGE_KEY, JSON.stringify(safeTheme));
  } catch {
    /* localStorage penuh / diblokir — tema tetap jalan untuk sesi ini */
  }
  return safeTheme;
}

export function isDefaultZone(zoneColors) {
  return (
    isSameColor(zoneColors?.bg, DEFAULT_ZONE_COLORS.bg) &&
    isSameColor(zoneColors?.accent, DEFAULT_ZONE_COLORS.accent) &&
    isSameColor(zoneColors?.text, DEFAULT_ZONE_COLORS.text)
  );
}

export function isDefaultTheme(theme) {
  const safeTheme = sanitizeTheme(theme);
  return THEME_ZONES.every((zone) => isDefaultZone(safeTheme[zone]));
}

export function findActivePreset(theme) {
  const safeTheme = sanitizeTheme(theme);
  const match = THEME_PRESETS.find((preset) =>
    THEME_ZONES.every(
      (zone) =>
        isSameColor(safeTheme[zone].bg, preset.colors.bg) &&
        isSameColor(safeTheme[zone].accent, preset.colors.accent) &&
        isSameColor(safeTheme[zone].text, preset.colors.text),
    ),
  );
  return match ? match.id : null;
}

export function applyPresetToTheme(presetId, theme) {
  const preset = THEME_PRESETS.find((item) => item.id === presetId);
  const base = sanitizeTheme(theme);
  if (!preset) return base;
  const next = { ...base };
  THEME_ZONES.forEach((zone) => {
    next[zone] = { ...preset.colors };
  });
  return next;
}

export function setZoneColor(theme, zone, key, value) {
  const next = sanitizeTheme(theme);
  if (!THEME_ZONES.includes(zone) || !THEME_COLOR_KEYS.includes(key)) return next;
  const hex = normalizeHex(value);
  if (!hex) return next;
  next[zone] = { ...next[zone], [key]: hex };
  return next;
}

// Ringkasan untuk badge di UI (misal "3 ZONA CUSTOM").
// ── Fallback aman ────────────────────────────────────────────────────────────
// Dipakai kalau ada komponen yang memanggil useTheme() tanpa ThemeProvider
// (mis. karena file provider belum ikut ter-deploy). Aplikasi tetap memakai
// palette default alih-alih blank screen, dan pengguna diberi tahu di console.
export function createFallbackThemeValue() {
  const theme = createDefaultTheme();
  const noop = () => {};
  return {
    theme,
    zoneVars: {
      header: buildZoneVars(theme.header),
      main: buildZoneVars(theme.main),
      footer: buildZoneVars(theme.footer),
    },
    setTheme: noop,
    setZoneColor: noop,
    resetZone: noop,
    resetTheme: noop,
    applyPreset: noop,
    isFallback: true,
    ...describeTheme(theme),
  };
}

export function describeTheme(theme) {
  const safeTheme = sanitizeTheme(theme);
  const customZones = THEME_ZONES.filter(
    (zone) => !isDefaultZone(safeTheme[zone]),
  );
  return {
    customCount: customZones.length,
    customZones,
    isDefault: customZones.length === 0,
    presetId: findActivePreset(safeTheme),
  };
}
