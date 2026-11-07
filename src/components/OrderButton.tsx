"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { placeOrderAction, type OrderState } from "@/app/order-actions";
import { kr } from "@/lib/format";

const MAX = 20;

// «Bestill»-knappen på et produktkort. Trykk, og et lite skjema med antall og kommentar folder seg ut.
export function OrderButton({ productId, price }: { productId: number; price: number }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [state, action, pending] = useActionState<OrderState, FormData>(placeOrderAction, {});

  if (state.ok) {
    return (
      <p className="ok small-text">
        Bestilt! ✅ <Link href="/mine">Se bestillinger</Link>
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" className="small order-btn" onClick={() => setOpen(true)}>
        Bestill
      </button>
    );
  }

  return (
    <form action={action} className="order-form">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={qty} />
      <div className="stepper" aria-label="Antall">
        <button type="button" className="small secondary" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Færre">−</button>
        <span>{qty} stk</span>
        <button type="button" className="small secondary" onClick={() => setQty(Math.min(MAX, qty + 1))} aria-label="Flere">+</button>
      </div>
      <textarea name="note" rows={2} placeholder="Kommentar (farge, ønsker …)" maxLength={500} />
      {state.error && <p className="error small-text">{state.error}</p>}
      <button type="submit" className="small" disabled={pending}>
        {pending ? "Bestiller …" : `Bestill for ${kr(qty * price)}`}
      </button>
      <button type="button" className="small secondary" onClick={() => setOpen(false)}>Avbryt</button>
    </form>
  );
}
