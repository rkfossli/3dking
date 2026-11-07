"use client";
import { useActionState } from "react";
import { createUserAction, type PinState } from "@/app/admin-actions";

export function CreateUserForm() {
  const [state, action, pending] = useActionState<PinState, FormData>(createUserAction, {});
  return (
    <form action={action} className="form">
      <label>
        Navn
        <input name="displayName" placeholder="Ola Nordmann" required />
      </label>
      <label>
        Brukernavn
        <input name="username" placeholder="ola" autoCapitalize="none" required />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      {state.created && (
        <div className="pin-box">
          <p>
            Bruker laget for <b>{state.created.name}</b>. Gi denne beskjeden videre:
          </p>
          <p className="pin">
            Brukernavn: {state.created.username}
            <br />
            PIN: {state.created.pin}
          </p>
          <p className="muted">PIN-en vises bare nå. Glemmer personen den, trykk «Ny PIN».</p>
        </div>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Lager …" : "Lag bruker"}
      </button>
    </form>
  );
}
