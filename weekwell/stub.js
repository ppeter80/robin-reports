// Weekwell — stub store (iterácia 0). Rovnaké API ako budúci Supabase store; dáta v localStorage.
// Vzorová skupina: 4 členovia, bežiaci týždeň s 3 výzvami, návrhy na budúci týždeň, aktivita.
(function () {
  const KEY = 'ww_stub_v1';
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
  function iso(d) { return d.toISOString().slice(0, 10); }

  function seed() {
    const ws = monday(new Date());
    const dates = [...Array(7)].map((_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return iso(d); });
    const me = { id: 'u1', name: 'Peter', avatar: '🧔' };
    const members = [me, { id: 'u2', name: 'Miša', avatar: '👩' }, { id: 'u3', name: 'Tomáš', avatar: '🧑' }, { id: 'u4', name: 'Zuza', avatar: '👱‍♀️' }];
    const lib = LIB;
    const cur = { id: 'c1', week_start: iso(ws), status: 'running', dates, challenges: [
      { id: 'cc1', tpl: lib.find(x => x.id === 'lib16'), slot: 1, source: 'vote_majority', votes: 3 },
      { id: 'cc2', tpl: lib.find(x => x.id === 'lib3'), slot: 2, source: 'vote_rank', votes: 2 },
      { id: 'cc3', tpl: lib.find(x => x.id === 'lib20'), slot: 3, source: 'library', votes: 0 },
    ] };
    const logs = {}; // key user|cc|date -> {done, value}
    const todayIdx = Math.min((new Date().getDay() + 6) % 7, 6);
    members.forEach(m => {
      for (let i = 0; i < todayIdx; i++) {
        const d = dates[i];
        if (Math.random() < (m.id === 'u1' ? 0.75 : 0.6)) logs[m.id + '|cc1|' + d] = { done: true, src: 'self' };
        if (Math.random() < 0.5) logs[m.id + '|cc2|' + d] = { value: +(2 + Math.random() * 2).toFixed(1), src: Math.random() < 0.5 ? 'proof' : 'self' };
        if (Math.random() < 0.6) logs[m.id + '|cc3|' + d] = { done: true, src: 'self' };
      }
    });
    const next = { id: 'c2', status: 'proposing', proposals: [
      { id: 'p1', tpl: lib.find(x => x.id === 'lib10'), authors: ['u2'], votes: ['u3'], vetoed: false },
      { id: 'p2', tpl: lib.find(x => x.id === 'lib31'), authors: ['u3', 'u4'], votes: ['u2'], vetoed: false },
      { id: 'p3', tpl: lib.find(x => x.id === 'lib25'), authors: ['u4'], votes: [], vetoed: false },
      { id: 'p4', tpl: lib.find(x => x.id === 'lib2'), authors: ['u1'], votes: ['u2', 'u3'], vetoed: false },
      { id: 'p5', tpl: { id: 'cust1', category: 'lifestyle', title_sk: 'Ranná prechádzka so psom', title_en: 'Morning dog walk', type: 'binary_daily', target: 5, unit: 'days', difficulty: 'easy', proof: 'optional', source: 'custom' }, authors: ['u2'], votes: [], vetoed: false },
    ], vetoes: {} /* by|against -> proposalId */ };
    const events = [
      { id: 'e1', user: 'u2', type: 'done', title: cur.challenges[0].tpl.title_sk, ts: Date.now() - 3600e3 * 5, kudos: { '👏': ['u3'] }, comments: [{ user: 'u3', text: 'Ide ti to!', ts: Date.now() - 3600e3 * 4 }] },
      { id: 'e2', user: 'u3', type: 'done', title: cur.challenges[1].tpl.title_sk, ts: Date.now() - 3600e3 * 26, kudos: { '🔥': ['u1', 'u2'] }, comments: [] , proof: 'strava'},
      { id: 'e3', user: 'u4', type: 'pause', ts: Date.now() - 3600e3 * 50, kudos: {}, comments: [] },
      { id: 'e4', user: null, type: 'selected', ts: Date.now() - 3600e3 * 80, kudos: {}, comments: [] },
    ];
    const goals = [
      { id: 'g1', metric: 'weight', target: 84, share: false, entries: [...Array(8)].map((_, i) => ({ date: iso(new Date(ws.getTime() - (7 - i) * 7 * 864e5)), value: +(88.5 - i * 0.45 + (Math.random() - 0.5)).toFixed(1) })) },
      { id: 'g2', metric: 'run_km', target: 20, share: true, entries: [...Array(8)].map((_, i) => ({ date: iso(new Date(ws.getTime() - (7 - i) * 7 * 864e5)), value: +(8 + i * 1.2 + Math.random() * 2).toFixed(1) })) },
    ];
    const results = { u1: { streak: 3, extra: 1, hist: [100, 100, 100, 67, 100] }, u2: { streak: 1, extra: 2, hist: [100, 50, 100, 100, 83] }, u3: { streak: 0, extra: 0, hist: [67, 33, 100, 0, 50] }, u4: { streak: 0, extra: 1, hist: [100, 100, 0, 0, 0] } };
    return { me: 'u1', lang: 'sk', consent: true, group: { id: 'g1', name: 'Chalani & Zuza', emoji: '🚴', admin: 'u1', slots: 3, tz: 'Europe/Bratislava', members, paused: ['u4'] }, lib, cur, next, logs, events, goals, results, profile: { checkinTime: '20:30', notif: { checkin: true, reminder: true, social: true, proposals: true } } };
  }

  let S = null;
  function load() { try { const raw = localStorage.getItem(KEY); if (raw) { S = JSON.parse(raw); if (S.cur && S.cur.week_start === iso(monday(new Date()))) return S; } } catch (e) {} S = seed(); save(); return S; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function reset() { localStorage.removeItem(KEY); S = seed(); save(); return S; }

  window.WW_STORE = { load, save, reset, get: () => S, LIB, monday, iso };
})();
