"use client";
// "use client" = denne komponenten kjører i nettleseren, så den kan vise feilmeldinger uten å laste siden på nytt.
import { useActionState, useEffect } from "react";
import { loginAction, type FormState } from "@/app/auth-actions";
import { cancelIntro, primeIntro } from "@/components/IntroPlayer";

export function LoginForm() {
  // useActionState kobler skjemaet til server-handlingen og gir oss svaret (state) og om den jobber (pending).
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  // Feil brukernavn eller PIN: ta bort det svarte introteppet igjen, så feilmeldingen synes.
  useEffect(() => {
    if (state.error) cancelIntro();
  }, [state]);
  return (
    // onSubmit skjer mens trykket pågår. Da får introen lov til å spille lyd senere (se IntroPlayer).
    <form noValidate action={action} onSubmit={primeIntro} className="form">
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
