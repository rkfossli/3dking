"use client";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import { useActionState, useState } from "react";
import { placeOrderAction, type OrderState } from "@/app/order-actions";
import { kr } from "@/lib/format";
import { PushAsk } from "./PushAsk";

const MAX = 20;

// Bestillingsskjemaet på produktsiden: antall, ønsker og «Bestill for …».
// «Bestill flere» etter en bestilling lager et helt nytt skjema: key gjør at React starter på nytt.
export function OrderForm({ productId, price }: { productId: number; price: number }) {
  const [round, setRound] = useState(0);
  return <OrderRound key={round} productId={productId} price={price} onAgain={() => setRound(round + 1)} />;
}

function OrderRound({ productId, price, onAgain }: { productId: number; price: number; onAgain: () => void }) {
  const [qty, setQty] = useState(1);
  const [state, action, pending] = useActionState<OrderState, FormData>(placeOrderAction, {});

  if (state.ok) {
    return (
      <div className="order-done">
        <b className="with-icon"><Icon name="check" /> Bestilt!</b>
        <p className="small-text muted">3DKing har fått beskjed. Du ser hvordan det går under «Mine bestillinger».</p>
        <PushAsk />
        <Link href="/mine" className="button small">Se bestillingen</Link>
        <button type="button" className="small secondary" onClick={onAgain}>Bestill flere</button>
      </div>
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
      <label>
        Ønsker (valgfritt)
        <textarea name="note" rows={4} placeholder="For eksempel farge, størrelse eller navn som skal stå på" maxLength={500} />
      </label>
      {state.error && <p className="error small-text">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Bestiller …" : `Bestill for ${kr(qty * price)}`}
      </button>
    </form>
  );
}
