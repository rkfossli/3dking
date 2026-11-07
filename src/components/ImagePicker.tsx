"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

// Knapp for å velge bilde, i appens egen stil i stedet for nettleserens «Velg fil».
// Selve filvelgeren (bilder eller kamera) er telefonens egen, og den kan ingen app bytte ut.
export function ImagePicker({ name = "image", label = "Bilde", onPick }: { name?: string; label?: string; onPick?: (file: File | null) => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // Når skjemaet tømmes etter innsending, skal også filnavnet forsvinne.
  useEffect(() => {
    const form = input.current?.form;
    const clear = () => setFileName(null);
    form?.addEventListener("reset", clear);
    return () => form?.removeEventListener("reset", clear);
  }, []);
  return (
    <div className="image-pick">
      <span className="image-pick-label">{label}</span>
      <label className="button secondary small image-pick-btn">
        <Icon name="plus" size={16} /> {fileName ? "Bytt bilde" : "Velg bilde"}
        <input
          ref={input}
          name={name}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFileName(f?.name ?? null);
            onPick?.(f);
          }}
        />
      </label>
      {fileName && <span className="muted small-text image-pick-name">{fileName}</span>}
    </div>
  );
}
