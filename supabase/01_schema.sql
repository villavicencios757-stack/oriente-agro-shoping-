-- ORIENTE AGRO SHOPING · Pega TODO esto en Supabase > SQL Editor > Run (una sola vez)
create table profiles(id uuid primary key references auth.users on delete cascade, email text, name text, role text not null default 'sin_acceso', created_at timestamptz default now());
create table categories(id uuid primary key default gen_random_uuid(), slug text unique, name text not null, position int default 0);
create table subcategories(id uuid primary key default gen_random_uuid(), category_id uuid references categories on delete cascade, name text not null);
create table listings(id uuid primary key default gen_random_uuid(), category_id uuid references categories, subcategory_id uuid references subcategories,
 title text not null, description text, price numeric, price_on_request boolean default false, location text, department text, details jsonb default '{}',
 status text not null default 'pendiente' check (status in ('borrador','pendiente','cambios','aprobada','rechazada','reservada','vendida','archivada')),
 featured boolean default false, verified boolean default false, admin_notes text, sold_price numeric, commission numeric, created_at timestamptz default now());
create table seller_contacts(listing_id uuid primary key references listings on delete cascade, name text, phone text);
create table listing_media(id uuid primary key default gen_random_uuid(), listing_id uuid references listings on delete cascade, kind text check (kind in ('foto','video')), url text, is_main boolean default false);
create table leads(id uuid primary key default gen_random_uuid(), name text not null, phone text not null, city text, department text, looking_for text, category_id uuid references categories, budget numeric, message text,
 listing_id uuid references listings on delete set null, status text default 'nuevo' check (status in ('nuevo','contactado','negociacion','cerrado','no_interesado')), created_at timestamptz default now());

create function is_admin() returns boolean language sql security definer stable as $$select exists(select 1 from profiles where id=auth.uid() and role='admin')$$;
create function is_staff() returns boolean language sql security definer stable as $$select exists(select 1 from profiles where id=auth.uid() and role in('admin','staff'))$$;
create function listing_public(l uuid) returns boolean language sql security definer stable as $$select exists(select 1 from listings where id=l and status in('aprobada','reservada','vendida'))$$;
create function listing_pending(l uuid) returns boolean language sql security definer stable as $$select exists(select 1 from listings where id=l and status='pendiente')$$;
create function new_user() returns trigger language plpgsql security definer as $$begin insert into profiles(id,email,name) values(new.id,new.email,new.raw_user_meta_data->>'name'); return new; end$$;
create trigger on_auth_user after insert on auth.users for each row execute function new_user();

alter table profiles enable row level security; alter table categories enable row level security; alter table subcategories enable row level security;
alter table listings enable row level security; alter table seller_contacts enable row level security; alter table listing_media enable row level security; alter table leads enable row level security;
create policy p_sel on profiles for select using (id=auth.uid() or is_admin());
create policy p_upd on profiles for update using (is_admin());
create policy c_sel on categories for select using (true);   create policy c_all on categories for all using (is_admin());
create policy s_sel on subcategories for select using (true); create policy s_all on subcategories for all using (is_admin());
create policy l_sel on listings for select using (status in('aprobada','reservada','vendida') or is_staff());
create policy l_ins on listings for insert with check (status='pendiente' and featured=false and verified=false);
create policy l_upd on listings for update using (is_staff());
create policy l_del on listings for delete using (is_admin());
create policy sc_ins on seller_contacts for insert with check (listing_pending(listing_id));
create policy sc_sel on seller_contacts for select using (is_staff());
create policy m_sel on listing_media for select using (listing_public(listing_id) or is_staff());
create policy m_ins on listing_media for insert with check (listing_pending(listing_id) or is_staff());
create policy m_del on listing_media for delete using (is_staff());
create policy ld_ins on leads for insert with check (status='nuevo');
create policy ld_sel on leads for select using (is_staff());
create policy ld_upd on leads for update using (is_staff());

insert into storage.buckets(id,name,public) values('listings','listings',true) on conflict do nothing;
create policy st_sel on storage.objects for select using (bucket_id='listings');
create policy st_ins on storage.objects for insert with check (bucket_id='listings');
create policy st_del on storage.objects for delete using (bucket_id='listings' and is_staff());

with c as (insert into categories(slug,name,position) values('ganado','Ganado',1),('equinos','Equinos',2),('propiedades','Propiedades agropecuarias',3) returning id,slug)
insert into subcategories(category_id,name) select c.id,s from c join (values
('ganado','Ganado de carne'),('ganado','Vientres'),('ganado','Toros reproductores'),('ganado','Terneros'),('ganado','Novillos'),('ganado','Lotes de ganado'),
('equinos','Caballos'),('equinos','Yeguas'),('equinos','Potros'),('equinos','Reproductores'),('equinos','Caballos de trabajo'),
('propiedades','Estancias'),('propiedades','Haciendas'),('propiedades','Campos ganaderos'),('propiedades','Propiedades agrícolas'),('propiedades','Terrenos'),('propiedades','Propiedades mixtas')) v(slug,s) on v.slug=c.slug;
