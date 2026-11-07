// Statusside: viser at appen får kontakt med databasen.
// Åpne /status for å sjekke. Bare admin har tilgang.
import { count } from "drizzle-orm";
import { dbKind, getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { orders, products, users } from "@/lib/schema";

// Hent ferske tall hver gang, ikke en lagret kopi fra byggetidspunktet.
export const dynamic = "force-dynamic";

export default async function StatusPage() {
  await requireAdmin(); // bare Liam trenger å se dette
  const db = await getDb();
  // count() teller rader. [{ n }] henter ut tallet fra første (og eneste) rad.
  const [[u], [p], [o]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(products),
    db.select({ n: count() }).from(orders),
  ]);

  return (
    <main className="page">
      <h1>Status</h1>
      <div className="card">
        <p>Databasen virker ✅</p>
        <p className="muted">Type: {dbKind() === "neon" ? "Neon (på nett)" : "PGlite (lokalt på PC-en)"}</p>
      </div>
      <div className="card">
        <p className="muted">Brukere: {u.n}</p>
        <p className="muted">Produkter: {p.n}</p>
        <p className="muted">Bestillinger: {o.n}</p>
      </div>
    </main>
  );
}
