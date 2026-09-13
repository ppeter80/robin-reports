// Weekwell — prihlásenie (Google + e-mail magic link) a onboarding so súhlasom. Spec kap. 12.1, rozhodnutie 13.
// Vystavuje window.WW_AUTH.start() → resolve({store}) keď je používateľ prihlásený a má súhlas.
(function () {
  const C = window.WW_CONFIG;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lang = () => ((navigator.language || 'sk').toLowerCase().startsWith('sk') ? 'sk' : (navigator.language || '').toLowerCase().startsWith('cs') ? 'sk' : 'en');
  function screen(html) { document.querySelector('#main').innerHTML = html; document.querySelector('nav.tabs').style.display = 'none'; }
  function loginHtml(msg) {
    window.WW_STATE = window.WW_STATE || { lang: lang() };
    return `<div class="card center" style="margin-top:40px"><div style="font-size:44px">🌱</div><div class="h2" style="font-size:22px">${t('onboarding_title')}</div><div class="muted mb">${t('login_sub')}</div>
      <button class="primary" style="width:100%;padding:12px;font-size:16px" data-google="1">${t('login_google')}</button>
      <div class="muted mt small">${t('login_or')}</div>
      <input class="mt" type="email" inputmode="email" autocomplete="email" data-email placeholder="${t('login_email_ph')}">
      <button class="mt" style="width:100%" data-magic="1">${t('login_magic')}</button>
      ${msg ? `<div class="mt small" style="color:var(--acc)">${esc(msg)}</div>` : ''}
      <div class="muted small mt">${t('install_ios')}<br>${t('install_android')}</div><div class="muted" style="font-size:10px;margin-top:8px">v${C.version}</div></div>`;
  }
  function consentHtml(name) {
    return `<div class="card" style="margin-top:30px"><div class="h2">${t('onboarding_title')}, ${esc(name)} 👋</div><p class="small">${t('consent_intro')}</p>
      <label class="row" style="margin:10px 0"><input type="checkbox" style="width:auto" data-consent> <span class="small">${t('consent')}</span></label>
      <label class="row" style="margin:10px 0"><input type="checkbox" style="width:auto" data-age> <span class="small">${t('consent_age')}</span></label>
      <button class="primary mt" style="width:100%" data-go="1" disabled>${t('continue')}</button></div>`;
  }
  async function start() {
    if (C.stub) { await WW_STORE.init(); return { store: WW_STORE }; }
    if (!window.supabase) throw new Error('supabase-js not loaded');
    // lock: v Safari/PWA vie navigator.locks zablokovať getSession() natrvalo → bez zámku (jedna karta, jeden používateľ)
    const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey, { auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true, lock: async (_name, _timeout, fn) => await fn() } });
    window.WW_SB = sb;
    // magic-link / OAuth návrat: supabase-js si session vyberie z URL sám; watchdog – ak sa do 6 s nič nestane, ukáž login
    const watchdog = setTimeout(() => { if (!document.querySelector('[data-google]') && !window.WW_STORE_SUPABASE.state) screen(loginHtml(t('login_slow'))); }, 6000);
    let session = null;
    try { const r = await Promise.race([sb.auth.getSession(), new Promise((res) => setTimeout(() => res({ data: { session: null }, timeout: true }), 5000))]); session = r.data.session; } catch (e) { console.warn('getSession', e); }
    clearTimeout(watchdog);
    if (!session) {
      await new Promise((resolve) => {
        if (!document.querySelector('[data-google]')) screen(loginHtml(''));
        document.querySelector('#main').addEventListener('click', async (e) => {
          if (e.target.closest('[data-google]')) { await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0].split('?')[0] } }); }
          if (e.target.closest('[data-magic]')) { const em = document.querySelector('[data-email]').value.trim(); if (!em) return; const { error } = await sb.auth.signInWithOtp({ email: em, options: { emailRedirectTo: location.href.split('#')[0].split('?')[0] } }); screen(loginHtml(error ? error.message : t('login_sent'))); }
        });
        sb.auth.onAuthStateChange((_e, s) => { if (s) { session = s; resolve(); } });
      });
    }
    const store = window.WW_STORE_SUPABASE; window.WW_STORE = store;
    let state; for (let i = 0; i < 6; i++) { try { state = await store.init(sb, session.user); break; } catch (err) { await new Promise((r) => setTimeout(r, 800)); } } // trigger môže chvíľu trvať
    if (!state) { screen(`<div class="card">${t('err_profile')}</div>`); throw new Error('profile'); }
    // pripojenie cez invite link ?j=KÓD
    const j = new URLSearchParams(location.search).get('j');
    if (j) { try { await store.joinGroup(j); } catch (err) { console.warn(err); } history.replaceState(null, '', location.pathname + location.hash); }
    if (!state.consent) {
      await new Promise((resolve) => {
        screen(consentHtml(state.group.members.find((m) => m.id === state.me).name));
        const main = document.querySelector('#main');
        main.addEventListener('change', () => { main.querySelector('[data-go]').disabled = !(main.querySelector('[data-consent]').checked && main.querySelector('[data-age]').checked); });
        main.addEventListener('click', async (e) => { if (e.target.closest('[data-go]') && !e.target.closest('[data-go]').disabled) { await store.updateProfile({ consent: true }); resolve(); } });
      });
    }
    document.querySelector('nav.tabs').style.display = '';
    return { store };
  }
  window.WW_AUTH = { start };
})();
