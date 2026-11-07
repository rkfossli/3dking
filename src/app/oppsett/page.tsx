import { redirect } from "next/navigation";
import { hasAnyUsers } from "@/lib/auth";
import { SetupForm } from "@/components/SetupForm";

export const dynamic = "force-dynamic";

// Vises bare første gang, før det finnes noen brukere. Den som fyller ut blir admin.
export default async function SetupPage() {
  if (await hasAnyUsers()) redirect("/logg-inn");
  return (
    <main className="page narrow">
      <h1>Velkommen til 3DKing</h1>
      <p className="muted">Ingen brukere ennå. Lag admin-kontoen din. Etterpå kan du lage brukere til andre.</p>
      <SetupForm />
    </main>
  );
}
