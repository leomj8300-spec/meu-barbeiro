-- Registra um atendimento (serviços + consumos) e dá baixa no estoque numa
-- única transação, com lock de linha nos consumos para evitar corrida entre
-- barbeiros registrando ao mesmo tempo.
create or replace function registrar_atendimento(
  p_barbearia_id uuid,
  p_barbeiro_id uuid,
  p_cliente text,
  p_servicos jsonb, -- [{servico_id, nome, preco, comissionavel}]
  p_consumos jsonb, -- [{consumo_id, nome, preco, quantidade}]
  p_valor numeric,
  p_preco_negociado boolean,
  p_fiado boolean
) returns uuid
language plpgsql
as $$
declare
  v_atendimento_id uuid;
  v_item jsonb;
  v_estoque_atual integer;
begin
  if p_valor < 0 then
    raise exception 'valor-invalido';
  end if;

  insert into atendimentos (barbearia_id, barbeiro_id, cliente, valor, preco_negociado, pago, data_pagamento)
  values (
    p_barbearia_id, p_barbeiro_id, p_cliente, p_valor, p_preco_negociado,
    not p_fiado, case when p_fiado then null else now() end
  )
  returning id into v_atendimento_id;

  for v_item in select * from jsonb_array_elements(p_servicos) loop
    insert into atendimento_servicos (atendimento_id, servico_id, nome, preco, comissionavel)
    values (
      v_atendimento_id,
      (v_item->>'servico_id')::uuid,
      v_item->>'nome',
      (v_item->>'preco')::numeric,
      (v_item->>'comissionavel')::boolean
    );
  end loop;

  for v_item in select * from jsonb_array_elements(p_consumos) loop
    select estoque into v_estoque_atual
    from consumos
    where id = (v_item->>'consumo_id')::uuid and barbearia_id = p_barbearia_id
    for update;

    if v_estoque_atual is null then
      raise exception 'consumo-nao-encontrado:%', v_item->>'nome';
    end if;

    if v_estoque_atual < (v_item->>'quantidade')::integer then
      raise exception 'estoque-insuficiente:%', v_item->>'nome';
    end if;

    update consumos
    set estoque = estoque - (v_item->>'quantidade')::integer
    where id = (v_item->>'consumo_id')::uuid;

    insert into atendimento_consumos (atendimento_id, consumo_id, nome, preco, quantidade)
    values (
      v_atendimento_id,
      (v_item->>'consumo_id')::uuid,
      v_item->>'nome',
      (v_item->>'preco')::numeric,
      (v_item->>'quantidade')::integer
    );
  end loop;

  return v_atendimento_id;
end;
$$;

-- Exclui um atendimento e devolve os consumos usados ao estoque.
create or replace function excluir_atendimento(p_atendimento_id uuid, p_barbearia_id uuid)
returns void
language plpgsql
as $$
declare
  v_item record;
begin
  for v_item in
    select consumo_id, quantidade from atendimento_consumos where atendimento_id = p_atendimento_id
  loop
    update consumos set estoque = estoque + v_item.quantidade
    where id = v_item.consumo_id and barbearia_id = p_barbearia_id;
  end loop;

  delete from atendimentos where id = p_atendimento_id and barbearia_id = p_barbearia_id;
end;
$$;
