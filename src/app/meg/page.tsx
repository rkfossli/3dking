import { requireUser } from "@/lib/auth";
import { ChangePinForm } from "@/components/ChangePinForm";
import { PushSettings } from "@/components/PushSettings";
import { InstallGuide } from "@/components/InstallGuide";
import { ThemePicker } from "@/components/ThemePicker";
import { IntroTourButton } from "@/components/IntroTour";
import { logoutAction } from "../auth-actions";

export const dynamic = "force-dynamic";

// «Meg»: innstillinger for den som er logget inn: utseende, varsler, appen på hjemskjermen og PIN.
export default async function MePage() {
  const user = await requireUser();
  return (
    <main className="page narrow">
      <h1>{user.displayName}</h1>
      <p className="muted">Logget inn som {user.username}</p>
      <section className="card">
        <h2>Slik bestiller du</h2>
        <p className="muted small-text">En kort tur gjennom det viktigste: finne en modell, bestille, følge bestillingen og betale.</p>
        <IntroTourButton />
      </section>
      <section className="card">
        <h2>Utseende</h2>
        <ThemePicker current={user.theme} mode={user.mode} />
      </section>
      <section className="card">
        <h2>Varsler</h2>
        <PushSettings isAdmin={user.role === "admin"} />
      </section>
      <section className="card">
        <h2>Appen på hjemskjermen</h2>
        <InstallGuide />
      </section>
      <section className="card" id="pin">
        <h2>Bytt PIN</h2>
        <ChangePinForm />
      </section>
      <section className="card">
        <h2>Hva appen lagrer om deg</h2>
        <ul className="plain-list small-text">
          <li>Navnet og brukernavnet ditt, som 3DKing la inn.</li>
          <li>PIN-en din, men bare som en kode som ikke kan leses tilbake. Ingen, heller ikke 3DKing, kan se den.</li>
          <li>Bestillingene dine, med ønskene du skrev og svarene fra 3DKing.</li>
          <li>Hvilket tema du har valgt, og om du vil ha varsler på denne enheten.</li>
        </ul>
        <p className="muted small-text">
          Appen bruker ingen reklame og deler ingenting med andre. Vil du at alt om deg skal slettes, så si fra til 3DKing.
        </p>
      </section>
      {/* Logg ut lå før nederst på forsiden. Nå som menyen er i fanelinja, hører den hjemme her under Meg. */}
      <form noValidate action={logoutAction} className="logout">
        <button type="submit" className="secondary">Logg ut</button>
      </form>
    </main>
  );
}
