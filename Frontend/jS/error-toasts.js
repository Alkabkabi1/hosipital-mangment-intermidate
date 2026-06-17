// Minimal toast + inline banner utilities (no framework)
(function(){
  const TOAST_TONES = {
    success: { bg: '#16a34a', fg: '#fff' },
    info:    { bg: '#2563eb', fg: '#fff' },
    warning: { bg: '#f59e0b', fg: '#111827' },
    error:   { bg: '#dc2626', fg: '#fff' }
  };

  function ensureContainers(){
    if (!document.getElementById('toast-container')){
      const s = document.createElement('style');
      s.id = 'toast-styles';
      s.textContent = `
        #toast-container { position: fixed; inset-inline-end: 16px; inset-block-start: 16px; z-index: 9999; display: grid; gap: 8px; }
        .toast { padding: 10px 14px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.15); font-size: 14px; direction: rtl; }
        .toast.fade { animation: toast-in .2s ease-out; }
        @keyframes toast-in { from { opacity:.0; transform: translateY(-6px) } to { opacity:1; transform: translateY(0) } }
        .sync-banner { position: sticky; inset-block-start: 0; padding: 10px 14px; border-radius: 8px; margin: 8px 0; font-size: 14px; direction: rtl; z-index: 99 }
        .sync-banner.info { background:#e0f2fe; color:#075985; }
        .sync-banner.warning { background:#fef3c7; color:#92400e; }
        .sync-banner.error { background:#fee2e2; color:#991b1b; }
        .sync-banner.success { background:#d1fae5; color:#065f46; }
        .sync-banner .btn { margin-inline-start: 10px; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(0,0,0,.08); cursor: pointer; background: #fff; }
        .sync-chip { font-size: 11px; padding: 2px 6px; border-radius: 8px; margin-inline-start: 6px }
        .sync-chip.pending { background:#fff7ed; color:#92400e }
        .sync-chip.failed  { background:#fee2e2; color:#991b1b }
      `;
      document.head.appendChild(s);

      const c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
  }

  function showToast(msg, tone){
    ensureContainers();
    const t = document.createElement('div');
    const palette = TOAST_TONES[tone] || TOAST_TONES.info;
    t.className = 'toast fade';
    t.style.background = palette.bg;
    t.style.color = palette.fg;
    t.textContent = msg;
    const ct = document.getElementById('toast-container');
    ct.appendChild(t);
    setTimeout(() => { t.remove(); }, tone === 'info' ? 3000 : 4000);
    return t;
  }

  function renderSyncBanner(id, message, opts){
    ensureContainers();
    const tone = (opts && opts.tone) || 'info';
    let b = document.getElementById(id);
    if (!b) {
      b = document.createElement('div');
      b.id = id;
      b.className = `sync-banner ${tone}`;
      // Try to attach near main form or content
      const form = document.querySelector('form') || document.body;
      form.prepend(b);
    } else {
      b.className = `sync-banner ${tone}`;
    }
    b.innerHTML = message;
    return b;
  }

  function hideSyncBanner(id){
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // Expose
  window.showSuccess = (m)=>showToast(m,'success');
  window.showInfo    = (m)=>showToast(m,'info');
  window.showWarning = (m)=>showToast(m,'warning');
  window.showError   = (m)=>showToast(m,'error');
  window.renderSyncBanner = renderSyncBanner;
  window.hideSyncBanner = hideSyncBanner;
})();

