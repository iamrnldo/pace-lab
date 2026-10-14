import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_THEME_VARS_KEYS,
  applyRootVars,
  buildZoneVars,
  createDefaultTheme,
  describeTheme,
  findActivePreset,
  getContrastLevel,
  isDefaultTheme,
  loadTheme,
  mixHex,
  normalizeHex,
  saveTheme,
  setZoneColor,
  applyPresetToTheme,
  contrastRatio,
  DEFAULT_ZONE_VARS,
  THEME_PRESETS,
  THEME_ZONES,
} from "../utils/themeUtils.js";

const customColors = { bg: "#101820", accent: "#FFB000", text: "#FFF3D6" };

function createMemoryStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    _dump: () => Object.fromEntries(store),
  };
}

test("normalizeHex menerima format 3/6 digit dan menolak input tidak valid", () => {
  assert.equal(normalizeHex("#005bac"), "#005BAC");
  assert.equal(normalizeHex("005BAC"), "#005BAC");
  assert.equal(normalizeHex("  #abc  "), "#AABBCC");
  assert.equal(normalizeHex("#abcd"), null);
  assert.equal(normalizeHex("hijau"), null);
  assert.equal(normalizeHex(null), null);
});

test("tema default identik dengan palette lama (tanpa perubahan visual)", () => {
  const { header, main, footer } = createDefaultTheme();

  THEME_ZONES.forEach((zone) => {
    const vars = {
      header: buildZoneVars(header),
      main: buildZoneVars(main),
      footer: buildZoneVars(footer),
    }[zone];
    assert.deepEqual(vars, DEFAULT_ZONE_VARS);
  });

  assert.deepEqual(Object.keys(DEFAULT_ZONE_VARS), DEFAULT_THEME_VARS_KEYS);
  assert.equal(isDefaultTheme(createDefaultTheme()), true);
  assert.equal(describeTheme(createDefaultTheme()).customCount, 0);
});

test("warna custom menghasilkan variabel RGB valid & turunan yang berbeda", () => {
  const vars = buildZoneVars(customColors);

  Object.entries(vars).forEach(([name, value]) => {
    assert.match(name, /^--retro-(black|white|green|green-dark|green-light|gray|gray-mid|gray-light)$/);
    assert.match(value, /^\d{1,3} \d{1,3} \d{1,3}$/, `${name} = ${value}`);
    value
      .split(" ")
      .map(Number)
      .forEach((channel) => assert.ok(channel >= 0 && channel <= 255));
  });

  assert.equal(vars["--retro-black"], "16 24 32");
  assert.equal(vars["--retro-green"], "255 176 0");
  assert.equal(vars["--retro-white"], "255 243 214");
  assert.notEqual(vars["--retro-gray"], vars["--retro-black"]);
  assert.notEqual(vars["--retro-green-dark"], vars["--retro-green"]);
});

test("setiap zona bisa dipalet berbeda tanpa saling menimpa", () => {
  const theme = {
    header: { bg: "#03170D", accent: "#39FF88", text: "#EAFFF3" },
    main: customColors,
    footer: createDefaultTheme().footer,
  };

  const headerVars = buildZoneVars(theme.header);
  const mainVars = buildZoneVars(theme.main);
  const footerVars = buildZoneVars(theme.footer);

  assert.notDeepEqual(headerVars, mainVars);
  assert.deepEqual(footerVars, DEFAULT_ZONE_VARS);
  assert.equal(describeTheme(theme).customCount, 2);
  assert.deepEqual(describeTheme(theme).customZones, ["header", "main"]);
});

