"use client";
import { useEffect } from "react";

// Registrerer service workeren (public/sw.js) når appen åpnes. Den trengs for varsler og for å kunne installere appen.
// Fanger også Chrome/Edge sin «kan installeres»-hendelse, så InstallGuide kan vise en Installer-knapp.
export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault(); // vi viser vår egen knapp i stedet
      window.__installPrompt = e as Window["__installPrompt"];
      window.dispatchEvent(new Event("3dking-installable"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return null;
}
