-- Chat de suporte com IA (Fase 1): tickets abertos por dono/barbeiro,
-- histórico de mensagens, log de erros pra dar contexto real à IA (em vez
-- de só a descrição do usuário), e as inscrições de push do super-admin
-- pra avisar quando um ticket precisa de decisão manual.

create table suporte_tickets (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  aberto_por uuid not null references usuarios(id) on delete cascade,
  status text not null default 'aberto'
    check (status in ('aberto', 'aguardando_admin', 'resolvido', 'recusado', 'fechado')),
  resumo text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table suporte_mensagens (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references suporte_tickets(id) on delete cascade,
  remetente text not null check (remetente in ('usuario', 'ia', 'admin')),
  conteudo text not null,
  -- {acao: 'ajustar_comissao', params: {...}, descricao: '...'} quando a IA
  -- propõe uma ação da lista segura, antes de ser confirmada pelo usuário.
  acao_proposta jsonb,
  acao_executada boolean not null default false,
  criado_em timestamptz not null default now()
);

-- Dispositivos (navegador/celular) em que o super-admin ativou os avisos
-- push — só acessada via supabaseAdmin() no /admin, sem RLS de tenant.
create table admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  keys jsonb not null,
  criado_em timestamptz not null default now()
);

-- Log mínimo de falhas nas ações mais citadas como "trava o trabalho", pra
-- IA de suporte ter algo concreto pra investigar além da queixa do usuário.
create table logs_erro (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid references barbearias(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete set null,
  contexto text not null,
  mensagem text not null,
  criado_em timestamptz not null default now()
);

alter table suporte_tickets enable row level security;
alter table suporte_mensagens enable row level security;
alter table logs_erro enable row level security;
-- admin_push_subscriptions não tem RLS: só é tocada por supabaseAdmin()
-- (chave de serviço, ignora RLS), atrás do cookie de super-admin — igual
-- toda leitura/escrita do /admin já funciona hoje (ver src/lib/admin.ts).

-- ========== suporte_tickets ==========
create policy "select tickets do tenant" on suporte_tickets
  for select using (barbearia_id = auth_barbearia_id());

create policy "abre ticket proprio" on suporte_tickets
  for insert with check (
    barbearia_id = auth_barbearia_id() and aberto_por = auth.uid()
  );

-- Update é usado pra IA fechar/escalar o próprio ticket que ela está
-- conduzindo, e pelo usuário reabrir um ticket já fechado — sempre dentro
-- do mesmo tenant, sem distinção de papel (dono e barbeiro podem ambos
-- estar conduzindo tickets próprios).
create policy "atualiza ticket do tenant" on suporte_tickets
  for update using (barbearia_id = auth_barbearia_id());

-- ========== suporte_mensagens ==========
-- Sem barbearia_id direto — a visibilidade segue a do ticket pai, igual
-- atendimento_servicos segue atendimentos.
create policy "select mensagens do tenant" on suporte_mensagens
  for select using (
    exists (
      select 1 from suporte_tickets t
      where t.id = suporte_mensagens.ticket_id
        and t.barbearia_id = auth_barbearia_id()
    )
  );

create policy "insere mensagem no ticket do tenant" on suporte_mensagens
  for insert with check (
    exists (
      select 1 from suporte_tickets t
      where t.id = suporte_mensagens.ticket_id
        and t.barbearia_id = auth_barbearia_id()
    )
  );

-- ========== logs_erro ==========
-- Só insert pro próprio tenant registrar a falha — leitura é só via
-- supabaseAdmin() (chave de serviço) na hora de montar o contexto da IA e
-- no painel de relatórios, nunca exposta ao tenant.
create policy "tenant registra proprio erro" on logs_erro
  for insert with check (barbearia_id = auth_barbearia_id());
