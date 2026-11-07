import { requireAdmin } from "@/lib/auth";
import { monthlySummary } from "@/lib/orders";
import { kr } from "@/lib/format";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

/** "2026-11" → "November 2026" */
function monthName(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const name = new Intl.DateTimeFormat("nb-NO", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 15)),
  );
  return name[0].toUpperCase() + name.slice(1);
}

// Liams månedsoversikt: hvor mye som er bestilt, hva brukerne betaler, og hva filamentet kostet.
// Avbrutte bestillinger telles ikke med.
export default async function OverviewPage() {
  await requireAdmin();
  const months = await monthlySummary();

  return (
    <main className="page">
      <AdminNav active="oversikt" />
      {months.length === 0 && (
        <div className="card">
          <p className="muted">Ingen bestillinger ennå. Oversikten fylles ut når noen bestiller.</p>
        </div>
      )}
      <ul className="order-list">
        {months.map((m) => {
          const left = m.income - m.filament;
          return (
            <li key={m.month} className="card month">
              <h2>{monthName(m.month)}</h2>
              <div className="stats">
                <div>
                  <span className="muted small-text">Bestillinger</span>
                  <b>{m.orders}</b>
                </div>
                <div>
                  <span className="muted small-text">Ting printet</span>
                  <b>{m.items}</b>
                </div>
                <div>
                  <span className="muted small-text">Brukerne betaler</span>
                  <b>{kr(m.income)}</b>
                </div>
                <div>
                  <span className="muted small-text">Filament</span>
                  <b>{kr(m.filament)}</b>
                </div>
              </div>
              <p className="small-text">
                Igjen til strøm og slitasje: <b>{kr(left)}</b>
              </p>
              <p className="muted small-text">
                Mest bestilt: {m.products.slice(0, 3).map((p) => `${p.name} (${p.items})`).join(", ")}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
