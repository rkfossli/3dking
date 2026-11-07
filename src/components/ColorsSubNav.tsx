import Link from "next/link";

// Små faner under Farger i admin: fargene Liam har, og fargekartet der han legger til nye.
export function ColorsSubNav({ active, count }: { active: "mine" | "legg-til"; count: number }) {
  return (
    <nav className="tabs small-tabs">
      <Link href="/admin/farger" className={active === "mine" ? "on" : ""}>Mine farger ({count})</Link>
      <Link href="/admin/farger/legg-til" className={active === "legg-til" ? "on" : ""}>Legg til</Link>
    </nav>
  );
}
