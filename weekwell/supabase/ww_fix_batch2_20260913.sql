-- Weekwell — spojené opravy 13.9.2026 (2. dávka): fix10 (termíny do Ne 24:00, výber Po 00:05) + fix11 (merania zdieľaných cieľov). Spustiť celé naraz.

-- ===== ww_fix10.sql =====
-- Weekwell fix 10 (2026-09-13): #22 návrhy + hlasovanie do nedele 24:00, výber výziev v pondelok 00:05 (hodinový tick).
create or replace function ww_tick() returns void language plpgsql security definer set search_path = public as $$
declare g record; lt timestamp; dow int; hr int; wk date; nxt date; cyc record;
begin
  for g in select * from ww_groups where status = 'active' loop
    lt := now() at time zone g.tz; dow := extract(isodow from lt); hr := extract(hour from lt);
    wk := date_trunc('week', lt)::date; nxt := wk + 7;
    -- uzávierka minulých cyklov (po nedeľnej polnoci)
    for cyc in select * from ww_cycles where group_id = g.id and week_start < wk and status in ('running','selected','voting','proposing') loop
      if cyc.status in ('voting','proposing') then perform ww_select_challenges(cyc.id); end if;   -- prípad, že sa nikdy nevybralo
      perform ww_close_cycle(cyc.id);
    end loop;
    -- bežiaci cyklus: existuje vždy; ak je ešte vo fáze návrhov/hlasovania (pondelok 00:05), vyber výzvy a spusti
    insert into ww_cycles (group_id, week_start, status) values (g.id, wk, 'running') on conflict (group_id, week_start) do nothing;
    select * into cyc from ww_cycles where group_id = g.id and week_start = wk;
    if cyc.status in ('proposing','voting') then perform ww_select_challenges(cyc.id); end if;
    update ww_cycles set status = 'running' where group_id = g.id and week_start = wk and status = 'selected';
    -- budúci cyklus: návrhy + hlasovanie otvorené celý týždeň až do nedele 24:00 (status 'voting' = otvorené)
    insert into ww_cycles (group_id, week_start, status) values (g.id, nxt, 'voting') on conflict (group_id, week_start) do nothing;
    update ww_cycles set status = 'voting' where group_id = g.id and week_start = nxt and status = 'proposing';
  end loop;
end $$;

-- ===== ww_fix11.sql =====
-- Weekwell fix 11 (2026-09-13): merania zdieľaných cieľov viditeľné pre skupinu (#30).
drop policy if exists ww_metrics_shared on ww_metric_entries;
create policy ww_metrics_shared on ww_metric_entries for select using (
  exists (select 1 from ww_goals g where g.user_id = ww_metric_entries.user_id and g.metric = ww_metric_entries.metric and g.share_progress and g.status = 'active')
  and user_id in (select user_id from ww_memberships where group_id in (select ww_my_group_ids()))
);

notify pgrst, 'reload schema';
