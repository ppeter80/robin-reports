-- Weekwell fix 2 (2026-09-13): profil pre používateľov, ktorí v projekte už existovali pred Weekwellom (trigger na auth.users sa nespustí).
create or replace function ww_ensure_profile() returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid; nm text; au record;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from ww_users where id = auth.uid()) then
    if not exists (select 1 from ww_memberships where user_id = auth.uid() and status <> 'left') then
      select name into nm from ww_users where id = auth.uid();
      insert into ww_groups (name, emoji, admin_id) values (nm, '🌱', auth.uid()) returning id into g;
      insert into ww_memberships (group_id, user_id, role) values (g, auth.uid(), 'admin');
      insert into ww_events (group_id, user_id, type) values (g, auth.uid(), 'join');
    end if;
    return auth.uid();
  end if;
  select * into au from auth.users where id = auth.uid();
  nm := coalesce(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'Weekweller');
  insert into ww_users (id, name, avatar_url) values (au.id, nm, au.raw_user_meta_data->>'avatar_url') on conflict (id) do nothing;
  insert into ww_groups (name, emoji, admin_id) values (nm, '🌱', au.id) returning id into g;
  insert into ww_memberships (group_id, user_id, role) values (g, au.id, 'admin');
  insert into ww_events (group_id, user_id, type) values (g, au.id, 'join');
  return au.id;
end $$;
notify pgrst, 'reload schema';
