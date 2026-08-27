import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Prata } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { getPreferenciasTema } from "@/lib/queries";
import { TEMA_PADRAO, TEMA_TOKENS } from "@/lib/theme";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const prata = Prata({
  variable: "--font-prata",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Meu Barbeiro — Sistema Online",
  description: "Corte & estilo.",
  appleWebApp: {
    capable: true,
    title: "Meu Barbeiro",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16161D",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const prefs = session?.user
    ? await getPreferenciasTema(session.user.id)
    : TEMA_PADRAO;
  const t = TEMA_TOKENS[prefs.temaCor];

  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${ibmPlexMono.variable} ${prata.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">
        <style
          // Resolve a cor de destaque do usuário logado no servidor — zero
          // flash, zero JS. Só interpola hex vindos de TEMA_TOKENS (nunca a
          // string crua salva no banco), então é seguro mesmo tema_cor sendo
          // dado pelo usuário.
          dangerouslySetInnerHTML={{
            __html: `:root{--color-accent:${t.accent};--color-on-accent:${t.onAccent};--color-accent-ink-label:${t.accentText};--color-accent-label:${t.accentOnLight};--color-accent-soft:${t.accentSoft};--color-accent-border:${t.accentBorder};}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
