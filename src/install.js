// ---------------------------------------------------------------------------
// INSTALL — getting Family Ready onto the home screen, on any phone or computer
// ---------------------------------------------------------------------------
let INSTALL_EVT = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); INSTALL_EVT = e; if (ROUTE === 'now' || ROUTE === 'data') render(); });
window.addEventListener('appinstalled', () => { INSTALL_EVT = null; try { S.manual.installed = Date.now(); persist(false); } catch (e) {} toast('Installed — find Family Ready on your home screen'); });
function isInstalled() { try { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches || navigator.standalone === true; } catch (e) { return false; } }
function deviceKind() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const br = /SamsungBrowser/.test(ua) ? 'samsung' : /EdgA?\//.test(ua) ? 'edge' : /CriOS/.test(ua) ? 'chrome' : /FxiOS|Firefox/.test(ua) ? 'firefox' : /Chrome\//.test(ua) ? 'chrome' : /Safari/.test(ua) ? 'safari' : 'other';
  return { ios, android, desktop: !ios && !android, br };
}
function installSteps() {
  const d = deviceKind();
  if (d.ios) {
    const share = '<b>Share</b> button (a square with an arrow pointing up ⬆️)';
    const steps = d.br === 'safari' ? [`Tap the ${share} at the bottom of the screen.`, 'Scroll down the list and tap <b>Add to Home Screen</b>.', 'Make sure <b>Open as Web App</b> is on (if shown), then tap <b>Add</b>.']
      : [`Tap the ${share} in the address bar at the top (on some versions it's under the <b>⋯</b> menu).`, 'Tap <b>Add to Home Screen</b>. (If it isn\'t there, open this page in <b>Safari</b> and do it from there.)', 'Tap <b>Add</b>.'];
    return { title: 'iPhone / iPad', steps, after: 'Open Family Ready from the new icon on the home screen — not from the browser.', note: '<b>Important on iPhone:</b> the home-screen app keeps its own copy of the data, separate from the browser. Install it first, then add the family details inside the app — or bring them across with ⚙️ Settings → <b>Restore</b> using a backup or family starter file.' };
  }
  if (d.android && d.br === 'samsung') return { title: 'Samsung Internet', steps: ['Tap the <b>☰</b> menu (bottom right).', 'Tap <b>Add page to</b> → <b>Home screen</b> (or <b>Install</b> if shown).', 'Tap <b>Add</b>.'], after: 'Open Family Ready from the new icon.' };
  if (d.android && d.br === 'firefox') return { title: 'Firefox on Android', steps: ['Tap the <b>⋮</b> menu.', 'Tap <b>Install</b> (or <b>Add to Home screen</b>).'], after: 'Open Family Ready from the new icon.' };
  if (d.android) return { title: 'Android (Chrome)', steps: ['Tap the <b>⋮</b> menu (three dots, top right).', 'Tap <b>Add to Home screen</b> — or <b>Install app</b> if you see it.', 'If asked, choose <b>Install</b>, then <b>Add</b>.'], after: 'Open Family Ready from the new icon on the home screen.' };
  return { title: 'Computer (Chrome or Edge)', steps: ['Click the <b>install icon</b> at the right-hand end of the address bar (a small screen with a down arrow).', 'Or open the <b>⋮</b> / <b>⋯</b> menu → <b>Cast, save and share</b> → <b>Install page as app</b> (Edge: <b>Apps</b> → <b>Install this site as an app</b>).', 'Click <b>Install</b>.'], after: 'Family Ready opens in its own window and gets a desktop / Start menu icon. Safari on Mac: File → <b>Add to Dock</b>.' };
}
async function doInstall() {
  if (!INSTALL_EVT) { showInstall(); return; }
  const e = INSTALL_EVT; INSTALL_EVT = null;
  try { e.prompt(); const r = await e.userChoice; if (r && r.outcome === 'accepted') toast('Installing…'); } catch (x) { showInstall(); }
  render();
}
function shareLink() {
  const url = location.href.split('#')[0].split('?')[0];
  if (navigator.share) navigator.share({ title: 'Family Ready', text: 'Our family emergency plan — open this link and add it to your home screen:', url }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('Link copied — paste it into a text or email')).catch(() => toast(url, 8000));
  else toast(url, 8000);
}
function showInstall() {
  if (isInstalled()) { modal(`<h2>✓ Family Ready is installed</h2><p>You're using the installed app. It works with no internet.</p><p class="small muted">To put it on another phone, send them the link:</p><div class="row"><button class="btn primary" id="inShare">📤 Send the link</button></div>`, el => { $('#inShare', el).onclick = shareLink; }); return; }
  const s = installSteps();
  modal(`<div style="font-size:2rem">📲</div><h2>Put Family Ready on your home screen</h2>
   <p>Then it opens like an app and <b>works with no internet</b>. It's free and takes 10 seconds — nothing is downloaded from an app store.</p>
   ${INSTALL_EVT ? `<button class="btn primary" id="inGo" style="width:100%;font-size:1.05rem;padding:12px">📲 Install Family Ready</button><p class="small muted" style="margin-top:10px">Or do it by hand:</p>` : ''}
   <h3>${esc(s.title)}</h3><ol class="steps" style="padding-left:0">${s.steps.map(t => `<li><span class="txt">${t}</span></li>`).join('')}</ol>
   <p class="small">${s.after}</p>${s.note ? `<div class="note small">${s.note}</div>` : ''}
   <details class="small" style="margin-top:10px"><summary>Other phones and computers</summary>
    <p><b>iPhone (Safari):</b> Share ⬆️ → Add to Home Screen → Add.<br><b>iPhone (Chrome):</b> Share ⬆️ in the address bar → Add to Home Screen.<br><b>Android (Chrome):</b> ⋮ → Add to Home screen / Install app.<br><b>Samsung Internet:</b> ☰ → Add page to → Home screen.<br><b>Computer (Chrome/Edge):</b> install icon in the address bar, or ⋮ → Cast, save and share → Install page as app.</p>
    <p>Don't see the option? Make sure the address starts with <b>https://</b> and you're not in a private / incognito tab. In apps like Facebook, Messenger or Gmail, tap <b>⋮ → Open in browser</b> first.</p></details>
   <div class="row" style="margin-top:12px"><button class="btn" id="inShare">📤 Send the link to the family</button></div>`, el => {
    const g = $('#inGo', el); if (g) g.onclick = () => { $$('.modal-bg').forEach(m => m.remove()); doInstall(); };
    $('#inShare', el).onclick = shareLink;
  });
}
// the banner on the Now page
function installBanner() {
  if (isInstalled() || (S.manual.installHide && Date.now() - S.manual.installHide < 14 * 864e5)) return '';
  return `<div class="installbar"><span style="font-size:1.6rem">📲</span><div class="grow"><b>Add Family Ready to your home screen</b><div class="small" style="opacity:.9">So it opens like an app and works with no internet.</div></div><button class="btn sm primary" id="inBar">${INSTALL_EVT ? 'Install' : 'Show me how'}</button><button class="btn sm ghost" id="inHide" style="color:#fff" aria-label="Not now">✕</button></div>`;
}
function wireInstallBanner(main) {
  const b = $('#inBar', main); if (b) b.onclick = () => (INSTALL_EVT ? doInstall() : showInstall());
  const h = $('#inHide', main); if (h) h.onclick = () => { S.manual.installHide = Date.now(); persist(false); render(); };
}
