import { NextResponse } from "next/server";

// Manifest separado pro painel de admin — o convention `app/manifest.ts` só
// funciona na raiz do app (ver docs), então esse aqui é uma Route Handler
// comum, referenciada via metadata.manifest em src/app/admin/layout.tsx.
// Permite instalar "Meu Barbeiro Admin" como um atalho separado do app do
// barbeiro, abrindo direto em /admin.
export async function GET() {
  return NextResponse.json(
    {
      name: "Meu Barbeiro Admin",
      short_name: "MB Admin",
      description: "Painel administrativo.",
      start_url: "/admin",
      display: "standalone",
      background_color: "#16161D",
      theme_color: "#16161D",
      icons: [
        { src: "/icon-192", sizes: "192x192", type: "image/png" },
        { src: "/icon-512", sizes: "512x512", type: "image/png" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
