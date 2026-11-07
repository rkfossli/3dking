"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { deleteWishAction, replyWishAction, type WishState } from "@/app/wish-actions";
import { ConfirmButton } from "./ConfirmButton";

// Kunden kan trekke tilbake et ønske som 3DKing ikke har svart på.
export function DeleteWish({ id, label = "Trekk tilbake" }: { id: number; label?: string }) {
  const [pending, start] = useTransition();
  return (
    <ConfirmButton disabled={pending} question="Slette ønsket?" confirmLabel="Ja, slett" onConfirm={() => start(() => deleteWishAction(id))}>
      {label}
    </ConfirmButton>
  );
}

// Liams svar på et ønske: Ja (med pris) eller Nei, og en beskjed. Etter et ja kan han lage et produkt av ønsket.
export function WishReply({ id, status, price, reply, productId }: { id: number; status: string; price: number | null; reply: string | null; productId: number | null }) {
  const [open, setOpen] = useState(status === "ny");
  const [choice, setChoice] = useState(status === "nei" ? "nei" : "ja");
  const [state, action, pending] = useActionState(async (prev: WishState, form: FormData) => {
    const res = await replyWishAction(prev, form);
    if (res.ok) setOpen(false);
    return res;
  }, {});

  if (!open) {
    return (
      <div className="row-buttons left">
        <button type="button" className="small secondary" onClick={() => setOpen(true)}>Endre svar</button>
        {status === "ja" &&
          (productId ? (
            <Link href={`/produkt/${productId}`} className="button small secondary">Se produktet</Link>
          ) : (
            <Link href={`/admin/produkter/ny?onske=${id}`} className="button small">Lag produkt</Link>
          ))}
        <DeleteWish id={id} label="Slett" />
      </div>
    );
  }

  return (
    <form noValidate action={action} className="reply-form">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={choice} />
      <fieldset className="choice-list">
        <legend>Kan du lage dette?</legend>
        <button type="button" role="radio" aria-checked={choice === "ja"} className={`choice ${choice === "ja" ? "on" : ""}`} onClick={() => setChoice("ja")}>
          <b>Ja</b>
          <span className="small-text muted">Skriv en pris. Etterpå kan du lage et produkt av ønsket.</span>
        </button>
        <button type="button" role="radio" aria-checked={choice === "nei"} className={`choice ${choice === "nei" ? "on" : ""}`} onClick={() => setChoice("nei")}>
          <b>Nei</b>
          <span className="small-text muted">For eksempel for stort, for vanskelig eller lisensen tillater det ikke.</span>
        </button>
      </fieldset>
      {choice === "ja" && (
        <label>
          Pris (kr, filament og strøm)
          <input name="price" inputMode="numeric" defaultValue={price ?? ""} placeholder="50" required />
        </label>
      )}
      <label>
        Beskjed (valgfritt)
        <textarea name="reply" rows={2} maxLength={500} defaultValue={reply ?? ""} placeholder="F.eks. «Tar ca. en uke»" />
      </label>
      {state.error && <p className="error small-text">{state.error}</p>}
      <div className="row-buttons left">
        <button type="submit" className="small" disabled={pending}>{pending ? "Lagrer …" : "Lagre svar"}</button>
        {status !== "ny" && <button type="button" className="small secondary" onClick={() => setOpen(false)}>Lukk</button>}
      </div>
    </form>
  );
}
