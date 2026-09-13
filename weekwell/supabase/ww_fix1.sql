-- Weekwell fix 1 (2026-09-13): pgcrypto v schéme extensions, kontrola hlasov/vet, oprava porovnania kategórií vo výbere.
-- Spustiť celé naraz v SQL Editore projektu TipLab. Bezpečné opakovať.

create or replace function ww_create_invite() returns text language plpgsql security definer set search_path = public, extensions as $$
declare g uuid; c text;
begin
  select group_id into g from ww_memberships where user_id = auth.uid() and status <> 'left';
  if g is null then raise exception 'no group'; end if;
  c := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 6));
  insert into ww_invites (code, group_id, created_by, expires_at) values (c, g, auth.uid(), now() + interval '7 days');
  return c;
end $$;

create or replace function ww_select_challenges(p_cycle uuid) returns void language plpgsql security definer set search_path = public as $$
declare c record; m int; n_slots int; catmax int; slot int := 0; r record; cnt jsonb := '{}'; prev uuid; used uuid[] := '{}'; allowed text[];
begin
  select * into c from ww_cycles where id = p_cycle;
  if c.status not in ('proposing','voting') then return; end if;
  select count(*) into m from ww_memberships where group_id = c.group_id and status = 'active';
  select g.slots, g.allowed_categories into n_slots, allowed from ww_groups g where g.id = c.group_id;
  catmax := ww_cfg('category_max_per_cycle', 2);
  delete from ww_cycle_challenges where cycle_id = p_cycle;
  select id into prev from ww_cycles where group_id = c.group_id and week_start = c.week_start - 7;
  for r in
    with pool as (
      select p.id as pid, p.template_id, ct.category, (select count(*) from ww_votes v where v.proposal_id = p.id) as votes
      from ww_proposals p join ww_challenge_templates ct on ct.id = p.template_id
      where p.cycle_id = p_cycle and p.removed_by is null and not exists (select 1 from ww_vetoes x where x.proposal_id = p.id)
    ),
    cand as (
      select template_id, category, votes, 'vote_majority' as src, 1 as tier, random() as rnd from pool where votes > m / 2.0
      union all select template_id, category, votes, 'vote_rank', 2, random() from pool where votes > 0 and votes <= m / 2.0
      union all select cc.template_id, ct.category, 0, 'carry_over', 3, cc.slot_no from ww_cycle_challenges cc join ww_challenge_templates ct on ct.id = cc.template_id where cc.cycle_id = prev
      union all select template_id, category, 0, 'random_pool', 4, random() from pool where votes = 0
      union all select ct.id, ct.category, 0, 'library', 5, random() from ww_challenge_templates ct
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

-- hlas len za cudzí návrh; veto len proti autorovi návrhu
drop policy if exists ww_votes_own on ww_votes;
create policy ww_votes_own on ww_votes for all using (user_id = auth.uid())
  with check (user_id = auth.uid()
    and cycle_id in (select id from ww_cycles where status in ('proposing','voting'))
    and not exists (select 1 from ww_proposals p where p.id = proposal_id and auth.uid() = any (p.authors)));
drop policy if exists ww_vetoes_own on ww_vetoes;
create policy ww_vetoes_own on ww_vetoes for all using (by_user = auth.uid())
  with check (by_user = auth.uid() and against_user <> auth.uid()
    and cycle_id in (select id from ww_cycles where status in ('proposing','voting'))
    and exists (select 1 from ww_proposals p where p.id = proposal_id and against_user = any (p.authors) and not (auth.uid() = any (p.authors))));

notify pgrst, 'reload schema';
