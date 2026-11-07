"use client";
import { Icon } from "@/components/Icon";
import { useState, useTransition } from "react";
import { setModeAction, setThemeAction } from "@/app/theme-actions";
import { LIGHT_ACCENT, LIGHT_BG, THEMES, themeBg, type Mode } from "@/lib/themes";

// Velg fargetema og lys/mørk. Forenklet fra Spotter (src/components/ThemePicker.tsx).
// Fargene byttes med en gang i nettleseren, og lagres på brukeren i bakgrunnen.
export function ThemePicker({ current, mode: initialMode }: { current: string; mode: string }) {
  const [theme, setTheme] = useState(current);
  const [mode, setMode] = useState<Mode>(initialMode === "light" ? "light" : "dark");
  const [, start] = useTransition();

  // <html data-theme="..." data-mode="..."> styrer hvilke CSS-variabler som gjelder.
  function apply(t: string, m: Mode) {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.setAttribute("data-mode", m);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeBg(t, m));
  }

  return (
    <div className="stack">
      <div className="seg" role="radiogroup" aria-label="Mørk eller lys">
        {(["dark", "light"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            className={mode === m ? "on" : ""}
            onClick={() => {
              setMode(m);
              apply(theme, m);
              start(() => setModeAction(m));
            }}
          >
            <Icon name={m === "dark" ? "moon" : "sun"} size={16} className="inline" /> {m === "dark" ? "Mørk" : "Lys"}
          </button>
        ))}
      </div>
      <div className="theme-grid" role="radiogroup" aria-label="Fargetema">
        {THEMES.map((t) => (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={theme === t.key}
            className={`theme-opt ${theme === t.key ? "on" : ""}`}
            onClick={() => {
              setTheme(t.key);
              apply(t.key, mode);
              start(() => setThemeAction(t.key));
            }}
          >
            {/* Liten forhåndsvisning: bakgrunn, kort og temafarge */}
            <span className="theme-prev" style={{ background: mode === "light" ? LIGHT_BG[t.key] : t.bg }}>
              <span style={{ background: mode === "light" ? "#ffffff" : t.card }} />
              <span style={{ background: mode === "light" ? LIGHT_ACCENT[t.key] : t.accent }} />
            </span>
            <b>{t.name}</b>
            <span className="muted small-text">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
