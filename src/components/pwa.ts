"use client";
// Små hjelpere for «appen på hjemskjermen» og varsler. Brukes av InstallGuide og PushSettings.

export function isIos(): boolean {
  // iPad med nyere iPadOS sier at den er en Mac, men har berøringsskjerm.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/** Sant hvis appen er åpnet fra hjemskjermen/skrivebordet (ikke i en vanlig nettleserfane). */
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Nøkkelen kommer som base64-tekst, men nettleseren vil ha bytes. */
export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Chrome og Edge kan vise sin egen «Installer»-boks. Hendelsen fanges i ServiceWorker.tsx og lagres her. */
export type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global {
  interface Window {
    __installPrompt?: InstallPrompt | null;
  }
}
