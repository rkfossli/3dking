"use client";
import { useRef, useState, useTransition } from "react";
import { ConfirmButton } from "./ConfirmButton";
import { cancelMyOrderAction, deleteOrderAction, deliverAction, setOrderStatusAction, setPaidAction } from "@/app/order-actions";

// Knappene Liam bruker for å flytte en bestilling videre (eller tilbake hvis han trykket feil).
// «Merk betalt» står ved siden av, siden betaling (Vipps) kan skje når som helst.
export function AdminOrderActions({ id, status, paid }: { id: number; status: string; paid: boolean }) {
  const [pending, start] = useTransition();
  const set = (s: string) => start(() => setOrderStatusAction(id, s));
  const pay = (p: boolean) => start(() => setPaidAction(id, p));

  return (
    <div className="row-buttons left">
      {status === "ny" && <button type="button" className="small" disabled={pending} onClick={() => set("laget")}>Merk som laget</button>}
      {status === "laget" && <DeliverButton id={id} disabled={pending} />}
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

// «Merk som levert» åpner en boks i appen: Er den betalt? Ja, Nei eller Gratis.
// Svarer Liam nei, kan han skrive et notat, for eksempel «Betaler i morgen».
const NOTE_IDEAS = ["Betaler i morgen", "Betaler senere"];

function DeliverButton({ id, disabled }: { id: number; disabled?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<"spor" | "notat">("spor");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  function open() {
    setStep("spor");
    setNote("");
    dialog.current?.showModal();
  }

  function deliver(payment: "ja" | "nei" | "gratis") {
    dialog.current?.close();
    start(() => deliverAction(id, payment, note));
  }

  return (
    <>
      <button type="button" className="small" disabled={disabled || pending} onClick={open}>
        Merk som levert
      </button>
      <dialog ref={dialog} className="confirm-dialog" onClick={(e) => e.target === dialog.current && dialog.current.close()}>
        {step === "spor" ? (
          <>
            <p><b>Levert!</b> Er den også betalt?</p>
            <div className="row-buttons">
              <button type="button" className="small secondary" onClick={() => setStep("notat")}>Nei</button>
              <button type="button" className="small secondary" onClick={() => deliver("gratis")}>Gratis</button>
              <button type="button" className="small" onClick={() => deliver("ja")}>Ja, betalt</button>
            </div>
          </>
        ) : (
          <>
            <p><b>Ikke betalt ennå.</b> Vil du skrive et notat?</p>
            <div className="note-ideas">
              {NOTE_IDEAS.map((idea) => (
                <button key={idea} type="button" className={`chip${note === idea ? " on" : ""}`} onClick={() => setNote(idea)}>
                  {idea}
                </button>
              ))}
            </div>
            <label>
              Notat (valgfritt)
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="For eksempel Betaler i morgen" />
            </label>
            <div className="row-buttons">
              <button type="button" className="small secondary" onClick={() => setStep("spor")}>Tilbake</button>
              <button type="button" className="small" onClick={() => deliver("nei")}>Lagre som levert</button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
