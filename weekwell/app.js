// Weekwell — app (iterácia 1). Vanilla JS, bez build kroku. Store = WW_STORE (stub alebo Supabase, rovnaké async API).
(function () {
  const C = window.WW_CONFIG; let ST = null; let S = null;
  window.WW_STATE = { lang: 'sk', tab: location.hash.replace('#', '') || 'home', selDate: null, lb: 'week' };
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CAT_ICON = { movement: '🏃', nutrition: '🥗', alcohol: '🍺', sleep: '😴', mental: '🧠', lifestyle: '🌿' };
  const today = () => ST.iso(new Date());
  const me = () => S.group.members.find((m) => m.id === S.me) || { name: '?', avatar: '👤' };
  const member = (id) => S.group.members.find((m) => m.id === id) || { name: '?', avatar: '👤' };
  const tplTitle = (tpl) => (tpl ? ((WW_STATE.lang === 'en' ? tpl.title_en : tpl.title_sk) || tpl.title_sk) : '?');
  let toastT = null;
  function toast(msg) { let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); } el.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => el.remove(), 1800); }
  async function act(fn) { try { await fn(); } catch (e) { console.error(e); toast('⚠️ ' + (e.message || e)); } S = ST.state; render(); }

  // ---------- výpočty (spec 3.1, 6) ----------
  function logsFor(uid, ccId) { return S.cur.dates.map((d) => S.logs[uid + '|' + ccId + '|' + d] || null); }
  function challengePct(uid, cc) {
    const L = logsFor(uid, cc.id); const t = cc.tpl; if (!t) return 0;
    if (t.type === 'binary_daily') return Math.min(L.filter((l) => l && l.done).length / t.target, 1);
    if (t.type === 'once') return L.some((l) => l && l.done) ? 1 : 0;
    if (t.type === 'count_daily') return Math.min(L.filter((l) => l && l.value >= t.target).length / (t.min_days || 5), 1);
    if (t.type === 'count_weekly') return Math.min(L.reduce((a, l) => a + (l && l.value ? +l.value : 0), 0) / t.target, 1);
    return 0;
  }
  function memberPct(uid) { const cs = S.cur.challenges; if (!cs.length) return 0; return cs.reduce((a, cc) => a + challengePct(uid, cc), 0) / cs.length; }
  function activeMembers() { return S.group.members.filter((m) => !S.group.paused.includes(m.id)); }
  function groupPct() { const am = activeMembers(); if (!am.length) return 0; return am.reduce((a, m) => a + memberPct(m.id), 0) / am.length; }
  const P = (x) => Math.round(x * 100) + ' %';
  function phase() { if (S.next && S.next.status && S.next.status !== 'proposing' && S.next.status !== 'voting') return 'selected'; const dow = (new Date().getDay() + 6) % 7, h = new Date().getHours(); if (dow < 4 || (dow === 4 && h < 18)) return 'proposing'; if (dow === 6 && h >= 18) return 'selected'; return 'voting'; }

  // ---------- engine výberu (spec 4.3) – klientske demo pre stub ----------
  function selectChallenges(S) {
    const M = S.group.members.filter((m) => !S.group.paused.includes(m.id)).length, SLOTS = S.group.slots, CAT = C.categoryMaxPerCycle;
    const pool = S.next.proposals.filter((p) => !p.vetoed); const cnt = {}; const out = [];
    const take = (list, src) => { for (const p of list) { if (out.length >= SLOTS) break; const c = p.tpl.category; if ((cnt[c] || 0) >= CAT) continue; if (out.find((o) => o.tpl.id === p.tpl.id)) continue; cnt[c] = (cnt[c] || 0) + 1; out.push({ tpl: p.tpl, source: src, votes: p.votes ? p.votes.length : 0 }); } };
    const byVotes = (a, b) => b.votes.length - a.votes.length || Math.random() - 0.5;
    take(pool.filter((p) => p.votes.length > M / 2).sort(byVotes), 'vote_majority');
    take(pool.filter((p) => p.votes.length > 0 && p.votes.length <= M / 2).sort(byVotes), 'vote_rank');
    take(S.cur.challenges.map((cc) => ({ tpl: cc.tpl, votes: [] })), 'carry_over');
    take(pool.filter((p) => p.votes.length === 0).sort(() => Math.random() - 0.5), 'random_pool');
    take(S.lib.filter((t) => !S.cur.challenges.find((cc) => cc.tpl.id === t.id)).sort(() => Math.random() - 0.5).map((t) => ({ tpl: t, votes: [] })), 'library');
    return out.map((o, i) => ({ ...o, slot: i + 1 }));
  }
  const SRC_T = { vote_majority: 'majority', vote_rank: 'by_votes', carry_over: 'carry_over', random_pool: 'random_pool', library: 'library', manual: 'library' };

  // ---------- UI helpers ----------
  function ring(pct, label) { const r = 36, c = 2 * Math.PI * r, o = c * (1 - pct); return `<div class="ring"><svg width="86" height="86"><circle cx="43" cy="43" r="${r}" stroke="#26282d" stroke-width="8" fill="none"/><circle cx="43" cy="43" r="${r}" stroke="#34d399" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${o}"/></svg><div class="v">${Math.round(pct * 100)}%<small>${esc(label)}</small></div></div>`; }
  function sheet(html) { const el = document.createElement('div'); el.className = 'sheet'; el.innerHTML = `<div class="in">${html}</div>`; el.addEventListener('click', (e) => { if (e.target === el) el.remove(); }); document.body.appendChild(el); return el; }
  function tplLine(tpl) { if (!tpl) return ''; const tt = tpl.type === 'binary_daily' ? `${tpl.target} ${t('days')}` : tpl.type === 'once' ? t('type_once') : `${tpl.target} ${tpl.unit}`; return `<span class="pill">${t('cat_' + tpl.category)}</span> <span class="pill">${esc(tt)}</span> ${tpl.difficulty ? `<span class="pill">${t('diff_' + tpl.difficulty)}</span>` : ''}`; }

  // ---------- HOME ----------
  function viewHome() {
    const sel = WW_STATE.selDate || today(); const todayI = S.cur.dates.indexOf(today());
    const dayNames = WW_STATE.lang === 'en' ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] : ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
    const days = S.cur.dates.map((d, i) => `<div class="d ${d === today() ? 'today' : ''} ${d === sel ? 'sel' : ''} ${i > todayI ? 'future' : ''}" data-d="${d}" data-f="${i > todayI ? 1 : 0}">${dayNames[i]}<b>${+d.slice(8)}</b></div>`).join('');
    const ph = phase(); const phaseTxt = ph === 'proposing' ? t('phase_proposing') : ph === 'voting' ? t('phase_voting') : t('phase_selected');
    const mine = S.next.proposals.filter((p) => p.authors.includes(S.me)).length; const votedN = S.next.proposals.filter((p) => p.votes.includes(S.me)).length;
    const items = S.cur.challenges.map((cc) => {
      const l = S.logs[S.me + '|' + cc.id + '|' + sel] || {}; const tpl = cc.tpl || {}; const pct = challengePct(S.me, cc);
      const ctrl = (tpl.type === 'binary_daily' || tpl.type === 'once') ? `<div class="chk ${l.done ? 'on' : ''}" data-chk="${cc.id}">${l.done ? '✔' : ''}</div>` : `<input class="num" type="number" inputmode="decimal" data-num="${cc.id}" value="${l.value != null ? l.value : ''}" placeholder="${esc(tpl.unit)}">`;
      const src = l.src === 'proof' ? `<span class="pill acc">${t('src_proof')}</span>` : l.src === 'verified' ? `<span class="pill acc">${t('src_verified')}</span>` : '';
      return `<div class="item"><div class="ic">${CAT_ICON[tpl.category] || '🎯'}</div><div class="grow"><div class="t">${esc(tplTitle(tpl))}</div><div class="s">${tplLine(tpl)} ${src} ${tpl.proof === 'required' ? `<span class="pill warn">${t('proof_required')}</span>` : ''}</div><div class="bar"><i style="width:${pct * 100}%"></i></div></div><button class="mini ghost" data-proof="${cc.id}">${t('proof_add')}</button>${ctrl}</div>`;
    }).join('');
    const dueMetrics = S.goals.filter((g) => C.metrics[g.metric] && (C.metrics[g.metric].interval === 'daily' || (C.metrics[g.metric].interval === 'weekly' && S.cur.dates.indexOf(sel) === 6)));
    const metrics = dueMetrics.map((g) => { const e = g.entries.find((x) => x.date === sel); return `<div class="item"><div class="ic">📈</div><div class="grow"><div class="t">${t('m_' + g.metric)}</div><div class="s">${t('goal')}: ${g.target} ${C.metrics[g.metric].unit}</div></div><input class="num" type="number" inputmode="decimal" data-metric="${g.id}" value="${e ? e.value : ''}" placeholder="${C.metrics[g.metric].unit}"></div>`; }).join('');
    const solo = S.group.members.length === 1;
    return `
      <div class="card"><div class="row"><div>${ring(groupPct(), t('group_pct'))}</div><div>${ring(memberPct(S.me), t('my_pct'))}</div><div class="grow"><div style="font-weight:800">${esc(S.group.emoji)} ${esc(S.group.name)}</div><div class="muted">${t('week')} ${S.cur.week_start} · ${activeMembers().length}/${S.group.members.length} ${t('members').toLowerCase()}</div><div class="mt small">${esc(phaseTxt)}<br><span class="muted">${t('you_proposed', { n: mine })} · ${t('you_voted', { n: votedN })}</span></div></div></div>
      ${solo ? `<div class="muted mt">${t('solo_hint')}</div><div class="row mt"><button class="mini primary" data-invite="1">${t('invite')}</button><button class="mini" data-tab="challenges">${t('pick_for_week')}</button></div>` : ''}</div>
      <div class="card"><h3>${t('checkin_title')} <span class="muted" style="text-transform:none;font-weight:400">· ${sel === today() ? t('today') : sel}</span></h3><div class="days">${days}</div>${items || `<div class="muted">${t('no_items')}</div>`}${metrics}<div class="muted mt">${t('checkin_hint')}</div></div>`;
  }

  // ---------- VÝZVY ----------
  function viewChallenges() {
    const ph = phase();
    const thisWeek = S.cur.challenges.map((cc) => { const dots = S.cur.dates.map((d) => { const l = S.logs[S.me + '|' + cc.id + '|' + d]; return `<span style="display:inline-block;width:10px;height:10px;border-radius:5px;margin-right:3px;background:${l && (l.done || l.value) ? '#34d399' : '#26282d'}"></span>`; }).join(''); return `<div class="item"><div class="ic">${CAT_ICON[(cc.tpl || {}).category] || '🎯'}</div><div class="grow"><div class="t">${esc(tplTitle(cc.tpl))}</div><div class="s">${tplLine(cc.tpl)} · <span class="pill acc">${t(SRC_T[cc.source] || 'library')}${cc.votes ? ' ' + cc.votes : ''}</span></div><div class="mt">${dots}</div></div><div class="pct" style="font-weight:800">${P(challengePct(S.me, cc))}</div></div>`; }).join('') || `<div class="muted small">${t('no_items')}</div>`;
    const myP = S.next.proposals.filter((p) => p.authors.includes(S.me)); const othP = S.next.proposals.filter((p) => !p.authors.includes(S.me)); const myVetoes = S.next.vetoes || {};
    const pRow = (p, mineFlag) => {
      const authors = p.authors.map((a) => member(a).name).join(', '); const voted = p.votes.includes(S.me); const vetoedByMe = Object.values(myVetoes).includes(p.id);
      const canVeto = !p.vetoed && !mineFlag && !p.authors.some((a) => myVetoes[S.me + '|' + a]) && ph !== 'selected';
      const ctr = mineFlag ? `<button class="mini danger" data-delp="${p.id}">${t('delete')}</button>` : p.vetoed ? `<span class="pill bad">${t('vetoed')}</span>` : `<button class="mini ${voted ? 'primary' : ''}" data-vote="${p.id}" ${ph === 'selected' ? 'disabled' : ''}>${voted ? t('voted') : t('vote')}</button> <button class="mini ghost" data-veto="${p.id}" ${canVeto ? '' : 'disabled'}>${vetoedByMe ? '⛔' : t('veto')}</button>`;
      return `<div class="item" style="${p.vetoed ? 'opacity:.5' : ''}"><div class="ic">${CAT_ICON[(p.tpl || {}).category] || '🎯'}</div><div class="grow"><div class="t">${esc(tplTitle(p.tpl))}</div><div class="s">${tplLine(p.tpl)} · ${esc(authors)} · ${p.votes.length} ${t('votes')}${p.tpl && p.tpl.source === 'custom' ? ` · <span class="pill">${t('custom').toLowerCase()}</span>` : ''}</div></div><div>${ctr}</div></div>`;
    };
    const vetoInfo = Object.keys(myVetoes).filter((k) => k.startsWith(S.me + '|')).map((k) => t('veto_used', { name: member(k.split('|')[1]).name })).join(' · ');
    const sim = S.next.simulated ? `<div class="card"><h3>${t('selected_source')}</h3>${S.next.simulated.map((o) => `<div class="item"><div class="ic">${CAT_ICON[(o.tpl || {}).category] || '🎯'}</div><div class="grow"><div class="t">${t('slot')} ${o.slot}: ${esc(tplTitle(o.tpl))}</div><div class="s"><span class="pill acc">${t(SRC_T[o.source] || 'library')}${o.votes ? ' · ' + o.votes + ' ' + t('votes') : ''}</span></div></div></div>`).join('')}</div>` : '';
    const rh = (S.results[S.me] || { hist: [] }).hist; const hist = rh.map((h, i) => `<div class="row between small" style="padding:6px 0;border-top:1px solid var(--line)"><span>${t('week')} −${rh.length - i}</span><span class="grow"><div class="bar"><i style="width:${h}%"></i></div></span><b>${Math.round(h)} %</b></div>`).join('') || `<div class="muted small">${t('no_items')}</div>`;
    return `
      <div class="card"><h3>${t('this_week')}</h3>${thisWeek}</div>
      <div class="card"><h3>${t('next_week')} <span class="pill ${ph === 'voting' ? 'acc' : ''}" style="text-transform:none">${ph === 'proposing' ? t('phase_proposing') : ph === 'voting' ? t('phase_voting') : t('phase_selected')}</span></h3>
        <div class="row mt"><button class="primary" data-propose="lib">${t('from_library')}</button><button data-propose="custom">${t('custom')}</button></div>
        <div class="mt small muted">${t('my_proposals')} (${myP.length})</div>${myP.map((p) => pRow(p, true)).join('') || `<div class="muted small">${t('no_items')}</div>`}
        <div class="mt small muted">${t('others_proposals')} (${othP.length})</div>${othP.map((p) => pRow(p, false)).join('') || `<div class="muted small">${t('no_items')}</div>`}
        <div class="muted small mt">${t('veto_ethics')}${vetoInfo ? '<br>' + esc(vetoInfo) : ''}</div>
        ${C.stub ? `<button class="mini mt" data-sim="1">🎲 ${t('simulate')} (${t('slot')}y: ${S.group.slots})</button>` : ''}</div>
      ${sim}
      <div class="card"><h3>${t('history')}</h3>${hist}</div>`;
  }

  // ---------- SKUPINA ----------
  function viewGroup() {
    const lb = WW_STATE.lb; const R = (id) => S.results[id] || { streak: 0, extra: 0, hist: [] };
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const val = (m) => lb === 'week' ? memberPct(m.id) : lb === '4w' ? avg(R(m.id).hist.slice(-4)) / 100 : avg(R(m.id).hist) / 100;
    const rows = [...S.group.members].sort((a, b) => val(b) - val(a) || R(b.id).extra - R(a.id).extra).map((m, i) => `<tr class="${m.id === S.me ? 'me' : ''}"><td>${i + 1}</td><td>${m.avatar} ${esc(m.name)} ${m.id === S.group.admin ? `<span class="pill">${t('admin')}</span>` : ''} ${S.group.paused.includes(m.id) ? `<span class="pill warn">${t('paused')}</span>` : ''}</td><td class="small muted">${t('extra')} ${R(m.id).extra} · ${t('streak')} ${R(m.id).streak}</td><td class="pct">${P(val(m))}</td></tr>`).join('');
    const hl = Math.max(0, ...S.group.members.map((m) => R(m.id).hist.length));
    const ghist = [...Array(hl)].map((_, i) => { const a = avg(S.group.members.map((m) => R(m.id).hist[i] || 0)); return `<div style="flex:1;text-align:center"><div style="height:${a * 0.5}px;background:#0f8f6a;border-radius:3px 3px 0 0;margin:0 2px"></div><div class="muted" style="font-size:10px">${Math.round(a)}</div></div>`; }).join('');
    const evTxt = (e) => e.type === 'done' ? t('ev_done', { name: member(e.user).name, title: e.title || '' }) : e.type === 'pause' ? t('ev_pause', { name: member(e.user).name }) : e.type === 'selected' ? t('ev_selected') : e.type === 'extra' ? t('ev_extra', { name: member(e.user).name }) : e.type === 'join' ? t('ev_join', { name: member(e.user).name }) : e.type;
    const evs = [...S.events].sort((a, b) => b.ts - a.ts).map((e) => `<div class="ev"><div class="row"><div class="ic" style="font-size:20px">${e.user ? member(e.user).avatar : '🎲'}</div><div class="grow"><div>${esc(evTxt(e))} ${e.proof ? `<span class="pill acc">${t('src_proof')}</span>` : ''}</div><div class="muted small">${new Date(e.ts).toLocaleString(WW_STATE.lang === 'en' ? 'en-GB' : 'sk-SK', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</div></div></div>
      <div class="k">${C.kudos.map((k) => `<button class="${(e.kudos[k] || []).includes(S.me) ? 'on' : ''}" data-kudos="${e.id}" data-k="${k}">${k}${(e.kudos[k] || []).length ? ' ' + e.kudos[k].length : ''}</button>`).join('')}</div>
      ${e.comments.length ? `<div class="c">${e.comments.map((c) => `<div><b>${esc(member(c.user).name)}</b> ${esc(c.text)}</div>`).join('')}</div>` : ''}
      <div class="row mt"><input placeholder="${t('comment_ph')}" maxlength="${C.comment.maxChars}" data-cin="${e.id}"><button class="mini" data-csend="${e.id}">${t('send')}</button></div></div>`).join('') || `<div class="muted small">${t('no_items')}</div>`;
    const mem = S.group.members.map((m) => `<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>${m.avatar} ${esc(m.name)}</span><span>${m.id === S.group.admin ? `<span class="pill">${t('admin')}</span>` : ''} ${S.group.paused.includes(m.id) ? `<span class="pill warn">${t('paused')}</span>` : ''}</span></div>`).join('');
    const iPaused = S.group.paused.includes(S.me);
    return `
      <div class="card"><div class="row"><div>${ring(groupPct(), t('group_pct'))}</div><div class="grow"><div style="font-weight:800">${esc(S.group.emoji)} ${esc(S.group.name)}</div><div class="row mt" style="align-items:flex-end;height:60px">${ghist || `<span class="muted small">${t('no_items')}</span>`}</div></div></div></div>
      <div class="card"><div class="row between"><h3 style="margin:0">${t('leaderboard')}</h3><div class="seg">${['week', '4w', 'all'].map((k) => `<button class="${lb === k ? 'on' : ''}" data-lb="${k}">${t('lb_' + k)}</button>`).join('')}</div></div><table class="lb">${rows}</table></div>
      <div class="card"><h3>${t('activity')}</h3>${evs}</div>
      <div class="card"><div class="row between"><h3 style="margin:0">${t('members')} (${S.group.members.length}/${C.group.maxMembers})</h3><button class="mini primary" data-invite="1">${t('invite')}</button></div>${mem}
        <div class="row mt"><button class="mini ${iPaused ? 'primary' : ''}" data-pause="1">${iPaused ? t('im_back') : t('pause_me')}</button><button class="mini ghost" data-join="1">${t('join_code')}</button></div></div>`;
  }

  // ---------- POKROK ----------
  function chart(entries, target) {
    if (!entries.length) return `<div class="muted small">${t('no_items')}</div>`;
    const vs = entries.map((e) => e.value); const lo = Math.min(...vs, target) * 0.98, hi = Math.max(...vs, target) * 1.02; const W = 320, H = 110;
    const x = (i) => 10 + (i / Math.max(1, entries.length - 1)) * (W - 20); const y = (v) => H - 10 - ((v - lo) / (hi - lo || 1)) * (H - 20);
    const path = entries.map((e, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(e.value).toFixed(1)).join(' ');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}"><line x1="10" x2="${W - 10}" y1="${y(target)}" y2="${y(target)}" stroke="#fbbf24" stroke-dasharray="4 4"/><path d="${path}" fill="none" stroke="#34d399" stroke-width="2.5"/>${entries.map((e, i) => `<circle cx="${x(i)}" cy="${y(e.value)}" r="3" fill="#34d399"/>`).join('')}</svg>`;
  }
  function trend(g) { const e = g.entries; if (e.length < 2) return 'stable'; const last = e[e.length - 1].value, prev = e[Math.max(0, e.length - 1 - C.trend.windowWeeks)].value; const ch = (last - prev) / (prev || 1) * 100; const good = C.metrics[g.metric].dir === 'down' ? -ch : ch; return good >= C.trend.thresholdPct ? 'improving' : good <= -C.trend.thresholdPct ? 'attention' : 'stable'; }
  function viewProgress() {
    const cards = S.goals.map((g) => { const e = g.entries; const cur = e.length ? e[e.length - 1].value : '–'; const st = e.length ? e[0].value : '–'; const tr = trend(g); const u = C.metrics[g.metric].unit; return `<div class="card"><div class="row between"><b>${t('m_' + g.metric)}</b><span class="pill ${tr === 'improving' ? 'acc' : tr === 'attention' ? 'bad' : ''}">${t('trend_' + tr)}</span></div>${chart(e, g.target)}<div class="row between small"><span>${t('start')}<br><b>${st} ${u}</b></span><span class="center">${t('now')}<br><b style="font-size:16px">${cur} ${u}</b></span><span style="text-align:right">${t('goal')}<br><b>${g.target} ${u}</b></span></div><div class="row mt small"><label class="row" style="margin:0"><input type="checkbox" style="width:auto" data-share="${g.id}" ${g.share ? 'checked' : ''}> <span>${t('share_progress')}</span></label></div></div>`; }).join('');
    return `${cards}<div class="card"><button class="primary" data-addgoal="1">＋ ${t('add_goal')}</button></div>`;
  }

  // ---------- PROFIL ----------
  function viewProfile() {
    const m = me(); const n = S.profile.notif || {};
    return `
      <div class="card"><h3>${t('profile')}</h3><label>${t('name')}</label><input data-name="1" value="${esc(m.name)}"><label>${t('language')}</label><div class="seg">${['sk', 'en'].map((l) => `<button class="${WW_STATE.lang === l ? 'on' : ''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}</div><label>${t('checkin_time')}</label><input type="time" data-cktime="1" value="${S.profile.checkinTime}"></div>
      <div class="card"><h3>${t('notifications')}</h3>${[['checkin', 'notif_checkin'], ['reminder', 'notif_reminder'], ['social', 'notif_social'], ['proposals', 'notif_proposals']].map(([k, lab]) => `<label class="row" style="margin:6px 0"><input type="checkbox" style="width:auto" data-notif="${k}" ${n[k] ? 'checked' : ''}> <span>${t(lab)}</span></label>`).join('')}<div class="muted small mt">${t('install_ios')}<br>${t('install_android')}</div></div>
      <div class="card"><h3>${t('privacy')}</h3><div class="row"><button data-export="1">${t('export')}</button><button class="danger" data-delacc="1">${t('delete_account')}</button></div></div>
      <div class="card"><h3>${t('about')}</h3><div class="muted small">Weekwell ${C.version} · ${C.stub ? 'stub store' : 'Supabase'} · ${new Date().getFullYear()}</div><div class="row mt">${C.stub ? `<button class="mini" data-reset="1">${t('reset_stub')}</button>` : `<button class="mini" data-signout="1">${t('sign_out')}</button>`}</div></div>`;
  }

  // ---------- render + events ----------
  function render() {
    if (!S) return; const tab = WW_STATE.tab; const v = { home: viewHome, challenges: viewChallenges, group: viewGroup, progress: viewProgress, profile: viewProfile }[tab] || viewHome;
    $('#main').innerHTML = (C.stub ? `<div class="banner">${t('stub_banner')}</div>` : '') + v();
    document.querySelectorAll('nav.tabs a').forEach((a) => { a.classList.toggle('on', a.dataset.tab === tab); a.querySelector('em').textContent = t('tab_' + a.dataset.tab); });
    $('#sub').textContent = `${me().avatar.startsWith('<') ? '' : me().avatar} ${me().name} · ${P(memberPct(S.me))}`;
  }
  function go(tab) { WW_STATE.tab = tab; location.hash = tab; render(); window.scrollTo(0, 0); }
  const selDate = () => WW_STATE.selDate || today();

  document.addEventListener('click', (e) => {
    if (!S) return;
    const el = e.target.closest('[data-tab],[data-d],[data-chk],[data-proof],[data-propose],[data-vote],[data-veto],[data-delp],[data-sim],[data-lb],[data-kudos],[data-csend],[data-invite],[data-join],[data-pause],[data-addgoal],[data-lang],[data-export],[data-delacc],[data-reset],[data-signout]');
    if (!el) return; const d = el.dataset;
    if (d.tab) { e.preventDefault(); go(d.tab); return; }
    if (d.d) { if (d.f === '1') return; WW_STATE.selDate = d.d; render(); return; }
    if (d.chk) { const l = S.logs[S.me + '|' + d.chk + '|' + selDate()] || {}; const cc = S.cur.challenges.find((x) => x.id === d.chk); if (!l.done && cc && cc.tpl.proof === 'required' && l.src !== 'proof') { toast(t('proof_required')); return; } return act(() => l.done ? ST.clearLog(d.chk, selDate()) : ST.setLog(d.chk, selDate(), { done: true, src: l.src || 'self' })); }
    if (d.proof) {
      const sh = sheet(`<div class="h2">${t('proof_add')}</div><label>${t('proof_photo')}</label><input type="file" accept="image/*" capture="environment" data-pf-file><label>${t('proof_strava')}</label><input data-pf-url placeholder="https://www.strava.com/activities/…"><div class="row mt"><button class="primary" data-pf="save">${t('save')}</button><button data-pf="x">${t('cancel')}</button></div>`);
      sh.addEventListener('click', async (ev) => { const b = ev.target.closest('[data-pf]'); if (!b) return; if (b.dataset.pf === 'x') { sh.remove(); return; }
        const url = sh.querySelector('[data-pf-url]').value.trim(); const f = sh.querySelector('[data-pf-file]').files[0]; sh.remove();
        await act(async () => { let u = url || null; if (f && ST.uploadProof) u = await ST.uploadProof(await shrink(f)); await ST.setLog(d.proof, selDate(), { done: true, src: 'proof', url: u }); toast('📎 ' + t('src_proof')); }); });
      return;
    }
    if (d.propose === 'lib') { const sh = sheet(`<div class="h2">${t('from_library')}</div><input data-libq placeholder="🔍" class="mb"><div data-liblist>${libList('')}</div>`); sh.addEventListener('input', (ev) => { if (ev.target.matches('[data-libq]')) sh.querySelector('[data-liblist]').innerHTML = libList(ev.target.value); }); sh.addEventListener('click', (ev) => { const b = ev.target.closest('[data-pick]'); if (!b) return; const tp = S.lib.find((x) => x.id === b.dataset.pick); sh.remove(); act(() => ST.addProposal(tp)); }); return; }
    if (d.propose === 'custom') { const sh = sheet(`<div class="h2">${t('custom')}</div><label>${t('title')}</label><input data-c="title" maxlength="60"><div class="grid2"><div><label>${t('category')}</label><select data-c="category">${C.categories.map((c) => `<option value="${c}">${t('cat_' + c)}</option>`).join('')}</select></div><div><label>${t('type')}</label><select data-c="type"><option value="binary_daily">${t('type_binary_daily')}</option><option value="count_weekly">${t('type_count_weekly')}</option><option value="count_daily">${t('type_count_daily')}</option><option value="once">${t('type_once')}</option></select></div><div><label>${t('target')}</label><input type="number" data-c="target" value="5"></div><div><label>${t('unit')}</label><input data-c="unit" value="days"></div></div><label class="row mt"><input type="checkbox" style="width:auto" data-c="proof"> <span>${t('proof_required')}</span></label><div class="row mt"><button class="primary" data-csave="1">${t('save')}</button><button data-cx="1">${t('cancel')}</button></div>`); sh.addEventListener('click', (ev) => { if (ev.target.closest('[data-cx]')) { sh.remove(); return; } if (!ev.target.closest('[data-csave]')) return; const g = (k) => sh.querySelector(`[data-c="${k}"]`); const title = g('title').value.trim(); if (!title) return; const tpl = { id: null, category: g('category').value, title_sk: title, title_en: title, type: g('type').value, target: +g('target').value || 1, unit: g('unit').value, proof: g('proof').checked ? 'required' : 'optional', source: 'custom' }; if (C.stub) tpl.id = 'cust' + Date.now(); sh.remove(); act(() => ST.addProposal(tpl)); }); return; }
    if (d.vote) return act(() => ST.toggleVote(d.vote));
    if (d.veto) { const p = S.next.proposals.find((x) => x.id === d.veto); const against = p.authors.find((a) => a !== S.me) || p.authors[0]; if (!confirm(t('veto_confirm', { title: tplTitle(p.tpl), name: member(against).name }) + '\n\n' + t('veto_ethics'))) return; return act(() => ST.veto(d.veto, against)); }
    if (d.delp) return act(() => ST.removeProposal(d.delp));
    if (d.sim) return act(() => ST.simulateSelection(selectChallenges));
    if (d.lb) { WW_STATE.lb = d.lb; render(); return; }
    if (d.kudos) return act(() => ST.toggleKudos(d.kudos, d.k));
    if (d.csend) { const inp = document.querySelector(`[data-cin="${d.csend}"]`); const txt = inp.value.trim(); if (!txt) return; return act(() => ST.addComment(d.csend, txt.slice(0, C.comment.maxChars))); }
    if (d.invite) { return act(async () => { const code = await ST.createInvite(); const link = location.href.split('#')[0].split('?')[0] + '?j=' + code; const txt = t('invite_text', { link }); if (navigator.share) { try { await navigator.share({ text: txt }); } catch (_) {} } else { try { await navigator.clipboard.writeText(txt); } catch (_) {} } toast(t('copied') + ' · ' + code); }); }
    if (d.join) { const sh = sheet(`<div class="h2">${t('join_code')}</div><input data-jc placeholder="ABC123" style="text-transform:uppercase"><div class="row mt"><button class="primary" data-jgo="1">${t('join')}</button><button data-jx="1">${t('cancel')}</button></div>`); sh.addEventListener('click', (ev) => { if (ev.target.closest('[data-jx]')) { sh.remove(); return; } if (!ev.target.closest('[data-jgo]')) return; const code = sh.querySelector('[data-jc]').value.trim().toUpperCase(); if (!code) return; sh.remove(); act(() => ST.joinGroup(code)); }); return; }
    if (d.pause) { if (S.group.paused.includes(S.me)) return act(() => ST.setPause(0)); const sh = sheet(`<div class="h2">${t('pause_me')}</div><label>${t('pause_weeks')}</label><select data-pw><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select><div class="muted small mt">${t('pause_hint')}</div><div class="row mt"><button class="primary" data-pgo="1">${t('save')}</button><button data-px="1">${t('cancel')}</button></div>`); sh.addEventListener('click', (ev) => { if (ev.target.closest('[data-px]')) { sh.remove(); return; } if (!ev.target.closest('[data-pgo]')) return; const w = +sh.querySelector('[data-pw]').value; sh.remove(); act(() => ST.setPause(w)); }); return; }
    if (d.addgoal) { const sh = sheet(`<div class="h2">${t('add_goal')}</div><label>${t('goals')}</label><select data-g="metric">${Object.keys(C.metrics).map((k) => `<option value="${k}">${t('m_' + k)}</option>`).join('')}</select><label>${t('goal_target')}</label><input type="number" inputmode="decimal" data-g="target"><label>${t('start')}</label><input type="number" inputmode="decimal" data-g="start"><div class="row mt"><button class="primary" data-gsave="1">${t('save')}</button><button data-gx="1">${t('cancel')}</button></div>`); sh.addEventListener('click', (ev) => { if (ev.target.closest('[data-gx]')) { sh.remove(); return; } if (!ev.target.closest('[data-gsave]')) return; const g = (k) => sh.querySelector(`[data-g="${k}"]`).value; if (!g('target')) return; sh.remove(); act(() => ST.addGoal({ metric: g('metric'), target: +g('target'), start: g('start') ? +g('start') : null })); }); return; }
    if (d.lang) { WW_STATE.lang = d.lang; return act(() => ST.updateProfile({ lang: d.lang })); }
    if (d.export) { return act(async () => { const blob = new Blob([await ST.exportJSON()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'weekwell-export.json'; a.click(); }); }
    if (d.delacc) { if (confirm(t('delete_account') + '?')) act(async () => { await ST.deleteAccount(); location.reload(); }); return; }
    if (d.reset) { act(async () => { await ST.reset(); location.reload(); }); return; }
    if (d.signout) { act(async () => { await ST.signOut(); location.reload(); }); return; }
  });
  function libList(qs) { const ql = qs.toLowerCase(); return S.lib.filter((tp) => !ql || tplTitle(tp).toLowerCase().includes(ql) || t('cat_' + tp.category).toLowerCase().includes(ql)).map((tp) => `<div class="libitem"><div class="cat">${CAT_ICON[tp.category]}</div><div class="grow"><div>${esc(tplTitle(tp))}</div><div class="small">${tplLine(tp)}</div></div><button class="mini" data-pick="${tp.id}">${t('add')}</button></div>`).join(''); }
  async function shrink(file) { const max = C.proof.maxPx; const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }); const s = Math.min(1, max / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); return new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.82)); }
  document.addEventListener('change', (e) => {
    if (!S) return; const el = e.target; const d = el.dataset; const sel = selDate();
    if (d.num) return act(() => el.value === '' ? ST.clearLog(d.num, sel) : ST.setLog(d.num, sel, { value: +el.value, src: (S.logs[S.me + '|' + d.num + '|' + sel] || {}).src || 'self' }));
    if (d.metric) return act(() => ST.setMetricEntry(d.metric, sel, el.value === '' ? null : +el.value));
    if (d.share) return act(() => ST.setGoalShare(d.share, el.checked));
    if (d.name) return act(() => ST.updateProfile({ name: el.value.trim() || me().name }));
    if (d.cktime) return act(() => ST.updateProfile({ checkinTime: el.value }));
    if (d.notif) return act(() => ST.updateProfile({ notif: { [d.notif]: el.checked } }));
  });
  window.addEventListener('hashchange', () => { WW_STATE.tab = location.hash.replace('#', '') || 'home'; render(); });

  // ---------- boot ----------
  WW_AUTH.start().then(({ store }) => { ST = store; S = ST.state; WW_STATE.lang = S.lang || WW_STATE.lang; render(); })
    .catch((err) => { console.error(err); $('#main').innerHTML = `<div class="card">⚠️ ${esc(err.message || err)}</div>`; });
})();
