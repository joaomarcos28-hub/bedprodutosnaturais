-- Dono precisa ver os papéis de todos para gerenciar equipes
create policy "Dono le todos os papeis" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'owner'));

-- Ligações entre tabelas para permitir buscas com dados relacionados
alter table public.sales add constraint sales_seller_id_fkey foreign key (seller_id) references public.profiles(id);
alter table public.seller_stock add constraint seller_stock_seller_id_fkey foreign key (seller_id) references public.profiles(id);
alter table public.location_pings add constraint location_pings_seller_id_fkey foreign key (seller_id) references public.profiles(id);
alter table public.movements add constraint movements_actor_id_fkey foreign key (actor_id) references public.profiles(id);
alter table public.movements add constraint movements_seller_id_fkey foreign key (seller_id) references public.profiles(id);
alter table public.campaigns add constraint campaigns_supervisor_id_fkey foreign key (supervisor_id) references public.profiles(id);
alter table public.teams add constraint teams_supervisor_id_fkey foreign key (supervisor_id) references public.profiles(id);
