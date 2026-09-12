import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isOnLogin = pathname === "/login" || /^\/b\/[^/]+\/login$/.test(pathname);
      if (isOnLogin) {
        return isLoggedIn ? Response.redirect(new URL("/atendimento", request.nextUrl)) : true;
      }

      // Agendamento online: o cliente não tem (nem deve ter) login. São as
      // únicas rotas abertas além do login, e de propósito bem específicas —
      // qualquer coisa fora delas continua exigindo sessão. Quem já está
      // logado também passa: o dono precisa conseguir abrir o próprio link
      // pra conferir como o cliente vê.
      const ehAgendamentoPublico =
        /^\/b\/[^/]+\/agendar$/.test(pathname) ||
        /^\/b\/[^/]+\/agendado\/[^/]+$/.test(pathname);
      if (ehAgendamentoPublico) return true;

      return isLoggedIn;
    },
  },
  providers: [], // preenchido em auth.ts (edge middleware não pode usar bcrypt/supabase)
} satisfies NextAuthConfig;
