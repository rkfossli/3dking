import { requireAdmin } from "@/lib/auth";
import { allWishes } from "@/lib/wishes";
import { AdminNav } from "@/components/AdminNav";
import { WishCard } from "@/components/WishCard";

export const dynamic = "force-dynamic";

// Liams liste over ønsker fra ønskeboksen. De han ikke har svart på står øverst.
export default async function AdminWishesPage() {
  await requireAdmin();
  const list = await allWishes();
  const open = list.filter((w) => w.status === "ny");
  const answered = list.filter((w) => w.status !== "ny");
  return (
    <main className="page">
      <AdminNav active="onsker" />
      {list.length === 0 && <div className="card"><p className="muted">Ingen ønsker ennå.</p></div>}
      {open.length > 0 && (
        <>
          <h2 className="section-title">Venter på svar</h2>
          <ul className="order-list">{open.map((w) => <WishCard key={w.id} wish={w} admin />)}</ul>
        </>
      )}
      {answered.length > 0 && (
        <>
          <h2 className="section-title">Besvart</h2>
          <ul className="order-list">{answered.map((w) => <WishCard key={w.id} wish={w} admin />)}</ul>
        </>
      )}
    </main>
  );
}
