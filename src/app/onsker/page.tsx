import { requireUser } from "@/lib/auth";
import { wishesForUser } from "@/lib/wishes";
import { WishForm } from "@/components/WishForm";
import { WishCard } from "@/components/WishCard";

export const dynamic = "force-dynamic";

// Ønskeboksen: be 3DKing om noe som ikke finnes i butikken.
export default async function WishesPage() {
  const user = await requireUser();
  const list = await wishesForUser(user.id);
  return (
    <main className="page narrow-wide">
      <h1>Ønskeboks</h1>
      <p className="muted">Finner du ikke det du vil ha? Skriv hva du ønsker deg, så svarer 3DKing om det kan lages og hva det koster.</p>
      <section className="card">
        <h2>Nytt ønske</h2>
        <WishForm />
      </section>
      {list.length > 0 && (
        <>
          <h2 className="section-title">Dine ønsker</h2>
          <ul className="order-list">
            {list.map((w) => (
              <WishCard key={w.id} wish={w} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
