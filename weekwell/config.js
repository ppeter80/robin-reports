// Weekwell — konfigurácia (⚙ parametre zo spec v0.3 kap. 14). Jediné miesto, kde sú čísla.
window.WW_CONFIG = {
  version: '0.5.10',
  stub: false,                      // false = Supabase naostro (od 2026-09-13); true = vzorové dáta
  supabaseUrl: 'https://chekxmexwigvbqclrrin.supabase.co',           // projekt TipLab (zdieľaný, tabuľky ww_*) – Peter tam spustil SQL 2026-09-13
  supabaseKey: 'sb_publishable_73CPQ3p9-Eu_0k2KMGpMag_9kybj503',     // publishable key – verejný, RLS chráni dáta
  slots: { default: 3, min: 2, max: 4 },
  categoryMaxPerCycle: 2,
  schedule: {                       // pásmo skupiny; serverová logika v ww_tick() (supabase/ww_schema.sql)
    proposalsClose: { dow: 0, time: '24:00' },   // #22
    votingClose:    { dow: 0, time: '24:00' },
    selectionAt:    { dow: 1, time: '00:05' },
    cycleClose:     { dow: 0, time: '24:00' },
    reportAt:       { dow: 1, time: '07:00' },
  },
  checkin: { defaultTime: '20:30', reminderDelayMin: 60 },
  streakPointsEveryNCycles: 2,
  autopause: { suggestAfterCycles: 2, forceAfterCycles: 3 },
  group: { maxMembers: 10 },
  invite: { ttlDays: 7 },
  note: { maxChars: 140 },
  comment: { maxChars: 280 },
  proof: { maxPx: 1200, maxMb: 1 },
  trend: { thresholdPct: 2, windowWeeks: 4 },
  library: { noRepeatCycles: 2 },
  kudos: ['👏', '🔥', '💪', '❤️', '😂'],
  categories: ['movement', 'nutrition', 'alcohol', 'sleep', 'mental', 'lifestyle'],
  vapidPublicKey: 'BMsEv22SWYKsBdXVpefAHXjpYr7Wpi2NVClG40Q_jnvh75xaqAolkgzdgxn6Vxl9G-V9BEiDPbfl5Kd9yRkmQ_A',   // #23 Web Push (verejný kľúč; privátny má Robin v toolkit/.env)
  themes: {                         // #11 – farebné témy (CSS premenné)
    green:  { bg: '#000000', card: '#111214', card2: '#191b1f', line: '#26282d', text: '#f3f4f6', muted: '#9aa0a6', acc: '#34d399', acc2: '#0f8f6a', dark: true },
    blue:   { bg: '#05070d', card: '#0f1420', card2: '#161d2e', line: '#232c40', text: '#eef2ff', muted: '#98a2c0', acc: '#60a5fa', acc2: '#1d4ed8', dark: true },
    orange: { bg: '#0a0705', card: '#171210', card2: '#211a16', line: '#33281f', text: '#fff5ee', muted: '#b3a094', acc: '#fb923c', acc2: '#c2410c', dark: true },
    light:  { bg: '#f6f7f9', card: '#ffffff', card2: '#eef1f5', line: '#d9dee6', text: '#111827', muted: '#5b6472', acc: '#059669', acc2: '#047857', dark: false },
  },
  goalCategories: {                 // #8 – kategórie cieľov; metriky predvolené + 'custom' (vlastná)
    sport:    ['workouts', 'run_km', 'time_5k', 'bike_km', 'swim_m', 'strength'],
    movement: ['steps', 'active_min', 'stairs'],
    body:     ['weight', 'resting_hr', 'waist_cm'],
    sleep:    ['sleep_h'],
    alcohol:  ['af_days'],
    nutrition:['water_l', 'veg_days'],
    mental:   ['meditation_min', 'pages'],
    other:    [],
  },
  metrics: {
    weight:  { unit: 'kg',     dir: 'down', interval: 'weekly' },
    steps:   { unit: 'steps',  dir: 'up',   interval: 'daily' },
    run_km:  { unit: 'km',     dir: 'up',   interval: 'free' },
    time_5k: { unit: 'min',    dir: 'down', interval: 'free' },
    af_days: { unit: 'days',   dir: 'up',   interval: 'daily' },
    sleep_h: { unit: 'h',      dir: 'up',   interval: 'daily' },
    workouts:{ unit: 'sessions', dir: 'up', interval: 'free' },
    waist_cm:{ unit: 'cm',     dir: 'down', interval: 'weekly' },
    water_l: { unit: 'l',      dir: 'up',   interval: 'daily' },
    veg_days:{ unit: 'days',   dir: 'up',   interval: 'daily' },
    meditation_min: { unit: 'min', dir: 'up', interval: 'daily' },
    pages:   { unit: 'pages',  dir: 'up',   interval: 'daily' },
    bike_km: { unit: 'km',     dir: 'up',   interval: 'free' },
    swim_m:  { unit: 'm',      dir: 'up',   interval: 'free' },
    strength:{ unit: 'sessions', dir: 'up', interval: 'free' },
    active_min: { unit: 'min', dir: 'up',   interval: 'daily' },
    stairs:  { unit: 'floors', dir: 'up',   interval: 'daily' },
  },
};
