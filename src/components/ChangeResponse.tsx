"use client";
import { useActionState, useState } from "react";
import { respondToChangesAction, type ResponseState } from "@/app/order-actions";
import { CUSTOMER_RESPONSE_LABEL } from "@/lib/format";
import { CancelMyOrder } from "./OrderActions";

// Når 3DKing har godkjent med endringer, kan kunden svare her:
// godta endringene, si at de ikke er ønsket (med en kommentar), eller avbryte bestillingen.
export function ChangeResponse({
  id,
  status,
  response,
  note,
}: {
  id: number;
  status: string;
  response: string | null;
  note: string | null;
}) {
  // «choosing» er true mens kunden velger. Har kunden svart før, vises svaret til de trykker «Endre svaret».
  const [choosing, setChoosing] = useState(response == null);
  const [declining, setDeclining] = useState(false);
  const [state, action, pending] = useActionState(async (prev: ResponseState, form: FormData) => {
    const res = await respondToChangesAction(prev, form);
    if (res.ok) {
      setChoosing(false);
      setDeclining(false);
    }
    return res;
  }, {});

  if (!choosing && response) {
    return (
      <div className={`customer-response ${response}`}>
        <p className="small-text">
          <b>Ditt svar:</b> {CUSTOMER_RESPONSE_LABEL[response]}
          {note && <> · «{note}»</>}
        </p>
        <button type="button" className="small secondary" onClick={() => setChoosing(true)}>
          Endre svaret
        </button>
      </div>
    );
  }

  return (
    <div className="customer-response asking">
      <p className="small-text">
        <b>Er endringene greie for deg?</b>
      </p>
      {!declining ? (
        <div className="row-buttons left">
          <form action={action}>
            <input type="hidden" name="orderId" value={id} />
            <input type="hidden" name="response" value="godtatt" />
            <button type="submit" className="small" disabled={pending}>
              Ja, det er greit
            </button>
          </form>
          <button type="button" className="small secondary" disabled={pending} onClick={() => setDeclining(true)}>
            Nei, ikke ønsket
          </button>
          {status === "ny" && <CancelMyOrder id={id} />}
        </div>
      ) : (
        <form action={action} className="stack">
          <input type="hidden" name="orderId" value={id} />
          <input type="hidden" name="response" value="avslatt" />
          <label>
            Hva vil du heller? (valgfritt)
            <textarea name="note" rows={3} maxLength={500} placeholder="For eksempel «Jeg venter heller til du har rødt»" />
          </label>
          <div className="row-buttons left">
            <button type="submit" className="small" disabled={pending}>
              {pending ? "Sender …" : "Send svar"}
            </button>
            <button type="button" className="small secondary" onClick={() => setDeclining(false)}>
              Tilbake
            </button>
          </div>
        </form>
      )}
      {state.error && <p className="error small-text">{state.error}</p>}
    </div>
  );
}
