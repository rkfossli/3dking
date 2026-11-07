"use server";
// Lagrer valgt tema og lys/mørk modus på brukeren, så det følger med på alle enheter.
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { isMode, isTheme } from "@/lib/themes";

export async function setThemeAction(theme: string): Promise<void> {
  const user = await requireUser();
  if (!isTheme(theme)) return;
  const db = await getDb();
  await db.update(users).set({ theme }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
}

export async function setModeAction(mode: string): Promise<void> {
  const user = await requireUser();
  if (!isMode(mode)) return;
  const db = await getDb();
  await db.update(users).set({ mode }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
}
