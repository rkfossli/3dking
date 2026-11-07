"use client";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import { useActionState, useState, startTransition } from "react";
import { saveProductAction, type ProductFormState } from "@/app/product-actions";
import { shrinkImage } from "@/lib/shrinkImage";

type Initial = { id: number; name: string; description: string | null; priceNok: number; costNok: number | null; available: boolean; imageUrl: string | null };

// Samme skjema brukes for nytt produkt (uten `product`) og for å endre et (med `product`).
export function ProductForm({ product }: { product?: Initial }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProductAction, {});
  // Forhåndsvisning av bildet: det gamle bildet, eller det nye som akkurat er valgt.
  const [preview, setPreview] = useState<string | null>(product?.imageUrl ?? null);
  const [shrinking, setShrinking] = useState(false);

  // Før skjemaet sendes: bytt ut det store bildet med en krympet kopi.
  async function submit(form: FormData) {
    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      setShrinking(true);
      try {
        form.set("image", await shrinkImage(file));
      } catch {
        // Klarer ikke nettleseren å krympe bildet, sender vi originalen.
      }
      setShrinking(false);
    }
    startTransition(() => action(form));
  }

  const busy = pending || shrinking;
  return (
    <form action={submit} className="form">
      {product && <input type="hidden" name="id" value={product.id} />}
      <label>
        Navn
        <input name="name" defaultValue={product?.name} placeholder="Drage, 10 cm" required />
      </label>
      <div className="image-field">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img src={preview} alt="" className="product-img" /> : <div className="product-img empty" aria-hidden><Icon name="cube" size={40} /></div>}
        <label>
          Bilde
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f)); // viser bildet med en gang, før det lastes opp
            }}
          />
        </label>
        {product?.imageUrl && (
          <label className="check">
            <input type="checkbox" name="removeImage" />
            Fjern bilde
          </label>
        )}
      </div>
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
        <button type="submit" disabled={busy}>{shrinking ? "Krymper bilde …" : pending ? "Lagrer …" : "Lagre produkt"}</button>
        <Link href="/admin/produkter" className="button secondary">Avbryt</Link>
      </div>
    </form>
  );
}
