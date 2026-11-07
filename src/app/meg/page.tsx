import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ChangePinForm } from "@/components/ChangePinForm";

export const dynamic = "force-dynamic";

// «Meg»: innstillinger for den som er logget inn. Foreløpig bare bytte PIN.
export default async function MePage() {
  const user = await requireUser();
  return (
    <main className="page narrow">
      <p>
        <Link href="/">← Til butikken</Link>
      </p>
      <h1>{user.displayName}</h1>
      <p className="muted">Brukernavn: {user.username}</p>
      <section className="card">
        <h2>Bytt PIN</h2>
        <ChangePinForm />
      </section>
    </main>
  );
}
