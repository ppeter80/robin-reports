---
title: "Gas Market Dashboard — 2026-04-30 (private mirror)"
date: 2026-05-01 00:30:00 +0000
unlisted: true
---

<style>
.gm-wrap{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  color:#1a2744;
  margin-left:calc(-50vw + 50%);
  margin-right:calc(-50vw + 50%);
  padding:0 28px 40px;
  max-width:1320px;
  margin-bottom:0;
}
.gm-wrap *{box-sizing:border-box;}
.gm-hero{
  border-bottom:2px solid #1a2744;
  padding:18px 0 14px;
  margin-bottom:22px;
}
.gm-hero h1{
  font-size:1.55rem;letter-spacing:-0.01em;margin:0 0 4px;
  color:#1a2744;font-weight:700;
}
.gm-hero .sub{font-size:0.88rem;color:#6b7280;letter-spacing:0.02em;}
.gm-section{margin:30px 0 14px;}
.gm-section h2{
  font-size:0.78rem;text-transform:uppercase;letter-spacing:0.12em;
  color:#1a2744;font-weight:700;
  border-left:3px solid #2a5cb8;padding-left:10px;margin:0 0 12px;
}
.gm-section .note{font-size:0.8rem;color:#6b7280;margin-left:14px;}

/* KPI tiles */
.gm-kpis{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
  gap:10px;margin-bottom:6px;
}
.gm-kpi{
  background:#fff;border:1px solid #e5e7eb;border-radius:6px;
  padding:12px 14px;
}
.gm-kpi .label{font-size:0.72rem;color:#6b7280;letter-spacing:0.04em;text-transform:uppercase;}
.gm-kpi .value{
  font-size:1.55rem;font-weight:600;color:#1a2744;
  font-variant-numeric:tabular-nums;letter-spacing:-0.01em;margin-top:2px;
}
.gm-kpi .unit{font-size:0.7rem;color:#9ca3af;margin-left:3px;font-weight:400;}
.gm-kpi .delta{font-size:0.78rem;margin-top:3px;font-variant-numeric:tabular-nums;}

/* Price table */
.gm-tbl-wrap{
  background:#fff;border:1px solid #e5e7eb;border-radius:6px;
  overflow-x:auto;margin-bottom:12px;
}
table.gm-prices{
  width:100%;border-collapse:collapse;font-size:0.86rem;
  font-variant-numeric:tabular-nums;
}
.gm-prices th{
  background:#f8fafc;color:#1a2744;font-weight:600;
  text-align:right;padding:8px 12px;
  border-bottom:1px solid #e5e7eb;
  font-size:0.74rem;text-transform:uppercase;letter-spacing:0.05em;
  white-space:nowrap;
}
.gm-prices th:first-child,.gm-prices td:first-child{text-align:left;}
.gm-prices td{
  padding:8px 12px;border-bottom:1px solid #f1f3f6;
  text-align:right;white-space:nowrap;
}
.gm-prices tr:last-child td{border-bottom:none;}
.gm-prices tr:hover td{background:#f8fafc;}
.gm-prices td.hub{font-weight:600;color:#1a2744;}
.gm-prices td.dash{color:#cbd0d6;}
.gm-prices td .delta{font-size:0.74rem;margin-left:6px;font-weight:500;}

/* Delta colours — shared */
.up-strong{color:#15803d;}
.up-mild{color:#65a30d;}
.flat{color:#6b7280;}
.down-mild{color:#dc7d7d;}
.down-strong{color:#b91c1c;}

/* Charts */
.gm-charts{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(440px,1fr));
  gap:14px;
}
.gm-charts figure{
  margin:0;background:#fff;border:1px solid #e5e7eb;border-radius:6px;
  padding:6px;
}
.gm-charts img{width:100%;height:auto;display:block;border-radius:3px;}
.gm-charts figcaption{
  text-align:center;font-size:0.8rem;color:#4b5563;
  padding:6px 0 4px;font-weight:500;
}

/* News cards */
.gm-news{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:12px;
}
.gm-news .card{
  background:#fff;border:1px solid #e5e7eb;border-radius:6px;
  padding:14px 16px;
}
.gm-news .card h3{
  font-size:0.95rem;color:#1a2744;font-weight:600;
  margin:0 0 4px;line-height:1.3;
}
.gm-news .card .meta{
  font-size:0.72rem;color:#9ca3af;letter-spacing:0.04em;
  text-transform:uppercase;margin-bottom:8px;
}
.gm-news .card p{
  font-size:0.86rem;color:#374151;line-height:1.45;margin:0;
}

.gm-foot{
  font-size:0.72rem;color:#9ca3af;margin-top:30px;
  border-top:1px solid #e5e7eb;padding-top:10px;
  letter-spacing:0.02em;
}

@media (max-width:780px){
  .gm-wrap{padding:0 14px 24px;}
  .gm-hero h1{font-size:1.25rem;}
  .gm-kpi .value{font-size:1.25rem;}
}
</style>

<div class='gm-wrap'>
  <div class='gm-hero'>
    <h1>European Gas Market Dashboard</h1>
    <div class='sub'>Thu 30 Apr 2026 · day-ahead, front month and forward curves · prices in EUR/MWh</div>
  </div>
  <div class='gm-section'>
    <h2>Key indicators <span class='note'>day-on-day change vs prior trading day</span></h2>
<div class='gm-kpis'><div class='gm-kpi'><div class='label'>TTF · DA</div><div class='value'>46.30 <span class='unit'>EUR/MWh</span></div><div><span class='delta up-strong'>▲ +2.65%</span></div></div><div class='gm-kpi'><div class='label'>CEGH · DA</div><div class='value'>48.03 <span class='unit'>EUR/MWh</span></div><div><span class='delta up-strong'>▲ +3.11%</span></div></div><div class='gm-kpi'><div class='label'>SK VTP · DA</div><div class='value'>48.15 <span class='unit'>EUR/MWh</span></div><div><span class='delta down-strong'>▼ -1.64%</span></div></div><div class='gm-kpi'><div class='label'>THE · DA</div><div class='value'>46.70 <span class='unit'>EUR/MWh</span></div><div><span class='delta up-strong'>▲ +2.19%</span></div></div><div class='gm-kpi'><div class='label'>PSV · DA</div><div class='value'>45.15 <span class='unit'>EUR/MWh</span></div><div><span class='delta down-strong'>▼ -3.11%</span></div></div><div class='gm-kpi'><div class='label'>CEGH – TTF · DA spread</div><div class='value'>+1.73 <span class='unit'>EUR/MWh</span></div><div class='delta'>&nbsp;</div></div></div>
  </div>
  <div class='gm-section'>
    <h2>Spot &amp; Front Month</h2>
<div class="gm-tbl-wrap"><table class="gm-prices">
<thead><tr><th>Hub</th><th>Day-Ahead</th><th>Δ DA</th><th>Front Month</th><th>Δ FM</th></tr></thead><tbody>
<tr><td class='hub'>TTF</td><td>46.30</td><td><span class='delta up-strong'>▲ +2.65%</span></td><td>45.73</td><td><span class='delta down-strong'>▼ -2.07%</span></td></tr>
<tr><td class='hub'>THE</td><td>46.70</td><td><span class='delta up-strong'>▲ +2.19%</span></td><td>47.51</td><td><span class='delta up-strong'>▲ +3.55%</span></td></tr>
<tr><td class='hub'>CEGH</td><td>48.03</td><td><span class='delta up-strong'>▲ +3.11%</span></td><td>48.50</td><td><span class='delta up-mild'>▲ +0.51%</span></td></tr>
<tr><td class='hub'>SK VTP</td><td>48.15</td><td><span class='delta down-strong'>▼ -1.64%</span></td><td>49.30</td><td><span class='delta down-mild'>▼ -0.20%</span></td></tr>
<tr><td class='hub'>HU MGP</td><td>47.28</td><td><span class='delta down-strong'>▼ -2.00%</span></td><td>48.40</td><td><span class='delta flat'>flat</span></td></tr>
<tr><td class='hub'>UA</td><td>43.00</td><td><span class='delta up-mild'>▲ +0.99%</span></td><td>42.64</td><td><span class='delta up-mild'>▲ +0.73%</span></td></tr>
<tr><td class='hub'>PSV</td><td>45.15</td><td><span class='delta down-strong'>▼ -3.11%</span></td><td>45.14</td><td><span class='delta down-strong'>▼ -3.76%</span></td></tr>
<tr><td class='hub'>NBP</td><td>44.16</td><td><span class='delta down-strong'>▼ -2.36%</span></td><td>44.38</td><td><span class='delta down-strong'>▼ -2.16%</span></td></tr>
<tr><td class='hub'>PEG</td><td>45.39</td><td><span class='delta down-mild'>▼ -0.61%</span></td><td>45.01</td><td><span class='delta down-strong'>▼ -2.00%</span></td></tr>
<tr><td class='hub'>ZTP</td><td>44.89</td><td><span class='delta down-strong'>▼ -2.94%</span></td><td>45.37</td><td><span class='delta down-strong'>▼ -2.00%</span></td></tr>
</tbody></table></div>
<div class="gm-charts">
<figure><img src="{{ "/assets/reports/chart-da-opro9t2.png" | relative_url }}" alt="Day-Ahead Prices" /><figcaption>Day-Ahead Prices</figcaption></figure>
<figure><img src="{{ "/assets/reports/chart-fm-opro9t2.png" | relative_url }}" alt="Front-Month Prices" /><figcaption>Front-Month Prices</figcaption></figure>
</div>
  </div>
  <div class='gm-section'>
    <h2>Forward Curve <span class='note'>quarters · seasons · calendar years</span></h2>
<div class="gm-tbl-wrap"><table class="gm-prices">
<thead><tr><th>Hub</th><th>Q+1</th><th>Q+2</th><th>Sum 26</th><th>Sum 27</th><th>Win 27</th><th>Cal 2027</th><th>Cal 2028</th><th>Cal 2029</th><th>Cal 2030</th></tr></thead><tbody>
<tr><td class='hub'>TTF</td><td>46.58 <span class='delta up-strong'>+2.12%</span></td><td>45.45 <span class='delta down-strong'>-1.88%</span></td><td>44.91 <span class='delta down-strong'>-1.95%</span></td><td>34.10 <span class='delta down-strong'>-1.96%</span></td><td>34.95 <span class='delta down-strong'>-2.29%</span></td><td>37.20 <span class='delta down-strong'>-2.14%</span></td><td>28.05 <span class='delta down-strong'>-1.53%</span></td><td>23.95 <span class='delta down-mild'>-0.37%</span></td><td>22.46 <span class='delta down-mild'>-0.18%</span></td></tr>
<tr><td class='hub'>THE</td><td>46.74 <span class='delta down-strong'>-1.99%</span></td><td>47.10 <span class='delta down-strong'>-1.84%</span></td><td>46.69 <span class='delta down-strong'>-1.90%</span></td><td>36.30 <span class='delta down-strong'>-1.84%</span></td><td>36.49 <span class='delta down-strong'>-2.26%</span></td><td>39.04 <span class='delta down-strong'>-2.07%</span></td><td>29.94 <span class='delta down-strong'>-1.51%</span></td><td>25.82 <span class='delta down-mild'>-0.35%</span></td><td>24.36 <span class='delta down-mild'>-0.16%</span></td></tr>
<tr><td class='hub'>CEGH</td><td>47.85 <span class='delta down-strong'>-2.10%</span></td><td>48.20 <span class='delta down-strong'>-1.87%</span></td><td>47.66 <span class='delta down-strong'>-1.94%</span></td><td>37.40 <span class='delta down-strong'>-1.79%</span></td><td>38.09 <span class='delta down-strong'>-1.98%</span></td><td>40.36 <span class='delta down-strong'>-1.94%</span></td><td>31.39 <span class='delta down-strong'>-1.37%</span></td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>SK VTP</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>HU MGP</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>UA</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>PSV</td><td>48.40 <span class='delta down-strong'>-2.08%</span></td><td>46.63 <span class='delta down-strong'>-1.97%</span></td><td>46.05 <span class='delta down-strong'>-2.06%</span></td><td class='dash'>—</td><td>36.88 <span class='delta down-strong'>-2.18%</span></td><td>38.78 <span class='delta down-strong'>-2.11%</span></td><td>29.55 <span class='delta down-strong'>-1.70%</span></td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>NBP</td><td>44.04 <span class='delta down-strong'>-1.97%</span></td><td>45.10 <span class='delta down-strong'>-1.95%</span></td><td>45.04 <span class='delta down-strong'>-1.78%</span></td><td>33.62 <span class='delta down-strong'>-2.19%</span></td><td>33.47 <span class='delta down-strong'>-2.49%</span></td><td>36.30 <span class='delta down-strong'>-2.15%</span></td><td>27.35 <span class='delta down-strong'>-3.19%</span></td><td>24.21 <span class='delta down-strong'>-2.90%</span></td><td class='dash'>—</td></tr>
<tr><td class='hub'>PEG</td><td>45.24 <span class='delta down-strong'>-2.01%</span></td><td>44.26 <span class='delta down-strong'>-1.94%</span></td><td>43.77 <span class='delta down-strong'>-2.00%</span></td><td>33.27 <span class='delta down-strong'>-1.93%</span></td><td>34.32 <span class='delta down-strong'>-2.26%</span></td><td>36.41 <span class='delta down-strong'>-2.14%</span></td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>ZTP</td><td>45.32 <span class='delta down-strong'>-1.90%</span></td><td>44.85 <span class='delta down-strong'>-1.58%</span></td><td>44.55 <span class='delta down-strong'>-1.88%</span></td><td>33.75 <span class='delta down-strong'>-2.05%</span></td><td>34.37 <span class='delta down-strong'>-2.40%</span></td><td>36.70 <span class='delta down-strong'>-2.26%</span></td><td>27.71 <span class='delta down-strong'>-1.56%</span></td><td>23.85 <span class='delta down-mild'>-0.38%</span></td><td class='dash'>—</td></tr>
</tbody></table></div>
<div class="gm-charts">
<figure><img src="{{ "/assets/reports/chart-season-opro9t2.png" | relative_url }}" alt="Forward Season Curve" /><figcaption>Forward Season Curve</figcaption></figure>
<figure><img src="{{ "/assets/reports/chart-ycurve-opro9t2.png" | relative_url }}" alt="Cal-Year Forward Curve" /><figcaption>Cal-Year Forward Curve</figcaption></figure>
<figure><img src="{{ "/assets/reports/chart-yhist-opro9t2.png" | relative_url }}" alt="Cal-Year Forward — History" /><figcaption>Cal-Year Forward — History</figcaption></figure>
</div>
  </div>
  <div class='gm-section'>
    <h2>Spreads</h2>
<div class="gm-charts">
<figure><img src="{{ "/assets/reports/chart-sw-opro9t2.png" | relative_url }}" alt="Summer / Winter Spread" /><figcaption>Summer / Winter Spread</figcaption></figure>
<figure><img src="{{ "/assets/reports/chart-cegh-ttf-opro9t2.png" | relative_url }}" alt="CEGH – TTF DA Spread" /><figcaption>CEGH – TTF DA Spread</figcaption></figure>
<figure><img src="{{ "/assets/reports/chart-sk-cegh-opro9t2.png" | relative_url }}" alt="SK VTP – CEGH DA Spread" /><figcaption>SK VTP – CEGH DA Spread</figcaption></figure>
</div>
  </div>
  <div class='gm-section'>
    <h2>Market News <span class='note'>2026-04-30</span></h2>
<div class='gm-news'>
<div class='card'><h3>Europe LNG: Des-TTF continues to narrow</h3><div class='meta'>2026-04-30 17:54</div><p>Europe LNG: Des-TTF continues to narrow London, 30 April (Argus) — Prices for LNG delivered to European destinations fell on Thursday despite narrower des discounts to the Dutch TTF hub.</p></div>
<div class='card'><h3>ENG: PSV day-ahead falls</h3><div class='meta'>2026-04-30 17:53</div><p>ENG: PSV day-ahead falls London, 30 April (Argus) — The PSV day-ahead price fell on Thursday, and public holiday related economic inactivity along with a boost in renewables output could weigh on Italian demand.</p></div>
<div class='card'><h3>Small-scale: LNG-MGO spread widens</h3><div class='meta'>2026-04-30 17:44</div><p>Small-scale: LNG-MGO spread widens London, 30 April (Argus) — Demand for spot LNG as a bunker fuel held steady on Thursday, compared with a week earlier, owing to the fuel&#x27;s widening spread to marine gasoil (MGO).</p></div>
<div class='card'><h3>German DUH calls for review of Mukran&#x27;s LNG permit</h3><div class='meta'>2026-04-30 16:00</div><p>German DUH calls for review of Mukran&#x27;s LNG permit London, 30 April (Argus) — German environmental aid association DUH has filed an objection to the renewed permit for the 5.2mn t/yr Mukran LNG terminal, which allows it to permanently run using onboard combustion engines for powe…</p></div>
<div class='card'><h3>Spanish Repsol’s 1Q gas output down</h3><div class='meta'>2026-04-30 14:37</div><p>Spanish Repsol&#x27;s 1Q gas output down London, 30 April (Argus) — Spanish integrated firm Repsol more than halved its gas production in January-March compared with a year earlier, according to its first-quarter results published today.</p></div>
<div class='card'><h3>Albania&#x27;s Albgaz signs 20-year LNG deal</h3><div class='meta'>2026-04-30 14:17</div><p>Albania&#x27;s Albgaz signs 20-year LNG deal London, 30 April (Argus) — Aktor LNG USA, subsidiary of Greek construction firm Aktor, is to supply Albanian stated-owned Albgaz with 1bn m³/yr of LNG over 20 years from 2030, the firms announced on Wednesday.</p></div>
<div class='card'><h3>Europe’s gas stocks deficit to 2025 narrow</h3><div class='meta'>2026-04-30 12:43</div><p>Europe&#x27;s gas stocks deficit to 2025 narrow London, 30 April (Argus) — European underground gas stocks&#x27; deficit to 2025 has narrowed, despite slower net injections, reflecting weaker consumption.</p></div>
<div class='card'><h3>ECB keeps Euro area interest rates unchanged</h3><div class='meta'>2026-04-30 12:41</div><p>The European Central Bank kept its leading interest rates in the Euro area at 2pc today, but said that the &quot;upside risks to inflation and the downside risks to growth have intensified&quot; as the war in the Middle East has led to a sharp increase in energy prices, pushing up inflatio…</p></div>
<div class='card'><h3>Bulgaria consults on 2026-27 gas year tariffs</h3><div class='meta'>2026-04-30 12:22</div><p>Bulgaria consults on 2026-27 gas year tariffs London, 30 April (Argus) — Bulgarian energy regulator EWRC has proposed largely unchanged gas transmission tariffs for the 2026-27 gas year, based on a consultation launched today.</p></div>
<div class='card'><h3>Europe weather: Departure from normal temperatures</h3><div class='meta'>2026-04-30 11:04</div><p>Europe weather: Departure from normal temperatures London, 30 April (Argus) — Today&#x27;s forecasts for temperature and precipitation in Europe.</p></div>
</div>
  </div>
  <div class='gm-foot'>
    Sources: Argus Media European Natural Gas API · © Argus Media — internal use only · private mirror · generated 2026-05-01 01:15 UTC
  </div>
</div>
