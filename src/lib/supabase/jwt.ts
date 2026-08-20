import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);

/**
 * Assina um JWT compatível com o Supabase (mesmo segredo legado usado pelo
 * PostgREST) contendo barbearia_id/papel como claims. É esse token — não a
 * chave secreta — que o app passa a usar depois do login, ativando o RLS
 * como segunda camada de isolamento independente do filtro já aplicado em
 * cada query.
 *
 * Validade de 30 dias para acompanhar o maxAge padrão da sessão do Auth.js:
 * o callback jwt() do NextAuth só recalcula esse valor quando o token é
 * (re)emitido, não a cada request, então ele precisa sobreviver pelo menos
 * tanto quanto a sessão externa.
 */
export async function mintSupabaseAccessToken(payload: {
  sub: string;
  barbeariaId: string;
  papel: string;
}): Promise<string> {
  return new SignJWT({
    role: "authenticated",
    barbearia_id: payload.barbeariaId,
    papel: payload.papel,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}
