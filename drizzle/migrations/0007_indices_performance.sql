create index if not exists idx_location_pings_recorded on public.location_pings (recorded_at desc);
create index if not exists idx_location_pings_seller_time on public.location_pings (seller_id, recorded_at desc);
create index if not exists idx_movements_created on public.movements (created_at desc);
create index if not exists idx_sales_created on public.sales (created_at desc);
create index if not exists idx_sale_items_sale on public.sale_items (sale_id);
create index if not exists idx_profiles_team on public.profiles (team_id);
create index if not exists idx_seller_stock_seller on public.seller_stock (seller_id);