"use client";

import { useEffect, useMemo, useState } from "react";
import { fmtHora, diasDesde } from "@/lib/formato";
import {
  linkWhatsapp,
  msgAniversario,
  msgAvaliacao,
  msgLembrete,
  msgRetorno,
} from "@/lib/whatsapp";
import type {
  AtendimentoAvaliavel,
  Cliente,
  ClienteSumido,
  LembreteAgendamento,
} from "@/lib/queries";

type Aba = "lembrar" | "sumidos" | "avaliar";

const ABAS: { id: Aba; label: string }[] = [
  { id: "lembrar", label: "Lembrar" },
  { id: "sumidos", label: "Sumidos" },
  { id: "avaliar", label: "Avaliações" },
];

function diaEMes(aniversario: string) {
  return `${aniversario.slice(8, 10)}/${aniversario.slice(5, 7)}`;
}

/** Botão que abre o WhatsApp já no chat certo, com o texto escrito. */
function BotaoWhatsapp({
  telefone,
  mensagem,
  rotulo = "WhatsApp",
}: {
  telefone: string | null;
  mensagem: string;
  rotulo?: string;
}) {
  const link = telefone ? linkWhatsapp(telefone, mensagem) : null;
  if (!link) {
    return (
      <span
        className="text-[11px] text-text-dim shrink-0"
        title="Cadastre o telefone na ficha do cliente"
      >
        sem telefone
      </span>
    );
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-[10px] border border-cons/40 bg-cons/10 text-cons text-[11px] font-semibold px-2.5 py-1 shrink-0 hover:bg-cons/20 transition-colors"
    >
      {rotulo}
    </a>
  );
}

