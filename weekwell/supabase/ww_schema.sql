-- ============================================================================
-- Weekwell — schéma + logika (iterácia 1), spec v0.3 kap. 4, 6, 10, 13.
-- Beží v Supabase projekte tipovačky (TipLab: chekxmexwigvbqclrrin): všetky objekty s prefixom ww_.
-- Spustiť celé naraz v SQL editore. Idempotentné (drop-if-exists) – dá sa spustiť znova.
-- ============================================================================
create extension if not exists pgcrypto;
create extension if not exists pg_cron;

-- ---------- tabuľky ----------
create table if not exists ww_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null, avatar_url text, locale text not null default 'sk', tz text not null default 'Europe/Bratislava',
  checkin_time time not null default '20:30',
  notif_prefs jsonb not null default '{"checkin":true,"reminder":true,"social":true,"proposals":true}',
  consent_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists ww_groups (
  id uuid primary key default gen_random_uuid(), name text not null, emoji text default '💪', admin_id uuid not null references ww_users(id),
  slots int not null default 3 check (slots between 2 and 4),
  allowed_categories text[] not null default '{movement,nutrition,alcohol,sleep,mental,lifestyle}',
  tz text not null default 'Europe/Bratislava', reward_text text,
  status text not null default 'active' check (status in ('active','paused','archived')), created_at timestamptz not null default now()
);
create table if not exists ww_memberships (
  group_id uuid not null references ww_groups(id) on delete cascade, user_id uuid not null references ww_users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member')),
  status text not null default 'active' check (status in ('active','paused','left')),
  paused_until date, joined_at timestamptz not null default now(), left_at timestamptz, primary key (group_id, user_id)
);
create unique index if not exists ww_memberships_one_active_per_user on ww_memberships(user_id) where status <> 'left';
create table if not exists ww_invites (code text primary key, group_id uuid not null references ww_groups(id) on delete cascade, created_by uuid references ww_users(id), expires_at timestamptz not null, uses int not null default 0);
create table if not exists ww_challenge_templates (
  id uuid primary key default gen_random_uuid(), group_id uuid references ww_groups(id) on delete cascade,  -- null = globálna knižnica
  title_sk text not null, title_en text not null,
  category text not null check (category in ('movement','nutrition','alcohol','sleep','mental','lifestyle')),
  type text not null check (type in ('binary_daily','count_daily','count_weekly','once')),
  target numeric not null, unit text not null default 'days', min_days int,
  proof text not null default 'optional' check (proof in ('optional','required')), difficulty text check (difficulty in ('easy','medium','hard')),
  created_by uuid references ww_users(id), is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists ww_cycles (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references ww_groups(id) on delete cascade, week_start date not null,
  status text not null default 'proposing' check (status in ('proposing','voting','selected','running','closed')),
  selected_at timestamptz, closed_at timestamptz, unique (group_id, week_start)
);
create table if not exists ww_proposals (id uuid primary key default gen_random_uuid(), cycle_id uuid not null references ww_cycles(id) on delete cascade, template_id uuid not null references ww_challenge_templates(id), authors uuid[] not null, created_at timestamptz not null default now(), removed_by uuid, unique (cycle_id, template_id));
create table if not exists ww_vetoes (cycle_id uuid not null references ww_cycles(id) on delete cascade, proposal_id uuid not null references ww_proposals(id) on delete cascade, by_user uuid not null references ww_users(id), against_user uuid not null references ww_users(id), primary key (cycle_id, by_user, against_user));
create table if not exists ww_votes (cycle_id uuid not null references ww_cycles(id) on delete cascade, proposal_id uuid not null references ww_proposals(id) on delete cascade, user_id uuid not null references ww_users(id), primary key (cycle_id, proposal_id, user_id));
create table if not exists ww_cycle_challenges (id uuid primary key default gen_random_uuid(), cycle_id uuid not null references ww_cycles(id) on delete cascade, template_id uuid not null references ww_challenge_templates(id), slot_no int not null, source text not null check (source in ('vote_majority','vote_rank','carry_over','random_pool','library','manual')), votes_at_selection int not null default 0, unique (cycle_id, slot_no));
create table if not exists ww_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references ww_users(id) on delete cascade,
  cycle_challenge_id uuid not null references ww_cycle_challenges(id) on delete cascade, date date not null,
  done boolean, value numeric, note text check (char_length(note) <= 140), proof_url text,
  proof_type text check (proof_type in ('photo','strava','verified')), logged_at timestamptz not null default now(),
  unique (user_id, cycle_challenge_id, date)
);
create table if not exists ww_goals (id uuid primary key default gen_random_uuid(), user_id uuid not null references ww_users(id) on delete cascade, metric text not null, direction text not null check (direction in ('up','down')), target numeric not null, start_value numeric, start_at date not null default current_date, interval text not null default 'weekly' check (interval in ('daily','weekly','free')), share_progress boolean not null default false, status text not null default 'active', created_at timestamptz not null default now());
create table if not exists ww_metric_entries (id uuid primary key default gen_random_uuid(), user_id uuid not null references ww_users(id) on delete cascade, metric text not null, date date not null, value numeric not null, unique (user_id, metric, date));
create table if not exists ww_events (id uuid primary key default gen_random_uuid(), group_id uuid not null references ww_groups(id) on delete cascade, user_id uuid references ww_users(id), type text not null, ref_id uuid, payload jsonb, created_at timestamptz not null default now());
create table if not exists ww_reactions (event_id uuid not null references ww_events(id) on delete cascade, from_user uuid not null references ww_users(id) on delete cascade, emoji text not null, primary key (event_id, from_user, emoji));
create table if not exists ww_comments (id uuid primary key default gen_random_uuid(), event_id uuid not null references ww_events(id) on delete cascade, user_id uuid not null references ww_users(id) on delete cascade, text text not null check (char_length(text) <= 280), created_at timestamptz not null default now(), deleted_at timestamptz, deleted_by uuid);
create table if not exists ww_cycle_results (cycle_id uuid not null references ww_cycles(id) on delete cascade, user_id uuid not null references ww_users(id) on delete cascade, pct numeric not null, is_100 boolean not null, streak_after int not null, extra_points_after int not null, paused boolean not null default false, primary key (cycle_id, user_id));
create table if not exists ww_weekly_reports (cycle_id uuid not null references ww_cycles(id) on delete cascade, user_id uuid not null references ww_users(id) on delete cascade, payload jsonb not null, sent_at timestamptz, primary key (cycle_id, user_id));
create table if not exists ww_push_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references ww_users(id) on delete cascade, subscription jsonb not null, created_at timestamptz not null default now());
create table if not exists ww_app_config (key text primary key, value jsonb not null);
insert into ww_app_config (key, value) values ('category_max_per_cycle', '2'), ('streak_points_every_n_cycles', '2'), ('autopause_suggest_after', '2'), ('autopause_force_after', '3'), ('library_no_repeat_cycles', '2') on conflict (key) do nothing;

