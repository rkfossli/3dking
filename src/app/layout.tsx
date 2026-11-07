import type { Metadata, Viewport } from "next";
import { ServiceWorker } from "@/components/ServiceWorker";
import { TabBar } from "@/components/TabBar";
import { countNew, countUpdatesForUser } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";
import { isMode, isTheme, themeBg } from "@/lib/themes";
import "./globals.css";

// Metadata = tittelen som vises i nettleserfanen og når appen legges på hjemskjermen.
export const metadata: Metadata = {
  title: "3DKing",
  description: "Bestill 3D-printede ting. Et hobbyprosjekt.",
  // iPhone: åpne uten Safari-knapper når appen startes fra Hjem-skjermen.
  appleWebApp: { capable: true, title: "3DKing", statusBarStyle: "black" },
  // Ikonet iPhone bruker på Hjem-skjermen. Laget fra design/ikon.html.
  icons: { apple: "/icons/apple-touch-icon.png" },
};

// Fargen på statuslinjen og vinduskanten når appen er installert. Følger temaet til den som er logget inn.
export async function generateViewport(): Promise<Viewport> {
  const user = await getCurrentUser();
  return { themeColor: themeBg(user?.theme ?? "neon", user?.mode ?? "dark") };
}

// RootLayout pakker inn ALLE sidene i appen. Det som står her, vises på hver side.
// Temaet og lys/mørk hentes fra brukeren og settes på <html>, så riktige farger gjelder fra første stund.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const theme = user && isTheme(user.theme) ? user.theme : "neon";
  const mode = user && isMode(user.mode) ? user.mode : "dark";
  // Tallene på fanelinja: nye bestillinger (bare Liam) og nytt på mine bestillinger.
  const isAdmin = user?.role === "admin";
  const waiting = isAdmin ? await countNew() : 0;
  const updates = user ? await countUpdatesForUser(user.id, user.ordersSeenAt) : 0;
  return (
    <html lang="no" data-theme={theme} data-mode={mode}>
      <body className={user ? "has-tabbar" : undefined}>
        {children}
        {/* Fanelinja vises bare når noen er logget inn. Den svever rett over infolinja. */}
        {user && <TabBar isAdmin={isAdmin} waiting={waiting} updates={updates} />}
        {/* Infolinja ligger fast nederst på skjermen, så den alltid er synlig uten å ta plass øverst. */}
        <footer className="info-bar">
          Hobbyprosjekt · <span className="wide-only">Prisene dekker bare filament og strøm</span>
          <span className="narrow-only">Pris = filament og strøm</span>
        </footer>
        <ServiceWorker />
      </body>
    </html>
  );
}
