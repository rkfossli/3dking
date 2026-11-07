"use client";
import { Icon } from "@/components/Icon";
import { useActionState } from "react";
import { changePinAction, type PinChangeState } from "@/app/auth-actions";

export function ChangePinForm() {
  const [state, action, pending] = useActionState<PinChangeState, FormData>(changePinAction, {});
  if (state.ok) return <p className="ok with-icon"><Icon name="check" /> PIN-en er byttet</p>;
  const pinInput = { type: "password", inputMode: "numeric" as const, pattern: "\\d{4}", maxLength: 4, required: true };
  return (
    <form noValidate action={action} className="form">
      <label>
        Nåværende PIN
        <input name="oldPin" autoComplete="current-password" {...pinInput} />
      </label>
      <label>
        Ny PIN (4 sifre)
        <input name="pin" autoComplete="new-password" {...pinInput} />
      </label>
      <label>
        Ny PIN en gang til
        <input name="pin2" autoComplete="new-password" {...pinInput} />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Lagrer …" : "Bytt PIN"}</button>
    </form>
  );
}
