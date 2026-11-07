"use client";
import { useTransition } from "react";
import { cancelMyOrderAction, deleteOrderAction, setOrderStatusAction } from "@/app/order-actions";

// Knappene Liam bruker for å flytte en bestilling videre (eller tilbake hvis han trykket feil).
export function AdminOrderActions({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition();
  const set = (s: string) => start(() => setOrderStatusAction(id, s));

  return (
    <div className="row-buttons left">
      {status === "ny" && <button type="button" className="small" disabled={pending} onClick={() => set("laget")}>Merk som laget</button>}
      {status === "laget" && <button type="button" className="small" disabled={pending} onClick={() => set("levert")}>Merk som levert</button>}
      {status === "laget" && <button type="button" className="small secondary" disabled={pending} onClick={() => set("ny")}>Angre</button>}
      {status === "levert" && <button type="button" className="small secondary" disabled={pending} onClick={() => set("laget")}>Angre</button>}
      {status === "avbrutt" && <button type="button" className="small secondary" disabled={pending} onClick={() => set("ny")}>Gjenåpne</button>}
      {(status === "ny" || status === "laget") && (
        <button
          type="button"
          className="small danger"
          disabled={pending}
          onClick={() => confirm("Avbryte denne bestillingen?") && set("avbrutt")}
        >
          Avbryt
        </button>
      )}
      {(status === "avbrutt" || status === "levert") && (
        <button
          type="button"
          className="small danger"
          disabled={pending}
          onClick={() => confirm("Slette bestillingen for godt? Dette kan ikke angres.") && start(() => deleteOrderAction(id))}
        >
          Slett
        </button>
      )}
    </div>
  );
}

// Brukeren kan avbryte en bestilling så lenge den ikke er laget.
export function CancelMyOrder({ id }: { id: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="small danger"
      disabled={pending}
      onClick={() => confirm("Avbryte bestillingen?") && start(() => cancelMyOrderAction(id))}
    >
      Avbryt
    </button>
  );
}
