import { Icon } from "@/components/Icon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProduct } from "@/lib/products";
import { kr } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { OrderForm } from "@/components/OrderForm";

export const dynamic = "force-dynamic";

// Produktsiden: stort bilde, hele beskrivelsen og Bestill-knappen.
// Adressen er /produkt/3, der 3 er id-en til produktet.
export default async function ProductPage({ params }: PageProps<"/produkt/[id]">) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const { id } = await params;
  const p = await getProduct(Number(id));
  // Skjulte produkter finnes ikke for kundene. Liam kan se dem, så han kan sjekke hvordan de ser ut.
  if (!p || (!p.available && !isAdmin)) notFound();

  return (
    <main className="page narrow-wide">
      <p>
        <Link href="/" className="back"><Icon name="arrow-left" size={16} /> Til butikken</Link>
      </p>
      <article className="card product product-page">
        <ProductImage url={p.imageUrl} alt={p.name} />
        <h1>{p.name}</h1>
        {!p.available && <p className="muted small-text">Skjult: kundene ser ikke dette produktet.</p>}
        {p.description && <p className="description">{p.description}</p>}
        <p className="price">{kr(p.priceNok)}</p>
        {isAdmin && p.costNok != null && <p className="muted small-text">Filament {kr(p.costNok)} · bare synlig for deg</p>}
        {p.available && <OrderForm productId={p.id} price={p.priceNok} />}
      </article>
    </main>
  );
}
