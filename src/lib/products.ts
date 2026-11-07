// Hjelpere for produkter: lese fra databasen og sjekke skjemaer.
import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { products } from "./schema";

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
