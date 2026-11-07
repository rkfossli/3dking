import Link from "next/link";

// Små faner under Produkter i admin: selve produktene, kategoriene og filamentfargene.
export function ProductsSubNav({ active }: { active: "produkter" | "kategorier" | "filament" }) {
  return (
    <nav className="tabs small-tabs">
      <Link href="/admin/produkter" className={active === "produkter" ? "on" : ""}>Produkter</Link>
      <Link href="/admin/kategorier" className={active === "kategorier" ? "on" : ""}>Kategorier</Link>
      <Link href="/admin/filament" className={active === "filament" ? "on" : ""}>Filament</Link>
    </nav>
  );
}
