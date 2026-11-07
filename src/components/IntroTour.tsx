"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { markTourSeenAction } from "@/app/tour-actions";
import { INTRO_DONE_EVENT, introActive } from "./IntroPlayer";

// Introturen, som i Spotter: et mørkt teppe over appen med et «lyskaster»-hull rundt det som forklares,
// og en tekstboks ved siden av. Turen går selv mellom fanene (Modeller, en modell, Kurv, Mine, Meg).
// Steget huskes i sessionStorage, så turen fortsetter etter at siden har byttet.
// Teppet tar imot alle trykk, så ingenting i appen endres mens turen går.

type Step = {
  path: string; // siden steget vises på. «@modell» = den første modellen i listen
  target?: string; // CSS-velger for det som skal lyses opp. Uten mål vises teksten midt på skjermen
  title: string;
  text: string;
  skip?: boolean; // hopp over steget hvis målet ikke finnes (f.eks. ingen modeller ennå)
};

const STEPS: Step[] = [
  {
    path: "/",
    title: "Velkommen til 3DKing!",
    text: "Her kan du bestille ting som 3DKing printer på 3D-printeren. Vi tar en rask tur gjennom appen, så du ser hvordan det virker.",
  },
  {
    path: "/",
    target: ".grid .product",
    title: "Modellene",
    text: "Her er alt 3DKing kan printe, med pris. Trykk på en modell for å se den større og bestille.",
    skip: true,
  },
  {
    path: "/",
    target: ".search",
    title: "Finn fram",
    text: "Søk etter noe bestemt. Er det mange modeller, kan du også bruke fanene under søket for å se én kategori om gangen.",
    skip: true,
  },
  {
    path: "@modell",
    target: "fieldset.colors",
    title: "Velg farge",
    text: "Trykk på fargen du vil ha. Noen modeller kan ha flere farger. Da velger du hovedfargen først, og så de andre.",
    skip: true,
  },
  {
    path: "@modell",
    target: ".order-form button[type=submit]",
    title: "Legg i kurven",
    text: "Velg antall, skriv gjerne et ønske (for eksempel et navn som skal stå på), og trykk «Legg i handlekurven».",
    skip: true,
  },
  {
    path: "/handlekurv",
    target: ".tabbar a[href='/handlekurv']",
    title: "Kurven",
    text: "Her samles det du har valgt. Du kan legge flere ting i kurven. Når du er klar, trykker du «Send bestilling».",
  },
  {
    path: "/mine",
    target: ".tabbar a[href='/mine']",
    title: "Mine bestillinger",
    text: "Her ser du hvor langt 3DKing har kommet: Ny, Laget og Levert. Har du et spørsmål, kan du skrive en melding på bestillingen.",
  },
  {
    path: "/",
    target: ".wish-cta",
    title: "Ønsker du noe annet?",
    text: "Finner du ikke det du vil ha, kan du sende et ønske her. 3DKing svarer om det kan printes, og hva det koster.",
    skip: true,
  },
  {
    path: "/meg",
    target: "#varsler",
    title: "Varsler",
    text: "Slå på varsler, så får du beskjed når bestillingen din er laget og levert.",
    skip: true,
  },
  {
    path: "/",
    title: "Klar til å bestille!",
    text: "Du betaler 3DKing når du får tingen. Denne turen finner du igjen under Meg.",
  },
];

const KEY = "3dking-tur"; // steget turen står på (sessionStorage)
const PRODUCT_KEY = "3dking-tur-modell"; // adressen til modellen turen viser
const OPEN_EVENT = "3dking-introtur";
const PAD = 6;
const GAP = 12;

type Box = { top: number; left: number; width: number; height: number };

function readStep(): number | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v == null ? null : Number(v);
  } catch {
    return null;
  }
}

function writeStep(n: number | null) {
  try {
    if (n == null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, String(n));
  } catch {
    // Privat modus: turen virker likevel så lenge siden ikke lastes på nytt.
  }
}

function productPath(): string | null {
  try {
    return sessionStorage.getItem(PRODUCT_KEY);
  } catch {
    return null;
  }
}

