// ---------------------------------------------------------------------------
// MAP
// ---------------------------------------------------------------------------
const LINZ_ATTR = 'Topo50 & aerials © <a href="https://www.linz.govt.nz/">Toitū Te Whenua LINZ</a> CC BY 4.0';
const SETS = {
  street: { vec: true, name: 'NZ street map', max: 15, kb: 60 },
  topo: { set: 'topo-raster', name: 'NZ Topo50 map', max: 17, kb: 22 },
  aerial: { set: 'aerial', name: 'Aerial photos', max: 19, kb: 38 },
  osm: { online: true, name: 'World street map (OpenStreetMap)', max: 19, url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
};
let KEYWARNED = false;
function linzKeyProblem() {
  if (KEYWARNED) return; KEYWARNED = true;
  sheet(`<h2>🔑 The LINZ map needs a free access key</h2>
   <p>LINZ didn't accept the built-in map key (it may have been changed). Maps you have already <b>saved</b> keep working. To fix it now, paste your own free key:</p>
   <ol class="steps" style="padding-left:0">
   <li><span class="txt">On this phone, open <b>basemaps.linz.govt.nz</b> in the browser.</span></li>
   <li><span class="txt">Tap the share/copy link button on that map (or copy the address bar) — the link contains <b>api=c…</b></span></li>
   <li><span class="txt">Paste the link in the box below and tap Save.</span></li></ol>
   <div class="row"><input type="text" id="lkQ" placeholder="Paste the LINZ link or key" style="flex:1"><button class="btn primary" id="lkQS">Save</button></div>
   <p class="small muted" style="margin-top:8px">A key from the website lasts 90 days. Meanwhile, <b>World street map (OpenStreetMap)</b> in Layers works online without a key. Please also use 🐞 Report a mistake (⚙️ → About) so the built-in key gets fixed.</p>`, el => {
    $('#lkQS', el).onclick = () => { const v = $('#lkQ', el).value.trim(); const m = v.match(/[?&]api=([A-Za-z0-9_-]+)/); const k = m ? m[1] : v; if (!k) return; S.set.linzKey = k; persist(); KEYWARNED = false; $('#sheet').innerHTML = ''; setBase(S.set.base); toast('Key saved — map reloading'); };
  });
}
const PT = { // point categories
  H: ['🏥', '#c62828', 'Hospitals'], U: ['🩺', '#e65100', 'Urgent care'], P: ['💊', '#2e7d32', 'Pharmacies'], F: ['🚒', '#b71c1c', 'Fire stations'],
  L: ['🚓', '#1565c0', 'Police'], M: ['🏛️', '#6d4c41', 'Marae'], A: ['❤️', '#ad1457', 'Defibrillators (AED)'], C: ['🏘️', '#546e7a', 'Community centres & halls'],
};
const MYPT = { layover: ['🏨', 'Place to stay overseas'], water: ['💧', 'Water source'], shelter: ['⛺', 'Shelter'], cache: ['📦', 'Supply cache'], danger: ['⚠️', 'Danger / avoid'], food: ['🍎', 'Food / fruit trees'], other: ['📍', 'Other'] };
const DEFAULT_CENTRE = [-36.87, 174.70];
let FOLLOW = false, MEACC = null, MEACCV = 0;
let MAP = null, BASE = null, LYR = {}, MEPOS = null, MEMARK = null, WATCH = null, PICK = null, MAPFOCUS = null, OSMDATA = null, TSUNAMI = null;
// Developer key issued by LINZ Basemaps for this app (Nov 2026). LINZ asked that caching stays under
// ~10 tiles/second and 250,000 tiles/day/user, and suggested refreshing saved maps about every 6 months.
const LINZ_KEY = 'd01m5g152dt1bf2a17xdcdkaxnh';
const linzKey = () => '?api=' + encodeURIComponent(S.set.linzKey || LINZ_KEY);
const TILE_RATE_MS = 125;          // at most 8 map pieces a second
const TILE_DAY_CAP = 100000;       // well under LINZ's 250,000 a day
let lastTileAt = 0;
async function tileGate() { const wait = lastTileAt + TILE_RATE_MS - Date.now(); lastTileAt = Math.max(Date.now(), lastTileAt + TILE_RATE_MS); if (wait > 0) await new Promise(r => setTimeout(r, wait)); }
function dayCount(add) { const d = new Date().toISOString().slice(0, 10); const m = S.meta.dl && S.meta.dl.d === d ? S.meta.dl : { d, n: 0 }; if (add) { m.n += add; S.meta.dl = m; } return m.n; }
const staleMaps = () => S.saved.maps.filter(m => daysSince(m.at) > 183);
const linzUrl = set => 'https://basemaps.linz.govt.nz/v1/tiles/' + set + '/WebMercatorQuad/{z}/{x}/{y}.webp' + linzKey();
const tileKey = (set, z, x, y) => set + '/' + z + '/' + x + '/' + y;
function makeBase(k) {
  const def = SETS[k] || SETS.topo;
  if (def.vec) return makeVector('street');
  // OpenStreetMap: online viewing only (their rules forbid saving it for offline use); the browser caches what you've looked at.
  if (def.online) return L.tileLayer(def.url, { maxZoom: 19, maxNativeZoom: def.max, minZoom: 4, attribution: def.attr, crossOrigin: false });
  // LINZ: saved pieces come from this phone; anything else is fetched and kept, so places you've looked at also work offline.
  const showBlob = (img, b, done) => { const u = URL.createObjectURL(b); img.onload = () => { URL.revokeObjectURL(u); done(null, img); }; img.onerror = () => done(new Error('bad tile'), img); img.src = u; };
  const Off = L.TileLayer.extend({
    createTile(coords, done) {
      const img = document.createElement('img'); img.alt = ''; img.setAttribute('role', 'presentation');
      const key = tileKey(def.set, coords.z, coords.x, coords.y); const url = this.getTileUrl(coords);
      const net = async (tries) => {
        if (navigator.onLine === false) return done(new Error('offline'), img);
        try {
          const r = await fetch(url, { mode: 'cors', credentials: 'omit' });
          if (r.ok) { const b = await r.blob(); idb.put('tiles', key, b).catch(() => {}); return showBlob(img, b, done); }
          if (r.status === 400 || r.status === 401 || r.status === 403) { const t = await r.text().catch(() => ''); if (/key/i.test(t) || r.status !== 400) linzKeyProblem(); return done(new Error('key'), img); }
          if ((r.status === 429 || r.status >= 500) && tries < 2) return setTimeout(() => net(tries + 1), 1500 * (tries + 1));
          done(new Error('http ' + r.status), img);
        } catch (e) { if (tries < 2) setTimeout(() => net(tries + 1), 1500 * (tries + 1)); else done(e, img); }
      };
      idb.get('tiles', key).then(b => b ? showBlob(img, b, done) : net(0)).catch(() => net(0));
      return img;
    },
  });
  return new Off(linzUrl(def.set), { maxZoom: 19, maxNativeZoom: def.max, minZoom: 4, attribution: LINZ_ATTR });
}
function teardownMap() {
  if (WATCH != null && navigator.geolocation) { navigator.geolocation.clearWatch(WATCH); WATCH = null; }
  FOLLOW = false;
  if (MAP) { try { MAP.remove(); } catch (e) {} MAP = null; LYR = {}; MEMARK = null; MEACC = null; BASE = null; LABELS = null; }
}
function dotIcon(emoji, colour, big) {
  return L.divIcon({ className: '', html: big ? `<div class="pin" style="background:${colour}"><span>${emoji}</span></div>` : `<div class="dot" style="background:${colour}">${emoji}</div>`, iconSize: big ? [30, 30] : [22, 22], iconAnchor: big ? [15, 30] : [11, 11], popupAnchor: big ? [0, -28] : [0, -10] });
}
function distKm(a, b, c, d) { const R = 6371, r = Math.PI / 180, x = (d - b) * r * Math.cos((a + c) / 2 * r), y = (c - a) * r; return Math.sqrt(x * x + y * y) * R; }
function bearing(a, b, c, d) { const r = Math.PI / 180, y = Math.sin((d - b) * r) * Math.cos(c * r), x = Math.cos(a * r) * Math.sin(c * r) - Math.sin(a * r) * Math.cos(c * r) * Math.cos((d - b) * r); const deg = (Math.atan2(y, x) / r + 360) % 360; return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8]; }
function fromHere(lat, lon) { const o = MEPOS || (S.household.homeLat ? [S.household.homeLat, S.household.homeLon] : null); if (!o) return ''; const km = distKm(o[0], o[1], lat, lon); return `${km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km'} ${bearing(o[0], o[1], lat, lon)} of ${MEPOS ? 'you' : 'home'}`; }
function facilityPoints() { return (OSMDATA && OSMDATA.pts && OSMDATA.pts.length) ? OSMDATA.pts : CORE_POINTS; }
function popupFor(p) {
  const [t, lat, lon, name, addr, phone, ed, hours, extra] = p; const c = PT[t] || PT.C;
  return `<b>${c[0]} ${esc(name || c[2].replace(/s$/, ''))}</b>${ed ? '<br><span class="pill bad">Emergency department</span>' : ''}${addr ? '<br>' + esc(addr) : ''}${hours ? '<br><span class="small">' + esc(hours) + '</span>' : ''}${extra ? '<br><span class="small">' + esc(extra) + '</span>' : ''}${phone ? `<br><a href="${telHref(phone)}">📞 ${esc(phone)}</a>` : ''}<br><span class="small muted">${fromHere(lat, lon)}</span>`;
}
function vMap(main, arg) {
  main.innerHTML = `<div id="mapwrap"><div id="map"></div>
   <div class="mapbar"><button class="btn sm" id="mLoc">📍 Me</button><button class="btn sm" id="mNear">🏥 Nearest help</button><button class="btn sm" id="mLay">🗂️ Layers</button><button class="btn sm" id="mSave">⬇️ Save maps</button><button class="btn sm" id="mAdd">➕ Add place</button><button class="btn sm" id="mAway">🌏 Overseas</button></div>
   <div id="sheet"></div></div>`;
  if (typeof L === 'undefined') { $('#map').innerHTML = '<div class="empty">Map library failed to load.</div>'; return; }
  const centre = MAPFOCUS ? MAPFOCUS.slice(0, 2) : S.household.homeLat ? [S.household.homeLat, S.household.homeLon] : DEFAULT_CENTRE;
  MAP = L.map('map', { zoomControl: false, attributionControl: true, tap: true, minZoom: 4, maxZoom: 19 }).setView(centre, MAPFOCUS ? MAPFOCUS[2] : 13);
  MAPFOCUS = null;
  const lp = MAP.createPane('labels'); lp.style.zIndex = 350; lp.style.pointerEvents = 'none';
  if (!SETS[S.set.base] || (SETS[S.set.base].online && navigator.onLine === false)) S.set.base = 'street';
  setBase(S.set.base);
  // any pan or zoom by the user stops following the blue dot
  MAP.on('dragstart', stopFollow); MAP.on('zoomstart', e => { if (!MAP._followZoom) stopFollow(); });
  L.control.zoom({ position: 'bottomright' }).addTo(MAP);
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(MAP);
  drawOverlays();
  $('#mLoc').onclick = locate;
  $('#mNear').onclick = showNearest;
  $('#mLay').onclick = showLayers;
  $('#mSave').onclick = showSave;
  $('#mAway').onclick = () => showAway();
  // LINZ maps only cover New Zealand — outside NZ switch to the street map automatically
  MAP.on('moveend', () => { if (!MAP || SETS[S.set.base].online) return; const c = MAP.getCenter(); if (!inNZ(c.lat, c.lng)) { setBase('osm'); toast('Outside New Zealand — showing the street map (needs internet). For offline maps overseas use Organic Maps — see Map → 🌏 Overseas.', 7000); } });
  $('#mAdd').onclick = () => startPick('Tap the map where the place is', (lat, lon) => addMyPoint(lat, lon), null, true);
  if (PICK) armPick();
  else if (arg === 'away') setTimeout(() => showAway(), 80);
  setTimeout(() => MAP && MAP.invalidateSize(), 60);
}
const inNZ = (la, lo) => la < -33.5 && la > -47.8 && ((lo > 165.5 && lo < 179.5) || lo < -175.8 && la < -43);
function mapsLink(lat, lon, name) {
  const n = encodeURIComponent(name || '');
  return /iPhone|iPad|Mac/.test(navigator.userAgent) ? `https://maps.apple.com/?ll=${lat},${lon}&q=${n || lat + ',' + lon}` : `geo:${lat},${lon}?q=${lat},${lon}(${n})`;
}
function showAway(reg) {
  reg = reg || S.set.awayReg || 'na'; S.set.awayReg = reg; persist(false);
  const cities = AWAY_CITIES.filter(c => c[0] === reg);
  const near = c => NZ_MISSIONS.filter(m => distKm(c[2], c[3], m[3], m[4]) < 60);
  const mine = S.points.filter(p => p.cat === 'layover');
  sheet(`<h2>🌏 Overseas — ${esc(AW())}</h2>
   <div class="row" style="margin-bottom:6px">${Object.entries(AWAY_REGION_NAMES).map(([k, v]) => `<button class="chip ${k === reg ? 'on' : ''}" data-reg="${k}" style="border:0;cursor:pointer">${v}</button>`).join('')}</div>
   <ul class="list">${cities.map((c, i) => `<li><div class="grow"><b>${esc(c[1])}</b>${near(c).map(m => `<div class="small muted">🇳🇿 ${esc(m[0])}</div>`).join('')}</div><button class="btn sm primary" data-city="${i}">Show</button></li>`).join('')}</ul>
   ${mine.length ? `<h3>🏨 Our places to stay</h3><ul class="list">${mine.map(p => `<li><div class="grow"><b>${esc(p.name)}</b>${p.note ? `<div class="small muted">${esc(p.note)}</div>` : ''}</div><button class="btn sm" data-fly="${p.lat},${p.lon}">Show</button><a class="btn sm" href="${mapsLink(p.lat, p.lon, p.name)}">Open in maps app</a></li>`).join('')}</ul>` : ''}
   <div class="note small" style="margin-top:10px"><b>No signal overseas?</b> This street map needs the internet. Before each trip, download the city in <b>Organic Maps</b> (free) — it works fully offline. <a href="#" data-go="g:away-maps">How to set it up →</a><br>Pin where you're staying with <b>➕ Add place → Place to stay overseas</b>, so it's in the family backup too.</div>
   <div class="row" style="margin-top:8px"><button class="btn sm" data-go="g:away-general">✈️ What to do overseas</button><button class="btn sm" id="awHome">🇳🇿 Back to NZ</button></div>`, el => {
    $$('[data-reg]', el).forEach(b => b.onclick = () => showAway(b.dataset.reg));
    $$('[data-city]', el).forEach(b => b.onclick = () => { const c = cities[+b.dataset.city]; if (!SETS[S.set.base].online) setBase('osm'); stopFollow(); MAP.setView([c[2], c[3]], 12); if (window.innerWidth < 900) $('#sheet').innerHTML = ''; });
    $$('[data-fly]', el).forEach(b => b.onclick = () => { const [a, c] = b.dataset.fly.split(',').map(Number); if (!SETS[S.set.base].online) setBase('osm'); stopFollow(); MAP.setView([a, c], 16); if (window.innerWidth < 900) $('#sheet').innerHTML = ''; });
    $('#awHome', el).onclick = () => { setBase('street'); MAP.setView(S.household.homeLat ? [S.household.homeLat, S.household.homeLon] : DEFAULT_CENTRE, 12); $('#sheet').innerHTML = ''; };
  });
}
let BASETOKEN = 0;
async function setBase(k) {
  if (!MAP) return; const t = ++BASETOKEN;
  if (!SETS[k]) k = 'street';
  if (SETS[k].vec && !glOK()) { toast('This device can\'t draw the street map — showing Topo50 instead'); k = 'topo'; }
  let lyr;
  try { lyr = await makeBase(k); }
  catch (e) {
    if (t !== BASETOKEN) return;
    if (e && e.code === 'key') linzKeyProblem();
    else toast(navigator.onLine === false ? 'The street map isn\'t saved on this phone yet — showing Topo50. Save it on Wi-Fi: ⬇️ Save maps.' : 'Street map didn\'t load — showing Topo50', 6000);
    k = 'topo'; lyr = makeBase(k);
  }
  if (t !== BASETOKEN || !MAP) return;
  if (BASE) MAP.removeLayer(BASE);
  BASE = lyr.addTo(MAP); S.set.base = k; persist(false);
  syncLabels();
}
async function loadLayersData() {
  if (!OSMDATA) { try { OSMDATA = await idb.get('kv', 'osm'); } catch (e) {} }
  if (!TSUNAMI) { try { TSUNAMI = await idb.get('kv', 'tsunami'); } catch (e) {} }
}
async function drawOverlays() {
  if (!MAP) return;
  await loadLayersData(); if (!MAP) return;
  Object.values(LYR).forEach(l => MAP.removeLayer(l)); LYR = {};
  const on = S.set.layers;
  if (TSUNAMI && TSUNAMI.gj && on.tsunami) {
    LYR.tsunami = L.geoJSON(TSUNAMI.gj, { interactive: true, style: f => ({ color: f.properties.ZONETYPE === 'Red' ? '#c62828' : '#f9a825', weight: 1, fillOpacity: f.properties.ZONETYPE === 'Red' ? .35 : .25 }),
      onEachFeature: (f, l) => l.bindPopup(f.properties.ZONETYPE === 'Red' ? '<b>Tsunami red zone</b><br>Shore and marine threat — stay out after ANY tsunami warning.' : '<b>Tsunami yellow zone</b><br>Land threat — <b>leave after a long or strong earthquake</b> or when told to evacuate.') }).addTo(MAP);
  }
  const groups = {};
  facilityPoints().forEach(p => { if (!on[p[0]]) return; (groups[p[0]] = groups[p[0]] || L.layerGroup()).addLayer(L.marker([p[1], p[2]], { icon: dotIcon(PT[p[0]][0], PT[p[0]][1]), title: p[3] || PT[p[0]][2] }).bindPopup(() => popupFor(p))); });
  Object.entries(groups).forEach(([k, g]) => { LYR['f' + k] = g.addTo(MAP); });
  if (on.missions !== 0) {
    const g = L.layerGroup();
    NZ_MISSIONS.forEach(m => g.addLayer(L.marker([m[3], m[4]], { icon: dotIcon('🇳🇿', '#ffffff', true), zIndexOffset: 800 }).bindPopup(`<b>${esc(m[0])}</b><br>${esc(m[1])}<br><a href="${telHref(m[2])}">📞 ${esc(m[2])}</a><br>NZ consular 24/7: <a href="tel:+6499202020">+64 99 20 20 20</a><br><a href="${mapsLink(m[3], m[4], m[0])}">Open in maps app</a><br><span class="small muted">Pin position approximate — check the address</span>`)));
    LYR.missions = g.addTo(MAP);
  }
  if (on.meet) {
    const g = L.layerGroup();
    S.meet.filter(m => m.lat).forEach(m => g.addLayer(L.marker([m.lat, m.lon], { icon: dotIcon('⭐', '#6a1b9a', true), zIndexOffset: 900 }).bindPopup(`<b>Meeting point ${esc(m.label)}</b><br>${esc(m.desc)}`)));
    if (S.household.homeLat) g.addLayer(L.marker([S.household.homeLat, S.household.homeLon], { icon: dotIcon('🏠', '#16324f', true), zIndexOffset: 1000 }).bindPopup('<b>Home</b>'));
    LYR.meet = g.addTo(MAP);
  }
  if (on.mine) {
    const g = L.layerGroup();
    S.points.forEach(p => { const c = MYPT[p.cat] || MYPT.other; g.addLayer(L.marker([p.lat, p.lon], { icon: dotIcon(c[0], '#00695c', true) }).bindPopup(() => { const d = document.createElement('div'); d.innerHTML = `<b>${c[0]} ${esc(p.name)}</b><br><span class="small">${esc(c[1])}</span>${p.note ? '<br>' + esc(p.note) : ''}<br><span class="small muted">${fromHere(p.lat, p.lon)}</span><br><a href="${mapsLink(p.lat, p.lon, p.name)}">Open in maps app</a> · <button class="btn sm" style="margin-top:6px">Edit</button>`; d.querySelector('button').onclick = () => editMyPoint(p); return d; })); });
    LYR.mine = g.addTo(MAP);
  }
  if (on.sources) {
    const g = L.layerGroup();
    S.sources.filter(s => s.lat).forEach(s => { const c = SOURCE_CATS.find(x => x[0] === s.cat) || SOURCE_CATS[SOURCE_CATS.length - 1]; g.addLayer(L.marker([s.lat, s.lon], { icon: dotIcon(c[1], '#ef6c00', true) }).bindPopup(`<b>${c[1]} ${esc(s.name)}</b>${s.supplies ? '<br>' + esc(s.supplies) : ''}${s.phone ? `<br><a href="${telHref(s.phone)}">📞 ${esc(s.phone)}</a>` : ''}`)); });
    LYR.sources = g.addTo(MAP);
  }
  if (MEPOS) placeMe();
}
function sheet(html, onMount) {
  const el = $('#sheet'); if (!el) return;
  el.innerHTML = `<div class="sheet"><button class="btn sm ghost x" id="shX" aria-label="Close">✕</button>${html}</div>`;
  $('#shX').onclick = () => { el.innerHTML = ''; };
  if (onMount) onMount(el.firstElementChild);
}
function placeMe() {
  if (!MAP || !MEPOS) return;
  if (!MEMARK) MEMARK = L.marker(MEPOS, { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), zIndexOffset: 2000, interactive: true }).addTo(MAP).bindPopup(() => 'You are here' + (MEACCV ? `<br><span class="small muted">accurate to about ${Math.round(MEACCV)} m</span>` : ''));
  else MEMARK.setLatLng(MEPOS);
  if (MEACCV) { if (!MEACC) MEACC = L.circle(MEPOS, { radius: MEACCV, color: '#1a73e8', weight: 1, fillOpacity: .08, interactive: false }).addTo(MAP); else MEACC.setLatLng(MEPOS).setRadius(MEACCV); }
}
function locBtn() { const b = $('#mLoc'); if (b) { b.textContent = FOLLOW ? '📍 Following' : '📍 Me'; b.classList.toggle('primary', FOLLOW); } }
function stopFollow() { if (FOLLOW) { FOLLOW = false; locBtn(); } }
function centreOnMe() { if (!MAP || !MEPOS) return; MAP._followZoom = true; MAP.setView(MEPOS, MAP.getZoom() < 14 ? 16 : MAP.getZoom()); setTimeout(() => { if (MAP) MAP._followZoom = false; }, 400); }
// Tap once: centre on you and follow. Move the map: it stops following and leaves you free. Tap again: back to you.
function locate() {
  if (!navigator.geolocation) { toast('Location is not available on this device'); return; }
  FOLLOW = true; locBtn();
  if (MEPOS) centreOnMe();
  if (WATCH != null) return;
  toast('Finding you… (GPS works without mobile signal)');
  WATCH = navigator.geolocation.watchPosition(p => {
    const had = !!MEPOS; MEPOS = [p.coords.latitude, p.coords.longitude]; MEACCV = p.coords.accuracy || 0; placeMe();
    if (FOLLOW && MAP) { if (!had) centreOnMe(); else MAP.panTo(MEPOS, { animate: true }); }
  }, e => { WATCH = null; FOLLOW = false; locBtn(); toast(e.code === 1 ? 'Location permission is off — allow it in your phone settings' : 'Could not get your location'); }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 });
}
function showNearest() {
  const o = MEPOS || (S.household.homeLat ? [S.household.homeLat, S.household.homeLon] : MAP ? [MAP.getCenter().lat, MAP.getCenter().lng] : DEFAULT_CENTRE);
  const from = MEPOS ? 'you' : S.household.homeLat ? 'home' : 'the map centre';
  const pts = facilityPoints();
  const sec = (title, filter, n) => {
    const near = pts.filter(filter).map(p => [p, distKm(o[0], o[1], p[1], p[2])]).sort((a, b) => a[1] - b[1]).slice(0, n);
    if (!near.length) return '';
    return `<h3>${title}</h3><ul class="list">${near.map(([p, d]) => `<li><div class="grow"><b>${esc(p[3] || PT[p[0]][2])}</b><div class="small muted">${d < 1 ? Math.round(d * 1000) + ' m' : d.toFixed(1) + ' km'} ${bearing(o[0], o[1], p[1], p[2])}${p[4] ? ' · ' + esc(p[4]) : ''}</div></div>${p[5] ? `<a class="btn sm" href="${telHref(p[5])}">📞</a>` : ''}<button class="btn sm" data-fly="${p[1]},${p[2]}">Show</button></li>`).join('')}</ul>`;
  };
  sheet(`<h2>Nearest help to ${from}</h2>${!OSMDATA ? '<p class="small note">Showing the main hospitals and clinics only. Download the full emergency map data in <a href="#" data-go="data">Settings</a> for pharmacies, AEDs, fire, police and marae.</p>' : ''}
   ${sec('🏥 Hospital emergency departments', p => p[0] === 'H' && p[6], 3)}${sec('🩺 Urgent care / A&M', p => p[0] === 'U', 3)}${sec('❤️ Defibrillators (AED)', p => p[0] === 'A', 3)}${sec('💊 Pharmacies', p => p[0] === 'P', 3)}${sec('🚒 Fire stations', p => p[0] === 'F', 2)}${sec('🚓 Police', p => p[0] === 'L', 2)}${sec('🏛️ Marae', p => p[0] === 'M', 2)}
   ${S.meet.some(m => m.lat) ? `<h3>⭐ Our meeting points</h3><ul class="list">${S.meet.filter(m => m.lat).map(m => `<li><div class="grow"><b>${esc(m.label)}</b><div class="small muted">${distKm(o[0], o[1], m.lat, m.lon).toFixed(1)} km ${bearing(o[0], o[1], m.lat, m.lon)}</div></div><button class="btn sm" data-fly="${m.lat},${m.lon}">Show</button></li>`).join('')}</ul>` : ''}`,
  el => $$('[data-fly]', el).forEach(b => b.onclick = () => { const [a, c] = b.dataset.fly.split(',').map(Number); MAP.setView([a, c], 16); if (window.innerWidth < 900) $('#sheet').innerHTML = ''; }));
}
function showLayers() {
  const on = S.set.layers;
  const isOn = k => k === 'labels' ? S.set.labels !== 0 : !!on[k];
  const row = (k, label) => `<li><span class="tick ${isOn(k) ? 'on' : ''}" data-ly="${k}" role="checkbox" aria-checked="${isOn(k)}" tabindex="0">${isOn(k) ? '✓' : ''}</span><span class="grow">${label}</span></li>`;
  sheet(`<h2>Map layers</h2><h3>Background map</h3><div class="row">${Object.entries(SETS).map(([k, s]) => `<button class="btn sm ${S.set.base === k ? 'primary' : ''}" data-base="${k}">${s.name}</button>`).join('')}</div>
   <p class="small muted" style="margin-top:6px"><b>NZ street map</b> — streets, names, buildings and tracks; the easiest to read. <b>Topo50</b> — hills, rivers and bush tracks. <b>Aerial photos</b> — what it really looks like. All three are from LINZ and can be saved for no signal (⬇️ Save maps). <b>World street map</b> is for overseas and needs the internet.</p>
   ${S.set.base === 'aerial' ? `<ul class="list">${row('labels', '🏷️ Show names on the photos (streets, places)')}</ul>` : ''}
   <h3>Show</h3><ul class="list">${row('meet', '⭐ Home & meeting points')}${row('mine', '📍 Our places')}${row('sources', '🤝 Suppliers & contacts')}${row('missions', '🇳🇿 NZ embassies & consulates overseas')}${row('tsunami', '🌊 Tsunami evacuation zones' + (TSUNAMI ? '' : ' <span class="pill warn">not downloaded</span>'))}
   ${Object.entries(PT).map(([k, v]) => row(k, v[0] + ' ' + v[2] + (!OSMDATA && !['H', 'U', 'P', 'F', 'C'].includes(k) ? ' <span class="pill warn">not downloaded</span>' : ''))).join('')}</ul>
   ${!OSMDATA || !TSUNAMI ? `<button class="btn primary" data-go="data">⬇️ Download emergency map data</button>` : `<p class="small muted">Map data downloaded ${fmtDate(S.meta.layersAt)}. Points © OpenStreetMap contributors (ODbL); tsunami zones © Auckland Council.</p>`}`,
  el => {
    $$('[data-base]', el).forEach(b => b.onclick = () => { if (SETS[b.dataset.base].online && navigator.onLine === false) toast('Street map needs the internet — showing what this phone has already viewed'); setBase(b.dataset.base); showLayers(); });
    $$('[data-ly]', el).forEach(t => t.onclick = () => { if (t.dataset.ly === 'labels') { S.set.labels = S.set.labels === 0 ? 1 : 0; persist(false); syncLabels(); showLayers(); return; } on[t.dataset.ly] = on[t.dataset.ly] ? 0 : 1; persist(false); drawOverlays(); showLayers(); });
  });
}
function startPick(msg, cb, at, stayOnMap) {
  PICK = { msg, cb, at, stayOnMap };
  if (ROUTE !== 'map') { if (at) MAPFOCUS = [at[0], at[1], 16]; go('map'); } else armPick();
}
function armPick() {
  if (!MAP || !PICK) return;
  const p = PICK;
  sheet(`<h3 style="margin-top:0">${esc(p.msg)}</h3><p class="small muted">Zoom in for accuracy. ${MEPOS ? '' : ''}</p><div class="row">${MEPOS ? '<button class="btn sm" id="pkMe">Use my location</button>' : ''}<button class="btn sm ghost" id="pkX">Cancel</button></div>`, el => {
    $('#pkX', el).onclick = () => { PICK = null; $('#sheet').innerHTML = ''; MAP.off('click', handler); };
    if ($('#pkMe', el)) $('#pkMe', el).onclick = () => finish(MEPOS[0], MEPOS[1]);
  });
  $('#map').style.cursor = 'crosshair';
  const handler = e => finish(e.latlng.lat, e.latlng.lng);
  function finish(lat, lon) { MAP.off('click', handler); $('#map').style.cursor = ''; PICK = null; $('#sheet').innerHTML = ''; p.cb(+lat.toFixed(6), +lon.toFixed(6)); }
  MAP.once('click', handler);
}
function addMyPoint(lat, lon) { editMyPoint({ id: uid(), lat, lon, cat: 'water', name: '', note: '' }, true); }
function editMyPoint(p, isNew) {
  formModal(isNew ? 'Add a place' : 'Edit place', [{ k: 'name', label: 'Name' }, { k: 'cat', label: 'Type', type: 'select', options: Object.entries(MYPT).map(([k, v]) => [k, v[0] + ' ' + v[1]]) }, { k: 'note', label: 'Notes', type: 'textarea' }], p, v => {
    if (!v.name) { toast('Add a name'); return false; } Object.assign(p, v); if (isNew) S.points.push(p); persist(); drawOverlays();
  }, { onDelete: isNew ? null : () => { S.points = S.points.filter(x => x !== p); persist(); drawOverlays(); } });
}

