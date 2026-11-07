import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { availableProducts } from "@/lib/products";
import { kr } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { logoutAction } from "./auth-actions";

export const dynamic = "force-dynamic";

// Forsiden: katalogen med alt som er til salgs. Krever innlogging.
export default async function Home() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const list = await availableProducts();

  return (
    <main className="page">
      <div className="top">
        <h1>3DKing</h1>
        <div className="row-buttons">
          {isAdmin && <Link href="/admin/produkter" className="button small">Admin</Link>}
          <form action={logoutAction}>
            <button type="submit" className="small secondary">Logg ut</button>
          </form>
        </div>
      </div>
      <p className="muted">Hei, {user.displayName}! Dette er det Liam kan printe for deg.</p>

      {list.length === 0 && <div className="card"><p className="muted">Ingen produkter ennå. Kom tilbake snart!</p></div>}

      <div className="grid">
        {list.map((p) => (
          <article key={p.id} className="card product">
            <ProductImage url={p.imageUrl} alt={p.name} />
            <h2>{p.name}</h2>
            {p.description && <p className="muted small-text">{p.description}</p>}
            <p className="price">{kr(p.priceNok)}</p>
            {isAdmin && p.costNok != null && <p className="muted small-text">Filament: {kr(p.costNok)} (bare du ser dette)</p>}
          </article>
        ))}
      </div>
    </main>
  );
}
