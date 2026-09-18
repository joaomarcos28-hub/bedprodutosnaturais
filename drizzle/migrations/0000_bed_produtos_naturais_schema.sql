-- ============= BeD Produtos Naturais — schema completo =============

-- ---------- Tipos ----------
create type public.app_role as enum ('owner', 'supervisor', 'seller');

-- ---------- Tabelas ----------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  supervisor_id uuid,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  phone text,
  team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  barcode text unique,
  name text not null,
  category text,
  unit_cost numeric(10,2) not null default 0,
  sale_price numeric(10,2) not null default 0,
  central_stock integer not null default 0,
  low_stock_threshold integer not null default 10,
  created_at timestamptz not null default now()
);

create table public.seller_stock (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (seller_id, product_id)
);

create table public.movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  type text not null,
  quantity integer not null,
  actor_id uuid,
  seller_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  number integer not null,
  name text,
  start_date date not null,
  end_date date not null,
  supervisor_id uuid,
  status text not null default 'ativa',
  created_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  customer_name text,
  payment_method text not null default 'pix',
  total numeric(12,2) not null default 0,
  campaign_id uuid references public.campaigns(id),
  day_number integer,
  photo_url text,
  signature_url text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null,
  unit_price numeric(10,2) not null default 0
);

create table public.location_pings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  latitude double precision not null,
  longitude double precision not null,
  recorded_at timestamptz not null default now()
);

create index idx_pings_seller_time on public.location_pings (seller_id, recorded_at desc);
create index idx_sales_seller_time on public.sales (seller_id, created_at desc);

-- ---------- Grants ----------
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.seller_stock to authenticated;
grant select, insert on public.movements to authenticated;
grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.sales to authenticated;
grant select, insert on public.sale_items to authenticated;
grant select, insert, delete on public.location_pings to authenticated;
grant all on public.user_roles to service_role;
grant all on public.teams to service_role;
grant all on public.profiles to service_role;
grant all on public.products to service_role;
grant all on public.seller_stock to service_role;
grant all on public.movements to service_role;
grant all on public.campaigns to service_role;
grant all on public.sales to service_role;
grant all on public.sale_items to service_role;
grant all on public.location_pings to service_role;

-- ---------- RLS enable ----------
alter table public.user_roles enable row level security;
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.seller_stock enable row level security;
alter table public.movements enable row level security;
alter table public.campaigns enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.location_pings enable row level security;

-- ---------- Funções ----------
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_team_supervisor(p_supervisor uuid, p_seller uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p join public.teams t on p.team_id = t.id
    where p.id = p_seller and t.supervisor_id = p_supervisor
  );
$$;

