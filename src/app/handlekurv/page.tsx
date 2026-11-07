import { requireUser } from "@/lib/auth";
import { Cart } from "@/components/Cart";

export const dynamic = "force-dynamic";

// Handlekurven. Innholdet ligger i nettleseren, så selve listen tegnes av Cart-komponenten.
export default async function CartPage() {
  await requireUser();
  return (
    <main className="page narrow-wide">
      <h1>Handlekurv</h1>
      <Cart />
    </main>
  );
}
