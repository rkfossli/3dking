import type { Metadata, Viewport } from "next";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

// Metadata = tittelen som vises i nettleserfanen og når appen legges på hjemskjermen.
export const metadata: Metadata = {
  title: "3DKing",
  description: "Bestill 3D-printede ting. Testversjon og hobbyprosjekt.",
  // iPhone: åpne uten Safari-knapper når appen startes fra Hjem-skjermen.
  appleWebApp: { capable: true, title: "3DKing", statusBarStyle: "black" },
  // Ikonet iPhone bruker på Hjem-skjermen. Laget fra design/ikon.html.
  icons: { apple: "/icons/apple-touch-icon.png" },
};

// Fargen på statuslinjen og vinduskanten når appen er installert.
export const viewport: Viewport = { themeColor: "#121212" };

// RootLayout pakker inn ALLE sidene i appen. Det som står her, vises på hver side.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="no" data-theme="neon">
      <body>
        {/* Testbanneret skal alltid være synlig, så det ligger i layouten. */}
        <div className="test-banner">
          Testversjon · Hobbyprosjekt for å lære koding · Prisene dekker bare filament og strøm
        </div>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
