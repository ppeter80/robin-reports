// Weekwell — konfigurácia (⚙ parametre zo spec v0.3 kap. 14). Jediné miesto, kde sú čísla.
window.WW_CONFIG = {
  version: '0.1.0-it0',
  stub: true,                       // true = in-memory/localStorage stub store (iterácia 0); false = Supabase
  supabaseUrl: '',                  // doplní sa po založení projektu
  supabaseKey: '',                  // publishable key
  slots: { default: 3, min: 2, max: 4 },
  categoryMaxPerCycle: 2,
  schedule: {                       // pásmo skupiny
    proposalsClose: { dow: 5, time: '18:00' },   // piatok
    votingClose:    { dow: 0, time: '17:00' },   // nedeľa
    selectionAt:    { dow: 0, time: '18:00' },
    cycleClose:     { dow: 0, time: '24:00' },
    reportAt:       { dow: 1, time: '07:00' },   // pondelok
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
