
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- moments
create table public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fen text not null,
  caption text,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.moments enable row level security;
create policy "moments_select_all" on public.moments for select using (true);
create policy "moments_insert_own" on public.moments for insert with check (auth.uid() = user_id);
create policy "moments_update_own" on public.moments for update using (auth.uid() = user_id);
create policy "moments_delete_own" on public.moments for delete using (auth.uid() = user_id);

-- likes
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (moment_id, user_id)
);
alter table public.likes enable row level security;
create policy "likes_select_all" on public.likes for select using (true);
create policy "likes_insert_own" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.likes for delete using (auth.uid() = user_id);

-- comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
create policy "comments_select_all" on public.comments for select using (true);
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = user_id);

-- likes_count maintenance triggers
create or replace function public.increment_likes_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.moments set likes_count = likes_count + 1 where id = new.moment_id;
  return new;
end; $$;

create or replace function public.decrement_likes_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.moments set likes_count = greatest(0, likes_count - 1) where id = old.moment_id;
  return old;
end; $$;

create trigger likes_after_insert after insert on public.likes
for each row execute function public.increment_likes_count();

create trigger likes_after_delete after delete on public.likes
for each row execute function public.decrement_likes_count();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
