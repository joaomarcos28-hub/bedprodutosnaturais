create or replace function public.delete_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
begin
  if not public.has_role(auth.uid(), 'owner') then
    raise exception 'Somente o dono pode excluir vendas.';
  end if;
  select seller_id into v_seller from public.sales where id = p_sale_id;
  if v_seller is null then
    raise exception 'Venda não encontrada.';
  end if;
  -- devolve os produtos ao estoque do vendedor
  update public.seller_stock ss
     set quantity = ss.quantity + si.quantity
    from public.sale_items si
   where si.sale_id = p_sale_id
     and si.product_id = ss.product_id
     and ss.seller_id = v_seller;
  delete from public.sales where id = p_sale_id;
end;
$$;
revoke all on function public.delete_sale(uuid) from public, anon;
grant execute on function public.delete_sale(uuid) to authenticated;