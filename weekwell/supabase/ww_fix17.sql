-- Weekwell fix 17 (2026-10-03): #62 osobné výzvy – člen si po výbere skupinových výziev pridá vlastné výzvy len pre seba,
-- ostatní dostanú otázku „pridáš sa?" (Áno/Nie). Nepočítajú sa do %, série ani odznakov; odmena = ⭐ za každú splnenú na 100 %.
-- Spustiť celé naraz v SQL Editore projektu TipLab. Bezpečné opakovať.

alter table ww_cycle_challenges add column if not exists parent_id uuid references ww_cycle_challenges(id) on delete cascade;  -- pripojenie k cudzej osobnej výzve → pôvodný riadok
alter table ww_cycle_challenges drop constraint if exists ww_cycle_challenges_source_check;
alter table ww_cycle_challenges add constraint ww_cycle_challenges_source_check check (source in ('vote_majority','vote_rank','carry_over','random_pool','library','manual','catchup','personal'));
create table if not exists ww_personal_answers (
  cc_id uuid not null references ww_cycle_challenges(id) on delete cascade, user_id uuid not null references ww_users(id) on delete cascade,
  answer boolean not null, created_at timestamptz not null default now(), primary key (cc_id, user_id)
);
alter table ww_personal_answers enable row level security;
drop policy if exists ww_personal_answers_read on ww_personal_answers;
create policy ww_personal_answers_read on ww_personal_answers for select using (cc_id in (select cc.id from ww_cycle_challenges cc join ww_cycles cy on cy.id = cc.cycle_id where cy.group_id in (select ww_my_group_ids())));
insert into ww_app_config (key, value) values ('personal_max_per_cycle', '3') on conflict (key) do nothing;

-- % člena: skupinové + dobehnutie, BEZ osobných výziev
create or replace function ww_member_pct(p_user uuid, p_cycle uuid) returns numeric language sql stable as
$$ select coalesce(avg(ww_challenge_pct(p_user, cc.id)), 0) from ww_cycle_challenges cc where cc.cycle_id = p_cycle and (cc.for_user is null or cc.for_user = p_user) and cc.source <> 'personal' $$;

-- dobehnutie: osobné výzvy sa nedobiehajú; slot od najvyššieho použitého (dvaja členovia naraz si už nekolidujú na unique (cycle_id, slot_no))
create or replace function ww_start_catchup() returns int language plpgsql security definer set search_path = public as $$
declare g uuid; cur record; prev record; res record; n int := 0; cc record; k int;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status = 'active';
  if g is null then raise exception 'no_active_membership'; end if;
  select * into cur from ww_cycles where group_id = g and status = 'running' order by week_start desc limit 1;
  if cur is null then raise exception 'no_running_cycle'; end if;
  select * into prev from ww_cycles where group_id = g and week_start = cur.week_start - 7 and status = 'closed';
  if prev is null then raise exception 'no_previous_week'; end if;
  select * into res from ww_cycle_results where cycle_id = prev.id and user_id = auth.uid();
  if res is null or res.is_100 or res.caught_up or res.paused then raise exception 'nothing_to_catch_up'; end if;
  if exists (select 1 from ww_catchups where user_id = auth.uid() and from_cycle_id = prev.id) then raise exception 'already_started'; end if;
  insert into ww_catchups (user_id, from_cycle_id, to_cycle_id) values (auth.uid(), prev.id, cur.id);
  select greatest(coalesce(max(slot_no), 0), 90) into k from ww_cycle_challenges where cycle_id = cur.id;
  for cc in select * from ww_cycle_challenges where cycle_id = prev.id and (for_user is null or for_user = auth.uid()) and source <> 'personal' loop
    if ww_challenge_pct(auth.uid(), cc.id) < 1 then
      k := k + 1; n := n + 1;
      insert into ww_cycle_challenges (cycle_id, template_id, slot_no, source, for_user) values (cur.id, cc.template_id, k, 'catchup', auth.uid());
    end if;
  end loop;
  return n;
end $$;

