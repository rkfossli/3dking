"use server";
// Handlinger for filamentfargene. Bare admin får bruke dem.
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { filaments } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth";
import { isHex } from "@/lib/filaments";

export type FilamentState = { error?: string; ok?: boolean };

function refresh() {
  revalidatePath("/admin/filament");
  revalidatePath("/produkt/[id]", "page");
}

/** Liam legger til en ny farge. */
export async function addFilamentAction(_prev: FilamentState, form: FormData): Promise<FilamentState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  const hex = String(form.get("hex") ?? "").trim();
  if (!name) return { error: "Fargen må ha et navn." };
  if (!isHex(hex)) return { error: "Velg en farge." };
  const db = await getDb();
  await db.insert(filaments).values({ name, hex });
  refresh();
  return { ok: true };
}

/** Legg til flere farger på en gang fra fargekartet. Farger med samme navn som en som finnes, hoppes over. */
export async function addFilamentsAction(colors: { name: string; hex: string }[]): Promise<FilamentState> {
  await requireAdmin();
  const clean = (Array.isArray(colors) ? colors : [])
    .map((c) => ({ name: String(c.name ?? "").trim().slice(0, 40), hex: String(c.hex ?? "").trim() }))
    .filter((c) => c.name && isHex(c.hex))
    .slice(0, 40);
  if (clean.length === 0) return { error: "Velg minst én farge." };
  const db = await getDb();
  const existing = new Set((await db.select({ name: filaments.name }).from(filaments)).map((f) => f.name.toLowerCase()));
  const fresh = clean.filter((c) => !existing.has(c.name.toLowerCase()));
  if (fresh.length > 0) await db.insert(filaments).values(fresh);
  refresh();
  return { ok: true };
}

/** Marker en farge som tom (eller på lager igjen). */
export async function setInStockAction(id: number, inStock: boolean): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.update(filaments).set({ inStock }).where(eq(filaments.id, id));
  refresh();
}

/** Slett en farge. Gamle bestillinger beholder fargen, fordi navnet er kopiert inn i bestillingen. */
export async function deleteFilamentAction(id: number): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(filaments).where(eq(filaments.id, id));
  refresh();
}
