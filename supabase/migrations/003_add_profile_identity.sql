alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists full_name text;

update public.profiles
set username = lower(regexp_replace(coalesce(display_name, 'member'), '[^a-z0-9]+', '-', 'g')) || '-' || left(replace(id::text, '-', ''), 6)
where username is null;

alter table public.profiles alter column username set not null;
alter table public.profiles add constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9-]{2,29}$');
alter table public.profiles add constraint profiles_username_unique unique (username);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, full_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    'member-' || left(replace(new.id::text, '-', ''), 10)
  );
  return new;
end;
$$;
