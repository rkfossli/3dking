"use client";
import { useActionState, useState } from "react";
import { replyToOrderAction, type ReplyState } from "@/app/order-actions";

// De tre svarene Liam kan gi, med en forklaring på hva kunden ser.
const CHOICES = [
  { value: "", label: "Bare en beskjed", help: "Ikke godkjent ennå. Kunden ser bare beskjeden din, for eksempel et spørsmål." },
  { value: "godkjent", label: "Godkjent", help: "Du lager den slik kunden ba om." },
  { value: "endringer", label: "Godkjent med endringer", help: "Du lager den, men litt annerledes. Skriv hva som endres." },
];

// Liams svar på en bestilling: godkjenning, beskjed og planlagt levering.
// Skjemaet er lukket til han trykker «Svar» / «Endre svar».
export function OrderReplyForm({
  id,
  userName,
  approval,
  reply,
  deliveryPlan,
  status,
}: {
  id: number;
  userName: string;
  approval: string | null;
  reply: string | null;
  deliveryPlan: string | null;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  // Feltene styres med state, så det du skrev ikke forsvinner hvis lagringen gir en feilmelding.
  const [choice, setChoice] = useState(approval ?? "");
  const [text, setText] = useState(reply ?? "");
  const [plan, setPlan] = useState(deliveryPlan ?? "");
  const [state, action, pending] = useActionState(async (prev: ReplyState, form: FormData) => {
    const res = await replyToOrderAction(prev, form);
    if (res.ok) setOpen(false);
    return res;
  }, {});

  if (!open) {
    return (
      <button type="button" className="small secondary" onClick={() => setOpen(true)}>
        {approval || reply || deliveryPlan ? "Endre svar" : status === "laget" ? "Svar / planlagt levering" : "Svar"}
      </button>
    );
  }

  return (
    <form action={action} className="reply-form">
      <input type="hidden" name="orderId" value={id} />
      {/* Tre valg som knapper i appens farger (i stedet for en nedtrekksliste, som bruker telefonens farger). */}
      <input type="hidden" name="approval" value={choice} />
      <fieldset className="choice-list">
        <legend>Svar på bestillingen</legend>
        {CHOICES.map((c) => (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={choice === c.value}
            className={`choice ${choice === c.value ? "on" : ""}`}
            onClick={() => setChoice(c.value)}
          >
            <b>{c.label}</b>
            <span className="small-text muted">{c.help}</span>
          </button>
        ))}
      </fieldset>
      <label>
        Beskjed til {userName}
        <textarea name="reply" rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="F.eks. «Blir blå i stedet for rød, tom for rødt filament.»" />
      </label>
      <label>
        Planlagt levering
        <input name="deliveryPlan" maxLength={200} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="F.eks. «Leveres på skolen på mandag»" />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <div className="row-buttons left">
        <button type="submit" className="small" disabled={pending}>{pending ? "Lagrer …" : "Lagre svar"}</button>
        <button type="button" className="small secondary" onClick={() => setOpen(false)}>Lukk</button>
      </div>
    </form>
  );
}
