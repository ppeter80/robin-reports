-- Weekwell fix 11 (2026-09-13): merania zdieľaných cieľov viditeľné pre skupinu (#30).
drop policy if exists ww_metrics_shared on ww_metric_entries;
create policy ww_metrics_shared on ww_metric_entries for select using (
  exists (select 1 from ww_goals g where g.user_id = ww_metric_entries.user_id and g.metric = ww_metric_entries.metric and g.share_progress and g.status = 'active')
  and user_id in (select user_id from ww_memberships where group_id in (select ww_my_group_ids()))
);
notify pgrst, 'reload schema';
