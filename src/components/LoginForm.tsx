"use client";
// "use client" = denne komponenten kjører i nettleseren, så den kan vise feilmeldinger uten å laste siden på nytt.
import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/auth-actions";

export function LoginForm() {
  // useActionState kobler skjemaet til server-handlingen og gir oss svaret (state) og om den jobber (pending).
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form noValidate action={action} className="form">
      <label>
        Brukernavn
        <input name="username" autoComplete="username" autoCapitalize="none" required />
      </label>
      <label>
        PIN
        <input name="pin" type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="current-password" required />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Logger inn …" : "Logg inn"}
      </button>
    </form>
  );
}
