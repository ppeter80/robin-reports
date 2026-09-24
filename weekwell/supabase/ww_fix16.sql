-- Weekwell fix 16 (2026-09-24): chat – odpoveď na správu (citácia) + emoji reakcie na správy + mazanie vlastnej správy (ako v TdC appke).
alter table ww_messages add column if not exists reply_to uuid references ww_messages(id) on delete set null;

create table if not exists ww_msg_reactions (
  message_id uuid not null references ww_messages(id) on delete cascade,
  from_user uuid not null references ww_users(id) on delete cascade,
  emoji text not null check (char_length(emoji) <= 8),
  created_at timestamptz not null default now(),
  primary key (message_id, from_user, emoji)
);
alter table ww_msg_reactions enable row level security;
drop policy if exists ww_msg_reactions_read on ww_msg_reactions;
create policy ww_msg_reactions_read on ww_msg_reactions for select using (message_id in (select id from ww_messages where group_id in (select ww_my_group_ids())));
drop policy if exists ww_msg_reactions_own on ww_msg_reactions;
create policy ww_msg_reactions_own on ww_msg_reactions for all using (from_user = auth.uid()) with check (from_user = auth.uid() and message_id in (select id from ww_messages where group_id in (select ww_my_group_ids())));

-- pri zmazaní účtu zmazať aj reakcie (doplnok k ww_delete_me – ak funkcia existuje, cascade cez from_user to rieši)
notify pgrst, 'reload schema';
