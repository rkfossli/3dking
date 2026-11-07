"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Icon } from "./Icon";
import { isIos, isStandalone, pushSupported } from "./pwa";
import { hasPush, turnOnPush } from "./push-client";

type State = "hidden" | "ask" | "ios-home" | "on" | "failed";

// Vises etter «Bestilt!»: spør om kunden vil ha beskjed når bestillingen er ferdig.
// Vises ikke hvis varsler allerede er på, eller hvis kunden har sagt nei i nettleseren før.
export function PushAsk() {
  const [state, setState] = useState<State>("hidden");
  const [busy, start] = useTransition();

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return setState(isIos() && !isStandalone() ? "ios-home" : "hidden");
      if (Notification.permission === "denied") return;
      setState((await hasPush()) ? "hidden" : "ask");
    })().catch(() => setState("hidden"));
  }, []);

  if (state === "hidden") return null;
  if (state === "on") {
    return (
      <p className="small-text with-icon">
        <Icon name="check" className="ok-icon" /> Du får beskjed når den er ferdig.
      </p>
    );
  }
  if (state === "ios-home") {
    return (
      <p className="small-text muted">
        Vil du få beskjed når den er ferdig? Legg 3DKing på Hjem-skjermen først. <Link href="/meg">Se hvordan</Link>
      </p>
    );
  }
  return (
    <div className="push-ask">
      <p className="small-text">Vil du få beskjed når den er ferdig?</p>
      <button
        type="button"
        className="small"
        disabled={busy}
        onClick={() =>
          start(async () => {
            try {
              const r = await turnOnPush();
              setState(r === "on" ? "on" : "hidden");
            } catch {
              setState("failed");
            }
          })
        }
      >
        Ja, gi meg beskjed
      </button>
      {state === "failed" && <p className="error small-text">Fikk ikke slått på varsler. Prøv under Innstillinger.</p>}
    </div>
  );
}
