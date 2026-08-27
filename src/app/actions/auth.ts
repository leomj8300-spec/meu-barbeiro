"use server";

import { cookies } from "next/headers";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-session";

export async function loginAction(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  try {
    const barbeariaId = formData.get("barbeariaId");
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      // Só inclui a chave quando existe de verdade — passar `undefined` aqui
      // vira a string "undefined" no pipeline do NextAuth, o que faria
      // authorize() tratar como um barbeariaId presente (e inválido).
      ...(typeof barbeariaId === "string" && barbeariaId ? { barbeariaId } : {}),
      redirectTo: "/atendimento",
    });
    return { error: null };
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw err;
  }
}

export async function logoutAction() {
  // Se o super-admin entrou nessa conta por impersonação (ver
  // impersonarBarbeariaAction em src/app/actions/admin.ts), a sessão de
  // admin continua ativa em paralelo — sair deve voltar pro painel de
  // admin, não pro login de tenant.
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const veioDoAdmin = !!adminToken && (await verifyAdminSession(adminToken));

  await signOut({ redirectTo: veioDoAdmin ? "/admin" : "/login" });
}
