import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { ProductForm } from "@/components/ProductForm";
import { getWish } from "@/lib/wishes";
import { allCategories } from "@/lib/categories";

// Nytt produkt. Med ?onske=5 i adressen fylles skjemaet ut fra ønske nr. 5 i ønskeboksen.
export default async function NewProductPage({ searchParams }: PageProps<"/admin/produkter/ny">) {
  await requireAdmin();
  const { onske } = await searchParams;
  const wish = typeof onske === "string" ? await getWish(Number(onske)) : null;
  const fromWish = wish
    ? {
        name: "",
        description: [wish.text, wish.link].filter(Boolean).join("\n"),
        priceNok: wish.priceNok ?? 0,
        costNok: null,
        available: true,
        imageUrl: wish.imageUrl,
      }
    : undefined;
  const cats = await allCategories();
  return (
    <main className="page">
      <AdminNav active="produkter" />
      <section className="card">
        <h2>{wish ? `Nytt produkt fra ønsket til ${wish.userName}` : "Nytt produkt"}</h2>
        <ProductForm product={fromWish} wishId={wish?.id} categories={cats.map((c) => ({ id: c.id, name: c.name }))} />
      </section>
    </main>
  );
}
