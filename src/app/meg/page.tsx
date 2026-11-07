import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ChangePinForm } from "@/components/ChangePinForm";
import { PushSettings } from "@/components/PushSettings";
import { InstallGuide } from "@/components/InstallGuide";

export const dynamic = "force-dynamic";

// «Meg»: innstillinger for den som er logget inn: varsler, appen på hjemskjermen og PIN.
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
        <h2>Varsler</h2>
        <PushSettings isAdmin={user.role === "admin"} />
      </section>
      <section className="card">
        <h2>Appen på hjemskjermen</h2>
        <InstallGuide />
      </section>
      <section className="card">
        <h2>Bytt PIN</h2>
        <ChangePinForm />
      </section>
    </main>
  );
}
