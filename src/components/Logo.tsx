"use client";

import { useRef } from "react";
import { isTheme } from "@/lib/themes";
import { createEgg } from "@/components/logo-egg/engine";

// Logoen i temafargen. Bildene i public/logo/ er laget fra design/ikon.html (én per tema).
// Påskeegg: trykk på logoen tre ganger! Selve animasjonen ligger i logo-egg/engine.js.
export function Logo({ theme, big = false }: { theme?: string | null; big?: boolean }) {
  const t = theme && isTheme(theme) ? theme : "neon";
  const img = useRef<HTMLImageElement>(null);
  const egg = useRef<ReturnType<typeof createEgg> | null>(null);

  function tap() {
    const el = img.current;
    if (!el || !el.complete) return;
    if (!egg.current) egg.current = createEgg(el, () => (egg.current = null));
    egg.current.tap();
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- små faste PNG-er, trenger ikke next/image
    <img
      ref={img}
      src={`/logo/${t}.png`}
      alt="3D King"
      className={big ? "logo big" : "logo"}
      width={600}
      height={314}
      onClick={tap}
      draggable={false}
    />
  );
}