create or replace function public.ensure_profile(p_full_name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  v_name := coalesce(nullif(trim(p_full_name), ''), split_part(coalesce(auth.email(), ''), '@', 1));
  insert into public.profiles (id, full_name) values (auth.uid(), v_name)
  on conflict (id) do update set full_name = coalesce(nullif(trim(p_full_name), ''), public.profiles.full_name);

  if not exists (select 1 from public.user_roles where role = 'owner') then
    insert into public.user_roles (user_id, role) values (auth.uid(), 'owner');
  end if;
  if not exists (select 1 from public.user_roles where user_id = auth.uid()) then
    insert into public.user_roles (user_id, role) values (auth.uid(), 'seller');
  end if;
end $$;

create or replace function public.register_sale(
  p_items jsonb,
  p_customer text default null,
  p_payment text default 'pix',
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_photo text default null,
  p_signature text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_sale_id uuid;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_price numeric(10,2);
  v_campaign public.campaigns%rowtype;
begin
  if not exists (select 1 from public.user_roles where user_id = auth.uid()) then
    raise exception 'Sem permissao para registrar venda';
  end if;

  select * into v_campaign from public.campaigns
  where status = 'ativa' and current_date between start_date and end_date
  order by start_date desc limit 1;

  insert into public.sales (seller_id, customer_name, payment_method, total, campaign_id, day_number, photo_url, signature_url, latitude, longitude)
  values (
    auth.uid(), p_customer, p_payment, 0,
    v_campaign.id,
    case when v_campaign.id is null then null else (current_date - v_campaign.start_date)::int + 1 end,
    p_photo, p_signature, p_latitude, p_longitude
  )
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select sale_price into v_price from public.products where id = (v_item->>'product_id')::uuid;
    v_price := coalesce(v_price, 0);
    v_total := v_total + v_price * (v_item->>'quantity')::int;

    insert into public.sale_items (sale_id, product_id, quantity, unit_price)
    values (v_sale_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::int, v_price);

    update public.seller_stock set quantity = quantity - (v_item->>'quantity')::int, updated_at = now()
    where seller_id = auth.uid() and product_id = (v_item->>'product_id')::uuid;

    insert into public.movements (product_id, type, quantity, actor_id, seller_id)
    values ((v_item->>'product_id')::uuid, 'venda', (v_item->>'quantity')::int, auth.uid(), auth.uid());
  end loop;

  update public.sales set total = v_total where id = v_sale_id;
  return v_sale_id;
end $$;

create or replace function public.deliver_to_seller(p_seller_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_item jsonb;
begin
  if not (
    public.has_role(auth.uid(), 'owner')
    or public.is_team_supervisor(auth.uid(), p_seller_id)
  ) then
    raise exception 'Sem permissao para entregar estoque';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    update public.products set central_stock = central_stock - (v_item->>'quantity')::int
    where id = (v_item->>'product_id')::uuid;

    insert into public.seller_stock (seller_id, product_id, quantity)
    values (p_seller_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::int)
    on conflict (seller_id, product_id)
    do update set quantity = public.seller_stock.quantity + excluded.quantity, updated_at = now();

    insert into public.movements (product_id, type, quantity, actor_id, seller_id)
    values ((v_item->>'product_id')::uuid, 'entrega_vendedor', (v_item->>'quantity')::int, auth.uid(), p_seller_id);
  end loop;
end $$;

create or replace function public.adjust_central_stock(p_product_id uuid, p_delta int, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'owner') then
    raise exception 'Apenas o dono pode ajustar o estoque';
  end if;

  update public.products set central_stock = greatest(0, central_stock + p_delta)
  where id = p_product_id;

  insert into public.movements (product_id, type, quantity, actor_id, note)
  values (p_product_id, case when p_delta >= 0 then 'entrada_central' else 'saida_central' end, abs(p_delta), auth.uid(), p_note);
end $$;

grant execute on function public.ensure_profile(text) to authenticated;
grant execute on function public.register_sale(jsonb, text, text, double precision, double precision, text, text) to authenticated;
grant execute on function public.deliver_to_seller(uuid, jsonb) to authenticated;
grant execute on function public.adjust_central_stock(uuid, int, text) to authenticated;

-- ---------- Políticas RLS ----------
create policy "Le os proprios papeis" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Dono gerencia papeis" on public.user_roles for all to authenticated using (public.has_role(auth.uid(), 'owner')) with check (public.has_role(auth.uid(), 'owner'));

create policy "Le proprio perfil" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Equipe le membros" on public.profiles for select to authenticated using (public.is_team_supervisor(auth.uid(), id));
create policy "Dono le todos perfis" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'owner'));
create policy "Atualiza proprio perfil" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Dono atualiza perfis" on public.profiles for update to authenticated using (public.has_role(auth.uid(), 'owner'));
create policy "Cria proprio perfil" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Dono cria perfis" on public.profiles for insert to authenticated with check (public.has_role(auth.uid(), 'owner'));

create policy "Dono gerencia equipes" on public.teams for all to authenticated using (public.has_role(auth.uid(), 'owner')) with check (public.has_role(auth.uid(), 'owner'));
create policy "Supervisor le propria equipe" on public.teams for select to authenticated using (supervisor_id = auth.uid());
create policy "Membros leem equipe" on public.teams for select to authenticated using (id in (select team_id from public.profiles where id = auth.uid()));
create policy "Supervisor atualiza equipe" on public.teams for update to authenticated using (supervisor_id = auth.uid());

create policy "Autenticados leem produtos" on public.products for select to authenticated using (true);
create policy "Dono gerencia produtos" on public.products for all to authenticated using (public.has_role(auth.uid(), 'owner')) with check (public.has_role(auth.uid(), 'owner'));

create policy "Le proprio estoque" on public.seller_stock for select to authenticated using (seller_id = auth.uid());
create policy "Supervisor le estoque da equipe" on public.seller_stock for select to authenticated using (public.is_team_supervisor(auth.uid(), seller_id));
create policy "Dono le todo estoque" on public.seller_stock for select to authenticated using (public.has_role(auth.uid(), 'owner'));

create policy "Le historico" on public.movements for select to authenticated using (
  actor_id = auth.uid() or seller_id = auth.uid()
  or public.has_role(auth.uid(), 'owner')
  or public.is_team_supervisor(auth.uid(), seller_id)
);
create policy "Insere movimentacao" on public.movements for insert to authenticated with check (actor_id = auth.uid() or public.has_role(auth.uid(), 'owner'));

create policy "Le campanhas" on public.campaigns for select to authenticated using (true);
create policy "Dono gerencia campanhas" on public.campaigns for all to authenticated using (public.has_role(auth.uid(), 'owner')) with check (public.has_role(auth.uid(), 'owner'));
create policy "Supervisor cria campanhas" on public.campaigns for insert to authenticated with check (public.has_role(auth.uid(), 'supervisor') or public.has_role(auth.uid(), 'owner'));
create policy "Supervisor atualiza campanhas" on public.campaigns for update to authenticated using (supervisor_id = auth.uid() or public.has_role(auth.uid(), 'owner'));

create policy "Le propria venda" on public.sales for select to authenticated using (seller_id = auth.uid());
create policy "Supervisor le vendas da equipe" on public.sales for select to authenticated using (public.is_team_supervisor(auth.uid(), seller_id));
create policy "Dono le todas vendas" on public.sales for select to authenticated using (public.has_role(auth.uid(), 'owner'));
create policy "Le itens" on public.sale_items for select to authenticated using (
  exists (select 1 from public.sales s where s.id = sale_id and (
    s.seller_id = auth.uid()
    or public.has_role(auth.uid(), 'owner')
    or public.is_team_supervisor(auth.uid(), s.seller_id)
  ))
);

create policy "Envia propria localizacao" on public.location_pings for insert to authenticated with check (seller_id = auth.uid());
create policy "Le propria localizacao" on public.location_pings for select to authenticated using (seller_id = auth.uid());
create policy "Supervisor le localizacao da equipe" on public.location_pings for select to authenticated using (public.is_team_supervisor(auth.uid(), seller_id));
create policy "Dono le localizacao" on public.location_pings for select to authenticated using (public.has_role(auth.uid(), 'owner'));
create policy "Apaga propria localizacao" on public.location_pings for delete to authenticated using (seller_id = auth.uid());

-- ---------- Políticas do bucket de comprovantes ----------
create policy "Upload de comprovantes" on storage.objects for insert to authenticated with check (bucket_id = 'receipts');
create policy "Leitura de comprovantes" on storage.objects for select to authenticated using (bucket_id = 'receipts');

-- ---------- Produtos de exemplo ----------
insert into public.products (barcode, name, category, unit_cost, sale_price, central_stock, low_stock_threshold) values
  ('7891234567890', 'Whey Natural 500g', 'Suplementos', 55.00, 89.90, 37, 10),
  ('7891234567891', 'Colágeno Verisol 300g', 'Suplementos', 42.00, 79.90, 22, 8),
  ('7891234567892', 'Chá Natural Camomila 20 un.', 'Chás', 8.50, 15.90, 60, 15),
  ('7891234567893', 'Multivitamínico Natural 60 caps', 'Vitaminas', 28.00, 54.90, 18, 6);
