-- Weekwell fix 9 (2026-09-13): úprava vlastných výziev autorom (#20).
drop policy if exists ww_templates_update on ww_challenge_templates;
create policy ww_templates_update on ww_challenge_templates for update using (created_by = auth.uid() and group_id is not null);
notify pgrst, 'reload schema';
