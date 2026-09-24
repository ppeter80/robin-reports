// Weekwell — Supabase store (iterácia 1). Rovnaké async API ako stub.js; číta/zapisuje tabuľky ww_* (supabase/ww_schema.sql).
// Stav (WW_STORE.state) má rovnaký tvar ako stub, takže app.js sa nemení.
(function () {
  const C = window.WW_CONFIG; let sb = null; let S = null; let U = null;
  function monday(d) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x; }
  function iso(d) { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
  const AV = ['🧔', '👩', '🧑', '👱‍♀️', '🧕', '👨‍🦰', '👩‍🦱', '🧑‍🦳', '👨‍🦲', '👩‍🦰'];
  const avatarFor = (u, i) => (u.avatar_url ? `<img src="${u.avatar_url}" style="width:22px;height:22px;border-radius:11px;vertical-align:middle">` : AV[i % AV.length]);
  const T = (row) => ({ id: row.id, category: row.category, title_sk: row.title_sk, title_en: row.title_en, description: row.description || null, type: row.type, target: +row.target, unit: row.unit, min_days: row.min_days, difficulty: row.difficulty, proof: row.proof, source: row.group_id ? 'custom' : 'library' });
  const q = async (p) => { const { data, error } = await p; if (error) { console.error(error); throw error; } return data; };

  async function load() {
    const uid = U.id;
    let meRow = await q(sb.from('ww_users').select('*').eq('id', uid).maybeSingle());
    let mem = meRow ? await q(sb.from('ww_memberships').select('*').eq('user_id', uid).neq('status', 'left').maybeSingle()) : null;
    if (!meRow || !mem) { // používateľ existoval v projekte pred Weekwellom (trigger sa nespustil) → vytvoriť profil + solo skupinu
      await q(sb.rpc('ww_ensure_profile'));
      meRow = await q(sb.from('ww_users').select('*').eq('id', uid).maybeSingle());
      mem = await q(sb.from('ww_memberships').select('*').eq('user_id', uid).neq('status', 'left').maybeSingle());
      if (!meRow || !mem) throw new Error('no_profile');
    }
    const group = await q(sb.from('ww_groups').select('*').eq('id', mem.group_id).single());
    const mems = await q(sb.from('ww_memberships').select('*').eq('group_id', group.id).neq('status', 'left'));
    const users = await q(sb.from('ww_users').select('*').in('id', mems.map((m) => m.user_id)));
    const members = mems.map((m, i) => { const u = users.find((x) => x.id === m.user_id) || { id: m.user_id, name: '?' }; return { id: u.id, name: u.name, avatar: avatarFor(u, i), avatar_url: u.avatar_url || null, location: u.location || '', bio: u.bio || '', stats: u.stats || {}, share: u.share_fields || {}, role: m.role, status: m.status }; });
    // fotky + príbehy skupiny (posledných 120), signed URL na 6 h
    let photos = [];
    try {
      const ph = await q(sb.from('ww_photos').select('*').eq('group_id', group.id).order('created_at', { ascending: false }).limit(120));
      if (ph.length) { const { data: signed } = await sb.storage.from('ww-photos').createSignedUrls(ph.map((p) => p.path), 6 * 3600); photos = ph.map((p, i) => ({ id: p.id, user: p.user_id, url: (signed && signed[i] && signed[i].signedUrl) || '', caption: p.caption || '', kind: p.kind, ts: new Date(p.created_at).getTime(), expires: p.expires_at ? new Date(p.expires_at).getTime() : null })); }
    } catch (e) { console.warn('photos', e); }
    // zdieľané ciele členov (share_progress) + ich merania (fix11)
    try {
      const sg = await q(sb.from('ww_goals').select('*').eq('share_progress', true).eq('status', 'active').in('user_id', members.map((m) => m.id)));
      const se = sg.length ? await q(sb.from('ww_metric_entries').select('user_id,metric,date,value').in('user_id', [...new Set(sg.map((g) => g.user_id))]).order('date')) : [];
      members.forEach((m) => { m.goals = sg.filter((g) => g.user_id === m.id).map((g) => ({ id: g.id, metric: g.metric, category: g.category || null, label: g.label || null, unit: g.unit || null, dir: g.direction, interval: g.interval, target: +g.target, share: true, entries: se.filter((e) => e.user_id === m.id && e.metric === g.metric).map((e) => ({ date: e.date, value: +e.value })) })); });
    } catch (e) { console.warn('shared goals', e); }
    members.forEach((m) => { m.story = photos.find((p) => p.kind === 'story' && p.user === m.id && (!p.expires || p.expires > Date.now())) || null; });
    const paused = mems.filter((m) => m.status === 'paused').map((m) => m.user_id);
    const ws = iso(monday(new Date())); const dates = [...Array(7)].map((_, i) => { const d = new Date(monday(new Date())); d.setDate(d.getDate() + i); return iso(d); });
    const tpls = await q(sb.from('ww_challenge_templates').select('*').or(`group_id.is.null,group_id.eq.${group.id}`).eq('is_active', true).order('created_at'));
    const lib = tpls.map(T); const tplById = Object.fromEntries(lib.map((t) => [t.id, t]));
    try { const di = await q(sb.from('ww_app_config').select('value').eq('key', 'tpl_desc_i18n').maybeSingle()); const dv = (di && di.value) || {}; lib.forEach((t) => { const x = dv[t.id]; if (x && (x.sk === t.description || x.en === t.description)) { t.description_sk = x.sk; t.description_en = x.en; } }); } catch (e) { /* preklad popisov je voliteľný */ }
    // aktuálny cyklus
    let curRow = await q(sb.from('ww_cycles').select('*').eq('group_id', group.id).eq('week_start', ws).maybeSingle());
    if (!curRow) { await q(sb.rpc('ww_tick')); curRow = await q(sb.from('ww_cycles').select('*').eq('group_id', group.id).eq('week_start', ws).maybeSingle()); }
    const ccs = curRow ? await q(sb.from('ww_cycle_challenges').select('*').eq('cycle_id', curRow.id).order('slot_no')) : [];
    const cur = { id: curRow ? curRow.id : null, week_start: ws, status: curRow ? curRow.status : 'running', dates, challenges: ccs.filter((c) => !c.for_user || c.for_user === uid).map((c) => ({ id: c.id, tpl: tplById[c.template_id], slot: c.slot_no, source: c.source, votes: c.votes_at_selection, catchup: c.source === 'catchup' })) };
    const logs = {};
    if (ccs.length) { const lr = await q(sb.from('ww_logs').select('*').in('cycle_challenge_id', ccs.map((c) => c.id))); lr.forEach((l) => { logs[l.user_id + '|' + l.cycle_challenge_id + '|' + l.date] = { done: l.done, value: l.value != null ? +l.value : undefined, src: l.proof_type === 'verified' ? 'verified' : l.proof_type ? 'proof' : 'self', url: l.proof_url, note: l.note }; }); }
    // budúci cyklus
    const nd = new Date(monday(new Date())); nd.setDate(nd.getDate() + 7); const nws = iso(nd);
    let nextRow = await q(sb.from('ww_cycles').select('*').eq('group_id', group.id).eq('week_start', nws).maybeSingle());
    const props = nextRow ? await q(sb.from('ww_proposals').select('*').eq('cycle_id', nextRow.id).is('removed_by', null)) : [];
    const votes = nextRow ? await q(sb.from('ww_votes').select('*').eq('cycle_id', nextRow.id)) : [];
    const vetoes = nextRow ? await q(sb.from('ww_vetoes').select('*').eq('cycle_id', nextRow.id)) : [];
    const vetoMap = {}; vetoes.forEach((v) => { vetoMap[v.by_user + '|' + v.against_user] = v.proposal_id; });
    const next = { id: nextRow ? nextRow.id : null, week_start: nws, status: nextRow ? nextRow.status : 'proposing', proposals: props.map((p) => ({ id: p.id, tpl: tplById[p.template_id], authors: p.authors, votes: votes.filter((v) => v.proposal_id === p.id).map((v) => v.user_id), vetoed: vetoes.some((v) => v.proposal_id === p.id) })), vetoes: vetoMap };
    if (nextRow && nextRow.status === 'selected') { const nccs = await q(sb.from('ww_cycle_challenges').select('*').eq('cycle_id', nextRow.id).order('slot_no')); next.simulated = nccs.map((c) => ({ id: c.id, tpl: tplById[c.template_id], slot: c.slot_no, source: c.source, votes: c.votes_at_selection })); }
    // aktivita
    const evRows = await q(sb.from('ww_events').select('*').eq('group_id', group.id).order('created_at', { ascending: false }).limit(60));
    const evIds = evRows.map((e) => e.id);
    const reacts = evIds.length ? await q(sb.from('ww_reactions').select('*').in('event_id', evIds)) : [];
    const comms = evIds.length ? await q(sb.from('ww_comments').select('*').in('event_id', evIds).is('deleted_at', null).order('created_at')) : [];
    const events = evRows.map((e) => { const kudos = {}; reacts.filter((r) => r.event_id === e.id).forEach((r) => { (kudos[r.emoji] = kudos[r.emoji] || []).push(r.from_user); }); const ph = (e.type === 'photo' || e.type === 'story' || e.type === 'activity') ? photos.find((p) => p.id === e.ref_id) : null; return { id: e.id, user: e.user_id, type: e.type, a: e.type === 'activity' ? (e.payload || {}) : undefined, n: e.payload && (e.payload.n || e.payload.badges), title: e.payload && (e.payload.title || e.payload.caption || e.payload.text), proof: e.payload && e.payload.proof, photo: ph ? ph.url : null, ts: new Date(e.created_at).getTime(), kudos, comments: comms.filter((c) => c.event_id === e.id).map((c) => ({ user: c.user_id, text: c.text, ts: new Date(c.created_at).getTime() })) }; });
    // ciele
    const goalRows = await q(sb.from('ww_goals').select('*').eq('user_id', uid).eq('status', 'active').order('created_at'));
    const entries = goalRows.length ? await q(sb.from('ww_metric_entries').select('*').eq('user_id', uid).order('date')) : [];
    const goals = goalRows.map((g) => ({ id: g.id, metric: g.metric, category: g.category || null, label: g.label || null, unit: g.unit || null, dir: g.direction, interval: g.interval, target: +g.target, share: g.share_progress, entries: entries.filter((e) => e.metric === g.metric).map((e) => ({ date: e.date, value: +e.value })) }));
    // výsledky (história uzavretých cyklov)
    let cycRows = await q(sb.from('ww_cycles').select('id,week_start').eq('group_id', group.id).eq('status', 'closed').order('week_start'));
    if (cycRows.length) { const withCc = await q(sb.from('ww_cycle_challenges').select('cycle_id').in('cycle_id', cycRows.map((c) => c.id))); const has = new Set(withCc.map((x) => x.cycle_id)); cycRows = cycRows.filter((c) => has.has(c.id)); }   // týždne bez výziev (štart skupiny) sa nerátajú
    const resRows = cycRows.length ? await q(sb.from('ww_cycle_results').select('*').in('cycle_id', cycRows.map((c) => c.id))) : [];
    const results = {}; members.forEach((m) => { const rs = cycRows.map((c) => resRows.find((r) => r.cycle_id === c.id && r.user_id === m.id)); const last = [...rs].reverse().find(Boolean); results[m.id] = { streak: last ? last.streak_after : 0, extra: last ? last.extra_points_after : 0, badges: last ? (last.badges_after || 0) : 0, hist: rs.map((r) => (r ? +r.pct : 0)), cycles: cycRows.map((c, i) => ({ id: c.id, week_start: c.week_start, pct: rs[i] ? +rs[i].pct : 0, is_100: rs[i] ? rs[i].is_100 : false, badges: rs[i] ? (rs[i].badges_earned || 0) : 0, streak: rs[i] ? rs[i].streak_after : 0, caught_up: rs[i] ? !!rs[i].caught_up : false, paused: rs[i] ? rs[i].paused : false })) }; });
    // #5 dobehnutie: minulý týždeň nesplnený a ešte nezačaté
    let catchup = { available: false, active: false };
    try {
      const prevRow = cycRows.length ? cycRows[cycRows.length - 1] : null; const prevRes = prevRow ? resRows.find((r) => r.cycle_id === prevRow.id && r.user_id === uid) : null;
      const cus = await q(sb.from('ww_catchups').select('*').eq('user_id', uid));
      const nd7 = new Date(monday(new Date())); nd7.setDate(nd7.getDate() - 7);
      const isPrevWeek = prevRow && prevRow.week_start === iso(nd7);
      const started = prevRow && cus.find((x) => x.from_cycle_id === prevRow.id);
      catchup = { available: !!(isPrevWeek && prevRes && !prevRes.is_100 && !prevRes.caught_up && !prevRes.paused && !started), active: !!(started && started.status === 'pending'), from_week: prevRow ? prevRow.week_start : null };
    } catch (e) { console.warn('catchup', e); }
    // pravidlá + chat (fix6)
    let rules = [], messages = [];
    try {
      const rr = await q(sb.from('ww_rules').select('*').eq('group_id', group.id).order('created_at', { ascending: false }).limit(100));
      const rv = rr.length ? await q(sb.from('ww_rule_votes').select('*').in('rule_id', rr.map((r) => r.id))) : [];
      rules = rr.map((r) => ({ id: r.id, text: r.text, by: r.proposed_by, kind: r.kind, target: r.target_rule_id, status: r.status, ts: new Date(r.created_at).getTime(), decided: r.decided_at ? new Date(r.decided_at).getTime() : null, yes: rv.filter((v) => v.rule_id === r.id && v.vote).map((v) => v.user_id), no: rv.filter((v) => v.rule_id === r.id && !v.vote).map((v) => v.user_id) }));
      const mr = await q(sb.from('ww_messages').select('*').eq('group_id', group.id).order('created_at', { ascending: false }).limit(200));
      messages = mr.reverse().map((m) => ({ id: m.id, user: m.user_id, text: m.text, ts: new Date(m.created_at).getTime(), replyTo: m.reply_to || null, reactions: {} }));
      try { if (mr.length) { const rx = await q(sb.from('ww_msg_reactions').select('*').in('message_id', mr.map((m) => m.id))); rx.forEach((r) => { const m = messages.find((x) => x.id === r.message_id); if (m) (m.reactions[r.emoji] = m.reactions[r.emoji] || []).push(r.from_user); }); } } catch (e) { console.warn('msg reactions (fix16 not applied?)', e); }
    } catch (e) { console.warn('rules/chat', e); }
    // história uzavretých cyklov: vybrané výzvy + návrhy (posledných 8)
    let history = [];
    try {
      const hc = cycRows.slice(-8);
      if (hc.length) {
        const hcc = await q(sb.from('ww_cycle_challenges').select('*').in('cycle_id', hc.map((c) => c.id)).is('for_user', null).order('slot_no'));
        const hp = await q(sb.from('ww_proposals').select('*').in('cycle_id', hc.map((c) => c.id)).is('removed_by', null));
        history = hc.map((c) => ({ id: c.id, week_start: c.week_start, challenges: hcc.filter((x) => x.cycle_id === c.id).map((x) => ({ id: x.id, tpl: tplById[x.template_id], source: x.source, votes: x.votes_at_selection })), proposals: hp.filter((x) => x.cycle_id === c.id).map((x) => ({ id: x.id, tpl: tplById[x.template_id], authors: x.authors })), results: resRows.filter((r) => r.cycle_id === c.id).map((r) => ({ user: r.user_id, pct: +r.pct })) })).reverse();
      }
    } catch (e) { console.warn('history', e); }
    S = { me: uid, lang: meRow.locale || 'sk', rules, messages, history, theme: (meRow.notif_prefs || {}).theme || null, consent: !!meRow.consent_at, group: { id: group.id, name: group.name, emoji: group.emoji || '💪', avatar_url: group.avatar_url || null, admin: group.admin_id, slots: group.slots, tz: group.tz, members, paused }, lib, cur, next, logs, events, goals, results, catchup, profile: { checkinTime: (meRow.checkin_time || '20:30').slice(0, 5), notif: meRow.notif_prefs || {}, avatar_url: meRow.avatar_url || null, location: meRow.location || '', bio: meRow.bio || '', stats: meRow.stats || {}, share: meRow.share_fields || {} }, photos };
    return S;
  }
  async function reload() { return load(); }
  const ccByTpl = (tplId) => S.cur.challenges.find((c) => c.tpl && c.tpl.id === tplId);

  const ST = {
    monday, iso, get state() { return S; }, get client() { return sb; }, get user() { return U; },
    async init(client, user) { sb = client; U = user; return load(); },
    async reload() { return reload(); },
    async setLog(cc, date, patch0) {
      const { wasDone, ...patch } = patch0; const k = S.me + '|' + cc + '|' + date; const cur = S.logs[k] || {}; const merged = { ...cur, ...patch };
      const row = { user_id: S.me, cycle_challenge_id: cc, date, done: merged.done ?? null, value: merged.value ?? null, note: merged.note ?? null, proof_url: merged.url ?? null, proof_type: merged.src === 'proof' ? (merged.url ? 'strava' : 'photo') : merged.src === 'verified' ? 'verified' : null, logged_at: new Date().toISOString() };
      await q(sb.from('ww_logs').upsert(row, { onConflict: 'user_id,cycle_challenge_id,date' }));
      S.logs[k] = merged;
      if (patch.done && !(wasDone != null ? wasDone : cur.done)) { const c = S.cur.challenges.find((x) => x.id === cc); await q(sb.from('ww_events').insert({ group_id: S.group.id, user_id: S.me, type: 'done', ref_id: cc, payload: { title: c ? c.tpl.title_sk : '', proof: merged.src === 'proof' ? true : undefined } })); }
    },
    async clearLog(cc, date) { await q(sb.from('ww_logs').delete().eq('user_id', S.me).eq('cycle_challenge_id', cc).eq('date', date)); delete S.logs[S.me + '|' + cc + '|' + date]; },
    async uploadProof(file) { const path = `${S.me}/${Date.now()}.jpg`; await q(sb.storage.from('ww-proofs').upload(path, file, { contentType: 'image/jpeg', upsert: true })); const { data } = await sb.storage.from('ww-proofs').createSignedUrl(path, 60 * 60 * 24 * 90); return data ? data.signedUrl : path; },
    async addProposal(tpl) {
      let tplId = tpl.id;
      const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
      if ((!tplId || tpl.source === 'custom' && !S.lib.find((x) => x.id === tplId))) { const dup = S.lib.find((x) => x.source === 'custom' && same(x.title_sk, tpl.title_sk)); if (dup) tplId = dup.id; }   // rovnaký názov = tá istá výzva (#31)
      if (!tplId || tpl.source === 'custom' && !S.lib.find((x) => x.id === tplId)) { const ins = { group_id: S.group.id, title_sk: tpl.title_sk, title_en: tpl.title_en || tpl.title_sk, category: tpl.category, type: tpl.type, target: tpl.target, unit: tpl.unit, min_days: tpl.min_days || null, proof: tpl.proof || 'optional', difficulty: tpl.difficulty || null, created_by: S.me }; if (tpl.description) ins.description = tpl.description; const row = await q(sb.from('ww_challenge_templates').insert(ins).select().single()); tplId = row.id; }
      const ex = await q(sb.from('ww_proposals').select('*').eq('cycle_id', S.next.id).eq('template_id', tplId).maybeSingle());
      if (ex) { if (!ex.authors.includes(S.me)) await q(sb.from('ww_proposals').update({ authors: [...ex.authors, S.me] }).eq('id', ex.id)); }
      else await q(sb.from('ww_proposals').insert({ cycle_id: S.next.id, template_id: tplId, authors: [S.me] }));
      await reload();
    },
    async updateProposal(pid, tpl) {
      const p = S.next.proposals.find((x) => x.id === pid); const cur = p && p.tpl;
      const fields = { title_sk: tpl.title_sk, title_en: tpl.title_en || tpl.title_sk, category: tpl.category, type: tpl.type, target: tpl.target, unit: tpl.unit, min_days: tpl.min_days || null, proof: tpl.proof || 'optional' }; if (tpl.description !== undefined) fields.description = tpl.description;
      if (cur && cur.source === 'custom') { await q(sb.from('ww_challenge_templates').update(fields).eq('id', cur.id)); }
      else { const row = await q(sb.from('ww_challenge_templates').insert({ ...fields, group_id: S.group.id, created_by: S.me }).select().single()); await q(sb.from('ww_proposals').update({ template_id: row.id }).eq('id', pid)); }
      await reload();
    },
    async removeProposal(pid) { const p = S.next.proposals.find((x) => x.id === pid); if (p.authors.length > 1) await q(sb.from('ww_proposals').update({ authors: p.authors.filter((a) => a !== S.me) }).eq('id', pid)); else await q(sb.from('ww_proposals').delete().eq('id', pid)); await reload(); },
    async toggleVote(pid) { const p = S.next.proposals.find((x) => x.id === pid); if (p.votes.includes(S.me)) await q(sb.from('ww_votes').delete().eq('cycle_id', S.next.id).eq('proposal_id', pid).eq('user_id', S.me)); else await q(sb.from('ww_votes').insert({ cycle_id: S.next.id, proposal_id: pid, user_id: S.me })); await reload(); },
    async veto(pid, against) { await q(sb.from('ww_vetoes').insert({ cycle_id: S.next.id, proposal_id: pid, by_user: S.me, against_user: against })); await reload(); },
    // kudos/komentár/správa: appka už upravila S optimisticky (#54); tu len zápis do DB, bez reload
    async toggleKudos(eid, k) { const ev = S.events.find((x) => x.id === eid); const has = (ev.kudos[k] || []).includes(S.me); if (!has) await q(sb.from('ww_reactions').delete().eq('event_id', eid).eq('from_user', S.me).eq('emoji', k)); else { const { error } = await sb.from('ww_reactions').insert({ event_id: eid, from_user: S.me, emoji: k }); if (error && !/duplicate|23505/.test(error.message || '')) throw error; } },
    async addComment(eid, text) { await q(sb.from('ww_comments').insert({ event_id: eid, user_id: S.me, text })); },
    async createInvite() { return q(sb.rpc('ww_create_invite')); },
    async joinGroup(code) { const gid = await q(sb.rpc('ww_join_group', { p_code: code })); await reload(); return gid; },
    async setPause(weeks) { await q(sb.rpc('ww_set_pause', { p_weeks: weeks || 0 })); await reload(); },
    async addGoal(g) {
      const m = C.metrics[g.metric] || { dir: g.dir || 'up', interval: g.interval || 'free', unit: g.unit || '' };
      const ex = S.goals.find((x) => x.metric === g.metric);           // #7: jeden aktívny cieľ na metriku → upraviť
      if (ex) { await this.updateGoal(ex.id, { target: g.target, category: g.category, label: g.label, unit: g.unit, interval: g.interval }); return 'updated'; }
      await q(sb.from('ww_goals').insert({ user_id: S.me, metric: g.metric, direction: g.dir || m.dir, target: g.target, start_value: g.start ?? null, interval: g.interval || m.interval, category: g.category || null, label: g.label || null, unit: g.unit || null }));
      if (g.start != null) await q(sb.from('ww_metric_entries').upsert({ user_id: S.me, metric: g.metric, date: iso(new Date()), value: g.start }, { onConflict: 'user_id,metric,date' }));
      await reload(); return 'added';
    },
    async updateGoal(id, p) { const row = {}; ['target', 'category', 'label', 'unit', 'interval', 'direction'].forEach((k) => { if (p[k] != null && p[k] !== '') row[k] = p[k]; }); if (p.dir) row.direction = p.dir; if (p.share != null) row.share_progress = p.share; await q(sb.from('ww_goals').update(row).eq('id', id)); await reload(); },
    async proposeRule(text, kind, target) { await q(sb.rpc('ww_propose_rule', { p_text: text, p_kind: kind || 'add', p_target: target || null })); await reload(); },
    async voteRule(id, v) { const st = await q(sb.rpc('ww_vote_rule', { p_rule: id, p_vote: v })); await reload(); return st; },
    async sendMessage(text, replyTo) { const ins = { group_id: S.group.id, user_id: S.me, text }; if (replyTo) ins.reply_to = replyTo; let row; try { row = await q(sb.from('ww_messages').insert(ins).select('id,created_at').single()); } catch (e) { if (!replyTo || !/reply_to|column/i.test(e.message || '')) throw e; delete ins.reply_to; row = await q(sb.from('ww_messages').insert(ins).select('id,created_at').single()); }   /* fallback kým nie je spustený ww_fix16.sql */ const m = S.messages.find((x) => String(x.id).startsWith('tmp') && x.text === text); if (m && row) { m.id = row.id; m.ts = new Date(row.created_at).getTime(); } },
    async toggleMsgReaction(mid, emoji) { const m = S.messages.find((x) => x.id === mid); if (!m) return; const has = (m.reactions[emoji] || []).includes(S.me); if (has) { await q(sb.from('ww_msg_reactions').delete().eq('message_id', mid).eq('from_user', S.me).eq('emoji', emoji)); m.reactions[emoji] = m.reactions[emoji].filter((u) => u !== S.me); if (!m.reactions[emoji].length) delete m.reactions[emoji]; } else { const { error } = await sb.from('ww_msg_reactions').insert({ message_id: mid, from_user: S.me, emoji }); if (error && !/duplicate|23505/.test(error.message || '')) throw error; (m.reactions[emoji] = m.reactions[emoji] || []).push(S.me); } },
    async deleteMessage(mid) { await q(sb.from('ww_messages').delete().eq('id', mid).eq('user_id', S.me)); S.messages = S.messages.filter((x) => x.id !== mid); },
    async savePushSubscription(sub) { const ep = sub && sub.endpoint; if (!ep) return; await q(sb.from('ww_push_subscriptions').delete().eq('user_id', S.me).filter('subscription->>endpoint', 'eq', ep)); await q(sb.from('ww_push_subscriptions').insert({ user_id: S.me, subscription: sub })); },
    async setTheme(name) { await q(sb.from('ww_users').update({ notif_prefs: { ...S.profile.notif, theme: name } }).eq('id', S.me)); S.theme = name; },
    async reopenCurrent() { await q(sb.rpc('ww_reopen_current')); await reload(); },
    async selectNow() { await q(sb.rpc('ww_select_now')); await reload(); },
    async startCatchup() { const n = await q(sb.rpc('ww_start_catchup')); await reload(); return n; },
    async deleteGoal(id) { await q(sb.from('ww_goals').update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', id)); await reload(); },
    async setGoalShare(id, v) { await q(sb.from('ww_goals').update({ share_progress: v }).eq('id', id)); S.goals.find((x) => x.id === id).share = v; },
    async setMetricEntry(id, date, value) { const g = S.goals.find((x) => x.id === id); if (value == null) await q(sb.from('ww_metric_entries').delete().eq('user_id', S.me).eq('metric', g.metric).eq('date', date)); else await q(sb.from('ww_metric_entries').upsert({ user_id: S.me, metric: g.metric, date, value }, { onConflict: 'user_id,metric,date' })); await reload(); },
    async updateProfile(p) { const row = {}; if (p.name) row.name = p.name; if (p.lang) row.locale = p.lang; if (p.checkinTime) row.checkin_time = p.checkinTime; if (p.notif) row.notif_prefs = { ...S.profile.notif, ...p.notif }; if (p.consent) row.consent_at = new Date().toISOString(); if (p.location != null) row.location = p.location; if (p.bio != null) row.bio = p.bio; if (p.stats) row.stats = { ...S.profile.stats, ...p.stats }; if (p.share) row.share_fields = { ...S.profile.share, ...p.share }; if (p.avatar_url !== undefined) row.avatar_url = p.avatar_url; await q(sb.from('ww_users').update(row).eq('id', S.me)); await reload(); },
    async uploadAvatar(blob) { const path = S.me + '/avatar.jpg'; await q(sb.storage.from('ww-avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true })); const { data } = sb.storage.from('ww-avatars').getPublicUrl(path); const url = data.publicUrl + '?t=' + Date.now(); await this.updateProfile({ avatar_url: url }); return url; },
    async addPhoto(blob, caption, kind) { const path = S.me + '/' + Date.now() + '.jpg'; await q(sb.storage.from('ww-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false })); await q(sb.from('ww_photos').insert({ user_id: S.me, group_id: S.group.id, path, caption: caption || null, kind: kind || 'photo', expires_at: kind === 'story' ? new Date(Date.now() + 24 * 3600e3).toISOString() : null })); const { data } = await sb.storage.from('ww-photos').createSignedUrl(path, 90 * 24 * 3600); await reload(); return data ? data.signedUrl : path; },
    async addActivity(p) {
      // #52: aktivita navyše – voliteľná fotka (ww_photos kind 'activity', bez trigger-udalosti) + udalosť 'activity' s detailmi
      let photoId = null;
      if (p.blob) { const path = S.me + '/' + Date.now() + '.jpg'; await q(sb.storage.from('ww-photos').upload(path, p.blob, { contentType: 'image/jpeg', upsert: false })); const row = await q(sb.from('ww_photos').insert({ user_id: S.me, group_id: S.group.id, path, caption: (p.title || '').slice(0, 200) || null, kind: 'activity' }).select('id').single()); photoId = row.id; }
      await q(sb.from('ww_events').insert({ group_id: S.group.id, user_id: S.me, type: 'activity', ref_id: photoId, payload: { atype: p.atype, value: p.value, unit: p.unit, note: p.note || '', title: p.title, date: p.date, cc: p.cc || null } }));
      if (p.cc) { const k = S.me + '|' + p.cc + '|' + p.date; const cur = S.logs[k] || {}; const c = S.cur.challenges.find((x) => x.id === p.cc); const tp = (c && c.tpl && c.tpl.type) || '';
        if (tp === 'binary_daily' || tp === 'once') { if (!cur.done) await this.setLog(p.cc, p.date, { done: true, src: cur.src || 'self' }); }
        else await this.setLog(p.cc, p.date, { value: Math.round(((cur.value || 0) + p.value) * 100) / 100, src: cur.src || 'self' }); }
      await reload();
    },
    async deleteActivity(id) { const ev = S.events.find((x) => x.id === id); await q(sb.from('ww_events').delete().eq('id', id).eq('user_id', S.me)); if (ev && ev.photo) { const ph = S.photos.find((p) => p.url === ev.photo); if (ph) { const row = await q(sb.from('ww_photos').select('path').eq('id', ph.id).maybeSingle()); await q(sb.from('ww_photos').delete().eq('id', ph.id)); if (row && row.path) { try { await sb.storage.from('ww-photos').remove([row.path]); } catch (_) {} } } } await reload(); },
    async deletePhoto(id) { const row = await q(sb.from('ww_photos').select('path').eq('id', id).maybeSingle()); await q(sb.from('ww_events').delete().eq('ref_id', id).eq('user_id', S.me)); await q(sb.from('ww_photos').delete().eq('id', id)); if (row && row.path) { try { await sb.storage.from('ww-photos').remove([row.path]); } catch (_) {} } await reload(); },
    async uploadGroupAvatar(blob) { const path = S.me + '/group-' + S.group.id + '.jpg'; await q(sb.storage.from('ww-avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true })); const { data } = sb.storage.from('ww-avatars').getPublicUrl(path); await this.updateGroup({ avatar_url: data.publicUrl + '?t=' + Date.now() }); },
    async updateGroup(p) { await q(sb.from('ww_groups').update(p).eq('id', S.group.id)); await reload(); },
    async exportJSON() { return JSON.stringify(S, null, 2); },
    async deleteAccount() { await q(sb.rpc('ww_delete_me')).catch(() => {}); await sb.auth.signOut(); },
    async signOut() { await sb.auth.signOut(); },
  };
  window.WW_STORE_SUPABASE = ST;
})();
