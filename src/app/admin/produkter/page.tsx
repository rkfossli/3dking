import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { allProducts } from "@/lib/products";
import { kr } from "@/lib/format";
import { AdminNav } from "@/components/AdminNav";
import { AvailableToggle } from "@/components/AvailableToggle";
import { ProductImage } from "@/components/ProductImage";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();
  const list = await allProducts();

  return (
    <main className="page">
      <AdminNav active="produkter" />
      <p>
        <Link href="/admin/produkter/ny" className="button">+ Nytt produkt</Link>
      </p>
      <section className="card">
        <h2>Produkter ({list.length})</h2>
        {list.length === 0 && <p className="muted">Ingen produkter ennå. Trykk «Nytt produkt».</p>}
        <ul className="user-list">
          {list.map((p) => (
            <li key={p.id} className={`user-row${p.available ? "" : " inactive"}`}>
              <div className="thumb-row">
                <div className="thumb"><ProductImage url={p.imageUrl} alt="" /></div>
                <div>
                <b>{p.name}</b>
                {!p.available && <span className="tag">skjult</span>}
                <p className="muted small-text">
                  Pris {kr(p.priceNok)}
                  {p.costNok != null && ` · filament ${kr(p.costNok)}`}
                </p>
                </div>
              </div>
              <div className="row-buttons">
                <Link href={`/admin/produkter/${p.id}`} className="button small secondary">Endre</Link>
                <AvailableToggle id={p.id} available={p.available} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
