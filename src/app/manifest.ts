import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meu Barbeiro",
    short_name: "Meu Barbeiro",
    description: "Corte & estilo.",
    start_url: "/",
    display: "standalone",
    background_color: "#16161D",
    theme_color: "#16161D",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
