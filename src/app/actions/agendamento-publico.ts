"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getBarbeariaPublica, getJanelasOcupadas } from "@/lib/publico";
import {
  DIAS_A_FRENTE,
  HORAS_PARA_DESMARCAR,
  LIMITE_POR_TELEFONE,
  horariosLivres,
  instante,
  primeiroBarbeiroLivre,
  somarDias,
} from "@/lib/horarios";

/**
 * Ações da página pública. Rodam sem sessão, então tudo aqui parte do
 * subdomínio da URL (que o servidor resolve) — nunca de um id de barbearia
 * mandado pelo navegador.
 */

const diaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

const consultaSchema = z.object({
  subdominio: z.string().trim().min(1),
  dia: diaSchema,
  servicoIds: z.array(z.string().uuid()).min(1, "Escolha pelo menos um serviço."),
  barbeiroId: z.string().uuid().optional(),
});

function hojeEmSaoPaulo() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export async function horariosLivresAction(
  input: z.infer<typeof consultaSchema>,
): Promise<{ error: string | null; horarios: string[] }> {
  const parsed = consultaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", horarios: [] };
  }
  const { subdominio, dia, servicoIds, barbeiroId } = parsed.data;

  const barbearia = await getBarbeariaPublica(subdominio);
  if (!barbearia) return { error: "Agendamento indisponível.", horarios: [] };

  const hoje = hojeEmSaoPaulo();
  if (dia < hoje || dia > somarDias(hoje, DIAS_A_FRENTE)) {
    return { error: "Data fora do período de agendamento.", horarios: [] };
  }

  const escolhidos = barbearia.servicos.filter((s) => servicoIds.includes(s.id));
  if (escolhidos.length !== servicoIds.length) {
    return { error: "Serviço não encontrado.", horarios: [] };
  }
  const duracaoMin = escolhidos.reduce((soma, s) => soma + s.duracaoMin, 0);

  const elegiveis = barbeiroId
    ? barbearia.atendentes.filter((a) => a.id === barbeiroId).map((a) => a.id)
    : barbearia.atendentes.map((a) => a.id);

  const horarios = horariosLivres({
    dia,
    duracaoMin,
    horaAbertura: barbearia.horaAbertura,
    horaFechamento: barbearia.horaFechamento,
    diasFuncionamento: barbearia.diasFuncionamento,
    barbeirosElegiveis: elegiveis,
    ocupados: await getJanelasOcupadas(barbearia.id, dia),
  });

  return { error: null, horarios };
}

const agendarSchema = consultaSchema.extend({
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido."),
  nome: z.string().trim().min(2, "Informe seu nome.").max(80, "Nome muito longo."),
  telefone: z
    .string()
    .trim()
    .min(8, "Informe um telefone com DDD.")
    .max(20, "Telefone muito longo."),
});

