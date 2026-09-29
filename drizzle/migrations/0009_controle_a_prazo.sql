ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE OR REPLACE FUNCTION public.can_manage_sale(p_sale_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sales s WHERE s.id = p_sale_id AND (
      s.seller_id = auth.uid() OR public.has_role(auth.uid(), 'owner')
      OR public.is_team_supervisor(auth.uid(), s.seller_id))
  )
$$;

CREATE OR REPLACE FUNCTION public.set_sale_due_date(p_sale_id uuid, p_due date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_manage_sale(p_sale_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  UPDATE public.sales SET due_date = p_due WHERE id = p_sale_id AND payment_method = 'prazo';
END $$;

CREATE OR REPLACE FUNCTION public.mark_sale_paid(p_sale_id uuid, p_paid boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_manage_sale(p_sale_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  UPDATE public.sales SET paid_at = CASE WHEN p_paid THEN now() ELSE NULL END
  WHERE id = p_sale_id AND payment_method = 'prazo';
END $$;

REVOKE ALL ON FUNCTION public.can_manage_sale(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.set_sale_due_date(uuid, date) FROM public, anon;
REVOKE ALL ON FUNCTION public.mark_sale_paid(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_sale(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_sale_due_date(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_sale_paid(uuid, boolean) TO authenticated;