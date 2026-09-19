create extension if not exists "pgcrypto";

create type public.playlist_visibility as enum ('private', 'public');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  overview text not null default '',
  release_year integer,
  poster_path text,
  backdrop_path text,
  genres text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.movie_provider_references (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  provider text not null,
  provider_movie_id text not null,
  imdb_id text,
  trailer_video_id text,
  metadata_fetched_at timestamptz not null default now(),
  unique (provider, provider_movie_id)
);

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  cover_image_url text,
  visibility public.playlist_visibility not null default 'private',
  contributions_enabled boolean not null default false,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.playlist_movies (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  added_by uuid not null references public.profiles(id) on delete restrict,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  primary key (playlist_id, movie_id)
);

create table public.playlist_contributors (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (playlist_id, user_id)
);

create table public.user_movie_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  liked boolean,
  viewed boolean not null default false,
  rating numeric(2,1) check (rating is null or (rating >= 0.5 and rating <= 5.0 and mod(rating * 10, 5) = 0)),
  updated_at timestamptz not null default now(),
  primary key (user_id, movie_id),
  check (rating is null or viewed = true)
);

create index playlists_public_idx on public.playlists (updated_at desc) where visibility = 'public';
create index playlist_movies_order_idx on public.playlist_movies (playlist_id, position);
create index preferences_recommendation_idx on public.user_movie_preferences (user_id, viewed, liked, rating);

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.movie_provider_references enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_movies enable row level security;
alter table public.playlist_contributors enable row level security;
alter table public.user_movie_preferences enable row level security;

create policy "public movies are readable" on public.movies for select using (true);
create policy "public movie references are readable" on public.movie_provider_references for select using (true);
create policy "profiles are readable for playlist attribution" on public.profiles for select using (true);
create policy "users create their profile" on public.profiles for insert with check (id = auth.uid());
create policy "users update their profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "public playlists are readable" on public.playlists for select using (visibility = 'public' or owner_id = auth.uid() or exists (select 1 from public.playlist_contributors c where c.playlist_id = id and c.user_id = auth.uid()));
create policy "users create playlists" on public.playlists for insert with check (owner_id = auth.uid());
create policy "owners update playlists" on public.playlists for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete playlists" on public.playlists for delete using (owner_id = auth.uid());
create policy "playlist movies follow playlist access" on public.playlist_movies for select using (exists (select 1 from public.playlists p where p.id = playlist_id and (p.visibility = 'public' or p.owner_id = auth.uid() or exists (select 1 from public.playlist_contributors c where c.playlist_id = p.id and c.user_id = auth.uid()))));
create policy "owners and contributors add movies" on public.playlist_movies for insert with check (exists (select 1 from public.playlists p where p.id = playlist_id and (p.owner_id = auth.uid() or (p.contributions_enabled = true and exists (select 1 from public.playlist_contributors c where c.playlist_id = p.id and c.user_id = auth.uid())))) and added_by = auth.uid());
create policy "owners remove movies" on public.playlist_movies for delete using (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()) or added_by = auth.uid());
create policy "owners reorder movies" on public.playlist_movies for update using (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid())) with check (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()));
create policy "owners manage contributors" on public.playlist_contributors for all using (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid())) with check (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()));
create policy "users manage their preferences" on public.user_movie_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());