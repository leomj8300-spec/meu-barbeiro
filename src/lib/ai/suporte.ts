import Anthropic from "@anthropic-ai/sdk";
import type { Tool, MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import {
  getServicos,
  getConsumos,
  getConfiguracoes,
  getBarbeiros,
  getAtendimentosPendentes,
  getHistoricoAtendimentos,
} from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Papel } from "@/lib/types";

// Instanciado sob demanda (não no carregamento do módulo) — assim, em
// qualquer ambiente onde ANTHROPIC_API_KEY ainda não esteja configurada, o
// app inteiro não quebra por causa disso: só essa chamada específica falha,
// de forma tratada (ver o catch em gerarRespostaSuporte).
let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada.");
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

export interface MensagemSuporte {
  remetente: "usuario" | "ia" | "admin";
  conteudo: string;
}

/**
 * Lista de ações seguras que a IA pode propor — cada uma é só uma chamada
 * de uma action real que já existe no app, então a permissão de quem pode
 * fazer o quê continua sendo decidida pela própria action (exigirDono() /
 * checagem de papel), nunca por esta lista. A IA não ganha nenhum poder
 * novo, só consegue disparar mais rápido o que um clique manual já faria.
 */
const FERRAMENTAS: Tool[] = [
  {
    name: "ajustar_comissao_barbeiro",
    description:
      "Propõe mudar o percentual de comissão de um barbeiro específico desta barbearia. Só o dono pode confirmar essa ação.",
    input_schema: {
      type: "object",
      properties: {
        barbeiroId: { type: "string", description: "id (uuid) do usuário barbeiro, veja na lista de barbeiros do contexto" },
        novoPct: { type: "number", description: "novo percentual de comissão, entre 0 e 100" },
      },
      required: ["barbeiroId", "novoPct"],
    },
  },
  {
    name: "alternar_recurso",
    description:
      "Liga ou desliga um recurso pra barbearia inteira: fiado, caixinha ou comissão. Só o dono pode confirmar essa ação.",
    input_schema: {
      type: "object",
      properties: {
        recurso: { type: "string", enum: ["fiado", "caixinha", "comissao"] },
        ligado: { type: "boolean" },
      },
      required: ["recurso", "ligado"],
    },
  },
  {
    name: "marcar_fiado_pago",
    description: "Marca um atendimento fiado específico (já identificado no contexto) como pago.",
    input_schema: {
      type: "object",
      properties: {
        atendimentoId: { type: "string", description: "id (uuid) do atendimento, veja na lista de fiados pendentes do contexto" },
        clienteResumo: { type: "string", description: "nome do cliente e valor, só pra mostrar na confirmação" },
      },
      required: ["atendimentoId", "clienteResumo"],
    },
  },
  {
    name: "escalar_para_admin",
    description:
      "Use quando o problema parecer um bug de código real, algo que nenhuma das outras ferramentas resolve. Encerra a investigação por aqui e entrega um relatório pro administrador do sistema decidir — nunca tente adivinhar uma correção de código sozinho.",
    input_schema: {
      type: "object",
      properties: {
        diagnostico: {
          type: "string",
          description:
            "Explicação clara, em português simples, sem jargão técnico: o que a pessoa relatou, o que foi investigado nos dados, e qual o problema mais provável.",
        },
      },
      required: ["diagnostico"],
    },
  },
];

export type NomeAcao = "ajustar_comissao_barbeiro" | "alternar_recurso" | "marcar_fiado_pago";

export interface AcaoProposta {
  acao: NomeAcao;
  params: Record<string, unknown>;
  descricao: string;
}

export interface RespostaSuporte {
  conteudo: string;
  acaoProposta: AcaoProposta | null;
  escalar: boolean;
}

