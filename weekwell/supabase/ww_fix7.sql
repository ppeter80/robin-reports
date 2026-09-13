-- Weekwell fix 7 (2026-09-13): fotka skupiny namiesto emoji (#17).
alter table ww_groups add column if not exists avatar_url text;
notify pgrst, 'reload schema';
