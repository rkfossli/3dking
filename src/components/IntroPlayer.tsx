"use client";

import { useEffect, useRef, useState } from "react";

// Introen: en kort film (public/intro/intro.mp4) med musikk (public/intro/intro.m4a) som spilles
// rett etter at noen logger inn. Til slutt går den over til hjemskjermen «lag for lag», som en 3D-print:
// logoen fra filmen flyr opp til plassen sin, og hjemskjermen printes frem nedenfra med en glødende dyse.
//
// Slik henger det sammen:
// 1. Når man trykker «Logg inn», kaller LoginForm primeIntro(). Det skjer mens trykket pågår, og bare da
//    lar mobilen oss starte lyd. Lyden «låses opp» og skjermen tones til svart.
// 2. Blir PIN-en feil, kaller LoginForm cancelIntro(), og det svarte forsvinner igjen.
// 3. Går innloggingen bra, sendes man til forsiden. Da blir loggedIn true, og filmen starter.
//
// Musikken («Episk trailer» med sluttlyden «Seiersløft») ble laget med Web Audio i en demo og tatt opp til en fil.

const PRIME_EVENT = "3dking-intro-prime";
const CANCEL_EVENT = "3dking-intro-cancel";
export const INTRO_DONE_EVENT = "3dking-intro-done";

// Hvor logoen står i siste bilde av filmen (målt i filmen på 720×1280 punkter).
const VL = { x0: 32 / 720, x1: 684 / 720, y0: 404 / 1280, y1: 772 / 1280 };
// Hvor selve logoen står inni logo-bildet (600×314), uten den gjennomsiktige kanten.
const PL = { x0: 55 / 600, x1: 542 / 600, y0: 34 / 314, y1: 277 / 314 };
// Når overgangen starter (sekunder inn i filmen). Logoen står stille fra ca. 8,5 s.
const TRIGGER = 9.1;
// Antall lag som «printes» frem.
const LAYERS = 26;

type Rect = { x: number; y: number; w: number; h: number };

// Lyden må lages mens trykket på «Logg inn» pågår. Derfor lever den utenfor React,
// så den overlever at siden bytter fra innlogging til forsiden.
let audio: HTMLAudioElement | null = null;
let active = false;

/** Sant mens introen vises (eller venter på at innloggingen blir godkjent). */
export function introActive() {
  return active;
}

/** Kalles fra «Logg inn»-knappen. Må skje mens trykket pågår. */
export function primeIntro() {
  try {
    audio = new Audio("/intro/intro.m4a");
    audio.preload = "auto";
    // Start og stopp med en gang: da får vi lov til å spille av senere, uten at noe høres nå.
    const p = audio.play();
    audio.pause();
    p?.catch(() => {});
  } catch {
    audio = null;
  }
  active = true;
  window.dispatchEvent(new Event(PRIME_EVENT));
}

/** Kalles når innloggingen feiler. */
export function cancelIntro() {
  window.dispatchEvent(new Event(CANCEL_EVENT));
}

