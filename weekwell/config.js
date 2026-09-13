// Weekwell — konfigurácia (⚙ parametre zo spec v0.3 kap. 14). Jediné miesto, kde sú čísla.
window.WW_CONFIG = {
  version: '0.2.1-it1',
  stub: false,                      // false = Supabase naostro (od 2026-09-13); true = vzorové dáta
  supabaseUrl: 'https://chekxmexwigvbqclrrin.supabase.co',           // projekt TipLab (zdieľaný, tabuľky ww_*) – Peter tam spustil SQL 2026-09-13
  supabaseKey: 'sb_publishable_73CPQ3p9-Eu_0k2KMGpMag_9kybj503',     // publishable key – verejný, RLS chráni dáta
  slots: { default: 3, min: 2, max: 4 },
  categoryMaxPerCycle: 2,
  schedule: {                       // pásmo skupiny; serverová logika v ww_tick() (supabase/ww_schema.sql)
    proposalsClose: { dow: 5, time: '18:00' },
    votingClose:    { dow: 0, time: '17:00' },
    selectionAt:    { dow: 0, time: '18:00' },
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
  metrics: {
    weight:  { unit: 'kg',     dir: 'down', interval: 'weekly' },
    steps:   { unit: 'steps',  dir: 'up',   interval: 'daily' },
    run_km:  { unit: 'km',     dir: 'up',   interval: 'free' },
    time_5k: { unit: 'min',    dir: 'down', interval: 'free' },
    af_days: { unit: 'days',   dir: 'up',   interval: 'daily' },
    sleep_h: { unit: 'h',      dir: 'up',   interval: 'daily' },
  },
};
