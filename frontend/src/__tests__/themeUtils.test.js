import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_THEME_VARS_KEYS,
  DEFAULT_ZONE_COLORS,
  applyRootVars,
  shadeToContrast,
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
  relativeLuminance,
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
    // label harus ramah dibaca & id unik
    assert.match(preset.label, /^[A-Z0-9 &/+-]+$/, `${preset.id} label = ${preset.label}`);
    if (preset.swatches) {
      assert.ok(preset.swatches.length >= 3, `${preset.id} punya minimal 3 swatch`);
      preset.swatches.forEach((color) =>
        assert.ok(normalizeHex(color), `${preset.id} swatch ${color}`),
      );
    }
  });

  const ids = THEME_PRESETS.map((preset) => preset.id);
  assert.equal(new Set(ids).size, ids.length, "id preset harus unik");

  // daftar preset final — regresi "preset hilang/tertambah" harus ketahuan di sini
  assert.equal(
    THEME_PRESETS.length,
    6,
    `jumlah preset = ${THEME_PRESETS.length} (seharusnya 6)`,
  );
  ["pocari", "carbon", "sunset", "mono", "mono-v2", "warm-sand"].forEach((id) =>
    assert.ok(ids.includes(id), `preset ${id} harus terdaftar`),
  );
  [
    "amber",
    "retro-green",
    "crimson",
  ].forEach((id) => assert.ok(!ids.includes(id), `preset ${id} sudah dihapus`));
  assert.deepEqual(
    THEME_PRESETS.map((preset) => preset.label),
    [
      "DEFAULT COLOR",
      "CARBON",
      "SUNSET",
      "MONOCHROME",
      "MONOCHROME V2",
      "WARM SAND",
    ],
    "urutan & nama preset",
  );
  assert.equal(
    THEME_PRESETS.find((preset) => preset.id === "mono-v2").isNew,
    true,
    "MONOCHROME V2 ditandai sebagai preset baru",
  );
  assert.equal(
    THEME_PRESETS.find((preset) => preset.id === "warm-sand").isNew,
    undefined,
    "badge NEW pindah ke preset terbaru",
  );

  const applied = applyPresetToTheme("sunset", createDefaultTheme());
  THEME_ZONES.forEach((zone) => {
    assert.equal(applied[zone].bg, "#2B1055");
    assert.equal(applied[zone].accent, "#FF8A3D");
  });
  assert.equal(findActivePreset(applied), "sunset");
  assert.equal(findActivePreset(createDefaultTheme()), "pocari");

  // preset tidak dikenal -> tema tidak berubah
  assert.deepEqual(
    applyPresetToTheme("tidak-ada", createDefaultTheme()),
    createDefaultTheme(),
  );
});

