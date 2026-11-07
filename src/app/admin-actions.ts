"use server";
// Handlinger på admin-siden. ALLE starter med requireAdmin(), så bare admin kan bruke dem,
// selv om noen skulle prøve å kalle dem uten å gå via knappene.
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/schema";
import { hashPin, isValidUsername, normalizeUsername, randomPin, requireAdmin } from "@/lib/auth";

/** Svaret vises på admin-siden. PIN vises bare denne ene gangen. */
export type PinState = { error?: string; created?: { name: string; username: string; pin: string } };

export async function createUserAction(_prev: PinState, form: FormData): Promise<PinState> {
  await requireAdmin();
  const displayName = String(form.get("displayName") ?? "").trim();
  const username = normalizeUsername(String(form.get("username") ?? ""));
  if (!displayName) return { error: "Skriv navnet til personen." };
  if (!isValidUsername(username)) return { error: "Brukernavn: 2–20 tegn, bare bokstaver, tall, . - _" };

  const db = await getDb();
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (taken) return { error: `Brukernavnet «${username}» er tatt.` };

  const pin = randomPin();
  await db.insert(users).values({ username, displayName, pinHash: await hashPin(pin) });
  revalidatePath("/admin");
  return { created: { name: displayName, username, pin } };
}

/** Ny PIN til en bruker som har glemt sin. Brukeren logges ut overalt. */
export async function resetPinAction(userId: number): Promise<{ pin: string }> {
  await requireAdmin();
  const db = await getDb();
  const pin = randomPin();
  await db.update(users).set({ pinHash: await hashPin(pin), failedPins: 0, lockedUntil: null }).where(eq(users.id, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  revalidatePath("/admin");
  return { pin };
}

/** Slå en bruker av eller på. Avslåtte brukere kan ikke logge inn. */
export async function setActiveAction(userId: number, active: boolean): Promise<void> {
  const admin = await requireAdmin();
  if (userId === admin.id) return; // du kan ikke slå av deg selv
  const db = await getDb();
  await db.update(users).set({ active }).where(eq(users.id, userId));
  if (!active) await db.delete(sessions).where(eq(sessions.userId, userId));
  revalidatePath("/admin");
}

/** Endre navn og brukernavn. Brukeren beholder PIN-en og forblir innlogget. */
export async function renameUserAction(userId: number, displayNameInput: string, usernameInput: string): Promise<{ error?: string }> {
  await requireAdmin();
  const displayName = displayNameInput.trim();
  const username = normalizeUsername(usernameInput);
  if (!displayName) return { error: "Navnet kan ikke være tomt." };
  if (!isValidUsername(username)) return { error: "Brukernavn: 2–20 tegn, bare bokstaver, tall, . - _" };

  const db = await getDb();
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (taken && taken.id !== userId) return { error: `Brukernavnet «${username}» er tatt.` };

  await db.update(users).set({ displayName, username }).where(eq(users.id, userId));
  revalidatePath("/admin");
  return {};
}
