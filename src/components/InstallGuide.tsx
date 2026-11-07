"use client";
import { Icon } from "@/components/Icon";
import { useEffect, useState } from "react";
import { isAndroid, isIos, isStandalone } from "./pwa";

type Platform = "ios" | "android" | "mac-safari" | "pc";

const HIDE_KEY = "3dking-skjul-installguide";
const SEEN_KEY = "3dking-installguide-vist";

// Første gang vises guiden øverst på forsiden. Senere flyttes den ned under produktene.
// Svaret leses bare én gang per sidevisning, så de to plassene på forsiden er enige.
let seenBefore: boolean | null = null;
function guideSeenBefore(): boolean {
  if (seenBefore === null) {
    try {
      seenBefore = localStorage.getItem(SEEN_KEY) === "1";
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      seenBefore = false;
    }
  }
  return seenBefore;
}

// Guiden for å legge 3DKing på hjemskjermen (mobil) eller skrivebordet (PC).
// «compact»: på forsiden kan den skjules. På Meg-siden vises den alltid.
// «place»: forsiden har guiden både øverst og nederst, men bare én av dem vises (se guideSeenBefore).
export function InstallGuide({ compact = false, place }: { compact?: boolean; place?: "top" | "bottom" }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [open, setOpen] = useState(!compact);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    // Alt dette finnes bare i nettleseren, så det sjekkes etter at siden har lastet.
    const ua = navigator.userAgent;
    const safariMac = /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Edg|Firefox/.test(ua);
    /* eslint-disable react-hooks/set-state-in-effect -- leser nettleseren én gang ved oppstart */
    setPlatform(isIos() ? "ios" : isAndroid() ? "android" : safariMac ? "mac-safari" : "pc");
    setInstalled(isStandalone());
    const wrongPlace = place != null && (place === "top") === guideSeenBefore();
    try {
      setHidden(wrongPlace || (compact && localStorage.getItem(HIDE_KEY) === "1"));
    } catch {
      setHidden(wrongPlace);
    }
    setCanPrompt(Boolean(window.__installPrompt));
    /* eslint-enable react-hooks/set-state-in-effect */
    const onReady = () => setCanPrompt(true);
    window.addEventListener("3dking-installable", onReady);
    return () => window.removeEventListener("3dking-installable", onReady);
  }, [compact, place]);

  if (!platform) return null;
  if (installed) {
    return compact ? null : <p className="muted small-text"><Icon name="check" className="inline ok-icon" /> Du bruker 3DKing som app. Alt er klart!</p>;
  }
  if (hidden) return null;

  async function install() {
    const p = window.__installPrompt;
    if (!p) return;
    await p.prompt();
    const { outcome } = await p.userChoice;
    window.__installPrompt = null;
    setCanPrompt(false);
    if (outcome === "accepted") setInstalled(true);
  }

  function hide() {
    try {
      localStorage.setItem(HIDE_KEY, "1");
    } catch {}
    setHidden(true);
  }

  const where = platform === "ios" || platform === "android" ? "hjemskjermen" : "skrivebordet";

  return (
    <section className={compact ? "card install-guide" : "install-guide"}>
      {compact && (
        <div className="order-head">
          <b className="with-icon"><Icon name="install" /> Legg 3DKing på {where}</b>
          <button type="button" className="small secondary" onClick={hide} aria-label="Skjul guiden">
            Skjul
          </button>
        </div>
      )}
      <p className="small-text muted">
        Da åpnes 3DKing som en egen app, uten adressefelt.
        {platform === "ios" && " På iPhone må den ligge på Hjem-skjermen for at du skal kunne få varsler."}
      </p>

      {canPrompt && (
        <button type="button" className="small" onClick={install}>
          Installer 3DKing
        </button>
      )}

      {compact && !open && (
        <button type="button" className="small secondary" onClick={() => setOpen(true)}>
          Vis meg hvordan
        </button>
      )}

      {open && (
        <ol className="install-steps small-text">
          {platform === "ios" && (
            <>
              <li>Bruk <b>Safari</b>. Har du åpnet lenken i en annen app, trykk «Åpne i Safari» først.</li>
              <li>
                Trykk på <b>Del-knappen</b> <Icon name="share" size={16} className="inline" /> nederst på skjermen.
              </li>
              <li>
                Bla ned og velg <b>«Legg til på Hjem-skjerm»</b>.
              </li>
              <li>
                Trykk <b>«Legg til»</b> øverst til høyre. Nå ligger 3DKing på Hjem-skjermen.
              </li>
              <li>Åpne 3DKing derfra og logg inn én gang til.</li>
            </>
          )}
          {platform === "android" && (
            <>
              <li>Åpne 3dking-app.vercel.app i <b>Chrome</b>.</li>
              <li>
                Trykk på <b>de tre prikkene ⋮</b> øverst til høyre.
              </li>
              <li>
                Velg <b>«Installer app»</b> eller <b>«Legg til på startskjermen»</b>.
              </li>
              <li>Trykk <b>«Installer»</b>. Nå ligger 3DKing blant appene dine.</li>
            </>
          )}
          {platform === "pc" && (
            <>
              <li>Bruk <b>Chrome</b> eller <b>Edge</b> (Firefox kan ikke installere apper).</li>
              <li>
                Se etter <b>installer-ikonet</b> (en skjerm med pil ned) helt til høyre i adressefeltet, og trykk på det.
              </li>
              <li>
                Ser du det ikke i Chrome: trykk på <b>⋮</b> øverst til høyre og velg <b>«Lagre og del» → «Installer 3DKing»</b>.
              </li>
              <li>
                Ser du det ikke i Edge: trykk på <b>…</b> øverst til høyre og velg{" "}
                <b>«Apper» → «Installer dette nettstedet som en app»</b>.
              </li>
              <li>Trykk <b>«Installer»</b>. 3DKing får et eget vindu og et ikon på skrivebordet eller i Start-menyen.</li>
            </>
          )}
          {platform === "mac-safari" && (
            <>
              <li>
                Klikk på <b>Fil</b> i menylinjen øverst (eller Del-knappen <Icon name="share" size={16} className="inline" />).
              </li>
              <li>
                Velg <b>«Legg til i Dock»</b>.
              </li>
              <li>Klikk <b>«Legg til»</b>. Nå ligger 3DKing i Dock som en egen app.</li>
            </>
          )}
        </ol>
      )}
    </section>
  );
}
