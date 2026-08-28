import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Registra uma falha real (não erro de validação — aquele o usuário já vê
 * na hora) pra dar à IA de suporte um sinal concreto do que aconteceu, em
 * vez de só a descrição do usuário. Nunca deve travar o fluxo principal:
 * se o próprio log falhar, é engolido em silêncio.
 */
export async function registrarErro(params: {
  barbeariaId?: string;
  usuarioId?: string;
  contexto: string;
  mensagem: string;
}): Promise<void> {
  try {
    await supabaseAdmin()
      .from("logs_erro")
      .insert({
        barbearia_id: params.barbeariaId ?? null,
        usuario_id: params.usuarioId ?? null,
        contexto: params.contexto,
        mensagem: params.mensagem,
      });
  } catch {
    // intencional — logging nunca pode ser a causa de um erro maior
  }
}
