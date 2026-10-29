// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
function applyTheme() {
  const t = S.set.theme; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  document.documentElement.setAttribute('data-size', S.set.textSize || 'normal');
}
function netStatus() { const n = $('#net'); if (!n) return; const on = navigator.onLine !== false; n.textContent = on ? 'Online' : 'Offline — all good'; n.classList.toggle('off', !on); }
async function boot() {
  await openDB(); await loadState(); applyTheme();
  $('nav.tabs').innerHTML = TABS.map(t => `<button data-tab="${t[0]}" aria-label="${t[2]}"><span class="i">${t[1]}</span>${t[2]}</button>`).join('');
  $$('nav.tabs button').forEach(b => b.onclick = () => go(b.dataset.tab));
  $('#gear').onclick = () => go('data'); $('#hdrSearch').onclick = () => go('search'); $('#hdrTitle').onclick = () => go('now');
  window.addEventListener('online', netStatus); window.addEventListener('offline', netStatus); netStatus();
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('tick')) { e.preventDefault(); e.target.click(); }
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); go('search'); }
  });
  // Ticks: tapping anywhere on the row toggles it, and a stray double event can't undo a tap.
  let lastTick = { el: null, t: 0 };
  document.addEventListener('click', e => {
    const tk = e.target.closest('.tick');
    if (tk) { const now = Date.now(); if (lastTick.el === tk && now - lastTick.t < 150) { e.stopImmediatePropagation(); e.preventDefault(); return; } lastTick = { el: tk, t: now }; return; }
    if (e.target.closest('a,button,input,select,textarea,label,summary,.btn')) return;
    const row = e.target.closest('li, .check'); if (!row) return;
    const t = row.querySelector(':scope > .tick'); if (t) t.click();
  }, true);
  ROUTE = location.hash.slice(1) || 'now';
  try { history.replaceState({ r: ROUTE }, '', '#' + ROUTE); } catch (e) {}
  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/localhost|127\.0\.0\.1/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => {});
  loadLayersData();
}
boot();
