// src/components/layout/ThemeSettingsModal.jsx
import { useState } from "react";
import clsx from "clsx";
import Modal from "../ui/Modal";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  APP_VERSION_LABEL,
  THEME_ENGINE_VERSION,
} from "../../constants/appVersion";
import {
  COLOR_LABEL_KEYS,
  THEME_COLOR_KEYS,
  THEME_PRESETS,
  THEME_ZONES,
  ZONE_LABEL_KEYS,
  findActivePreset,
  getContrastLevel,
  isDefaultZone,
  mixHex,
  normalizeHex,
} from "../../utils/themeUtils";

// ── Kontrol warna: swatch picker + input hex manual ──────────────────────────
function ColorField({ label, value, onChange }) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Sinkronisasi draft saat nilai dari context berubah (mis. klik preset).
  // Pola "adjusting state during render" dari React — tanpa useEffect.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const commit = (raw) => {
    const hex = normalizeHex(raw);
    if (hex && hex !== value) {
      onChange(hex);
      setDraft(hex);
      return;
    }
    if (!hex) setDraft(value);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="w-[92px] shrink-0 font-mono text-[10px] tracking-[0.18em] text-retro-white/45">
        {label}
      </span>
      <span
        className="relative h-7 w-7 shrink-0 border border-retro-gray-light/40"
        style={{ backgroundColor: value }}
        title={value}
      >
        <input
          type="color"
          value={value}
          aria-label={label}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
      <input
        value={draft}
        spellCheck={false}
        maxLength={7}
        aria-label={`${label} hex`}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit(event.currentTarget.value);
          if (event.key === "Escape") setDraft(value);
        }}
        className="w-full min-w-0 border border-retro-gray-light/30 bg-transparent px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-retro-white outline-none transition-colors focus:border-retro-green"
      />
    </div>
  );
}

