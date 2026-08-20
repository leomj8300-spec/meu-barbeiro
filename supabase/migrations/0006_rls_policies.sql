-- Políticas de RLS reais, como segunda camada de defesa independente do
-- filtro por barbearia_id já aplicado em toda query no código Next.js.
--
-- Continuam existindo dois caminhos de acesso ao banco:
--   1) service_role (chave secreta) — usada só no login (authorize() em
--      src/auth.ts), antes de existir uma sessão. Ignora RLS por design do
--      Supabase; não há política que mude isso.
--   2) chave publicável + JWT próprio assinado pelo Auth.js (ver
--      src/lib/supabase/scoped.ts) — usada em toda leitura/escrita depois do
--      login. É nesse caminho que as políticas abaixo passam a valer de
--      verdade, com base nas claims barbearia_id/papel do token e em
--      auth.uid() (= id do usuário).
--
-- Ideia geral: mesmo que uma query no código esqueça o .eq("barbearia_id",
-- ...), o Postgres já bloqueia sozinho.

create or replace function auth_barbearia_id() returns uuid
language sql stable
as $$
  select nullif(auth.jwt() ->> 'barbearia_id', '')::uuid
$$;

create or replace function auth_papel() returns text
language sql stable
as $$
  select auth.jwt() ->> 'papel'
$$;

-- ========== barbearias ==========
create policy "select propria barbearia" on barbearias
  for select using (id = auth_barbearia_id());

-- ========== usuarios ==========
-- Leitura liberada pro tenant inteiro (comissão precisa ler nome/comissão de
-- todo mundo, inclusive pro barbeiro ver o próprio relatório). Escrita só
-- pelo dono, e só sobre linhas de barbeiro (nunca sobre outro dono).
create policy "select usuarios do tenant" on usuarios
  for select using (barbearia_id = auth_barbearia_id());

create policy "dono cria barbeiro" on usuarios
  for insert with check (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono' and papel = 'barbeiro'
  );

create policy "dono edita barbeiro" on usuarios
  for update using (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono' and papel = 'barbeiro'
  );

create policy "dono remove barbeiro" on usuarios
  for delete using (
    barbearia_id = auth_barbearia_id() and auth_papel() = 'dono' and papel = 'barbeiro'
  );

-- ========== barbearia_configuracoes ==========
create policy "select config do tenant" on barbearia_configuracoes
  for select using (barbearia_id = auth_barbearia_id());

create policy "dono cria config" on barbearia_configuracoes
  for insert with check (barbearia_id = auth_barbearia_id() and auth_papel() = 'dono');

create policy "dono edita config" on barbearia_configuracoes
  for update using (barbearia_id = auth_barbearia_id() and auth_papel() = 'dono');

-- ========== servicos ==========
create policy "select servicos do tenant" on servicos
  for select using (barbearia_id = auth_barbearia_id());

create policy "dono cria servico" on servicos
  for insert with check (barbearia_id = auth_barbearia_id() and auth_papel() = 'dono');

create policy "dono edita servico" on servicos
  for update using (barbearia_id = auth_barbearia_id() and auth_papel() = 'dono');

create policy "dono remove servico" on servicos
  for delete using (barbearia_id = auth_barbearia_id() and auth_papel() = 'dono');

-- ========== consumos ==========
-- Update fica liberado pro tenant inteiro (não só dono): é o que a RPC
-- registrar_atendimento usa pra dar baixa de estoque quando um barbeiro
-- registra um atendimento com consumo. Nome/preço/estoque manual continuam
-- restritos ao dono só pelo código do app (catalogo.ts) — RLS aqui garante
-- o isolamento por tenant, não a distinção fina de campo.
create policy "select consumos do tenant" on consumos
  for select using (barbearia_id = auth_barbearia_id());

create policy "dono cria consumo" on consumos
  for insert with check (barbearia_id = auth_barbearia_id() and auth_papel() = 'dono');

create policy "tenant ajusta estoque" on consumos
  for update using (barbearia_id = auth_barbearia_id());

create policy "dono remove consumo" on consumos
  for delete using (barbearia_id = auth_barbearia_id() and auth_papel() = 'dono');

-- ========== atendimentos ==========
-- Dono vê/edita tudo do tenant; barbeiro só o que ele mesmo registrou.
create policy "select atendimentos" on atendimentos
  for select using (
    barbearia_id = auth_barbearia_id()
    and (auth_papel() = 'dono' or barbeiro_id = auth.uid())
  );

create policy "insere atendimento proprio" on atendimentos
  for insert with check (
    barbearia_id = auth_barbearia_id() and barbeiro_id = auth.uid()
  );

create policy "atualiza atendimento" on atendimentos
  for update using (
    barbearia_id = auth_barbearia_id()
    and (auth_papel() = 'dono' or barbeiro_id = auth.uid())
  );

create policy "remove atendimento" on atendimentos
  for delete using (
    barbearia_id = auth_barbearia_id()
    and (auth_papel() = 'dono' or barbeiro_id = auth.uid())
  );

-- ========== atendimento_servicos / atendimento_consumos ==========
-- Sem barbearia_id direto — a visibilidade segue a do atendimento pai.
create policy "select itens servico" on atendimento_servicos
  for select using (
    exists (
      select 1 from atendimentos a
      where a.id = atendimento_servicos.atendimento_id
        and a.barbearia_id = auth_barbearia_id()
        and (auth_papel() = 'dono' or a.barbeiro_id = auth.uid())
    )
  );

create policy "insere itens servico" on atendimento_servicos
  for insert with check (
    exists (
      select 1 from atendimentos a
      where a.id = atendimento_servicos.atendimento_id
        and a.barbearia_id = auth_barbearia_id()
        and a.barbeiro_id = auth.uid()
    )
  );

create policy "select itens consumo" on atendimento_consumos
  for select using (
    exists (
      select 1 from atendimentos a
      where a.id = atendimento_consumos.atendimento_id
        and a.barbearia_id = auth_barbearia_id()
        and (auth_papel() = 'dono' or a.barbeiro_id = auth.uid())
    )
  );

create policy "insere itens consumo" on atendimento_consumos
  for insert with check (
    exists (
      select 1 from atendimentos a
      where a.id = atendimento_consumos.atendimento_id
        and a.barbearia_id = auth_barbearia_id()
        and a.barbeiro_id = auth.uid()
    )
  );

-- ========== caixinhas ==========
create policy "select caixinhas" on caixinhas
  for select using (
    barbearia_id = auth_barbearia_id()
    and (auth_papel() = 'dono' or barbeiro_id = auth.uid())
  );

create policy "insere caixinha propria" on caixinhas
  for insert with check (
    barbearia_id = auth_barbearia_id() and barbeiro_id = auth.uid()
  );

create policy "remove caixinha" on caixinhas
  for delete using (
    barbearia_id = auth_barbearia_id()
    and (auth_papel() = 'dono' or barbeiro_id = auth.uid())
  );

-- ========== fechamentos_semanais ==========
create policy "select fechamentos" on fechamentos_semanais
  for select using (barbearia_id = auth_barbearia_id() and auth_papel() = 'dono');

create policy "dono fecha periodo" on fechamentos_semanais
  for insert with check (barbearia_id = auth_barbearia_id() and auth_papel() = 'dono');
