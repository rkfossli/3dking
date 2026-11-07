"use client";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { addFilamentAction, deleteFilamentAction, setInStockAction, type FilamentState } from "@/app/filament-actions";
import { ConfirmButton } from "./ConfirmButton";

// Skjemaet for en ny farge: navn og en fargevelger.
export function FilamentForm() {
  const [state, action, pending] = useActionState<FilamentState, FormData>(addFilamentAction, {});
  const form = useRef<HTMLFormElement>(null);
  // Tøm skjemaet når fargen er lagret, så det er klart for neste.
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="form filament-form">
      <div className="filament-fields">
        <label className="color-pick">
          Farge
          <input type="color" name="hex" defaultValue="#0df762" />
        </label>
        <label>
          Navn
          <input name="name" placeholder="For eksempel Rød" maxLength={40} required />
        </label>
      </div>
      {state.error && <p className="error small-text">{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Lagrer …" : "Legg til farge"}</button>
    </form>
  );
}

// Én farge i listen: prøve, navn, På lager/Tom og Slett.
export function FilamentRow({ id, name, hex, inStock }: { id: number; name: string; hex: string; inStock: boolean }) {
  const [pending, start] = useTransition();
  return (
    <li className={`user-row${inStock ? "" : " inactive"}`}>
      <div className="thumb-row">
        <span className="swatch big" style={{ background: hex }} />
        <div>
          <b>{name}</b>
          {!inStock && <span className="tag">tom</span>}
        </div>
      </div>
      <div className="row-buttons">
        <button type="button" className="small secondary" disabled={pending} onClick={() => start(() => setInStockAction(id, !inStock))}>
          {inStock ? "Tom" : "På lager"}
        </button>
        <ConfirmButton
          disabled={pending}
          question={`Slette fargen «${name}»? Gamle bestillinger beholder fargen.`}
          confirmLabel="Ja, slett"
          onConfirm={() => start(() => deleteFilamentAction(id))}
        >
          Slett
        </ConfirmButton>
      </div>
    </li>
  );
}
