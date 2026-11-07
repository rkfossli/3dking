"use client";
import { useEffect, useState, useTransition } from "react";
import { subscribePushAction, testPushAction, unsubscribePushAction, vapidPublicKeyAction } from "@/app/push-actions";
import { base64ToBytes, isIos, isStandalone, pushSupported } from "./pwa";

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
        // Nettleseren spør «Vil du tillate varsler?». Det må skje rett etter et trykk.
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          setState(perm === "denied" ? "denied" : "off");
          return;
        }
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const key = base64ToBytes(await vapidPublicKeyAction());
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
        const r = await subscribePushAction(sub.toJSON());
        if (!r.ok) throw new Error("lagring feilet");
        setState("on");
        setMsg("Varsler er slått på. Trykk «Send testvarsel» for å prøve.");
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
    : "Du får beskjed når Liam svarer, når bestillingen er laget, og når den er levert.";

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
        Varsler er blokkert for 3DKing. Tillat varsler i innstillingene på telefonen (eller ved hengelåsen i adressefeltet på PC), og last siden på nytt.
      </p>
    );

  return (
    <div className="stack">
      <p className="muted small-text">
        {state === "on" ? "✅ Varsler er på for denne enheten. " : "Varsler er av. "}
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
