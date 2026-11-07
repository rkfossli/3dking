import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyUsers } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!(await hasAnyUsers())) redirect("/oppsett"); // helt ny app: lag admin først
  if (await getCurrentUser()) redirect("/"); // allerede logget inn
  return (
    <main className="page narrow">
      <h1>3DKing</h1>
      <p className="muted">Logg inn med brukernavnet og PIN-en du har fått av Liam.</p>
      <LoginForm />
    </main>
  );
}
