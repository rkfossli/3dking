"use client";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import { useState } from "react";
import { addToCart } from "./cart";
import { kr } from "@/lib/format";
import { colorFill } from "@/lib/palette";

const MAX = 20;

export type ProductForCart = { id: number; name: string; price: number; imageUrl: string | null; colorCount?: number };
export type ColorChoice = { id: number; name: string; hex: string; inStock: boolean };

// Skjemaet på produktsiden: antall, ønsker og «Legg i handlekurven».
// Selve bestillingen sendes fra handlekurven, så kunden kan bestille flere ting på én gang.
export function OrderForm({ product, colors }: { product: ProductForCart; colors: ColorChoice[] }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  // Én plass per farge produktet tillater. Plass 0 er hovedfargen.
  const slots = Math.min(3, Math.max(1, product.colorCount ?? 1));
  const [picked, setPicked] = useState<(number | null)[]>(() => Array(slots).fill(null));
  const chosen = picked.map((id) => colors.find((c) => c.id === id) ?? null);
  const color = chosen[0];
  const extra = chosen.slice(1).filter((c): c is ColorChoice => c != null);

  function pick(slot: number, id: number) {
    setPicked((p) => p.map((v, i) => (i === slot ? (v === id ? null : id) : v)));
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: qty,
      note: note.trim(),
      colorId: color?.id ?? null,
      colorName: color?.name ?? null,
      colorHex: color?.hex ?? null,
      extraColors: extra.map((c) => ({ id: c.id, name: c.name, hex: c.hex })),
    });
    setAdded(true);
    setQty(1);
    setNote("");
    setPicked(Array(slots).fill(null));
  }

  if (added) {
    return (
      <div className="order-done">
        <b className="with-icon"><Icon name="bag" /> Lagt i handlekurven</b>
        <p className="small-text muted">Vil du ha mer, kan du legge til flere ting før du sender bestillingen.</p>
        <Link href="/handlekurv" className="button small">Gå til handlekurven</Link>
        <button type="button" className="small secondary" onClick={() => setAdded(false)}>Legg til en til av denne</button>
        <Link href="/" className="button small secondary">Fortsett å handle</Link>
      </div>
    );
  }

  return (
    <form onSubmit={add} className="order-form">
      <div className="stepper" aria-label="Antall">
        <button type="button" className="small secondary" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Færre">−</button>
        <span>{qty} stk</span>
        <button type="button" className="small secondary" onClick={() => setQty(Math.min(MAX, qty + 1))} aria-label="Flere">+</button>
      </div>
      {/* Fargevalg: runde knapper i fargene Liam har, én rad per farge produktet tillater. Tomme farger er grå. */}
      {colors.length > 0 &&
        picked.map((selectedId, slot) => {
          const current = chosen[slot];
          const label = slots === 1 ? "Farge" : slot === 0 ? "Hovedfarge" : `Farge ${slot + 1}`;
          return (
            <fieldset key={slot} className="colors">
              <legend>
                {label} {current ? <b>· {current.name}</b> : <span className="muted">(valgfritt)</span>}
              </legend>
              <div className="color-chips">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`color-chip${c.id === selectedId ? " on" : ""}`}
                    style={{ ["--chip" as string]: colorFill(c.hex) }}
                    disabled={!c.inStock}
                    aria-pressed={c.id === selectedId}
                    aria-label={c.inStock ? `${label}: ${c.name}` : `${c.name} (tom)`}
                    title={c.inStock ? c.name : `${c.name} er tom`}
                    onClick={() => pick(slot, c.id)}
                  />
                ))}
              </div>
            </fieldset>
          );
        })}
      <label>
        Ønsker (valgfritt)
        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="For eksempel størrelse eller navn som skal stå på"
          maxLength={500}
        />
      </label>
      <button type="submit">
        <Icon name="bag" /> Legg i handlekurven · {kr(qty * product.price)}
      </button>
    </form>
  );
}
