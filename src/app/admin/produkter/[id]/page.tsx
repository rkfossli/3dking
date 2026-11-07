import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getProduct } from "@/lib/products";
import { AdminNav } from "@/components/AdminNav";
import { ProductForm } from "@/components/ProductForm";

export const dynamic = "force-dynamic";

// [id] i mappenavnet betyr at denne siden svarer på /admin/produkter/1, /admin/produkter/2 osv.
export default async function EditProductPage({ params }: PageProps<"/admin/produkter/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product) notFound();
  return (
    <main className="page">
      <AdminNav active="produkter" />
      <section className="card">
        <h2>Endre produkt</h2>
        <ProductForm product={product} />
      </section>
    </main>
  );
}
