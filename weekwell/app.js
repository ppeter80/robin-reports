// Weekwell — app (iterácia 1). Vanilla JS, bez build kroku. Store = WW_STORE (stub alebo Supabase, rovnaké async API).
(function () {
  const C = window.WW_CONFIG; let ST = null; let S = null;
  window.WW_STATE = { lang: 'sk', tab: location.hash.replace('#', '') || 'home', selDate: null, lb: 'week' };
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CAT_ICON = { movement: '🏃', nutrition: '🥗', alcohol: '🍺', sleep: '😴', mental: '🧠', lifestyle: '🌿' };
  const KW_ICON = [[/silov|fitko|čink|cink|posil|gym|klik|drep|tréning|trening|workout|strength/i, '🏋️'], [/beh|run|jogg/i, '🏃'], [/bicyk|bike|cycl/i, '🚴'], [/pláv|plav|swim|bazén|bazen/i, '🏊'], [/kroky|krok|chôdz|chodz|walk|prechádz|prechadz/i, '🚶'], [/schod|stairs|poschod/i, '🪜'], [/joga|jóga|yoga|streč|strec|stretch/i, '🧘'], [/spánok|spanok|sleep|postel|posteľ|spať|spat|snooze/i, '😴'], [/nápoj|napoj|limon|kofol|cola|sóda|soda|sladen/i, '🥤'], [/sladk|cukor|sweet|sugar|dezert|kolá/i, '🍬'], [/alkohol|alcohol|pivo|víno|vino|drink|dry/i, '🍺'], [/sauna|kúpeľ|kupel|bath/i, '🧖'], [/sprch|shower/i, '🚿'], [/meditá|medita|dých|dych|breath|mindful/i, '🧘'], [/čítan|citan|kniha|strán|stran|read|page|book/i, '📚'], [/telefón|telefon|phone|screen|obrazovk|sociál|social/i, '📵'], [/voda|water|liter|litr/i, '💧'], [/zelenin|veg|šalát|salat|ovoc|fruit/i, '🥗'], [/prote[ií]n|bielkov/i, '🍗'], [/vonku|outdoor|príroda|priroda|slnk/i, '🌳'], [/fast ?food|junk/i, '🍔'], [/váha|vaha|weight|kg/i, '⚖️'], [/vďačn|vdacn|grat|denník|dennik|journal/i, '📝'], [/kamarát|kamarat|friend|stretn|call|zavol/i, '🤝'], [/uprat|tidy|clean/i, '🧹'], [/káva|kava|coffee/i, '☕']];
  const iconFor = (tpl) => { if (!tpl) return '🎯'; const txt = (tpl.title_sk || '') + ' ' + (tpl.title_en || '') + ' ' + (tpl.description || ''); for (const [re, ic] of KW_ICON) if (re.test(txt)) return ic; return CAT_ICON[tpl.category] || '🎯'; };
  const METRIC_ICON = { weight: '⚖️', steps: '🚶', run_km: '🏃', time_5k: '⏱️', af_days: '🍺', sleep_h: '😴', workouts: '🏋️', waist_cm: '📏', water_l: '💧', veg_days: '🥗', meditation_min: '🧘', pages: '📚', bike_km: '🚴', swim_m: '🏊', strength: '💪', active_min: '⚡', stairs: '🪜' };
  const goalIcon = (g) => { if (METRIC_ICON[g.metric]) return METRIC_ICON[g.metric]; const txt = (g.label || '') + ' ' + (g.metric || ''); if (/klik|push|drep|squat|zhyb|pull|plank/i.test(txt)) return '💪'; if (/body ?fat|tuk|fat/i.test(txt)) return '🔥'; for (const [re, ic] of KW_ICON) if (re.test(txt)) return ic; return '📈'; };
  const today = () => ST.iso(new Date());
  const me = () => S.group.members.find((m) => m.id === S.me) || { name: '?', avatar: '👤' };
  const member = (id) => S.group.members.find((m) => m.id === id) || { name: '?', avatar: '👤' };
  const tplTitle = (tpl) => (tpl ? ((WW_STATE.lang === 'en' ? tpl.title_en : tpl.title_sk) || tpl.title_sk) : '?');
  const mDef = (g) => C.metrics[g.metric] || { unit: g.unit || '', dir: g.dir || 'up', interval: g.interval || 'free' };
  const mName = (g) => (g.metric && g.metric.startsWith('custom:')) ? (g.label || g.metric.slice(7)) : t('m_' + g.metric);
  const gCat = (g) => g.category || Object.keys(C.goalCategories).find((c) => C.goalCategories[c].includes(g.metric)) || 'other';
  function badgeSvg(n, size) { size = size || 44; return `<svg class="badge" width="${size}" height="${size}" viewBox="0 0 44 44"><defs><linearGradient id="bg${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#0f8f6a"/></linearGradient></defs><polygon points="22,2 27,8 35,6 36,14 43,18 39,26 42,34 34,36 30,43 22,39 14,43 10,36 2,34 5,26 1,18 8,14 9,6 17,8" fill="url(#bg${n})" stroke="#04231a" stroke-width="1"/><circle cx="22" cy="22" r="12" fill="#04231a" opacity=".85"/><text x="22" y="27" text-anchor="middle" font-size="${n >= 10 ? 12 : 15}" font-weight="800" fill="#e9fff5" font-family="-apple-system,Segoe UI,Roboto,sans-serif">${n}</text></svg>`; }
  const gav = (size) => S.group.avatar_url ? `<span class="av" style="width:${size}px;height:${size}px"><img src="${esc(S.group.avatar_url)}" alt=""></span>` : esc(S.group.emoji);
  const badgesOf = (id) => (S.results[id] || {}).badges || 0;
  const STATS = [['height_cm', 'cm'], ['weight_kg', 'kg'], ['birth_year', ''], ['resting_hr', 'bpm'], ['steps_avg', ''], ['sleep_avg', 'h']];
  function av(m, size) { size = size || 28; const ring = m.story ? 'story' : ''; const inner = m.avatar_url ? `<img src="${esc(m.avatar_url)}" alt="">` : `<span>${m.avatar && !String(m.avatar).startsWith('<') ? m.avatar : '👤'}</span>`; return `<span class="av ${ring}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.6)}px" data-member="${m.id}">${inner}</span>`; }
  const memberFull = (id) => S.group.members.find((m) => m.id === id) || { id, name: '?', avatar: '👤', stats: {}, share: {} };
  function applyTheme(name) { const th = C.themes[name] || C.themes.green; const r = document.documentElement.style; r.setProperty('--bg', th.bg); r.setProperty('--card', th.card); r.setProperty('--card2', th.card2); r.setProperty('--line', th.line); r.setProperty('--text', th.text); r.setProperty('--muted', th.muted); r.setProperty('--acc', th.acc); r.setProperty('--acc2', th.acc2); document.body.classList.toggle('light', !th.dark); const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', th.bg); try { localStorage.setItem('ww_theme', name); } catch (_) {} }
  try { applyTheme(localStorage.getItem('ww_theme') || 'green'); } catch (_) {}
  const MENU = [['profile', '👤'], ['progress', '📈'], ['chat', '💬'], ['rules', '📜'], ['settings', '⚙️']];
  function renderMenu() { const mi = $('#menuin'); if (!mi) return; mi.innerHTML = MENU.map(([k, ic]) => `<a href="#${k}" data-tab="${k}" class="${WW_STATE.tab === k ? 'on' : ''}"><span>${ic}</span>${t('tab_' + k)}</a>`).join(''); }
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
  function phase() { if (S.next && S.next.status && S.next.status !== 'proposing' && S.next.status !== 'voting') return 'selected'; return 'voting'; }   // #22: návrhy + hlasovanie do nedele 24:00

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
  const tplDesc = (tpl) => (tpl && tpl.description ? `<div class="muted small" style="margin-top:2px">${esc(tpl.description)}</div>` : '');
  function challengeSheet(cc, extra) {
    const tpl = cc.tpl || {}; const rows = [];
    rows.push([t('category'), t('cat_' + tpl.category)]); rows.push([t('type'), t('type_' + tpl.type)]);
    if (tpl.type === 'binary_daily') rows.push([t('days_per_week'), tpl.target]); else if (tpl.type === 'once') rows.push([t('target'), '1×']); else { rows.push([t('target'), `${tpl.target} ${esc(tpl.unit || '')}`]); if (tpl.type === 'count_daily') rows.push([t('min_days'), tpl.min_days || 5]); }
    if (tpl.difficulty) rows.push([t('diff_' + tpl.difficulty).replace(/^./, (c) => c.toUpperCase()), '']);
    rows.push([t('proof_add').replace('📎 ', ''), tpl.proof === 'required' ? t('proof_required') : t('optional')]);
    if (cc.source) rows.push([t('selected_source'), t(SRC_T[cc.source] || 'library') + (cc.votes ? ` · ${cc.votes} ${t('votes')}` : '')]);
    if (cc.id && S.cur.challenges.some((x) => x.id === cc.id)) { const L = S.cur.dates.map((d) => S.logs[S.me + '|' + cc.id + '|' + d]); rows.push([t('this_week'), P(challengePct(S.me, cc))]); rows.push([t('checkin_title'), S.cur.dates.map((d, i) => `<span class="pill ${L[i] && (L[i].done || L[i].value) ? 'acc' : ''}">${['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'][i]}${L[i] && L[i].value != null ? ' ' + L[i].value : ''}</span>`).join(' ')]); }
    sheet(`<div class="row" style="gap:10px"><div class="ic" style="font-size:28px">${iconFor(tpl)}</div><div class="h2" style="margin:0">${esc(tplTitle(tpl))}</div></div>${tpl.description ? `<div class="small mt" style="white-space:pre-wrap">${esc(tpl.description)}</div>` : ''}<div class="mt">${rows.map(([k, v]) => `<div class="row between small" style="padding:6px 0;border-top:1px solid var(--line)"><span class="muted">${k}</span><span style="text-align:right">${v}</span></div>`).join('')}</div>${extra || ''}`);
  }
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
      return `<div class="item"><div class="ic" data-ccinfo="${cc.id}">${iconFor(tpl)}</div><div class="grow" data-ccinfo="${cc.id}"><div class="t">${esc(tplTitle(tpl))} <span class="muted">›</span></div><div class="s">${cc.catchup ? `<span class="pill warn">${t('catchup_item')}</span> ` : ''}${tpl.type === 'binary_daily' ? `${tpl.target} ${t('days')}` : tpl.type === 'once' ? t('type_once') : `${tpl.target} ${esc(tpl.unit)}`} ${src}</div><div class="bar"><i style="width:${pct * 100}%"></i></div></div><button class="mini ${tpl.proof === 'required' ? 'primary' : 'ghost'}" data-proof="${cc.id}" title="${tpl.proof === 'required' ? t('proof_required') : t('optional')}" style="${tpl.proof === 'required' ? '' : 'color:var(--muted)'}">📎</button>${ctrl}</div>`;
    }).join('');
    const dueMetrics = S.goals.slice();   // všetky ciele každý deň (zápis kedykoľvek); interval riadi len pripomienky
    const metrics = dueMetrics.map((g) => { const e = g.entries.find((x) => x.date === sel); const last = g.entries.length ? g.entries[g.entries.length - 1] : null; const u = mDef(g).unit; return `<div class="item"><div class="ic">${goalIcon(g)}</div><div class="grow"><div class="t">${esc(mName(g))}</div><div class="s">${t('goal')}: ${g.target} ${esc(u)}${last && !e ? ` · ${t('last')}: ${last.value} (${last.date.slice(5)})` : ''}</div></div><input class="num" type="number" inputmode="decimal" data-metric="${g.id}" value="${e ? e.value : ''}" placeholder="${esc(u)}"></div>`; }).join('');
    const solo = S.group.members.length === 1;
    return `
      <div class="card"><div class="row"><div>${ring(groupPct(), t('group_pct'))}</div><div>${ring(memberPct(S.me), t('my_pct'))}</div><div class="grow"><div class="row" style="font-weight:800"><span class="row" data-tab="group" style="cursor:pointer">${gav(30)} <span>${esc(S.group.name)} ›</span></span> ${S.group.admin === S.me ? `<button class="mini ghost" data-gsettings="1">✏️</button>` : ''}</div><div class="muted small">${t('week')} ${S.cur.week_start}</div></div></div>
      ${solo ? `<div class="muted mt">${t('solo_hint')}</div><div class="row mt"><button class="mini primary" data-invite="1">${t('invite')}</button><button class="mini" data-tab="challenges">${t('pick_for_week')}</button></div>` : `<div class="row mt"><button class="mini" data-invite="1">➕ ${t('invite')}</button></div>`}</div>
      ${S.group.admin === S.me && S.cur.status && S.cur.status !== 'running' && S.cur.status !== 'closed' ? `<div class="card"><h3>${t('admin')}</h3><div class="small">${t('cur_open_hint')}</div><button class="primary mt" data-selectnow="1">🎯 ${t('select_now')}</button></div>` : ''}
      ${S.group.admin === S.me && S.cur.status === 'running' && S.cur.challenges.length && !Object.keys(S.logs).some((k) => S.cur.challenges.some((c) => k.includes('|' + c.id + '|'))) ? `<div class="row mb"><button class="mini ghost" data-reopen="1">↺ ${t('reopen_week')}</button></div>` : ''}
      ${(S.next && S.next.simulated && S.next.simulated.length && !S.cur.challenges.length) ? `<div class="card"><h3>${t('next_week')} · ${S.next.week_start || ''}</h3>${S.next.simulated.map((o) => `<div class="row" style="padding:5px 0"><div class="ic">${iconFor(o.tpl)}</div><div class="grow"><div class="t">${esc(tplTitle(o.tpl))}</div><div class="s muted">${(o.tpl || {}).type === 'binary_daily' ? `${o.tpl.target} ${t('days')}` : (o.tpl || {}).type === 'once' ? t('type_once') : `${(o.tpl || {}).target} ${esc((o.tpl || {}).unit || '')}`}</div></div></div>`).join('')}<div class="muted small mt">${t('starts_monday')}</div></div>` : ''}
      ${S.catchup && S.catchup.available ? `<div class="card"><h3>${t('catchup')}</h3><div class="small">${t('catchup_hint')}</div><button class="primary mt" data-catchup="1">↩︎ ${t('catchup_btn')} (${S.catchup.from_week || ''})</button></div>` : ''}
      ${S.catchup && S.catchup.active ? `<div class="banner">${t('catchup_active')}</div>` : ''}
      <div class="card"><h3>🎯 ${t('weekly_challenges')} <span class="muted" style="text-transform:none;font-weight:400">· ${sel === today() ? t('today') : sel}</span></h3><div class="days">${days}</div>${items || `<div class="muted">${t('no_items')}</div>`}<div class="muted mt">${t('checkin_hint')}</div></div>
      <div class="card"><h3>📈 ${t('longterm_goals')} <span class="muted" style="text-transform:none;font-weight:400">· ${sel === today() ? t('today') : sel}</span></h3>${metrics || `<div class="muted small">${t('no_goals_hint')}</div>`}<div class="row mt"><button class="mini ghost" data-tab="progress">${t('goals')} ›</button></div></div>`;
  }

  // ---------- VÝZVY ----------
  function viewChallenges() {
    const sub = WW_STATE.chTab || 'fill';
    const seg = `<div class="seg mb" style="width:100%;display:flex"><button class="${sub === 'fill' ? 'on' : ''}" style="flex:1" data-chtab="fill">${t('fulfil')}</button><button class="${sub === 'props' ? 'on' : ''}" style="flex:1" data-chtab="props">${t('proposals')}</button></div>`;
    return seg + (sub === 'fill' ? viewFill() : viewProposals());
  }
  function memberRow(m, cc) {
    const pct = challengePct(m.id, cc); const dots = S.cur.dates.map((d) => { const l = S.logs[m.id + '|' + cc.id + '|' + d]; return `<span style="display:inline-block;width:9px;height:9px;border-radius:5px;margin-right:2px;background:${l && (l.done || l.value) ? 'var(--acc)' : 'var(--line)'}"></span>`; }).join('');
    return `<div class="row" style="padding:6px 0;border-top:1px solid var(--line)" data-member="${m.id}">${av(m, 26)}<div class="grow"><div class="row between small"><span>${esc(m.name)}${S.group.paused.includes(m.id) ? ` <span class="pill warn">${t('paused')}</span>` : ''}</span><b>${P(pct)}</b></div><div class="bar"><i style="width:${pct * 100}%"></i></div><div style="margin-top:3px">${dots}</div></div></div>`;
  }
  function viewFill() {
    const members = S.group.members.filter((m) => !S.group.paused.includes(m.id)).sort((a, b) => memberPct(b.id) - memberPct(a.id));
    const cards = S.cur.challenges.map((cc) => `<div class="card"><div class="row" data-ccinfo="${cc.id}" style="cursor:pointer"><div class="ic" style="font-size:22px">${iconFor(cc.tpl)}</div><div class="grow"><div class="t" style="font-weight:700">${esc(tplTitle(cc.tpl))} <span class="muted">›</span></div><div class="s muted">${cc.catchup ? `<span class="pill warn">${t('catchup_item')}</span> ` : ''}${(cc.tpl || {}).type === 'binary_daily' ? `${cc.tpl.target} ${t('days')}` : (cc.tpl || {}).type === 'once' ? t('type_once') : `${(cc.tpl || {}).target} ${esc((cc.tpl || {}).unit || '')}`}</div></div></div>${cc.catchup ? '' : members.map((m) => memberRow(m, cc)).join('')}</div>`).join('');
    const top = `<div class="card"><div class="row"><div>${ring(groupPct(), t('group_pct'))}</div><div class="grow"><div style="font-weight:800">${t('this_week')} · ${S.cur.week_start}</div><div class="muted small">${S.cur.challenges.length} ${t('challenges_n')} · ${members.length} ${t('members').toLowerCase()}</div>${members.map((m) => `<div class="row between small" style="margin-top:3px"><span class="row" style="gap:6px" data-member="${m.id}">${av(m, 20)} ${esc(m.name)}</span><span class="grow" style="margin:0 8px"><div class="bar" style="margin:0"><i style="width:${memberPct(m.id) * 100}%"></i></div></span><b>${P(memberPct(m.id))}</b></div>`).join('')}</div></div></div>`;
    const nextSel = (S.next && S.next.simulated && S.next.simulated.length) ? `<div class="card"><h3>${t('next_week')} · ${S.next.week_start || ''} · <span class="pill acc" style="text-transform:none">${t('selected_pill')}</span></h3>${S.next.simulated.map((o) => `<div class="row" style="padding:6px 0;border-top:1px solid var(--line)" data-ccinfo="${o.id || ''}"><div class="ic">${iconFor(o.tpl)}</div><div class="grow"><div class="t">${esc(tplTitle(o.tpl))}</div><div class="s muted">${(o.tpl || {}).type === 'binary_daily' ? `${o.tpl.target} ${t('days')}` : (o.tpl || {}).type === 'once' ? t('type_once') : `${(o.tpl || {}).target} ${esc((o.tpl || {}).unit || '')}`} · ${t(SRC_T[o.source] || 'library')}${o.votes ? ' · ' + o.votes + ' ' + t('votes') : ''}</div></div></div>`).join('')}<div class="muted small mt">${t('starts_monday')}</div></div>` : '';
    return top + (cards || `<div class="card muted small">${S.cur.status === 'running' ? t('no_items') : t('cur_open_hint')}</div>`) + nextSel;
  }
  function viewProposals() {
    const ph = phase();
    const myP = S.next.proposals.filter((p) => p.authors.includes(S.me)); const othP = S.next.proposals.filter((p) => !p.authors.includes(S.me)); const myVetoes = S.next.vetoes || {};
    const pRow = (p, mineFlag) => {
      const authors = p.authors.map((a) => member(a).name).join(', '); const voted = p.votes.includes(S.me); const vetoedByMe = Object.values(myVetoes).includes(p.id);
      const canVeto = !p.vetoed && !mineFlag && !p.authors.some((a) => myVetoes[S.me + '|' + a]) && ph !== 'selected';
      const ctr = mineFlag ? `<button class="mini ghost" data-editp="${p.id}" ${ph === 'selected' ? 'disabled' : ''}>✏️</button> <button class="mini ghost" data-delp="${p.id}" title="${t('delete')}">🗑</button>` : p.vetoed ? `<span class="pill bad">${t('vetoed')}</span>` : `<button class="mini ${voted ? 'primary' : ''}" data-vote="${p.id}" ${ph === 'selected' ? 'disabled' : ''}>${voted ? t('voted') : t('vote')}</button> <button class="mini ghost" data-veto="${p.id}" ${canVeto ? '' : 'disabled'}>${vetoedByMe ? '⛔' : t('veto')}</button>`;
      return `<div class="item" style="${p.vetoed ? 'opacity:.5' : ''}"><div class="ic">${iconFor(p.tpl)}</div><div class="grow" data-ccinfo="p:${p.id}"><div class="t">${esc(tplTitle(p.tpl))} <span class="muted">›</span></div><div class="s">${esc(authors)} · ${p.votes.length} ${t('votes')}${p.votes.length ? ` (${p.votes.map((v) => esc(member(v).name.split(' ')[0])).join(', ')})` : ''}${p.tpl && p.tpl.source === 'custom' ? ` · <span class="pill">${t('custom').toLowerCase()}</span>` : ''}</div></div><div>${ctr}</div></div>`;
    };
    const vetoInfo = Object.keys(myVetoes).filter((k) => k.startsWith(S.me + '|')).map((k) => t('veto_used', { name: member(k.split('|')[1]).name })).join(' · ');
    const sim = S.next.simulated ? `<div class="card"><h3>${t('selected_source')}</h3>${S.next.simulated.map((o) => `<div class="item"><div class="ic">${iconFor(o.tpl)}</div><div class="grow"><div class="t">${t('slot')} ${o.slot}: ${esc(tplTitle(o.tpl))}</div><div class="s"><span class="pill acc">${t(SRC_T[o.source] || 'library')}${o.votes ? ' · ' + o.votes + ' ' + t('votes') : ''}</span></div></div></div>`).join('')}</div>` : '';
    const inPool = (tpl) => S.next.proposals.some((p) => p.tpl && tpl && (p.tpl.id === tpl.id || String(p.tpl.title_sk).toLowerCase() === String(tpl.title_sk).toLowerCase()));
    const again = (tpl) => (tpl ? `<button class="mini ${inPool(tpl) ? 'ghost' : ''}" data-again="${esc(tpl.id)}" ${inPool(tpl) || ph === 'selected' ? 'disabled' : ''}>${inPool(tpl) ? '✔' : '↻ ' + t('propose_again')}</button>` : '');
    const hist = (S.history || []).map((h) => `<div class="card"><h3>${t('week')} ${h.week_start}</h3>${h.challenges.map((cc) => `<div class="row" style="padding:6px 0;border-top:1px solid var(--line)"><div class="ic">${iconFor(cc.tpl)}</div><div class="grow"><div>${esc(tplTitle(cc.tpl))}</div><div class="muted small">${t(SRC_T[cc.source] || 'library')}${cc.votes ? ' · ' + cc.votes + ' ' + t('votes') : ''} · ${(h.results || []).map((r) => `${esc(member(r.user).name.split(' ')[0])} ${Math.round(r.pct)} %`).join(' · ')}</div></div>${again(cc.tpl)}</div>`).join('')}${h.proposals.filter((pp) => !h.challenges.some((cc) => cc.tpl && pp.tpl && cc.tpl.id === pp.tpl.id)).map((pp) => `<div class="row" style="padding:6px 0;border-top:1px solid var(--line);opacity:.75"><div class="ic">${iconFor(pp.tpl)}</div><div class="grow"><div>${esc(tplTitle(pp.tpl))}</div><div class="muted small">${t('not_selected')} · ${pp.authors.map((a) => member(a).name.split(' ')[0]).join(', ')}</div></div>${again(pp.tpl)}</div>`).join('')}</div>`).join('');
    return `
      <div class="card"><h3>${t('next_week')} · ${S.next.week_start || ''} <span class="pill ${ph === 'voting' ? 'acc' : ''}" style="text-transform:none">${ph === 'selected' ? t('phase_selected') : t('phase_voting')}</span></h3>
        <div class="row mt"><button class="primary" data-propose="lib">${t('from_library')}</button><button data-propose="custom">${t('custom')}</button></div>
        <div class="mt small muted">${t('my_proposals')} (${myP.length})</div>${myP.map((p) => pRow(p, true)).join('') || `<div class="muted small">${t('no_items')}</div>`}
        <div class="mt small muted">${t('others_proposals')} (${othP.length})</div>${othP.map((p) => pRow(p, false)).join('') || `<div class="muted small">${t('no_items')}</div>`}
        <div class="muted small mt">${t('veto_ethics')}${vetoInfo ? '<br>' + esc(vetoInfo) : ''}</div>
        ${C.stub ? `<button class="mini mt" data-sim="1">🎲 ${t('simulate')} (${t('slot')}y: ${S.group.slots})</button>` : ''}</div>
      ${sim}
      <div class="muted small" style="margin:8px 4px 4px;text-transform:uppercase;letter-spacing:.4px">${t('history')}</div>
      ${hist || `<div class="card muted small">${t('history_soon_w')}</div>`}`;
  }

  // ---------- SKUPINA ----------
  function viewGroup() {
    const lb = WW_STATE.lb; const R = (id) => S.results[id] || { streak: 0, extra: 0, hist: [] };
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const val = (m) => lb === 'week' ? memberPct(m.id) : lb === '4w' ? avg(R(m.id).hist.slice(-4)) / 100 : avg(R(m.id).hist) / 100;
    const rows = [...S.group.members].sort((a, b) => val(b) - val(a) || (R(b.id).badges || 0) - (R(a.id).badges || 0)).map((m, i) => `<tr class="${m.id === S.me ? 'me' : ''}" data-member="${m.id}" style="cursor:pointer"><td>${i + 1}</td><td>${av(m, 26)} ${esc(m.name)} ${m.id === S.group.admin ? `<span class="pill">${t('admin')}</span>` : ''} ${S.group.paused.includes(m.id) ? `<span class="pill warn">${t('paused')}</span>` : ''}</td><td class="small muted">🏅 ${R(m.id).badges || 0} · ${t('streak')} ${R(m.id).streak}</td><td class="pct">${P(val(m))}</td></tr>`).join('');
    const hl = Math.max(0, ...S.group.members.map((m) => R(m.id).hist.length));
    const ghist = [...Array(hl)].map((_, i) => { const a = avg(S.group.members.map((m) => R(m.id).hist[i] || 0)); return `<div style="flex:1;text-align:center"><div style="height:${a * 0.5}px;background:#0f8f6a;border-radius:3px 3px 0 0;margin:0 2px"></div><div class="muted" style="font-size:10px">${Math.round(a)}</div></div>`; }).join('');
    const evTxt = (e) => e.type === 'rule_proposed' ? t('ev_rule_proposed', { name: member(e.user).name, t: e.title || '' }) : e.type === 'rule_accepted' ? t('ev_rule_accepted', { t: e.title || '' }) : e.type === 'rule_rejected' ? t('ev_rule_rejected', { t: e.title || '' }) : e.type === 'badges' ? t('ev_badges', { name: member(e.user).name, n: e.n || 0, s: e.n || 0 }) : e.type === 'caught_up' ? t('ev_caught_up', { name: member(e.user).name, n: e.n || 0 }) : e.type === 'done' ? t('ev_done', { name: member(e.user).name, title: e.title || '' }) : e.type === 'photo' ? t('ev_photo', { name: member(e.user).name }) + (e.title ? ' – ' + e.title : '') : e.type === 'story' ? t('ev_story', { name: member(e.user).name }) + (e.title ? ' – ' + e.title : '') : e.type === 'pause' ? t('ev_pause', { name: member(e.user).name }) : e.type === 'selected' ? t('ev_selected') : e.type === 'extra' ? t('ev_extra', { name: member(e.user).name }) : e.type === 'join' ? t('ev_join', { name: member(e.user).name }) : e.type;
    const evs = [...S.events].sort((a, b) => b.ts - a.ts).map((e) => `<div class="ev"><div class="row"><div class="ic" style="font-size:20px">${e.type === 'badges' || e.type === 'caught_up' ? badgeSvg(e.n || 0, 30) : e.user ? av(memberFull(e.user), 30) : '🎲'}</div><div class="grow"><div>${esc(evTxt(e))} ${e.proof ? `<span class="pill acc">${t('src_proof')}</span>` : ''}</div><div class="muted small">${new Date(e.ts).toLocaleString(WW_STATE.lang === 'en' ? 'en-GB' : 'sk-SK', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</div></div></div>${e.photo ? `<img class="evphoto" src="${esc(e.photo)}" alt="" data-view="${esc(e.photo)}">` : ''}
      <div class="k">${C.kudos.map((k) => `<button class="${(e.kudos[k] || []).includes(S.me) ? 'on' : ''}" data-kudos="${e.id}" data-k="${k}">${k}${(e.kudos[k] || []).length ? ' ' + e.kudos[k].length : ''}</button>`).join('')}${e.photo && e.user === S.me ? `<button class="ghost" style="margin-left:auto" data-delphotoev="${e.id}" title="${t('delete')}">🗑</button>` : ''}</div>
      ${e.comments.length ? `<div class="c">${e.comments.map((c) => `<div><b>${esc(member(c.user).name)}</b> ${esc(c.text)}</div>`).join('')}</div>` : ''}
      <div class="row mt"><input placeholder="${t('comment_ph')}" maxlength="${C.comment.maxChars}" data-cin="${e.id}"><button class="mini" data-csend="${e.id}">${t('send')}</button></div></div>`).join('') || `<div class="muted small">${t('no_items')}</div>`;
    const mem = S.group.members.map((m) => `<div class="row between" style="padding:6px 0;border-top:1px solid var(--line);cursor:pointer" data-member="${m.id}"><span class="row">${av(m, 30)} <span>${esc(m.name)}${m.location ? ` <span class="muted small">· ${esc(m.location)}</span>` : ''}</span></span><span>${m.id === S.group.admin ? `<span class="pill">${t('admin')}</span>` : ''} ${S.group.paused.includes(m.id) ? `<span class="pill warn">${t('paused')}</span>` : ''}</span></div>`).join('');
    const iPaused = S.group.paused.includes(S.me);
    return `
      <div class="card"><div class="row"><div>${ring(groupPct(), t('group_pct'))}</div><div class="grow"><div class="row" style="font-weight:800">${gav(30)} <span>${esc(S.group.name)}</span> ${S.group.admin === S.me ? `<button class="mini ghost" data-gsettings="1">✏️</button>` : ''}</div>${ghist ? `<div class="row mt" style="align-items:flex-end;height:60px">${ghist}</div>` : `<div class="muted small mt">${t('history_soon')}</div>`}</div></div><div class="row mt"><button class="primary" data-invite="1">➕ ${t('invite')}</button><button class="mini ghost" data-join="1">${t('join_code')}</button></div></div>
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
  function trend(g) { const e = g.entries; if (e.length < 2) return 'stable'; const last = e[e.length - 1].value, prev = e[Math.max(0, e.length - 1 - C.trend.windowWeeks)].value; const ch = (last - prev) / (prev || 1) * 100; const good = mDef(g).dir === 'down' ? -ch : ch; return good >= C.trend.thresholdPct ? 'improving' : good <= -C.trend.thresholdPct ? 'attention' : 'stable'; }
  function goalCard(g) {
    const e = g.entries; const cur = e.length ? e[e.length - 1].value : '–'; const st = e.length ? e[0].value : '–'; const tr = trend(g); const u = mDef(g).unit;
    return `<div class="card"><div class="row between"><b>${goalIcon(g)} ${esc(mName(g))}</b><span class="row" style="gap:6px"><span class="pill ${tr === 'improving' ? 'acc' : tr === 'attention' ? 'bad' : ''}">${t('trend_' + tr)}</span><button class="mini ghost" data-editgoal="${g.id}">✏️</button><button class="mini ghost" data-delgoal="${g.id}">🗑</button></span></div>${chart(e, g.target)}<div class="row between small"><span>${t('start')}<br><b>${st} ${esc(u)}</b></span><span class="center">${t('now')}<br><b style="font-size:16px">${cur} ${esc(u)}</b></span><span style="text-align:right">${t('goal')}<br><b>${g.target} ${esc(u)}</b></span></div><div class="row mt small"><label class="row" style="margin:0"><input type="checkbox" style="width:auto" data-share="${g.id}" ${g.share ? 'checked' : ''}> <span>${t('share_progress')}</span></label></div></div>`;
  }
  function viewProgress() {
    const cats = Object.keys(C.goalCategories); const groups = cats.map((c) => ({ c, goals: S.goals.filter((g) => gCat(g) === c) })).filter((x) => x.goals.length);
    const cards = groups.map((x) => `<div class="muted small" style="margin:8px 4px 4px;text-transform:uppercase;letter-spacing:.4px">${t('gc_' + x.c)}</div>${x.goals.map(goalCard).join('')}`).join('');
    return `${cards || `<div class="card muted small">${t('no_items')}</div>`}<div class="card"><button class="primary" data-addgoal="1">＋ ${t('add_goal')}</button></div>`;
  }
  function goalSheet(existing) {
    const g = existing || {}; const cat0 = g.id ? gCat(g) : 'movement'; const isCustom = g.metric && g.metric.startsWith('custom:');
    const metricOpts = (c) => C.goalCategories[c].map((k) => `<option value="${k}" ${g.metric === k ? 'selected' : ''}>${t('m_' + k)}</option>`).join('') + `<option value="custom" ${isCustom ? 'selected' : ''}>${t('custom_metric')}</option>`;
    const sh = sheet(`<div class="h2">${g.id ? t('edit_goal') : t('add_goal')}</div>
      <label>${t('goal_category')}</label><select data-g="category" ${g.id ? 'disabled' : ''}>${Object.keys(C.goalCategories).map((c) => `<option value="${c}" ${c === cat0 ? 'selected' : ''}>${t('gc_' + c)}</option>`).join('')}</select>
      <label>${t('goal_metric')}</label><select data-g="metric" ${g.id ? 'disabled' : ''}>${metricOpts(cat0)}</select>
      <div data-customwrap ${isCustom || (!g.id && C.goalCategories[cat0].length === 0) ? '' : 'hidden'}><div class="grid2"><div><label>${t('custom_metric')}</label><input data-g="label" value="${esc(g.label || '')}" placeholder="${t('custom_label_ph')}"></div><div><label>${t('unit')}</label><input data-g="unit" value="${esc(g.unit || '')}" placeholder="${t('custom_unit_ph')}"></div></div>
        <label>${t('direction')}</label><select data-g="dir"><option value="up" ${(g.dir || 'up') === 'up' ? 'selected' : ''}>${t('dir_up')}</option><option value="down" ${g.dir === 'down' ? 'selected' : ''}>${t('dir_down')}</option></select></div>
      <div class="grid2"><div><label>${t('goal_target')}</label><input type="number" inputmode="decimal" data-g="target" value="${g.target != null ? g.target : ''}"></div><div><label>${t('interval')}</label><select data-g="interval">${['daily', 'weekly', 'free'].map((k) => `<option value="${k}" ${(g.interval || (g.metric && mDef(g).interval) || 'free') === k ? 'selected' : ''}>${t('int_' + k)}</option>`).join('')}</select></div></div>
      ${g.id ? '' : `<label>${t('start')}</label><input type="number" inputmode="decimal" data-g="start">`}
      <div class="row mt"><button class="primary" data-gsave="1">${t('save')}</button><button data-gx="1">${t('cancel')}</button></div>`);
    sh.addEventListener('change', (ev) => { if (ev.target.matches('[data-g="category"]')) { const c = ev.target.value; sh.querySelector('[data-g="metric"]').innerHTML = metricOpts(c); sh.querySelector('[data-customwrap]').hidden = !(C.goalCategories[c].length === 0); if (C.goalCategories[c].length === 0) sh.querySelector('[data-g="metric"]').value = 'custom'; } if (ev.target.matches('[data-g="metric"]')) sh.querySelector('[data-customwrap]').hidden = ev.target.value !== 'custom'; });
    sh.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-gx]')) { sh.remove(); return; }
      const btn = ev.target.closest('[data-gsave]'); if (!btn || btn.disabled) return;
      const v = (k) => { const el = sh.querySelector(`[data-g="${k}"]`); return el ? el.value : ''; };
      const target = +v('target'); if (!target) return;
      let metric = g.metric || v('metric'); const category = g.id ? gCat(g) : v('category'); let label = v('label').trim(), unit = v('unit').trim();
      if (metric === 'custom') { if (!label) return; metric = 'custom:' + label.toLowerCase().replace(/[^a-z0-9áäčďéíĺľňóôŕšťúýž]+/gi, '-').slice(0, 30); }
      btn.disabled = true; btn.textContent = t('saving');                                   // #7 – dvojklik
      sh.remove();
      act(async () => { if (g.id) await ST.updateGoal(g.id, { target, label: label || null, unit: unit || null, interval: v('interval'), dir: v('dir') || null, category }); else { const r = await ST.addGoal({ metric, category, target, start: v('start') ? +v('start') : null, label: label || null, unit: unit || null, interval: v('interval'), dir: v('dir') || null }); if (r === 'updated') toast(t('goal_exists')); } });
    });
  }

  // ---------- PRAVIDLÁ ----------
  function viewRules() {
    const others = (byId) => S.group.members.filter((m) => m.id !== byId && !S.group.paused.includes(m.id)).length;
    const need = (r) => Math.floor(others(r.by) / 2) + 1;
    const open = S.rules.filter((r) => r.status === 'proposed'); const active = S.rules.filter((r) => r.status === 'active' && r.kind === 'add'); const hist = S.rules.filter((r) => ['rejected', 'revoked'].includes(r.status));
    const when = (ts) => new Date(ts).toLocaleDateString(WW_STATE.lang === 'en' ? 'en-GB' : 'sk-SK');
    const openRow = (r) => { const mine = r.by === S.me; const my = r.yes.includes(S.me) ? 'y' : r.no.includes(S.me) ? 'n' : ''; return `<div class="rule"><div class="txt">${r.kind === 'revoke' ? '🗑 ' : ''}${esc(r.text)}</div><div class="meta">${t('rule_by', { name: member(r.by).name })} · ${when(r.ts)} · ${t('rule_votes', { y: r.yes.length, n: r.no.length, k: need(r) })}</div>${mine ? `<div class="muted small mt">${t('own_proposal')}</div>` : `<div class="row mt"><button class="mini ${my === 'y' ? 'primary' : ''}" data-rvote="${r.id}" data-v="1">${t('rule_yes')}</button><button class="mini ${my === 'n' ? 'danger' : ''}" data-rvote="${r.id}" data-v="0">${t('rule_no')}</button></div>`}</div>`; };
    const activeRow = (r) => `<div class="rule"><div class="txt">✅ ${esc(r.text)}</div><div class="meta">${t('rule_by', { name: member(r.by).name })} · ${t('rule_since')} ${when(r.decided || r.ts)} ${S.rules.some((x) => x.kind === 'revoke' && x.target === r.id && x.status === 'proposed') ? '' : `· <a href="#" data-rrevoke="${r.id}">${t('rule_revoke')}</a>`}</div></div>`;
    const histRow = (r) => `<div class="rule" style="opacity:.6"><div class="txt">${esc(r.text)}</div><div class="meta">${t('rule_' + r.status)} · ${when(r.decided || r.ts)}</div></div>`;
    return `
      <div class="card"><h3>${t('how_it_works')}</h3><div class="small" style="white-space:pre-wrap">${t('how_it_works_text')}</div></div>
      <div class="card"><h3>${t('rules')}</h3><div class="muted small">${t('rules_hint')}</div><div class="row mt"><input data-ruletext placeholder="${t('rule_ph')}" maxlength="300"><button class="primary" data-rpropose="1">➕</button></div></div>
      <div class="card"><h3>${t('rules_open')} (${open.length})</h3>${open.map(openRow).join('') || `<div class="muted small">${t('no_items')}</div>`}</div>
      <div class="card"><h3>${t('rules_active')} (${active.length})</h3>${active.map(activeRow).join('') || `<div class="muted small">${t('rules_none')}</div>`}</div>
      ${hist.length ? `<div class="card"><h3>${t('rule_history')}</h3>${hist.map(histRow).join('')}</div>` : ''}`;
  }
  // ---------- CHAT ----------
  function viewChat() {
    const PAL = ['#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#fb923c', '#22d3ee', '#f87171', '#a3e635', '#e879f9'];
    const colorOf = (uid) => { const idx = S.group.members.findIndex((m) => m.id === uid); return PAL[(idx >= 0 ? idx : 0) % PAL.length]; };
    const isRobin = (m) => /^(📣|🤖)\s*Robin/.test(m.text);
    const msgs = S.messages.map((m) => { if (isRobin(m)) return `<div class="msg robin"><div class="who">🤖 Robin</div>${esc(m.text.replace(/^(📣|🤖)\s*Robin:?\s*/, ''))}<div class="when">${new Date(m.ts).toLocaleString(WW_STATE.lang === 'en' ? 'en-GB' : 'sk-SK', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</div></div>`; const mine = m.user === S.me; return `<div class="msg ${mine ? 'me' : ''}"><div class="who" style="color:${mine ? 'rgba(255,255,255,.85)' : colorOf(m.user)}">${esc(member(m.user).name)}</div>${esc(m.text)}<div class="when">${new Date(m.ts).toLocaleString(WW_STATE.lang === 'en' ? 'en-GB' : 'sk-SK', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</div></div>`; }).join('');
    setTimeout(() => { const el = $('#chatend'); if (el) el.scrollIntoView(); }, 0);
    return `<div class="card"><h3>${t('chat')} · ${esc(S.group.emoji)} ${esc(S.group.name)}</h3><div class="chat">${msgs || `<div class="muted small">${t('chat_empty')}</div>`}<div id="chatend"></div></div></div><div class="chatin row"><input data-chatin placeholder="${t('chat_ph')}" maxlength="500" autocomplete="off"><button class="primary" data-chatsend="1">${t('send')}</button></div>`;
  }
  // ---------- PROFIL ----------
  function statRow(k, u, val, share, editable) {
    const lab = t('st_' + k);
    if (!editable) return val == null || val === '' ? '' : `<div class="row between small" style="padding:5px 0;border-top:1px solid var(--line)"><span class="muted">${lab}</span><b>${esc(val)} ${u}</b></div>`;
    return `<div class="row small" style="padding:5px 0;border-top:1px solid var(--line);gap:8px"><span class="grow muted">${lab}</span><input class="num" type="number" inputmode="decimal" data-stat="${k}" value="${val != null ? val : ''}" placeholder="${u || '–'}"><label class="row" style="margin:0;gap:4px"><input type="checkbox" style="width:auto" data-stshare="${k}" ${share ? 'checked' : ''}><span class="muted" style="font-size:11px">${t('share_short')}</span></label></div>`;
  }
  function gallery(uid, mine) {
    const ph = S.photos.filter((p) => p.user === uid && p.kind === 'photo');
    if (!ph.length) return `<div class="muted small">${t('no_photos')}</div>`;
    return `<div class="gallery">${ph.map((p) => `<div class="gitem"><img src="${esc(p.url)}" alt="" data-view="${esc(p.url)}" data-cap="${esc(p.caption)}">${mine ? `<button class="gdel" data-delphoto="${p.id}">✕</button>` : ''}</div>`).join('')}</div>`;
  }
  function viewProfile() {
    const m = memberFull(S.me); const pr = S.profile; const st = pr.stats || {}; const sh = pr.share || {};
    const nPhotos = S.photos.filter((p) => p.user === S.me && p.kind === 'photo').length; const R = S.results[S.me] || {}; const weeks = (R.cycles || []).filter((c) => c.is_100).length;
    const shared = STATS.filter(([k]) => sh[k] && st[k] != null && st[k] !== '').map(([k, u]) => `<span class="pill">${t('st_' + k)}: ${esc(st[k])} ${u}</span>`).join(' ');
    return `
      <div class="card">
        <div class="row" style="gap:16px;align-items:center"><label class="avwrap" title="${t('change_photo')}">${av(m, 92)}<input type="file" accept="image/*" data-avatar hidden><span class="avedit">📷</span></label>
          <div class="grow"><div class="pstats"><div><b>${nPhotos}</b><span>${t('photos')}</span></div><div><b>${badgesOf(S.me)}</b><span>🏅</span></div><div><b>${weeks}</b><span>${t('weeks_done')}</span></div></div></div></div>
        <div class="mt"><b style="font-size:16px">${esc(m.name)}</b>${pr.location ? ` <span class="muted">· ${esc(pr.location)}</span>` : ''}</div>
        ${pr.bio ? `<div class="small mt" style="white-space:pre-wrap">${esc(pr.bio)}</div>` : ''}
        ${shared ? `<div class="mt small">${shared}</div>` : ''}
        <div class="row mt"><button class="mini" data-tab="settings">✏️ ${t('edit_profile')}</button><button class="mini primary" data-storybtn="1">➕ ${t('add_story')}</button>${m.story ? `<span class="pill acc">${t('story_active')}</span><button class="mini ghost" data-delphoto="${m.story.id}">🗑</button>` : ''}<input type="file" accept="image/*" data-storyfile hidden></div>
      </div>
      <div class="card"><div class="row between"><h3 style="margin:0">${t('my_photos')}</h3><button class="mini primary" data-photobtn="1">➕ ${t('add_photo')}</button><input type="file" accept="image/*" data-photofile hidden></div><div class="mt">${gallery(S.me, true)}</div></div>
      <div class="card"><div class="row between"><h3 style="margin:0">${t('badge_board')} · 🏅 ${badgesOf(S.me)}</h3></div><div class="badges mt">${((S.results[S.me] || {}).cycles || []).filter((c) => c.badges > 0).map((c) => `<div class="bitem" title="${c.week_start}">${badgeSvg(c.badges, 44)}<div class="muted" style="font-size:10px">${c.week_start.slice(5)}</div></div>`).join('') || `<div class="muted small">${t('no_badges')}</div>`}</div></div>`;
  }
  function pushState() { if (!('Notification' in window) || !('PushManager' in window)) return t('push_unsupported'); if (Notification.permission === 'granted') return t('push_on'); if (Notification.permission === 'denied') return t('push_denied'); return t('push_off'); }
  async function enablePush() {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) { toast(t('push_unsupported')); return; }
    const perm = await Notification.requestPermission(); if (perm !== 'granted') { toast(t('push_denied')); render(); return; }
    const reg = await navigator.serviceWorker.ready;
    const key = Uint8Array.from(atob(C.vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(C.vapidPublicKey.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
    let sub = await reg.pushManager.getSubscription(); if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    await ST.savePushSubscription(sub.toJSON()); toast('🔔 ' + t('push_on')); render();
  }
  function viewSettings() {
    const m = memberFull(S.me); const n = S.profile.notif || {}; const pr = S.profile; const st = pr.stats || {}; const sh = pr.share || {};
    return `
      <div class="card"><h3>${t('edit_profile')}</h3><label>${t('name')}</label><input data-name="1" value="${esc(m.name)}"><label>${t('location_ph')}</label><input data-loc="1" value="${esc(pr.location || '')}" placeholder="${t('location_ph')}"><label>${t('bio_ph')}</label><textarea rows="2" maxlength="200" data-bio="1" placeholder="${t('bio_ph')}">${esc(pr.bio || '')}</textarea></div>
      <div class="card"><h3>${t('my_data')}</h3><div class="muted small mb">${t('my_data_hint')}</div>${STATS.map(([k, u]) => statRow(k, u, st[k], sh[k], true)).join('')}</div>
      <div class="card"><h3>${t('language')} · ${t('checkin_time')}</h3><div class="row"><div class="seg">${['sk', 'en'].map((l) => `<button class="${WW_STATE.lang === l ? 'on' : ''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}</div><input type="time" data-cktime="1" value="${S.profile.checkinTime}" style="width:auto"></div></div>
      <div class="card"><h3>${t('theme')}</h3><div class="themes">${Object.keys(C.themes).map((k) => `<div class="theme ${(S.theme || localStorage.getItem('ww_theme') || 'green') === k ? 'on' : ''}" data-theme="${k}" title="${t('theme_' + k)}" style="background:linear-gradient(135deg,${C.themes[k].acc},${C.themes[k].bg})"></div>`).join('')}</div></div>
      <div class="card"><h3>${t('notifications')}</h3><div class="row mb"><button class="primary" data-pushon="1">🔔 ${t('push_enable')}</button><span class="muted small" data-pushstate>${pushState()}</span></div>${[['checkin', 'notif_checkin'], ['reminder', 'notif_reminder'], ['social', 'notif_social'], ['proposals', 'notif_proposals']].map(([k, lab]) => `<label class="row" style="margin:6px 0"><input type="checkbox" style="width:auto" data-notif="${k}" ${n[k] ? 'checked' : ''}> <span>${t(lab)}</span></label>`).join('')}<div class="muted small mt">${t('install_ios')}<br>${t('install_android')}</div></div>
      <div class="card"><h3>${t('privacy')}</h3><div class="row"><button data-export="1">${t('export')}</button><button class="danger" data-delacc="1">${t('delete_account')}</button></div></div>
      <div class="card"><h3>${t('about')}</h3><div class="muted small">Weekwell ${C.version} · ${C.stub ? 'stub store' : 'Supabase'} · ${new Date().getFullYear()}</div><div class="row mt">${C.stub ? `<button class="mini" data-reset="1">${t('reset_stub')}</button>` : `<button class="mini" data-signout="1">${t('sign_out')}</button>`}</div></div>`;
  }
  function groupSheet() {
    const g = S.group; const sh = sheet(`<div class="h2">${t('group_settings')}</div><div class="grid2"><div><label>${t('group_name')}</label><input data-gs="name" value="${esc(g.name)}" maxlength="40"></div><div><label>Emoji</label><input data-gs="emoji" value="${esc(g.emoji || '')}" maxlength="4"></div></div><div class="row mt">${gav(44)}<button class="mini" data-gphoto="1">📷 ${t('group_photo')}</button>${S.group.avatar_url ? `<button class="mini ghost" data-gphotodel="1">✕</button>` : ''}<input type="file" accept="image/*" data-gphotofile hidden></div><label>${t('slots')} (2–4)</label><select data-gs="slots">${[2, 3, 4].map((n) => `<option value="${n}" ${g.slots === n ? 'selected' : ''}>${n}</option>`).join('')}</select><div class="row mt"><button class="primary" data-gsok="1">${t('save')}</button><button data-gsx="1">${t('cancel')}</button></div>`);
    sh.addEventListener('click', (ev) => { if (ev.target.closest('[data-gphoto]')) { const inp = sh.querySelector('[data-gphotofile]'); inp.onchange = async () => { const f = inp.files[0]; if (!f) return; sh.remove(); await act(async () => { const small = await shrink(f, 1600); const cropped = await cropSheet(small, 512); if (!cropped) return; await ST.uploadGroupAvatar(cropped); toast('✔'); }); }; inp.click(); return; } if (ev.target.closest('[data-gphotodel]')) { sh.remove(); act(() => ST.updateGroup({ avatar_url: null })); return; } if (ev.target.closest('[data-gsx]')) { sh.remove(); return; } if (!ev.target.closest('[data-gsok]')) return; const v = (k) => sh.querySelector(`[data-gs="${k}"]`).value; const name = v('name').trim(); if (!name) return; sh.remove(); act(async () => { await ST.updateGroup({ name: name.slice(0, 40), emoji: v('emoji').trim().slice(0, 4) || '💪', slots: +v('slots') }); toast('✔'); }); });
  }
  function memberSheet(id) {
    const m = memberFull(id); const st = m.stats || {}; const sh = m.share || {}; const mine = id === S.me;
    const stats = STATS.filter(([k]) => (mine || sh[k]) && st[k] != null && st[k] !== '').map(([k, u]) => statRow(k, u, st[k], sh[k], false)).join('') || `<div class="muted small">${t('no_shared')}</div>`;
    const story = m.story ? `<div class="mt"><div class="muted small">${t('story')}</div><img class="evphoto" src="${esc(m.story.url)}" alt="" data-view="${esc(m.story.url)}" data-cap="${esc(m.story.caption)}">${m.story.caption ? `<div class="small">${esc(m.story.caption)}</div>` : ''}</div>` : '';
    const nph = S.photos.filter((p) => p.user === m.id && p.kind === 'photo').length; const wk = ((S.results[m.id] || {}).cycles || []).filter((c) => c.is_100).length;
    sheet(`<div class="row" style="gap:14px">${av(m, 72)}<div class="grow"><div class="pstats"><div><b>${nph}</b><span>${t('photos')}</span></div><div><b>${badgesOf(m.id)}</b><span>🏅</span></div><div><b>${wk}</b><span>${t('weeks_done')}</span></div></div><div class="h2" style="margin:6px 0 0">${esc(m.name)}</div><div class="muted small">${esc(m.location || '')}${m.id === S.group.admin ? ` · ${t('admin')}` : ''}${S.group.paused.includes(m.id) ? ` · ${t('paused')}` : ''}</div><div class="small mt">${esc(m.bio || '')}</div></div></div>
      <div class="row mt small"><span class="pill">${t('lb_week')}: ${P(memberPct(m.id))}</span><span class="pill">${t('streak')} ${(S.results[m.id] || {}).streak || 0}</span><span class="pill">🏅 ${badgesOf(m.id)}</span></div>
      ${story}
      <div class="mt"><div class="muted small">${t('goals')}</div>${(m.goals || []).length ? (m.goals || []).map((g) => { const e = g.entries || []; const first = e.length ? e[0].value : null, last = e.length ? e[e.length - 1].value : null; const u = mDef(g).unit; const tr = e.length >= 2 ? trend(g) : 'stable'; const delta = first != null && last != null ? (last - first) : null; const prog = first != null && last != null && g.target !== first ? Math.max(0, Math.min(1, (last - first) / (g.target - first))) : 0; return `<div style="padding:6px 0;border-top:1px solid var(--line)"><div class="row between small"><b>${goalIcon(g)} ${esc(mName(g))}</b><span class="pill ${tr === 'improving' ? 'acc' : tr === 'attention' ? 'bad' : ''}">${t('trend_' + tr)}</span></div><div class="row between small muted"><span>${delta != null ? (delta > 0 ? '+' : '') + (Math.round(delta * 10) / 10) + ' ' + esc(u) + ' ' + t('since_start') : t('no_items')}</span><span>${t('goal')}: ${g.target} ${esc(u)}</span></div><div class="bar"><i style="width:${prog * 100}%"></i></div></div>`; }).join('') : `<div class="muted small">${t('no_shared_goals')}</div>`}</div>
      <div class="mt"><div class="muted small">${t('history')}</div>${((S.results[m.id] || {}).cycles || []).slice(-8).map((c) => `<div class="row between small" style="padding:4px 0"><span class="muted">${c.week_start.slice(5)}</span><span class="grow"><div class="bar"><i style="width:${c.pct}%"></i></div></span><b>${Math.round(c.pct)} %</b>${c.badges ? badgeSvg(c.badges, 18) : ''}</div>`).join('') || `<div class="muted small">${t('no_items')}</div>`}</div>
      <div class="mt"><div class="muted small">${t('my_data')}</div>${stats}</div>
      <div class="mt"><div class="muted small">${t('photos')}</div>${gallery(m.id, false)}</div>`);
  }
  function viewer(url, cap) { const el = document.createElement('div'); el.className = 'viewer'; el.innerHTML = `<img src="${esc(url)}" alt="">${cap ? `<div class="cap">${esc(cap)}</div>` : ''}`; el.addEventListener('click', () => el.remove()); document.body.appendChild(el); }
  async function pickAndUpload(inputSel, handler) { const inp = document.querySelector(inputSel); if (!inp) return; inp.onchange = async () => { const f = inp.files[0]; if (!f) return; await act(async () => { await handler(await shrink(f)); }); }; inp.click(); }

  // ---------- render + events ----------
  function render() {
    if (!S) return; const tab = WW_STATE.tab; const v = { home: viewHome, challenges: viewChallenges, group: viewGroup, progress: viewProgress, profile: viewProfile, settings: viewSettings, rules: viewRules, chat: viewChat }[tab] || viewHome;
    $('#main').innerHTML = (C.stub ? `<div class="banner">${t('stub_banner')}</div>` : '') + v();
    document.querySelectorAll('nav.tabs a').forEach((a) => { a.classList.toggle('on', a.dataset.tab === tab); a.querySelector('em').textContent = t('tab_' + a.dataset.tab); }); renderMenu(); const mb = $('#menubtn'); if (mb) mb.classList.toggle('primary', MENU.some(([k]) => k === tab));
    $('#sub').innerHTML = `${av(memberFull(S.me), 22)} ${esc(me().name)} · ${P(memberPct(S.me))}`;
  }
  function go(tab) { WW_STATE.tab = tab; location.hash = tab; render(); window.scrollTo(0, 0); }
  const selDate = () => WW_STATE.selDate || today();

  document.addEventListener('click', (e) => {
    if (!S) return;
    const el = e.target.closest('[data-tab],[data-d],[data-chk],[data-proof],[data-propose],[data-vote],[data-veto],[data-delp],[data-sim],[data-lb],[data-kudos],[data-csend],[data-invite],[data-join],[data-pause],[data-addgoal],[data-lang],[data-export],[data-delacc],[data-reset],[data-signout],[data-view],[data-member],[data-storybtn],[data-photobtn],[data-delphoto],[data-avatar-btn],[data-editgoal],[data-delgoal],[data-catchup],[data-theme],[data-rpropose],[data-rvote],[data-rrevoke],[data-chatsend],[data-gsettings],[data-editp],[data-pushon],[data-ccinfo],[data-delphotoev],[data-selectnow],[data-reopen],[data-chtab],[data-again]');
    if (!el) return; const d = el.dataset;
    if (d.gsettings) { groupSheet(); return; }
    if (d.view) { viewer(d.view, d.cap); return; }
    if (d.ccinfo) { if (e.target.closest('button,input,.chk')) return; if (d.ccinfo.startsWith('p:')) { const pp = S.next.proposals.find((x) => x.id === d.ccinfo.slice(2)); if (pp) challengeSheet({ tpl: pp.tpl, votes: pp.votes.length }, `<div class="muted small mt">${t('rule_by', { name: pp.authors.map((a) => member(a).name).join(', ') })}</div><div class="small mt">🗳 ${pp.votes.length ? pp.votes.map((v) => esc(member(v).name)).join(', ') : t('no_votes_yet')}</div>`); } else { const cc = S.cur.challenges.find((x) => x.id === d.ccinfo) || (S.next.simulated || []).find((x) => x.id === d.ccinfo); if (cc) challengeSheet(cc); } return; }
    if (d.chtab) { WW_STATE.chTab = d.chtab; render(); return; }
    if (d.again) { const tpl = S.lib.find((x) => x.id === d.again) || (S.history || []).flatMap((h) => [...h.challenges, ...h.proposals]).map((x) => x.tpl).find((x) => x && x.id === d.again); if (!tpl) return; el.disabled = true; return act(() => ST.addProposal(tpl)); }
    if (d.selectnow) { if (confirm(t('select_now') + '?')) act(() => ST.selectNow()); return; }
    if (d.reopen) { if (confirm(t('reopen_confirm'))) act(() => ST.reopenCurrent()); return; }
    if (d.pushon) { act(() => enablePush()); return; }
    if (d.theme) { applyTheme(d.theme); return act(() => ST.setTheme(d.theme)); }
    if (d.rpropose) { const inp = $('[data-ruletext]'); const txt = (inp.value || '').trim(); if (!txt) return; el.disabled = true; return act(() => ST.proposeRule(txt.slice(0, 300), 'add', null)); }
    if (d.rvote) { return act(async () => { const st = await ST.voteRule(d.rvote, d.v === '1'); if (st === 'active') toast('✅'); }); }
    if (d.rrevoke) { e.preventDefault(); const r = S.rules.find((x) => x.id === d.rrevoke); if (!r || !confirm(t('rule_revoke_text', { t: r.text }))) return; return act(() => ST.proposeRule(t('rule_revoke_text', { t: r.text }), 'revoke', r.id)); }
    if (d.chatsend) { const inp = $('[data-chatin]'); const txt = (inp.value || '').trim(); if (!txt) return; inp.value = ''; return act(() => ST.sendMessage(txt.slice(0, 500))); }
    if (d.member && !e.target.closest('input')) { memberSheet(d.member); return; }
    if (d.storybtn) { pickAndUpload('[data-storyfile]', async (blob) => { const cap = prompt(t('caption_ph')) || ''; await ST.addPhoto(blob, cap.slice(0, 200), 'story'); toast('✔ ' + t('story')); }); return; }
    if (d.photobtn) { pickAndUpload('[data-photofile]', async (blob) => { const cap = prompt(t('caption_ph')) || ''; const cur = (S.results[S.me] || {}).streak || 0; let out = blob; if (cur > 0 && confirm(t('badge_on_photo') + ' (' + cur + ')?')) out = await stampBadge(blob, cur); await ST.addPhoto(out, cap.slice(0, 200), 'photo'); toast('✔'); }); return; }
    if (d.delphotoev) { const ev = S.events.find((x) => x.id === d.delphotoev); const ph = ev && S.photos.find((p) => p.url === ev.photo || (ev.photo && p.url && p.url.split('?')[0] === ev.photo.split('?')[0])); if (!ph) { toast('?'); return; } if (confirm(t('delete') + '?')) act(() => ST.deletePhoto(ph.id)); return; }
    if (d.delphoto) { if (confirm(t('delete') + '?')) act(() => ST.deletePhoto(d.delphoto)); return; }
    if (d.tab) { e.preventDefault(); go(d.tab); return; }
    if (d.d) { if (d.f === '1') return; WW_STATE.selDate = d.d; render(); return; }
    if (d.chk) { const l = S.logs[S.me + '|' + d.chk + '|' + selDate()] || {}; const cc = S.cur.challenges.find((x) => x.id === d.chk); if (!l.done && cc && cc.tpl.proof === 'required' && l.src !== 'proof') { toast(t('proof_required')); return; } return act(() => l.done ? ST.clearLog(d.chk, selDate()) : ST.setLog(d.chk, selDate(), { done: true, src: l.src || 'self' })); }
    if (d.proof) {
      const sh = sheet(`<div class="h2">${t('proof_add')}</div><label>${t('proof_photo')}</label><input type="file" accept="image/*" capture="environment" data-pf-file><label>${t('proof_strava')}</label><input data-pf-url placeholder="https://www.strava.com/activities/…"><div class="row mt"><button class="primary" data-pf="save">${t('save')}</button><button data-pf="x">${t('cancel')}</button></div>`);
      sh.addEventListener('click', async (ev) => { const b = ev.target.closest('[data-pf]'); if (!b) return; if (b.dataset.pf === 'x') { sh.remove(); return; }
        const url = sh.querySelector('[data-pf-url]').value.trim(); const f = sh.querySelector('[data-pf-file]').files[0]; sh.remove();
        await act(async () => { let u = url || null; if (f) { const cc = S.cur.challenges.find((x) => x.id === d.proof); u = await ST.addPhoto(await shrink(f), (cc ? tplTitle(cc.tpl) : '') + ' · ' + t('src_proof'), 'photo'); } await ST.setLog(d.proof, selDate(), { done: true, src: 'proof', url: u }); toast('📎 ' + t('src_proof')); }); });
      return;
    }
    if (d.propose === 'lib') { const sh = sheet(`<div class="h2">${t('from_library')}</div><input data-libq placeholder="🔍" class="mb"><div data-liblist>${libList('')}</div>`); sh.addEventListener('input', (ev) => { if (ev.target.matches('[data-libq]')) sh.querySelector('[data-liblist]').innerHTML = libList(ev.target.value); }); sh.addEventListener('click', (ev) => { const b = ev.target.closest('[data-pick]'); if (!b) return; const tp = S.lib.find((x) => x.id === b.dataset.pick); sh.remove(); act(() => ST.addProposal(tp)); }); return; }
    if (d.propose === 'custom') { challengeForm(null); return; }
    if (d.editp) { const p = S.next.proposals.find((x) => x.id === d.editp); if (p) challengeForm(p); return; }
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
    if (d.catchup) { act(async () => { const n = await ST.startCatchup(); toast(t('catchup_started', { n })); }); return; }
    if (d.editgoal) { goalSheet(S.goals.find((x) => x.id === d.editgoal)); return; }
    if (d.delgoal) { if (confirm(t('delete_goal_confirm'))) act(() => ST.deleteGoal(d.delgoal)); return; }
    if (d.addgoal) { goalSheet(null); return; }
    if (false) { const sh = sheet(`<div class="h2">${t('add_goal')}</div><label>${t('goals')}</label><select data-g="metric">${Object.keys(C.metrics).map((k) => `<option value="${k}">${t('m_' + k)}</option>`).join('')}</select><label>${t('goal_target')}</label><input type="number" inputmode="decimal" data-g="target"><label>${t('start')}</label><input type="number" inputmode="decimal" data-g="start"><div class="row mt"><button class="primary" data-gsave="1">${t('save')}</button><button data-gx="1">${t('cancel')}</button></div>`); sh.addEventListener('click', (ev) => { if (ev.target.closest('[data-gx]')) { sh.remove(); return; } if (!ev.target.closest('[data-gsave]')) return; const g = (k) => sh.querySelector(`[data-g="${k}"]`).value; if (!g('target')) return; sh.remove(); act(() => ST.addGoal({ metric: g('metric'), target: +g('target'), start: g('start') ? +g('start') : null })); }); return; }
    if (d.lang) { WW_STATE.lang = d.lang; return act(() => ST.updateProfile({ lang: d.lang })); }
    if (d.export) { return act(async () => { const blob = new Blob([await ST.exportJSON()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'weekwell-export.json'; a.click(); }); }
    if (d.delacc) { if (confirm(t('delete_account') + '?')) act(async () => { await ST.deleteAccount(); location.reload(); }); return; }
    if (d.reset) { act(async () => { await ST.reset(); location.reload(); }); return; }
    if (d.signout) { act(async () => { await ST.signOut(); location.reload(); }); return; }
  });
  function challengeForm(prop) {
    const tp = prop ? prop.tpl : null; const v0 = (k, d) => (tp && tp[k] != null ? tp[k] : d);
    const sh = sheet(`<div class="h2">${prop ? t('edit_challenge') : t('custom')}</div>
      <label>${t('title')}</label><input data-c="title" maxlength="60" placeholder="${t('custom_title_ph')}" value="${esc(v0('title_sk', ''))}">
      <label>${t('description')}</label><input data-c="desc" maxlength="200" placeholder="${t('custom_desc_ph')}" value="${esc(v0('description', '') || '')}">
      <div class="grid2"><div><label>${t('category')}</label><select data-c="category">${C.categories.map((c) => `<option value="${c}" ${v0('category', 'movement') === c ? 'selected' : ''}>${t('cat_' + c)}</option>`).join('')}</select></div><div><label>${t('type')}</label><select data-c="type">${['binary_daily', 'count_weekly', 'count_daily', 'once'].map((k) => `<option value="${k}" ${v0('type', 'binary_daily') === k ? 'selected' : ''}>${t('type_' + k)}</option>`).join('')}</select></div></div>
      <div data-cwrap="binary_daily"><label>${t('days_per_week')}</label><select data-c="days">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${(tp && tp.type === 'binary_daily' ? tp.target : 5) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div data-cwrap="count" hidden><div class="grid2"><div><label>${t('target')}</label><input type="number" inputmode="decimal" data-c="target" placeholder="10" value="${tp && tp.type !== 'binary_daily' && tp.type !== 'once' ? tp.target : ''}"></div><div><label>${t('unit')}</label><input data-c="unit" placeholder="${t('unit_ph')}" value="${esc(tp && tp.type !== 'binary_daily' && tp.type !== 'once' ? tp.unit : '')}"></div></div><div data-cwrap="count_daily" hidden><label>${t('min_days')}</label><select data-c="min_days">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${(v0('min_days', 5)) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
      <label class="row mt"><input type="checkbox" style="width:auto" data-c="proof" ${v0('proof', 'optional') === 'required' ? 'checked' : ''}> <span>${t('proof_required')}</span></label>
      <div class="row mt"><button class="primary" data-csave="1">${t('save')}</button><button data-cx="1">${t('cancel')}</button></div>`);
    const sync = () => { const ty = sh.querySelector('[data-c="type"]').value; sh.querySelector('[data-cwrap="binary_daily"]').hidden = ty !== 'binary_daily'; sh.querySelector('[data-cwrap="count"]').hidden = !(ty === 'count_weekly' || ty === 'count_daily'); sh.querySelector('[data-cwrap="count_daily"]').hidden = ty !== 'count_daily'; };
    sync(); sh.addEventListener('change', (ev) => { if (ev.target.matches('[data-c="type"]')) sync(); });
    sh.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-cx]')) { sh.remove(); return; } const btn = ev.target.closest('[data-csave]'); if (!btn || btn.disabled) return;
      const g = (k) => { const el = sh.querySelector(`[data-c="${k}"]`); return el ? (el.type === 'checkbox' ? el.checked : el.value) : ''; };
      const title = String(g('title')).trim(); if (!title) return; const ty = g('type');
      const tpl = { id: prop ? null : (C.stub ? 'cust' + Date.now() : null), category: g('category'), title_sk: title, title_en: title, description: String(g('desc')).trim().slice(0, 200) || null, type: ty, proof: g('proof') ? 'required' : 'optional', source: 'custom' };
      if (ty === 'binary_daily') { tpl.target = +g('days') || 5; tpl.unit = 'days'; }
      else if (ty === 'once') { tpl.target = 1; tpl.unit = '—'; }
      else { tpl.target = +g('target'); if (!tpl.target) return; tpl.unit = String(g('unit')).trim() || '×'; if (ty === 'count_daily') tpl.min_days = +g('min_days') || 5; }
      btn.disabled = true; sh.remove();
      act(() => prop ? ST.updateProposal(prop.id, tpl) : ST.addProposal(tpl));
    });
  }
  function libList(qs) { const ql = qs.toLowerCase(); return S.lib.filter((tp) => !ql || tplTitle(tp).toLowerCase().includes(ql) || t('cat_' + tp.category).toLowerCase().includes(ql)).map((tp) => `<div class="libitem"><div class="cat">${iconFor(tp)}</div><div class="grow"><div>${esc(tplTitle(tp))}</div><div class="small">${tplLine(tp)}</div></div><button class="mini" data-pick="${tp.id}">${t('add')}</button></div>`).join(''); }
  // #13 – kruhový cropper: drag prstom/myšou, zoom posuvníkom → štvorcový JPEG (out px)
  function cropSheet(file, out) {
    out = out || 512;
    return new Promise(async (resolve) => {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
      const box = 260; const base = box / Math.min(img.width, img.height); let zoom = 1, ox = 0, oy = 0; // ox/oy = posun stredu v px boxu
      const el = document.createElement('div'); el.className = 'sheet';
      el.innerHTML = `<div class="in"><div class="h2">${t('crop_title')}</div><div class="muted small">${t('crop_hint')}</div><div class="cropbox" data-cropbox><img alt=""></div><input type="range" min="1" max="4" step="0.01" value="1" data-zoom class="mt"><div class="row mt"><button class="primary" data-ok>${t('save')}</button><button data-x>${t('cancel')}</button></div></div>`;
      document.body.appendChild(el);
      const im = el.querySelector('img'); im.src = img.src;
      const paint = () => { const w = img.width * base * zoom, h = img.height * base * zoom; const maxx = Math.max(0, (w - box) / 2), maxy = Math.max(0, (h - box) / 2); ox = Math.max(-maxx, Math.min(maxx, ox)); oy = Math.max(-maxy, Math.min(maxy, oy)); im.style.width = w + 'px'; im.style.height = h + 'px'; im.style.left = (box - w) / 2 + ox + 'px'; im.style.top = (box - h) / 2 + oy + 'px'; };
      paint();
      let drag = null; const bx = el.querySelector('[data-cropbox]');
      const pt = (e) => (e.touches ? e.touches[0] : e);
      bx.addEventListener('pointerdown', (e) => { drag = { x: e.clientX - ox, y: e.clientY - oy }; bx.setPointerCapture(e.pointerId); });
      bx.addEventListener('pointermove', (e) => { if (!drag) return; ox = e.clientX - drag.x; oy = e.clientY - drag.y; paint(); });
      bx.addEventListener('pointerup', () => { drag = null; }); bx.addEventListener('pointercancel', () => { drag = null; });
      el.querySelector('[data-zoom]').addEventListener('input', (e) => { zoom = +e.target.value; paint(); });
      el.querySelector('[data-x]').addEventListener('click', () => { el.remove(); resolve(null); });
      el.querySelector('[data-ok]').addEventListener('click', () => {
        const w = img.width * base * zoom, h = img.height * base * zoom; const left = (box - w) / 2 + ox, top = (box - h) / 2 + oy;
        const sx = -left / (base * zoom), sy = -top / (base * zoom), sw = box / (base * zoom), sh = box / (base * zoom);
        const cv = document.createElement('canvas'); cv.width = out; cv.height = out; cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, out, out);
        el.remove(); cv.toBlob((b) => resolve(b), 'image/jpeg', 0.88);
      });
    });
  }
  async function stampBadge(blob, n) { const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(blob); }); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0); const r = Math.round(Math.min(cv.width, cv.height) * 0.09); const cx = cv.width - r - Math.round(r * 0.4), cy = cv.height - r - Math.round(r * 0.4); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#34d399'; ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.08); ctx.strokeStyle = '#04231a'; ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2); ctx.fillStyle = 'rgba(4,35,26,.85)'; ctx.fill(); ctx.fillStyle = '#e9fff5'; ctx.font = `800 ${Math.round(r * 0.85)}px -apple-system,Segoe UI,Roboto,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), cx, cy + r * 0.04); return new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.85)); }
  async function shrink(file, maxPx) { const max = maxPx || C.proof.maxPx; const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }); const s = Math.min(1, max / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); return new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.82)); }
  document.addEventListener('change', (e) => {
    if (!S) return; const el = e.target; const d = el.dataset; const sel = selDate();
    if (d.num) return act(() => el.value === '' ? ST.clearLog(d.num, sel) : ST.setLog(d.num, sel, { value: +el.value, src: (S.logs[S.me + '|' + d.num + '|' + sel] || {}).src || 'self' }));
    if (d.metric) return act(() => ST.setMetricEntry(d.metric, sel, el.value === '' ? null : +el.value));
    if (d.share) return act(() => ST.setGoalShare(d.share, el.checked));
    if (d.avatar !== undefined) { const f = el.files[0]; if (!f) return; el.value = ''; return act(async () => { const small = await shrink(f, 1600); const cropped = await cropSheet(small, 512); if (!cropped) return; await ST.uploadAvatar(cropped); toast('✔'); }); }
    if (d.loc) return act(async () => { await ST.updateProfile({ location: el.value.trim().slice(0, 60) }); toast('✔'); });
    if (d.bio) return act(async () => { await ST.updateProfile({ bio: el.value.trim().slice(0, 200) }); toast('✔'); });
    if (d.stat) return act(() => ST.updateProfile({ stats: { [d.stat]: el.value === '' ? null : +el.value } }));
    if (d.stshare) return act(() => ST.updateProfile({ share: { [d.stshare]: el.checked } }));
    if (d.name) return act(async () => { await ST.updateProfile({ name: el.value.trim().slice(0, 40) || me().name }); toast('✔ ' + t('name')); });
    if (d.cktime) return act(() => ST.updateProfile({ checkinTime: el.value }));
    if (d.notif) return act(() => ST.updateProfile({ notif: { [d.notif]: el.checked } }));
  });
  document.addEventListener('click', (e) => { const mb = e.target.closest('#menubtn'); const menu = $('#menu'); if (!menu) return; if (mb) { renderMenu(); menu.hidden = !menu.hidden; return; } if (!menu.hidden && (e.target === menu || e.target.closest('#menuin a'))) menu.hidden = true; });
  document.addEventListener('click', (e) => { if (e.target.closest('header.top .logo')) { const u = location.pathname + '?r=' + Date.now() + location.hash; location.replace(u); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-chatin]')) { e.preventDefault(); const b = $('[data-chatsend]'); if (b) b.click(); } if (e.key === 'Enter' && e.target.matches('[data-name],[data-loc],[data-ruletext]')) { e.preventDefault(); e.target.blur(); } });
  window.addEventListener('hashchange', () => { WW_STATE.tab = location.hash.replace('#', '') || 'home'; render(); });

  // ---------- boot ----------
  WW_AUTH.start().then(({ store }) => { ST = store; S = ST.state; WW_STATE.lang = S.lang || WW_STATE.lang; if (S.theme) applyTheme(S.theme); render(); })
    .catch((err) => { console.error(err); $('#main').innerHTML = `<div class="card">⚠️ ${esc(err.message || err)}</div>`; });
})();
