"use server";
// Ønskeboksen: kunden ønsker seg noe, og Liam svarer.
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { wishes } from "@/lib/schema";
import { requireAdmin, requireUser } from "@/lib/auth";
import { pushToAdmins, safely, sendPush } from "@/lib/push";
import { deleteImage, saveImage } from "@/lib/images";
import { MAX_WISH, cleanLink, getWish } from "@/lib/wishes";
import { parseKroner } from "@/lib/products";

export type WishState = { error?: string; ok?: number };

function refresh() {
  revalidatePath("/onsker");
  revalidatePath("/admin/onsker");
}

/** Kunden sender et ønske: tekst, eventuelt en lenke og et bilde. */
export async function addWishAction(_prev: WishState, form: FormData): Promise<WishState> {
  const user = await requireUser();
  const text = String(form.get("text") ?? "").trim();
  const linkText = String(form.get("link") ?? "").trim();
  if (!text) return { error: "Skriv hva du ønsker deg." };
  if (text.length > MAX_WISH) return { error: `Ønsket kan være maks ${MAX_WISH} tegn.` };
  const link = cleanLink(linkText);
  if (linkText && !link) return { error: "Lenken må starte med https://" };

  let imageUrl: string | null = null;
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveImage(file);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Klarte ikke å lagre bildet." };
    }
  }

  const db = await getDb();
  await db.insert(wishes).values({ userId: user.id, text, link, imageUrl });
  after(() => safely(pushToAdmins({ title: `Nytt ønske fra ${user.displayName}`, body: text, url: "/admin/onsker", tag: "nytt-onske" })));
  refresh();
  return { ok: Date.now() };
}

/** Liam svarer: ja (med pris) eller nei, og en beskjed. */
export async function replyWishAction(_prev: WishState, form: FormData): Promise<WishState> {
  await requireAdmin();
  const id = Number(form.get("id"));
  const status = String(form.get("status") ?? "");
  const reply = String(form.get("reply") ?? "").trim() || null;
  const price = parseKroner(form.get("price"));
  if (status !== "ja" && status !== "nei") return { error: "Velg ja eller nei." };
  if (status === "ja" && (price === null || Number.isNaN(price))) return { error: "Skriv en pris i hele kroner." };
  if (reply && reply.length > MAX_WISH) return { error: `Beskjeden kan være maks ${MAX_WISH} tegn.` };

  const db = await getDb();
  const done = await db
    .update(wishes)
    .set({ status, priceNok: status === "ja" ? price : null, adminReply: reply, answeredAt: new Date() })
    .where(eq(wishes.id, id))
    .returning({ userId: wishes.userId });
  if (done.length === 0) return { error: "Fant ikke ønsket." };

  const title = status === "ja" ? "3DKing kan lage ønsket ditt!" : "Svar på ønsket ditt";
  const body = [status === "ja" && price != null ? `Pris ${price} kr` : null, reply].filter(Boolean).join(" · ") || "Se svaret i appen.";
  after(() => safely(sendPush([done[0].userId], { title, body, url: "/onsker", tag: `onske-${id}` })));
  refresh();
  return { ok: Date.now() };
}

/** Sletter et ønske. Kunden kan slette sine egne før Liam har svart, Liam kan slette alle. */
export async function deleteWishAction(id: number): Promise<void> {
  const user = await requireUser();
  const wish = await getWish(id);
  if (!wish) return;
  const isAdmin = user.role === "admin";
  if (!isAdmin && (wish.userId !== user.id || wish.status !== "ny")) return;
  const db = await getDb();
  await db.delete(wishes).where(isAdmin ? eq(wishes.id, id) : and(eq(wishes.id, id), eq(wishes.userId, user.id)));
  // Bildet slettes bare hvis det ikke er brukt på et produkt.
  if (wish.imageUrl && !wish.productId) await deleteImage(wish.imageUrl);
  refresh();
}
