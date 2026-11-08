"use client";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import { useActionState, useState, startTransition } from "react";
import { saveProductAction, type ProductFormState } from "@/app/product-actions";
import { shrinkImage } from "@/lib/shrinkImage";
import { ImagePicker } from "./ImagePicker";

type Initial = { id?: number; name: string; description: string | null; priceNok: number; costNok: number | null; available: boolean; colorCount?: number; imageUrl: string | null; imageUrl2?: string | null };

// Samme skjema brukes for nytt produkt (uten `product`) og for å endre et (med `product`).
// `wishId`: produktet lages fra et ønske i ønskeboksen. Feltene er da fylt ut fra ønsket.
// `categories`: alle kategoriene, `selected`: de produktet er med i nå.
export function ProductForm({
  product,
  wishId,
  categories = [],
  selected = [],
}: {
  product?: Initial;
  wishId?: number;
  categories?: { id: number; name: string }[];
  selected?: number[];
}) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProductAction, {});
  const [shrinking, setShrinking] = useState(false);
  const [colorCount, setColorCount] = useState(product?.colorCount ?? 1);

  // Før skjemaet sendes: bytt ut de store bildene med krympede kopier.
  async function submit(form: FormData) {
    for (const field of ["image", "image2"]) {
      const file = form.get(field);
      if (file instanceof File && file.size > 0) {
        setShrinking(true);
        try {
          form.set(field, await shrinkImage(file));
        } catch {
          // Klarer ikke nettleseren å krympe bildet, sender vi originalen.
        }
      }
    }
    setShrinking(false);
    startTransition(() => action(form));
  }

  const busy = pending || shrinking;
  return (
    <form noValidate action={submit} className="form">
      {product?.id != null && <input type="hidden" name="id" value={product.id} />}
      {wishId != null && <input type="hidden" name="wishId" value={wishId} />}
      <label>
        Navn
        <input name="name" defaultValue={product?.name} placeholder="Drage, 10 cm" required />
      </label>
      {/* To bilder: det første er hovedbildet, det andre er valgfritt. */}
      <ImageSlot name="image" removeName="removeImage" label="Bilde 1 (hovedbilde)" current={product?.id != null ? product.imageUrl : null} initial={product?.imageUrl ?? null} />
      <ImageSlot name="image2" removeName="removeImage2" label="Bilde 2 (valgfritt)" current={product?.imageUrl2 ?? null} initial={product?.imageUrl2 ?? null} />
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
      {/* Farger per print: tre knapper i stedet for nettleserens nedtrekksliste. */}
      <fieldset className="choice">
        <legend>Farger per print</legend>
        <input type="hidden" name="colorCount" value={colorCount} />
        <div className="seg">
          {[1, 2, 3].map((n) => (
            <button key={n} type="button" className={colorCount === n ? "on" : ""} aria-pressed={colorCount === n} onClick={() => setColorCount(n)}>
              {n === 1 ? "1 farge" : `${n} farger`}
            </button>
          ))}
        </div>
        <span className="muted small-text">{colorCount === 1 ? "Kunden velger én farge." : `Kunden velger en hovedfarge og ${colorCount - 1} til.`}</span>
      </fieldset>
      {/* Kategorier: kryss av for én eller flere. Alle avkrysningsboksene heter «category». */}
      {categories.length > 0 && (
        <fieldset className="cat-pick">
          <legend>Kategorier</legend>
          {categories.map((c) => (
            <label key={c.id} className="cat-opt">
              <input type="checkbox" name="category" value={c.id} defaultChecked={selected.includes(c.id)} />
              <span>{c.name}</span>
            </label>
          ))}
        </fieldset>
      )}
      <label className="check">
        <input type="checkbox" name="available" defaultChecked={product?.available ?? true} />
        Vis under Modeller
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <div className="row-buttons left">
        <button type="submit" disabled={busy}>{shrinking ? "Krymper bilde …" : pending ? "Lagrer …" : "Lagre produkt"}</button>
        <Link href="/admin/produkter" className="button secondary">Avbryt</Link>
      </div>
    </form>
  );
}

// Ett bildefelt med forhåndsvisning. `current` er bildet som er lagret nå, og da vises «Fjern bilde».
function ImageSlot({ name, removeName, label, current, initial }: { name: string; removeName: string; label: string; current: string | null; initial: string | null }) {
  // Forhåndsvisning: det gamle bildet, eller det nye som akkurat er valgt.
  const [preview, setPreview] = useState<string | null>(initial);
  return (
    <div className="image-field">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview ? <img src={preview} alt="" className="product-img" /> : <div className="product-img empty" aria-hidden><Icon name="cube" size={40} /></div>}
      <ImagePicker
        name={name}
        label={label}
        onPick={(f) => {
          if (f) setPreview(URL.createObjectURL(f)); // viser bildet med en gang, før det lastes opp
        }}
      />
      {current && (
        <label className="check">
          <input type="checkbox" name={removeName} />
          Fjern bilde
        </label>
      )}
    </div>
  );
}
