import { requireAdmin } from "@/lib/auth";
import { allFilaments } from "@/lib/filaments";
import { AdminNav } from "@/components/AdminNav";
import { ColorsSubNav } from "@/components/ColorsSubNav";
import { FilamentForm } from "@/components/FilamentAdmin";

export const dynamic = "force-dynamic";

// Legg til farger: hele fargekartet til Bambu Lab, pluss egne farger.
export default async function AddColorsPage() {
  await requireAdmin();
  const list = await allFilaments();
  return (
    <main className="page">
      <AdminNav active="farger" />
      <ColorsSubNav active="legg-til" count={list.length} />
      <section className="card">
        <h2>Legg til farger</h2>
        <FilamentForm existing={list.map((f) => f.name)} />
      </section>
    </main>
  );
}
