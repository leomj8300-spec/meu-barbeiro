"use client";

import { useState, useTransition } from "react";
import { criarBarbeariaAction } from "@/app/actions/admin";

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CriarBarbeariaForm() {
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [subdominio, setSubdominio] = useState("");
  const [subdominioEditado, setSubdominioEditado] = useState(false);
  const [nomeDono, setNomeDono] = useState("");
  const [emailDono, setEmailDono] = useState("");
  const [senhaDono, setSenhaDono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [criada, setCriada] = useState<{ subdominio: string; emailDono: string; senhaDono: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function handleNomeChange(v: string) {
    setNomeBarbearia(v);
    if (!subdominioEditado) setSubdominio(slugify(v));
  }

  function criar() {
    setError(null);
    setCriada(null);
    startTransition(async () => {
      const res = await criarBarbeariaAction({ nomeBarbearia, subdominio, nomeDono, emailDono, senhaDono });
      if (res.error) {
        setError(res.error);
      } else {
        setCriada({ subdominio, emailDono, senhaDono });
        setNomeBarbearia("");
        setSubdominio("");
        setSubdominioEditado(false);
        setNomeDono("");
        setEmailDono("");
        setSenhaDono("");
      }
    });
  }

  return (
    <section className="panel p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim font-semibold mb-3.5">
        Nova barbearia
      </h2>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger text-xs px-2.5 py-2 mb-3 rounded-[10px]">
          {error}
        </div>
      )}

      {criada && (
        <div className="rounded-[10px] border border-cons bg-cons/10 text-cons text-xs px-3 py-2.5 mb-3 flex flex-col gap-1">
          <span className="font-semibold">Barbearia criada.</span>
          <span className="font-mono">/b/{criada.subdominio}/login</span>
          <span>
            {criada.emailDono} · {criada.senhaDono}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          placeholder="Nome da barbearia"
          value={nomeBarbearia}
          onChange={(e) => handleNomeChange(e.target.value)}
          className="bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
        />
        <input
          type="text"
          placeholder="identificador-da-barbearia"
          value={subdominio}
          onChange={(e) => {
            setSubdominio(slugify(e.target.value));
            setSubdominioEditado(true);
          }}
          className="bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] font-mono focus:outline-none focus:border-accent"
        />
      </div>

      <div className="border-t border-border pt-3 flex flex-col gap-2">
        <p className="text-xs text-text-dim">Dono</p>
        <input
          type="text"
          placeholder="Nome"
          value={nomeDono}
          onChange={(e) => setNomeDono(e.target.value)}
          className="bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
        />
        <input
          type="email"
          placeholder="E-mail"
          value={emailDono}
          onChange={(e) => setEmailDono(e.target.value)}
          className="bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
        />
        <input
          type="text"
          placeholder="Senha provisória (mín. 6 caracteres)"
          value={senhaDono}
          onChange={(e) => setSenhaDono(e.target.value)}
          className="bg-panel-2 border border-border rounded-[10px] text-text px-2.5 py-2 text-[13.5px] focus:outline-none focus:border-accent"
        />
        <button type="button" onClick={criar} disabled={pending} className="btn-primary w-full py-2.5">
          {pending ? "Criando..." : "Criar barbearia"}
        </button>
      </div>
    </section>
  );
}
