"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Registrerer service workeren (public/sw.js) når appen åpnes. Den trengs for varsler og for å kunne installere appen.
// Fanger også Chrome/Edge sin «kan installeres»-hendelse, så InstallGuide kan vise en Installer-knapp.
// Siden oppdateres av seg selv når et varsel kommer, og når man går tilbake til appen.
export function ServiceWorker() {
  const router = useRouter();

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

  useEffect(() => {
    // router.refresh() henter siden på nytt fra serveren uten å laste hele appen (skjemaer og scroll beholdes).
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "3dking-oppdater") router.refresh();
    };
    // Når appen kommer fram igjen (fra bakgrunnen eller en annen fane), hentes ferske data.
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
