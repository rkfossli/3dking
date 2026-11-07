import { Icon } from "@/components/Icon";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { availableProducts } from "@/lib/products";
import { kr } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { InstallGuide } from "@/components/InstallGuide";
import { PinHint } from "@/components/PinHint";
import { Logo } from "@/components/Logo";
import { countReadyForUser } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Forsiden: katalogen med alt som er til salgs. Krever innlogging.
// Produktene skal komme tidlig på skjermen, så logo og knapper står på én rad og «Logg ut» ligger nederst.
export default async function Home() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const list = await availableProducts();
  const ready = await countReadyForUser(user.id);

  return (
    <main className="page">
      {/* Mine bestillinger, Admin og Meg ligger i fanelinja nederst (TabBar), så toppen er bare logoen. */}
      <div className="top">
        <Logo theme={user.theme} />
      </div>
      <p className="muted greeting">
        Hei, {user.displayName}! {isAdmin ? "Slik ser butikken ut for kundene." : "Velg noe du vil at 3DKing skal printe."}
      </p>
      {ready > 0 && (
        <Link href="/mine" className="ready-notice">
          <Icon name="ready" size={22} />
          <span>
            {ready === 1 ? "En bestilling" : `${ready} bestillinger`} er ferdig laget! Se når {ready === 1 ? "den" : "de"} leveres
          </span>
          <Icon name="arrow-right" />
        </Link>
      )}

      {!user.ownPin && <PinHint />}
      <InstallGuide compact place="top" />

      {list.length === 0 && <div className="card"><p className="muted">Ingen produkter ennå. Kom tilbake snart!</p></div>}

      <div className="grid">
        {list.map((p) => (
          <article key={p.id} className="card product">
            {/* Bildet og navnet går til produktsiden med stort bilde og hele beskrivelsen. */}
            <Link href={`/produkt/${p.id}`} className="product-link">
              <ProductImage url={p.imageUrl} alt={p.name} />
              <h2>{p.name}</h2>
            </Link>
            {p.description && <p className="muted small-text clamp">{p.description}</p>}
            <p className="price">
              {kr(p.priceNok)} <span className="price-note">(filament og strøm)</span>
            </p>
            {isAdmin && p.costNok != null && <p className="muted small-text">Filament {kr(p.costNok)} · bare synlig for deg</p>}
            {/* «Bestill» åpner produktsiden, der skjemaet har god plass til ønsker. */}
            <Link href={`/produkt/${p.id}`} className="button small order-btn">Bestill</Link>
          </article>
        ))}
      </div>

      {/* Ønskeboksen: for det som ikke finnes i butikken */}
      <Link href="/onsker" className="card wish-cta">
        <Icon name="star" size={26} />
        <span>
          <b>Finner du ikke det du vil ha?</b>
          <span className="muted small-text">Ønsk deg noe, så svarer 3DKing om det kan lages.</span>
        </span>
        <Icon name="arrow-right" />
      </Link>

      <InstallGuide compact place="bottom" />

    </main>
  );
}
