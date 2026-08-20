import type { DefaultSession } from "next-auth";
import type { Papel } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      barbeariaId: string;
      papel: Papel;
      comissaoPadrao: number;
    } & DefaultSession["user"];
    /** JWT assinado com o segredo legado do Supabase — ativa RLS por usuário. */
    supabaseAccessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    barbeariaId: string;
    papel: Papel;
    comissaoPadrao: number;
    supabaseAccessToken: string;
  }
}
