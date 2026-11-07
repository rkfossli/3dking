// Ønskeboksen: lese ønsker fra databasen.
import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, wishes } from "./schema";

export type Wish = typeof wishes.$inferSelect & { userName: string };

export const MAX_WISH = 500;

async function query(where?: ReturnType<typeof eq>) {
  const db = await getDb();
  const q = db
    .select({ wish: wishes, userName: users.displayName })
    .from(wishes)
    .innerJoin(users, eq(users.id, wishes.userId));
  const rows = await (where ? q.where(where) : q).orderBy(desc(wishes.createdAt));
  return rows.map((r) => ({ ...r.wish, userName: r.userName }));
}

/** Ønskene til én kunde, nyeste først. */
export async function wishesForUser(userId: number): Promise<Wish[]> {
  return query(eq(wishes.userId, userId));
}

/** Alle ønsker, nyeste først. Til Liam. */
export async function allWishes(): Promise<Wish[]> {
  return query();
}

export async function getWish(id: number): Promise<Wish | null> {
  return (await query(eq(wishes.id, id)))[0] ?? null;
}

/** Hvor mange ønsker Liam ikke har svart på. Vises som tall på Ønsker-fanen. */
export async function countNewWishes(): Promise<number> {
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(wishes).where(eq(wishes.status, "ny"));
  return row.n;
}

/** Sjekker at en lenke er en vanlig nettadresse (http eller https). */
export function cleanLink(v: string): string | null {
  const text = v.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
