-- Weekwell fix 13 (2026-09-13): hlasy viditeľné hneď (kto hlasoval za návrh), nie až po uzávierke (#37).
drop policy if exists ww_votes_read on ww_votes;
create policy ww_votes_read on ww_votes for select using (cycle_id in (select id from ww_cycles where group_id in (select ww_my_group_ids())));
notify pgrst, 'reload schema';
