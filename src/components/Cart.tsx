"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { placeCartAction } from "@/app/order-actions";
import { kr } from "@/lib/format";
import { cartTotal, clearCart, removeLine, setQuantity, useCart } from "./cart";
import { Icon } from "./Icon";
import { ProductImage } from "./ProductImage";
import { PushAsk } from "./PushAsk";
import { Sparks } from "./Sparks";
import { ColorLine } from "./ColorLine";

// Listen i handlekurven: endre antall, fjerne linjer og sende alt som én bestilling.
export function Cart() {
  const lines = useCart();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);

  function send() {
    setError("");
    start(async () => {
      const res = await placeCartAction(lines.map((l) => ({ productId: l.productId, quantity: l.quantity, note: l.note, colorId: l.colorId, extraColorIds: (l.extraColors ?? []).map((c) => c.id) })));
      if (res.error) return setError(res.error);
      clearCart();
      setDone(res.orderNumber ?? "");
    });
  }

  if (done !== null) {
    return (
      <div className="order-done celebrate card">
        <Sparks />
        <b className="with-icon"><Icon name="check" /> Bestilt!</b>
        {done && <p className="order-no-big">Ordrenummer #{done}</p>}
        <p className="small-text muted">3DKing har fått beskjed. Du ser hvordan det går under «Mine».</p>
        <PushAsk />
        <Link href="/mine" className="button small">Se bestillingen</Link>
        <Link href="/" className="button small secondary">Tilbake til modellene</Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="card">
        <p className="muted">Handlekurven er tom.</p>
        <Link href="/" className="button empty-cta">Finn noe du liker blant modellene</Link>
      </div>
    );
  }

  return (
    <>
      <ul className="order-list cart-list">
        {lines.map((l) => (
          <li key={l.id} className="card cart-line">
            <div className="thumb">
              <ProductImage url={l.imageUrl} alt={l.name} small />
            </div>
            <div className="cart-info">
              <b>{l.name}</b>
              <ColorLine as="span" main={l.colorName ? { name: l.colorName, hex: l.colorHex ?? "" } : null} extra={l.extraColors ?? []} />
              {l.note && <span className="small-text muted">«{l.note}»</span>}
              <div className="cart-row">
                <div className="stepper mini" aria-label="Antall">
                  <button type="button" className="small secondary" onClick={() => setQuantity(l.id, l.quantity - 1)} aria-label="Færre">−</button>
                  <span>{l.quantity}</span>
                  <button type="button" className="small secondary" onClick={() => setQuantity(l.id, l.quantity + 1)} aria-label="Flere">+</button>
                </div>
                <b className="cart-sum">{kr(l.quantity * l.price)}</b>
              </div>
            </div>
            <button type="button" className="icon-btn" onClick={() => removeLine(l.id)} aria-label={`Fjern ${l.name}`}>
              <Icon name="close" />
            </button>
          </li>
        ))}
      </ul>
      <div className="card cart-total">
        <p className="order-price">
          <span>Til sammen</span> <b>{kr(cartTotal(lines))}</b>
        </p>
        <p className="muted small-text">Prisen dekker bare filament og strøm. Du betaler 3DKing når du får tingene.</p>
        {error && <p className="error small-text">{error}</p>}
        <button type="button" onClick={send} disabled={pending}>
          {pending ? "Sender …" : "Send bestilling"}
        </button>
      </div>
    </>
  );
}
