"use client";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import { useState } from "react";
import { addToCart } from "./cart";
import { kr } from "@/lib/format";

const MAX = 20;

export type ProductForCart = { id: number; name: string; price: number; imageUrl: string | null };
export type ColorChoice = { id: number; name: string; hex: string; inStock: boolean };

// Skjemaet på produktsiden: antall, ønsker og «Legg i handlekurven».
// Selve bestillingen sendes fra handlekurven, så kunden kan bestille flere ting på én gang.
export function OrderForm({ product, colors }: { product: ProductForCart; colors: ColorChoice[] }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const [colorId, setColorId] = useState<number | null>(null);
  const color = colors.find((c) => c.id === colorId) ?? null;

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
    });
    setAdded(true);
    setQty(1);
    setNote("");
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
      {/* Fargevalg: runde knapper i fargene Liam har. Tomme farger er grå og kan ikke velges. */}
      {colors.length > 0 && (
        <fieldset className="colors">
          <legend>Farge {color ? <b>· {color.name}</b> : <span className="muted">(valgfritt)</span>}</legend>
          <div className="color-chips">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`color-chip${c.id === colorId ? " on" : ""}`}
                style={{ ["--chip" as string]: c.hex }}
                disabled={!c.inStock}
                aria-pressed={c.id === colorId}
                aria-label={c.inStock ? c.name : `${c.name} (tom)`}
                title={c.inStock ? c.name : `${c.name} er tom`}
                onClick={() => setColorId(c.id === colorId ? null : c.id)}
              />
            ))}
          </div>
        </fieldset>
      )}
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
