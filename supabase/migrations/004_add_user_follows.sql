create table public.user_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index user_follows_following_idx on public.user_follows (following_id, created_at desc);

alter table public.user_follows enable row level security;
grant select, insert, delete on public.user_follows to authenticated;
grant select on public.user_follows to anon;

create policy "follows are readable" on public.user_follows for select using (true);
create policy "users create their follows" on public.user_follows for insert with check (follower_id = auth.uid() and following_id <> auth.uid());
create policy "users remove their follows" on public.user_follows for delete using (follower_id = auth.uid());
