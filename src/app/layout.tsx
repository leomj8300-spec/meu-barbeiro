import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Prata } from "next/font/google";
import Script from "next/script";
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
  // "cover" faz o conteúdo ir até a borda física da tela — necessário pra
  // env(safe-area-inset-*) resolver pra um valor real (senão fica 0) e a
  // barra inferior fixa não ficar embaixo do home indicator do iPhone.
  viewportFit: "cover",
};

function estiloAccent(t: { accent: string; onAccent: string; accentText: string; accentOnLight: string; accentSoft: string; accentBorder: string }) {
  return `--color-accent:${t.accent};--color-on-accent:${t.onAccent};--color-accent-ink-label:${t.accentText};--color-accent-label:${t.accentOnLight};--color-accent-soft:${t.accentSoft};--color-accent-border:${t.accentBorder};`;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const prefs = session?.user
    ? await getPreferenciasTema(session.user.id)
    : TEMA_PADRAO;
  const t = TEMA_TOKENS[prefs.temaCor];

  // "Escuro" é 100% resolvido aqui no servidor (zero JS, zero flash) — o
  // dado já existe na sessão. "Automático" depende da hora local do
  // aparelho, que o servidor não sabe (nem existe fuso da barbearia
  // guardado) — por isso, só nesse caso, um script bloqueante decide antes
  // da primeira pintura. Injetamos as DUAS variantes do accent (:root e
  // :root[data-theme="dark"]) sempre — assim, seja o atributo setado aqui
  // no servidor (modo "escuro") ou pelo script no cliente (modo
  // "automático"), a cascata do CSS já resolve a cor certa sozinha.
  const escuroNoServidor = prefs.temaModo === "escuro";

  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${ibmPlexMono.variable} ${prata.variable} h-full antialiased`}
      {...(escuroNoServidor ? { "data-theme": "dark" } : {})}
      // O modo "automático" seta data-theme no cliente, antes da
      // hidratação, com base na hora local — o HTML do servidor nunca tem
      // esse atributo nesse caso. É uma divergência esperada (mesmo padrão
      // do next-themes), não um bug: sem isso, o React descarta o
      // subtree ao detectar o mismatch e trata o <Script> abaixo como
      // renderizado no cliente, o que dispara o aviso de "script tag
      // never executed" mesmo ele já estando no HTML inicial de verdade.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">
        {prefs.temaModo === "automatico" && (
          <Script
            id="tema-automatico"
            strategy="beforeInteractive"
            // Bloqueante de propósito — precisa rodar antes da primeira
            // pintura do body pra não haver flash. Só decide claro/escuro
            // pela hora local; a cor de destaque em si já está nas duas
            // variantes no <style> abaixo, resolvidas pela cascata do CSS
            // assim que o atributo é setado.
          >
            {`(function(){var h=new Date().getHours();if(h<9||h>=18){document.documentElement.setAttribute("data-theme","dark");}})();`}
          </Script>
        )}
        <style
          // Resolve a cor de destaque do usuário logado no servidor — zero
          // flash, zero JS pros modos claro/escuro. Só interpola hex vindos
          // de TEMA_TOKENS (nunca a string crua salva no banco), então é
          // seguro mesmo tema_cor sendo dado pelo usuário.
          dangerouslySetInnerHTML={{
            __html: `:root{${estiloAccent(t.light)}}:root[data-theme="dark"]{${estiloAccent(t.dark)}}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