export async function agendarPublicoAction(
  input: z.infer<typeof agendarSchema>,
): Promise<{ error: string | null; token?: string }> {
  const parsed = agendarSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { subdominio, dia, hora, servicoIds, barbeiroId, nome, telefone } = parsed.data;

  const barbearia = await getBarbeariaPublica(subdominio);
  if (!barbearia) return { error: "Agendamento indisponível." };

  const hoje = hojeEmSaoPaulo();
  if (dia < hoje || dia > somarDias(hoje, DIAS_A_FRENTE)) {
    return { error: "Data fora do período de agendamento." };
  }

  const escolhidos = barbearia.servicos.filter((s) => servicoIds.includes(s.id));
  if (escolhidos.length !== servicoIds.length) return { error: "Serviço não encontrado." };
  const duracaoMin = escolhidos.reduce((soma, s) => soma + s.duracaoMin, 0);

  const db = supabaseAdmin();
  const soDigitos = telefone.replace(/\D/g, "");

  // Trava contra agenda entupida de horário falso: sem login, o telefone é a
  // única âncora que temos. Conta só o que ainda vai acontecer.
  const { data: emAberto } = await db
    .from("agendamentos")
    .select("id, telefone")
    .eq("barbearia_id", barbearia.id)
    .eq("status", "marcado")
    .gte("inicio", new Date().toISOString());

  const doMesmoTelefone = (emAberto ?? []).filter(
    (a) => (a.telefone ?? "").replace(/\D/g, "") === soDigitos,
  );
  if (doMesmoTelefone.length >= LIMITE_POR_TELEFONE) {
    return {
      error: `Você já tem ${LIMITE_POR_TELEFONE} horários marcados. Desmarque um antes de marcar outro.`,
    };
  }

  // Revalida a vaga agora: entre o cliente ver a lista e apertar o botão,
  // alguém pode ter pegado o mesmo horário.
  const ocupados = await getJanelasOcupadas(barbearia.id, dia);
  const elegiveis = barbeiroId
    ? barbearia.atendentes.filter((a) => a.id === barbeiroId).map((a) => a.id)
    : barbearia.atendentes.map((a) => a.id);

  const livres = horariosLivres({
    dia,
    duracaoMin,
    horaAbertura: barbearia.horaAbertura,
    horaFechamento: barbearia.horaFechamento,
    diasFuncionamento: barbearia.diasFuncionamento,
    barbeirosElegiveis: elegiveis,
    ocupados,
  });
  if (!livres.includes(hora)) {
    return { error: "Esse horário acabou de ser ocupado. Escolha outro." };
  }

  const barbeiroEscolhido = primeiroBarbeiroLivre({
    dia,
    hora,
    duracaoMin,
    barbeirosElegiveis: elegiveis,
    ocupados,
  });
  if (!barbeiroEscolhido) return { error: "Esse horário acabou de ser ocupado. Escolha outro." };

  // Reaproveita a ficha pelo telefone (mais confiável que o nome, que cada dia
  // vem escrito de um jeito); se for gente nova, abre ficha já com o contato.
  const { data: fichas } = await db
    .from("clientes")
    .select("id, telefone")
    .eq("barbearia_id", barbearia.id)
    .not("telefone", "is", null);

  let clienteId =
    fichas?.find((c) => (c.telefone ?? "").replace(/\D/g, "") === soDigitos)?.id ?? null;

  if (!clienteId) {
    const { data: nova } = await db
      .from("clientes")
      .insert({ barbearia_id: barbearia.id, nome, telefone })
      .select("id")
      .single();
    clienteId = nova?.id ?? null;
  }

  const { data: criado, error } = await db
    .from("agendamentos")
    .insert({
      barbearia_id: barbearia.id,
      barbeiro_id: barbeiroEscolhido,
      cliente: nome,
      cliente_id: clienteId,
      telefone,
      inicio: instante(dia, hora).toISOString(),
      duracao_min: duracaoMin,
      origem: "cliente",
    })
    .select("id, token_publico")
    .single();

  if (error || !criado) return { error: "Não foi possível marcar o horário." };

  const { error: erroServicos } = await db.from("agendamento_servicos").insert(
    escolhidos.map((s) => ({
      agendamento_id: criado.id,
      servico_id: s.id,
      nome: s.nome,
      preco: s.preco,
      duracao_min: s.duracaoMin,
    })),
  );
  if (erroServicos) {
    await db.from("agendamentos").delete().eq("id", criado.id);
    return { error: "Não foi possível marcar o horário." };
  }

  revalidatePath("/agenda");
  return { error: null, token: criado.token_publico };
}

export async function desmarcarPublicoAction(
  token: string,
): Promise<{ error: string | null }> {
  if (!z.string().uuid().safeParse(token).success) {
    return { error: "Link inválido." };
  }

  const db = supabaseAdmin();
  const { data: agendamento } = await db
    .from("agendamentos")
    .select("id, inicio, status")
    .eq("token_publico", token)
    .maybeSingle();

  if (!agendamento) return { error: "Horário não encontrado." };
  if (agendamento.status !== "marcado") return { error: "Esse horário não está mais ativo." };

  const faltam = new Date(agendamento.inicio).getTime() - Date.now();
  if (faltam < HORAS_PARA_DESMARCAR * 3600000) {
    return {
      error: `Só dá pra desmarcar até ${HORAS_PARA_DESMARCAR}h antes. Ligue para a barbearia.`,
    };
  }

  const { error } = await db
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", agendamento.id);

  if (error) return { error: "Não foi possível desmarcar." };

  revalidatePath("/agenda");
  return { error: null };
}
