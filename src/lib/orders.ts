// Bestillinger: statuser og spørringer.
import "server-only";
import { and, asc, count, desc, eq, gt, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "./db";
import { orders, products, users } from "./schema";
import { statsSince } from "./stats";

/** En bestilling går ny → laget → levert. Avbrutt er en utvei underveis. */
export const STATUSES = ["ny", "laget", "levert", "avbrutt"] as const;
export type Status = (typeof STATUSES)[number];

export function isStatus(v: string): v is Status {
  return (STATUSES as readonly string[]).includes(v);
}

export const MAX_QUANTITY = 20;
/** Maks antall linjer i én handlekurv. */
export const MAX_LINES = 15;

/** Svar Liam kan gi på en bestilling. "" betyr ikke svart ennå. */
export const APPROVALS = ["", "godkjent", "endringer"] as const;
export const MAX_REPLY = 500;

/** Én rad per bestilling, med navnet på produktet og den som bestilte (JOIN mot to tabeller). */
export type OrderRow = {
  id: number;
  orderNumber: string | null;
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
  paymentNote: string | null;
  customerResponse: string | null;
  customerNote: string | null;
  customerRespondedAt: Date | null;
  colorName: string | null;
  colorHex: string | null;
  extraColors: string | null;
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
      orderNumber: orders.orderNumber,
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
      paymentNote: orders.paymentNote,
      customerResponse: orders.customerResponse,
      customerNote: orders.customerNote,
      customerRespondedAt: orders.customerRespondedAt,
      colorName: orders.colorName,
      colorHex: orders.colorHex,
      extraColors: orders.extraColors,
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

/**
 * Filtrene i Ordre. «Levert» er delt i to: «Ikke betalt» (levert, men ikke betalt ennå)
 * og «Ferdig» (levert og betalt). Slik ser Liam hvem som skylder penger.
 */
export const ORDER_FILTERS = ["ny", "laget", "ubetalt", "ferdig", "avbrutt", "alle"] as const;
export type OrderFilter = (typeof ORDER_FILTERS)[number];
export const FILTER_LABEL: Record<OrderFilter, string> = {
  ny: "Ny",
  laget: "Laget",
  ubetalt: "Ikke betalt",
  ferdig: "Ferdig",
  avbrutt: "Avbrutt",
  alle: "Alle",
};

export function isOrderFilter(v: string): v is OrderFilter {
  return (ORDER_FILTERS as readonly string[]).includes(v);
}

export async function ordersByFilter(filter: OrderFilter): Promise<OrderRow[]> {
  if (filter === "ubetalt") return query(and(eq(orders.status, "levert"), isNull(orders.paidAt)), true);
  if (filter === "ferdig") return query(and(eq(orders.status, "levert"), isNotNull(orders.paidAt)), false);
  return ordersByStatus(filter);
}

/** Hvor mange bestillinger det er under hvert filter, for tallene på filtrene. */
export async function countByFilter(): Promise<Record<OrderFilter, number>> {
  const db = await getDb();
  const rows = await db
    .select({ status: orders.status, paid: sql<boolean>`${orders.paidAt} is not null`, n: count() })
    .from(orders)
    .groupBy(orders.status, sql`${orders.paidAt} is not null`);
  const counts: Record<OrderFilter, number> = { ny: 0, laget: 0, ubetalt: 0, ferdig: 0, avbrutt: 0, alle: 0 };
  for (const r of rows) {
    if (r.status === "levert") counts[r.paid ? "ferdig" : "ubetalt"] += r.n;
    else if (r.status === "ny" || r.status === "laget" || r.status === "avbrutt") counts[r.status] += r.n;
  }
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

/** Nytt ordrenummer: 4 tilfeldige sifre + de to siste sifrene i årstallet, f.eks. "482726" i 2026. */
export function newOrderNumber(now = new Date()): string {
  const random = String(Math.floor(Math.random() * 10_000)).padStart(4, "0");
  const year = new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", year: "2-digit" }).format(now);
  return random + year;
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

/** Tallene i Verkstedet. */
export type WorkshopStats = {
  printed: number; // ting som er ferdig laget eller levert
  orders: number; // bestillinger (ordrenumre), avbrutte teller ikke
  customers: number; // forskjellige personer som har bestilt
  filament: number; // hva filamentet har kostet til sammen
  income: number; // hva kundene har betalt eller skal betale
  top: { name: string; items: number } | null; // mest bestilte produkt
};

/** Statistikk for Liam. `since` = bare fra denne datoen (f.eks. 1. januar i år). Regnes ut i JavaScript. */
export async function workshopStats(since?: Date): Promise<WorkshopStats> {
  const db = await getDb();
  const rows = await db
    .select({
      orderNumber: orders.orderNumber,
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      quantity: orders.quantity,
      unitPriceNok: orders.unitPriceNok,
      unitCostNok: sql<number | null>`coalesce(${orders.unitCostNok}, ${products.costNok})`,
      name: products.name,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(products, eq(products.id, orders.productId))
    .where(ne(orders.status, "avbrutt"));

  // Bare bestillinger etter at tellingen startet (og etter starten av perioden, hvis valgt).
  const start = await statsSince();
  const from = [since, start].filter((d): d is Date => d != null).sort((a, b) => b.getTime() - a.getTime())[0];
  const list = from ? rows.filter((r) => r.createdAt >= from) : rows;
  const counts = new Map<string, number>();
  let printed = 0;
  let filament = 0;
  let income = 0;
  for (const r of list) {
    if (r.status === "laget" || r.status === "levert") printed += r.quantity;
    filament += r.quantity * (r.unitCostNok ?? 0);
    income += r.quantity * r.unitPriceNok;
    counts.set(r.name, (counts.get(r.name) ?? 0) + r.quantity);
  }
  const [topName, topItems] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
  return {
    printed,
    orders: new Set(list.map((r) => r.orderNumber ?? `id-${r.id}`)).size,
    customers: new Set(list.map((r) => r.userId)).size,
    filament,
    income,
    top: topName ? { name: topName, items: topItems } : null,
  };
}