-- pridať osobnú výzvu do bežiaceho týždňa (max personal_max_per_cycle vlastných na člena)
create or replace function ww_add_personal(p_template uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid; cur record; tp record; n int; k int; new_id uuid;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status = 'active';
  if g is null then raise exception 'no_active_membership'; end if;
  select * into cur from ww_cycles where group_id = g and status = 'running' order by week_start desc limit 1;
  if not found then raise exception 'no_running_cycle'; end if;
  select * into tp from ww_challenge_templates where id = p_template and is_active and (group_id is null or group_id = g);
  if not found then raise exception 'template_not_found'; end if;
  select count(*) into n from ww_cycle_challenges where cycle_id = cur.id and source = 'personal' and for_user = auth.uid() and parent_id is null;
  if n >= ww_cfg('personal_max_per_cycle', 3) then raise exception 'personal_limit'; end if;
  if exists (select 1 from ww_cycle_challenges where cycle_id = cur.id and source = 'personal' and for_user = auth.uid() and template_id = p_template) then raise exception 'already_added'; end if;
  select greatest(coalesce(max(slot_no), 0), 199) + 1 into k from ww_cycle_challenges where cycle_id = cur.id;
  insert into ww_cycle_challenges (cycle_id, template_id, slot_no, source, for_user) values (cur.id, p_template, k, 'personal', auth.uid()) returning id into new_id;
  insert into ww_events (group_id, user_id, type, ref_id, payload) values (g, auth.uid(), 'personal', new_id, jsonb_build_object('title', tp.title_sk, 'title_en', tp.title_en));
  return new_id;
end $$;

-- odpoveď na cudziu osobnú výzvu: Áno = dostanem ju tiež (vlastný riadok), Nie = zmizne otázka; Áno → Nie len kým nemám zápis
create or replace function ww_answer_personal(p_cc uuid, p_yes boolean) returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid; root record; cy record; tp record; child uuid; k int;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status = 'active';
  if g is null then raise exception 'no_active_membership'; end if;
  select * into root from ww_cycle_challenges where id = p_cc and source = 'personal' and parent_id is null;
  if not found then raise exception 'not_found'; end if;
  select * into cy from ww_cycles where id = root.cycle_id;
  if cy.group_id <> g or cy.status <> 'running' then raise exception 'not_running'; end if;
  if root.for_user = auth.uid() then raise exception 'own_challenge'; end if;
  select id into child from ww_cycle_challenges where parent_id = p_cc and for_user = auth.uid();
  if p_yes then
    if child is null then
      select greatest(coalesce(max(slot_no), 0), 199) + 1 into k from ww_cycle_challenges where cycle_id = cy.id;
      insert into ww_cycle_challenges (cycle_id, template_id, slot_no, source, for_user, parent_id) values (cy.id, root.template_id, k, 'personal', auth.uid(), p_cc) returning id into child;
      select title_sk, title_en into tp from ww_challenge_templates where id = root.template_id;
      insert into ww_events (group_id, user_id, type, ref_id, payload) values (g, auth.uid(), 'personal_join', child, jsonb_build_object('title', tp.title_sk, 'title_en', tp.title_en, 'owner', root.for_user));
    end if;
  elsif child is not null then
    if exists (select 1 from ww_logs where cycle_challenge_id = child) then raise exception 'has_logs'; end if;
    delete from ww_events where ref_id = child and type = 'personal_join';
    delete from ww_cycle_challenges where id = child;
    child := null;
  end if;
  insert into ww_personal_answers (cc_id, user_id, answer) values (p_cc, auth.uid(), p_yes)
    on conflict (cc_id, user_id) do update set answer = excluded.answer, created_at = now();
  return child;
end $$;

-- vlastnú osobnú výzvu možno zmazať / zmeniť len kým nemá zápis a nikto sa nepripojil
create or replace function ww_personal_editable(p_cc uuid) returns void language plpgsql security definer set search_path = public as $$
declare root record;
begin
  select cc.* into root from ww_cycle_challenges cc join ww_cycles cy on cy.id = cc.cycle_id where cc.id = p_cc and cc.source = 'personal' and cc.parent_id is null and cc.for_user = auth.uid() and cy.status = 'running';
  if not found then raise exception 'not_found'; end if;
  if exists (select 1 from ww_logs where cycle_challenge_id = p_cc) then raise exception 'has_logs'; end if;
  if exists (select 1 from ww_cycle_challenges where parent_id = p_cc) then raise exception 'has_participants'; end if;
end $$;
create or replace function ww_delete_personal(p_cc uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  perform ww_personal_editable(p_cc);
  delete from ww_events where ref_id = p_cc and type = 'personal';
  delete from ww_cycle_challenges where id = p_cc;
end $$;
create or replace function ww_update_personal(p_cc uuid, p_template uuid) returns void language plpgsql security definer set search_path = public as $$
declare tp record;
begin
  perform ww_personal_editable(p_cc);
  select t.* into tp from ww_challenge_templates t where t.id = p_template and t.is_active and (t.group_id is null or t.group_id in (select ww_my_group_ids()));
  if not found then raise exception 'template_not_found'; end if;
  update ww_cycle_challenges set template_id = p_template where id = p_cc;
  update ww_events set payload = jsonb_build_object('title', tp.title_sk, 'title_en', tp.title_en) where ref_id = p_cc and type = 'personal';
end $$;

-- ⭐ hviezdičky: počet osobných výziev (vlastných aj pripojených) splnených na 100 %, za celú históriu skupiny
-- p_except = cyklus, ktorý sa nezaráta (appka si bežiaci týždeň dopočíta naživo zo zápisov)
create or replace function ww_personal_stars(p_group uuid, p_except uuid default null) returns table (user_id uuid, stars int) language sql stable as
$$ select cc.for_user, count(*)::int from ww_cycle_challenges cc join ww_cycles cy on cy.id = cc.cycle_id
   where cy.group_id = p_group and cc.source = 'personal' and (p_except is null or cc.cycle_id <> p_except) and ww_challenge_pct(cc.for_user, cc.id) >= 1 group by cc.for_user $$;

notify pgrst, 'reload schema';
