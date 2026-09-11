# Weekwell — testovacia verzia (PWA)

Social-accountability appka pre malú uzavretú skupinu: každý týždeň si skupina navrhne a odhlasuje výzvy, každý ich plní a denne zapisuje jedným klikom, skupina vidí % splnenia a posiela si kudos. Zadanie: `Documents/HealthApp/Weekwell_Product_Specification_v0.3.pdf`, rozhodnutia: `Documents/HealthApp/Decisions_log.md`.

## Súbory

| Súbor | Účel |
|---|---|
| `index.html` | shell, 5 tabov, PWA meta, načítanie skriptov |
| `config.js` | **všetky ⚙ parametre** (sloty, časy, limity, metriky, kudos) – jediné miesto s číslami |
| `i18n.js` | **všetky texty** SK/EN – `t('key', {vars})`; do `app.js` sa text nepíše |
| `stub.js` | stub store (iterácia 0): vzorová skupina, knižnica 40 výziev, dáta v `localStorage` (`ww_stub_v1`) |
| `app.js` | UI + logika: výpočet % (spec 3.1), engine výberu (spec 4.3, demo tlačidlo „Simulovať výber“), check-in, hlasovanie/veto, kudos, komentáre, ciele + grafy, profil |
| `styles.css` | true-black, mobile-first |
| `manifest.json`, `sw.js`, `icon-*.png` | PWA (sw je zámerne bez cache) |
| `supabase/schema.sql` | schéma pre iteráciu 1 (Supabase, RLS, cron) |

## Iterácie

- **0 (táto):** klikateľný skeleton na stub dátach – všetky obrazovky a flows zo spec kap. 12.
- **1:** Supabase store s rovnakým API ako `WW_STORE`, auth, cron (výber, uzávierka, report), push, pozvánky, pauzy, GDPR.
- **2:** Strava connect.

## Vývoj

Bez build kroku. Otvor `index.html` cez GitHub Pages (`/robin-reports/weekwell/`). Verzia v `config.js` a v query stringoch v `index.html` (cache-bust).
