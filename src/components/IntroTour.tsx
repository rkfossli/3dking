"use client";
import { useEffect, useRef, useState } from "react";
import { markTourSeenAction } from "@/app/tour-actions";
import { Icon, type IconName } from "./Icon";

// Introturen: noen korte sider om hvordan man bestiller. Vises i en boks i appen (ikke nettleserens).
// Den åpner seg selv første gang en kunde logger inn, og kan åpnes igjen fra Meg med openIntroTour().
const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "crown",
    title: "Velkommen til 3DKing!",
    text: "Her kan du bestille ting som 3DKing printer på 3D-printeren. Det er et hobbyprosjekt, så prisen dekker bare filament og strøm.",
  },
  {
    icon: "cube",
    title: "Finn en modell",
    text: "Under Modeller ser du alt som kan printes. Trykk på en modell for å se bilde og pris. Bruk fanene og søket øverst for å finne fram.",
  },
  {
    icon: "bag",
    title: "Velg og legg i kurven",
    text: "Velg antall og farge, og skriv gjerne et ønske, for eksempel et navn som skal stå på. Trykk «Legg i handlekurven». Når du er klar, går du til Kurv og trykker «Send bestilling».",
  },
  {
    icon: "list",
    title: "Følg bestillingen",
    text: "Under Mine ser du hvor langt 3DKing har kommet: Ny, Laget og Levert. Har du et spørsmål, kan du skrive en melding på bestillingen.",
  },
  {
    icon: "star",
    title: "Ønsker du noe annet?",
    text: "Finner du ikke det du vil ha? Nederst under Modeller kan du sende et ønske, gjerne med en lenke eller et bilde. 3DKing svarer om det kan printes, og hva det koster.",
  },
  {
    icon: "check",
    title: "Betaling og varsler",
    text: "Du betaler 3DKing med kontanter eller Vipps når du får tingen. Slå på varsler under Meg, så får du beskjed når noe skjer med bestillingen din.",
  },
];

const OPEN_EVENT = "3dking-introtur";

/** Åpner introturen (brukes av knappen under Meg). */
export function openIntroTour() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function IntroTour({ autoOpen }: { autoOpen: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const open = () => {
      setStep(0);
      if (!dialog.current?.open) dialog.current?.showModal();
    };
    window.addEventListener(OPEN_EVENT, open);
    if (autoOpen) open();
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [autoOpen]);

  function close() {
    dialog.current?.close();
  }

  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  return (
    // onClose kjører både ved «Ferdig», «Hopp over» og tilbake-knappen på telefonen.
    <dialog ref={dialog} className="confirm-dialog tour" aria-labelledby="tour-title" onClose={() => void markTourSeenAction()}>
      <div className="tour-icon" aria-hidden>
        <Icon name={s.icon} size={40} />
      </div>
      <h2 id="tour-title">{s.title}</h2>
      <p>{s.text}</p>
      <div className="tour-dots" aria-label={`Side ${step + 1} av ${STEPS.length}`}>
        {STEPS.map((_, i) => (
          <span key={i} className={i === step ? "on" : ""} />
        ))}
      </div>
      <div className="tour-buttons">
        {step === 0 ? (
          <button type="button" className="small secondary" onClick={close}>Hopp over</button>
        ) : (
          <button type="button" className="small secondary" onClick={() => setStep(step - 1)}>Tilbake</button>
        )}
        <button type="button" className="small" onClick={() => (last ? close() : setStep(step + 1))}>
          {last ? "Kom i gang" : "Neste"}
        </button>
      </div>
    </dialog>
  );
}

/** Knappen under Meg som viser introturen igjen. */
export function IntroTourButton() {
  return (
    <button type="button" className="secondary" onClick={openIntroTour}>
      Vis introturen
    </button>
  );
}
