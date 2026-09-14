// Weekwell — stub store (iterácia 0/1). Rovnaké async API ako store-supabase.js; dáta v localStorage.
// API: init() → state; potom akcie (všetky async, po nich je WW_STORE.state aktuálny): setLog, clearLog, addProposal, removeProposal,
// toggleVote, veto, toggleKudos, addComment, createInvite, joinGroup, setPause, addGoal, setGoalShare, setMetricEntry, updateProfile,
// exportJSON, deleteAccount, simulateSelection (len stub), reset (len stub).
(function () {
  const KEY = 'ww_stub_v2';
  const LIB = [
    ['movement','Hýb sa 30 min denne','Move 30 min a day','binary_daily',5,'days','medium'],
    ['movement','3 tréningy za týždeň','3 workouts this week','count_weekly',3,'sessions','medium'],
    ['movement','Prebehni 10 km za týždeň','Run 10 km this week','count_weekly',10,'km','medium'],
    ['movement','8 000 krokov denne','8,000 steps a day','count_daily',8000,'steps','medium'],
    ['movement','Schody namiesto výťahu','Stairs instead of elevator','binary_daily',5,'days','easy'],
    ['movement','Bicykel / pešo do práce 3×','Bike or walk to work 3×','count_weekly',3,'sessions','medium'],
    ['movement','Plávanie alebo bazén 1×','Swim once this week','once',1,'—','easy'],
    ['movement','10 min strečing denne','10 min stretching a day','binary_daily',5,'days','easy'],
    ['nutrition','Zelenina ku každému obedu','Veggies with every lunch','binary_daily',5,'days','easy'],
    ['nutrition','Bez sladkého 5 dní','No sweets 5 days','binary_daily',5,'days','medium'],
    ['nutrition','Bez fast foodu celý týždeň','No fast food all week','binary_daily',7,'days','medium'],
    ['nutrition','Raňajky každý deň','Breakfast every day','binary_daily',7,'days','easy'],
    ['nutrition','2 l vody denne','2 L of water a day','binary_daily',5,'days','easy'],
    ['nutrition','Domáca večera 4×','Home-cooked dinner 4×','count_weekly',4,'sessions','medium'],
    ['nutrition','Bez sladených nápojov','No sugary drinks','binary_daily',7,'days','medium'],
    ['alcohol','Alcohol-free 5 dní','5 alcohol-free days','binary_daily',5,'days','medium'],
    ['alcohol','Dry week – bez alkoholu','Dry week','binary_daily',7,'days','hard'],
    ['alcohol','Max 2 drinky za večer','Max 2 drinks per evening','binary_daily',7,'days','easy'],
    ['alcohol','Bez alkoholu v pracovné dni','No alcohol on weekdays','binary_daily',5,'days','medium'],
    ['sleep','V posteli do 23:00','In bed by 11 pm','binary_daily',5,'days','medium'],
    ['sleep','7+ hodín spánku','7+ hours of sleep','binary_daily',5,'days','medium'],
    ['sleep','Bez telefónu v posteli','No phone in bed','binary_daily',5,'days','medium'],
    ['sleep','Vstať bez snooze','Up without snooze','binary_daily',5,'days','hard'],
    ['sleep','Bez kávy po 14:00','No coffee after 2 pm','binary_daily',5,'days','easy'],
    ['mental','10 min meditácie / dýchania','10 min meditation / breathing','binary_daily',5,'days','medium'],
    ['mental','20 strán knihy denne','20 pages a day','binary_daily',5,'days','medium'],
    ['mental','Bez sociálnych sietí 1 deň','One day off social media','once',1,'—','medium'],
    ['mental','Screen time < 2 h','Screen time under 2 h','binary_daily',5,'days','hard'],
    ['mental','Napíš 3 veci, za ktoré si vďačný','3 things you’re grateful for','binary_daily',5,'days','easy'],
    ['mental','Zavolaj niekomu, s kým si dlho nehovoril','Call someone you haven’t talked to in a while','once',1,'—','easy'],
    ['lifestyle','30 min vonku denne','30 min outdoors a day','binary_daily',5,'days','easy'],
    ['lifestyle','Studená sprcha','Cold shower','binary_daily',5,'days','hard'],
    ['lifestyle','Sauna alebo kúpeľ 1×','Sauna or bath once','once',1,'—','easy'],
    ['lifestyle','Ranná rutina do 30 min od vstania','Morning routine within 30 min','binary_daily',5,'days','medium'],
    ['lifestyle','Bez telefónu po 21:00','No phone after 9 pm','binary_daily',5,'days','medium'],
    ['lifestyle','Uprac jednu vec, čo odkladáš','Tidy one thing you keep postponing','once',1,'—','easy'],
    ['lifestyle','Stretni sa s kamarátom naživo','Meet a friend in person','once',1,'—','easy'],
    ['lifestyle','Bez auta na krátke cesty','No car for short trips','binary_daily',5,'days','medium'],
    ['lifestyle','Vypni obrazovky hodinu pred spaním','Screens off an hour before bed','binary_daily',5,'days','medium'],
    ['lifestyle','Skús novú zdravú vec (jedlo/šport)','Try one new healthy thing','once',1,'—','easy'],
  ].map((r, i) => ({ id: 'lib' + (i + 1), category: r[0], title_sk: r[1], title_en: r[2], type: r[3], target: r[4], unit: r[5], difficulty: r[6], proof: 'optional', source: 'library' }));

  function monday(d) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x; }
  function iso(d) { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
  const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function seed() {
    const ws = monday(new Date());
    const dates = [...Array(7)].map((_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return iso(d); });
    const members = [{ id: 'u1', name: 'Peter', avatar: '🧔', location: 'Bratislava', bio: 'Beh, bicykel, sauna.', stats: { height_cm: 183, weight_kg: 86.5, birth_year: 1980, resting_hr: 56 }, share: { weight_kg: false, height_cm: true, resting_hr: true } }, { id: 'u2', name: 'Miša', avatar: '👩', location: 'Trnava', bio: 'Joga a dlhé prechádzky.', stats: { height_cm: 168, resting_hr: 62 }, share: { height_cm: true, resting_hr: true } }, { id: 'u3', name: 'Tomáš', avatar: '🧑', location: 'Praha', bio: '', stats: {}, share: {} }, { id: 'u4', name: 'Zuza', avatar: '👱‍♀️', location: 'Snina', bio: 'Plávanie.', stats: { birth_year: 1985 }, share: { birth_year: true } }];
    members[1].goals = [{ id: 'mg1', metric: 'steps', category: 'movement', target: 10000, share: true, entries: [...Array(6)].map((_, i) => ({ date: iso(new Date(ws.getTime() - (5 - i) * 864e5)), value: 6000 + i * 700 })) }]; members[3].goals = [{ id: 'mg2', metric: 'weight', category: 'body', target: 60, share: true, entries: [...Array(5)].map((_, i) => ({ date: iso(new Date(ws.getTime() - (4 - i) * 7 * 864e5)), value: +(66 - i * 0.6).toFixed(1) })) }];
    const lib = LIB; const T = (id) => lib.find((x) => x.id === id);
    const cur = { id: 'c1', week_start: iso(ws), status: 'running', dates, challenges: [
      { id: 'cc1', tpl: T('lib16'), slot: 1, source: 'vote_majority', votes: 3 }, { id: 'cc2', tpl: T('lib3'), slot: 2, source: 'vote_rank', votes: 2 }, { id: 'cc3', tpl: T('lib20'), slot: 3, source: 'library', votes: 0 } ] };
    const logs = {}; const todayIdx = Math.min((new Date().getDay() + 6) % 7, 6);
    members.forEach((m) => { for (let i = 0; i < todayIdx; i++) { const d = dates[i];
      if (Math.random() < (m.id === 'u1' ? 0.75 : 0.6)) logs[m.id + '|cc1|' + d] = { done: true, src: 'self' };
      if (Math.random() < 0.5) logs[m.id + '|cc2|' + d] = { value: +(2 + Math.random() * 2).toFixed(1), src: Math.random() < 0.5 ? 'proof' : 'self' };
      if (Math.random() < 0.6) logs[m.id + '|cc3|' + d] = { done: true, src: 'self' }; } });
    const next = { id: 'c2', status: 'proposing', proposals: [
      { id: 'p1', tpl: T('lib10'), authors: ['u2'], votes: ['u3'], vetoed: false }, { id: 'p2', tpl: T('lib31'), authors: ['u3', 'u4'], votes: ['u2'], vetoed: false },
      { id: 'p3', tpl: T('lib25'), authors: ['u4'], votes: [], vetoed: false }, { id: 'p4', tpl: T('lib2'), authors: ['u1'], votes: ['u2', 'u3'], vetoed: false },
      { id: 'p5', tpl: { id: 'cust1', category: 'lifestyle', title_sk: 'Ranná prechádzka so psom', title_en: 'Morning dog walk', type: 'binary_daily', target: 5, unit: 'days', difficulty: 'easy', proof: 'optional', source: 'custom' }, authors: ['u2'], votes: [], vetoed: false } ], vetoes: {} };
    const events = [
      { id: 'e1', user: 'u2', type: 'done', title: cur.challenges[0].tpl.title_sk, ts: Date.now() - 3600e3 * 5, kudos: { '👏': ['u3'] }, comments: [{ user: 'u3', text: 'Ide ti to!', ts: Date.now() - 3600e3 * 4 }] },
      { id: 'e2', user: 'u3', type: 'done', title: cur.challenges[1].tpl.title_sk, ts: Date.now() - 3600e3 * 26, kudos: { '🔥': ['u1', 'u2'] }, comments: [], proof: 'strava' },
      { id: 'e3', user: 'u4', type: 'pause', ts: Date.now() - 3600e3 * 50, kudos: {}, comments: [] }, { id: 'e4', user: null, type: 'selected', ts: Date.now() - 3600e3 * 80, kudos: {}, comments: [] } ];
    const goals = [
      { id: 'g1', metric: 'weight', category: 'body', target: 84, share: false, entries: [...Array(8)].map((_, i) => ({ date: iso(new Date(ws.getTime() - (7 - i) * 7 * 864e5)), value: +(88.5 - i * 0.45 + (Math.random() - 0.5)).toFixed(1) })) },
      { id: 'g2', metric: 'run_km', category: 'movement', target: 20, share: true, entries: [...Array(8)].map((_, i) => ({ date: iso(new Date(ws.getTime() - (7 - i) * 7 * 864e5)), value: +(8 + i * 1.2 + Math.random() * 2).toFixed(1) })) } ];
    const mkRes = (hist) => { let st = 0, bd = 0; const cycles = hist.map((pct, i) => { const d = new Date(ws.getTime() - (hist.length - i) * 7 * 864e5); if (pct >= 100) { st += 1; bd += st; } else st = 0; return { id: 'cy' + i, week_start: iso(d), pct, is_100: pct >= 100, badges: pct >= 100 ? st : 0, streak: st, caught_up: false, paused: false }; }); return { streak: st, extra: Math.floor(st / 2), badges: bd, hist, cycles }; };
    const results = { u1: mkRes([100, 100, 100, 67, 100]), u2: mkRes([100, 50, 100, 100, 83]), u3: mkRes([67, 33, 100, 0, 50]), u4: mkRes([100, 100, 0, 0, 0]) };
    results.u1 = mkRes([100, 100, 100, 100, 67]);   // minulý týždeň nesplnený → dá sa dobehnúť
    return { me: 'u1', lang: 'sk', consent: true, group: { id: 'g1', name: 'Chalani & Zuza', emoji: '🚴', admin: 'u1', slots: 3, tz: 'Europe/Bratislava', members, paused: ['u4'] }, lib, cur, next, logs, events, goals, results, history: [1, 2, 3].map((k) => ({ id: 'h' + k, week_start: iso(new Date(ws.getTime() - k * 7 * 864e5)), challenges: [T('lib' + (k * 3)), T('lib' + (k * 3 + 1)), T('lib' + (20 + k))].map((tp, i) => ({ id: 'hc' + k + i, tpl: tp, source: i === 0 ? 'vote_majority' : 'vote_rank', votes: 3 - i })), proposals: [T('lib' + (k * 5)), T('lib' + (k * 5 + 2))].map((tp, i) => ({ id: 'hp' + k + i, tpl: tp, authors: ['u1'] })), results: members.map((m, i) => ({ user: m.id, pct: [100, 67, 33, 100][(i + k) % 4] })) })), theme: null, rules: [{ id: 'r1', text: 'Pri zlom počasí platí aj bicykel v interiéri.', by: 'u2', kind: 'add', status: 'active', ts: Date.now() - 5 * 864e5, decided: Date.now() - 4 * 864e5, yes: ['u1', 'u3'], no: [] }, { id: 'r2', text: 'Tomáš má boľavú nohu – beh si nahradí bicyklom (1 km behu = 3 km bicykla).', by: 'u3', kind: 'add', status: 'proposed', ts: Date.now() - 3600e3 * 3, decided: null, yes: ['u2'], no: [] }], messages: [{ id: 'm1', user: 'u2', text: 'Ahojte, kto ide zajtra ráno behať?', ts: Date.now() - 3600e3 * 20 }, { id: 'm2', user: 'u1', text: 'Ja o 7:00 pri jazere 🏃', ts: Date.now() - 3600e3 * 19 }, { id: 'm3', user: 'u4', text: 'Ja mám pauzu, ale držím palce 💪', ts: Date.now() - 3600e3 * 2 }], catchup: { available: true, active: false, from_week: iso(new Date(ws.getTime() - 7 * 864e5)) }, profile: { checkinTime: '20:30', notif: { checkin: true, reminder: true, social: true, proposals: true }, avatar_url: null, location: 'Bratislava', bio: 'Beh, bicykel, sauna.', stats: { height_cm: 183, weight_kg: 86.5, birth_year: 1980, resting_hr: 56 }, share: { weight_kg: false, height_cm: true, resting_hr: true } }, photos: [] };
  }

  let S = null;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const me = () => S.group.members.find((m) => m.id === S.me);
  const ST = {
    LIB, monday, iso, get state() { return S; },
    async init() { try { const raw = localStorage.getItem(KEY); if (raw) { S = JSON.parse(raw); if (S.cur && S.cur.week_start === iso(monday(new Date()))) return S; } } catch (e) {} S = seed(); save(); return S; },
    async reset() { localStorage.removeItem(KEY); S = seed(); save(); return S; },
    async setLog(cc, date, patch) { const k = S.me + '|' + cc + '|' + date; S.logs[k] = { ...(S.logs[k] || {}), ...patch }; save(); },
    async clearLog(cc, date) { delete S.logs[S.me + '|' + cc + '|' + date]; save(); },
    async addProposal(tpl) { const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase(); const ex = S.next.proposals.find((p) => p.tpl.id === tpl.id || same(p.tpl.title_sk, tpl.title_sk)); if (ex) { if (!ex.authors.includes(S.me)) ex.authors.push(S.me); } else S.next.proposals.push({ id: uid(), tpl, authors: [S.me], votes: [], vetoed: false }); save(); },
    async updateProposal(pid, tpl) { const p = S.next.proposals.find((x) => x.id === pid); p.tpl = { ...p.tpl, ...tpl, id: p.tpl.source === 'custom' ? p.tpl.id : 'cust' + Date.now(), source: 'custom' }; save(); },
    async removeProposal(pid) { S.next.proposals = S.next.proposals.filter((p) => p.id !== pid); save(); },
    async toggleVote(pid) { const p = S.next.proposals.find((x) => x.id === pid); const i = p.votes.indexOf(S.me); if (i >= 0) p.votes.splice(i, 1); else p.votes.push(S.me); save(); },
    async veto(pid, against) { const p = S.next.proposals.find((x) => x.id === pid); S.next.vetoes[S.me + '|' + against] = pid; p.vetoed = true; save(); },
    async toggleKudos(eid, k) { const ev = S.events.find((x) => x.id === eid); ev.kudos[k] = ev.kudos[k] || []; const i = ev.kudos[k].indexOf(S.me); if (i >= 0) ev.kudos[k].splice(i, 1); else ev.kudos[k].push(S.me); save(); },
    async addComment(eid, text) { S.events.find((x) => x.id === eid).comments.push({ user: S.me, text, ts: Date.now() }); save(); },
    async createInvite() { return 'WW-' + S.group.id.toUpperCase() + '7K'; },
    async joinGroup() { return S.group.id; },
    async setPause(weeks) { const i = S.group.paused.indexOf(S.me); if (!weeks) { if (i >= 0) S.group.paused.splice(i, 1); } else if (i < 0) { S.group.paused.push(S.me); S.events.unshift({ id: uid(), user: S.me, type: 'pause', ts: Date.now(), kudos: {}, comments: [] }); } save(); },
    async addGoal(g) { const ex = S.goals.find((x) => x.metric === g.metric); if (ex) { Object.assign(ex, { target: g.target, category: g.category || ex.category, label: g.label || ex.label, unit: g.unit || ex.unit, interval: g.interval || ex.interval }); save(); return 'updated'; } S.goals.push({ id: uid(), metric: g.metric, category: g.category || null, label: g.label || null, unit: g.unit || null, dir: g.dir || null, interval: g.interval || null, target: g.target, share: false, entries: g.start != null ? [{ date: iso(new Date()), value: g.start }] : [] }); save(); return 'added'; },
    async updateGoal(id, p) { const g = S.goals.find((x) => x.id === id); ['target', 'category', 'label', 'unit', 'interval', 'dir'].forEach((k) => { if (p[k] != null && p[k] !== '') g[k] = p[k]; }); if (p.share != null) g.share = p.share; save(); },
    async deleteGoal(id) { S.goals = S.goals.filter((x) => x.id !== id); save(); },
    async proposeRule(text, kind, target) { const others = S.group.members.filter((m) => m.id !== S.me && !S.group.paused.includes(m.id)).length; S.rules.unshift({ id: uid(), text, by: S.me, kind: kind || 'add', target: target || null, status: others ? 'proposed' : 'active', ts: Date.now(), decided: others ? null : Date.now(), yes: [], no: [] }); save(); },
    async voteRule(id, v) { const r = S.rules.find((x) => x.id === id); r.yes = r.yes.filter((u) => u !== S.me); r.no = r.no.filter((u) => u !== S.me); (v ? r.yes : r.no).push(S.me); const others = S.group.members.filter((m) => m.id !== r.by && !S.group.paused.includes(m.id)).length; if (r.yes.length > others / 2) { r.status = 'active'; r.decided = Date.now(); if (r.kind === 'revoke' && r.target) { const t = S.rules.find((x) => x.id === r.target); if (t) t.status = 'revoked'; r.status = 'revoked'; } } else if (r.no.length > others / 2) { r.status = 'rejected'; r.decided = Date.now(); } save(); return r.status; },
    async sendMessage(text) { S.messages.push({ id: uid(), user: S.me, text, ts: Date.now() }); save(); },
    async setTheme(name) { S.theme = name; save(); },
    async savePushSubscription() {},
    async updateGroup(p) { Object.assign(S.group, p); save(); },
    async uploadGroupAvatar(blob) { S.group.avatar_url = await blobUrl(blob); save(); },
    async reopenCurrent() { S.cur.challenges = []; S.cur.status = 'voting'; save(); },
    async selectNow() { S.cur.status = 'running'; save(); },
    async startCatchup() { const T = (id) => S.lib.find((x) => x.id === id); const extra = [T('lib16'), T('lib3')]; extra.forEach((tpl, i) => S.cur.challenges.push({ id: 'ccu' + i, tpl, slot: 91 + i, source: 'catchup', votes: 0, catchup: true })); S.catchup = { available: false, active: true, from_week: S.catchup.from_week }; save(); return extra.length; },
    async setGoalShare(id, v) { S.goals.find((x) => x.id === id).share = v; save(); },
    async setMetricEntry(id, date, value) { const g = S.goals.find((x) => x.id === id); g.entries = g.entries.filter((x) => x.date !== date); if (value != null) g.entries.push({ date, value }); g.entries.sort((a, b) => (a.date < b.date ? -1 : 1)); save(); },
    async updateProfile(p) { if (p.name) me().name = p.name; if (p.lang) S.lang = p.lang; if (p.checkinTime) S.profile.checkinTime = p.checkinTime; if (p.notif) Object.assign(S.profile.notif, p.notif); if (p.location != null) { S.profile.location = p.location; me().location = p.location; } if (p.bio != null) { S.profile.bio = p.bio; me().bio = p.bio; } if (p.stats) { Object.assign(S.profile.stats, p.stats); me().stats = S.profile.stats; } if (p.share) { Object.assign(S.profile.share, p.share); me().share = S.profile.share; } save(); },
    async exportJSON() { return JSON.stringify(S, null, 2); },
    async deleteAccount() { localStorage.removeItem(KEY); },
    async simulateSelection(fn) { S.next.simulated = fn(S); save(); },
    async uploadAvatar(blob) { const url = await blobUrl(blob); me().avatar_url = url; S.profile.avatar_url = url; save(); return url; },
    async addPhoto(blob, caption, kind) { const url = await blobUrl(blob); const id = uid(); S.photos.unshift({ id, user: S.me, url, caption: caption || '', kind: kind || 'photo', ts: Date.now(), expires: kind === 'story' ? Date.now() + 24 * 3600e3 : null }); S.events.unshift({ id: uid(), user: S.me, type: kind || 'photo', title: caption || '', photo: url, ts: Date.now(), kudos: {}, comments: [] }); if (kind === 'story') me().story = S.photos[0]; save(); return url; },
    async deletePhoto(id) { const ph = S.photos.find((p) => p.id === id); S.photos = S.photos.filter((p) => p.id !== id); if (ph) S.events = S.events.filter((e) => !(e.photo === ph.url && e.user === S.me)); if (ph && ph.kind === 'story') me().story = null; save(); },
    async signOut() {},
  };
  function blobUrl(blob) { return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); }); }
  window.WW_STORE = ST;
})();
