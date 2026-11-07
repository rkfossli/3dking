"use server";
// Server actions: funksjoner som kjører på serveren når et skjema sendes inn.
// "use server" øverst gjør at skjemaene i nettleseren kan kalle dem direkte.
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import {
  checkLogin,
  endSession,
  hasAnyUsers,
  hashPin,
  isValidPin,
  isValidUsername,
  normalizeUsername,
  startSession,
} from "@/lib/auth";

export type FormState = { error?: string };

/** Logg inn med brukernavn og PIN. */
export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const username = String(form.get("username") ?? "");
  const pin = String(form.get("pin") ?? "");
  const result = await checkLogin(username, pin);
  if (!result.ok) return { error: result.error };
  await startSession(result.userId);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/logg-inn");
}

/** Første oppstart: lag admin-kontoen. Virker bare så lenge det ikke finnes noen brukere. */
export async function setupAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (await hasAnyUsers()) redirect("/logg-inn");

  const displayName = String(form.get("displayName") ?? "").trim();
  const username = normalizeUsername(String(form.get("username") ?? ""));
  const pin = String(form.get("pin") ?? "");
  const pin2 = String(form.get("pin2") ?? "");

  if (!displayName) return { error: "Skriv navnet ditt." };
  if (!isValidUsername(username)) return { error: "Brukernavn: 2–20 tegn, bare bokstaver, tall, . - _" };
  if (!isValidPin(pin)) return { error: "PIN må være 4 sifre." };
  if (pin !== pin2) return { error: "PIN-kodene er ikke like." };

  const db = await getDb();
  const [admin] = await db
    .insert(users)
    .values({ username, displayName, pinHash: await hashPin(pin), role: "admin" })
    .returning({ id: users.id });
  await startSession(admin.id);
  redirect("/admin");
}
