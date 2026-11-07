import Link from "next/link";
import { countNew } from "@/lib/orders";

// Fanene øverst på admin-sidene. `active` sier hvilken fane som er valgt.
// Bestillinger-fanen viser et tall når noe venter på å bli laget.
// På smale skjermer ruller fanene sidelengs i stedet for å bryte over to linjer.
export async function AdminNav({ active }: { active: "bestillinger" | "brukere" | "produkter" | "oversikt" }) {
  const waiting = await countNew();
  return (
    <>
      <h1>Admin</h1>
      <nav className="tabs">
        <Link href="/admin/bestillinger" className={active === "bestillinger" ? "on" : ""}>
          Ordre{waiting > 0 && <span className="count">{waiting}</span>}
        </Link>
        <Link href="/admin/produkter" className={active === "produkter" ? "on" : ""}>Produkter</Link>
        <Link href="/admin" className={active === "brukere" ? "on" : ""}>Brukere</Link>
        <Link href="/admin/oversikt" className={active === "oversikt" ? "on" : ""}>Oversikt</Link>
      </nav>
    </>
  );
}