-- ---------- pomocné funkcie ----------
create or replace function ww_my_group_ids() returns setof uuid language sql stable security definer set search_path = public as
$$ select group_id from ww_memberships where user_id = auth.uid() and status <> 'left' $$;
create or replace function ww_cfg(k text, d int) returns int language sql stable as
$$ select coalesce((select (value)::text::int from ww_app_config where key = k), d) $$;

-- nový auth používateľ → ww_users (meno/fotka z Google metadát) + vlastná solo skupina (spec 10: solo = skupina s 1 členom)
create or replace function ww_handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare g uuid; nm text;
begin
  nm := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Weekweller');
  insert into ww_users (id, name, avatar_url) values (new.id, nm, new.raw_user_meta_data->>'avatar_url') on conflict (id) do nothing;
  insert into ww_groups (name, emoji, admin_id) values (nm, '🌱', new.id) returning id into g;
  insert into ww_memberships (group_id, user_id, role) values (g, new.id, 'admin');
  insert into ww_events (group_id, user_id, type) values (g, new.id, 'join');
  return new;
end $$;
drop trigger if exists ww_on_auth_user_created on auth.users;
create trigger ww_on_auth_user_created after insert on auth.users for each row execute function ww_handle_new_user();

-- pozvánka: vytvoriť kód (admin) / pripojiť sa (opustí svoju solo skupinu, ak je v nej sám)
create or replace function ww_create_invite() returns text language plpgsql security definer set search_path = public, extensions as $$
declare g uuid; c text;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status <> 'left';
  if g is null then raise exception 'no group'; end if;
  c := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 6));
  insert into ww_invites (code, group_id, created_by, expires_at) values (c, g, auth.uid(), now() + interval '7 days');
  return c;
