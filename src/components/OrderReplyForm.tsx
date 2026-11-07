"use client";
import { useActionState, useState } from "react";
import { replyToOrderAction, type ReplyState } from "@/app/order-actions";

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
      <label>
        Svar
        <select name="approval" value={choice} onChange={(e) => setChoice(e.target.value)}>
          <option value="">Bare beskjed (ikke godkjent ennå)</option>
          <option value="godkjent">Godkjent</option>
          <option value="endringer">Godkjent med endringer</option>
        </select>
      </label>
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
