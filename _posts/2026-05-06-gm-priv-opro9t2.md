---
title: "Gas Market Dashboard — 2026-05-05 (private mirror)"
date: 2026-05-06 00:30:00 +0000
unlisted: true
---

<style>
/* Dark out the page chrome around the dashboard */
body{background:#0b1020 !important;}
body, .page-content, .wrapper, header.site-header, footer.site-footer{
  background:#0b1020 !important; color:#dde3ee !important;
}
header.site-header, footer.site-footer{border-color:#1a2030 !important;}
.site-title, .site-title:visited, .page-link, .page-link:visited{color:#dde3ee !important;}

.gm-wrap{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  color:#dde3ee;
  background:#0b1020;
  margin-left:calc(-50vw + 50%);
  margin-right:calc(-50vw + 50%);
  padding:0 28px 40px;
  max-width:1320px;
  margin-bottom:0;
}
.gm-wrap *{box-sizing:border-box;}
.gm-hero{
  border-bottom:2px solid #2a3550;
  padding:18px 0 14px;
  margin-bottom:22px;
}
.gm-hero h1{
  font-size:1.55rem;letter-spacing:-0.01em;margin:0 0 4px;
  color:#f0f4ff;font-weight:700;
}
.gm-hero .sub{font-size:0.88rem;color:#8a93a6;letter-spacing:0.02em;}
.gm-section{margin:30px 0 14px;}
.gm-section h2{
  font-size:0.78rem;text-transform:uppercase;letter-spacing:0.12em;
  color:#dde3ee;font-weight:700;
  border-left:3px solid #4ea5ff;padding-left:10px;margin:0 0 12px;
}
.gm-section .note{font-size:0.8rem;color:#8a93a6;margin-left:14px;font-weight:400;}

/* KPI tiles */
.gm-kpis{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
  gap:10px;margin-bottom:6px;
}
.gm-kpi{
  background:#161c2e;border:1px solid #232b40;border-radius:6px;
  padding:12px 14px;
}
.gm-kpi .label{font-size:0.72rem;color:#8a93a6;letter-spacing:0.04em;text-transform:uppercase;}
.gm-kpi .value{
  font-size:1.55rem;font-weight:600;color:#f0f4ff;
  font-variant-numeric:tabular-nums;letter-spacing:-0.01em;margin-top:2px;
}
.gm-kpi .unit{font-size:0.7rem;color:#5e6678;margin-left:3px;font-weight:400;}
.gm-kpi .delta{font-size:0.78rem;margin-top:3px;font-variant-numeric:tabular-nums;}

/* Price table */
.gm-tbl-wrap{
  background:#161c2e;border:1px solid #232b40;border-radius:6px;
  overflow-x:auto;margin-bottom:12px;
}
table.gm-prices{
  width:100%;border-collapse:collapse;font-size:0.86rem;
  font-variant-numeric:tabular-nums;
}
.gm-prices th{
  background:#1d2440;color:#aab3c6;font-weight:600;
  text-align:right;padding:9px 12px;
  border-bottom:1px solid #2a3252;
  font-size:0.74rem;text-transform:uppercase;letter-spacing:0.05em;
  white-space:nowrap;
}
.gm-prices th:first-child,.gm-prices td:first-child{text-align:left;}
.gm-prices td{
  padding:9px 12px;border-bottom:1px solid #1d2236;
  text-align:right;white-space:nowrap;color:#dde3ee;
}
.gm-prices tr:nth-child(even) td{background:#13182a;}
.gm-prices tr:last-child td{border-bottom:none;}
.gm-prices tr:hover td{background:#1c2440;}
.gm-prices td.hub{font-weight:700;color:#f0f4ff;}
.gm-prices td.dash{color:#3d4763;}
.gm-prices td .delta{font-size:0.74rem;margin-left:6px;font-weight:500;}

/* Delta colours — bright on dark */
.up-strong{color:#4ade80;}
.up-mild{color:#86efac;}
.flat{color:#8a93a6;}
.down-mild{color:#fca5a5;}
.down-strong{color:#f87171;}

/* Charts */
.gm-charts{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(440px,1fr));
  gap:14px;
}
.gm-charts figure{
  margin:0;background:#161c2e;border:1px solid #232b40;border-radius:6px;
  padding:6px;
}
.gm-charts img{width:100%;height:auto;display:block;border-radius:3px;}
.gm-charts figcaption{
  text-align:center;font-size:0.8rem;color:#aab3c6;
  padding:6px 0 4px;font-weight:500;
}

/* News cards */
.gm-news{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:12px;
}
.gm-news .card{
  background:#161c2e;border:1px solid #232b40;border-radius:6px;
  padding:14px 16px;
}
.gm-news .card h3{
  font-size:0.95rem;color:#f0f4ff;font-weight:600;
  margin:0 0 4px;line-height:1.3;
}
.gm-news .card .meta{
  font-size:0.72rem;color:#5e6678;letter-spacing:0.04em;
  text-transform:uppercase;margin-bottom:8px;
}
.gm-news .card p{
  font-size:0.86rem;color:#c2cad9;line-height:1.45;margin:0;
}

.gm-foot{
  font-size:0.72rem;color:#5e6678;margin-top:30px;
  border-top:1px solid #232b40;padding-top:10px;
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
    <div class='sub'>Tue 05 May 2026 · day-ahead, front month and forward curves · prices in EUR/MWh</div>
  </div>
  <div class='gm-section'>
    <h2>Key indicators <span class='note'>day-on-day change vs prior trading day</span></h2>
<div class='gm-kpis'><div class='gm-kpi'><div class='label'>TTF · DA</div><div class='value'>48.06 <span class='unit'>EUR/MWh</span></div><div><span class='delta up-strong'>▲ +4.13%</span></div></div><div class='gm-kpi'><div class='label'>CEGH · DA</div><div class='value'>48.84 <span class='unit'>EUR/MWh</span></div><div><span class='delta up-strong'>▲ +3.50%</span></div></div><div class='gm-kpi'><div class='label'>SK VTP · DA</div><div class='value'>49.50 <span class='unit'>EUR/MWh</span></div><div><span class='delta up-strong'>▲ +5.71%</span></div></div><div class='gm-kpi'><div class='label'>THE · DA</div><div class='value'>48.37 <span class='unit'>EUR/MWh</span></div><div><span class='delta up-strong'>▲ +3.73%</span></div></div><div class='gm-kpi'><div class='label'>PSV · DA</div><div class='value'>48.49 <span class='unit'>EUR/MWh</span></div><div><span class='delta up-strong'>▲ +7.69%</span></div></div><div class='gm-kpi'><div class='label'>CEGH – TTF · DA spread</div><div class='value'>+0.78 <span class='unit'>EUR/MWh</span></div><div class='delta'>&nbsp;</div></div></div>
  </div>
  <div class='gm-section'>
    <h2>Spot &amp; Front Month</h2>
<div class="gm-tbl-wrap"><table class="gm-prices">
<thead><tr><th>Hub</th><th>Day-Ahead</th><th>Δ DA</th><th>Front Month</th><th>Δ FM</th></tr></thead><tbody>
<tr><td class='hub'>TTF</td><td>48.06</td><td><span class='delta up-strong'>▲ +4.13%</span></td><td>46.85</td><td><span class='delta up-strong'>▲ +3.71%</span></td></tr>
<tr><td class='hub'>THE</td><td>48.37</td><td><span class='delta up-strong'>▲ +3.73%</span></td><td>48.37</td><td><span class='delta up-strong'>▲ +5.15%</span></td></tr>
<tr><td class='hub'>CEGH</td><td>48.84</td><td><span class='delta up-strong'>▲ +3.50%</span></td><td>48.61</td><td><span class='delta up-strong'>▲ +3.01%</span></td></tr>
<tr><td class='hub'>SK VTP</td><td>49.50</td><td><span class='delta up-strong'>▲ +5.71%</span></td><td>49.55</td><td><span class='delta up-strong'>▲ +3.18%</span></td></tr>
<tr><td class='hub'>HU MGP</td><td>48.65</td><td><span class='delta up-strong'>▲ +5.84%</span></td><td>48.65</td><td><span class='delta up-strong'>▲ +3.24%</span></td></tr>
<tr><td class='hub'>UA</td><td>43.17</td><td><span class='delta up-mild'>▲ +0.89%</span></td><td>42.71</td><td><span class='delta up-mild'>▲ +0.71%</span></td></tr>
<tr><td class='hub'>PSV</td><td>48.49</td><td><span class='delta up-strong'>▲ +7.69%</span></td><td>47.71</td><td><span class='delta up-strong'>▲ +2.70%</span></td></tr>
<tr><td class='hub'>NBP</td><td>46.11</td><td><span class='delta up-strong'>▲ +4.91%</span></td><td>45.60</td><td><span class='delta up-strong'>▲ +3.47%</span></td></tr>
<tr><td class='hub'>PEG</td><td>46.77</td><td><span class='delta up-strong'>▲ +5.39%</span></td><td>46.24</td><td><span class='delta up-strong'>▲ +3.79%</span></td></tr>
<tr><td class='hub'>ZTP</td><td>47.38</td><td><span class='delta up-strong'>▲ +6.89%</span></td><td>46.47</td><td><span class='delta up-strong'>▲ +3.69%</span></td></tr>
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
<tr><td class='hub'>TTF</td><td>47.38 <span class='delta up-strong'>+3.45%</span></td><td>46.45 <span class='delta up-strong'>+3.33%</span></td><td>45.86 <span class='delta up-strong'>+3.15%</span></td><td>34.48 <span class='delta up-strong'>+2.01%</span></td><td>35.45 <span class='delta up-strong'>+2.32%</span></td><td>37.77 <span class='delta up-strong'>+2.43%</span></td><td>28.02 <span class='delta up-mild'>+0.52%</span></td><td>23.67 <span class='delta down-mild'>-0.44%</span></td><td>22.30 <span class='delta down-mild'>-0.36%</span></td></tr>
<tr><td class='hub'>THE</td><td>47.79 <span class='delta up-strong'>+3.50%</span></td><td>48.06 <span class='delta up-strong'>+3.17%</span></td><td>47.63 <span class='delta up-strong'>+3.02%</span></td><td>36.63 <span class='delta up-strong'>+1.74%</span></td><td>37.05 <span class='delta up-strong'>+2.33%</span></td><td>39.62 <span class='delta up-strong'>+2.34%</span></td><td>29.86 <span class='delta up-mild'>+0.27%</span></td><td>25.55 <span class='delta down-mild'>-0.41%</span></td><td>24.20 <span class='delta down-mild'>-0.33%</span></td></tr>
<tr><td class='hub'>CEGH</td><td>48.97 <span class='delta up-strong'>+3.36%</span></td><td>49.20 <span class='delta up-strong'>+3.13%</span></td><td>48.66 <span class='delta up-strong'>+3.07%</span></td><td>37.81 <span class='delta up-strong'>+1.94%</span></td><td>38.51 <span class='delta up-strong'>+1.88%</span></td><td>40.91 <span class='delta up-strong'>+2.17%</span></td><td>31.37 <span class='delta up-mild'>+0.50%</span></td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>SK VTP</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>HU MGP</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>UA</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>PSV</td><td>49.31 <span class='delta up-strong'>+3.01%</span></td><td>47.48 <span class='delta up-strong'>+2.92%</span></td><td>46.91 <span class='delta up-strong'>+2.85%</span></td><td class='dash'>—</td><td>37.24 <span class='delta up-strong'>+1.80%</span></td><td>39.27 <span class='delta up-strong'>+2.11%</span></td><td>29.52 <span class='delta up-mild'>+0.49%</span></td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>NBP</td><td>45.09 <span class='delta up-strong'>+3.65%</span></td><td>46.26 <span class='delta up-strong'>+3.84%</span></td><td>46.08 <span class='delta up-strong'>+3.66%</span></td><td>34.26 <span class='delta up-strong'>+3.40%</span></td><td>33.93 <span class='delta up-strong'>+3.28%</span></td><td>36.93 <span class='delta up-strong'>+3.41%</span></td><td>27.71 <span class='delta up-strong'>+2.43%</span></td><td>24.17 <span class='delta up-mild'>+0.82%</span></td><td class='dash'>—</td></tr>
<tr><td class='hub'>PEG</td><td>46.41 <span class='delta up-strong'>+3.66%</span></td><td>45.30 <span class='delta up-strong'>+3.41%</span></td><td>44.76 <span class='delta up-strong'>+3.31%</span></td><td>33.60 <span class='delta up-strong'>+1.99%</span></td><td>34.88 <span class='delta up-strong'>+2.51%</span></td><td>37.00 <span class='delta up-strong'>+2.55%</span></td><td class='dash'>—</td><td class='dash'>—</td><td class='dash'>—</td></tr>
<tr><td class='hub'>ZTP</td><td>46.44 <span class='delta up-strong'>+3.65%</span></td><td>45.85 <span class='delta up-strong'>+3.37%</span></td><td>45.50 <span class='delta up-strong'>+3.17%</span></td><td>34.13 <span class='delta up-strong'>+2.03%</span></td><td>34.95 <span class='delta up-strong'>+2.58%</span></td><td>37.27 <span class='delta up-strong'>+2.46%</span></td><td>27.69 <span class='delta up-mild'>+0.53%</span></td><td>23.57 <span class='delta down-mild'>-0.44%</span></td><td class='dash'>—</td></tr>
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
    <h2>Market News <span class='note'>2026-05-05</span></h2>
<div class='gm-news'>
<div class='card'><h3>ENG: PSV-THE day-ahead basis flips</h3><div class='meta'>2026-05-05 17:52</div><p>ENG: PSV-THE day-ahead basis flips London, 5 May (Argus) — The PSV day-ahead price flipped to a premium to the THE on Tuesday, but strong LNG sendout could limit Italian imports from northern hubs.</p></div>
<div class='card'><h3>Europe LNG: Des prices step higher</h3><div class='meta'>2026-05-05 17:29</div><p>Europe LNG: Des prices step higher London, 5 May (Argus) — Prices for LNG delivered to European destinations rose slightly on Tuesday, but cargo flows are still firmly pointed to Asia despite the start to the EU&#x27;s gas injection season and multi-year low storage levels.</p></div>
<div class='card'><h3>Poland to offer incremental gas capacity with Ukraine</h3><div class='meta'>2026-05-05 17:10</div><p>Polish gas transmission system operator Gaz-System plans to offer incremental capacity with Ukraine on 6 July.</p></div>
<div class='card'><h3>CEE 3Q gas capacity uptake muted</h3><div class='meta'>2026-05-05 16:51</div><p>CEE 3Q gas capacity uptake muted London, 5 May (Argus) — Demand for third-quarter gas transmission capacity in central and eastern Europe (CEE) was weak during Monday&#x27;s auctions, with limited volumes booked, mainly on routes towards Ukraine and Slovakia.</p></div>
<div class='card'><h3>Methane emission cuts could boost energy security: IEA</h3><div class='meta'>2026-05-05 16:14</div><p>Methane emission cuts could boost energy security: IEA London, 5 May (Argus) — Cutting methane leaks and routine flaring could unlock significant volumes of gas to alleviate pressure on a tight global LNG balance, according to the International Energy Agency&#x27;s (IEA) methane track…</p></div>
<div class='card'><h3>Romania begins works on Neptun Deep&#x27;s gas pipeline</h3><div class='meta'>2026-05-05 16:00</div><p>Romania begins works on Neptun Deep&#x27;s gas pipeline London, 5 May (Argus) — Romanian oil and gas firm OMV Petrom and Romanian state-controlled producer Romgaz have started works on the offshore pipeline that will deliver gas from the Neptun Deep block in the Black Sea to Romania&#x27;s…</p></div>
<div class='card'><h3>French gas storage injections surge</h3><div class='meta'>2026-05-05 15:52</div><p>French gas storage injections accelerated sharply last week because of reduced demand caused by warmer weather and a public holiday. 
 Suppliers net injected 633 GWh/d on 28 April-4 May, up from 481 GWh/d on 21-27 April.</p></div>
<div class='card'><h3>Germany to halt firm capacity at L-gas points by 2027</h3><div class='meta'>2026-05-05 15:20</div><p>Germany to halt firm capacity at L-gas points by 2027 London, 5 May (Argus) — German transmission system operators will stop offering firm capacity products at the TTF-THE low-calorific gas (L-gas) virtual interconnection point (VIP) and the Speicher Gronau-Epe L2 (Nuon) point be…</p></div>
<div class='card'><h3>Asia bears brunt of April’s global LNG import drop</h3><div class='meta'>2026-05-05 15:18</div><p>Asia bears brunt of April&#x27;s global LNG import drop London, 5 May (Argus) — Global LNG imports in April were down on the year by nearly 10pc, but the effect was concentrated in Asia, with the region taking on a net loss of nearly 3mn t, compared with 2025 levels.</p></div>
<div class='card'><h3>BlueNord&#x27;s Danish gas production recovers in April</h3><div class='meta'>2026-05-05 12:50</div><p>BlueNord&#x27;s Danish gas production recovers in April London, 5 May (Argus) — Danish gas production rose on the month in April, according to preliminary figures from oil and gas company BlueNord, which holds a 37pc stake in Denmark&#x27;s North Sea gas fields.</p></div>
</div>
  </div>
  <div class='gm-foot'>
    Sources: Argus Media European Natural Gas API · © Argus Media — internal use only · private mirror · generated 2026-05-06 12:07 UTC
  </div>
</div>
