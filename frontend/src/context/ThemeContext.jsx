// src/context/ThemeContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  THEME_ZONES,
  applyPresetToTheme,
  applyRootVars,
  buildZoneVars,
  createDefaultTheme,
  createFallbackThemeValue,
  describeTheme,
  loadTheme,
  saveTheme,
  setZoneColor as setZoneColorInTheme,
} from "../utils/themeUtils";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => loadTheme());

  // Tema MAIN ditulis ke <html> supaya body, scrollbar, portal, dan toast ikut.
  useEffect(() => {
    applyRootVars(theme);
    saveTheme(theme);
  }, [theme]);

  const zoneVars = useMemo(
    () => ({
      header: buildZoneVars(theme.header),
      main: buildZoneVars(theme.main),
      footer: buildZoneVars(theme.footer),
    }),
    [theme],
  );

  const updateZoneColor = useCallback((zone, key, value) => {
    setTheme((prev) => setZoneColorInTheme(prev, zone, key, value));
  }, []);

  const resetZone = useCallback((zone) => {
    if (!THEME_ZONES.includes(zone)) return;
    setTheme((prev) => ({
      ...prev,
      [zone]: { ...createDefaultTheme()[zone] },
    }));
  }, []);

  const resetTheme = useCallback(() => {
    setTheme(createDefaultTheme());
  }, []);

  const applyPreset = useCallback((presetId) => {
    setTheme((prev) => applyPresetToTheme(presetId, prev));
  }, []);

  const summary = useMemo(() => describeTheme(theme), [theme]);

  const value = useMemo(
    () => ({
      theme,
      zoneVars,
      setTheme,
      setZoneColor: updateZoneColor,
      resetZone,
      resetTheme,
      applyPreset,
      ...summary,
    }),
    [theme, zoneVars, updateZoneColor, resetZone, resetTheme, applyPreset, summary],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Nilai default kalau provider tidak ada supaya aplikasi tidak blank screen.
const FALLBACK_THEME = createFallbackThemeValue();
let fallbackWarned = false;

export function useTheme() {
  const context = useContext(ThemeContext);
  const missingProvider = !context;

  // Tanpa provider, palette default tetap ditulis ke <html> supaya
  // scrollbar, selection, overlay modal, dan toast ikut konsisten.
  useEffect(() => {
    if (!missingProvider) return;
    applyRootVars(FALLBACK_THEME.theme);
    if (!fallbackWarned) {
      fallbackWarned = true;
      console.warn(
        "[PaceLab] ThemeProvider tidak ditemukan — memakai palette default. " +
          "Pastikan src/main.jsx membungkus <App /> dengan <ThemeProvider>.",
      );
    }
  }, [missingProvider]);

  return context || FALLBACK_THEME;
}

export default ThemeContext;
