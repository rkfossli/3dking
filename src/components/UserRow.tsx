"use client";
import { ConfirmButton } from "./ConfirmButton";
import { useState, useTransition } from "react";
import { deleteUserAction, renameUserAction, resetPinAction, setActiveAction } from "@/app/admin-actions";

type Props = { id: number; displayName: string; username: string; role: string; active: boolean; isMe: boolean };

export function UserRow({ id, displayName, username, role, active, isMe }: Props) {
  const [pin, setPin] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Redigeringsmodus: to felt og Lagre/Avbryt i stedet for vanlig visning.
  if (editing) {
    return (
      <li className="user-row">
        <form
          className="edit-form"
          action={(form) =>
            start(async () => {
              const res = await renameUserAction(id, String(form.get("displayName")), String(form.get("username")));
              if (res.error) setError(res.error);
              else {
                setError(null);
                setEditing(false);
              }
            })
          }
        >
          <input name="displayName" defaultValue={displayName} aria-label="Navn" required />
          <input name="username" defaultValue={username} aria-label="Brukernavn" autoCapitalize="none" required />
          {error && <p className="error">{error}</p>}
          <div className="row-buttons">
            <button type="submit" className="small" disabled={pending}>Lagre</button>
            <button type="button" className="small secondary" onClick={() => { setEditing(false); setError(null); }}>Avbryt</button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`user-row${active ? "" : " inactive"}`}>
      <div>
        <b>{displayName}</b> <span className="muted">@{username}</span>
        {role === "admin" && <span className="tag">Admin</span>}
        {!active && <span className="tag">Slått av</span>}
        {pin && <p className="pin">Ny PIN: {pin}</p>}
        {error && <p className="error">{error}</p>}
      </div>
      <div className="row-buttons">
        <button type="button" className="small secondary" onClick={() => setEditing(true)}>Endre</button>
        {!isMe && (
          <>
            {/* Ny PIN gjør den gamle ugyldig med en gang, så den spør først (som Slett). */}
            <ConfirmButton
              className="small secondary"
              confirmClassName="small"
              disabled={pending}
              question={`Lage ny PIN til ${displayName}? Den gamle slutter å virke med en gang, og ${displayName} blir logget ut.`}
              confirmLabel="Ja, lag ny PIN"
              onConfirm={() => start(async () => setPin((await resetPinAction(id)).pin))}
            >
              Ny PIN
            </ConfirmButton>
            <button type="button" className="small secondary" disabled={pending} onClick={() => start(() => setActiveAction(id, !active))}>
              {active ? "Slå av" : "Slå på"}
            </button>
            {/* ConfirmButton spør «Er du sikker?» i appen først. Sletting kan ikke angres. */}
            <ConfirmButton
              disabled={pending}
              question={`Slette ${displayName} for godt? Dette kan ikke angres.`}
              confirmLabel="Ja, slett"
              onConfirm={() => start(async () => setError((await deleteUserAction(id)).error ?? null))}
            >
              Slett
            </ConfirmButton>
          </>
        )}
      </div>
    </li>
  );
}