/** Åpner introturen (brukes av knappen under Meg). */
export function openIntroTour() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function IntroTour({ autoOpen }: { autoOpen: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [at, setAt] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  // Hvilket steg (og side) som er ferdig målt. Tekstboksen vises først da.
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [cardH, setCardH] = useState(220);
  const card = useRef<HTMLDivElement>(null);
  const target = useRef<Element | null>(null);
  const dir = useRef(1);

  // Start: fra knappen under Meg, av seg selv første gang (etter introfilmen), eller fortsett etter sidebytte.
  useEffect(() => {
    const start = () => {
      dir.current = 1;
      writeStep(0);
      setAt(0);
    };
    const saved = readStep();
    // Fortsett turen etter sidebytte eller omlasting.
    const resume = window.setTimeout(() => saved != null && setAt(saved), 0);
    window.addEventListener(OPEN_EVENT, start);
    const afterIntro = () => start();
    if (autoOpen && saved == null) {
      if (introActive()) window.addEventListener(INTRO_DONE_EVENT, afterIntro, { once: true });
      else start();
    }
    return () => {
      window.clearTimeout(resume);
      window.removeEventListener(OPEN_EVENT, start);
      window.removeEventListener(INTRO_DONE_EVENT, afterIntro);
    };
  }, [autoOpen]);

  const go = useCallback((n: number) => {
    if (n < 0) n = 0;
    if (n >= STEPS.length) {
      writeStep(null);
      setAt(null);
      void markTourSeenAction();
      return;
    }
    writeStep(n);
    setAt(n);
  }, []);

  const close = useCallback(() => go(STEPS.length), [go]);

  const measure = useCallback(() => {
    if (card.current) setCardH(card.current.offsetHeight);
    const el = target.current;
    if (!el || !el.isConnected) return setBox(null);
    const r = el.getBoundingClientRect();
    setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, []);

  // Finn målet for steget: bytt side om nødvendig, vent på elementet, rull det fram og mål det.
  useEffect(() => {
    if (at == null) return;
    const step = STEPS[at];
    const key = `${at}${pathname}`;
    target.current = null;

    // Husk den første modellen i listen, så turen kan vise en modellside.
    if (pathname === "/") {
      const link = document.querySelector(".grid .product a.product-link");
      if (link instanceof HTMLAnchorElement) {
        try {
          sessionStorage.setItem(PRODUCT_KEY, new URL(link.href).pathname);
        } catch {}
      }
    }
    let path = step.path;
    if (path === "@modell") {
      const p = productPath();
      if (!p) return go(at + dir.current); // ingen modeller ennå: hopp over
      path = p;
    }
    if (pathname !== path) {
      router.push(path);
      return;
    }
    let cancelled = false;
    const timers: number[] = [];
    if (!step.target) {
      window.scrollTo({ top: 0 });
      timers.push(
        window.setTimeout(() => {
          setBox(null);
          setReadyKey(key);
        }, 0),
      );
      return () => timers.forEach((t) => window.clearTimeout(t));
    }
    const started = Date.now();
    const find = () => {
      if (cancelled) return;
      const el = [...document.querySelectorAll(step.target!)].find((e) => e.getBoundingClientRect().width > 0);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            target.current = el;
            measure();
            setReadyKey(key);
          }, 450),
        );
        return;
      }
      if (Date.now() - started > 1500) {
        if (step.skip) return go(at + dir.current);
        setBox(null);
        setReadyKey(key);
        return;
      }
      timers.push(window.setTimeout(find, 100));
    };
    timers.push(window.setTimeout(find, 150));
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [at, pathname, router, go, measure]);

  // Følg målet når siden ruller eller endrer størrelse.
  useEffect(() => {
    if (at == null) return;
    window.addEventListener("resize", measure);
    // capture: fanger også rulling inne i elementer, ikke bare på selve siden
    document.addEventListener("scroll", measure, { passive: true, capture: true });
    // Mål på nytt en stund etter steget, i tilfelle siden flytter seg (bilder som lastes, myk rulling).
    const again = window.setInterval(measure, 250);
    return () => {
      window.removeEventListener("resize", measure);
      document.removeEventListener("scroll", measure, { capture: true });
      window.clearInterval(again);
    };
  }, [at, measure]);

  // Escape lukker turen (tastatur).
  useEffect(() => {
    if (at == null) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [at, close]);

  if (at == null) return null;
  const step = STEPS[at];
  const last = at === STEPS.length - 1;
  const ready = readyKey === `${at}${pathname}`;

  // Tekstboksen legger seg under målet hvis det er plass, ellers over. Uten mål: midt på skjermen.
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  let cardStyle: React.CSSProperties = { top: "50%", transform: "translateY(-50%)" };
  if (box) {
    const below = box.top + box.height + GAP;
    if (below + cardH < vh - 16) cardStyle = { top: below };
    else cardStyle = { top: Math.max(16, box.top - GAP - cardH) };
  }

  return (
    <div className="tour-veil" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {ready && box ? <div className="tour-spot" style={box} /> : <div className="tour-dim" />}
      <div ref={card} className={`tour-card${ready ? " ready" : ""}`} style={cardStyle}>
        <div className="tour-dots" aria-label={`Steg ${at + 1} av ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span key={i} className={i === at ? "on" : ""} />
          ))}
        </div>
        <h2 id="tour-title">{step.title}</h2>
        <p>{step.text}</p>
        <div className="tour-buttons">
          {at === 0 ? (
            <button type="button" className="small secondary" onClick={close}>Hopp over</button>
          ) : (
            <button type="button" className="small secondary" onClick={() => { dir.current = -1; go(at - 1); }}>Tilbake</button>
          )}
          <button type="button" className="small" onClick={() => { dir.current = 1; go(at + 1); }}>
            {last ? "Kom i gang" : "Neste"}
          </button>
        </div>
        {at > 0 && !last && (
          <button type="button" className="tour-end" onClick={close}>Avslutt turen</button>
        )}
      </div>
    </div>
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
