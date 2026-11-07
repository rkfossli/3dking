// Bestillinger: statuser og spørringer.
import "server-only";
import { and, count, desc, eq, gt, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import { orders, products, users } from "./schema";

/** En bestilling går ny → laget → levert. Avbrutt er en utvei underveis. */
export const STATUSES = ["ny", "laget", "levert", "avbrutt"] as const;
export type Status = (typeof STATUSES)[number];

export function isStatus(v: string): v is Status {
  return (STATUSES as readonly string[]).includes(v);
}

export const MAX_QUANTITY = 20;

/** Svar Liam kan gi på en bestilling. "" betyr ikke svart ennå. */
export const APPROVALS = ["", "godkjent", "endringer"] as const;
export const MAX_REPLY = 500;

/** Én rad per bestilling, med navnet på produktet og den som bestilte (JOIN mot to tabeller). */
export type OrderRow = {
  id: number;
  quantity: number;
  note: string | null;
  unitPriceNok: number;
  status: string;
  createdAt: Date;
  madeAt: Date | null;
  deliveredAt: Date | null;
  approval: string | null;
  adminReply: string | null;
  repliedAt: Date | null;
  deliveryPlan: string | null;
  changedByAdminAt: Date | null;
  productName: string;
  productImage: string | null;
  costNok: number | null;
  userName: string;
};

async function query(where?: ReturnType<typeof eq>) {
  const db = await getDb();
  const q = db
    .select({
      id: orders.id,
      quantity: orders.quantity,
      note: orders.note,
      unitPriceNok: orders.unitPriceNok,
      status: orders.status,
      createdAt: orders.createdAt,
      madeAt: orders.madeAt,
      deliveredAt: orders.deliveredAt,
      approval: orders.approval,
      adminReply: orders.adminReply,
      repliedAt: orders.repliedAt,
      deliveryPlan: orders.deliveryPlan,
      changedByAdminAt: orders.changedByAdminAt,
      productName: products.name,
      productImage: products.imageUrl,
      costNok: products.costNok,
      userName: users.displayName,
    })
    .from(orders)
    .innerJoin(products, eq(products.id, orders.productId))
    .innerJoin(users, eq(users.id, orders.userId));
  return (where ? q.where(where) : q).orderBy(desc(orders.createdAt));
}

/** Alle bestillinger med en gitt status (eller alle), nyeste først. Til admin. */
export async function ordersByStatus(status: Status | "alle"): Promise<OrderRow[]> {
  return query(status === "alle" ? undefined : eq(orders.status, status));
}

/** Bestillingene til én bruker. */
export async function ordersForUser(userId: number): Promise<OrderRow[]> {
  return query(eq(orders.userId, userId));
}

/** Hvor mange av brukerens bestillinger som er laget og venter på levering. Vises på forsiden. */
export async function countReadyForUser(userId: number): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ n: count() })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, "laget")));
  return row.n;
}

/** Hvor mange av brukerens bestillinger Liam har endret siden brukeren sist åpnet «Mine bestillinger». */
export async function countUpdatesForUser(userId: number, seenAt: Date | null): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ n: count() })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        // Har brukeren aldri vært inne, teller alt Liam har endret.
        seenAt ? gt(orders.changedByAdminAt, seenAt) : isNotNull(orders.changedByAdminAt),
      ),
    );
  return row.n;
}

/** Hvor mange bestillinger som venter på å bli laget. Vises som tall på admin-fanen. */
export async function countNew(): Promise<number> {
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(orders).where(and(eq(orders.status, "ny")));
  return row.n;
}
