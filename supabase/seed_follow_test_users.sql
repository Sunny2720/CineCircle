-- Development-only accounts for validating the follower graph. These users
-- are confirmed immediately and use non-routable @cinecircle.test addresses.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('a1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maya@cinecircle.test', crypt('test-only-account', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maya Chen"}', now(), now()),
  ('b2000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jon@cinecircle.test', crypt('test-only-account', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jon Bell"}', now(), now()),
  ('c3000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya@cinecircle.test', crypt('test-only-account', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Shah"}', now(), now())
on conflict (id) do nothing;

update public.profiles
set username = case id::text
  when 'a1000000-0000-4000-8000-000000000001' then 'maya-chen'
  when 'b2000000-0000-4000-8000-000000000002' then 'jon-bell'
  when 'c3000000-0000-4000-8000-000000000003' then 'priya-shah'
end,
full_name = case id::text
  when 'a1000000-0000-4000-8000-000000000001' then 'Maya Chen'
  when 'b2000000-0000-4000-8000-000000000002' then 'Jon Bell'
  when 'c3000000-0000-4000-8000-000000000003' then 'Priya Shah'
end
where id in ('a1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000003');

insert into public.user_follows (follower_id, following_id)
select follower_id, following_id from (
  values
    ('a1000000-0000-4000-8000-000000000001'::uuid, (select id from public.profiles where username = 'siddharth-sunny-roy42-039969')),
    ('b2000000-0000-4000-8000-000000000002'::uuid, (select id from public.profiles where username = 'siddharth-sunny-roy42-039969')),
    ((select id from public.profiles where username = 'siddharth-sunny-roy42-039969'), 'a1000000-0000-4000-8000-000000000001'::uuid),
    ('a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid)
) as relationships(follower_id, following_id)
where follower_id is not null and following_id is not null
on conflict do nothing;
