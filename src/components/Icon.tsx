// Appens egne ikoner, tegnet som små SVG-er i stedet for emojier.
// De bruker currentColor, så de får samme farge som teksten rundt (og følger temaet).
// Tegnet i en 24x24-boks med strek, i samme stil som resten av appen.

const PATHS = {
  // Hake i en sirkel: noe er ferdig eller på
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8L16.5 9.5" />
    </>
  ),
  // Varebil: levering
  truck: (
    <>
      <path d="M2 6h11v10H2z" />
      <path d="M13 9h4.5l3.5 3.8V16h-8" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </>
  ),
  // Eske med hake: ferdig laget
  ready: (
    <>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
      <path d="m15.5 15 1.5 1.5 3-3" />
    </>
  ),
  // Terning i 3D: produkt uten bilde
  cube: (
    <>
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </>
  ),
  // Telefon med pil ned: installer appen
  install: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M12 7.5v6M9.5 11l2.5 2.5 2.5-2.5M10.5 18h3" />
    </>
  ),
  // Del-knappen i Safari: firkant med pil opp
  share: (
    <>
      <path d="M8 9.5H6.5v11h11v-11H16" />
      <path d="M12 3v11M8.5 6.5 12 3l3.5 3.5" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  // Melding: svar fra Liam
  message: <path d="M4 5h16v11H9l-5 4z" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `icon ${className}` : "icon"}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
