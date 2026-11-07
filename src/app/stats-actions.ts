"use server";
// Start tellingen i Verkstedet på nytt. Bestillingene blir liggende, de telles bare ikke med.
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth";
import { STATS_KEY } from "@/lib/stats";

export async function restartStatsAction(): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  const value = new Date().toISOString();
  await db.insert(settings).values({ key: STATS_KEY, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  revalidatePath("/admin/verksted");
  revalidatePath("/");
}
