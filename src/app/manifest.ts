import type { MetadataRoute } from "next";

// Manifestet forteller telefonen og PC-en at 3DKing kan installeres som en app:
// navn, ikon, farger, og at den skal åpnes uten adressefelt («standalone»).
// Ikonene er laget fra design/ikon.html.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "3DKing",
    short_name: "3DKing",
    description: "Bestill 3D-printede ting",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#121212",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // «maskable»: Android kan klippe dette til sirkel eller dråpe. Innholdet ligger trygt inne i midten.
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
