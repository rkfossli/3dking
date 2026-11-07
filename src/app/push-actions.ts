"use server";
// Handlinger telefonen kaller for å slå varsler av og på.
import { requireUser } from "@/lib/auth";
import { removeSubscription, saveSubscription, sendPush, validSubscription, vapidKeys } from "@/lib/push";

/** Den offentlige nøkkelen telefonen trenger for å lage et abonnement. */
export async function vapidPublicKeyAction(): Promise<string> {
  await requireUser();
  return (await vapidKeys()).publicKey;
}

export async function subscribePushAction(sub: PushSubscriptionJSON): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (!validSubscription(sub)) return { ok: false };
  await saveSubscription(user.id, sub);
  return { ok: true };
}

export async function unsubscribePushAction(endpoint: string): Promise<void> {
  const user = await requireUser();
  await removeSubscription(user.id, endpoint);
}

export async function testPushAction(): Promise<{ sent: number }> {
  const user = await requireUser();
  const sent = await sendPush([user.id], { title: "3DKing", body: "Testvarsel: varsler virker!", url: "/meg", tag: "test" });
  return { sent };
}
