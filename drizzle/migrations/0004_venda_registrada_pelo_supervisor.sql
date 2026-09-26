ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS registered_by uuid;

CREATE OR REPLACE FUNCTION public.register_sale_for_seller(p_seller_id uuid, p_total numeric, p_payment text, p_photo text DEFAULT NULL, p_customer text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare v_id uuid; v_campaign public.campaigns%rowtype;
begin
  if not (public.has_role(auth.uid(), 'owner') or public.is_team_supervisor(auth.uid(), p_seller_id)) then
    raise exception 'Sem permissao para registrar venda deste vendedor';
  end if;
  if p_total is null or p_total <= 0 then raise exception 'Informe o valor da venda'; end if;
  if p_payment not in ('pix','dinheiro','prazo') then raise exception 'Forma de pagamento invalida'; end if;

  select * into v_campaign from public.campaigns
  where status = 'ativa' and current_date between start_date and end_date
  order by start_date desc limit 1;

  insert into public.sales (seller_id, customer_name, payment_method, total, campaign_id, day_number, photo_url, registered_by)
  values (p_seller_id, p_customer, p_payment, p_total, v_campaign.id,
    case when v_campaign.id is null then null else (current_date - v_campaign.start_date)::int + 1 end,
    p_photo, auth.uid())
  returning id into v_id;
  return v_id;
end $$;

REVOKE EXECUTE ON FUNCTION public.register_sale_for_seller(uuid, numeric, text, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.register_sale_for_seller(uuid, numeric, text, text, text) TO authenticated;