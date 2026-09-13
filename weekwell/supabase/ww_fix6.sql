-- Weekwell fix 6 (2026-09-13): dávka C – #2 pravidlá skupiny (návrh → hlasovanie → zápis) + skupinový chat (#10 časť).
-- Spustiť celé naraz v SQL Editore projektu TipLab. Bezpečné opakovať.

create table if not exists ww_rules (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references ww_groups(id) on delete cascade,
  text text not null check (char_length(text) <= 300), proposed_by uuid not null references ww_users(id),
  kind text not null default 'add' check (kind in ('add','revoke')), target_rule_id uuid references ww_rules(id),
  status text not null default 'proposed' check (status in ('proposed','active','rejected','revoked')),
  created_at timestamptz not null default now(), decided_at timestamptz
);
create table if not exists ww_rule_votes (rule_id uuid not null references ww_rules(id) on delete cascade, user_id uuid not null references ww_users(id) on delete cascade, vote boolean not null, created_at timestamptz not null default now(), primary key (rule_id, user_id));
create table if not exists ww_messages (id uuid primary key default gen_random_uuid(), group_id uuid not null references ww_groups(id) on delete cascade, user_id uuid not null references ww_users(id) on delete cascade, text text not null check (char_length(text) <= 500), created_at timestamptz not null default now());
create index if not exists ww_messages_group_idx on ww_messages(group_id, created_at desc);

alter table ww_rules enable row level security; alter table ww_rule_votes enable row level security; alter table ww_messages enable row level security;
drop policy if exists ww_rules_read on ww_rules; create policy ww_rules_read on ww_rules for select using (group_id in (select ww_my_group_ids()));
drop policy if exists ww_rule_votes_read on ww_rule_votes; create policy ww_rule_votes_read on ww_rule_votes for select using (rule_id in (select id from ww_rules where group_id in (select ww_my_group_ids())));
drop policy if exists ww_messages_read on ww_messages; create policy ww_messages_read on ww_messages for select using (group_id in (select ww_my_group_ids()));
drop policy if exists ww_messages_insert on ww_messages; create policy ww_messages_insert on ww_messages for insert with check (user_id = auth.uid() and group_id in (select ww_my_group_ids()));
drop policy if exists ww_messages_delete on ww_messages; create policy ww_messages_delete on ww_messages for delete using (user_id = auth.uid());

-- návrh pravidla (alebo návrh zrušenia existujúceho)
create or replace function ww_propose_rule(p_text text, p_kind text default 'add', p_target uuid default null) returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid; rid uuid; n int;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status <> 'left';
  if g is null then raise exception 'no_group'; end if;
  insert into ww_rules (group_id, text, proposed_by, kind, target_rule_id) values (g, p_text, auth.uid(), p_kind, p_target) returning id into rid;
  insert into ww_events (group_id, user_id, type, ref_id, payload) values (g, auth.uid(), 'rule_proposed', rid, jsonb_build_object('text', p_text, 'kind', p_kind));
  -- solo skupina: nikto iný nehlasuje → prijaté hneď
  select count(*) into n from ww_memberships where group_id = g and status = 'active' and user_id <> auth.uid();
  if n = 0 then perform ww_decide_rule(rid); end if;
  return rid;
end $$;

-- vyhodnotenie: väčšina ostatných aktívnych členov (bez navrhovateľa)
create or replace function ww_decide_rule(p_rule uuid) returns void language plpgsql security definer set search_path = public as $$
declare r record; others int; yes int; no int;
begin
  select * into r from ww_rules where id = p_rule;
  if r.status <> 'proposed' then return; end if;
  select count(*) into others from ww_memberships where group_id = r.group_id and status = 'active' and user_id <> r.proposed_by;
  select count(*) filter (where vote), count(*) filter (where not vote) into yes, no from ww_rule_votes where rule_id = p_rule and user_id <> r.proposed_by;
  if others = 0 or yes > others / 2.0 then
    update ww_rules set status = 'active', decided_at = now() where id = p_rule;
    if r.kind = 'revoke' and r.target_rule_id is not null then update ww_rules set status = 'revoked', decided_at = now() where id = r.target_rule_id; update ww_rules set status = 'revoked' where id = p_rule; end if;
    insert into ww_events (group_id, user_id, type, ref_id, payload) values (r.group_id, null, 'rule_accepted', p_rule, jsonb_build_object('text', r.text, 'kind', r.kind));
  elsif no >= others / 2.0 and no > 0 and (no > others / 2.0 or no + yes = others) then
    update ww_rules set status = 'rejected', decided_at = now() where id = p_rule;
    insert into ww_events (group_id, user_id, type, ref_id, payload) values (r.group_id, null, 'rule_rejected', p_rule, jsonb_build_object('text', r.text));
  end if;
end $$;

create or replace function ww_vote_rule(p_rule uuid, p_vote boolean) returns text language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from ww_rules where id = p_rule;
  if r is null or r.status <> 'proposed' then raise exception 'not_open'; end if;
  if r.proposed_by = auth.uid() then raise exception 'own_proposal'; end if;
  if not exists (select 1 from ww_memberships where group_id = r.group_id and user_id = auth.uid() and status = 'active') then raise exception 'not_member'; end if;
  insert into ww_rule_votes (rule_id, user_id, vote) values (p_rule, auth.uid(), p_vote) on conflict (rule_id, user_id) do update set vote = excluded.vote, created_at = now();
  perform ww_decide_rule(p_rule);
  select status into r from ww_rules where id = p_rule; return r.status;
end $$;

notify pgrst, 'reload schema';
