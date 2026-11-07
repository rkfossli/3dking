"use client";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import { useActionState, useState } from "react";
import { placeOrderAction, type OrderState } from "@/app/order-actions";
import { kr } from "@/lib/format";
import { PushAsk } from "./PushAsk";

const MAX = 20;

// «Bestill»-knappen på et produktkort. Trykk, og et lite skjema med antall og kommentar folder seg ut.
// «Bestill flere» etter en bestilling lager et helt nytt skjema: key gjør at React starter på nytt.
export function OrderButton({ productId, price }: { productId: number; price: number }) {
  const [round, setRound] = useState(0);
  return <OrderForm key={round} productId={productId} price={price} onAgain={() => setRound(round + 1)} />;
}

function OrderForm({ productId, price, onAgain }: { productId: number; price: number; onAgain: () => void }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [state, action, pending] = useActionState<OrderState, FormData>(placeOrderAction, {});

  if (state.ok) {
    return (
      <div className="order-done">
        <b className="with-icon"><Icon name="check" /> Bestilt!</b>
        <p className="small-text muted">Liam har fått beskjed. Du ser hvordan det går under «Mine bestillinger».</p>
        <PushAsk />
        <Link href="/mine" className="button small">Se bestillingen</Link>
        <button type="button" className="small secondary" onClick={onAgain}>Bestill flere</button>
      </div>
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
      <textarea name="note" rows={2} placeholder="Ønsker? For eksempel farge eller størrelse" aria-label="Ønsker" maxLength={500} />
      {state.error && <p className="error small-text">{state.error}</p>}
      <button type="submit" className="small" disabled={pending}>
        {pending ? "Bestiller …" : `Bestill for ${kr(qty * price)}`}
      </button>
      <button type="button" className="small secondary" onClick={() => setOpen(false)}>Avbryt</button>
    </form>
  );
}
