-- Signed-in users may add provider metadata while building their own collections.
create policy "authenticated users add movies" on public.movies for insert to authenticated with check (true);
create policy "authenticated users add movie references" on public.movie_provider_references for insert to authenticated with check (true);

create policy "authenticated users add their playlist movies" on public.playlist_movies for insert to authenticated with check (
  added_by = auth.uid() and exists (
    select 1 from public.playlists p
    where p.id = playlist_id
      and (p.owner_id = auth.uid() or (p.contributions_enabled and exists (
        select 1 from public.playlist_contributors c where c.playlist_id = p.id and c.user_id = auth.uid()
      )))
  )
);
