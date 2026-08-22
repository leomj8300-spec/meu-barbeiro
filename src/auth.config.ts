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
      return isLoggedIn;
    },
  },
  providers: [], // preenchido em auth.ts (edge middleware não pode usar bcrypt/supabase)
} satisfies NextAuthConfig;
