"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  criarAgendamentoAction,
  encaixarAgoraAction,
  mudarStatusAgendamentoAction,
} from "@/app/actions/agendamentos";
import { fmtHora, fmtMoeda as fmt, rotuloDia, chaveDia } from "@/lib/formato";
import type { Agendamento, Servico, StatusAgendamento } from "@/lib/queries";
import type { BarbeariaConfiguracoes } from "@/lib/types";

const SELO: Record<StatusAgendamento, { texto: string; classe: string }> = {
  marcado: { texto: "Marcado", classe: "bg-warn/15 text-warn" },
  atendido: { texto: "Atendido", classe: "bg-cons/15 text-cons" },
  cancelado: { texto: "Cancelado", classe: "bg-danger/15 text-danger" },
  faltou: { texto: "Faltou", classe: "bg-danger/15 text-danger" },
};

function somarDias(chave: string, dias: number) {
  const [ano, mes, dia] = chave.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function fmtDuracao(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function AgendaDoDia({
  dia,
  agendamentos,
  servicos,
  atendentes,
  usuarioId,
  config,
  nomesDeClientes,
}: {
  dia: string;
  agendamentos: Agendamento[];
  servicos: Servico[];
  atendentes: { id: string; nome: string }[];
  usuarioId: string;
  config: BarbeariaConfiguracoes;
  nomesDeClientes: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [marcando, setMarcando] = useState(false);
  const [pending, startTransition] = useTransition();

  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [hora, setHora] = useState(config.horaAbertura);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [barbeiroId, setBarbeiroId] = useState(usuarioId);
  const [observacao, setObservacao] = useState("");

  const escolhidos = servicos.filter((s) => selecionados.has(s.id));
  const duracaoPrevista = escolhidos.reduce((soma, s) => soma + s.duracaoMin, 0);
  const valorPrevisto = escolhidos.reduce((soma, s) => soma + s.preco, 0);

  const ativos = useMemo(
    () => agendamentos.filter((a) => a.status === "marcado" || a.status === "atendido"),
    [agendamentos],
  );
  const totalPrevisto = useMemo(
    () =>
      ativos.reduce(
        (soma, a) => soma + a.servicos.reduce((s, sv) => s + sv.preco, 0),
        0,
      ),
    [ativos],
  );

  const ehHoje = dia === chaveDia(new Date());

  function irPara(novoDia: string) {
    router.push(`/agenda?dia=${novoDia}`);
  }

  function alternarServico(id: string) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  function limparForm() {
    setCliente("");
    setTelefone("");
    setHora(config.horaAbertura);
    setSelecionados(new Set());
    setBarbeiroId(usuarioId);
    setObservacao("");
    setMarcando(false);
  }

  function marcar() {
    setError(null);
    startTransition(async () => {
      const res = await criarAgendamentoAction({
        cliente: cliente.trim(),
        telefone: telefone.trim() || undefined,
        dia,
        hora,
        servicoIds: [...selecionados],
        barbeiroId: atendentes.length > 0 ? barbeiroId : undefined,
        observacao: observacao.trim() || undefined,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      limparForm();
      router.refresh();
    });
  }

  function encaixar() {
    setError(null);
    const nome = prompt("Nome de quem chegou agora:");
    if (!nome?.trim()) return;
    if (servicos.length === 0) {
      setError("Cadastre um serviço antes.");
      return;
    }
    startTransition(async () => {
      const res = await encaixarAgoraAction(nome.trim(), [servicos[0].id]);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.id) router.push(`/atendimento?agendamento=${res.id}`);
    });
  }

  function mudarStatus(id: string, status: "cancelado" | "faltou") {
    const pergunta =
      status === "cancelado" ? "Cancelar esse horário?" : "Marcar que o cliente faltou?";
    if (!confirm(pergunta)) return;
    setError(null);
    startTransition(async () => {
      const res = await mudarStatusAgendamentoAction({ id, status });
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 rounded-[10px]">
          {error}
        </div>
      )}

      <div className="panel-ink px-4 py-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            type="button"
            onClick={() => irPara(somarDias(dia, -1))}
            aria-label="Dia anterior"
            className="rounded-[10px] border border-white/15 text-ink-text-dim text-xs font-semibold px-2.5 py-1 hover:text-ink-text"
          >
            ◀
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-text-dim">
            {rotuloDia(`${dia}T12:00:00-03:00`)}
          </span>
          <button
            type="button"
            onClick={() => irPara(somarDias(dia, 1))}
            aria-label="Próximo dia"
            className="rounded-[10px] border border-white/15 text-ink-text-dim text-xs font-semibold px-2.5 py-1 hover:text-ink-text"
          >
            ▶
          </button>
        </div>
        <p className="font-mono text-[30px] text-ink-text leading-none">{fmt(totalPrevisto)}</p>
        <p className="text-ink-text-dim text-[11.5px] mt-1.5">
          {ativos.length === 0
            ? "Nenhum cliente marcado"
            : `${ativos.length} ${ativos.length === 1 ? "cliente marcado" : "clientes marcados"}`}
        </p>
        {!ehHoje && (
          <button
            type="button"
            onClick={() => irPara(chaveDia(new Date()))}
            className="mt-3 rounded-[10px] border border-white/15 text-ink-text-dim text-[11px] font-semibold px-2.5 py-1 hover:text-ink-text"
          >
            Voltar pra hoje
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMarcando((v) => !v)}
          disabled={pending}
          className="btn-primary flex-1 justify-center"
        >
          {marcando ? "Fechar" : "Marcar horário"}
        </button>
        {ehHoje && (
          <button
            type="button"
            onClick={encaixar}
            disabled={pending}
            className="btn-ghost shrink-0"
            title="Cliente chegou sem marcar"
          >
            Encaixar agora
          </button>
        )}
      </div>

      {marcando && (
        <section className="panel p-4 flex flex-col gap-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold">
            Novo horário · {rotuloDia(`${dia}T12:00:00-03:00`)}
          </h2>

          <input
            type="text"
            placeholder="Nome do cliente"
            list="clientes-da-agenda"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
          {/* Reconhece quem já é da casa em vez de abrir ficha nova. */}
          <datalist id="clientes-da-agenda">
            {nomesDeClientes.map((nome) => (
              <option key={nome} value={nome} />
            ))}
          </datalist>

          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="Telefone (opcional)"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="flex-1 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
            />
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-28 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
            />
          </div>

          {atendentes.length > 0 && (
            <select
              value={barbeiroId}
              onChange={(e) => setBarbeiroId(e.target.value)}
              className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
            >
              {atendentes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          )}

          <div>
            <p className="text-xs text-text-dim mb-2">Serviços</p>
            {servicos.length === 0 ? (
              <p className="text-text-dim text-xs">Nenhum serviço cadastrado.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {servicos.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => alternarServico(s.id)}
                    aria-pressed={selecionados.has(s.id)}
                    className={`chip ${selecionados.has(s.id) ? "chip-on" : "chip-off"}`}
                  >
                    {s.nome} · {fmtDuracao(s.duracaoMin)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Observação (opcional)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />

          {duracaoPrevista > 0 && (
            <p className="text-text-dim text-[11.5px]">
              Ocupa {fmtDuracao(duracaoPrevista)} · {fmt(valorPrevisto)}
            </p>
          )}

          <button
            type="button"
            onClick={marcar}
            disabled={pending || !cliente.trim() || selecionados.size === 0}
            className="btn-primary w-full justify-center py-3"
          >
            {pending ? "Marcando..." : "Marcar"}
          </button>
        </section>
      )}

      <div className="flex flex-col gap-2">
        {agendamentos.length === 0 && (
          <p className="text-text-dim text-sm text-center py-8">
            Nenhum horário marcado nesse dia.
          </p>
        )}
        {agendamentos.map((a) => {
          const selo = SELO[a.status];
          const valor = a.servicos.reduce((s, sv) => s + sv.preco, 0);
          const riscado = a.status === "cancelado" || a.status === "faltou";
          return (
            <div
              key={a.id}
              className={`rounded-[10px] border border-border bg-panel-2 px-3 py-2.5 ${
                riscado ? "opacity-55" : ""
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[13px] text-text font-semibold shrink-0">
                  {fmtHora(a.inicio)}
                </span>
                <span className="text-[13.5px] font-semibold text-text min-w-0 truncate">
                  {a.cliente}
                </span>
                <span
                  className={`rounded-full text-[9.5px] font-bold uppercase px-1.5 py-0.5 ${selo.classe}`}
                >
                  {selo.texto}
                </span>
                <span className="font-mono text-sm font-bold text-accent-label ml-auto shrink-0">
                  {fmt(valor)}
                </span>
              </div>

              <p className="text-text-dim text-[11px] mt-1">
                {fmtDuracao(a.duracaoMin)}
                {a.servicos.length > 0 && ` · ${a.servicos.map((s) => s.nome).join(", ")}`}
                {atendentes.length > 0 && ` · ${a.barbeiroNome}`}
                {a.telefone && ` · ${a.telefone}`}
              </p>
              {a.observacao && (
                <p className="text-text-dim text-[11px] mt-0.5 italic">{a.observacao}</p>
              )}

              {a.status === "marcado" && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/atendimento?agendamento=${a.id}`)}
                    disabled={pending}
                    className="btn-primary !py-1.5 !px-3 text-[11px]"
                  >
                    Atender
                  </button>
                  <button
                    type="button"
                    onClick={() => mudarStatus(a.id, "faltou")}
                    disabled={pending}
                    className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-danger hover:text-danger"
                  >
                    Faltou
                  </button>
                  <button
                    type="button"
                    onClick={() => mudarStatus(a.id, "cancelado")}
                    disabled={pending}
                    className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-danger hover:text-danger"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
