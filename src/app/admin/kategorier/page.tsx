import { count } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { allCategories } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { productCategories } from "@/lib/schema";
import { AdminNav } from "@/components/AdminNav";
import { ProductsSubNav } from "@/components/ProductsSubNav";
import { CategoryForm, CategoryRow } from "@/components/CategoryAdmin";

export const dynamic = "force-dynamic";

// Kategoriene blir faner øverst i butikken. Hvilke produkter som er med, velges på hvert produkt.
export default async function CategoriesPage() {
  await requireAdmin();
  const list = await allCategories();
  const db = await getDb();
  const counts = await db.select({ id: productCategories.categoryId, n: count() }).from(productCategories).groupBy(productCategories.categoryId);
  const countOf = (id: number) => counts.find((c) => c.id === id)?.n ?? 0;
  return (
    <main className="page">
      <AdminNav active="produkter" />
      <ProductsSubNav active="kategorier" />
      <section className="card">
        <h2>Ny kategori</h2>
        <CategoryForm />
        <p className="muted small-text">Velg hvilke kategorier et produkt er med i når du lager eller endrer produktet.</p>
      </section>
      <section className="card">
        <h2>Kategorier ({list.length})</h2>
        {list.length === 0 && <p className="muted">Ingen kategorier ennå. Uten kategorier viser butikken alt i én liste.</p>}
        <ul className="user-list">
          {list.map((c, i) => (
            <CategoryRow key={c.id} id={c.id} name={c.name} count={countOf(c.id)} first={i === 0} last={i === list.length - 1} />
          ))}
        </ul>
      </section>
    </main>
  );
}
