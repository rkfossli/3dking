import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { ProductForm } from "@/components/ProductForm";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <main className="page">
      <AdminNav active="produkter" />
      <section className="card">
        <h2>Nytt produkt</h2>
        <ProductForm />
      </section>
    </main>
  );
}
