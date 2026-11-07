"use client";
import { useTransition } from "react";
import { restartStatsAction } from "@/app/stats-actions";
import { ConfirmButton } from "./ConfirmButton";

// Knapp i Verkstedet: start tellingen på nytt fra nå. Spør først, i appens egen boks.
export function RestartStats() {
  const [pending, start] = useTransition();
  return (
    <ConfirmButton
      disabled={pending}
      className="small secondary"
      confirmClassName="small"
      question="Starte tellingen på nytt fra nå? Bestillingene blir liggende, men tallene her og «Populær» begynner på null."
      confirmLabel="Ja, start på nytt"
      onConfirm={() => start(() => restartStatsAction())}
    >
      Start tellingen på nytt
    </ConfirmButton>
  );
}