// ---- saving maps for offline use ----
function lon2x(lon, z) { return Math.floor((lon + 180) / 360 * 2 ** z); }
function lat2y(lat, z) { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z); }
function tilesFor(b, z0, z1) { // b=[s,w,n,e]
  const out = [];
  for (let z = z0; z <= z1; z++) { const x0 = lon2x(b[1], z), x1 = lon2x(b[3], z), y0 = lat2y(b[2], z), y1 = lat2y(b[0], z); for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push([z, x, y]); }
  return out;
}
function countTiles(b, z0, z1) { let n = 0; for (let z = z0; z <= z1; z++) n += (lon2x(b[3], z) - lon2x(b[1], z) + 1) * (lat2y(b[0], z) - lat2y(b[2], z) + 1); return n; }
function boxAround(lat, lon, km) { const dLat = km / 111, dLon = km / (111 * Math.cos(lat * Math.PI / 180)); return [lat - dLat, lon - dLon, lat + dLat, lon + dLon]; }
function presets() {
  const home = S.household.homeLat ? [S.household.homeLat, S.household.homeLon] : DEFAULT_CENTRE;
  const v = MAP ? MAP.getBounds() : null;
  return [
    ['home', '🏠 Around home — street detail', S.household.homeLat ? '6 km around home' : 'Set home first (Our plan) — otherwise central Auckland', boxAround(home[0], home[1], 6), 10, 17],
    ['wide', '🌳 Around home — wider area', S.household.homeLat ? '25 km around home' : 'Set home first (Our plan) — otherwise central Auckland', boxAround(home[0], home[1], 25), 10, 15],
    ['akl', '🗺️ Auckland region — overview', 'Wellsford to Pukekohe', [-37.35, 174.15, -35.95, 175.35], 7, 13],
    ['ni', '🧭 Upper North Island — roads out', 'Whangārei to Taupō', [-39.1, 173.6, -35.6, 177.0], 6, 11],
    ...(v ? [['view', '🔍 What\'s on screen now', 'Pan/zoom first, then choose this', [v.getSouth(), v.getWest(), v.getNorth(), v.getEast()], Math.max(8, MAP.getZoom() - 3), Math.min(17, MAP.getZoom() + 2)]] : []),
  ];
}
let OFF = { busy: false, cancel: false };
const SAVE_KINDS = ['street', 'topo', 'aerial'];
// how many pieces a saved area needs, for one map type
function areaCount(k, b, z0, z1) {
  const def = SETS[k];
  if (def.vec) { const [a, c] = vecRange(z0, z1); return countTiles(b, a, c); }
  const n = countTiles(b, z0, Math.min(z1, def.max));
  if (k === 'aerial' && S.set.labels !== 0) { const [a, c] = vecRange(z0, z1); return n + countTiles(b, a, c); }
  return n;
}
function areaBytes(k, b, z0, z1) {
  const def = SETS[k];
  if (def.vec) return areaCount(k, b, z0, z1) * def.kb * 1024;
  let n = countTiles(b, z0, Math.min(z1, def.max)) * def.kb * 1024;
  if (k === 'aerial' && S.set.labels !== 0) { const [a, c] = vecRange(z0, z1); n += countTiles(b, a, c) * SETS.street.kb * 1024 * 0.6; }
  return n;
}
// storage keys a saved record uses (to know what can be removed)
function recKeys(m) {
  const out = [];
  const def = SETS[m.k];
  if (def && !def.vec) tilesFor(m.b, m.z0, m.z1).forEach(t => out.push(tileKey(def.set, ...t)));
  if (m.k === 'street' || m.labels) { const [a, c] = vecRange(m.z0, m.vz1 != null ? m.vz1 + 1 : m.z1); tilesFor(m.b, a, c).forEach(t => out.push(lzKey(vecRel(...t)))); }
  return out;
}
function showSave() {
  const P = presets();
  if (!Array.isArray(S.set.saveKinds)) S.set.saveKinds = ['street', 'topo'];
  const K = S.set.saveKinds;
  const kname = m => (SETS[m.k] ? SETS[m.k].name : m.k) + (m.labels ? ' + names' : '');
  const savedHtml = S.saved.maps.length ? `<h3>Saved on this device</h3><ul class="list">${S.saved.maps.map((m, i) => { const old = daysSince(m.at) > 183; return `<li><div class="grow"><b>${esc(m.name)}</b><div class="small muted">${kname(m)} · ${m.n.toLocaleString()} pieces · ${MB(m.bytes || 0)} · saved ${fmtDate(m.at)}</div>${old ? '<div class="small" style="color:var(--warn)">Over 6 months old — refresh to get the latest roads and buildings</div>' : ''}</div><button class="btn sm ${old ? 'primary' : 'ghost'}" data-rf="${i}">Refresh</button><button class="btn sm ghost" data-show="${i}">Show</button><button class="btn sm ghost" data-rm="${i}" style="color:var(--accent)">✕</button></li>`; }).join('')}</ul>` : '';
  const kRow = k => `<li><span class="tick ${K.includes(k) ? 'on' : ''}" data-sk="${k}" role="checkbox" aria-checked="${K.includes(k)}" tabindex="0">${K.includes(k) ? '✓' : ''}</span><span class="grow">${{ street: '🏙️ <b>NZ street map</b> — streets, names, buildings <span class="pill ok">recommended</span>', topo: '⛰️ <b>Topo50</b> — hills, rivers, bush tracks', aerial: '📷 <b>Aerial photos</b>' + (S.set.labels !== 0 ? ' with names' : '') + ' — the biggest download' }[k]}</span></li>`;
  sheet(`<h2>Save maps for no signal</h2><p class="small">Downloads LINZ maps onto this phone so the map works in a disaster with no internet. Do it on <b>Wi-Fi</b>. Each phone needs its own copy. Downloads run at a gentle pace (as LINZ asks), so a typical area takes 5–15 minutes. Refresh saved maps every 6 months.</p>
  <h3>Which maps</h3><ul class="list">${SAVE_KINDS.map(kRow).join('')}</ul>
  <h3>Which area</h3><ul class="list">${P.map((p, i) => `<li><div class="grow"><b>${p[1]}</b><div class="small muted">${p[2]} · <span data-est="${i}"></span></div></div><button class="btn sm primary" data-sv="${i}">Save</button></li>`).join('')}</ul>
  <div id="svProg"></div>${savedHtml}`, el => {
    const est = () => $$('[data-est]', el).forEach(s => { const p = P[s.dataset.est]; if (!K.length) { s.textContent = 'tick a map type above'; return; } let n = 0, b = 0; K.forEach(k => { n += areaCount(k, p[3], p[4], p[5]); b += areaBytes(k, p[3], p[4], p[5]); }); s.textContent = `about ${MB(b)} (${n.toLocaleString()} pieces)`; });
    est();
    $$('[data-sk]', el).forEach(t => t.onclick = () => { const k = t.dataset.sk; const i = K.indexOf(k); if (i >= 0) K.splice(i, 1); else K.push(k); K.sort((a, b) => SAVE_KINDS.indexOf(a) - SAVE_KINDS.indexOf(b)); persist(false); showSave(); });
    $$('[data-sv]', el).forEach(b => b.onclick = () => { if (!K.length) { toast('Tick at least one map type'); return; } saveMany(P[b.dataset.sv], K.slice()); });
    $$('[data-rm]', el).forEach(b => b.onclick = () => confirmTwice(b, 'Delete?', () => removeArea(+b.dataset.rm)));
    $$('[data-rf]', el).forEach(b => b.onclick = () => { const m = S.saved.maps[+b.dataset.rf]; saveArea([m.name, '↻ ' + m.name, '', m.b, m.z0, m.zU || m.z1], m.k, { refresh: true, labels: m.labels }); });
    $$('[data-show]', el).forEach(b => b.onclick = () => { const m = S.saved.maps[+b.dataset.show]; MAP.fitBounds([[m.b[0], m.b[1]], [m.b[2], m.b[3]]]); });
  });
}
async function saveMany(p, kinds) {
  let total = 0; kinds.forEach(k => { total += areaCount(k, p[3], p[4], p[5]); });
  if (dayCount() + total > TILE_DAY_CAP) { toast('That would go over today\'s download limit — try again tomorrow, or save fewer map types.', 6000); return; }
  for (const k of kinds) { const ok = await saveArea(p, k, { many: kinds.length > 1 }); if (!ok) break; }
}
async function saveArea(p, k, opts = {}) {
  if (OFF.busy) { toast('A download is already running'); return false; }
  if (navigator.onLine === false) { toast('You are offline — connect to Wi-Fi first'); return false; }
  const def = SETS[k];
  const labels = k === 'aerial' && (opts.labels != null ? !!opts.labels : S.set.labels !== 0);
  const z1 = def.vec ? p[5] : Math.min(p[5], def.max);
  const n = def.vec ? areaCount(k, p[3], p[4], p[5]) : countTiles(p[3], p[4], z1) + (labels ? countTiles(p[3], ...vecRange(p[4], p[5])) : 0);
  if (n > 40000) { toast('That area is too big — zoom in and use "What\'s on screen"'); return false; }
  if (dayCount() + n > TILE_DAY_CAP) { toast('That would go over today\'s download limit — try again tomorrow, or save a smaller area.', 6000); return false; }
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  OFF = { busy: true, cancel: false };
  const prog = $('#svProg'); let done = 0, fail = 0, bytes = 0, skip = 0, auth = false;
  const title = `${def.name}${labels ? ' + names' : ''}`;
  const ui = () => { const pr = $('#svProg'); if (pr) pr.innerHTML = `<div class="small"><b>${esc(title)}</b></div><div class="progress"><i style="width:${Math.round((done + fail + skip) / Math.max(1, list.length) * 100)}%"></i></div><div class="row small"><span class="grow">${(done + skip).toLocaleString()} of ${list.length.toLocaleString()} · ${MB(bytes)}${fail ? ' · ' + fail + ' unavailable' : ''}</span>${OFF.busy ? '<button class="btn sm ghost" id="svC">Cancel</button>' : ''}</div>`; const c = $('#svC'); if (c) c.onclick = () => { OFF.cancel = true; }; };
  let list = [];
  if (prog) prog.innerHTML = `<div class="small">Getting ready… ${esc(title)}</div>`;
  // fonts, symbols and style first, so the street map and names draw even when nothing else is saved
  if (def.vec || labels) { try { (await vecResources(def.vec ? ['street'] : ['labels'])).forEach(r => list.push([r, true])); } catch (e) {} }
  if (!def.vec) tilesFor(p[3], p[4], z1).forEach(t => list.push([rasRel(def.set, ...t)]));
  if (def.vec || labels) { const [a, c] = vecRange(p[4], p[5]); tilesFor(p[3], a, c).forEach(t => list.push([vecRel(...t)])); }
  ui(); let i = 0, last = 0;
  async function worker() {
    while (i < list.length && !OFF.cancel && !auth) {
      const [rel, res] = list[i++];
      try {
        if (!opts.refresh && await idb.has('tiles', lzKey(rel))) skip++;
        else { const r = await lzRes(rel, { force: true, gate: true }); bytes += r.blob.size; done++; }
      } catch (e) { if (e.code === 'key') { auth = true; break; } fail++; }
      if (Date.now() - last > 300) { last = Date.now(); ui(); }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker)); persist(false);
  OFF.busy = false; ui();
  if (auth) { linzKeyProblem(); return false; }
  if (OFF.cancel) toast('Cancelled. What downloaded is kept.');
  const vz = vecRange(p[4], p[5]);
  const rec = { name: p[1].replace(/^\S+\s/, ''), k, b: p[3], z0: p[4], z1: def.vec ? p[5] : z1, zU: p[5], n: list.length, bytes, at: Date.now() };
  if (def.vec || labels) rec.vz1 = vz[1];
  if (labels) rec.labels = true;
  const ex = S.saved.maps.findIndex(m => m.name === rec.name && m.k === k);
  if (ex >= 0) { if (!opts.refresh) rec.bytes += S.saved.maps[ex].bytes || 0; if (S.saved.maps[ex].labels) rec.labels = true, rec.vz1 = vz[1]; S.saved.maps[ex] = rec; } else S.saved.maps.push(rec);
  persist();
  if (!OFF.cancel) toast(`${opts.refresh ? 'Refreshed' : 'Saved'} ${rec.name} (${title}): ${MB(bytes)} downloaded${fail ? `, ${fail} pieces not available` : ''}. Works offline now.`, 6000);
  if (BASE && !opts.many && S.set.base !== k && !SETS[S.set.base].vec && !SETS[S.set.base].online) setBase(k); else if (BASE && BASE.redraw) BASE.redraw();
  showSave();
  return !OFF.cancel;
}
async function removeArea(i) {
  const m = S.saved.maps[i]; const keep = new Set();
  S.saved.maps.forEach((o, j) => { if (j !== i) recKeys(o).forEach(k => keep.add(k)); });
  for (const k of recKeys(m)) if (!keep.has(k)) await idb.del('tiles', k);
  S.saved.maps.splice(i, 1); persist(); toast('Removed'); showSave();
}

