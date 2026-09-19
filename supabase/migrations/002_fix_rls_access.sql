-- Tables created through the SQL editor need explicit API role privileges; RLS
-- policies continue to decide which rows each role may access.
grant usage on schema public to anon, authenticated;
grant select on public.movies, public.movie_provider_references, public.playlists, public.playlist_movies, public.profiles to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- These helpers run as the table owner, avoiding circular RLS evaluation between
-- playlists and playlist_contributors while retaining the caller's auth.uid().
create or replace function public.is_playlist_contributor(target_playlist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.playlist_contributors
    where playlist_id = target_playlist_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_view_playlist(target_playlist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.playlists
    where id = target_playlist_id
      and (visibility = 'public' or owner_id = auth.uid() or public.is_playlist_contributor(id))
  );
$$;

drop policy if exists "public playlists are readable" on public.playlists;
create policy "public playlists are readable" on public.playlists
  for select using (visibility = 'public' or owner_id = auth.uid() or public.is_playlist_contributor(id));

drop policy if exists "playlist movies follow playlist access" on public.playlist_movies;
create policy "playlist movies follow playlist access" on public.playlist_movies
  for select using (public.can_view_playlist(playlist_id));