export function RetencaoView({
  nomeBarbearia,
  subdominio,
  lembretes,
  sumidos,
  avaliacoes,
  aniversariantes,
  diasParaRetorno,
}: {
  nomeBarbearia: string;
  subdominio: string | null;
  lembretes: LembreteAgendamento[];
  sumidos: ClienteSumido[];
  avaliacoes: AtendimentoAvaliavel[];
  aniversariantes: Cliente[];
  diasParaRetorno: number;
}) {
  const [aba, setAba] = useState<Aba>(lembretes.length > 0 ? "lembrar" : "sumidos");

  // A origem só existe no navegador, e ela varia entre local e produção.
  const [origem, setOrigem] = useState("");
  useEffect(() => setOrigem(window.location.origin), []);

  const avaliados = useMemo(() => avaliacoes.filter((a) => a.nota !== null), [avaliacoes]);
  const media = useMemo(
    () =>
      avaliados.length === 0
        ? null
        : avaliados.reduce((s, a) => s + (a.nota ?? 0), 0) / avaliados.length,
    [avaliados],
  );
  const pendentes = useMemo(() => avaliacoes.filter((a) => a.nota === null), [avaliacoes]);

  // Aniversariantes de hoje entram no topo de "sumidos" porque é a mesma
  // ação: mandar mensagem agora.
  const hojeDiaMes = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const aniversariantesHoje = aniversariantes.filter(
    (c) => c.aniversario?.slice(5) === hojeDiaMes.slice(5),
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-dim text-[12px] -mt-2">
        O app escreve a mensagem; você confere e envia do seu WhatsApp.
      </p>

      <div className="flex gap-1.5">
        {ABAS.map((a) => {
          const contagem =
            a.id === "lembrar"
              ? lembretes.length
              : a.id === "sumidos"
                ? sumidos.length
                : pendentes.length;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={`chip ${aba === a.id ? "chip-on" : "chip-off"}`}
            >
              {a.label}
              {contagem > 0 && ` · ${contagem}`}
            </button>
          );
        })}
      </div>

      {aba === "lembrar" && (
        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold">
            Tem horário amanhã
          </h2>
          {lembretes.length === 0 ? (
            <p className="text-text-dim text-sm py-6 text-center">
              Ninguém marcado pra amanhã.
            </p>
          ) : (
            lembretes.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-2 rounded-[10px] border border-border bg-panel-2 px-3 py-2.5"
              >
                <span className="font-mono text-[13px] text-text font-semibold shrink-0">
                  {fmtHora(l.inicio)}
                </span>
                <span className="text-[13.5px] font-semibold text-text min-w-0 truncate flex-1">
                  {l.cliente}
                </span>
                <BotaoWhatsapp
                  telefone={l.telefone}
                  mensagem={msgLembrete(l.cliente, fmtHora(l.inicio), nomeBarbearia)}
                  rotulo="Lembrar"
                />
              </div>
            ))
          )}
        </section>
      )}

      {aba === "sumidos" && (
        <section className="flex flex-col gap-4">
          {aniversariantesHoje.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-warn font-semibold">
                Faz aniversário hoje
              </h2>
              {aniversariantesHoje.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-[10px] border border-warn/40 bg-warn/10 px-3 py-2.5"
                >
                  <span className="font-mono text-[11px] text-warn shrink-0">
                    {diaEMes(c.aniversario!)}
                  </span>
                  <span className="text-[13.5px] font-semibold text-text min-w-0 truncate flex-1">
                    {c.nome}
                  </span>
                  <BotaoWhatsapp
                    telefone={c.telefone}
                    mensagem={msgAniversario(c.nome, nomeBarbearia)}
                    rotulo="Parabenizar"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold">
              Sem vir há mais de {diasParaRetorno} dias
            </h2>
            {sumidos.length === 0 ? (
              <p className="text-text-dim text-sm py-6 text-center">
                Ninguém sumido. Sua clientela está voltando.
              </p>
            ) : (
              sumidos.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-[10px] border border-border bg-panel-2 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-text truncate">{c.nome}</p>
                    <p className="text-text-dim text-[11px]">
                      última vez há {diasDesde(c.ultimaVisita)}
                    </p>
                  </div>
                  <BotaoWhatsapp
                    telefone={c.telefone}
                    mensagem={msgRetorno(c.nome, c.diasSemVir, nomeBarbearia)}
                    rotulo="Chamar"
                  />
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {aba === "avaliar" && (
        <section className="flex flex-col gap-4">
          {media !== null && (
            <div className="panel-ink px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-text-dim">
                Nota média
              </p>
              <p className="font-mono text-[30px] text-ink-text leading-none mt-1">
                {media.toFixed(1)}
              </p>
              <p className="text-ink-text-dim text-[11.5px] mt-1.5">
                de {avaliados.length} {avaliados.length === 1 ? "avaliação" : "avaliações"}
              </p>
            </div>
          )}

          {avaliados.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold">
                O que disseram
              </h2>
              {avaliados.map((a) => (
                <div
                  key={a.id}
                  className="rounded-[10px] border border-border bg-panel-2 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-text min-w-0 truncate">
                      {a.cliente}
                    </span>
                    <span className="font-mono text-[12px] text-accent-label ml-auto shrink-0">
                      {"★".repeat(a.nota ?? 0)}
                      <span className="text-text-dim">{"★".repeat(5 - (a.nota ?? 0))}</span>
                    </span>
                  </div>
                  {a.comentario && (
                    <p className="text-text-dim text-[11.5px] mt-1 italic">
                      &ldquo;{a.comentario}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold">
              Pedir nota
            </h2>
            {!subdominio ? (
              <p className="text-text-dim text-sm">Barbearia sem endereço público.</p>
            ) : pendentes.length === 0 ? (
              <p className="text-text-dim text-sm py-6 text-center">
                Todos os atendimentos recentes já foram avaliados.
              </p>
            ) : (
              pendentes.slice(0, 15).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-[10px] border border-border bg-panel-2 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-text truncate">{a.cliente}</p>
                    <p className="text-text-dim text-[11px]">há {diasDesde(a.criadoEm)}</p>
                  </div>
                  <BotaoWhatsapp
                    telefone={a.telefone}
                    mensagem={msgAvaliacao(
                      a.cliente,
                      nomeBarbearia,
                      `${origem}/b/${subdominio}/avaliar/${a.tokenAvaliacao}`,
                    )}
                    rotulo="Pedir nota"
                  />
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
