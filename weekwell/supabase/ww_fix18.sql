-- Weekwell fix 18 (2026-10-03): #62 osobné výzvy – do limitu (personal_max_per_cycle = 3) sa rátajú VŠETKY osobné výzvy člena v týždni:
-- tie, ktoré si vytvoril, aj tie, ku ktorým sa pripojil. Spolu najviac 3.
-- Spustiť celé naraz v SQL Editore projektu TipLab. Bezpečné opakovať.

create or replace function ww_add_personal(p_template uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid; cur record; tp record; n int; k int; new_id uuid;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status = 'active';
  if g is null then raise exception 'no_active_membership'; end if;
  select * into cur from ww_cycles where group_id = g and status = 'running' order by week_start desc limit 1;
  if not found then raise exception 'no_running_cycle'; end if;
  select * into tp from ww_challenge_templates where id = p_template and is_active and (group_id is null or group_id = g);
  if not found then raise exception 'template_not_found'; end if;
  select count(*) into n from ww_cycle_challenges where cycle_id = cur.id and source = 'personal' and for_user = auth.uid();
  if n >= ww_cfg('personal_max_per_cycle', 3) then raise exception 'personal_limit'; end if;
  if exists (select 1 from ww_cycle_challenges where cycle_id = cur.id and source = 'personal' and for_user = auth.uid() and template_id = p_template) then raise exception 'already_added'; end if;
  select greatest(coalesce(max(slot_no), 0), 199) + 1 into k from ww_cycle_challenges where cycle_id = cur.id;
  insert into ww_cycle_challenges (cycle_id, template_id, slot_no, source, for_user) values (cur.id, p_template, k, 'personal', auth.uid()) returning id into new_id;
  insert into ww_events (group_id, user_id, type, ref_id, payload) values (g, auth.uid(), 'personal', new_id, jsonb_build_object('title', tp.title_sk, 'title_en', tp.title_en));
  return new_id;
end $$;

create or replace function ww_answer_personal(p_cc uuid, p_yes boolean) returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid; root record; cy record; tp record; child uuid; k int; n int;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status = 'active';
  if g is null then raise exception 'no_active_membership'; end if;
  select * into root from ww_cycle_challenges where id = p_cc and source = 'personal' and parent_id is null;
  if not found then raise exception 'not_found'; end if;
  select * into cy from ww_cycles where id = root.cycle_id;
  if cy.group_id <> g or cy.status <> 'running' then raise exception 'not_running'; end if;
  if root.for_user = auth.uid() then raise exception 'own_challenge'; end if;
  select id into child from ww_cycle_challenges where parent_id = p_cc and for_user = auth.uid();
  if p_yes then
    if child is null then
      select count(*) into n from ww_cycle_challenges where cycle_id = cy.id and source = 'personal' and for_user = auth.uid();
      if n >= ww_cfg('personal_max_per_cycle', 3) then raise exception 'personal_limit'; end if;
      select greatest(coalesce(max(slot_no), 0), 199) + 1 into k from ww_cycle_challenges where cycle_id = cy.id;
      insert into ww_cycle_challenges (cycle_id, template_id, slot_no, source, for_user, parent_id) values (cy.id, root.template_id, k, 'personal', auth.uid(), p_cc) returning id into child;
      select title_sk, title_en into tp from ww_challenge_templates where id = root.template_id;
      insert into ww_events (group_id, user_id, type, ref_id, payload) values (g, auth.uid(), 'personal_join', child, jsonb_build_object('title', tp.title_sk, 'title_en', tp.title_en, 'owner', root.for_user));
    end if;
  elsif child is not null then
    if exists (select 1 from ww_logs where cycle_challenge_id = child) then raise exception 'has_logs'; end if;
    delete from ww_events where ref_id = child and type = 'personal_join';
    delete from ww_cycle_challenges where id = child;
    child := null;
  end if;
  insert into ww_personal_answers (cc_id, user_id, answer) values (p_cc, auth.uid(), p_yes)
    on conflict (cc_id, user_id) do update set answer = excluded.answer, created_at = now();
  return child;
end $$;

notify pgrst, 'reload schema';
