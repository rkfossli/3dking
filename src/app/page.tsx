import { Icon } from "@/components/Icon";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { availableProducts, isNewProduct, popularProductIds } from "@/lib/products";
import { allCategories, categoryMap } from "@/lib/categories";
import { kr } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { InstallGuide } from "@/components/InstallGuide";
import { PinHint } from "@/components/PinHint";
import { Logo } from "@/components/Logo";
import { countReadyForUser } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Forsiden: katalogen med alt som er til salgs. Krever innlogging.
// ?kategori=3 viser bare én kategori, og ?q=drage søker i navn og beskrivelse.
export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const all = await availableProducts();
  const { kategori, q } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 60) : "";

  // Kategoriene som har minst ett produkt blir faner. Tomme kategorier vises ikke.
  const cats = await allCategories();
  const catsOf = await categoryMap(all.map((p) => p.id));
  const usedCats = cats.filter((c) => all.some((p) => catsOf.get(p.id)?.includes(c.id)));
  const activeCat = usedCats.find((c) => String(c.id) === kategori) ?? null;

  const needle = search.toLowerCase();
  const list = all.filter(
    (p) =>
      (!activeCat || catsOf.get(p.id)?.includes(activeCat.id)) &&
      (!needle || p.name.toLowerCase().includes(needle) || (p.description ?? "").toLowerCase().includes(needle)),
  );
  const popular = await popularProductIds();
  // Lenke til en kategori, og søket beholdes.
  const href = (catId: number | null) => {
    const params = new URLSearchParams();
    if (catId) params.set("kategori", String(catId));
    if (search) params.set("q", search);
    const s = params.toString();
    return s ? `/?${s}` : "/";
  };
  const ready = await countReadyForUser(user.id);

  return (
    <main className="page">
      {/* Mine bestillinger, Admin og Meg ligger i fanelinja nederst (TabBar), så toppen er bare logoen. */}
      <div className="top">
        <Logo theme={user.theme} />
      </div>
      <p className="muted greeting">
        Hei, {user.displayName}! {isAdmin ? "Slik ser Modeller ut for kundene." : "Velg noe du vil at 3DKing skal printe."}
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

      {/* Søk: et vanlig skjema som legger ?q= i adressen. Kategorien beholdes i et skjult felt. */}
      {all.length > 0 && (
        <form noValidate className="search" role="search" action="/">
          {activeCat && <input type="hidden" name="kategori" value={activeCat.id} />}
          <Icon name="search" />
          <input name="q" type="search" defaultValue={search} placeholder="Søk etter modeller" aria-label="Søk etter modeller" enterKeyHint="search" />
        </form>
      )}

      {usedCats.length > 0 && (
        <nav className="tabs small-tabs cat-tabs" aria-label="Kategorier">
          <Link href={href(null)} className={activeCat ? "" : "on"}>Alle</Link>
          {usedCats.map((c) => (
            <Link key={c.id} href={href(c.id)} className={activeCat?.id === c.id ? "on" : ""}>{c.name}</Link>
          ))}
        </nav>
      )}

      {all.length === 0 && <div className="card"><p className="muted">Ingen produkter ennå. Kom tilbake snart!</p></div>}
      {all.length > 0 && list.length === 0 && (
        <div className="card">
          <p className="muted">Fant ingenting{search ? ` som passer «${search}»` : ""}.</p>
          <Link href="/" className="button small secondary empty-cta">Vis alt</Link>
        </div>
      )}

      <div className="grid">
        {list.map((p) => (
          <article key={p.id} className="card product">
            {/* Bildet og navnet går til produktsiden med stort bilde og hele beskrivelsen. */}
            <Link href={`/produkt/${p.id}`} className="product-link">
              <span className="img-wrap">
                <ProductImage url={p.imageUrl} alt={p.name} />
                {/* Merker: Ny (lagt ut siste 14 dager) og Populær (mest bestilt). */}
                <span className="ribbons">
                  {isNewProduct(p.createdAt) && <span className="ribbon new">Ny</span>}
                  {popular.includes(p.id) && <span className="ribbon hot">Populær</span>}
                </span>
                {/* Har produktet to bilder, vises et lite merke. Bildene blas i på produktsiden. */}
                {p.imageUrl && p.imageUrl2 && (
                  <span className="img-count" aria-label="2 bilder"><Icon name="image" size={14} /> 2</span>
                )}
              </span>
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
