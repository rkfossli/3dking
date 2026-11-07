// Når tellingen i Verkstedet og «Populær» startet. Bestillinger fra før (tester) telles ikke.
// Tidspunktet ligger i settings-tabellen, så 3DKing kan starte tellingen på nytt fra Verkstedet.
import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { settings } from "./schema";

export const STATS_KEY = "stats_since";

/** Tidspunktet tellingen startet, eller null hvis den teller alt. */
export async function statsSince(): Promise<Date | null> {
  const db = await getDb();
  const [row] = await db.select().from(settings).where(eq(settings.key, STATS_KEY));
  if (!row) return null;
  const d = new Date(row.value);
  return Number.isNaN(d.getTime()) ? null : d;
}
