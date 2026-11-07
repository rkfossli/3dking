import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth";
import { CreateUserForm } from "@/components/CreateUserForm";
import { UserRow } from "@/components/UserRow";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await requireAdmin(); // alle andre sendes videre
  const db = await getDb();
  const all = await db.select().from(users).orderBy(asc(users.displayName));

  return (
    <main className="page">
      <p>
        <Link href="/">← Tilbake</Link>
      </p>
      <h1>Admin</h1>

      <section className="card">
        <h2>Ny bruker</h2>
        <CreateUserForm />
      </section>

      <section className="card">
        <h2>Brukere ({all.length})</h2>
        <ul className="user-list">
          {all.map((u) => (
            <UserRow key={u.id} id={u.id} displayName={u.displayName} username={u.username} role={u.role} active={u.active} isMe={u.id === me.id} />
          ))}
        </ul>
      </section>
    </main>
  );
}
