import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyUsers } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!(await hasAnyUsers())) redirect("/oppsett"); // helt ny app: lag admin først
  if (await getCurrentUser()) redirect("/"); // allerede logget inn
  return (
    <main className="page narrow">
      {/* eslint-disable-next-line @next/next/no-img-element -- liten fast PNG */}
      <img src="/logo.png" alt="3D King" className="logo big" width={600} height={314} />
      <p className="muted">Logg inn med brukernavnet og PIN-en du har fått av Liam.</p>
      <LoginForm />
    </main>
  );
}
