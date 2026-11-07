"use server";
// Handlinger for bestillinger.
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, products } from "@/lib/schema";
import { pushToAdmins, safely, sendPush } from "@/lib/push";
import { APPROVAL_LABEL } from "@/lib/format";
import { requireAdmin, requireUser } from "@/lib/auth";
import { APPROVALS, MAX_QUANTITY, MAX_REPLY, isStatus } from "@/lib/orders";

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
  await db
    .insert(orders)
    .values({ userId: user.id, productId, quantity, note, unitPriceNok: product.priceNok, unitCostNok: product.costNok });

  // Varsel til Liam. after() sender det etter at svaret har gått tilbake, så brukeren slipper å vente.
  after(() =>
    safely(
      pushToAdmins({
        title: "Ny bestilling",
        body: `${user.displayName}: ${quantity} × ${product.name}${note ? ` («${note}»)` : ""}`,
        url: "/admin/bestillinger?vis=ny",
        tag: "ny-bestilling",
      }),
    ),
  );

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

/** Varsel til den som bestilte. Hentes fra databasen så vi vet hvem og hva. */
async function notifyCustomer(orderId: number, title: string, body: (productName: string) => string) {
  const db = await getDb();
  const [o] = await db
    .select({ userId: orders.userId, productName: products.name, quantity: orders.quantity })
    .from(orders)
    .innerJoin(products, eq(products.id, orders.productId))
    .where(eq(orders.id, orderId));
  if (!o) return;
  await sendPush([o.userId], { title, body: body(`${o.quantity} × ${o.productName}`), url: "/mine", tag: `bestilling-${orderId}` });
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
      changedByAdminAt: now,
    })
    .where(eq(orders.id, orderId));
  if (status === "laget") after(() => safely(notifyCustomer(orderId, "Ferdig laget", (what) => `${what} er ferdig printet.`)));
  if (status === "levert") after(() => safely(notifyCustomer(orderId, "Levert", (what) => `${what} er levert. Kos deg!`)));
  if (status === "avbrutt") after(() => safely(notifyCustomer(orderId, "Bestilling avbrutt", (what) => `${what} ble avbrutt.`)));
  revalidatePath("/admin/bestillinger");
  revalidatePath("/mine");
}

/** Liam sletter en bestilling for godt (for eksempel en test eller en som er avbrutt). */
export async function deleteOrderAction(orderId: number): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(orders).where(eq(orders.id, orderId));
  revalidatePath("/admin/bestillinger");
  revalidatePath("/mine");
}

export type ReplyState = { error?: string; ok?: boolean };

/** Liam svarer på en bestilling: godkjent / godkjent med endringer, en beskjed og planlagt levering. */
export async function replyToOrderAction(_prev: ReplyState, form: FormData): Promise<ReplyState> {
  await requireAdmin();
  const orderId = Number(form.get("orderId"));
  const approval = String(form.get("approval") ?? "");
  const reply = String(form.get("reply") ?? "").trim();
  const plan = String(form.get("deliveryPlan") ?? "").trim();

  if (!(APPROVALS as readonly string[]).includes(approval)) return { error: "Ugyldig valg." };
  if (reply.length > MAX_REPLY) return { error: `Beskjeden kan være maks ${MAX_REPLY} tegn.` };
  if (plan.length > 200) return { error: "Planlagt levering kan være maks 200 tegn." };
  // Endringer må forklares, ellers vet ikke kunden hva som er endret.
  if (approval === "endringer" && !reply) return { error: "Skriv hvilke endringer du gjør." };

  const db = await getDb();
  const empty = !approval && !reply;
  await db
    .update(orders)
    .set({
      approval: approval || null,
      adminReply: reply || null,
      repliedAt: empty ? null : new Date(),
      deliveryPlan: plan || null,
      changedByAdminAt: new Date(),
    })
    .where(eq(orders.id, orderId));
  if (!empty) {
    const title = approval ? APPROVAL_LABEL[approval] : "Beskjed fra 3DKing";
    const text = [reply, plan && `Levering: ${plan}`].filter(Boolean).join(" · ");
    after(() => safely(notifyCustomer(orderId, title, (what) => (text ? `${what}: ${text}` : what))));
  }
  revalidatePath("/admin/bestillinger");
  revalidatePath("/mine");
  return { ok: true };
}
