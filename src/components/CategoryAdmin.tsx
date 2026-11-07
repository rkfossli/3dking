"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addCategoryAction, deleteCategoryAction, moveCategoryAction, renameCategoryAction, type CategoryState } from "@/app/category-actions";
import { ConfirmButton } from "./ConfirmButton";

// Skjemaet for en ny kategori.
export function CategoryForm() {
  const [state, action, pending] = useActionState<CategoryState, FormData>(addCategoryAction, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="chat-form">
      <input name="name" placeholder="For eksempel Figurer" maxLength={30} aria-label="Navn på kategorien" required />
      <button type="submit" className="small" disabled={pending}>Legg til</button>
      {state.error && <p className="error small-text">{state.error}</p>}
    </form>
  );
}

// Én kategori: navn (kan endres), flytt opp/ned og slett.
export function CategoryRow({ id, name, count, first, last }: { id: number; name: string; count: number; first: boolean; last: boolean }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="user-row">
      {editing ? (
        <form
          className="chat-form grow"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await renameCategoryAction(id, value);
              setError(res.error ?? null);
              if (!res.error) setEditing(false);
            });
          }}
        >
          <input value={value} onChange={(e) => setValue(e.target.value)} maxLength={30} aria-label="Nytt navn" autoFocus />
          <button type="submit" className="small" disabled={pending}>Lagre</button>
        </form>
      ) : (
        <div>
          <b>{name}</b>
          <p className="muted small-text">{count === 1 ? "1 produkt" : `${count} produkter`}</p>
        </div>
      )}
      <div className="row-buttons">
        <button type="button" className="small secondary" disabled={pending || first} onClick={() => start(() => moveCategoryAction(id, -1))} aria-label="Flytt opp">↑</button>
        <button type="button" className="small secondary" disabled={pending || last} onClick={() => start(() => moveCategoryAction(id, 1))} aria-label="Flytt ned">↓</button>
        {!editing && <button type="button" className="small secondary" onClick={() => setEditing(true)}>Endre navn</button>}
        <ConfirmButton
          disabled={pending}
          question={`Slette kategorien «${name}»? Produktene blir værende i butikken.`}
          confirmLabel="Ja, slett"
          onConfirm={() => start(() => deleteCategoryAction(id))}
        >
          Slett
        </ConfirmButton>
      </div>
      {error && <p className="error small-text">{error}</p>}
    </li>
  );
}
