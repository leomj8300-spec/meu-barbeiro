import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { supabaseAdmin } from "./lib/supabase/server";
import { mintSupabaseAccessToken } from "./lib/supabase/jwt";
import type { Usuario } from "./lib/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        barbeariaId: {},
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const senha = String(credentials?.password ?? "");
        const barbeariaIdRaw = credentials?.barbeariaId ? String(credentials.barbeariaId) : "";
        const barbeariaId = barbeariaIdRaw && barbeariaIdRaw !== "undefined" ? barbeariaIdRaw : undefined;
        if (!email || !senha) return null;

        // Login por caminho (/b/[subdominio]/login) já vem escopado por
        // barbearia; o /login genérico não sabe de qual tenant é, então cai
        // pra busca só por e-mail — .maybeSingle() em vez de .single() evita
        // derrubar o login se, um dia, duas barbearias tiverem e-mail igual.
        let query = supabaseAdmin()
          .from("usuarios")
          .select("id, barbearia_id, nome, email, senha_hash, papel, comissao_padrao")
          .eq("email", email);
        if (barbeariaId) query = query.eq("barbearia_id", barbeariaId);

        const { data: usuario, error } = await query.maybeSingle();

        if (error || !usuario) return null;

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          barbeariaId: usuario.barbearia_id,
          papel: usuario.papel,
          comissaoPadrao: usuario.comissao_padrao,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.barbeariaId = (user as unknown as Record<string, unknown>).barbeariaId as string;
        token.papel = (user as unknown as Record<string, unknown>).papel as Usuario["papel"];
        token.comissaoPadrao = (user as unknown as Record<string, unknown>).comissaoPadrao as number;
        token.supabaseAccessToken = await mintSupabaseAccessToken({
          sub: token.id as string,
          barbeariaId: token.barbeariaId as string,
          papel: token.papel as string,
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.barbeariaId = token.barbeariaId as string;
        session.user.papel = token.papel as Usuario["papel"];
        session.user.comissaoPadrao = token.comissaoPadrao as number;
      }
      session.supabaseAccessToken = token.supabaseAccessToken as string;
      return session;
    },
  },
});
