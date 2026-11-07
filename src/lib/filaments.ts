// Filamentfargene: lese fra databasen.
import "server-only";
import { asc } from "drizzle-orm";
import { getDb } from "./db";
import { filaments } from "./schema";

export type Filament = typeof filaments.$inferSelect;

/** Alle fargene, sortert på navn. */
export async function allFilaments(): Promise<Filament[]> {
  const db = await getDb();
  return db.select().from(filaments).orderBy(asc(filaments.name));
}

export { isHex } from "./palette";
