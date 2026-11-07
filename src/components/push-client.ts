"use client";
// Slå på varsler for denne enheten. Brukes både av Innstillinger (PushSettings) og etter en bestilling (PushAsk).
import { subscribePushAction, vapidPublicKeyAction } from "@/app/push-actions";
import { base64ToBytes } from "./pwa";

/** Spør nettleseren om lov, og lagrer abonnementet på serveren. Må kalles rett etter et trykk. */
export async function turnOnPush(): Promise<"on" | "denied" | "off"> {
  // Nettleseren spør «Vil du tillate varsler?».
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : "off";
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const key = base64ToBytes(await vapidPublicKeyAction());
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
  const r = await subscribePushAction(sub.toJSON());
  if (!r.ok) throw new Error("lagring feilet");
  return "on";
}

/** Har denne enheten allerede varsler på? */
export async function hasPush(): Promise<boolean> {
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  return Boolean(await reg?.pushManager.getSubscription());
}
