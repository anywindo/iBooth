export const CANVAS_PRESETS = [
  { id: "strip-51x152", name: "Photo Strip 51 x 152 mm", width: 602, height: 1795, mmWidth: 51, mmHeight: 152, dpi: 300 },
  { id: "strip-2x6", name: "Photo Strip 2 x 6 in", width: 600, height: 1800, mmWidth: 50.8, mmHeight: 152.4, dpi: 300 },
  { id: "print-4x6-portrait", name: "Print 4 x 6 in Portrait", width: 1200, height: 1800, mmWidth: 101.6, mmHeight: 152.4, dpi: 300 },
  { id: "print-4x6-landscape", name: "Print 6 x 4 in Landscape", width: 1800, height: 1200, mmWidth: 152.4, mmHeight: 101.6, dpi: 300 },
  { id: "square-4x4", name: "Square 4 x 4 in", width: 1200, height: 1200, mmWidth: 101.6, mmHeight: 101.6, dpi: 300 }
];

export const DEFAULT_PRESET_ID = "strip-51x152";
export const OUTPUT = CANVAS_PRESETS.find((preset) => preset.id === DEFAULT_PRESET_ID);
export const STORAGE_KEY = "photobooth-desktop-template";
export const SESSION_KEY = "photobooth-desktop-session";
export const THEME_KEY = "photobooth-desktop-theme";
export const PRINTER_SETTINGS_KEY = "photobooth-printer-settings";

export function getCanvasPreset(id) {
  return CANVAS_PRESETS.find((preset) => preset.id === id) || OUTPUT;
}

export function getTemplatePreset(template) {
  return getCanvasPreset(template?.presetId);
}

export function formatMm(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function getInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Ignore storage access failures and fall back to system/light.
  }

  try {
    if (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches) return "dark";
  } catch {
    // Ignore matchMedia failures.
  }

  return "light";
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
