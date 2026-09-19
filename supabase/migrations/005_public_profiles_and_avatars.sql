alter table public.profiles add column if not exists avatar_url text;

update public.profiles profile
set avatar_url = coalesce(auth_user.raw_user_meta_data ->> 'picture', auth_user.raw_user_meta_data ->> 'avatar_url')
from auth.users auth_user
where profile.id = auth_user.id
  and profile.avatar_url is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, full_name, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    'member-' || left(replace(new.id::text, '-', ''), 16),
    coalesce(new.raw_user_meta_data ->> 'picture', new.raw_user_meta_data ->> 'avatar_url')
  );
  return new;
end;
$$;
