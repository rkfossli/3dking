import { Logo } from "@/components/Logo";
import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyUsers } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!(await hasAnyUsers())) redirect("/oppsett"); // helt ny app: lag admin først
  if (await getCurrentUser()) redirect("/"); // allerede logget inn
  return (
    <main className="page narrow">
      <Logo big />
      <p className="muted">Logg inn med brukernavnet og PIN-en du har fått av Liam.</p>
      <LoginForm />
      <p className="muted small-text center">Glemt PIN? Spør Liam om en ny.</p>
    </main>
  );
}
