"use server";
// Husk at brukeren har sett introturen, så den ikke kommer igjen av seg selv.
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireUser } from "@/lib/auth";

export async function markTourSeenAction(): Promise<void> {
  const user = await requireUser();
  if (user.tourSeenAt) return;
  const db = await getDb();
  await db.update(users).set({ tourSeenAt: new Date() }).where(eq(users.id, user.id));
}
