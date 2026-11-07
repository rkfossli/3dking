import Link from "next/link";

// Små faner under Produkter i admin: selve produktene og kategoriene.
export function ProductsSubNav({ active }: { active: "produkter" | "kategorier" }) {
  return (
    <nav className="tabs small-tabs">
      <Link href="/admin/produkter" className={active === "produkter" ? "on" : ""}>Produkter</Link>
      <Link href="/admin/kategorier" className={active === "kategorier" ? "on" : ""}>Kategorier</Link>
    </nav>
  );
}
