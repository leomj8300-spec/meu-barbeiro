import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export const ADMIN_COOKIE_NAME = "admin_session";

/**
 * Sessão do super-admin é separada do NextAuth de tenant (que exige
 * barbeariaId em todo lugar) — um cookie assinado próprio, reaproveitando
 * AUTH_SECRET, no mesmo padrão de src/lib/supabase/jwt.ts.
 */
export async function signAdminSession(email: string): Promise<string> {
  return new SignJWT({ role: "super_admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "super_admin";
  } catch {
    return false;
  }
}

/**
 * Token de vida curta pra o super-admin "entrar como" o dono de uma
 * barbearia sem saber a senha dele — consumido uma única vez dentro do
 * authorize() do NextAuth (ver src/auth.ts), nunca exposto além disso.
 */
export async function signImpersonationToken(barbeariaId: string): Promise<string> {
  return new SignJWT({ role: "impersonate", barbeariaId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(secret);
}

export async function verifyImpersonationToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "impersonate" || typeof payload.barbeariaId !== "string") return null;
    return payload.barbeariaId;
  } catch {
    return null;
  }
}
