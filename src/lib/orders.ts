// Bestillinger: statuser og spørringer.
import "server-only";
import { and, asc, count, desc, eq, gt, isNotNull, isNull, ne, sql } from "drizzle-orm";
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
  paidAt: Date | null;
  productId: number;
  userId: number;
  productName: string;
  productImage: string | null;
  costNok: number | null;
  userName: string;
};

async function query(where?: ReturnType<typeof eq>, oldestFirst = false) {
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
      paidAt: orders.paidAt,
      productId: orders.productId,
      userId: orders.userId,
      productName: products.name,
      productImage: products.imageUrl,
      // Kostnaden fra da det ble bestilt. Mangler den, brukes produktets kostnad nå.
      costNok: sql<number | null>`coalesce(${orders.unitCostNok}, ${products.costNok})`,
      userName: users.displayName,
    })
    .from(orders)
    .innerJoin(products, eq(products.id, orders.productId))
    .innerJoin(users, eq(users.id, orders.userId));
  const order = oldestFirst ? asc(orders.createdAt) : desc(orders.createdAt);
  return (where ? q.where(where) : q).orderBy(order);
}

/**
 * Alle bestillinger med en gitt status (eller alle). Til admin.
 * «Ny» og «Laget» vises med eldste først, så Liam printer og leverer i den rekkefølgen folk bestilte.
 * De andre vises med nyeste først.
 */
export async function ordersByStatus(status: Status | "alle"): Promise<OrderRow[]> {
  const oldestFirst = status === "ny" || status === "laget";
  return query(status === "alle" ? undefined : eq(orders.status, status), oldestFirst);
}

/** Hvor mange bestillinger det er med hver status, for tallene på filtrene. */
export async function countByStatus(): Promise<Record<Status, number>> {
  const db = await getDb();
  const rows = await db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status);
  const counts: Record<Status, number> = { ny: 0, laget: 0, levert: 0, avbrutt: 0 };
  for (const r of rows) if (isStatus(r.status)) counts[r.status] = r.n;
  return counts;
}

/** Én person som skylder penger: navn, beløp og hvor mange bestillinger det gjelder. */
export type Debt = { userName: string; amount: number; orders: number };

/** Det som ikke er betalt ennå (alt unntatt avbrutte), samlet per person. Mest først. */
export async function outstandingByUser(): Promise<Debt[]> {
  const db = await getDb();
  const rows = await db
    .select({ userName: users.displayName, quantity: orders.quantity, unitPriceNok: orders.unitPriceNok })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(and(isNull(orders.paidAt), ne(orders.status, "avbrutt")));
  const byUser = new Map<string, Debt>();
  for (const r of rows) {
    const d = byUser.get(r.userName) ?? { userName: r.userName, amount: 0, orders: 0 };
    d.amount += r.quantity * r.unitPriceNok;
    d.orders += 1;
    byUser.set(r.userName, d);
  }
  return [...byUser.values()].sort((a, b) => b.amount - a.amount);
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

/** Én måned i oversikten. */
export type MonthSummary = {
  month: string; // "2026-11"
  orders: number;
  items: number;
  income: number; // det brukerne betaler
  filament: number; // det filamentet kostet
  products: { name: string; items: number }[]; // mest bestilt først
};

/** Måneden en dato hører til, i norsk tid, som "2026-11". */
const monthKey = (d: Date) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit" }).format(d);

/**
 * Månedsoversikt for Liam: alle bestillinger som ikke er avbrutt, gruppert på måneden de ble bestilt.
 * Regnes ut i JavaScript i stedet for SQL, så det er lettere å lese.
 */
export async function monthlySummary(): Promise<MonthSummary[]> {
  const db = await getDb();
  const rows = await db
    .select({
      createdAt: orders.createdAt,
      quantity: orders.quantity,
      unitPriceNok: orders.unitPriceNok,
      unitCostNok: sql<number | null>`coalesce(${orders.unitCostNok}, ${products.costNok})`,
      name: products.name,
    })
    .from(orders)
    .innerJoin(products, eq(products.id, orders.productId))
    .where(ne(orders.status, "avbrutt"));

  const months = new Map<string, MonthSummary & { counts: Map<string, number> }>();
  for (const r of rows) {
    const key = monthKey(r.createdAt);
    let m = months.get(key);
    if (!m) {
      m = { month: key, orders: 0, items: 0, income: 0, filament: 0, products: [], counts: new Map() };
      months.set(key, m);
    }
    m.orders += 1;
    m.items += r.quantity;
    m.income += r.quantity * r.unitPriceNok;
    m.filament += r.quantity * (r.unitCostNok ?? 0);
    m.counts.set(r.name, (m.counts.get(r.name) ?? 0) + r.quantity);
  }
  return [...months.values()]
    .map(({ counts, ...m }) => ({
      ...m,
      products: [...counts].map(([name, items]) => ({ name, items })).sort((a, b) => b.items - a.items),
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}
