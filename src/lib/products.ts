// Hjelpere for produkter: lese fra databasen og sjekke skjemaer.
import "server-only";
import { and, asc, desc, eq, gte, ne, sql } from "drizzle-orm";
import { getDb } from "./db";
import { orders, products } from "./schema";
import { statsSince } from "./stats";

export type Product = typeof products.$inferSelect;

/** Alle produkter, nyeste først (til admin). */
export async function allProducts(): Promise<Product[]> {
  const db = await getDb();
  return db.select().from(products).orderBy(desc(products.createdAt));
}

/** Bare produktene som er til salgs, sortert på navn (til katalogen). */
export async function availableProducts(): Promise<Product[]> {
  const db = await getDb();
  return db.select().from(products).where(eq(products.available, true)).orderBy(asc(products.name));
}

/** Produktene som er bestilt mest (minst 2 stk, avbrutte teller ikke). Får merket «Populær». */
export async function popularProductIds(limit = 3): Promise<number[]> {
  const db = await getDb();
  const since = await statsSince(); // bare bestillinger etter at tellingen startet
  const rows = await db
    .select({ id: orders.productId, items: sql<number>`sum(${orders.quantity})` })
    .from(orders)
    .where(since ? and(ne(orders.status, "avbrutt"), gte(orders.createdAt, since)) : ne(orders.status, "avbrutt"))
    .groupBy(orders.productId)
    .orderBy(desc(sql`sum(${orders.quantity})`))
    .limit(limit);
  return rows.filter((r) => Number(r.items) >= 2).map((r) => r.id);
}

/** «Ny» = lagt ut de siste 14 dagene. */
export function isNewProduct(createdAt: Date, now = Date.now()): boolean {
  return now - createdAt.getTime() < 14 * 24 * 60 * 60 * 1000;
}

export async function getProduct(id: number): Promise<Product | null> {
  const db = await getDb();
  const [p] = await db.select().from(products).where(eq(products.id, id));
  return p ?? null;
}

/** Leser et kronebeløp fra skjemaet. Tomt felt gir null. Ugyldig gir NaN. */
export function parseKroner(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim().replace(",", ".");
  if (text === "") return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : NaN;
}
