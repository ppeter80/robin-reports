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
notify pgrst, 'reload schema';
