"use server";
// Meldinger på en bestilling, mellom kunden og 3DKing.
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orderMessages, orders } from "@/lib/schema";
import { requireUser } from "@/lib/auth";
import { pushToAdmins, safely, sendPush } from "@/lib/push";
import { MAX_MESSAGE } from "@/lib/messages";

export type MessageState = { error?: string; ok?: number };

/** Sender en melding. Kunden kan bare skrive på egne bestillinger, Liam på alle. */
export async function sendMessageAction(_prev: MessageState, form: FormData): Promise<MessageState> {
  const user = await requireUser();
  const orderNumber = String(form.get("orderNumber") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { error: "Skriv en melding først." };
  if (body.length > MAX_MESSAGE) return { error: `Meldingen kan være maks ${MAX_MESSAGE} tegn.` };

  const db = await getDb();
  const lines = await db.select({ userId: orders.userId }).from(orders).where(eq(orders.orderNumber, orderNumber));
  if (lines.length === 0) return { error: "Fant ikke bestillingen." };
  const isAdmin = user.role === "admin";
  const customerId = lines[0].userId;
  if (!isAdmin && customerId !== user.id) return { error: "Fant ikke bestillingen." };

  await db.insert(orderMessages).values({ orderNumber, userId: user.id, body });

  if (isAdmin && customerId !== user.id) {
    // Kunden får «Nytt» på bestillingen og et varsel.
    await db.update(orders).set({ changedByAdminAt: new Date() }).where(eq(orders.orderNumber, orderNumber));
    after(() => safely(sendPush([customerId], { title: "Melding fra 3DKing", body: `#${orderNumber} · ${body}`, url: "/mine", tag: `melding-${orderNumber}` })));
  } else {
    after(() =>
      safely(pushToAdmins({ title: `Melding fra ${user.displayName}`, body: `#${orderNumber} · ${body}`, url: "/admin/bestillinger?vis=alle", tag: `melding-${orderNumber}` })),
    );
  }
  revalidatePath("/mine");
  revalidatePath("/admin/bestillinger");
  return { ok: Date.now() };
}
