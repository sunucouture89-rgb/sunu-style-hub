
-- ============ ENUMS ============
create type public.app_role as enum ('client', 'couturier', 'admin');
create type public.listing_status as enum ('draft','active','paused','sold');
create type public.order_status as enum ('pending','accepted','in_production','shipped','delivered','cancelled');
create type public.order_kind as enum ('standard','sur_mesure');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  phone text,
  city text,
  country text default 'Sénégal',
  avatar_url text,
  bio text,
  atelier_name text,
  is_verified boolean default false,
  whatsapp_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create policy "Users can view own roles"
  on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "Admins manage roles"
  on public.user_roles for all using (public.has_role(auth.uid(),'admin'));
create policy "Users can self-assign client/couturier on signup"
  on public.user_roles for insert with check (auth.uid() = user_id and role in ('client','couturier'));

-- ============ AUTO PROFILE + DEFAULT ROLE ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_roles (user_id, role)
  values (new.id, coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'client'));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ updated_at helper ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============ LISTINGS ============
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  couturier_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  fabric text,
  delivery_days int default 14,
  price_xof int not null check (price_xof >= 0),
  city text,
  status public.listing_status not null default 'active',
  is_premium boolean not null default false,
  premium_until timestamptz,
  views_count int not null default 0,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.listings enable row level security;
create index on public.listings (couturier_id);
create index on public.listings (status, is_premium, created_at desc);

create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();

create policy "Active listings are public"
  on public.listings for select using (status = 'active' or auth.uid() = couturier_id or public.has_role(auth.uid(),'admin'));
create policy "Couturier creates own listings"
  on public.listings for insert with check (auth.uid() = couturier_id and public.has_role(auth.uid(),'couturier'));
create policy "Couturier updates own listings"
  on public.listings for update using (auth.uid() = couturier_id or public.has_role(auth.uid(),'admin'));
create policy "Couturier deletes own listings"
  on public.listings for delete using (auth.uid() = couturier_id or public.has_role(auth.uid(),'admin'));

-- ============ LISTING IMAGES ============
create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  position int default 0,
  created_at timestamptz not null default now()
);
alter table public.listing_images enable row level security;
create index on public.listing_images (listing_id);

create policy "Listing images public"
  on public.listing_images for select using (true);
create policy "Owner manages listing images"
  on public.listing_images for all using (
    exists (select 1 from public.listings l where l.id = listing_id and l.couturier_id = auth.uid())
  );

-- ============ FAVORITES ============
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.favorites enable row level security;
create policy "Users see own favorites"
  on public.favorites for select using (auth.uid() = user_id);
create policy "Users manage own favorites"
  on public.favorites for all using (auth.uid() = user_id);

-- ============ ORDERS ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  client_id uuid not null references auth.users(id) on delete cascade,
  couturier_id uuid not null references auth.users(id) on delete cascade,
  kind public.order_kind not null default 'standard',
  status public.order_status not null default 'pending',
  amount_xof int not null check (amount_xof >= 0),
  measurements jsonb,
  notes text,
  delivery_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create index on public.orders (client_id);
create index on public.orders (couturier_id);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create policy "Order parties can view"
  on public.orders for select using (auth.uid() in (client_id, couturier_id) or public.has_role(auth.uid(),'admin'));
create policy "Clients create own orders"
  on public.orders for insert with check (auth.uid() = client_id);
create policy "Order parties update"
  on public.orders for update using (auth.uid() in (client_id, couturier_id) or public.has_role(auth.uid(),'admin'));

-- ============ REVIEWS ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (listing_id, author_id)
);
alter table public.reviews enable row level security;
create index on public.reviews (listing_id);

create policy "Reviews public"
  on public.reviews for select using (true);
create policy "Auth users write own reviews"
  on public.reviews for insert with check (auth.uid() = author_id);
create policy "Authors update/delete own reviews"
  on public.reviews for update using (auth.uid() = author_id);
create policy "Authors delete own reviews"
  on public.reviews for delete using (auth.uid() = author_id);

-- ============ CONVERSATIONS / MESSAGES ============
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  couturier_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (client_id, couturier_id, listing_id)
);
alter table public.conversations enable row level security;
create index on public.conversations (client_id, last_message_at desc);
create index on public.conversations (couturier_id, last_message_at desc);

create policy "Participants view conversation"
  on public.conversations for select using (auth.uid() in (client_id, couturier_id));
create policy "Participants create conversation"
  on public.conversations for insert with check (auth.uid() in (client_id, couturier_id));
create policy "Participants update conversation"
  on public.conversations for update using (auth.uid() in (client_id, couturier_id));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  image_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create index on public.messages (conversation_id, created_at);

create policy "Participants view messages"
  on public.messages for select using (
    exists (select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.client_id, c.couturier_id))
  );
create policy "Participants send messages"
  on public.messages for insert with check (
    sender_id = auth.uid() and
    exists (select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.client_id, c.couturier_id))
  );
create policy "Participants update messages (read)"
  on public.messages for update using (
    exists (select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.client_id, c.couturier_id))
  );

-- Bump conversation last_message_at
create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = now() where id = new.conversation_id;
  return new;
end; $$;
create trigger messages_bump after insert on public.messages
  for each row execute function public.bump_conversation();

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create index on public.notifications (user_id, created_at desc);

create policy "Users see own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications"
  on public.notifications for update using (auth.uid() = user_id);
create policy "Service insert notifications"
  on public.notifications for insert with check (true);

alter publication supabase_realtime add table public.notifications;

-- ============ STORAGE BUCKETS ============
insert into storage.buckets (id, name, public) values
  ('avatars','avatars', true),
  ('listings','listings', true),
  ('chat','chat', true)
on conflict (id) do nothing;

-- Avatars: anyone reads, owner writes (folder = user id)
create policy "Avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users upload own avatar" on storage.objects for insert
  with check (bucket_id='avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update own avatar" on storage.objects for update
  using (bucket_id='avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Listings images
create policy "Listings public read" on storage.objects for select using (bucket_id='listings');
create policy "Couturier upload listing img" on storage.objects for insert
  with check (bucket_id='listings' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Couturier update listing img" on storage.objects for update
  using (bucket_id='listings' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Couturier delete listing img" on storage.objects for delete
  using (bucket_id='listings' and auth.uid()::text = (storage.foldername(name))[1]);

-- Chat attachments
create policy "Chat read" on storage.objects for select using (bucket_id='chat');
create policy "Chat upload" on storage.objects for insert
  with check (bucket_id='chat' and auth.uid()::text = (storage.foldername(name))[1]);
