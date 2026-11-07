"use server";
// Handlinger for bestillinger.
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, products } from "@/lib/schema";
import { requireAdmin, requireUser } from "@/lib/auth";
import { MAX_QUANTITY, isStatus } from "@/lib/orders";

export type OrderState = { error?: string; ok?: boolean };

/** En bruker bestiller et produkt. */
export async function placeOrderAction(_prev: OrderState, form: FormData): Promise<OrderState> {
  const user = await requireUser();
  const productId = Number(form.get("productId"));
  const quantity = Number(form.get("quantity"));
  const note = String(form.get("note") ?? "").trim().slice(0, 500) || null;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return { error: `Antall må være mellom 1 og ${MAX_QUANTITY}.` };
  }

  const db = await getDb();
  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product || !product.available) return { error: "Produktet finnes ikke lenger." };

  // Prisen kopieres inn i bestillingen, så den ikke endres om Liam endrer prisen senere.
  await db.insert(orders).values({ userId: user.id, productId, quantity, note, unitPriceNok: product.priceNok });

  revalidatePath("/mine");
  revalidatePath("/admin/bestillinger");
  return { ok: true };
}

/** Brukeren angrer en bestilling som ikke er laget ennå. */
export async function cancelMyOrderAction(orderId: number): Promise<void> {
  const user = await requireUser();
  const db = await getDb();
  // Både "min bestilling" og "fortsatt ny" sjekkes i samme spørring, så ingen kan avbryte andres.
  await db
    .update(orders)
    .set({ status: "avbrutt" })
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id), eq(orders.status, "ny")));
  revalidatePath("/mine");
  revalidatePath("/admin/bestillinger");
}

/** Liam flytter en bestilling til en ny status. */
export async function setOrderStatusAction(orderId: number, status: string): Promise<void> {
  await requireAdmin();
  if (!isStatus(status)) return;
  const db = await getDb();
  const now = new Date();
  // Tidspunktene settes når bestillingen kommer dit, og fjernes hvis Liam angrer.
  await db
    .update(orders)
    .set({
      status,
      madeAt: status === "laget" || status === "levert" ? now : null,
      deliveredAt: status === "levert" ? now : null,
    })
    .where(eq(orders.id, orderId));
  revalidatePath("/admin/bestillinger");
  revalidatePath("/mine");
}
