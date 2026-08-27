import type { Metadata } from "next";

// Sobrescreve o manifest herdado da raiz — assim "Adicionar à tela de
// início" a partir de qualquer página /admin instala um atalho separado
// ("Meu Barbeiro Admin"), distinto do atalho do app do barbeiro.
export const metadata: Metadata = {
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Meu Barbeiro Admin",
    statusBarStyle: "black-translucent",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
