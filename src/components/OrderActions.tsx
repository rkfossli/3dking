"use client";
import { useTransition } from "react";
import { ConfirmButton } from "./ConfirmButton";
import { cancelMyOrderAction, deleteOrderAction, setOrderStatusAction, setPaidAction } from "@/app/order-actions";

// Knappene Liam bruker for å flytte en bestilling videre (eller tilbake hvis han trykket feil).
// «Merk betalt» står ved siden av, siden betaling (Vipps) kan skje når som helst.
export function AdminOrderActions({ id, status, paid }: { id: number; status: string; paid: boolean }) {
  const [pending, start] = useTransition();
  const set = (s: string) => start(() => setOrderStatusAction(id, s));
  const pay = (p: boolean) => start(() => setPaidAction(id, p));

  return (
    <div className="row-buttons left">
      {status === "ny" && <button type="button" className="small" disabled={pending} onClick={() => set("laget")}>Merk som laget</button>}
      {status === "laget" && <button type="button" className="small" disabled={pending} onClick={() => set("levert")}>Merk som levert</button>}
      {status === "laget" && <button type="button" className="small secondary" disabled={pending} onClick={() => set("ny")}>Angre</button>}
      {status === "levert" && <button type="button" className="small secondary" disabled={pending} onClick={() => set("laget")}>Angre</button>}
      {status === "avbrutt" && <button type="button" className="small secondary" disabled={pending} onClick={() => set("ny")}>Gjenåpne</button>}
      {status !== "avbrutt" && !paid && (
        <button type="button" className="small secondary" disabled={pending} onClick={() => pay(true)}>Merk betalt</button>
      )}
      {status !== "avbrutt" && paid && (
        <button type="button" className="small secondary" disabled={pending} onClick={() => pay(false)}>Angre betalt</button>
      )}
      {(status === "ny" || status === "laget") && (
        <ConfirmButton
          disabled={pending}
          question="Avbryte denne bestillingen? Den som bestilte ser at den er avbrutt."
          confirmLabel="Ja, avbryt"
          onConfirm={() => set("avbrutt")}
        >
          Avbryt
        </ConfirmButton>
      )}
      {(status === "avbrutt" || status === "levert") && (
        <ConfirmButton
          disabled={pending}
          question="Slette bestillingen for godt? Dette kan ikke angres."
          confirmLabel="Ja, slett"
          onConfirm={() => start(() => deleteOrderAction(id))}
        >
          Slett
        </ConfirmButton>
      )}
    </div>
  );
}

// Brukeren kan avbryte en bestilling så lenge den ikke er laget.
export function CancelMyOrder({ id }: { id: number }) {
  const [pending, start] = useTransition();
  return (
    <ConfirmButton
      disabled={pending}
      question="Vil du avbryte bestillingen?"
      confirmLabel="Ja, avbryt"
      onConfirm={() => start(() => cancelMyOrderAction(id))}
    >
      Avbryt bestilling
    </ConfirmButton>
  );
}
