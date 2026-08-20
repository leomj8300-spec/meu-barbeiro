-- Configuração de funcionalidades por barbearia (feature flags do tenant).
-- Uma linha por barbearia. Ausência de linha = barbearia ainda não passou
-- pelo onboarding.
create table barbearia_configuracoes (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null unique references barbearias(id) on delete cascade,
  fiado_habilitado boolean not null default true,
  caixinha_habilitada boolean not null default true,
  comissao_habilitada boolean not null default false,
  comissao_padrao_pct numeric(5,2) not null default 0 check (comissao_padrao_pct >= 0 and comissao_padrao_pct <= 100),
  controle_estoque_habilitado boolean not null default true,
  gestao_equipe_habilitada boolean not null default false,
  periodicidade_fechamento text not null default 'semanal'
    check (periodicidade_fechamento in ('semanal', 'quinzenal', 'mensal')),
  -- dia da semana (1=segunda..7=domingo) para semanal/quinzenal, ou dia do mês (1-31) para mensal
  dia_inicio_periodo integer not null default 1 check (dia_inicio_periodo >= 1 and dia_inicio_periodo <= 31),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index barbearia_configuracoes_barbearia_id_idx on barbearia_configuracoes(barbearia_id);

create or replace function set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger trg_barbearia_configuracoes_atualizado_em
before update on barbearia_configuracoes
for each row execute function set_atualizado_em();

alter table barbearia_configuracoes enable row level security;
