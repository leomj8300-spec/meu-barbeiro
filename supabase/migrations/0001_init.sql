-- Extensão para gen_random_uuid()
create extension if not exists pgcrypto;

-- ========== barbearias (tenants) ==========
create table barbearias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  subdominio text not null unique,
  criado_em timestamptz not null default now()
);

-- ========== usuarios ==========
create table usuarios (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  nome text not null,
  email text not null,
  senha_hash text not null,
  papel text not null check (papel in ('dono', 'barbeiro')),
  comissao_padrao numeric(5,2) not null default 0 check (comissao_padrao >= 0 and comissao_padrao <= 100),
  criado_em timestamptz not null default now(),
  unique (barbearia_id, email)
);

create index usuarios_barbearia_id_idx on usuarios(barbearia_id);

-- ========== servicos ==========
create table servicos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  nome text not null,
  preco numeric(10,2) not null check (preco >= 0),
  comissionavel boolean not null default true,
  criado_em timestamptz not null default now()
);

create index servicos_barbearia_id_idx on servicos(barbearia_id);

-- ========== consumos (estoque) ==========
create table consumos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  nome text not null,
  preco numeric(10,2) not null check (preco >= 0),
  estoque integer not null default 0 check (estoque >= 0),
  criado_em timestamptz not null default now()
);

create index consumos_barbearia_id_idx on consumos(barbearia_id);

-- ========== atendimentos ==========
create table atendimentos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  barbeiro_id uuid not null references usuarios(id) on delete restrict,
  cliente text not null,
  valor numeric(10,2) not null check (valor >= 0),
  preco_negociado boolean not null default false,
  pago boolean not null default true,
  data_pagamento timestamptz,
  criado_em timestamptz not null default now()
);

create index atendimentos_barbearia_id_idx on atendimentos(barbearia_id);
create index atendimentos_barbeiro_id_idx on atendimentos(barbeiro_id);
create index atendimentos_pago_idx on atendimentos(barbearia_id, pago);

-- itens de serviço por atendimento (preço travado no momento do registro)
create table atendimento_servicos (
  id uuid primary key default gen_random_uuid(),
  atendimento_id uuid not null references atendimentos(id) on delete cascade,
  servico_id uuid not null references servicos(id) on delete restrict,
  nome text not null,
  preco numeric(10,2) not null,
  comissionavel boolean not null
);

create index atendimento_servicos_atendimento_id_idx on atendimento_servicos(atendimento_id);

-- itens de consumo por atendimento (preço e quantidade travados no momento do registro)
create table atendimento_consumos (
  id uuid primary key default gen_random_uuid(),
  atendimento_id uuid not null references atendimentos(id) on delete cascade,
  consumo_id uuid not null references consumos(id) on delete restrict,
  nome text not null,
  preco numeric(10,2) not null,
  quantidade integer not null check (quantidade > 0)
);

create index atendimento_consumos_atendimento_id_idx on atendimento_consumos(atendimento_id);

-- ========== caixinhas (gorjetas, individual por barbeiro) ==========
create table caixinhas (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  barbeiro_id uuid not null references usuarios(id) on delete cascade,
  valor numeric(10,2) not null check (valor > 0),
  criado_em timestamptz not null default now()
);

create index caixinhas_barbearia_id_idx on caixinhas(barbearia_id);
create index caixinhas_barbeiro_id_idx on caixinhas(barbeiro_id);

-- ========== fechamentos_semanais ==========
create table fechamentos_semanais (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  semana_inicio date not null,
  semana_fim date not null,
  totais jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index fechamentos_semanais_barbearia_id_idx on fechamentos_semanais(barbearia_id);

-- ========== RLS ==========
-- Todo acesso ao banco passa pelo backend Next.js (Auth.js + service role key),
-- que aplica o escopo por barbearia_id na query. RLS habilitado como defesa em
-- profundidade contra uso indevido do anon key; sem policies de anon/authenticated,
-- nega tudo que não vier pela service role.
alter table barbearias enable row level security;
alter table usuarios enable row level security;
alter table servicos enable row level security;
alter table consumos enable row level security;
alter table atendimentos enable row level security;
alter table atendimento_servicos enable row level security;
alter table atendimento_consumos enable row level security;
alter table caixinhas enable row level security;
alter table fechamentos_semanais enable row level security;
