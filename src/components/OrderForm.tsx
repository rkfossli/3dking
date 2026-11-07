"use client";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import { useState } from "react";
import { addToCart } from "./cart";
import { kr } from "@/lib/format";

const MAX = 20;

export type ProductForCart = { id: number; name: string; price: number; imageUrl: string | null };

// Skjemaet på produktsiden: antall, ønsker og «Legg i handlekurven».
// Selve bestillingen sendes fra handlekurven, så kunden kan bestille flere ting på én gang.
export function OrderForm({ product }: { product: ProductForCart }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  function add(e: React.FormEvent) {
    e.preventDefault();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: qty,
      note: note.trim(),
      colorId: null,
      colorName: null,
      colorHex: null,
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