test("sanitize/save/load: tema persist dan input rusak tidak merusak aplikasi", () => {
  const storage = createMemoryStorage();
  const theme = {
    header: customColors,
    main: customColors,
    footer: customColors,
  };

  saveTheme(theme, storage);
  assert.deepEqual(loadTheme(storage), theme);

  // localStorage berisi JSON rusak -> kembali ke default
  const broken = createMemoryStorage({ pacelab_theme: "{bukan json" });
  assert.deepEqual(loadTheme(broken), createDefaultTheme());

  // localStorage kosong -> default
  assert.deepEqual(loadTheme(createMemoryStorage()), createDefaultTheme());

  // value tidak valid diisi default per-key (partial theme tetap diterima)
  const partial = createMemoryStorage({
    pacelab_theme: JSON.stringify({ header: { accent: "not-a-color" } }),
  });
  const restored = loadTheme(partial);
  assert.equal(restored.header.accent, "#DFF5FF");
  assert.equal(restored.header.bg, "#005BAC");
});

test("setZoneColor menolak hex invalid dan menormalisasi yang valid", () => {
  const base = createDefaultTheme();

  const rejected = setZoneColor(base, "header", "accent", "biru");
  assert.equal(rejected.header.accent, "#DFF5FF");

  const accepted = setZoneColor(base, "header", "accent", "#ffb000");
  assert.equal(accepted.header.accent, "#FFB000");
  // tidak mengubah zona lain
  assert.deepEqual(accepted.footer, base.footer);

  const wrongZone = setZoneColor(base, "sidebar", "accent", "#FFB000");
  assert.deepEqual(wrongZone, base);
});

test("preset: semua preset valid, bisa diterapkan ke 3 zona, dan terdeteksi aktif", () => {
  THEME_PRESETS.forEach((preset) => {
    ["bg", "accent", "text"].forEach((key) => {
      assert.ok(normalizeHex(preset.colors[key]), `${preset.id}.${key}`);
    });
  });

  const applied = applyPresetToTheme("amber", createDefaultTheme());
  THEME_ZONES.forEach((zone) => {
    assert.equal(applied[zone].bg, "#160F03");
    assert.equal(applied[zone].accent, "#FFB000");
  });
  assert.equal(findActivePreset(applied), "amber");
  assert.equal(findActivePreset(createDefaultTheme()), "pocari");

  // preset tidak dikenal -> tema tidak berubah
  assert.deepEqual(
    applyPresetToTheme("tidak-ada", createDefaultTheme()),
    createDefaultTheme(),
  );
});

test("applyRootVars menulis variabel zona MAIN ke root element", () => {
  const written = new Map();
  const fakeRoot = { style: { setProperty: (name, value) => written.set(name, value) } };

  const theme = createDefaultTheme();
  theme.main = { bg: "#0B0F14", accent: "#00E5A0", text: "#F1F7F8" };

  const vars = applyRootVars(theme, fakeRoot);
  assert.equal(written.get("--retro-black"), "11 15 20");
  assert.equal(written.get("--retro-green"), "0 229 160");
  assert.deepEqual(Object.fromEntries(written), vars);

  // zona HEADER custom tidak boleh merembes ke root (root hanya ikut MAIN)
  theme.header = { bg: "#2A0710", accent: "#FF4D6D", text: "#FFE6EC" };
  applyRootVars(theme, fakeRoot);
  assert.equal(written.get("--retro-black"), "11 15 20");

  // tanpa root element (mis. SSR) tidak boleh crash
  assert.equal(applyRootVars(theme, null), null);
});

test("kontras teks vs background memakai ambang WCAG", () => {
  assert.equal(getContrastLevel("#FFFFFF", "#005BAC"), "good");
  assert.equal(getContrastLevel("#000000", "#000000"), "low");
  assert.equal(getContrastLevel("#FFE9B8", "#160F03"), "good");
  assert.ok(contrastRatio("#FFFFFF", "#005BAC") > contrastRatio("#5CAEE2", "#005BAC"));

  // mixHex tetap menghasilkan hex valid walau rasio di luar 0..1
  assert.equal(mixHex("#000000", "#FFFFFF", -1), "#000000");
  assert.equal(mixHex("#000000", "#FFFFFF", 4), "#FFFFFF");
});
