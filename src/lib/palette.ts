// PLA-fargene til Bambu Lab, hentet fra Bambu Studio sin fargeliste:
// https://github.com/bambulab/BambuStudio/blob/master/resources/profiles/BBL/filament/filaments_color_codes.json
// Fargene er gruppert etter filamenttype. Navnet som lagres er «type + farge», slik det står på spolen.
// Farger med flere nyanser (gradient og flerfarget) har flere fargekoder skilt med komma.

export type PaletteColor = { name: string; hex: string };
export type PaletteGroup = { line: string; colors: PaletteColor[] };

export const PALETTE: PaletteGroup[] = [
  {
    line: "PLA Basic",
    colors: [
      { name: "PLA Basic Orange", hex: "#ff6a13" },
      { name: "PLA Basic Pumpkin Orange", hex: "#ff9016" },
      { name: "PLA Basic Blue Gray", hex: "#5b6579" },
      { name: "PLA Basic Cobalt Blue", hex: "#0056b8" },
      { name: "PLA Basic Turquoise", hex: "#00b1b7" },
      { name: "PLA Basic Cyan", hex: "#0086d6" },
      { name: "PLA Basic Blue", hex: "#0a2989" },
      { name: "PLA Basic Gray", hex: "#8e9089" },
      { name: "PLA Basic Silver", hex: "#a6a9aa" },
      { name: "PLA Basic Light Gray", hex: "#d1d3d5" },
      { name: "PLA Basic Dark Gray", hex: "#545454" },
      { name: "PLA Basic Mistletoe Green", hex: "#3f8e43" },
      { name: "PLA Basic Bright Green", hex: "#becf00" },
      { name: "PLA Basic Bambu Green", hex: "#00ae42" },
      { name: "PLA Basic Black", hex: "#000000" },
      { name: "PLA Basic Arctic Whisper", hex: "#9cdbd9,#ffffff" },
      { name: "PLA Basic Solar Breeze", hex: "#e94b3c,#ffffff" },
      { name: "PLA Basic Ocean to Meadow", hex: "#307fe2,#54ff9b" },
      { name: "PLA Basic Pink Citrus", hex: "#f78f77,#e4505a" },
      { name: "PLA Basic Mint Lime", hex: "#b6ff43,#4ec939" },
      { name: "PLA Basic Blueberry Bubblegum", hex: "#6fcaef,#8573dd" },
      { name: "PLA Basic Dusk Glare", hex: "#ce4406,#ed9558" },
      { name: "PLA Basic Cotton Candy Cloud", hex: "#e7c1d5,#8ec9e9" },
      { name: "PLA Basic Brown", hex: "#9d432c" },
      { name: "PLA Basic Cocoa Brown", hex: "#6f5034" },
      { name: "PLA Basic Beige", hex: "#f7e6de" },
      { name: "PLA Basic Pink", hex: "#f55a74" },
      { name: "PLA Basic Indigo Purple", hex: "#482960" },
      { name: "PLA Basic Purple", hex: "#5e43b7" },
      { name: "PLA Basic Magenta", hex: "#ec008c" },
      { name: "PLA Basic Red", hex: "#c12e1f" },
      { name: "PLA Basic Maroon Red", hex: "#9d2235" },
      { name: "PLA Basic Hot Pink", hex: "#f5547c" },
      { name: "PLA Basic Jade White", hex: "#ffffff" },
      { name: "PLA Basic Yellow", hex: "#f4ee2a" },
      { name: "PLA Basic Sunflower Yellow", hex: "#fec600" },
      { name: "PLA Basic Bronze", hex: "#847d48" },
      { name: "PLA Basic Gold", hex: "#e4bd68" },
    ],
  },
  {
    line: "PLA Matte",
    colors: [
      { name: "PLA Matte Mandarin Orange", hex: "#f99963" },
      { name: "PLA Matte Sky Blue", hex: "#56b7e6" },
      { name: "PLA Matte Marine Blue", hex: "#0078bf" },
      { name: "PLA Matte Ice Blue", hex: "#a3d8e1" },
      { name: "PLA Matte Dark Blue", hex: "#042f56" },
      { name: "PLA Matte Nardo Gray", hex: "#757575" },
      { name: "PLA Matte Ash Gray", hex: "#9b9ea0" },
      { name: "PLA Matte Apple Green", hex: "#c2e189" },
      { name: "PLA Matte Grass Green", hex: "#61c680" },
      { name: "PLA Matte Dark Green", hex: "#68724d" },
      { name: "PLA Matte Charcoal", hex: "#000000" },
      { name: "PLA Matte Dark Chocolate", hex: "#4d3324" },
      { name: "PLA Matte Latte Brown", hex: "#d3b7a7" },
      { name: "PLA Matte Dark Brown", hex: "#7d6556" },
      { name: "PLA Matte Caramel", hex: "#ae835b" },
      { name: "PLA Matte Sakura Pink", hex: "#e8afcf" },
      { name: "PLA Matte Lilac Purple", hex: "#ae96d4" },
      { name: "PLA Matte Scarlet Red", hex: "#de4343" },
      { name: "PLA Matte Terracotta", hex: "#b15533" },
      { name: "PLA Matte Plum", hex: "#950051" },
      { name: "PLA Matte Dark Red", hex: "#bb3d43" },
      { name: "PLA Matte Ivory White", hex: "#ffffff" },
      { name: "PLA Matte Bone White", hex: "#cbc6b8" },
      { name: "PLA Matte Lemon Yellow", hex: "#f7d959" },
      { name: "PLA Matte Desert Tan", hex: "#e8dbb7" },
    ],
  },
  {
    line: "PLA Silk+",
    colors: [
      { name: "PLA Silk+ Baby Blue", hex: "#a8c6ee" },
      { name: "PLA Silk+ Blue", hex: "#008bda" },
      { name: "PLA Silk+ Titan Gray", hex: "#5f6367" },
      { name: "PLA Silk+ Silver", hex: "#c8c8c8" },
      { name: "PLA Silk+ Candy Green", hex: "#018814" },
      { name: "PLA Silk+ Mint", hex: "#96dcb9" },
      { name: "PLA Silk+ Purple", hex: "#8671cb" },
      { name: "PLA Silk+ Candy Red", hex: "#d02727" },
      { name: "PLA Silk+ Rose Gold", hex: "#ba9594" },
      { name: "PLA Silk+ Pink", hex: "#f7ada6" },
      { name: "PLA Silk+ White", hex: "#ffffff" },
      { name: "PLA Silk+ Champagne", hex: "#f3cfb2" },
      { name: "PLA Silk+ Gold", hex: "#f4a925" },
    ],
  },
  {
    line: "PLA Silk",
    colors: [
      { name: "PLA Silk Blue", hex: "#147bd1" },
      { name: "PLA Silk Silver", hex: "#eaeceb" },
      { name: "PLA Silk Green", hex: "#4ce4a0" },
      { name: "PLA Silk Copper", hex: "#5e4b3c" },
      { name: "PLA Silk Pink", hex: "#eeb1c1" },
      { name: "PLA Silk Purple", hex: "#854ce4" },
      { name: "PLA Silk Gilded Rose", hex: "#ff9425,#c16784" },
      { name: "PLA Silk Midnight Blaze", hex: "#0047bb,#7d1b49" },
      { name: "PLA Silk Neon City", hex: "#0047bb,#bb22a3" },
      { name: "PLA Silk Blue Hawaii", hex: "#418fde,#70c884" },
      { name: "PLA Silk Velvet Eclipse (Black-Red)", hex: "#000000,#a34342" },
      { name: "PLA Silk White", hex: "#ffffff" },
      { name: "PLA Silk Gold", hex: "#e5b03d" },
      { name: "PLA Silk South Beach", hex: "#f772a4,#00918b" },
      { name: "PLA Silk Aurora Purple", hex: "#7f3696,#006ec9" },
      { name: "PLA Silk Dawn Radiance", hex: "#ec984c,#6cd4bc,#a66eb9,#d87694" },
      { name: "PLA Silk Mystic Magenta", hex: "#720062,#3a913f" },
      { name: "PLA Silk Phantom Blue", hex: "#00629b,#000000" },
    ],
  },
  {
    line: "PLA Translucent",
    colors: [
      { name: "PLA Translucent Red", hex: "#b50011" },
      { name: "PLA Translucent Cherry Pink", hex: "#f5b6cd" },
      { name: "PLA Translucent Orange", hex: "#f74e02" },
      { name: "PLA Translucent Mellow Yellow", hex: "#f5dbab" },
      { name: "PLA Translucent Light Jade", hex: "#96d8af" },
      { name: "PLA Translucent Ice Blue", hex: "#b8cde9" },
      { name: "PLA Translucent Blue", hex: "#0047bb" },
      { name: "PLA Translucent Teal", hex: "#009fa1" },
      { name: "PLA Translucent Purple", hex: "#8344b0" },
      { name: "PLA Translucent Lavender", hex: "#b8acd6" },
    ],
  },
  {
    line: "PLA Glow",
    colors: [
      { name: "PLA Glow Orange", hex: "#ff9d5b" },
      { name: "PLA Glow Blue", hex: "#7ac0e9" },
      { name: "PLA Glow Green", hex: "#a1ffac" },
      { name: "PLA Glow Pink", hex: "#f17b8f" },
      { name: "PLA Glow Yellow", hex: "#f8ff80" },
    ],
  },
  {
    line: "PLA Marble",
    colors: [
      { name: "PLA Marble White", hex: "#f7f3f0" },
      { name: "PLA Marble Red Granite", hex: "#ad4e38" },
    ],
  },
  {
    line: "PLA Sparkle",
    colors: [
      { name: "PLA Sparkle Royal Purple", hex: "#483d8b" },
      { name: "PLA Sparkle Slate Gray", hex: "#8e9089" },
      { name: "PLA Sparkle Alpine Green", hex: "#3f5443" },
      { name: "PLA Sparkle Onyx Black", hex: "#2d2b28" },
      { name: "PLA Sparkle Crimson Red", hex: "#792b36" },
      { name: "PLA Sparkle Classic Gold", hex: "#cea629" },
    ],
  },
  {
    line: "PLA Galaxy",
    colors: [
      { name: "PLA Galaxy Purple", hex: "#594177" },
      { name: "PLA Galaxy Green", hex: "#3b665e" },
      { name: "PLA Galaxy Nebulae", hex: "#424379" },
      { name: "PLA Galaxy Brown", hex: "#684a43" },
    ],
  },
  {
    line: "PLA Metal",
    colors: [
      { name: "PLA Metal Iron Gray Metallic", hex: "#43403d" },
      { name: "PLA Metal Iridium Gold Metallic", hex: "#b39b84" },
      { name: "PLA Metal Oxide Green Metallic", hex: "#1d7c6a" },
      { name: "PLA Metal Cobalt Blue Metallic", hex: "#39699e" },
      { name: "PLA Metal Copper Brown Metallic", hex: "#aa6443" },
    ],
  },
  {
    line: "PLA Wood",
    colors: [
      { name: "PLA Wood Classic Birch", hex: "#918669" },
      { name: "PLA Wood Black Walnut", hex: "#4f3f24" },
      { name: "PLA Wood Clay Brown", hex: "#995f11" },
      { name: "PLA Wood Rosewood", hex: "#4c241c" },
      { name: "PLA Wood White Oak", hex: "#d6cca3" },
      { name: "PLA Wood Ochre Yellow", hex: "#c98935" },
    ],
  },
  {
    line: "PLA Tough+",
    colors: [
      { name: "PLA Tough+ Black", hex: "#000000" },
      { name: "PLA Tough+ Gray", hex: "#afb1ae" },
      { name: "PLA Tough+ Silver", hex: "#959698" },
      { name: "PLA Tough+ White", hex: "#ffffff" },
      { name: "PLA Tough+ Orange", hex: "#dc3a27" },
      { name: "PLA Tough+ Yellow", hex: "#f4d53f" },
      { name: "PLA Tough+ Cyan", hex: "#009bd8" },
    ],
  },
  {
    line: "PLA Tough",
    colors: [
      { name: "PLA Tough Orange", hex: "#ff7f41" },
      { name: "PLA Tough Light Blue", hex: "#0085ad" },
      { name: "PLA Tough Lavender Blue", hex: "#6667ab" },
      { name: "PLA Tough Gray", hex: "#515a6c" },
      { name: "PLA Tough Silver", hex: "#898d8d" },
      { name: "PLA Tough Pine Green", hex: "#00482b" },
      { name: "PLA Tough Black", hex: "#25282a" },
      { name: "PLA Tough Vermilion Red", hex: "#dd3c22" },
      { name: "PLA Tough White", hex: "#f9f7f4" },
      { name: "PLA Tough Yellow", hex: "#fedb00" },
    ],
  },
  {
    line: "PLA Lite",
    colors: [
      { name: "PLA Lite Black", hex: "#000000" },
      { name: "PLA Lite Yellow", hex: "#efe255" },
      { name: "PLA Lite White", hex: "#ffffff" },
      { name: "PLA Lite Cyan", hex: "#4dafda" },
      { name: "PLA Lite Red", hex: "#c6001a" },
      { name: "PLA Lite Gray", hex: "#999d9d" },
      { name: "PLA Lite Blue", hex: "#004ea8" },
      { name: "PLA Lite Sunflower Yellow", hex: "#ffb549" },
      { name: "PLA Lite Green", hex: "#00bb31" },
      { name: "PLA Lite Orange", hex: "#ff671f" },
      { name: "PLA Lite Matte Beige", hex: "#ecc3b2" },
      { name: "PLA Lite Cocoa Brown", hex: "#745335" },
      { name: "PLA Lite Dark Gray", hex: "#8c8b8c" },
    ],
  },
  {
    line: "PLA Pure",
    colors: [
      { name: "PLA Pure White", hex: "#ffffff" },
      { name: "PLA Pure Absolute Black", hex: "#000000" },
      { name: "PLA Pure Milky Pink", hex: "#f7ced7" },
      { name: "PLA Pure Baby Blue", hex: "#a4dbe8" },
      { name: "PLA Pure Apricot", hex: "#ffb673" },
    ],
  },
  {
    line: "PLA Palette",
    colors: [
      { name: "PLA Palette Cyan", hex: "#0090da" },
      { name: "PLA Palette Magenta", hex: "#e24585" },
      { name: "PLA Palette Yellow", hex: "#fce300" },
      { name: "PLA Palette White", hex: "#ffffff" },
      { name: "PLA Palette Key", hex: "#000000" },
    ],
  },
  {
    line: "PLA Aero",
    colors: [
      { name: "PLA Aero Gray", hex: "#cdceca" },
      { name: "PLA Aero Black", hex: "#000000" },
      { name: "PLA Aero White", hex: "#ffffff" },
    ],
  },
  {
    line: "PLA Dynamic",
    colors: [
      { name: "PLA Dynamic UV Color Changing - White to Coral", hex: "#ffffff" },
    ],
  },
  {
    line: "PLA-CF",
    colors: [
      { name: "PLA-CF Royal Blue", hex: "#2842ad" },
      { name: "PLA-CF Jeans Blue", hex: "#6e88bc" },
      { name: "PLA-CF Lava Gray", hex: "#4d5054" },
      { name: "PLA-CF Matcha Green", hex: "#5c9748" },
      { name: "PLA-CF Black", hex: "#000000" },
      { name: "PLA-CF Iris Purple", hex: "#69398e" },
      { name: "PLA-CF Burgundy Red", hex: "#951e23" },
    ],
  },
];

/** Gjør en fargekode om til CSS-bakgrunn. Flere koder blir en skrå overgang mellom fargene. */
export function colorFill(hex: string | null | undefined): string | undefined {
  if (!hex) return undefined;
  const parts = hex.split(",");
  return parts.length > 1 ? `linear-gradient(135deg, ${parts.join(", ")})` : hex;
}

/** Sjekker at en fargekode ser ut som «#a1b2c3», eventuelt flere skilt med komma. */
export function isHex(v: string): boolean {
  return /^#[0-9a-f]{6}(,#[0-9a-f]{6}){0,3}$/i.test(v);
}

export type NamedColor = { name: string; hex: string };

/** Leser farge 2 og 3 fra bestillingen (lagret som JSON). Ugyldig innhold gir en tom liste. */
export function parseExtraColors(raw: string | null | undefined): NamedColor[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((c) => c && typeof c.name === "string" && typeof c.hex === "string") : [];
  } catch {
    return [];
  }
}
