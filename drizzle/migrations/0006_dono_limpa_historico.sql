create or replace function public.clear_movements()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.has_role(auth.uid(), 'owner') then
    raise exception 'Somente o dono pode limpar o histórico.';
  end if;
  delete from public.movements where true;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.clear_movements() from public, anon;
grant execute on function public.clear_movements() to authenticated;