// ── Preview mini template per zona ───────────────────────────────────────────
function ZonePreview({ zone, colors }) {
  const surface = mixHex(colors.bg, colors.text, 0.14);
  const line = mixHex(colors.bg, colors.text, 0.34);

  if (zone === "header") {
    return (
      <div
        className="h-[76px] w-full border p-2"
        style={{ backgroundColor: colors.bg, borderColor: line }}
      >
        <div
          className="flex items-center justify-between border-b pb-1 font-mono text-[7px] tracking-[0.2em]"
          style={{ borderColor: line, color: colors.accent }}
        >
          <span>PACELAB PRO // {APP_VERSION_LABEL}</span>
          <span>SYSTEM ONLINE ●</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="flex h-4 w-4 items-center justify-center border font-mono text-[7px]"
              style={{ borderColor: colors.accent, color: colors.accent }}
            >
              R
            </span>
            <span
              className="font-mono text-[9px] font-bold tracking-widest"
              style={{ color: colors.text }}
            >
              PACELAB
            </span>
          </div>
          <span
            className="px-2 py-1 font-mono text-[7px] tracking-widest"
            style={{ backgroundColor: colors.accent, color: colors.bg }}
          >
            SIGN IN →
          </span>
        </div>
      </div>
    );
  }

  if (zone === "footer") {
    return (
      <div
        className="h-[76px] w-full border"
        style={{ backgroundColor: colors.bg, borderColor: line }}
      >
        <div
          className="flex items-center justify-around py-[3px] font-mono text-[6px] tracking-[0.2em]"
          style={{ backgroundColor: colors.accent, color: colors.bg }}
        >
          <span>RUN FAST</span>
          <span>TRAIN SMART</span>
          <span>CALCULATE BETTER</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 px-2">
          {[0, 1, 2].map((column) => (
            <div key={column} className="space-y-1">
              <span
                className="block h-1.5 w-8"
                style={{ backgroundColor: colors.accent }}
              />
              {[0, 1].map((row) => (
                <span
                  key={row}
                  className="block h-1 w-full"
                  style={{ backgroundColor: line }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[76px] w-full border p-2"
      style={{ backgroundColor: colors.bg, borderColor: line }}
    >
      <span
        className="block font-mono text-[8px] tracking-[0.3em]"
        style={{ color: colors.accent }}
      >
        WEEK 1 / 18 — BASE PHASE
      </span>
      <div
        className="mt-2 border p-2"
        style={{ backgroundColor: surface, borderColor: line }}
      >
        <span
          className="block h-1.5 w-16"
          style={{ backgroundColor: colors.text }}
        />
        <span
          className="mt-1.5 block h-1 w-full opacity-50"
          style={{ backgroundColor: colors.text }}
        />
        <span
          className="mt-1 block h-1 w-2/3 opacity-30"
          style={{ backgroundColor: colors.text }}
        />
      </div>
    </div>
  );
}

// ── Kartu pengaturan satu zona ───────────────────────────────────────────────
function ZoneCard({ zone }) {
  const { theme, setZoneColor, resetZone } = useTheme();
  const { t } = useLanguage();
  const colors = theme[zone];
  const isDefault = isDefaultZone(colors);
  const contrastLevel = getContrastLevel(colors.text, colors.bg);

  const levelStyle = {
    good: "border-retro-green/50 text-retro-green",
    fair: "border-retro-warn/50 text-retro-warn",
    low: "border-red-400/50 text-red-400",
  }[contrastLevel];

  const levelLabel = {
    good: t("contrastGood"),
    fair: t("contrastFair"),
    low: t("contrastLow"),
  }[contrastLevel];

  return (
    <article className="border-2 border-retro-green/30 bg-retro-black/40 p-3">
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h4 className="font-retro text-xl leading-none tracking-widest text-retro-white">
            {t(ZONE_LABEL_KEYS[zone])}
          </h4>
          <p className="mt-1 font-mono text-[9px] leading-relaxed tracking-[0.14em] text-retro-white/35">
            {t(`${ZONE_LABEL_KEYS[zone]}Desc`)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => resetZone(zone)}
          disabled={isDefault}
          className="shrink-0 border border-retro-gray-light/30 px-2 py-1 font-mono text-[9px] tracking-[0.16em] text-retro-white/50 transition-colors hover:border-retro-green hover:text-retro-green disabled:opacity-30 disabled:hover:border-retro-gray-light/30 disabled:hover:text-retro-white/50"
        >
          {t("resetZone")}
        </button>
      </header>

      <ZonePreview zone={zone} colors={colors} />

      <div className="mt-3 space-y-2">
        {THEME_COLOR_KEYS.map((key) => (
          <ColorField
            key={key}
            label={t(COLOR_LABEL_KEYS[key])}
            value={colors[key]}
            onChange={(hex) => setZoneColor(zone, key, hex)}
          />
        ))}
      </div>

      <p
        className={clsx(
          "mt-3 inline-block border px-2 py-[3px] font-mono text-[9px] tracking-[0.16em]",
          levelStyle,
        )}
      >
        {levelLabel}
      </p>
    </article>
  );
}

// Warna yang ditampilkan pada chip preset: pakai seluruh palette kalau ada,
// kalau tidak fallback ke 3 warna tema.
function getPresetSwatches(preset) {
  if (Array.isArray(preset.swatches) && preset.swatches.length) {
    return preset.swatches;
  }
  return ["bg", "accent", "text"].map((key) => preset.colors[key]);
}

// ── Modal utama ──────────────────────────────────────────────────────────────
export default function ThemeSettingsModal({ isOpen, onClose }) {
  const { theme, applyPreset, resetTheme, isDefault } = useTheme();
  const { t, language } = useLanguage();
  const activePreset = findActivePreset(theme);
  const activePresetData = THEME_PRESETS.find((preset) => preset.id === activePreset);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("themeSettings")}
      subtitle={t("themeSettingsSubtitle")}
      closeLabel={t("close")}
    >
      <div className="space-y-5">
        {/* Preset palet */}
        <section>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="flex items-baseline gap-2 font-retro text-lg tracking-widest text-retro-white">
              {t("presets")}
              <span className="font-mono text-[10px] tracking-[0.18em] text-retro-green/80">
                ({THEME_PRESETS.length})
              </span>
            </h4>
            <span className="font-mono text-[9px] tracking-[0.18em] text-retro-white/35">
              {t("presetHint")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              const swatches = getPresetSwatches(preset);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  title={`${preset.label} — ${swatches.join(" ")}`}
                  className={clsx(
                    "flex items-center gap-2 border px-2 py-2 transition-colors",
                    isActive
                      ? "border-retro-green bg-retro-green/10 text-retro-green"
                      : "border-retro-gray-light/30 text-retro-white/60 hover:border-retro-green/60 hover:text-retro-white",
                  )}
                >
                  <span className="flex overflow-hidden border border-retro-gray-light/30">
                    {swatches.map((color, index) => (
                      <span
                        key={`${color}-${index}`}
                        className="block h-4 w-[7px]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.14em]">
                    {preset.label}
                  </span>
                  {preset.isNew && (
                    <span className="border border-current px-1 py-[1px] font-mono text-[8px] tracking-[0.14em]">
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {activePresetData && (
            <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.14em] text-retro-white/40">
              <span className="text-retro-green/80">{t("palette")}:</span>
              {getPresetSwatches(activePresetData).map((color, index) => (
                <span
                  key={`${color}-${index}`}
                  className="block h-3 w-3 border border-retro-gray-light/40"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <span>{activePresetData.hint?.[language] || activePresetData.label}</span>
            </p>
          )}
        </section>

        {/* Zona */}
        <section className="grid gap-3 lg:grid-cols-3">
          {THEME_ZONES.map((zone) => (
            <ZoneCard key={zone} zone={zone} />
          ))}
        </section>

        {/* Footer modal */}
        <section className="flex flex-wrap items-center justify-between gap-3 border-t border-retro-gray-light/25 pt-4">
          <div className="space-y-1">
            <p className="font-mono text-[9px] leading-relaxed tracking-[0.16em] text-retro-white/35">
              {t("themeSavedLocally")}
            </p>
            {/* Penanda versi: memudahkan memastikan file yang terpasang sudah terbaru */}
            <p className="font-mono text-[9px] tracking-[0.16em] text-retro-green/50">
              {t("themeEngine")} v{THEME_ENGINE_VERSION} · {THEME_PRESETS.length} {t("presets")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetTheme}
              disabled={isDefault}
              className="btn-retro px-4 py-2 font-retro text-sm tracking-widest text-retro-white/70 hover:text-retro-white disabled:opacity-40"
            >
              {t("resetAll")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-retro bg-retro-green px-5 py-2 font-retro text-sm tracking-widest text-retro-black"
            >
              {t("close")}
            </button>
          </div>
        </section>
      </div>
    </Modal>
  );
}
