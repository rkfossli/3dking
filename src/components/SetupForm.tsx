"use client";
import { useActionState } from "react";
import { setupAction, type FormState } from "@/app/auth-actions";

export function SetupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(setupAction, {});
  return (
    <form noValidate action={action} className="form">
      <label>
        Navnet ditt
        <input name="displayName" placeholder="Liam" required />
      </label>
      <label>
        Brukernavn
        <input name="username" placeholder="liam" autoCapitalize="none" required />
      </label>
      <label>
        Velg PIN (4 sifre)
        <input name="pin" type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} required />
      </label>
      <label>
        Skriv PIN en gang til
        <input name="pin2" type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} required />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Lager …" : "Lag admin-konto"}
      </button>
    </form>
  );
}
