"use client";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { addWishAction, type WishState } from "@/app/wish-actions";
import { shrinkImage } from "@/lib/shrinkImage";

// Skjemaet i ønskeboksen: hva du ønsker deg, en lenke (f.eks. MakerWorld) og et bilde.
export function WishForm() {
  const [state, action, pending] = useActionState<WishState, FormData>(addWishAction, {});
  const [shrinking, setShrinking] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  // Bildet krympes i nettleseren før det sendes, akkurat som produktbildene.
  async function submit(data: FormData) {
    const file = data.get("image");
    if (file instanceof File && file.size > 0) {
      setShrinking(true);
      try {
        data.set("image", await shrinkImage(file));
      } catch {
        // Går det ikke, sendes originalen.
      }
      setShrinking(false);
    }
    startTransition(() => action(data));
  }

  return (
    <form ref={form} action={submit} className="form">
      <label>
        Hva ønsker du deg?
        <textarea name="text" rows={3} maxLength={500} placeholder="For eksempel en Pokémon-figur, 8 cm høy, i gult" required />
      </label>
      <label>
        Lenke (valgfritt)
        <input name="link" type="url" inputMode="url" placeholder="https://makerworld.com/..." />
      </label>
      <label>
        Bilde (valgfritt)
        <input name="image" type="file" accept="image/*" />
      </label>
      {state.error && <p className="error small-text">{state.error}</p>}
      {state.ok && <p className="ok small-text">Ønsket er sendt. 3DKing svarer så fort som mulig.</p>}
      <button type="submit" disabled={pending || shrinking}>{shrinking ? "Krymper bilde …" : pending ? "Sender …" : "Send ønsket"}</button>
    </form>
  );
}
