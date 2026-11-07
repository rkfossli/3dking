import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { availableProducts } from "@/lib/products";
import { kr } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { OrderButton } from "@/components/OrderButton";
import { InstallGuide } from "@/components/InstallGuide";
import { Logo } from "@/components/Logo";
import { countNew, countReadyForUser, countUpdatesForUser } from "@/lib/orders";
import { logoutAction } from "./auth-actions";

export const dynamic = "force-dynamic";

// Forsiden: katalogen med alt som er til salgs. Krever innlogging.
export default async function Home() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const list = await availableProducts();
  const waiting = isAdmin ? await countNew() : 0;
  const ready = await countReadyForUser(user.id);
  const updates = await countUpdatesForUser(user.id, user.ordersSeenAt);

  return (
    <main className="page">
      <div className="top">
        <Logo theme={user.theme} />
        <div className="row-buttons">
          <Link href="/mine" className="button small secondary">
            Mine bestillinger{updates > 0 && <span className="count" title="Nytt siden sist">{updates}</span>}
          </Link>
          {isAdmin && (
            <Link href="/admin/bestillinger" className="button small">
              Admin{waiting > 0 && <span className="count">{waiting}</span>}
            </Link>
          )}
          <form action={logoutAction}>
            <button type="submit" className="small secondary">Logg ut</button>
          </form>
        </div>
      </div>
      <p className="muted">Hei, {user.displayName}! Dette er det Liam kan printe for deg.</p>
      {ready > 0 && (
        <Link href="/mine" className="ready-notice">
          🎉 {ready === 1 ? "En bestilling" : `${ready} bestillinger`} er ferdig laget! Se når {ready === 1 ? "den" : "de"} leveres →
        </Link>
      )}

      <InstallGuide compact />

      {list.length === 0 && <div className="card"><p className="muted">Ingen produkter ennå. Kom tilbake snart!</p></div>}

      <div className="grid">
        {list.map((p) => (
          <article key={p.id} className="card product">
            <ProductImage url={p.imageUrl} alt={p.name} />
            <h2>{p.name}</h2>
            {p.description && <p className="muted small-text">{p.description}</p>}
            <p className="price">{kr(p.priceNok)}</p>
            {isAdmin && p.costNok != null && <p className="muted small-text">Filament: {kr(p.costNok)} (bare du ser dette)</p>}
            <OrderButton productId={p.id} price={p.priceNok} />
          </article>
        ))}
      </div>
      <p className="muted small-text footer-line">
        Logget inn som {user.username} · <Link href="/meg">Innstillinger</Link>
      </p>
    </main>
  );
}
