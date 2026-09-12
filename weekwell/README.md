# Weekwell — testovacia verzia (PWA)

Social-accountability appka pre malú uzavretú skupinu: každý týždeň si skupina navrhne a odhlasuje výzvy, každý ich plní a denne zapisuje jedným klikom, skupina vidí % splnenia a posiela si kudos. Zadanie: `Documents/HealthApp/Weekwell_Product_Specification_v0.3.pdf`, rozhodnutia: `Documents/HealthApp/Decisions_log.md`.

## Súbory

| Súbor | Účel |
|---|---|
| `index.html` | shell, 5 tabov, PWA meta, načítanie skriptov |
| `config.js` | **všetky ⚙ parametre** (sloty, časy, limity, metriky, kudos) – jediné miesto s číslami |
| `i18n.js` | **všetky texty** SK/EN – `t('key', {vars})`; do `app.js` sa text nepíše |
| `stub.js` | stub store: vzorová skupina, knižnica 40 výziev, dáta v `localStorage` (`ww_stub_v2`); **rovnaké async API ako Supabase store** |
| `store-supabase.js` | Supabase store (iterácia 1): číta/zapisuje tabuľky `ww_*`, RPC (`ww_create_invite`, `ww_join_group`, `ww_set_pause`, `ww_delete_me`), bucket `ww-proofs`; skladá stav v tvare stubu |
| `auth.js` | prihlásenie Google + e-mail magic link (Supabase Auth), onboarding so súhlasom (GDPR), pripojenie cez `?j=KÓD` |
| `app.js` | UI + logika: výpočet % (spec 3.1), engine výberu (spec 4.3 – klientske demo pre stub, naostro `ww_select_challenges` v SQL), check-in, hlasovanie/veto, kudos, komentáre, ciele + grafy, profil; všetky zápisy cez `WW_STORE.*` |
| `styles.css` | true-black, mobile-first |
| `manifest.json`, `sw.js`, `icon-*.png` | PWA (sw je zámerne bez cache) |
| `supabase/schema.sql` | schéma pre iteráciu 1 (Supabase, RLS, cron) |

## Iterácie

- **0 (táto):** klikateľný skeleton na stub dátach – všetky obrazovky a flows zo spec kap. 12.
- **1:** Supabase store s rovnakým API ako `WW_STORE`, auth, cron (výber, uzávierka, report), push, pozvánky, pauzy, GDPR.
- **2:** Strava connect.

## Vývoj

Bez build kroku. Otvor `index.html` cez GitHub Pages (`/robin-reports/weekwell/`). Verzia v `config.js` a v query stringoch v `index.html` (cache-bust).
