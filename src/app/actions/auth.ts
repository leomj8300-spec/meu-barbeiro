"use server";

import { signIn, signOut } from "@/auth";
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
  await signOut({ redirectTo: "/login" });
}
