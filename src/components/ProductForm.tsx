"use client";
import Link from "next/link";
import { useActionState } from "react";
import { saveProductAction, type ProductFormState } from "@/app/product-actions";

type Initial = { id: number; name: string; description: string | null; priceNok: number; costNok: number | null; available: boolean };

// Samme skjema brukes for nytt produkt (uten `product`) og for å endre et (med `product`).
export function ProductForm({ product }: { product?: Initial }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProductAction, {});
  return (
    <form action={action} className="form">
      {product && <input type="hidden" name="id" value={product.id} />}
      <label>
        Navn
        <input name="name" defaultValue={product?.name} placeholder="Drage, 10 cm" required />
      </label>
      <label>
        Beskrivelse
        <textarea name="description" defaultValue={product?.description ?? ""} rows={3} placeholder="Farge, størrelse, materiale …" />
      </label>
      <div className="two">
        <label>
          Pris (kr)
          <input name="price" inputMode="numeric" defaultValue={product?.priceNok} placeholder="50" required />
        </label>
        <label>
          Filamentkost (kr)
          <input name="cost" inputMode="numeric" defaultValue={product?.costNok ?? ""} placeholder="35" />
        </label>
      </div>
      <p className="muted small-text">Filamentkost vises bare for deg. Prisen skal bare dekke filament og strøm.</p>
      <label className="check">
        <input type="checkbox" name="available" defaultChecked={product?.available ?? true} />
        Vis i butikken
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <div className="row-buttons left">
        <button type="submit" disabled={pending}>{pending ? "Lagrer …" : "Lagre produkt"}</button>
        <Link href="/admin/produkter" className="button secondary">Avbryt</Link>
      </div>
    </form>
  );
}
