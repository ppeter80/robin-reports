-- Weekwell fix 19 (2026-10-05): výber výziev LEN z návrhov na daný týždeň (Peter: „minulé sa nerátajú").
-- Zrušený krok „z minulého týždňa" (carry_over). Poradie: 1. väčšina hlasov, 2. podľa hlasov, 3. návrhy bez hlasu (žreb),
-- 4. knižnica – len keď je návrhov menej než miest.
-- Spustiť celé naraz v SQL Editore projektu TipLab. Bezpečné opakovať.

create or replace function ww_select_challenges(p_cycle uuid) returns void language plpgsql security definer set search_path = public as $$
declare c record; m int; n_slots int; catmax int; slot int := 0; r record; cnt jsonb := '{}'; used uuid[] := '{}'; allowed text[];
begin
  select * into c from ww_cycles where id = p_cycle;
  if c.status not in ('proposing','voting') then return; end if;
  select count(*) into m from ww_memberships where group_id = c.group_id and status = 'active';
  select g.slots, g.allowed_categories into n_slots, allowed from ww_groups g where g.id = c.group_id;
  catmax := ww_cfg('category_max_per_cycle', 2);
  delete from ww_cycle_challenges where cycle_id = p_cycle;
  for r in
    with pool as (
      select p.id as pid, p.template_id, ct.category, (select count(*) from ww_votes v where v.proposal_id = p.id) as votes
      from ww_proposals p join ww_challenge_templates ct on ct.id = p.template_id
      where p.cycle_id = p_cycle and p.removed_by is null and not exists (select 1 from ww_vetoes x where x.proposal_id = p.id)
    ),
    cand as (
      select template_id, category, votes, 'vote_majority' as src, 1 as tier, random() as rnd from pool where votes > m / 2.0
      union all select template_id, category, votes, 'vote_rank', 2, random() from pool where votes > 0 and votes <= m / 2.0
      union all select template_id, category, 0, 'random_pool', 3, random() from pool where votes = 0
      union all select ct.id, ct.category, 0, 'library', 4, random() from ww_challenge_templates ct
        where ct.group_id is null and ct.is_active and ct.category = any (allowed)
          and not exists (select 1 from ww_cycle_challenges cc2 join ww_cycles cy on cy.id = cc2.cycle_id where cy.group_id = c.group_id and cc2.template_id = ct.id and cy.week_start >= c.week_start - 7 * ww_cfg('library_no_repeat_cycles', 2))
    )
    select * from cand order by tier, votes desc, rnd
  loop
    exit when slot >= n_slots;
    if r.template_id = any (used) then continue; end if;
    if coalesce((cnt->>r.category)::int, 0) >= catmax then continue; end if;
    slot := slot + 1; used := used || r.template_id; cnt := cnt || jsonb_build_object(r.category, coalesce((cnt->>r.category)::int, 0) + 1);
    insert into ww_cycle_challenges (cycle_id, template_id, slot_no, source, votes_at_selection) values (p_cycle, r.template_id, slot, r.src, r.votes);
  end loop;
  update ww_cycles set status = 'selected', selected_at = now() where id = p_cycle;
  insert into ww_events (group_id, user_id, type, ref_id) values (c.group_id, null, 'selected', p_cycle);
end $$;

notify pgrst, 'reload schema';
