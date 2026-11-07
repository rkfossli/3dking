"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

// Fanelinja nederst på skjermen, hentet fra Spotter. Den svever rett over infolinja.
// `waiting` = nye bestillinger Liam ikke har laget ennå. `updates` = nytt på mine bestillinger siden sist.
export function TabBar({ isAdmin, waiting, updates }: { isAdmin: boolean; waiting: number; updates: number }) {
  const path = usePathname();
  const tabs: { href: string; label: string; icon: IconName; count?: number; on: boolean }[] = [
    { href: "/", label: "Butikk", icon: "shop", on: path === "/" || path.startsWith("/produkt") },
    { href: "/mine", label: "Mine", icon: "list", count: path.startsWith("/mine") ? 0 : updates, on: path.startsWith("/mine") },
  ];
  if (isAdmin) tabs.push({ href: "/admin/bestillinger", label: "Admin", icon: "crown", count: waiting, on: path.startsWith("/admin") });
  tabs.push({ href: "/meg", label: "Meg", icon: "user", on: path.startsWith("/meg") });

  return (
    <nav className="tabbar" aria-label="Hovedmeny">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={t.on ? "on" : ""} aria-current={t.on ? "page" : undefined}>
          <span className="tab-icon">
            <Icon name={t.icon} size={22} />
            {t.count != null && t.count > 0 && <span className="tab-badge">{t.count > 9 ? "9+" : t.count}</span>}
          </span>
          <span className="tab-lbl">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
