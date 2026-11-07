import { requireAdmin } from "@/lib/auth";
import { allFilaments } from "@/lib/filaments";
import { AdminNav } from "@/components/AdminNav";
import { ProductsSubNav } from "@/components/ProductsSubNav";
import { FilamentForm, FilamentRow } from "@/components/FilamentAdmin";

export const dynamic = "force-dynamic";

// Filament: fargene Liam har. Kunden velger blant dem på produktsiden.
// Når en spole er brukt opp, trykker Liam «Tom», så kan ingen velge den før han har kjøpt ny.
export default async function FilamentPage() {
  await requireAdmin();
  const list = await allFilaments();
  return (
    <main className="page">
      <AdminNav active="produkter" />
      <ProductsSubNav active="filament" />
      <section className="card">
        <h2>Ny farge</h2>
        <FilamentForm />
      </section>
      <section className="card">
        <h2>Farger ({list.length})</h2>
        {list.length === 0 && <p className="muted">Ingen farger ennå. Uten farger ser kundene ikke noe fargevalg.</p>}
        <ul className="user-list">
          {list.map((f) => (
            <FilamentRow key={f.id} id={f.id} name={f.name} hex={f.hex} inStock={f.inStock} />
          ))}
        </ul>
      </section>
    </main>
  );
}
