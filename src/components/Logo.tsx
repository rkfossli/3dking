import { isTheme } from "@/lib/themes";

// Logoen i temafargen. Bildene i public/logo/ er laget fra design/ikon.html (én per tema).
export function Logo({ theme, big = false }: { theme?: string | null; big?: boolean }) {
  const t = theme && isTheme(theme) ? theme : "neon";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- små faste PNG-er, trenger ikke next/image
    <img src={`/logo/${t}.png`} alt="3D King" className={big ? "logo big" : "logo"} width={600} height={314} />
  );
}
