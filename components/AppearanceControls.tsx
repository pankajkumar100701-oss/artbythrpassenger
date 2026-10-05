"use client";

import { useSyncExternalStore } from "react";
import { ACCENTS, DEFAULT_ACCENT, PREFS_KEY, applyAppearance, isAccent, type AccentKey, type Theme } from "@/lib/theme";

const EVENT = "appearancechange";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

// The <html> attributes (set before paint by appearanceScript) are the store.
const readTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const readAccent = (): AccentKey => {
  const a = document.documentElement.dataset.accent;
  return isAccent(a) ? a : DEFAULT_ACCENT;
};

function save(theme: Theme, accent: AccentKey) {
  applyAppearance(theme, accent);
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ theme, accent }));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function AppearanceControls() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const accent = useSyncExternalStore(subscribe, readAccent, () => DEFAULT_ACCENT);

  return (
    <div className="appearance">
      <div className="appearance-row">
        <span>Dark mode</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={(e) => save(e.target.checked ? "dark" : "light", accent)}
            aria-label="Dark mode"
          />
          <span className="switch-track" />
        </label>
      </div>
      <div className="appearance-row">
        <span>Accent</span>
        <div className="swatches" role="radiogroup" aria-label="Accent colour">
          {(Object.keys(ACCENTS) as AccentKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={accent === key}
              aria-label={ACCENTS[key].name}
              title={ACCENTS[key].name}
              className="swatch"
              style={{ "--swatch-light": ACCENTS[key].light, "--swatch-dark": ACCENTS[key].dark } as React.CSSProperties}
              onClick={() => save(theme, key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
