// Meldinger på bestillinger: lese fra databasen.
import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { orderMessages, users } from "./schema";

export type Message = { id: number; orderNumber: string; body: string; createdAt: Date; userId: number; userName: string; fromAdmin: boolean };

export const MAX_MESSAGE = 500;

/** En bestilling er ferdig når alle linjene er levert eller avbrutt. Da er samtalen stengt. */
export function isFinished(statuses: string[]): boolean {
  return statuses.length > 0 && statuses.every((s) => s === "levert" || s === "avbrutt");
}

/** Alle meldinger på noen ordrenumre, eldste først, samlet per nummer. */
export async function messagesFor(orderNumbers: string[]): Promise<Map<string, Message[]>> {
  const map = new Map<string, Message[]>();
  const numbers = [...new Set(orderNumbers)];
  if (numbers.length === 0) return map;
  const db = await getDb();
  const rows = await db
    .select({
      id: orderMessages.id,
      orderNumber: orderMessages.orderNumber,
      body: orderMessages.body,
      createdAt: orderMessages.createdAt,
      userId: orderMessages.userId,
      userName: users.displayName,
      role: users.role,
    })
    .from(orderMessages)
    .innerJoin(users, eq(users.id, orderMessages.userId))
    .where(inArray(orderMessages.orderNumber, numbers))
    .orderBy(asc(orderMessages.createdAt));
  for (const { role, ...r } of rows) {
    const list = map.get(r.orderNumber) ?? [];
    list.push({ ...r, fromAdmin: role === "admin" });
    map.set(r.orderNumber, list);
  }
  return map;
}