async function montarContexto(barbeariaId: string, usuarioId: string, papel: Papel): Promise<string> {
  const [servicos, consumos, config, barbeiros, pendentes, historico, errosRes] = await Promise.all([
    getServicos(barbeariaId),
    getConsumos(barbeariaId),
    getConfiguracoes(barbeariaId),
    getBarbeiros(barbeariaId),
    getAtendimentosPendentes(barbeariaId, papel === "barbeiro" ? usuarioId : undefined),
    getHistoricoAtendimentos(barbeariaId, papel === "barbeiro" ? usuarioId : undefined),
    supabaseAdmin()
      .from("logs_erro")
      .select("contexto, mensagem, criado_em")
      .eq("barbearia_id", barbeariaId)
      .eq("usuario_id", usuarioId)
      .order("criado_em", { ascending: false })
      .limit(5),
  ]);

  return JSON.stringify(
    {
      papelDeQuemAbriu: papel,
      configuracoes: config,
      servicos,
      consumos,
      barbeiros,
      fiadosPendentes: pendentes.slice(0, 10),
      ultimosAtendimentos: historico.slice(0, 10),
      errosRecentesDesseUsuario: (errosRes.data ?? []).map((e) => ({
        contexto: e.contexto,
        mensagem: e.mensagem,
        quando: e.criado_em,
      })),
    },
    null,
    2,
  );
}

function descreverAcao(nome: NomeAcao, input: Record<string, unknown>): string {
  switch (nome) {
    case "ajustar_comissao_barbeiro":
      return `Ajustar a comissão do barbeiro pra ${input.novoPct}%.`;
    case "alternar_recurso":
      return `${input.ligado ? "Ligar" : "Desligar"} o recurso "${input.recurso}" pra barbearia.`;
    case "marcar_fiado_pago":
      return `Marcar o fiado de ${input.clienteResumo} como pago.`;
  }
}

export async function gerarRespostaSuporte(params: {
  barbeariaId: string;
  usuarioId: string;
  papel: Papel;
  historico: MensagemSuporte[];
}): Promise<RespostaSuporte> {
  const contexto = await montarContexto(params.barbeariaId, params.usuarioId, params.papel);

  const system = `Você é o suporte do app "Meu Barbeiro", um sistema de gestão pra barbearias. Responda sempre em português simples e direto, sem jargão técnico — quem está te lendo não é programador.

Quem está te chamando é um "${params.papel}" desta barbearia. Importante: um barbeiro não pode alterar a própria comissão nem ligar/desligar recursos da barbearia — só o dono pode. Se um barbeiro pedir algo assim, explique isso claramente e não chame a ferramenta (a permissão real bloquearia mesmo assim, mas evite a tentativa desnecessária).

Você tem acesso aos dados reais desta barbearia logo abaixo, em JSON — use isso pra diagnosticar antes de perguntar algo que já está nos dados.

Se o problema tiver solução com uma das ferramentas disponíveis, chame a ferramenta com os parâmetros certos — isso só PROPÕE a ação, a execução de verdade só acontece depois que a pessoa confirmar explicitamente na tela, você nunca executa nada direto.

Se o problema parecer um bug de código real (nenhuma ferramenta resolve, ou um comportamento claramente errado do sistema), use escalar_para_admin com um diagnóstico claro.

Se a mensagem ainda não tiver informação suficiente pra diagnosticar (ex: "não funciona" sem dizer o quê), NÃO use nenhuma ferramenta — responda só com uma pergunta objetiva.

Dados desta barbearia:
${contexto}`;

  const messages: MessageParam[] = params.historico.map((m) => ({
    role: m.remetente === "usuario" ? "user" : "assistant",
    content: m.conteudo,
  }));

  const resposta = await getAnthropic().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system,
    tools: FERRAMENTAS,
    messages,
  });

  let texto = "";
  let acaoProposta: AcaoProposta | null = null;
  let escalar = false;

  for (const bloco of resposta.content) {
    if (bloco.type === "text") {
      texto += bloco.text;
    } else if (bloco.type === "tool_use") {
      const input = bloco.input as Record<string, unknown>;
      if (bloco.name === "escalar_para_admin") {
        escalar = true;
        texto = String(input.diagnostico ?? texto);
      } else if (
        bloco.name === "ajustar_comissao_barbeiro" ||
        bloco.name === "alternar_recurso" ||
        bloco.name === "marcar_fiado_pago"
      ) {
        acaoProposta = {
          acao: bloco.name,
          params: input,
          descricao: descreverAcao(bloco.name, input),
        };
        if (!texto) texto = acaoProposta.descricao;
      }
    }
  }

  if (!texto) texto = "Não consegui entender direito — pode explicar de outro jeito?";

  return { conteudo: texto, acaoProposta, escalar };
}
