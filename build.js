// Builds dist/: a single self-contained index.html (works from a file or a web host),
// plus the service worker, manifest and icons for installing on phones.
const fs = require('fs'), path = require('path');
const R = p => fs.readFileSync(path.join(__dirname, p), 'utf8');
const out = path.join(__dirname, 'dist'); fs.mkdirSync(out, { recursive: true });
const leafCss = R('node_modules/leaflet/dist/leaflet.css').replace(/url\(images\/[^)]+\)/g, 'none');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
let html = R('src/shell.html')
  .replace('/*LEAFLET_CSS*/', () => leafCss)
  .replace('/*APP_CSS*/', () => R('src/style.css'))
  .replace('/*PDFMAKE_JS*/', () => safe(R('node_modules/pdfmake/build/pdfmake.min.js')))
  .replace('/*VFS_JS*/', () => safe(R('node_modules/pdfmake/build/vfs_fonts.js')))
  .replace('/*XLSX_JS*/', () => safe(R('node_modules/xlsx/dist/xlsx.mini.min.js')))
  .replace('/*LEAFLET_JS*/', () => safe(R('node_modules/leaflet/dist/leaflet.js')))
  .replace('/*CONTENT_JS*/', () => safe(fs.readdirSync(path.join(__dirname, 'src/guides')).sort().map(f => R('src/guides/' + f)).join('\n') + '\n' + R('src/data.js')))
  .replace('/*APP_JS*/', () => safe(['core.js', 'views.js', 'map.js', 'excel.js', 'pack.js', 'boot.js'].map(f => R('src/' + f)).join('\n')));
fs.writeFileSync(path.join(out, 'index.html'), html);
const ver = 'ready-' + Date.now().toString(36);
fs.writeFileSync(path.join(out, 'sw.js'), `// Keeps the app working with no internet. Map tiles and data live in IndexedDB, not here.
const VERSION = '${ver}';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'family-ready-template.xlsx'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.mode === 'navigate' || /\\/(index\\.html)?$/.test(url.pathname)) {
    // newest copy when online and good; otherwise the saved copy. Error pages are never stored.
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put('index.html', cp)); return r; } return caches.match('index.html').then(c => c || r); })
      .catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => { if (n.ok) { const cp = n.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return n; })));
});
`);
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'Family Ready', short_name: 'Ready', start_url: './', scope: './', display: 'standalone',
  background_color: '#16324f', theme_color: '#16324f', description: 'Our family emergency plan — works offline.',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
}, null, 2));
console.log('built', (html.length / 1024).toFixed(0) + ' KB', ver);
