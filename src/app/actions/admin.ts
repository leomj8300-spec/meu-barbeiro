"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  signAdminSession,
  verifyAdminSession,
  signImpersonationToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/admin-session";

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(1),
});

export async function adminLoginAction(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) return { error: "Informe e-mail e senha." };

  const emailEsperado = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const senhaEsperada = process.env.SUPER_ADMIN_PASSWORD ?? "";

  const emailOk = emailEsperado.length > 0 && timingSafeEqualStr(parsed.data.email, emailEsperado);
  const senhaOk = senhaEsperada.length > 0 && timingSafeEqualStr(parsed.data.senha, senhaEsperada);

  if (!emailOk || !senhaOk) {
    return { error: "E-mail ou senha inválidos." };
  }

  const token = await signAdminSession(parsed.data.email);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
}

export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

const criarBarbeariaSchema = z.object({
  nomeBarbearia: z.string().trim().min(1, "Informe o nome da barbearia."),
  subdominio: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Informe o identificador da barbearia.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use só letras minúsculas, números e hífen."),
  nomeDono: z.string().trim().min(1, "Informe o nome do dono."),
  emailDono: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  senhaDono: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
});

export type CriarBarbeariaInput = z.infer<typeof criarBarbeariaSchema>;

async function exigirAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return !!token && (await verifyAdminSession(token));
}

export async function criarBarbeariaAction(
  input: CriarBarbeariaInput,
): Promise<{ error: string | null; subdominio?: string }> {
  if (!(await exigirAdmin())) return { error: "Sessão de administrador expirada." };

  const parsed = criarBarbeariaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { nomeBarbearia, subdominio, nomeDono, emailDono, senhaDono } = parsed.data;

  const db = supabaseAdmin();

  const { data: barbearia, error: errBarbearia } = await db
    .from("barbearias")
    .insert({ nome: nomeBarbearia, subdominio })
    .select("id")
    .single();

  if (errBarbearia) {
    if (errBarbearia.code === "23505") {
      return { error: "Já existe uma barbearia com esse identificador." };
    }
    return { error: "Não foi possível criar a barbearia." };
  }

  const senhaHash = await bcrypt.hash(senhaDono, 10);
  const { error: errDono } = await db.from("usuarios").insert({
    barbearia_id: barbearia.id,
    nome: nomeDono,
    email: emailDono,
    senha_hash: senhaHash,
    papel: "dono",
    comissao_padrao: 0,
  });

  if (errDono) {
    await db.from("barbearias").delete().eq("id", barbearia.id);
    return { error: "Não foi possível criar o dono da barbearia." };
  }

  revalidatePath("/admin");
  return { error: null, subdominio };
}

export async function impersonarBarbeariaAction(barbeariaId: string): Promise<void> {
  if (!(await exigirAdmin())) redirect("/admin/login");

  const token = await signImpersonationToken(barbeariaId);
  try {
    await signIn("credentials", { impersonateToken: token, redirectTo: "/atendimento" });
  } catch (err) {
    if (err instanceof AuthError) redirect("/admin");
    throw err;
  }
}
