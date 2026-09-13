-- Weekwell fix 3 (2026-09-13): Profil 2.0 – profilová fotka, lokalita/bio, „moje údaje" so zdieľaním, progress fotky a príbehy (24 h).
-- Spustiť celé naraz v SQL Editore projektu TipLab. Bezpečné opakovať.

alter table ww_users add column if not exists location text;
alter table ww_users add column if not exists bio text check (char_length(bio) <= 200);
alter table ww_users add column if not exists stats jsonb not null default '{}';        -- {height_cm, weight_kg, birth_year, resting_hr, ...}
alter table ww_users add column if not exists share_fields jsonb not null default '{}'; -- {weight_kg: true, ...} = zdieľať so skupinou

create table if not exists ww_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references ww_users(id) on delete cascade,
  group_id uuid not null references ww_groups(id) on delete cascade,
  path text not null,                      -- cesta v buckete ww-photos
  caption text check (char_length(caption) <= 200),
  kind text not null default 'photo' check (kind in ('photo','story')),
  expires_at timestamptz,                  -- story: created_at + 24 h
  created_at timestamptz not null default now()
);
create index if not exists ww_photos_group_idx on ww_photos(group_id, created_at desc);
alter table ww_photos enable row level security;
drop policy if exists ww_photos_read on ww_photos;
create policy ww_photos_read on ww_photos for select using (group_id in (select ww_my_group_ids()) and (expires_at is null or expires_at > now()));
drop policy if exists ww_photos_own on ww_photos;
create policy ww_photos_own on ww_photos for all using (user_id = auth.uid()) with check (user_id = auth.uid() and group_id in (select ww_my_group_ids()));

-- buckety: avatary verejné (nie sú citlivé), progress fotky privátne (signed URL)
insert into storage.buckets (id, name, public) values ('ww-avatars', 'ww-avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('ww-photos', 'ww-photos', false) on conflict (id) do nothing;
drop policy if exists ww_avatars_rw on storage.objects;
create policy ww_avatars_rw on storage.objects for all
  using (bucket_id = 'ww-avatars' and (auth.role() = 'authenticated' or true))
  with check (bucket_id = 'ww-avatars' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists ww_photos_storage on storage.objects;
create policy ww_photos_storage on storage.objects for all
  using (bucket_id = 'ww-photos' and auth.role() = 'authenticated')
  with check (bucket_id = 'ww-photos' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);

-- udalosť pri novej fotke/príbehu (do aktivity skupiny)
create or replace function ww_photo_event() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into ww_events (group_id, user_id, type, ref_id, payload) values (new.group_id, new.user_id, new.kind, new.id, jsonb_build_object('caption', new.caption, 'path', new.path));
  return new;
end $$;
drop trigger if exists ww_on_photo on ww_photos;
create trigger ww_on_photo after insert on ww_photos for each row execute function ww_photo_event();

-- lepší fallback mena (e-mail prefix s veľkým písmenom) pre budúcich používateľov
create or replace function ww_handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare g uuid; nm text;
begin
  nm := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', initcap(split_part(coalesce(new.email, 'weekweller'), '@', 1)));
  insert into ww_users (id, name, avatar_url) values (new.id, nm, new.raw_user_meta_data->>'avatar_url') on conflict (id) do nothing;
  insert into ww_groups (name, emoji, admin_id) values (nm, '🌱', new.id) returning id into g;
  insert into ww_memberships (group_id, user_id, role) values (g, new.id, 'admin');
  insert into ww_events (group_id, user_id, type) values (g, new.id, 'join');
  return new;
end $$;

notify pgrst, 'reload schema';
