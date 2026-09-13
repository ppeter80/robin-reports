-- Weekwell fix 12 (2026-09-13): vlastnú udalosť (fotka/príbeh) možno zmazať spolu s fotkou (#36).
drop policy if exists ww_events_delete_own on ww_events;
create policy ww_events_delete_own on ww_events for delete using (user_id = auth.uid() and type in ('photo','story'));
notify pgrst, 'reload schema';
