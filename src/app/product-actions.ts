"use server";
// Handlinger for produkter. Bare admin får bruke dem.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, products, wishes } from "@/lib/schema";
import { after } from "next/server";
import { safely, sendPush } from "@/lib/push";
import { getWish } from "@/lib/wishes";
import { requireAdmin } from "@/lib/auth";
import { getProduct, parseKroner } from "@/lib/products";
import { deleteImage, saveImage } from "@/lib/images";

export type ProductFormState = { error?: string };

/**
 * Lagrer et produkt. Har skjemaet et skjult felt `id`, oppdateres det produktet.
 * Uten `id` lages et nytt produkt.
 */
export async function saveProductAction(_prev: ProductFormState, form: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const id = Number(form.get("id")) || null;
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const priceNok = parseKroner(form.get("price"));
  const costNok = parseKroner(form.get("cost"));
  const available = form.get("available") === "on"; // avkrysningsboks: "on" når den er huket av

  if (!name) return { error: "Produktet må ha et navn." };
  if (priceNok === null || Number.isNaN(priceNok)) return { error: "Skriv en pris i hele kroner, for eksempel 50." };
  if (Number.isNaN(costNok)) return { error: "Filamentkost må være et tall, eller stå tom." };

  // Lages produktet fra et ønske, brukes bildet fra ønsket hvis Liam ikke velger et nytt.
  const wishId = Number(form.get("wishId")) || null;
  const wish = wishId ? await getWish(wishId) : null;

  // Bilde: et nytt bilde erstatter det gamle. "Fjern bilde" tar det bort.
  const old = id ? await getProduct(id) : null;
  let imageUrl = old?.imageUrl ?? wish?.imageUrl ?? null;
  const file = form.get("image");
  const removeImage = form.get("removeImage") === "on";
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveImage(file);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Klarte ikke å lagre bildet." };
    }
  } else if (removeImage) {
    imageUrl = null;
  }

  const values = { name, description, priceNok, costNok, available, imageUrl };
  const db = await getDb();
  if (id) await db.update(products).set(values).where(eq(products.id, id));
  else {
    const [created] = await db.insert(products).values(values).returning({ id: products.id });
    // Ønsket kobles til det nye produktet, så kunden får en «Bestill»-knapp på ønsket sitt.
    if (wish) {
      await db.update(wishes).set({ productId: created.id }).where(eq(wishes.id, wish.id));
      after(() =>
        safely(sendPush([wish.userId], { title: "Ønsket ditt er i butikken!", body: `${name} kan bestilles nå.`, url: "/onsker", tag: `onske-${wish.id}` })),
      );
      revalidatePath("/onsker");
      revalidatePath("/admin/onsker");
    }
  }

  // Rydd bort det gamle bildet hvis det ble byttet ut eller fjernet.
  if (old?.imageUrl && old.imageUrl !== imageUrl) await deleteImage(old.imageUrl);

  revalidatePath("/admin/produkter");
  revalidatePath("/");
  redirect("/admin/produkter");
}

/** Vis eller skjul et produkt i katalogen. Vi sletter ikke, fordi gamle bestillinger peker på produktet. */
export async function setAvailableAction(id: number, available: boolean): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.update(products).set({ available }).where(eq(products.id, id));
  revalidatePath("/admin/produkter");
  revalidatePath("/");
}

/**
 * Slett et produkt for godt, sammen med bildet.
 * Har noen bestilt produktet, slettes det ikke, så bestillingshistorikken ikke blir ødelagt.
 */
export async function deleteProductAction(id: number): Promise<{ error?: string }> {
  await requireAdmin();
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(orders).where(eq(orders.productId, id));
  if (n > 0) return { error: "Noen har bestilt dette produktet, så det kan ikke slettes. Skjul det i stedet." };
  const product = await getProduct(id);
  await db.delete(products).where(eq(products.id, id));
  if (product?.imageUrl) await deleteImage(product.imageUrl);
  revalidatePath("/admin/produkter");
  revalidatePath("/");
  return {};
}