function videoRect(): Rect {
  // Hele filmen skal synes (ellers kuttes «3D KING» i kantene på smale skjermer), så den får svart over og under.
  const W = window.innerWidth, H = window.innerHeight;
  const w = Math.min(W, (H * 9) / 16), h = (w * 16) / 9;
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

function startRect(): Rect {
  // Plasser logo-bildet akkurat der logoen står i filmen.
  const v = videoRect();
  const w = ((VL.x1 - VL.x0) * v.w) / (PL.x1 - PL.x0), h = (w * 314) / 600;
  const cx = v.x + ((VL.x0 + VL.x1) / 2) * v.w, cy = v.y + ((VL.y0 + VL.y1) / 2) * v.h;
  return { x: cx - ((PL.x0 + PL.x1) / 2) * w, y: cy - ((PL.y0 + PL.y1) / 2) * h, w, h };
}

function place(el: HTMLElement, r: Rect) {
  Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
}

// En transform som får et element som står på «to» til å se ut som det står på «from».
function flip(from: Rect, to: Rect) {
  const dx = from.x + from.w / 2 - (to.x + to.w / 2), dy = from.y + from.h / 2 - (to.y + to.h / 2);
  return `translate(${dx}px, ${dy}px) scale(${from.w / to.w})`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function IntroPlayer({ loggedIn }: { loggedIn: boolean }) {
  // on = introen er i gang. Før innloggingen er godkjent er skjermen bare svart. Etterpå går filmen.
  const [phase, setPhase] = useState<"off" | "on">("off");
  const playing = phase === "on" && loggedIn;
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const fx = useRef<HTMLDivElement>(null);
  const run = useRef(0); // øker hver gang introen stoppes, så gamle animasjoner vet at de skal gi seg

  // Lytt etter «Logg inn» og feil PIN.
  useEffect(() => {
    const prime = () => setPhase("on");
    const cancel = () => {
      active = false;
      audio?.pause();
      setPhase("off");
    };
    window.addEventListener(PRIME_EVENT, prime);
    window.addEventListener(CANCEL_EVENT, cancel);
    return () => {
      window.removeEventListener(PRIME_EVENT, prime);
      window.removeEventListener(CANCEL_EVENT, cancel);
    };
  }, []);

  // Venter vi for lenge (nettet er borte?), gir vi opp og viser appen.
  useEffect(() => {
    if (phase !== "on" || loggedIn) return;
    const t = setTimeout(() => cancelIntro(), 20000);
    return () => clearTimeout(t);
  }, [phase, loggedIn]);

  // Innloggingen gikk bra: start filmen.
  useEffect(() => {
    if (!playing) return;
    const runs = run;
    const id = ++runs.current;
    const v = video.current!;
    const alive = () => id === runs.current;
    let raf = 0;

    const r = videoRect();
    Object.assign(v.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });

    async function start() {
      // Vent til filmen kan spilles (maks 5 sekunder), og start film og musikk samtidig.
      if (v.readyState < 3) {
        await Promise.race([new Promise((res) => v.addEventListener("canplay", res, { once: true })), sleep(5000)]);
      }
      if (!alive()) return;
      v.currentTime = 0;
      v.play().catch(() => finish());
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      const tick = () => {
        if (!alive()) return;
        // Hold musikken i takt med filmen.
        if (audio && !audio.paused && Math.abs(audio.currentTime - v.currentTime) > 0.2) audio.currentTime = v.currentTime;
        if (v.currentTime >= TRIGGER || v.ended) {
          v.pause();
          transition().catch(() => {});
        } else raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    // Overgangen «lag for lag».
    async function transition() {
      const box = fx.current!, st = stage.current!;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const target = document.querySelector<HTMLImageElement>("main .top .logo");
      if (reduce || !target) {
        await st.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" }).finished;
        return finish(false);
      }

      // 1. Filmen tones ut, og et rent logo-bilde tar over på samme sted.
      const s = startRect();
      const logo = new Image();
      logo.src = "/logo/neon.png";
      logo.alt = "";
      logo.className = "intro-logo";
      place(logo, s);
      box.appendChild(logo);
      v.animate([{ opacity: 1, filter: "brightness(1)" }, { opacity: 0, filter: "brightness(.3)" }], { duration: 550, fill: "forwards" });
      await logo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, fill: "forwards" }).finished;
      await sleep(120);
      if (!alive()) return;

      // 2. Logoen flyr opp til logoen øverst på forsiden.
      const tr = target.getBoundingClientRect();
      const t: Rect = { x: tr.left, y: tr.top, w: tr.width, h: tr.height };
      place(logo, t);
      await logo.animate([{ transform: flip(s, t) }, { transform: "none" }], {
        duration: 650,
        easing: "cubic-bezier(.65,0,.25,1)",
        fill: "forwards",
      }).finished;
      if (!alive()) return;

      // 3. Svarte lag dekker forsiden. De forsvinner ett og ett nedenfra mens dysen beveger seg oppover.
      const H = window.innerHeight, lh = H / LAYERS, layers: HTMLDivElement[] = [];
      for (let i = 0; i < LAYERS; i++) {
        const d = document.createElement("div");
        d.className = "intro-layer";
        d.style.top = `${i * lh}px`;
        d.style.height = `${lh + 1}px`;
        box.insertBefore(d, box.firstChild);
        layers.push(d);
      }
      st.style.visibility = "hidden";
      const nozzle = document.createElement("div");
      nozzle.className = "intro-nozzle";
      box.appendChild(nozzle);
      const t0 = performance.now(), dur = 1100;
      await new Promise<void>((res) => {
        const step = (now: number) => {
          if (!alive()) return res();
          const p = Math.min(1, (now - t0) / dur), y = H - p * H;
          nozzle.style.top = `${y - 1.5}px`;
          layers.forEach((d, i) => (d.style.opacity = i * lh >= y ? "0" : "1"));
          if (p < 1) requestAnimationFrame(step);
          else res();
        };
        requestAnimationFrame(step);
      });
      await nozzle.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }).finished;
      if (!alive()) return;

      // 4. Logoen «lander»: den ekte logoen gløder kort, og flyve-logoen tones bort (den kan ha en annen temafarge).
      target.animate(
        [
          { filter: "brightness(1.8)" },
          { filter: "drop-shadow(0 0 14px var(--accent-glow)) brightness(1.3)", offset: 0.3 },
          { filter: "none" },
        ],
        { duration: 700 },
      );
      await logo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }).finished;
      finish(false);
    }

    start();
    return () => {
      runs.current++;
      cancelAnimationFrame(raf);
    };
  }, [playing]);

  // Ferdig (eller «Hopp over»): fjern introen. Musikken får klinge ut av seg selv, med mindre man hoppet over.
  function finish(stopMusic = true) {
    run.current++;
    if (stopMusic) audio?.pause();
    active = false;
    setPhase("off");
    window.dispatchEvent(new Event(INTRO_DONE_EVENT));
  }

  if (phase === "off") return null;
  return (
    <div className="intro" ref={root} aria-hidden={!playing}>
      <div className="intro-stage" ref={stage}>
        {/* Uten lyd: musikken kommer fra en egen fil, så den kan låses opp ved trykket på «Logg inn». */}
        <video ref={video} src="/intro/intro.mp4" muted playsInline preload="auto" />
      </div>
      <div className="intro-fx" ref={fx} />
      {playing && (
        <button type="button" className="intro-skip" onClick={() => finish()}>
          Hopp over
        </button>
      )}
    </div>
  );
}
