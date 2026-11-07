"use client";
import { Icon } from "@/components/Icon";
import { useEffect, useState, useTransition } from "react";
import { subscribePushAction, testPushAction, unsubscribePushAction } from "@/app/push-actions";
import { isIos, isStandalone, pushSupported } from "./pwa";
import { turnOnPush } from "./push-client";

type State = "loading" | "unsupported" | "ios-home" | "denied" | "off" | "on";

// Slå varsler av og på for DENNE enheten (telefonen eller PC-en du sitter med).
// Forenklet fra Spotter (src/components/PushSettings.tsx).
export function PushSettings({ isAdmin }: { isAdmin: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return setState(isIos() && !isStandalone() ? "ios-home" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
      // Send abonnementet på nytt hver gang, i tilfelle serveren har mistet det. Trygt å gjenta.
      if (sub) await subscribePushAction(sub.toJSON());
    })().catch(() => setState("unsupported"));
  }, []);

  function enable() {
    setMsg(null);
    start(async () => {
      try {
        const result = await turnOnPush();
        setState(result);
        if (result === "on") setMsg("Varsler er slått på. Trykk «Send testvarsel» for å prøve.");
      } catch {
        setMsg("Fikk ikke slått på varsler. Prøv igjen.");
      }
    });
  }

  function disable() {
    setMsg(null);
    start(async () => {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribePushAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
      setMsg("Varsler er slått av på denne enheten.");
    });
  }

  function test() {
    setMsg(null);
    start(async () => {
      const r = await testPushAction();
      setMsg(r.sent ? "Testvarsel sendt. Det kan ta noen sekunder." : "Fant ingen enhet å sende til. Slå av og på igjen.");
    });
  }

  const what = isAdmin
    ? "Du får beskjed når noen bestiller noe."
    : "Du får beskjed når 3DKing svarer, når bestillingen er laget, og når den er levert.";

  if (state === "loading") return <p className="muted small-text">Sjekker …</p>;
  if (state === "ios-home")
    return (
      <p className="small-text">
        På iPhone må 3DKing ligge på Hjem-skjermen før du kan få varsler. Følg guiden under, åpne appen derfra, og kom tilbake hit.
      </p>
    );
  if (state === "unsupported")
    return <p className="muted small-text">Denne nettleseren støtter ikke varsler. Prøv Chrome, Edge eller Safari.</p>;
  if (state === "denied")
    return (
      <p className="small-text">
        Varsler er slått av for 3DKing på denne enheten. Slå dem på i telefonens innstillinger (på PC: hengelåsen i adressefeltet), og last siden på nytt.
      </p>
    );

  return (
    <div className="stack">
      <p className="muted small-text">
        {state === "on" ? (
          <>
            <Icon name="check" className="inline ok-icon" /> Varsler er på for denne enheten.{" "}
          </>
        ) : (
          "Varsler er av. "
        )}
        {what}
      </p>
      <div className="row-buttons left">
        {state === "off" ? (
          <button type="button" className="small" onClick={enable} disabled={busy}>
            Slå på varsler
          </button>
        ) : (
          <>
            <button type="button" className="small" onClick={test} disabled={busy}>
              Send testvarsel
            </button>
            <button type="button" className="small secondary" onClick={disable} disabled={busy}>
              Slå av
            </button>
          </>
        )}
      </div>
      {msg && <p className="small-text">{msg}</p>}
    </div>
  );
}
