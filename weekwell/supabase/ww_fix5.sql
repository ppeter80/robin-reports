-- Weekwell fix 5 (2026-09-13): dávka B – #4 odznaky namiesto extra bodov, #5 dobehnutie týždňa.
-- Spustiť celé naraz v SQL Editore projektu TipLab. Bezpečné opakovať.

alter table ww_cycle_results add column if not exists badges_earned int not null default 0;   -- odznaky získané v tomto týždni (= poradie v streaku)
alter table ww_cycle_results add column if not exists badges_after int not null default 0;    -- kumulatívne
alter table ww_cycle_results add column if not exists caught_up boolean not null default false;
alter table ww_cycle_challenges add column if not exists for_user uuid references ww_users(id) on delete cascade;  -- catch-up položka len pre jedného člena
alter table ww_cycle_challenges drop constraint if exists ww_cycle_challenges_source_check;
alter table ww_cycle_challenges add constraint ww_cycle_challenges_source_check check (source in ('vote_majority','vote_rank','carry_over','random_pool','library','manual','catchup'));
create table if not exists ww_catchups (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references ww_users(id) on delete cascade,
  from_cycle_id uuid not null references ww_cycles(id) on delete cascade, to_cycle_id uuid not null references ww_cycles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','done','failed')), created_at timestamptz not null default now(),
  unique (user_id, from_cycle_id)
);
alter table ww_catchups enable row level security;
drop policy if exists ww_catchups_read on ww_catchups; create policy ww_catchups_read on ww_catchups for select using (to_cycle_id in (select id from ww_cycles where group_id in (select ww_my_group_ids())));

-- % člena: len výzvy pre všetkých alebo pre neho
create or replace function ww_member_pct(p_user uuid, p_cycle uuid) returns numeric language sql stable as
$$ select coalesce(avg(ww_challenge_pct(p_user, cc.id)), 0) from ww_cycle_challenges cc where cc.cycle_id = p_cycle and (cc.for_user is null or cc.for_user = p_user) $$;

-- #5 začať dobehnutie: len minulý (uzavretý, nesplnený) týždeň → do bežiaceho pridá catch-up položky
create or replace function ww_start_catchup() returns int language plpgsql security definer set search_path = public as $$
declare g uuid; cur record; prev record; res record; n int := 0; cc record; k int := 90;
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
  for cc in select * from ww_cycle_challenges where cycle_id = prev.id and (for_user is null or for_user = auth.uid()) loop
    if ww_challenge_pct(auth.uid(), cc.id) < 1 then
      k := k + 1; n := n + 1;
      insert into ww_cycle_challenges (cycle_id, template_id, slot_no, source, for_user) values (cur.id, cc.template_id, k, 'catchup', auth.uid());
    end if;
  end loop;
  return n;
end $$;

