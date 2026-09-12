"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  atualizarClienteAction,
  criarClienteAction,
  excluirClienteAction,
  type ClienteInput,
} from "@/app/actions/clientes";
import { IconSearch } from "@/components/icons";
import { fmtMoeda as fmt, fmtData, diasDesde } from "@/lib/formato";
import type { Cliente, ClienteComResumo } from "@/lib/queries";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const letras =
    partes.length > 1 ? [partes[0][0], partes[partes.length - 1][0]] : [partes[0]?.[0] ?? ""];
  return letras.join("").toUpperCase();
}

/** "25/03" a partir de "1990-03-25" — o ano não interessa no balcão. */
function diaEMes(aniversario: string) {
  return `${aniversario.slice(8, 10)}/${aniversario.slice(5, 7)}`;
}

function ultimaVez(iso: string) {
  const quando = diasDesde(iso);
  return quando === "hoje" ? "veio hoje" : `há ${quando}`;
}

export function ClientesView({
  clientes,
  aniversariantes,
  ehDono,
}: {
  clientes: ClienteComResumo[];
  aniversariantes: Cliente[];
  ehDono: boolean;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const mesAtual = MESES[new Date().getMonth()];

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        (c.telefone ?? "").replace(/\D/g, "").includes(termo.replace(/\D/g, "")),
    );
  }, [clientes, busca]);

  function excluir(id: string, nome: string) {
    if (!confirm(`Excluir a ficha de ${nome}? O histórico de atendimentos continua.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await excluirClienteAction(id);
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
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-text-dim">
          Na carteira
        </p>
        <p className="font-mono text-[30px] text-ink-text leading-none mt-1">{clientes.length}</p>
        <p className="text-ink-text-dim text-[11.5px] mt-1.5">
          {clientes.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
        </p>
      </div>

      {aniversariantes.length > 0 && (
        <section className="panel p-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3">
            Aniversariantes de {mesAtual}
          </h2>
          <div className="flex flex-col gap-1.5">
            {aniversariantes.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-[10px] border border-border bg-panel-2 px-2.5 py-2"
              >
                <span className="font-mono text-[11px] text-warn shrink-0">
                  {diaEMes(c.aniversario!)}
                </span>
                <span className="text-[13.5px] font-semibold text-text min-w-0 truncate">
                  {c.nome}
                </span>
                {c.telefone && (
                  <span className="font-mono text-[11px] text-text-dim ml-auto shrink-0">
                    {c.telefone}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setCriando((v) => !v);
            setEditando(null);
          }}
          disabled={pending}
          className="btn-primary shrink-0"
        >
          {criando ? "Fechar" : "Novo cliente"}
        </button>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-panel h-8 px-3 ml-auto min-w-0">
          <IconSearch className="w-3.5 h-3.5 text-text-dim shrink-0" />
          <input
            type="text"
            placeholder="Buscar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="bg-transparent text-[13px] text-text placeholder:text-text-dim focus:outline-none w-full min-w-0"
          />
        </div>
      </div>

      {criando && (
        <ClienteForm
          onCancel={() => setCriando(false)}
          onError={setError}
          onSaved={() => {
            setCriando(false);
            router.refresh();
          }}
          salvar={(dados) => criarClienteAction(dados)}
        />
      )}

      <div className="flex flex-col gap-2">
        {filtrados.length === 0 && (
          <p className="text-text-dim text-sm text-center py-8">
            {clientes.length === 0
              ? "Nenhum cliente cadastrado ainda."
              : "Nenhum cliente encontrado."}
          </p>
        )}
        {filtrados.map((c) =>
          editando === c.id ? (
            <ClienteForm
              key={c.id}
              cliente={c}
              onCancel={() => setEditando(null)}
              onError={setError}
              onSaved={() => {
                setEditando(null);
                router.refresh();
              }}
              salvar={(dados) => atualizarClienteAction({ ...dados, id: c.id })}
            />
          ) : (
            <div key={c.id} className="panel px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-panel-2 border border-border flex items-center justify-center font-mono text-[11px] text-text-dim shrink-0">
                  {iniciais(c.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-text truncate">{c.nome}</p>
                  <p className="text-text-dim text-[11px]">
                    {c.visitas === 0
                      ? "Nunca atendido"
                      : `${c.visitas} ${c.visitas === 1 ? "visita" : "visitas"} · ${fmt(c.totalGasto)}`}
                    {c.ultimaVisita && ` · ${ultimaVez(c.ultimaVisita)}`}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(c.id);
                      setCriando(false);
                    }}
                    className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-accent hover:text-accent-label"
                  >
                    Editar
                  </button>
                  {ehDono && (
                    <button
                      type="button"
                      onClick={() => excluir(c.id, c.nome)}
                      disabled={pending}
                      className="rounded-[10px] border border-border bg-panel text-text-dim text-[11px] font-semibold px-2 py-1 hover:border-danger hover:text-danger"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
              {(c.telefone || c.aniversario || c.observacao) && (
                <p className="text-text-dim text-[11px] mt-1.5 pl-11.5">
                  {[
                    c.telefone,
                    c.aniversario && `aniversário ${diaEMes(c.aniversario)}`,
                    c.observacao,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function ClienteForm({
  cliente,
  salvar,
  onSaved,
  onCancel,
  onError,
}: {
  cliente?: Cliente;
  salvar: (dados: ClienteInput) => Promise<{ error: string | null }>;
  onSaved: () => void;
  onCancel: () => void;
  onError: (msg: string | null) => void;
}) {
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");
  const [aniversario, setAniversario] = useState(cliente?.aniversario ?? "");
  const [observacao, setObservacao] = useState(cliente?.observacao ?? "");
  const [pending, startTransition] = useTransition();

  function enviar() {
    onError(null);
    if (!nome.trim()) {
      onError("Informe o nome do cliente.");
      return;
    }
    startTransition(async () => {
      const res = await salvar({
        nome: nome.trim(),
        telefone: telefone.trim() || undefined,
        aniversario: aniversario || undefined,
        observacao: observacao.trim() || undefined,
      });
      if (res.error) onError(res.error);
      else onSaved();
    });
  }

  return (
    <section className="panel p-4 flex flex-col gap-2.5 border-accent-border">
      <input
        type="text"
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <input
          type="tel"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="flex-1 bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
        />
        <div className="flex-1">
          <input
            type="date"
            title="Aniversário"
            value={aniversario}
            onChange={(e) => setAniversario(e.target.value)}
            className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
          />
        </div>
      </div>
      <input
        type="text"
        placeholder="Observação (ex: máquina 2 dos lados)"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        className="w-full bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={enviar}
          disabled={pending}
          className="btn-primary flex-1 justify-center"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[10px] border border-border bg-panel-2 text-text-dim text-xs font-semibold px-3.5 py-2 hover:text-text"
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}
