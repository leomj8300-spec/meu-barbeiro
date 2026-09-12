/**
 * Mensagens prontas pro barbeiro mandar num toque.
 *
 * O app não envia nada sozinho — monta o texto e abre a conversa no WhatsApp
 * do próprio barbeiro. Sai do número que o cliente reconhece (e responde), e
 * não custa nada, diferente da API oficial que cobra por conversa.
 *
 * O texto é sugestão: o barbeiro edita antes de enviar se quiser.
 */

/**
 * Telefone no formato que o wa.me aceita: só dígitos, com país.
 * Brasileiro costuma ser digitado como (11) 98888-7777 — sem o 55 na frente
 * o link abre conversa errada ou nenhuma.
 */
export function telefoneParaWhatsapp(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  if (digitos.startsWith("55")) return digitos;
  // 10 dígitos (fixo com DDD) ou 11 (celular com DDD) são locais.
  if (digitos.length <= 11) return `55${digitos}`;
  return digitos;
}

export function linkWhatsapp(telefone: string, mensagem: string): string | null {
  const numero = telefoneParaWhatsapp(telefone);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

/** Só o primeiro nome — "Oi José Carlos da Silva" soa a cobrança de banco. */
function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0];
}

export function msgLembrete(nome: string, hora: string, barbearia: string) {
  return `Oi ${primeiroNome(nome)}! Passando pra lembrar do seu horário amanhã às ${hora} na ${barbearia}. Posso confirmar?`;
}

export function msgRetorno(nome: string, dias: number, barbearia: string) {
  return `Oi ${primeiroNome(nome)}! Faz ${dias} dias desde seu último corte na ${barbearia}. Quer marcar um horário?`;
}

export function msgAniversario(nome: string, barbearia: string) {
  return `Oi ${primeiroNome(nome)}! Parabéns pelo seu aniversário! 🎉 Aqui na ${barbearia} a gente queria te desejar um ótimo dia.`;
}

export function msgAvaliacao(nome: string, barbearia: string, link: string) {
  return `Oi ${primeiroNome(nome)}! Valeu por vir na ${barbearia}. Que nota você dá pro atendimento de hoje? ${link}`;
}
