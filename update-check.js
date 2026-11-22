// Checks whether a newer version of the app has been published and, if so, reloads once to get it.
(function () {
  function check() {
    fetch('version.txt?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.text() : null).then(v => {
      v = (v || '').trim();
      if (!v || v === window.APP_VERSION) return;
      let tried = null; try { tried = sessionStorage.getItem('ml.reloadedFor'); } catch (e) {}
      if (tried === v) return;                       // already tried once for this version: don't loop
      try { sessionStorage.setItem('ml.reloadedFor', v); } catch (e) {}
      if (window.isBusySaving && window.isBusySaving()) return;   // never reload with unsaved work
      location.reload();
    }).catch(() => {});
  }
  check();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
})();
