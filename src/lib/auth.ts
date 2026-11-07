// Alt som har med innlogging å gjøre. Bygget på samme idé som auth.ts i Spotter.
//
// Slik virker det:
// 1. Brukeren skriver brukernavn og PIN.
// 2. Vi sjekker PIN mot hashen i databasen (bcrypt). Selve PIN-en lagres aldri.
// 3. Er den riktig, lager vi et tilfeldig "token", lagrer det i tabellen sessions,
//    og gir nettleseren det i en cookie. Neste gang vet vi hvem det er ved å slå opp tokenet.
import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { and, count, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { sessions, users } from "./schema";

const SESSION_COOKIE = "3dking_session";
const SESSION_DAYS = 90;

/** Så mange feil PIN på rad før brukeren sperres en stund. */
export const MAX_FAILS = 5;
export const LOCK_MINUTES = 5;

export type User = typeof users.$inferSelect;

// ---------- Små hjelpere ----------

/** PIN er nøyaktig 4 sifre. */
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/** Brukernavn: små bokstaver, tall, punktum, bindestrek og understrek, 2–20 tegn. */
export function normalizeUsername(name: string): string {
  return name.trim().toLowerCase();
}
export function isValidUsername(name: string): boolean {
  return /^[a-z0-9æøå._-]{2,20}$/.test(name);
}

export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

/** Tilfeldig 4-sifret PIN, for eksempel "0472". */
export function randomPin(): string {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

/** Finnes det noen brukere ennå? Brukes for å vise oppsettsiden første gang. */
export async function hasAnyUsers(): Promise<boolean> {
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(users);
  return row.n > 0;
}

// ---------- Økter (cookie) ----------

export async function startSession(userId: number): Promise<void> {
  const db = await getDb();
  const token = randomBytes(32).toString("hex"); // 64 tilfeldige tegn, umulig å gjette
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true, // JavaScript i nettleseren får ikke lese cookien
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  jar.delete(SESSION_COOKIE);
}

/** Hvem er logget inn? null hvis ingen (eller brukeren er deaktivert). */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, sql`now()`), eq(users.active, true)))
    .limit(1);
  return rows[0]?.user ?? null;
}

/** Bruk øverst på sider og handlinger som krever innlogging. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/logg-inn");
  return user;
}

/** Bruk øverst på ALT som bare Liam skal få gjøre. Å skjule en knapp er ikke nok, serveren må sjekke. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

// ---------- Sjekke PIN ----------

export type LoginResult = { ok: true; userId: number } | { ok: false; error: string };

const WRONG = "Feil brukernavn eller PIN.";

/**
 * Sjekker brukernavn og PIN, med sperre etter MAX_FAILS feil på rad.
 *
 * Forsøket telles FØR PIN-en sjekkes, i én UPDATE. Da kan ingen sende 100 forsøk samtidig
 * og få alle sjekket før telleren rekker å øke.
 */
export async function checkLogin(usernameInput: string, pin: string): Promise<LoginResult> {
  const db = await getDb();
  const username = normalizeUsername(usernameInput);

  // Tell forsøket, men bare hvis brukeren finnes, er aktiv og ikke er sperret.
  const [counted] = await db
    .update(users)
    .set({ failedPins: sql`${users.failedPins} + 1` })
    .where(
      and(
        eq(users.username, username),
        eq(users.active, true),
        or(isNull(users.lockedUntil), lt(users.lockedUntil, sql`now()`)),
      ),
    )
    .returning({ id: users.id, pinHash: users.pinHash, attempt: users.failedPins });

  if (!counted) {
    // Enten finnes ikke brukeren, eller så er den sperret. Sjekk hvilken, så meldingen blir riktig.
    const [u] = await db.select({ lockedUntil: users.lockedUntil }).from(users).where(eq(users.username, username));
    if (u?.lockedUntil && u.lockedUntil > new Date()) {
      const min = Math.ceil((u.lockedUntil.getTime() - Date.now()) / 60_000);
      return { ok: false, error: `For mange feil. Prøv igjen om ${min} min.` };
    }
    return { ok: false, error: WRONG };
  }

  if (counted.attempt <= MAX_FAILS && (await bcrypt.compare(pin, counted.pinHash))) {
    await db.update(users).set({ failedPins: 0, lockedUntil: null }).where(eq(users.id, counted.id));
    return { ok: true, userId: counted.id };
  }

  if (counted.attempt >= MAX_FAILS) {
    // Femte feil: sperr brukeren og nullstill telleren.
    await db
      .update(users)
      .set({ failedPins: 0, lockedUntil: sql`now() + interval '${sql.raw(String(LOCK_MINUTES))} minutes'` })
      .where(eq(users.id, counted.id));
    return { ok: false, error: `For mange feil. Prøv igjen om ${LOCK_MINUTES} min.` };
  }
  const left = MAX_FAILS - counted.attempt;
  return { ok: false, error: `${WRONG} ${left} forsøk igjen.` };
}

/** Sjekker om PIN-en stemmer for en bruker (brukes når man bytter PIN). */
export function pinMatches(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}
