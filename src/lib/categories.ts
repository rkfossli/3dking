// Kategorier: lese fra databasen.
import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { categories, productCategories } from "./schema";

export type Category = typeof categories.$inferSelect;

/** Alle kategoriene i den rekkefølgen Liam har valgt. */
export async function allCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.select().from(categories).orderBy(asc(categories.sort), asc(categories.id));
}

/** Id-ene til kategoriene ett produkt er med i. */
export async function categoryIdsFor(productId: number): Promise<number[]> {
  const db = await getDb();
  const rows = await db.select({ id: productCategories.categoryId }).from(productCategories).where(eq(productCategories.productId, productId));
  return rows.map((r) => r.id);
}

/** For mange produkter på en gang: produkt-id → kategori-id-er. */
export async function categoryMap(productIds: number[]): Promise<Map<number, number[]>> {
  const map = new Map<number, number[]>();
  if (productIds.length === 0) return map;
  const db = await getDb();
  const rows = await db.select().from(productCategories).where(inArray(productCategories.productId, productIds));
  for (const r of rows) map.set(r.productId, [...(map.get(r.productId) ?? []), r.categoryId]);
  return map;
}
