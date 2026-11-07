"use server";
// Handlinger for kategoriene. Bare admin får bruke dem.
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth";
import { allCategories } from "@/lib/categories";

export type CategoryState = { error?: string; ok?: number };

function refresh() {
  revalidatePath("/admin/kategorier");
  revalidatePath("/");
}

/** Ny kategori. Den havner sist. */
export async function addCategoryAction(_prev: CategoryState, form: FormData): Promise<CategoryState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 30);
  if (!name) return { error: "Kategorien må ha et navn." };
  const db = await getDb();
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${categories.sort}), 0)` }).from(categories);
  await db.insert(categories).values({ name, sort: Number(max) + 1 });
  refresh();
  return { ok: Date.now() };
}

/** Gi en kategori nytt navn. */
export async function renameCategoryAction(id: number, name: string): Promise<{ error?: string }> {
  await requireAdmin();
  const clean = name.trim().slice(0, 30);
  if (!clean) return { error: "Kategorien må ha et navn." };
  const db = await getDb();
  await db.update(categories).set({ name: clean }).where(eq(categories.id, id));
  refresh();
  return {};
}

/** Flytt en kategori ett hakk opp (-1) eller ned (+1) ved å bytte plass med naboen. */
export async function moveCategoryAction(id: number, dir: -1 | 1): Promise<void> {
  await requireAdmin();
  const list = await allCategories();
  const i = list.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  const db = await getDb();
  // Skriv rekkefølgen på nytt (1, 2, 3 …), så den alltid er ryddig.
  for (const [n, c] of list.entries()) await db.update(categories).set({ sort: n + 1 }).where(eq(categories.id, c.id));
  refresh();
}

/** Slett en kategori. Produktene blir værende, de er bare ikke med i kategorien lenger. */
export async function deleteCategoryAction(id: number): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(categories).where(eq(categories.id, id));
  refresh();
}