-- uzávierka: %, streak (len 100 %), ODZNAKY (N-tý týždeň streaku = N odznakov), dobehnutie, auto-pauza
create or replace function ww_close_cycle(p_cycle uuid) returns void language plpgsql security definer set search_path = public as $$
declare c record; mem record; v_pct numeric; st_prev int; ex_prev int; bd_prev int; st int; ex int; bd int; earned int; n int; nolog int; v_paused boolean; cu record; reg_ok boolean; cu_ok boolean; from_res record; st_before int; bd_before int;
begin
  select * into c from ww_cycles where id = p_cycle;
  if c.status = 'closed' then return; end if;
  n := ww_cfg('streak_points_every_n_cycles', 2);
  for mem in select * from ww_memberships where group_id = c.group_id and status <> 'left' loop
    v_paused := mem.status = 'paused';
    v_pct := case when v_paused then 0 else ww_member_pct(mem.user_id, p_cycle) end;
    st_prev := null; ex_prev := null; bd_prev := null;
    select r.streak_after, r.extra_points_after, r.badges_after into st_prev, ex_prev, bd_prev from ww_cycle_results r join ww_cycles cy on cy.id = r.cycle_id where r.user_id = mem.user_id and cy.group_id = c.group_id and cy.week_start < c.week_start order by cy.week_start desc limit 1;
    st := coalesce(st_prev, 0); ex := coalesce(ex_prev, 0); bd := coalesce(bd_prev, 0); earned := 0;
    -- #5 dobehnutie: ak má catch-up do tohto cyklu a splnil bežné aj catch-up položky → minulý týždeň sa počíta ako splnený
    select * into cu from ww_catchups where user_id = mem.user_id and to_cycle_id = p_cycle and status = 'pending';
    if cu is not null and not v_paused then
      select coalesce(bool_and(ww_challenge_pct(mem.user_id, cc.id) >= 1), true) into reg_ok from ww_cycle_challenges cc where cc.cycle_id = p_cycle and cc.for_user is null;
      select coalesce(bool_and(ww_challenge_pct(mem.user_id, cc.id) >= 1), true) into cu_ok from ww_cycle_challenges cc where cc.cycle_id = p_cycle and cc.for_user = mem.user_id and cc.source = 'catchup';
      if reg_ok and cu_ok then
        -- minulý týždeň: streak pokračuje, odznaky sa doplnia
        select r.streak_after, r.badges_after into st_before, bd_before from ww_cycle_results r join ww_cycles cy on cy.id = r.cycle_id where r.user_id = mem.user_id and cy.group_id = c.group_id and cy.week_start < c.week_start - 7 order by cy.week_start desc limit 1;
        st := coalesce(st_before, 0) + 1; bd := coalesce(bd_before, 0) + st;
        update ww_cycle_results set is_100 = true, pct = 100, caught_up = true, streak_after = st, badges_earned = st, badges_after = bd where cycle_id = cu.from_cycle_id and user_id = mem.user_id;
        update ww_catchups set status = 'done' where id = cu.id;
        insert into ww_events (group_id, user_id, type, ref_id, payload) values (c.group_id, mem.user_id, 'caught_up', cu.from_cycle_id, jsonb_build_object('badges', st));
        v_pct := 1;
      else
        update ww_catchups set status = 'failed' where id = cu.id;
      end if;
    end if;
    if not v_paused then
      if v_pct >= 1 then
        st := st + 1; earned := st; bd := bd + earned;                              -- #4: N-tý týždeň = N odznakov
        if st % n = 0 then ex := ex + 1; end if;
        insert into ww_events (group_id, user_id, type, ref_id, payload) values (c.group_id, mem.user_id, 'badges', p_cycle, jsonb_build_object('n', earned, 'streak', st));
      else st := 0; end if;
    end if;
    insert into ww_cycle_results (cycle_id, user_id, pct, is_100, streak_after, extra_points_after, paused, badges_earned, badges_after)
      values (p_cycle, mem.user_id, round(v_pct * 100), v_pct >= 1, st, ex, v_paused, earned, bd)
      on conflict (cycle_id, user_id) do update set pct = excluded.pct, is_100 = excluded.is_100, streak_after = excluded.streak_after, extra_points_after = excluded.extra_points_after, paused = excluded.paused, badges_earned = excluded.badges_earned, badges_after = excluded.badges_after;
    if not v_paused then
      select count(*) into nolog from (select cy.id from ww_cycles cy where cy.group_id = c.group_id and cy.week_start <= c.week_start and cy.status in ('running','closed') order by cy.week_start desc limit ww_cfg('autopause_force_after', 3)) q
        where not exists (select 1 from ww_logs l join ww_cycle_challenges cc on cc.id = l.cycle_challenge_id where cc.cycle_id = q.id and l.user_id = mem.user_id);
      if nolog >= ww_cfg('autopause_force_after', 3) then update ww_memberships set status = 'paused', paused_until = null where group_id = c.group_id and user_id = mem.user_id; insert into ww_events (group_id, user_id, type, payload) values (c.group_id, mem.user_id, 'pause', '{"auto":true}'); end if;
    end if;
    if v_paused and mem.paused_until is not null and mem.paused_until <= c.week_start + 7 then update ww_memberships set status = 'active', paused_until = null where group_id = c.group_id and user_id = mem.user_id; end if;
  end loop;
  update ww_cycles set status = 'closed', closed_at = now() where id = p_cycle;
end $$;

notify pgrst, 'reload schema';