end $$;
create or replace function ww_join_group(p_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare inv record; cur uuid; n int;
begin
  select * into inv from ww_invites where code = upper(p_code) and expires_at > now();
  if inv is null then raise exception 'invalid_or_expired_code'; end if;
  select count(*) into n from ww_memberships where group_id = inv.group_id and status <> 'left';
  if n >= 10 then raise exception 'group_full'; end if;
  select group_id into cur from ww_memberships where user_id = auth.uid() and status <> 'left';
  if cur = inv.group_id then return cur; end if;
  if cur is not null then
    select count(*) into n from ww_memberships where group_id = cur and status <> 'left';
    if n > 1 then raise exception 'leave_current_group_first'; end if;
    update ww_memberships set status = 'left', left_at = now() where user_id = auth.uid() and group_id = cur;
    update ww_groups set status = 'archived' where id = cur;
  end if;
  insert into ww_memberships (group_id, user_id, role) values (inv.group_id, auth.uid(), 'member');
  update ww_invites set uses = uses + 1 where code = inv.code;
  insert into ww_events (group_id, user_id, type) values (inv.group_id, auth.uid(), 'join');
  return inv.group_id;
end $$;

-- pauza člena (spec 10): od dnes / na N týždňov; návrat
create or replace function ww_set_pause(p_weeks int) returns void language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status <> 'left';
  if p_weeks is null or p_weeks <= 0 then
    update ww_memberships set status = 'active', paused_until = null where user_id = auth.uid() and group_id = g;
  else
    update ww_memberships set status = 'paused', paused_until = (date_trunc('week', current_date)::date + (7 * p_weeks)) where user_id = auth.uid() and group_id = g;
    insert into ww_events (group_id, user_id, type) values (g, auth.uid(), 'pause');
  end if;
end $$;

-- % splnenia výzvy člena (spec 3.1); strop 100 %
create or replace function ww_challenge_pct(p_user uuid, p_cc uuid) returns numeric language plpgsql stable as $$
declare t record; v numeric;
begin
  select ct.type, ct.target, coalesce(ct.min_days, 5) as min_days into t from ww_cycle_challenges cc join ww_challenge_templates ct on ct.id = cc.template_id where cc.id = p_cc;
  if t.type = 'binary_daily' then select count(*) into v from ww_logs where user_id = p_user and cycle_challenge_id = p_cc and done; return least(v / t.target, 1);
  elsif t.type = 'once' then select count(*) into v from ww_logs where user_id = p_user and cycle_challenge_id = p_cc and done; return case when v > 0 then 1 else 0 end;
  elsif t.type = 'count_daily' then select count(*) into v from ww_logs where user_id = p_user and cycle_challenge_id = p_cc and value >= t.target; return least(v / t.min_days, 1);
  else select coalesce(sum(value), 0) into v from ww_logs where user_id = p_user and cycle_challenge_id = p_cc; return least(v / t.target, 1);
  end if;
end $$;
create or replace function ww_member_pct(p_user uuid, p_cycle uuid) returns numeric language sql stable as
$$ select coalesce(avg(ww_challenge_pct(p_user, cc.id)), 0) from ww_cycle_challenges cc where cc.cycle_id = p_cycle $$;

-- ---------- engine výberu (spec 4.3) ----------
create or replace function ww_select_challenges(p_cycle uuid) returns void language plpgsql security definer set search_path = public as $$
declare c record; m int; n_slots int; catmax int; slot int := 0; r record; cnt jsonb := '{}'; prev uuid; used uuid[] := '{}'; allowed text[];
begin
  select * into c from ww_cycles where id = p_cycle;
  if c.status not in ('proposing','voting') then return; end if;
  select count(*) into m from ww_memberships where group_id = c.group_id and status = 'active';
  select g.slots, g.allowed_categories into n_slots, allowed from ww_groups g where g.id = c.group_id;
  catmax := ww_cfg('category_max_per_cycle', 2);
  delete from ww_cycle_challenges where cycle_id = p_cycle;
  -- kandidáti v poradí: väčšina (podľa hlasov) → ostatní s hlasmi → prenos z minulého cyklu → bez hlasov (náhodne) → knižnica (náhodne, nie v posledných 2 cykloch)
  select id into prev from ww_cycles where group_id = c.group_id and week_start = c.week_start - 7;
  for r in
    with pool as (
      select p.id as pid, p.template_id, ct.category, (select count(*) from ww_votes v where v.proposal_id = p.id) as votes
      from ww_proposals p join ww_challenge_templates ct on ct.id = p.template_id
      where p.cycle_id = p_cycle and p.removed_by is null and not exists (select 1 from ww_vetoes x where x.proposal_id = p.id)
    ),
    cand as (
      select template_id, category, votes, 'vote_majority' as src, 1 as tier, random() as rnd from pool where votes > m / 2.0
      union all select template_id, category, votes, 'vote_rank', 2, random() from pool where votes > 0 and votes <= m / 2.0
      union all select cc.template_id, ct.category, 0, 'carry_over', 3, cc.slot_no from ww_cycle_challenges cc join ww_challenge_templates ct on ct.id = cc.template_id where cc.cycle_id = prev
      union all select template_id, category, 0, 'random_pool', 4, random() from pool where votes = 0
      union all select ct.id, ct.category, 0, 'library', 5, random() from ww_challenge_templates ct
        where ct.group_id is null and ct.is_active and ct.category = any (allowed)
          and not exists (select 1 from ww_cycle_challenges cc2 join ww_cycles cy on cy.id = cc2.cycle_id where cy.group_id = c.group_id and cc2.template_id = ct.id and cy.week_start >= c.week_start - 7 * ww_cfg('library_no_repeat_cycles', 2))
    )
    select * from cand order by tier, votes desc, rnd
  loop
    exit when slot >= n_slots;
    if r.template_id = any (used) then continue; end if;
    if coalesce((cnt->>r.category)::int, 0) >= catmax then continue; end if;
    slot := slot + 1; used := used || r.template_id; cnt := cnt || jsonb_build_object(r.category, coalesce((cnt->>r.category)::int, 0) + 1);
    insert into ww_cycle_challenges (cycle_id, template_id, slot_no, source, votes_at_selection) values (p_cycle, r.template_id, slot, r.src, r.votes);
  end loop;
  update ww_cycles set status = 'selected', selected_at = now() where id = p_cycle;
  insert into ww_events (group_id, user_id, type, ref_id) values (c.group_id, null, 'selected', p_cycle);
end $$;

-- ---------- uzávierka cyklu (spec 6): %, streak (len 100 %), extra body (+1 za každé 2), auto-pauza (spec 10) ----------
create or replace function ww_close_cycle(p_cycle uuid) returns void language plpgsql security definer set search_path = public as $$
declare c record; mem record; v_pct numeric; st_prev int; ex_prev int; st int; ex int; n int; nolog int; v_paused boolean;
begin
  select * into c from ww_cycles where id = p_cycle;
  if c.status = 'closed' then return; end if;
  n := ww_cfg('streak_points_every_n_cycles', 2);
  for mem in select * from ww_memberships where group_id = c.group_id and status <> 'left' loop
    v_paused := mem.status = 'paused';
    v_pct := case when v_paused then 0 else ww_member_pct(mem.user_id, p_cycle) end;
    st_prev := null; ex_prev := null;
    select r.streak_after, r.extra_points_after into st_prev, ex_prev from ww_cycle_results r join ww_cycles cy on cy.id = r.cycle_id where r.user_id = mem.user_id and cy.group_id = c.group_id and cy.week_start < c.week_start order by cy.week_start desc limit 1;
    st := coalesce(st_prev, 0); ex := coalesce(ex_prev, 0);
    if not v_paused then
      if v_pct >= 1 then st := st + 1; if st % n = 0 then ex := ex + 1; insert into ww_events (group_id, user_id, type, ref_id) values (c.group_id, mem.user_id, 'extra', p_cycle); end if;
      else st := 0; end if;
    end if;
    insert into ww_cycle_results (cycle_id, user_id, pct, is_100, streak_after, extra_points_after, paused)
      values (p_cycle, mem.user_id, round(v_pct * 100), v_pct >= 1, st, ex, v_paused) on conflict (cycle_id, user_id) do update set pct = excluded.pct, is_100 = excluded.is_100, streak_after = excluded.streak_after, extra_points_after = excluded.extra_points_after, paused = excluded.paused;
    -- auto-pauza: N uzavretých cyklov bez jediného zápisu
    if not v_paused then
      select count(*) into nolog from (select cy.id from ww_cycles cy where cy.group_id = c.group_id and cy.week_start <= c.week_start and cy.status in ('running','closed') order by cy.week_start desc limit ww_cfg('autopause_force_after', 3)) q
        where not exists (select 1 from ww_logs l join ww_cycle_challenges cc on cc.id = l.cycle_challenge_id where cc.cycle_id = q.id and l.user_id = mem.user_id);
      if nolog >= ww_cfg('autopause_force_after', 3) then update ww_memberships set status = 'paused', paused_until = null where group_id = c.group_id and user_id = mem.user_id; insert into ww_events (group_id, user_id, type, payload) values (c.group_id, mem.user_id, 'pause', '{"auto":true}'); end if;
    end if;
    -- návrat z pauzy po termíne
    if v_paused and mem.paused_until is not null and mem.paused_until <= c.week_start + 7 then update ww_memberships set status = 'active', paused_until = null where group_id = c.group_id and user_id = mem.user_id; end if;
  end loop;
  update ww_cycles set status = 'closed', closed_at = now() where id = p_cycle;
end $$;

-- ---------- hodinový tick: fázy podľa lokálneho času skupiny (rieši aj DST) ----------
create or replace function ww_tick() returns void language plpgsql security definer set search_path = public as $$
declare g record; lt timestamp; dow int; hr int; wk date; nxt date; cyc record;
begin
  for g in select * from ww_groups where status = 'active' loop
    lt := now() at time zone g.tz; dow := extract(isodow from lt); hr := extract(hour from lt);
    wk := date_trunc('week', lt)::date; nxt := wk + 7;
    -- bežiaci cyklus existuje vždy (od pondelka 00:00)
    insert into ww_cycles (group_id, week_start, status) values (g.id, wk, 'running') on conflict (group_id, week_start) do nothing;
    update ww_cycles set status = 'running' where group_id = g.id and week_start = wk and status = 'selected';
    -- budúci cyklus: proposing od pondelka; voting od piatka 18:00; výber v nedeľu 18:00
    insert into ww_cycles (group_id, week_start, status) values (g.id, nxt, 'proposing') on conflict (group_id, week_start) do nothing;
    select * into cyc from ww_cycles where group_id = g.id and week_start = nxt;
    if cyc.status = 'proposing' and (dow > 5 or (dow = 5 and hr >= 18)) then update ww_cycles set status = 'voting' where id = cyc.id; end if;
    if cyc.status in ('proposing','voting') and dow = 7 and hr >= 18 then perform ww_select_challenges(cyc.id); end if;
    -- uzávierka minulého cyklu po nedeľnej polnoci (pondelok 00:xx)
    for cyc in select * from ww_cycles where group_id = g.id and week_start < wk and status in ('running','selected') loop
      perform ww_close_cycle(cyc.id);
    end loop;
  end loop;
end $$;
select cron.unschedule(jobid) from cron.job where jobname = 'ww_tick';
select cron.schedule('ww_tick', '5 * * * *', $$select ww_tick()$$);

-- zmazanie účtu (GDPR): anonymizuje v histórii skupiny, zmaže osobné dáta; auth používateľa zmaže Robin/admin (alebo Supabase Auth API)
create or replace function ww_delete_me() returns void language plpgsql security definer set search_path = public as $$
declare g uuid; n int;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status <> 'left';
  delete from ww_logs where user_id = auth.uid(); delete from ww_metric_entries where user_id = auth.uid(); delete from ww_goals where user_id = auth.uid();
  delete from ww_votes where user_id = auth.uid(); delete from ww_vetoes where by_user = auth.uid(); delete from ww_reactions where from_user = auth.uid();
  update ww_comments set text = '—', deleted_at = now(), deleted_by = auth.uid() where user_id = auth.uid();
  update ww_memberships set status = 'left', left_at = now() where user_id = auth.uid();
  update ww_users set name = 'bývalý člen', avatar_url = null, notif_prefs = '{}' where id = auth.uid();
  if g is not null then select count(*) into n from ww_memberships where group_id = g and status <> 'left'; if n = 0 then update ww_groups set status = 'archived' where id = g; end if; end if;
end $$;

-- ---------- RLS ----------
alter table ww_users enable row level security; alter table ww_groups enable row level security; alter table ww_memberships enable row level security; alter table ww_invites enable row level security;
alter table ww_challenge_templates enable row level security; alter table ww_cycles enable row level security; alter table ww_proposals enable row level security; alter table ww_vetoes enable row level security; alter table ww_votes enable row level security;
alter table ww_cycle_challenges enable row level security; alter table ww_logs enable row level security; alter table ww_goals enable row level security; alter table ww_metric_entries enable row level security;
alter table ww_events enable row level security; alter table ww_reactions enable row level security; alter table ww_comments enable row level security; alter table ww_cycle_results enable row level security; alter table ww_weekly_reports enable row level security; alter table ww_push_subscriptions enable row level security; alter table ww_app_config enable row level security;
do $$ declare p record; begin for p in select policyname, tablename from pg_policies where schemaname = 'public' and tablename like 'ww\_%' loop execute format('drop policy %I on %I', p.policyname, p.tablename); end loop; end $$;
create policy ww_users_read on ww_users for select using (id = auth.uid() or id in (select user_id from ww_memberships where group_id in (select ww_my_group_ids())));
create policy ww_users_self on ww_users for update using (id = auth.uid());
create policy ww_groups_read on ww_groups for select using (id in (select ww_my_group_ids()));
create policy ww_groups_admin on ww_groups for update using (admin_id = auth.uid());
create policy ww_memberships_read on ww_memberships for select using (group_id in (select ww_my_group_ids()));
create policy ww_invites_read on ww_invites for select using (group_id in (select ww_my_group_ids()));
create policy ww_templates_read on ww_challenge_templates for select using (group_id is null or group_id in (select ww_my_group_ids()));
create policy ww_templates_insert on ww_challenge_templates for insert with check (created_by = auth.uid() and group_id in (select ww_my_group_ids()));
create policy ww_cycles_read on ww_cycles for select using (group_id in (select ww_my_group_ids()));
create policy ww_proposals_read on ww_proposals for select using (cycle_id in (select id from ww_cycles where group_id in (select ww_my_group_ids())));
create policy ww_proposals_insert on ww_proposals for insert with check (auth.uid() = any (authors) and cycle_id in (select id from ww_cycles where status in ('proposing','voting') and group_id in (select ww_my_group_ids())));
create policy ww_proposals_update on ww_proposals for update using (cycle_id in (select id from ww_cycles where group_id in (select ww_my_group_ids())));
create policy ww_proposals_delete on ww_proposals for delete using (auth.uid() = any (authors));
create policy ww_votes_own on ww_votes for all using (user_id = auth.uid()) with check (user_id = auth.uid() and cycle_id in (select id from ww_cycles where status in ('proposing','voting')) and not exists (select 1 from ww_proposals p where p.id = proposal_id and auth.uid() = any (p.authors)));
create policy ww_votes_read on ww_votes for select using (cycle_id in (select id from ww_cycles where status in ('selected','running','closed') and group_id in (select ww_my_group_ids())));
create policy ww_vetoes_own on ww_vetoes for all using (by_user = auth.uid()) with check (by_user = auth.uid() and against_user <> auth.uid() and cycle_id in (select id from ww_cycles where status in ('proposing','voting')) and exists (select 1 from ww_proposals p where p.id = proposal_id and against_user = any (p.authors) and not (auth.uid() = any (p.authors))));
create policy ww_cc_read on ww_cycle_challenges for select using (cycle_id in (select id from ww_cycles where group_id in (select ww_my_group_ids())));
create policy ww_logs_read on ww_logs for select using (user_id = auth.uid() or cycle_challenge_id in (select cc.id from ww_cycle_challenges cc join ww_cycles cy on cy.id = cc.cycle_id where cy.group_id in (select ww_my_group_ids())));
create policy ww_logs_write on ww_logs for insert with check (user_id = auth.uid() and cycle_challenge_id in (select cc.id from ww_cycle_challenges cc join ww_cycles cy on cy.id = cc.cycle_id where cy.status = 'running' and date between cy.week_start and cy.week_start + 6 and date <= (now() at time zone (select tz from ww_groups where id = cy.group_id))::date));
create policy ww_logs_update on ww_logs for update using (user_id = auth.uid() and cycle_challenge_id in (select cc.id from ww_cycle_challenges cc join ww_cycles cy on cy.id = cc.cycle_id where cy.status = 'running'));
create policy ww_logs_delete on ww_logs for delete using (user_id = auth.uid() and cycle_challenge_id in (select cc.id from ww_cycle_challenges cc join ww_cycles cy on cy.id = cc.cycle_id where cy.status = 'running'));
create policy ww_goals_own on ww_goals for all using (user_id = auth.uid());
create policy ww_goals_shared on ww_goals for select using (share_progress and user_id in (select user_id from ww_memberships where group_id in (select ww_my_group_ids())));
create policy ww_metrics_own on ww_metric_entries for all using (user_id = auth.uid());
create policy ww_events_read on ww_events for select using (group_id in (select ww_my_group_ids()));
create policy ww_events_insert on ww_events for insert with check (user_id = auth.uid() and group_id in (select ww_my_group_ids()));
create policy ww_reactions_read on ww_reactions for select using (event_id in (select id from ww_events where group_id in (select ww_my_group_ids())));
create policy ww_reactions_own on ww_reactions for all using (from_user = auth.uid());
create policy ww_comments_read on ww_comments for select using (event_id in (select id from ww_events where group_id in (select ww_my_group_ids())));
create policy ww_comments_own on ww_comments for all using (user_id = auth.uid());
create policy ww_results_read on ww_cycle_results for select using (cycle_id in (select id from ww_cycles where group_id in (select ww_my_group_ids())));
create policy ww_reports_own on ww_weekly_reports for select using (user_id = auth.uid());
create policy ww_push_own on ww_push_subscriptions for all using (user_id = auth.uid());
create policy ww_config_read on ww_app_config for select using (true);

-- ---------- storage bucket pre dôkazy ----------
insert into storage.buckets (id, name, public) values ('ww-proofs', 'ww-proofs', false) on conflict (id) do nothing;
drop policy if exists ww_proofs_rw on storage.objects;
create policy ww_proofs_rw on storage.objects for all using (bucket_id = 'ww-proofs' and auth.role() = 'authenticated') with check (bucket_id = 'ww-proofs' and auth.role() = 'authenticated');

-- ---------- starter knižnica (40) ----------
create unique index if not exists ww_templates_library_title on ww_challenge_templates(title_sk) where group_id is null;
insert into ww_challenge_templates (title_sk, title_en, category, type, target, unit, difficulty) values
('Hýb sa 30 min denne','Move 30 min a day','movement','binary_daily',5,'days','medium'),
('3 tréningy za týždeň','3 workouts this week','movement','count_weekly',3,'sessions','medium'),
('Prebehni 10 km za týždeň','Run 10 km this week','movement','count_weekly',10,'km','medium'),
('8 000 krokov denne','8,000 steps a day','movement','count_daily',8000,'steps','medium'),
('Schody namiesto výťahu','Stairs instead of elevator','movement','binary_daily',5,'days','easy'),
('Bicykel / pešo do práce 3×','Bike or walk to work 3×','movement','count_weekly',3,'sessions','medium'),
('Plávanie alebo bazén 1×','Swim once this week','movement','once',1,'—','easy'),
('10 min strečing denne','10 min stretching a day','movement','binary_daily',5,'days','easy'),
('Zelenina ku každému obedu','Veggies with every lunch','nutrition','binary_daily',5,'days','easy'),
('Bez sladkého 5 dní','No sweets 5 days','nutrition','binary_daily',5,'days','medium'),
('Bez fast foodu celý týždeň','No fast food all week','nutrition','binary_daily',7,'days','medium'),
('Raňajky každý deň','Breakfast every day','nutrition','binary_daily',7,'days','easy'),
('2 l vody denne','2 L of water a day','nutrition','binary_daily',5,'days','easy'),
('Domáca večera 4×','Home-cooked dinner 4×','nutrition','count_weekly',4,'sessions','medium'),
('Bez sladených nápojov','No sugary drinks','nutrition','binary_daily',7,'days','medium'),
('Alcohol-free 5 dní','5 alcohol-free days','alcohol','binary_daily',5,'days','medium'),
('Dry week – bez alkoholu','Dry week','alcohol','binary_daily',7,'days','hard'),
('Max 2 drinky za večer','Max 2 drinks per evening','alcohol','binary_daily',7,'days','easy'),
('Bez alkoholu v pracovné dni','No alcohol on weekdays','alcohol','binary_daily',5,'days','medium'),
('V posteli do 23:00','In bed by 11 pm','sleep','binary_daily',5,'days','medium'),
('7+ hodín spánku','7+ hours of sleep','sleep','binary_daily',5,'days','medium'),
('Bez telefónu v posteli','No phone in bed','sleep','binary_daily',5,'days','medium'),
('Vstať bez snooze','Up without snooze','sleep','binary_daily',5,'days','hard'),
('Bez kávy po 14:00','No coffee after 2 pm','sleep','binary_daily',5,'days','easy'),
('10 min meditácie / dýchania','10 min meditation / breathing','mental','binary_daily',5,'days','medium'),
('20 strán knihy denne','20 pages a day','mental','binary_daily',5,'days','medium'),
('Bez sociálnych sietí 1 deň','One day off social media','mental','once',1,'—','medium'),
('Screen time < 2 h','Screen time under 2 h','mental','binary_daily',5,'days','hard'),
('Napíš 3 veci, za ktoré si vďačný','3 things you’re grateful for','mental','binary_daily',5,'days','easy'),
('Zavolaj niekomu, s kým si dlho nehovoril','Call someone you haven’t talked to in a while','mental','once',1,'—','easy'),
('30 min vonku denne','30 min outdoors a day','lifestyle','binary_daily',5,'days','easy'),
('Studená sprcha','Cold shower','lifestyle','binary_daily',5,'days','hard'),
('Sauna alebo kúpeľ 1×','Sauna or bath once','lifestyle','once',1,'—','easy'),
('Ranná rutina do 30 min od vstania','Morning routine within 30 min','lifestyle','binary_daily',5,'days','medium'),
('Bez telefónu po 21:00','No phone after 9 pm','lifestyle','binary_daily',5,'days','medium'),
('Uprac jednu vec, čo odkladáš','Tidy one thing you keep postponing','lifestyle','once',1,'—','easy'),
('Stretni sa s kamarátom naživo','Meet a friend in person','lifestyle','once',1,'—','easy'),
('Bez auta na krátke cesty','No car for short trips','lifestyle','binary_daily',5,'days','medium'),
('Vypni obrazovky hodinu pred spaním','Screens off an hour before bed','lifestyle','binary_daily',5,'days','medium'),
('Skús novú zdravú vec (jedlo/šport)','Try one new healthy thing','lifestyle','once',1,'—','easy')
on conflict (title_sk) where group_id is null do nothing;
-- koniec
