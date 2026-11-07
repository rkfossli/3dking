"use client";
import { useRef, type ReactNode } from "react";

// En knapp som spør «Er du sikker?» i en egen boks i appen før noe skjer.
// <dialog> er et HTML-element for slike bokser. showModal() viser den over resten av siden.
export function ConfirmButton({
  children,
  question,
  confirmLabel = "Ja",
  cancelLabel = "Nei, la være",
  onConfirm,
  disabled,
  className = "small danger",
}: {
  children: ReactNode;
  question: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={className} disabled={disabled} onClick={() => dialog.current?.showModal()}>
        {children}
      </button>
      <dialog
        ref={dialog}
        className="confirm-dialog"
        // Trykk utenfor boksen lukker den, akkurat som «Nei».
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
      >
        <p>{question}</p>
        <div className="row-buttons">
          <button type="button" className="small secondary" onClick={() => dialog.current?.close()}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="small danger-solid"
            onClick={() => {
              dialog.current?.close();
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
