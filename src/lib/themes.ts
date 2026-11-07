// Fargetemaer, hentet fra Spotter (src/lib/themes.ts).
// Selve fargene står i globals.css under [data-theme="..."]. Her står bare navn og forhåndsvisning.

export const THEMES = [
  { key: "neon", name: "Industrial Neon", desc: "Mørkt med neongrønt", bg: "#121212", card: "#1c1c1c", accent: "#0df762" },
  { key: "steel", name: "Steel & Copper", desc: "Stål og kobberoransje", bg: "#0a0a0a", card: "#171717", accent: "#ff6b00" },
  { key: "cyber", name: "Cyberpunk Iron", desc: "Nattblått og cyan", bg: "#0b0f19", card: "#141b2d", accent: "#00f0ff" },
  { key: "onyx", name: "Onyx Smoke", desc: "Sort stein og gull", bg: "#0a0a0b", card: "#1a1816", accent: "#e3b65a" },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];
export type Mode = "dark" | "light";

/** Bakgrunnsfargen i lys modus, til forhåndsvisningen og statuslinjen. */
export const LIGHT_BG: Record<ThemeKey, string> = { neon: "#f3f4f6", steel: "#f2f2f1", cyber: "#eef2f8", onyx: "#f1eee8" };
/** Temafargen i lys modus (mørkere, så den er lesbar på hvitt). */
export const LIGHT_ACCENT: Record<ThemeKey, string> = { neon: "#08803a", steel: "#b84800", cyber: "#007189", onyx: "#9c7320" };

export function isTheme(v: string): v is ThemeKey {
  return THEMES.some((t) => t.key === v);
}

export function isMode(v: string): v is Mode {
  return v === "dark" || v === "light";
}

/** Bakgrunnsfargen for et tema og en modus. Brukes til statuslinjen på telefonen. */
export function themeBg(key: string, mode: string): string {
  const t = THEMES.find((x) => x.key === key) ?? THEMES[0];
  return mode === "light" ? LIGHT_BG[t.key] : t.bg;
}
