"use client";
import { useRef, useState } from "react";
import { Icon } from "./Icon";
import { ProductImage } from "./ProductImage";

// Bildene på produktsiden. Med flere bilder kan kunden sveipe sidelengs,
// trykke på pilene eller på prikkene under.
// Sveipingen er vanlig sidelengs rulling som «smetter» på plass (CSS scroll-snap).
export function ProductGallery({ urls, alt }: { urls: string[]; alt: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);

  if (urls.length < 2) return <ProductImage url={urls[0] ?? null} alt={alt} />;

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    const next = (i + urls.length) % urls.length; // fra siste bilde går «neste» tilbake til det første
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="gallery">
      <div
        ref={track}
        className="gallery-track"
        onScroll={(e) => {
          const el = e.currentTarget;
          setAt(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {urls.map((url, i) => (
          <div key={url} className="gallery-slide" aria-hidden={i !== at}>
            {/* eslint-disable-next-line @next/next/no-img-element -- vanlig <img>, sparer Vercel-kvote */}
            <img src={url} alt={`${alt}, bilde ${i + 1} av ${urls.length}`} className="product-img" loading={i === 0 ? "eager" : "lazy"} />
          </div>
        ))}
      </div>
      <button type="button" className="gallery-arrow prev" aria-label="Forrige bilde" onClick={() => go(at - 1)}>
        <Icon name="arrow-left" size={18} />
      </button>
      <button type="button" className="gallery-arrow next" aria-label="Neste bilde" onClick={() => go(at + 1)}>
        <Icon name="arrow-right" size={18} />
      </button>
      <div className="gallery-dots">
        {urls.map((url, i) => (
          <button key={url} type="button" className={i === at ? "on" : ""} aria-label={`Vis bilde ${i + 1}`} aria-current={i === at} onClick={() => go(i)} />
        ))}
      </div>
    </div>
  );
}