// ---- emergency map data (OpenStreetMap + Auckland Council tsunami zones) ----
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const TSUNAMI_URL = 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Tsunami_Evacuation_Zone/FeatureServer/0/query?where=1%3D1&outFields=ZONETYPE&outSR=4326&maxAllowableOffset=0.0002&geometryPrecision=5&f=geojson';
async function fetchT(url, opts = {}, ms = 200000) { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); try { return await fetch(url, Object.assign({ signal: c.signal }, opts)); } finally { clearTimeout(t); } }
async function downloadLayers(status) {
  const say = m => { if (status) status(m); };
  let okT = false, okO = false;
  say('Downloading tsunami evacuation zones…');
  try { const r = await fetchT(TSUNAMI_URL, {}, 60000); if (r.ok) { const gj = await r.json(); if (gj.features && gj.features.length) { TSUNAMI = { at: Date.now(), gj }; await idb.put('kv', 'tsunami', TSUNAMI); okT = true; } } } catch (e) {}
  say((okT ? '✓ Tsunami zones saved. ' : '✗ Tsunami zones failed. ') + 'Now downloading hospitals, pharmacies, AEDs, fire, police, marae… (can take a few minutes)');
  const bb = '-37.35,174.15,-35.95,175.35';
  const q = `[out:json][timeout:180];(nwr["amenity"="hospital"](${bb});nwr["healthcare"="hospital"](${bb});nwr["amenity"~"clinic|doctors"]["name"~"Urgent|After ?Hours|Accident|A ?& ?M|White Cross|Emergency",i](${bb});nwr["amenity"="pharmacy"](${bb});nwr["amenity"="fire_station"](${bb});nwr["amenity"="police"](${bb});nwr["amenity"="marae"](${bb});nwr["emergency"="defibrillator"](${bb});nwr["amenity"="community_centre"](${bb}););out center tags;`;
  for (const host of OVERPASS) {
    try {
      const r = await fetchT(host, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!r.ok) continue;
      const res = await r.json();
      const pts = parseOsm(res.elements || []);
      if (pts.length > 50) { OSMDATA = { at: Date.now(), pts }; await idb.put('kv', 'osm', OSMDATA); okO = true; break; }
    } catch (e) {}
  }
  if (okT || okO) { S.meta.layersAt = Date.now(); persist(); }
  say(`${okT ? '✓' : '✗'} Tsunami zones · ${okO ? '✓ ' + OSMDATA.pts.length + ' places' : '✗ places (servers busy — try again later)'}`);
  return okT && okO;
}
function parseOsm(els) {
  const cat = t => t.amenity === 'hospital' || t.healthcare === 'hospital' ? 'H' : t.amenity === 'pharmacy' ? 'P' : t.amenity === 'fire_station' ? 'F' : t.amenity === 'police' ? 'L' : t.amenity === 'marae' ? 'M' : t.emergency === 'defibrillator' ? 'A' : t.amenity === 'community_centre' ? 'C' : 'U';
  const seen = new Set(), out = [];
  const skipH = /plastic|cosmetic|radiology|skin|vet|veterinary|surgical services|oncology/i;
  for (const e of els) {
    const t = e.tags || {}; const la = e.lat ?? (e.center && e.center.lat), lo = e.lon ?? (e.center && e.center.lon); if (la == null) continue;
    let c = cat(t); if (c === 'H' && skipH.test(t.name || '')) continue;
    if (c === 'H' && /urgent|accident|white cross|a ?& ?m/i.test(t.name || '')) c = 'U';
    const p = [c, +la.toFixed(5), +lo.toFixed(5), (t.name || '').slice(0, 70), t['addr:street'] ? ((t['addr:housenumber'] || '') + ' ' + t['addr:street']).trim() : '', (t.phone || t['contact:phone'] || '').split(';')[0].slice(0, 24), t.emergency === 'yes' && c === 'H' ? 1 : 0, (t.opening_hours || '').slice(0, 60), (t['defibrillator:location'] || '').slice(0, 80)];
    const k = c + p[1].toFixed(3) + p[2].toFixed(3) + p[3]; if (seen.has(k)) continue; seen.add(k); out.push(p);
  }
  // make sure the core hospitals are always present with correct details
  CORE_POINTS.filter(p => p[0] === 'H' && p[6]).forEach(cp => { if (!out.some(p => distKm(p[1], p[2], cp[1], cp[2]) < 0.4 && p[0] === 'H' && p[6])) out.push(cp); });
  return out;
}

