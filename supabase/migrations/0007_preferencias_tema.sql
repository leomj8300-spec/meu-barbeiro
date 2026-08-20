-- Preferências de tema por usuário (não por barbearia): cada Dono/Barbeiro
-- escolhe sua própria cor de destaque e seu próprio modo claro/escuro/sistema,
-- independente dos outros da mesma barbearia. Por isso vive em usuarios, e
-- não em barbearia_configuracoes (que é só feature flag de negócio, por tenant).

alter table usuarios
  add column tema_cor text not null default 'neutro'
    check (tema_cor in ('neutro', 'laranja', 'vermelho', 'azul', 'verde', 'roxo', 'dourado', 'rosa')),
  add column tema_modo text not null default 'sistema'
    check (tema_modo in ('claro', 'escuro', 'sistema'));

-- usuarios ainda não tinha nenhuma policy de update pro próprio usuário (só
-- "dono edita barbeiro", que não cobre o dono editando a si mesmo nem o
-- barbeiro editando a si mesmo). Igual ao precedente em "tenant ajusta
-- estoque" (0006_rls_policies.sql): a policy garante isolamento por usuário,
-- não a distinção fina de campo — quem restringe tema_cor/tema_modo como os
-- únicos campos alteráveis é a server action, não o RLS.
create policy "usuario atualiza proprio tema" on usuarios
  for update using (id = auth.uid())
  with check (id = auth.uid());
