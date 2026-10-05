// Single source of truth for appearance. CSS reads --accent-light / --accent-dark,
// and each theme block in globals.css picks the shade that is readable on its background.

export const ACCENTS = {
  gold: { name: "Sunlit Gold", light: "#a1550a", dark: "#f4b740" },
  coral: { name: "Crimson Coral", light: "#b91c3c", dark: "#fb7185" },
  teal: { name: "Glacial Teal", light: "#0f766e", dark: "#2dd4bf" },
  amethyst: { name: "Amethyst Dusk", light: "#6d3fd6", dark: "#b49cfc" },
  sky: { name: "Alpine Sky", light: "#0369a1", dark: "#5ec8f8" },
} as const;

export type AccentKey = keyof typeof ACCENTS;
export type Theme = "light" | "dark";

export const DEFAULT_ACCENT: AccentKey = "gold";
export const PREFS_KEY = "abtp-prefs";

export function isAccent(value: unknown): value is AccentKey {
  return typeof value === "string" && value in ACCENTS;
}

/** Applies theme + accent to <html>. Shared by the pre-paint script and the controls. */
export function applyAppearance(theme: Theme, accent: AccentKey) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.accent = accent;
  root.style.setProperty("--accent-light", ACCENTS[accent].light);
  root.style.setProperty("--accent-dark", ACCENTS[accent].dark);
}

/** Runs in <head> before first paint so a saved dark theme never flashes light. */
export const appearanceScript = `(function(){try{
var A=${JSON.stringify(ACCENTS)},p={};
try{p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)}))||{}}catch(e){}
var t=p.theme==="dark"||p.theme==="light"?p.theme:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
var a=A[p.accent]?p.accent:${JSON.stringify(DEFAULT_ACCENT)},r=document.documentElement;
r.dataset.theme=t;r.dataset.accent=a;
r.style.setProperty("--accent-light",A[a].light);r.style.setProperty("--accent-dark",A[a].dark);
}catch(e){}})();`;
