import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "./auth-actions";

export const dynamic = "force-dynamic";

// Forsiden. Krever innlogging. I Fase 3 blir dette produktkatalogen.
export default async function Home() {
  const user = await requireUser();
  return (
    <main className="page">
      <div className="top">
        <h1>3DKing</h1>
        <form action={logoutAction}>
          <button type="submit" className="small secondary">Logg ut</button>
        </form>
      </div>
      <p>Hei, {user.displayName}! Her kommer snart Liams 3D-printede produkter.</p>
      {user.role === "admin" && (
        <p>
          <Link href="/admin" className="button">Gå til admin</Link>
        </p>
      )}
    </main>
  );
}
