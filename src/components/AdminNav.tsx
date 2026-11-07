import Link from "next/link";

// Fanene øverst på admin-sidene. `active` sier hvilken fane som er valgt.
export function AdminNav({ active }: { active: "brukere" | "produkter" }) {
  return (
    <>
      <p>
        <Link href="/">← Til butikken</Link>
      </p>
      <h1>Admin</h1>
      <nav className="tabs">
        <Link href="/admin/produkter" className={active === "produkter" ? "on" : ""}>Produkter</Link>
        <Link href="/admin" className={active === "brukere" ? "on" : ""}>Brukere</Link>
      </nav>
    </>
  );
}
