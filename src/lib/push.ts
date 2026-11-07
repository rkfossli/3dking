// Push-varsler: små meldinger som dukker opp på telefonen selv om appen er lukket.
// Hentet og forenklet fra Spotter (src/lib/push.ts).
//
// Slik henger det sammen:
// 1. Telefonen sier ja til varsler og får et «abonnement» (en adresse hos Apple/Google).
// 2. Abonnementet lagres i tabellen push_subscriptions, knyttet til brukeren.
// 3. Når noe skjer (ny bestilling), sender serveren en melding til den adressen.
// 4. public/sw.js (service workeren) på telefonen tar imot og viser varselet.
import "server-only";
import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { pushSubscriptions, settings, users } from "./schema";

export type Payload = { title: string; body: string; url?: string; tag?: string };
export type SubscriptionJson = { endpoint: string; keys: { p256dh: string; auth: string } };

let keysPromise: Promise<{ publicKey: string; privateKey: string }> | null = null;

/**
 * VAPID-nøkler er appens «underskrift» på varslene. Hentes fra miljøvariabler hvis de finnes,
 * ellers lages et par første gang og lagres i databasen (settings-tabellen). Da trengs ingen oppsett i Vercel.
 */
export function vapidKeys() {
  keysPromise ??= (async () => {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
    }
    const db = await getDb();
    const read = async () => {
      const rows = await db.select().from(settings).where(inArray(settings.key, ["vapid_public", "vapid_private"]));
      const pub = rows.find((r) => r.key === "vapid_public")?.value;
      const priv = rows.find((r) => r.key === "vapid_private")?.value;
      return pub && priv ? { publicKey: pub, privateKey: priv } : null;
    };
    const existing = await read();
    if (existing) return existing;
    const k = webpush.generateVAPIDKeys();
    // Lagres som et par. Hvis to forespørsler gjør dette samtidig, vinner den første.
    await db
      .insert(settings)
      .values([
        { key: "vapid_public", value: k.publicKey },
        { key: "vapid_private", value: k.privateKey },
      ])
      .onConflictDoNothing();
    return (await read()) ?? k;
  })().catch((e) => {
    keysPromise = null;
    throw e;
  });
  return keysPromise;
}

export function validSubscription(sub: unknown): sub is SubscriptionJson {
  const s = sub as SubscriptionJson | null;
  return (
    typeof s?.endpoint === "string" &&
    s.endpoint.startsWith("https://") &&
    typeof s.keys?.p256dh === "string" &&
    !!s.keys.p256dh &&
    typeof s.keys?.auth === "string" &&
    !!s.keys.auth
  );
}

/** Lagrer abonnementet til denne enheten. Trygt å kalle mange ganger. */
export async function saveSubscription(userId: number, sub: SubscriptionJson): Promise<void> {
  const db = await getDb();
  await db
    .insert(pushSubscriptions)
    .values({ userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
}

export async function removeSubscription(userId: number, endpoint: string): Promise<void> {
  const db = await getDb();
  const [row] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  if (row && row.userId === userId) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.id));
}

/** Sender et varsel til alle enhetene til disse brukerne. Gir tilbake hvor mange som ble sendt. */
export async function sendPush(userIds: number[], payload: Payload): Promise<number> {
  if (!userIds.length) return 0;
  const db = await getDb();
  const subs = await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds));
  if (!subs.length) return 0;
  const keys = await vapidKeys();
  webpush.setVapidDetails("mailto:3dking@example.com", keys.publicKey, keys.privateKey);
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 }, // varselet kan vente et døgn hvis telefonen er av
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // 404/410: abonnementet finnes ikke lenger (appen slettet, varsler skrudd av). Rydd bort.
        if (code === 404 || code === 410) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id));
        else console.error("push feilet", code ?? e);
      }
    }),
  );
  return sent;
}

/** Varsel til alle admin-brukere (Liam). */
export async function pushToAdmins(payload: Payload): Promise<number> {
  const db = await getDb();
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  return sendPush(admins.map((a) => a.id), payload);
}

/** Varslene skal aldri stoppe selve handlingen. Feil logges bare. */
export async function safely(job: Promise<unknown>): Promise<void> {
  await job.catch((e) => console.error("push feilet", e));
}
