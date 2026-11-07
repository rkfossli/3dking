import Link from "next/link";
import { countNew } from "@/lib/orders";
import { countNewWishes } from "@/lib/wishes";
import { Icon, type IconName } from "./Icon";

type Tab = "bestillinger" | "onsker" | "brukere" | "produkter" | "farger" | "oversikt" | "verksted";

// Fanene øverst på admin-sidene. `active` sier hvilken fane som er valgt.
// Sju faner får ikke plass på én linje på telefon, så de ligger i et rutenett med fire i hver rad.
// Da ser Liam alle med en gang, uten å scrolle sidelengs. Ordre og Ønsker viser et tall når noe venter.
export async function AdminNav({ active }: { active: Tab }) {
  const waiting = await countNew();
  const newWishes = await countNewWishes();
  const tabs: { key: Tab; href: string; label: string; icon: IconName; count?: number }[] = [
    { key: "bestillinger", href: "/admin/bestillinger", label: "Ordre", icon: "list", count: waiting },
    { key: "onsker", href: "/admin/onsker", label: "Ønsker", icon: "star", count: newWishes },
    { key: "produkter", href: "/admin/produkter", label: "Produkter", icon: "cube" },
    { key: "farger", href: "/admin/farger", label: "Farger", icon: "drop" },
    { key: "brukere", href: "/admin", label: "Brukere", icon: "user" },
    { key: "oversikt", href: "/admin/oversikt", label: "Oversikt", icon: "chart" },
    { key: "verksted", href: "/admin/verksted", label: "Verksted", icon: "wrench" },
  ];
  return (
    <>
      <h1>Admin</h1>
      <nav className="admin-grid" aria-label="Admin">
        {tabs.map((t) => (
          <Link key={t.key} href={t.href} className={active === t.key ? "on" : ""} aria-current={active === t.key ? "page" : undefined}>
            <Icon name={t.icon} size={20} />
            <span>{t.label}</span>
            {t.count != null && t.count > 0 && <span className="count">{t.count}</span>}
          </Link>
        ))}
      </nav>
    </>
  );
}
