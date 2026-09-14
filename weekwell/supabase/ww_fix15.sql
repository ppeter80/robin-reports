-- Weekwell fix 15 (2026-09-14): #52 aktivity navyše (manuálne pridané denné aktivity mimo výziev).
-- Aktivita = udalosť ww_events type 'activity' (payload: atype, value, unit, note, title, cc), voliteľná fotka v ww_photos kind 'activity'.
alter table ww_photos drop constraint if exists ww_photos_kind_check;
alter table ww_photos add constraint ww_photos_kind_check check (kind in ('photo','story','activity'));

-- trigger: udalosť len pre fotku/príbeh (aktivita si vkladá vlastnú udalosť s detailmi)
create or replace function ww_photo_event() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind in ('photo','story') then
    insert into ww_events (group_id, user_id, type, ref_id, payload) values (new.group_id, new.user_id, new.kind, new.id, jsonb_build_object('caption', new.caption, 'path', new.path));
  end if;
  return new;
end $$;

-- vlastnú aktivitu možno zmazať
drop policy if exists ww_events_delete_own on ww_events;
create policy ww_events_delete_own on ww_events for delete using (user_id = auth.uid() and type in ('photo','story','activity'));
notify pgrst, 'reload schema';
