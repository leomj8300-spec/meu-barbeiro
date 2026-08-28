"use server";

import { auth, signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

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
  // Se ESTA sessão foi criada pelo super-admin via "Entrar como dono" (ver
  // impersonarBarbeariaAction em src/app/actions/admin.ts), sair deve voltar
  // pro painel de admin, não pro login de tenant. A flag vem da própria
  // sessão (setada em authorize() só no fluxo de impersonação) — checar
  // apenas "existe um cookie de admin válido" está errado, porque esse
  // cookie é independente da sessão atual: um super-admin pode estar logado
  // em /admin numa aba enquanto um barbeiro comum loga normalmente noutra
  // aba do mesmo navegador, e nesse caso o logout do barbeiro não deve ir
  // pro /admin.
  const session = await auth();
  const veioDoAdmin = session?.user?.viaImpersonation === true;

  await signOut({ redirectTo: veioDoAdmin ? "/admin" : "/login" });
}
