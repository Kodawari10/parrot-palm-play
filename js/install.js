/* Home Screen install. Hidden unless the browser offers it, or Safari on iOS needs the share sheet. */
(function () {
  'use strict';
  let deferred = null;
  const $ = s => document.querySelector(s);
  const isApp = () => {
    try { return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
    catch (e) { return false; }
  };
  const ua = () => navigator.userAgent || '';
  const isIOS = () => /iP(hone|od|ad)/.test(ua()) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isIOSSafari = () => isIOS() && /Safari/.test(ua()) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua());
  const mode = () => (isApp() ? 'app' : deferred ? 'prompt' : isIOSSafari() ? 'ios' : 'none');

  function refresh() {
    const btn = $('#btnInstall');
    const note = $('#installNote');
    if (!btn || !note) return;
    const m = mode();
    btn.hidden = note.hidden = (m === 'app' || m === 'none');
    btn.dataset.mode = m;
  }

  window.addEventListener('beforeinstallprompt', ev => {
    ev.preventDefault();
    deferred = ev;
    refresh();
  });
  window.addEventListener('appinstalled', () => { deferred = null; refresh(); });

  function init() {
    const btn = $('#btnInstall');
    if (!btn || !window.PP_GAME) return;
    btn.addEventListener('click', async () => {
      const m = mode();
      if (m === 'ios') { window.PP_GAME.ui.closeModal('menu'); window.PP_GAME.ui.openModal('installHelp'); return; }
      if (m !== 'prompt' || !deferred) { refresh(); return; }
      const ev = deferred;
      deferred = null;
      window.PP_GAME.ui.closeModal('menu');
      try { ev.prompt(); await ev.userChoice; } catch (e) { /* ignore */ }
      refresh();
    });
    refresh();
  }

  if (window.PP_GAME) init();
  else document.addEventListener('pp:ready', init, { once: true });
})();
