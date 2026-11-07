import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { allFilaments } from "@/lib/filaments";
import { AdminNav } from "@/components/AdminNav";
import { ColorsSubNav } from "@/components/ColorsSubNav";
import { MyColors } from "@/components/FilamentAdmin";

export const dynamic = "force-dynamic";

// Mine farger: filamentet Liam har. Kunden velger blant disse på produktsiden.
// Når en spole er brukt opp, trykker Liam på fargen, så kan ingen velge den før han har kjøpt ny.
export default async function MyColorsPage() {
  await requireAdmin();
  const list = await allFilaments();
  return (
    <main className="page">
      <AdminNav active="farger" />
      <ColorsSubNav active="mine" count={list.length} />
      <section className="card">
        <h2>Mine farger</h2>
        {list.length === 0 ? (
          <>
            <p className="muted">Ingen farger ennå. Uten farger ser kundene ikke noe fargevalg.</p>
            <Link href="/admin/farger/legg-til" className="button">Legg til farger</Link>
          </>
        ) : (
          <MyColors list={list.map((f) => ({ id: f.id, name: f.name, hex: f.hex, inStock: f.inStock }))} />
        )}
      </section>
    </main>
  );
}