test("preset WARM SAND memakai palette cream/beige dan tetap terbaca", () => {
  const preset = THEME_PRESETS.find((item) => item.id === "warm-sand");
  assert.ok(preset, "preset warm-sand harus ada");

  // nama ramah pengguna + seluruh 5 kode warna yang diminta
  assert.equal(preset.label, "WARM SAND");
  assert.deepEqual(preset.swatches, [
    "#EDEDE9",
    "#D6CCC2",
    "#F5EBE0",
    "#E3D5CA",
    "#D5BDAF",
  ]);
  assert.equal(preset.hint.en.length > 0, true);
  assert.equal(preset.hint.id.length > 0, true);

  const { bg, accent, text } = preset.colors;

  // latar memakai cream asli dari palette
  assert.equal(bg, "#F5EBE0");

  // teks utama sangat terbaca, dan teks aksen tetap lolos ambang WCAG
  assert.ok(contrastRatio(text, bg) >= 9, `teks vs latar = ${contrastRatio(text, bg)}`);
  assert.equal(getContrastLevel(text, bg), "good");
  assert.ok(
    contrastRatio(accent, bg) >= 4.5,
    `accent vs latar = ${contrastRatio(accent, bg)}`,
  );
  assert.equal(getContrastLevel(accent, bg), "good");

  // teks tombol (memakai warna latar) harus terbaca di atas tombol accent
  assert.ok(contrastRatio(bg, accent) >= 4.5, `teks tombol vs accent = ${contrastRatio(bg, accent)}`);

  // aksen & teks masih satu keluarga hue dengan palette (warm: R > G > B)
  [accent, text].forEach((hex) => {
    const rgb = { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
    assert.ok(rgb.r > rgb.g && rgb.g > rgb.b, `${hex} harus tetap hangat (R>G>B)`);
  });

  // tema terang: hover tombol accent jadi lebih gelap (bukan lebih terang)
  const vars = buildZoneVars(preset.colors);
  const toHex = (triplet) =>
    "#" + triplet.split(" ").map((v) => Number(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  const bgLum = relativeLuminance(bg);
  assert.ok(relativeLuminance(toHex(vars["--retro-green-dark"])) < relativeLuminance(accent));
  assert.ok(bgLum > relativeLuminance(text), "zona warm-sand harus terang");

  // bisa diterapkan & terdeteksi aktif
  const applied = applyPresetToTheme("warm-sand", createDefaultTheme());
  assert.equal(findActivePreset(applied), "warm-sand");
  THEME_ZONES.forEach((zone) => assert.deepEqual(applied[zone], preset.colors));
});

test("preset default bernama DEFAULT COLOR dengan warna default PaceLab", () => {
  const preset = THEME_PRESETS.find((item) => item.id === "pocari");
  assert.ok(preset, "preset default harus ada");

  // hanya nama yang berubah; warna tetap palette default PaceLab
  assert.equal(preset.label, "DEFAULT COLOR");
  assert.deepEqual(preset.colors, {
    bg: "#005BAC",
    accent: "#DFF5FF",
    text: "#FFFFFF",
  });
  assert.deepEqual(preset.colors, DEFAULT_ZONE_COLORS);

  // hint tetap ramah pengguna (bilingual) dan tidak memakai nama lama
  assert.ok(preset.hint?.en && preset.hint?.id);
  const visibleText = [
    preset.label,
    preset.hint.en,
    preset.hint.id,
    ...(preset.swatches || []),
  ].join(" ");
  assert.equal(
    /pocari/i.test(visibleText),
    false,
    "nama lama tidak boleh muncul pada teks yang tampil ke pengguna",
  );

  // tema default aplikasi tetap terdeteksi sebagai preset default
  assert.equal(findActivePreset(createDefaultTheme()), "pocari");
  assert.deepEqual(
    buildZoneVars(preset.colors),
    DEFAULT_ZONE_VARS,
    "variabel zona default tidak berubah sama sekali",
  );
});

test("preset MONOCHROME V2 adalah kebalikan (inversi) dari MONOCHROME", () => {
  const mono = THEME_PRESETS.find((item) => item.id === "mono");
  const v2 = THEME_PRESETS.find((item) => item.id === "mono-v2");
  assert.ok(mono && v2, "kedua preset monochrome harus ada");
  assert.equal(v2.label, "MONOCHROME V2");

  const invert = (hex) =>
    "#" +
    hex
      .slice(1)
      .match(/../g)
      .map((part) => (255 - parseInt(part, 16)).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

  // setiap channel dibalik: 255 - x
  assert.equal(v2.colors.bg, invert(mono.colors.bg));
  assert.equal(v2.colors.accent, invert(mono.colors.accent));
  assert.equal(v2.colors.text, invert(mono.colors.text));
  assert.deepEqual(v2.colors, {
    bg: "#EFEFEF",
    accent: "#171717",
    text: "#000000",
  });

  // peran warna benar-benar bertukar: latar gelap -> terang, teks terang -> gelap
  assert.equal(relativeLuminance(v2.colors.bg) > relativeLuminance(mono.colors.bg), true);
  assert.equal(relativeLuminance(v2.colors.text) < relativeLuminance(mono.colors.text), true);
  assert.equal(getContrastLevel(v2.colors.text, v2.colors.bg), "good");
  assert.equal(getContrastLevel(v2.colors.accent, v2.colors.bg), "good");
  assert.ok(contrastRatio(v2.colors.text, v2.colors.bg) >= 15);
  assert.ok(contrastRatio(v2.colors.bg, v2.colors.accent) >= 10);

  // tema terang -> hover aksen lebih gelap, bukan lebih terang
  const vars = buildZoneVars(v2.colors);
  const toHex = (triplet) =>
    "#" +
    triplet
      .split(" ")
      .map((value) => Number(value).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  assert.equal(
    relativeLuminance(toHex(vars["--retro-green-dark"])) <
      relativeLuminance(v2.colors.accent),
    true,
  );
  assert.equal(
    relativeLuminance(toHex(vars["--retro-gray"])) < relativeLuminance(v2.colors.bg),
    true,
    "kartu tetap lebih gelap dari latar",
  );

  // bisa diterapkan & terdeteksi aktif
  const applied = applyPresetToTheme("mono-v2", createDefaultTheme());
  assert.equal(findActivePreset(applied), "mono-v2");
  THEME_ZONES.forEach((zone) => assert.deepEqual(applied[zone], v2.colors));
  assert.ok(
    Array.isArray(v2.swatches) && v2.swatches.length >= 3,
    "swatch palette tersedia untuk chip preset",
  );
});

test("shadeToContrast menurunkan warna sampai target kontras tercapai", () => {
  const bg = "#F5EBE0";

  const shaded = shadeToContrast("#D5BDAF", bg, 4.5);
  assert.ok(contrastRatio(shaded, bg) >= 4.5);
  assert.ok(relativeLuminance(shaded) < relativeLuminance("#D5BDAF"), "harus lebih gelap");

  // warna yang sudah lolos tidak diubah
  assert.equal(shadeToContrast("#000000", "#FFFFFF", 4.5), "#000000");

  // target tidak mungkin tercapai -> tetap mengembalikan hex valid
  const impossible = shadeToContrast("#F5EBE0", "#F5EBE0", 21);
  assert.match(impossible, /^#[0-9A-F]{6}$/);

  // input rusak tidak membuat crash
  assert.equal(shadeToContrast("bukan-warna", bg, 4.5), "bukan-warna");
  assert.equal(shadeToContrast("#EDEDE9", "xx", 4.5), "#EDEDE9");
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
