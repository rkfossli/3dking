"use server";
// Handlinger for produkter. Bare admin får bruke dem.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { products } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth";
import { parseKroner } from "@/lib/products";

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

  const values = { name, description, priceNok, costNok, available };
  const db = await getDb();
  if (id) await db.update(products).set(values).where(eq(products.id, id));
  else await db.insert(products).values(values);

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
