import type { Metadata } from "next";
import "./globals.css";

// Metadata = tittelen som vises i nettleserfanen og når appen legges på hjemskjermen.
export const metadata: Metadata = {
  title: "3DKing",
  description: "Bestill 3D-printede ting. Testversjon og hobbyprosjekt.",
};

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
      </body>
    </html>
  );
}
