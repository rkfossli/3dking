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
import { APPROVALS, MAX_QUANTITY, MAX_REPLY, isStatus, newOrderNumber } from "@/lib/orders";

export type OrderState = { error?: string; ok?: boolean; orderNumber?: string };

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
  // Ordrenummeret er tilfeldig, så det kan (sjelden) være tatt. Da prøver vi et nytt.
  let orderNumber = "";
  for (let attempt = 0; attempt < 20 && !orderNumber; attempt++) {
    const candidate = newOrderNumber();
    const inserted = await db
      .insert(orders)
      .values({ orderNumber: candidate, userId: user.id, productId, quantity, note, unitPriceNok: product.priceNok, unitCostNok: product.costNok })
      .onConflictDoNothing({ target: orders.orderNumber })
      .returning({ id: orders.id });
    if (inserted.length > 0) orderNumber = candidate;
  }
  if (!orderNumber) return { error: "Fikk ikke laget bestillingen. Prøv igjen." };

  // Varsel til Liam. after() sender det etter at svaret har gått tilbake, så brukeren slipper å vente.
  after(() =>
    safely(
      pushToAdmins({
        title: `Ny bestilling fra ${user.displayName}`,
        body: `#${orderNumber} · ${quantity} × ${product.name}${note ? ` · «${note}»` : ""}`,
        url: "/admin/bestillinger?vis=ny",
        tag: "ny-bestilling",
      }),
    ),
  );

  revalidatePath("/mine");
  revalidatePath("/admin/bestillinger");
  revalidatePath("/admin/oversikt");
  return { ok: true, orderNumber };
}

/** Brukeren angrer en bestilling som ikke er laget ennå. */
export async function cancelMyOrderAction(orderId: number): Promise<void> {
  const user = await requireUser();
  const db = await getDb();
  // Både "min bestilling" og "fortsatt ny" sjekkes i samme spørring, så ingen kan avbryte andres.
  const done = await db
    .update(orders)
    .set({ status: "avbrutt" })
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id), eq(orders.status, "ny")))
    .returning({ id: orders.id });
  // Liam får beskjed, så han ikke begynner å printe noe som er avbrutt.
  if (done.length > 0) {
    after(() =>
      safely(pushToAdmins({ title: `${user.displayName} avbrøt en bestilling`, body: "Se Ordre › Avbrutt.", url: "/admin/bestillinger?vis=avbrutt", tag: `avbrutt-${orderId}` })),
    );
  }
  revalidatePath("/mine");
  revalidatePath("/admin/bestillinger");
}

/** Varsel til den som bestilte. Hentes fra databasen så vi vet hvem og hva. */
async function notifyCustomer(orderId: number, title: string, body: (productName: string) => string) {
  const db = await getDb();
  const [o] = await db
    .select({ userId: orders.userId, productName: products.name, quantity: orders.quantity, orderNumber: orders.orderNumber })
    .from(orders)
    .innerJoin(products, eq(products.id, orders.productId))
    .where(eq(orders.id, orderId));
  if (!o) return;
  const no = o.orderNumber ? `#${o.orderNumber} · ` : "";
  await sendPush([o.userId], { title, body: no + body(`${o.quantity} × ${o.productName}`), url: "/mine", tag: `bestilling-${orderId}` });
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

export type ResponseState = { error?: string; ok?: boolean };

/**
 * Kunden svarer på «godkjent med endringer»: godtar endringene, eller sier at de ikke er ønsket.
 * Liam får et varsel. Vil kunden heller avbryte, brukes cancelMyOrderAction.
 */
export async function respondToChangesAction(_prev: ResponseState, form: FormData): Promise<ResponseState> {
  const user = await requireUser();
  const orderId = Number(form.get("orderId"));
  const response = String(form.get("response") ?? "");
  const note = String(form.get("note") ?? "").trim();
  if (response !== "godtatt" && response !== "avslatt") return { error: "Ugyldig valg." };
  if (note.length > MAX_REPLY) return { error: `Kommentaren kan være maks ${MAX_REPLY} tegn.` };

  const db = await getDb();
  // Bare egne bestillinger, og bare når Liam faktisk har foreslått endringer.
  const done = await db
    .update(orders)
    .set({ customerResponse: response, customerNote: note || null, customerRespondedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id), eq(orders.approval, "endringer")))
    .returning({ id: orders.id });
  if (done.length === 0) return { error: "Fant ikke bestillingen." };

  const [o] = await db
    .select({ productName: products.name, quantity: orders.quantity, orderNumber: orders.orderNumber })
    .from(orders)
    .innerJoin(products, eq(products.id, orders.productId))
    .where(eq(orders.id, orderId));
  const what = o ? `${o.orderNumber ? `#${o.orderNumber} · ` : ""}${o.quantity} × ${o.productName}` : "bestillingen";
  after(() =>
    safely(
      pushToAdmins({
        title: response === "godtatt" ? `${user.displayName} godtok endringene` : `${user.displayName} vil ikke ha endringene`,
        body: `${what}${note ? ` · «${note}»` : ""}`,
        url: "/admin/bestillinger?vis=alle",
        tag: `svar-${orderId}`,
      }),
    ),
  );
  revalidatePath("/mine");
  revalidatePath("/admin/bestillinger");
  return { ok: true };
}

/** Liam markerer at en bestilling er betalt (eller angrer). Betaling skjer med Vipps, utenfor appen. */
export async function setPaidAction(orderId: number, paid: boolean): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.update(orders).set({ paidAt: paid ? new Date() : null }).where(eq(orders.id, orderId));
  revalidatePath("/admin/bestillinger");
  revalidatePath("/admin/oversikt");
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
      // Nytt svar fra Liam betyr at kunden må svare på nytt.
      customerResponse: null,
      customerNote: null,
      customerRespondedAt: null,
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
