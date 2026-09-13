-- Weekwell fix 8 (2026-09-13): popis pri výzve (#18).
alter table ww_challenge_templates add column if not exists description text check (char_length(description) <= 200);
notify pgrst, 'reload schema';
