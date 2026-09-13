-- Weekwell fix 14 (2026-09-13): admin môže výber výziev bežiaceho týždňa otvoriť znova (kým nikto nič nezapísal) a spustiť ho ručne (#38).
create or replace function ww_reopen_current() returns void language plpgsql security definer set search_path = public as $$
declare g uuid; cyc record;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status <> 'left';
  if not exists (select 1 from ww_groups where id = g and admin_id = auth.uid()) then raise exception 'not_admin'; end if;
  select * into cyc from ww_cycles where group_id = g and week_start = date_trunc('week', now() at time zone (select tz from ww_groups where id = g))::date;
  if cyc is null then raise exception 'no_cycle'; end if;
  if exists (select 1 from ww_logs l join ww_cycle_challenges cc on cc.id = l.cycle_challenge_id where cc.cycle_id = cyc.id) then raise exception 'already_logged'; end if;
  delete from ww_cycle_challenges where cycle_id = cyc.id;
  update ww_cycles set status = 'voting', selected_at = null where id = cyc.id;
end $$;
create or replace function ww_select_now() returns void language plpgsql security definer set search_path = public as $$
declare g uuid; cyc record;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status <> 'left';
  if not exists (select 1 from ww_groups where id = g and admin_id = auth.uid()) then raise exception 'not_admin'; end if;
  select * into cyc from ww_cycles where group_id = g and week_start = date_trunc('week', now() at time zone (select tz from ww_groups where id = g))::date;
  if cyc is null or cyc.status not in ('proposing','voting') then raise exception 'not_open'; end if;
  perform ww_select_challenges(cyc.id);
  update ww_cycles set status = 'running' where id = cyc.id;
end $$;
notify pgrst, 'reload schema';
