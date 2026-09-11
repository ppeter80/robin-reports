-- Weekwell — schéma pre iteráciu 1 (spec v0.3 kap. 13). Spustiť v Supabase SQL editore (projekt weekwell, eu-central-1).
create extension if not exists pgcrypto;

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null, avatar_url text, locale text not null default 'sk', tz text not null default 'Europe/Bratislava',
  checkin_time time not null default '20:30', notif_prefs jsonb not null default '{"checkin":true,"reminder":true,"social":true,"proposals":true}',
  consent_at timestamptz, created_at timestamptz not null default now()
);
create table groups (
  id uuid primary key default gen_random_uuid(), name text not null, emoji text, admin_id uuid not null references users(id),
  slots int not null default 3 check (slots between 2 and 4), allowed_categories text[] not null default '{movement,nutrition,alcohol,sleep,mental,lifestyle}',
  tz text not null default 'Europe/Bratislava', reward_text text, status text not null default 'active' check (status in ('active','paused','archived')),
  created_at timestamptz not null default now()
);
create table memberships (
  group_id uuid not null references groups(id) on delete cascade, user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member')), status text not null default 'active' check (status in ('active','paused','left')),
  paused_until_cycle uuid, joined_at timestamptz not null default now(), left_at timestamptz, primary key (group_id, user_id)
);
create unique index memberships_one_active_per_user on memberships(user_id) where status <> 'left';
create table invites (code text primary key, group_id uuid not null references groups(id) on delete cascade, created_by uuid references users(id), expires_at timestamptz not null, uses int not null default 0);
create table challenge_templates (
  id uuid primary key default gen_random_uuid(), group_id uuid references groups(id) on delete cascade, -- null = globálna knižnica
  title_sk text not null, title_en text not null, category text not null check (category in ('movement','nutrition','alcohol','sleep','mental','lifestyle')),
  type text not null check (type in ('binary_daily','count_daily','count_weekly','once')), target numeric not null, unit text not null default 'days', min_days int,
  proof text not null default 'optional' check (proof in ('optional','required')), difficulty text check (difficulty in ('easy','medium','hard')),
  created_by uuid references users(id), is_active boolean not null default true
);
create table cycles (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references groups(id) on delete cascade, week_start date not null,
  status text not null default 'proposing' check (status in ('proposing','voting','selected','running','closed')), selected_at timestamptz, closed_at timestamptz,
  unique (group_id, week_start)
);
create table proposals (id uuid primary key default gen_random_uuid(), cycle_id uuid not null references cycles(id) on delete cascade, template_id uuid not null references challenge_templates(id), authors uuid[] not null, created_at timestamptz not null default now(), removed_by uuid, unique (cycle_id, template_id));
create table vetoes (cycle_id uuid not null references cycles(id) on delete cascade, proposal_id uuid not null references proposals(id) on delete cascade, by_user uuid not null references users(id), against_user uuid not null references users(id), primary key (cycle_id, by_user, against_user));
create table votes (cycle_id uuid not null references cycles(id) on delete cascade, proposal_id uuid not null references proposals(id) on delete cascade, user_id uuid not null references users(id), primary key (cycle_id, proposal_id, user_id));
create table cycle_challenges (id uuid primary key default gen_random_uuid(), cycle_id uuid not null references cycles(id) on delete cascade, template_id uuid not null references challenge_templates(id), slot_no int not null, source text not null check (source in ('vote_majority','vote_rank','carry_over','random_pool','library','manual')), votes_at_selection int not null default 0, unique (cycle_id, slot_no));
create table logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade, cycle_challenge_id uuid not null references cycle_challenges(id) on delete cascade,
  date date not null, done boolean, value numeric, note text check (char_length(note) <= 140), proof_url text, proof_type text check (proof_type in ('photo','strava','verified')), logged_at timestamptz not null default now(),
  unique (user_id, cycle_challenge_id, date)
);
create table goals (id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade, metric text not null, direction text not null check (direction in ('up','down')), target numeric not null, start_value numeric, start_at date not null default current_date, interval text not null default 'weekly' check (interval in ('daily','weekly','free')), share_progress boolean not null default false, status text not null default 'active');
create table metric_entries (id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade, metric text not null, date date not null, value numeric not null, unique (user_id, metric, date));
create table events (id uuid primary key default gen_random_uuid(), group_id uuid not null references groups(id) on delete cascade, user_id uuid references users(id), type text not null, ref_id uuid, payload jsonb, created_at timestamptz not null default now());
create table reactions (event_id uuid not null references events(id) on delete cascade, from_user uuid not null references users(id) on delete cascade, emoji text not null, primary key (event_id, from_user, emoji));
create table comments (id uuid primary key default gen_random_uuid(), event_id uuid not null references events(id) on delete cascade, user_id uuid not null references users(id) on delete cascade, text text not null check (char_length(text) <= 280), created_at timestamptz not null default now(), deleted_at timestamptz, deleted_by uuid);
create table cycle_results (cycle_id uuid not null references cycles(id) on delete cascade, user_id uuid not null references users(id) on delete cascade, pct numeric not null, is_100 boolean not null, streak_after int not null, extra_points_after int not null, paused boolean not null default false, primary key (cycle_id, user_id));
create table weekly_reports (cycle_id uuid not null references cycles(id) on delete cascade, user_id uuid not null references users(id) on delete cascade, payload jsonb not null, sent_at timestamptz, primary key (cycle_id, user_id));
create table push_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade, subscription jsonb not null, created_at timestamptz not null default now());
create table app_config (key text primary key, value jsonb not null);

-- RLS: člen vidí len svoju skupinu; zapisuje len vlastné riadky. (Detailné policies + RPC pre admin operácie v iterácii 1.)
alter table users enable row level security; alter table groups enable row level security; alter table memberships enable row level security;
alter table cycles enable row level security; alter table proposals enable row level security; alter table votes enable row level security; alter table vetoes enable row level security;
alter table cycle_challenges enable row level security; alter table logs enable row level security; alter table goals enable row level security; alter table metric_entries enable row level security;
alter table events enable row level security; alter table reactions enable row level security; alter table comments enable row level security; alter table cycle_results enable row level security; alter table weekly_reports enable row level security;
create or replace function my_group_ids() returns setof uuid language sql stable security definer as $$ select group_id from memberships where user_id = auth.uid() and status <> 'left' $$;
create policy users_self on users for all using (id = auth.uid());
create policy groups_member on groups for select using (id in (select my_group_ids()));
create policy memberships_member on memberships for select using (group_id in (select my_group_ids()));
create policy cycles_member on cycles for select using (group_id in (select my_group_ids()));
create policy logs_own on logs for all using (user_id = auth.uid());
create policy goals_own on goals for all using (user_id = auth.uid());
create policy metrics_own on metric_entries for all using (user_id = auth.uid());
-- cron (pg_cron): Fri 18:00 open_voting · Sun 18:00 select_challenges · Sun 24:00 close_cycle · Mon 07:00 send_reports — funkcie v iterácii 1.
