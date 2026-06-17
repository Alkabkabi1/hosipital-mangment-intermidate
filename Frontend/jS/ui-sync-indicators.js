// Lightweight global sync badge updater
// Usage: initSyncBadge('[data-sync-badge]')
(function(){
  function updateBadgeFor(el, status){
    if (!el) return;
    if (!status) { el.style.display = 'none'; return; }
    const { syncing = 0, failed = 0 } = status;
    if (failed > 0) {
      el.innerText = `⚠️ ${failed}`;
      el.style.display = '';
    } else if (syncing > 0) {
      el.innerText = `⏳ ${syncing}`;
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  }

  function getStatus(){
    try { return (window.getQueueStatus && window.getQueueStatus()) || { total:0, syncing:0, failed:0 }; }
    catch(_) { return { total:0, syncing:0, failed:0 }; }
  }

  function initSyncBadge(selector){
    const sel = selector || '[data-sync-badge]';
    const refresh = () => {
      const st = getStatus();
      document.querySelectorAll(sel).forEach(el => updateBadgeFor(el, st));
    };

    // Initial update
    setTimeout(refresh, 50);

    // Listen for relevant events
    ['storage','sync:updated','sync:failed','online','offline'].forEach(evt => {
      window.addEventListener(evt, () => setTimeout(refresh, 100));
    });

    // Poll as a fallback if events are missed
    setInterval(refresh, 1000);

    return { refresh };
  }

  // Expose globally
  window.initSyncBadge = initSyncBadge;
})();

