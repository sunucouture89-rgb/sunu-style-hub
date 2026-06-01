
-- 1. shops table
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  couturier_id uuid not null unique,
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  logo_url text,
  cover_url text,
  whatsapp text,
  phone text,
  email text,
  city text,
  country text default 'Sénégal',
  address text,
  instagram text,
  tiktok text,
  facebook text,
  website text,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  followers_count integer not null default 0,
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shops_couturier on public.shops(couturier_id);
create index idx_shops_slug on public.shops(slug);

grant select on public.shops to anon;
grant select, insert, update on public.shops to authenticated;
grant all on public.shops to service_role;

alter table public.shops enable row level security;

create policy "Active shops public" on public.shops
  for select using (is_active or auth.uid() = couturier_id or has_role(auth.uid(), 'admin'));

create policy "Owner inserts shop" on public.shops
  for insert with check (auth.uid() = couturier_id);

create policy "Owner updates shop" on public.shops
  for update using (auth.uid() = couturier_id or has_role(auth.uid(), 'admin'));

create policy "Admin deletes shop" on public.shops
  for delete using (has_role(auth.uid(), 'admin'));

create trigger shops_touch before update on public.shops
  for each row execute function public.touch_updated_at();

-- 2. shop_followers
create table public.shop_followers (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

grant select on public.shop_followers to anon;
grant select, insert, delete on public.shop_followers to authenticated;
grant all on public.shop_followers to service_role;

alter table public.shop_followers enable row level security;

create policy "Followers public read" on public.shop_followers
  for select using (true);

create policy "User follows" on public.shop_followers
  for insert with check (auth.uid() = user_id);

create policy "User unfollows" on public.shop_followers
  for delete using (auth.uid() = user_id);

-- maintain followers_count
create or replace function public.shop_followers_count_trg()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op = 'INSERT' then
    update public.shops set followers_count = followers_count + 1 where id = new.shop_id;
  elsif tg_op = 'DELETE' then
    update public.shops set followers_count = greatest(0, followers_count - 1) where id = old.shop_id;
  end if;
  return null;
end; $$;

revoke execute on function public.shop_followers_count_trg() from public, anon;

create trigger shop_followers_count_ai after insert on public.shop_followers
  for each row execute function public.shop_followers_count_trg();
create trigger shop_followers_count_ad after delete on public.shop_followers
  for each row execute function public.shop_followers_count_trg();

-- 3. listings.shop_id
alter table public.listings add column shop_id uuid references public.shops(id) on delete set null;
create index idx_listings_shop on public.listings(shop_id);

-- 4. helper: slug generator
create or replace function public.gen_shop_slug(_base text)
returns text language plpgsql security definer set search_path=public as $$
declare
  base text := lower(regexp_replace(coalesce(nullif(trim(_base), ''), 'atelier'), '[^a-zA-Z0-9]+', '-', 'g'));
  candidate text;
  n int := 0;
begin
  base := trim(both '-' from base);
  if base = '' then base := 'atelier'; end if;
  candidate := base;
  while exists (select 1 from public.shops where slug = candidate) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  return candidate;
end; $$;

revoke execute on function public.gen_shop_slug(text) from public, anon;
grant execute on function public.gen_shop_slug(text) to authenticated, service_role;

-- 5. backfill existing couturiers -> shops
insert into public.shops (couturier_id, slug, name, city, whatsapp)
select
  ur.user_id,
  public.gen_shop_slug(coalesce(p.atelier_name, p.display_name, p.full_name, 'atelier')),
  coalesce(p.atelier_name, p.display_name, p.full_name, 'Mon atelier'),
  p.city,
  p.whatsapp_number
from public.user_roles ur
left join public.profiles p on p.id = ur.user_id
where ur.role = 'couturier'
on conflict (couturier_id) do nothing;

-- 6. backfill listings.shop_id
update public.listings l
set shop_id = s.id
from public.shops s
where s.couturier_id = l.couturier_id and l.shop_id is null;

-- 7. update handle_new_user to create shop for couturier
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  _role public.app_role;
  _name text;
begin
  _role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'client');
  _name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name');

  insert into public.profiles (id, full_name, display_name, avatar_url)
  values (
    new.id,
    _name,
    coalesce(new.raw_user_meta_data->>'display_name', _name),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.user_roles (user_id, role) values (new.id, _role);

  if _role = 'couturier' then
    insert into public.shops (couturier_id, slug, name)
    values (
      new.id,
      public.gen_shop_slug(coalesce(_name, 'atelier')),
      coalesce(_name, 'Mon atelier')
    )
    on conflict (couturier_id) do nothing;
  end if;

  return new;
end; $$;
