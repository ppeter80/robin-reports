-- Weekwell fix 4 (2026-09-13): ciele – kategórie, vlastné metriky, jeden aktívny cieľ na metriku (dávka A: #6 #7 #8).
-- Spustiť celé naraz v SQL Editore projektu TipLab. Bezpečné opakovať.
alter table ww_goals add column if not exists category text;          -- movement | body | sleep | alcohol | nutrition | mental | other
alter table ww_goals add column if not exists label text;             -- názov vlastnej metriky
alter table ww_goals add column if not exists unit text;              -- jednotka vlastnej metriky
alter table ww_goals add column if not exists archived_at timestamptz;
create unique index if not exists ww_goals_one_active_per_metric on ww_goals(user_id, metric) where status = 'active';
notify pgrst, 'reload schema';
