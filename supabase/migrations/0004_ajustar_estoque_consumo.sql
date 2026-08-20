-- Ajusta o estoque de um consumo por delta (reposição = positivo, baixa
-- manual = negativo), nunca sobrescrevendo o valor direto. Lock de linha
-- evita corrida com registros de atendimento acontecendo ao mesmo tempo.
create or replace function ajustar_estoque_consumo(
  p_consumo_id uuid,
  p_barbearia_id uuid,
  p_delta integer
) returns integer
language plpgsql
as $$
declare
  v_estoque_atual integer;
  v_novo integer;
begin
  select estoque into v_estoque_atual
  from consumos
  where id = p_consumo_id and barbearia_id = p_barbearia_id
  for update;

  if v_estoque_atual is null then
    raise exception 'consumo-nao-encontrado';
  end if;

  v_novo := v_estoque_atual + p_delta;
  if v_novo < 0 then
    raise exception 'estoque-insuficiente';
  end if;

  update consumos set estoque = v_novo where id = p_consumo_id;
  return v_novo;
end;
$$;
