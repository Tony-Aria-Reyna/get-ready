// ---------------------------------------------------------------------------
// MAP
// ---------------------------------------------------------------------------
const LINZ_ATTR = 'Topo50 & aerials © <a href="https://www.linz.govt.nz/">Toitū Te Whenua LINZ</a> CC BY 4.0';
const SETS = {
  topo: { set: 'topo-raster', name: 'NZ Topo50 map', max: 17, kb: 22 },
  aerial: { set: 'aerial', name: 'Aerial photos', max: 19, kb: 38 },
  street: { online: true, name: 'Street map (OpenStreetMap)', max: 19, url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
};
const SAVABLE = Object.entries(SETS).filter(([k, s]) => !s.online);
let KEYWARNED = false;
function linzKeyProblem() {
  if (KEYWARNED) return; KEYWARNED = true;
  sheet(`<h2>🔑 The LINZ map needs a free access key</h2>
   <p>LINZ now asks for a key before it sends map pieces. Maps you have already <b>saved</b> keep working without one.</p>
   <ol class="steps" style="padding-left:0">
   <li><span class="txt">On this phone, open <b>basemaps.linz.govt.nz</b> in the browser.</span></li>
   <li><span class="txt">Tap the share/copy link button on that map (or copy the address bar) — the link contains <b>api=c…</b></span></li>
   <li><span class="txt">Paste the link in the box below and tap Save.</span></li></ol>
   <div class="row"><input type="text" id="lkQ" placeholder="Paste the LINZ link or key" style="flex:1"><button class="btn primary" id="lkQS">Save</button></div>
   <p class="small muted" style="margin-top:8px">That key lasts 90 days. For a key that never expires, email <b>basemaps@linz.govt.nz</b> and ask for a free Developer key for a family emergency app. Meanwhile, <b>Street map (OpenStreetMap)</b> in Layers works online without a key.</p>`, el => {
    $('#lkQS', el).onclick = () => { const v = $('#lkQ', el).value.trim(); const m = v.match(/[?&]api=([A-Za-z0-9_-]+)/); const k = m ? m[1] : v; if (!k) return; S.set.linzKey = k; persist(); KEYWARNED = false; $('#sheet').innerHTML = ''; setBase(S.set.base); toast('Key saved — map reloading'); };
  });
}
const PT = { // point categories
  H: ['🏥', '#c62828', 'Hospitals'], U: ['🩺', '#e65100', 'Urgent care'], P: ['💊', '#2e7d32', 'Pharmacies'], F: ['🚒', '#b71c1c', 'Fire stations'],
  L: ['🚓', '#1565c0', 'Police'], M: ['🏛️', '#6d4c41', 'Marae'], A: ['❤️', '#ad1457', 'Defibrillators (AED)'], C: ['🏘️', '#546e7a', 'Community centres & halls'],
};
const MYPT = { water: ['💧', 'Water source'], shelter: ['⛺', 'Shelter'], cache: ['📦', 'Supply cache'], danger: ['⚠️', 'Danger / avoid'], food: ['🍎', 'Food / fruit trees'], other: ['📍', 'Other'] };
const DEFAULT_CENTRE = [-36.87, 174.70];
let FOLLOW = false, MEACC = null, MEACCV = 0;
let MAP = null, BASE = null, LYR = {}, MEPOS = null, MEMARK = null, WATCH = null, PICK = null, MAPFOCUS = null, OSMDATA = null, TSUNAMI = null;
const linzKey = () => S.set.linzKey ? '?api=' + encodeURIComponent(S.set.linzKey) : '';
const linzUrl = set => 'https://basemaps.linz.govt.nz/v1/tiles/' + set + '/WebMercatorQuad/{z}/{x}/{y}.webp' + linzKey();
const tileKey = (set, z, x, y) => set + '/' + z + '/' + x + '/' + y;
function makeBase(k) {
  const def = SETS[k] || SETS.topo;
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
  if (MAP) { try { MAP.remove(); } catch (e) {} MAP = null; LYR = {}; MEMARK = null; MEACC = null; }
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
function vMap(main) {
  main.innerHTML = `<div id="mapwrap"><div id="map"></div>
   <div class="mapbar"><button class="btn sm" id="mLoc">📍 Me</button><button class="btn sm" id="mNear">🏥 Nearest help</button><button class="btn sm" id="mLay">🗂️ Layers</button><button class="btn sm" id="mSave">⬇️ Save maps</button><button class="btn sm" id="mAdd">➕ Add place</button></div>
   <div id="sheet"></div></div>`;
  if (typeof L === 'undefined') { $('#map').innerHTML = '<div class="empty">Map library failed to load.</div>'; return; }
  const centre = MAPFOCUS ? MAPFOCUS.slice(0, 2) : S.household.homeLat ? [S.household.homeLat, S.household.homeLon] : DEFAULT_CENTRE;
  MAP = L.map('map', { zoomControl: false, attributionControl: true, tap: true }).setView(centre, MAPFOCUS ? MAPFOCUS[2] : 13);
  MAPFOCUS = null;
  if (SETS[S.set.base] && SETS[S.set.base].online && navigator.onLine === false) S.set.base = 'topo';
  setBase(S.set.base || 'topo');
  // any pan or zoom by the user stops following the blue dot
  MAP.on('dragstart', stopFollow); MAP.on('zoomstart', e => { if (!MAP._followZoom) stopFollow(); });
  L.control.zoom({ position: 'bottomright' }).addTo(MAP);
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(MAP);
  drawOverlays();
  $('#mLoc').onclick = locate;
  $('#mNear').onclick = showNearest;
  $('#mLay').onclick = showLayers;
  $('#mSave').onclick = showSave;
  $('#mAdd').onclick = () => startPick('Tap the map where the place is', (lat, lon) => addMyPoint(lat, lon), null, true);
  if (PICK) armPick();
  setTimeout(() => MAP && MAP.invalidateSize(), 60);
}
function setBase(k) {
  if (!MAP) return; if (BASE) MAP.removeLayer(BASE);
  BASE = makeBase(k).addTo(MAP); S.set.base = k; persist(false);
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
  if (on.meet) {
    const g = L.layerGroup();
    S.meet.filter(m => m.lat).forEach(m => g.addLayer(L.marker([m.lat, m.lon], { icon: dotIcon('⭐', '#6a1b9a', true), zIndexOffset: 900 }).bindPopup(`<b>Meeting point ${esc(m.label)}</b><br>${esc(m.desc)}`)));
    if (S.household.homeLat) g.addLayer(L.marker([S.household.homeLat, S.household.homeLon], { icon: dotIcon('🏠', '#16324f', true), zIndexOffset: 1000 }).bindPopup('<b>Home</b>'));
    LYR.meet = g.addTo(MAP);
  }
  if (on.mine) {
    const g = L.layerGroup();
    S.points.forEach(p => { const c = MYPT[p.cat] || MYPT.other; g.addLayer(L.marker([p.lat, p.lon], { icon: dotIcon(c[0], '#00695c', true) }).bindPopup(() => { const d = document.createElement('div'); d.innerHTML = `<b>${c[0]} ${esc(p.name)}</b><br><span class="small">${esc(c[1])}</span>${p.note ? '<br>' + esc(p.note) : ''}<br><span class="small muted">${fromHere(p.lat, p.lon)}</span><br><button class="btn sm" style="margin-top:6px">Edit</button>`; d.querySelector('button').onclick = () => editMyPoint(p); return d; })); });
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
  const row = (k, label) => `<li><span class="tick ${on[k] ? 'on' : ''}" data-ly="${k}" role="checkbox" aria-checked="${!!on[k]}" tabindex="0">${on[k] ? '✓' : ''}</span><span class="grow">${label}</span></li>`;
  sheet(`<h2>Map layers</h2><h3>Background map</h3><div class="row">${Object.entries(SETS).map(([k, s]) => `<button class="btn sm ${S.set.base === k ? 'primary' : ''}" data-base="${k}">${s.name}</button>`).join('')}</div>
   <p class="small muted" style="margin-top:6px"><b>Street map</b> has the most street names and detail but needs the internet (OpenStreetMap doesn't allow saving it). <b>Topo50</b> and <b>Aerial</b> can be saved for no signal.</p>
   <h3>Show</h3><ul class="list">${row('meet', '⭐ Home & meeting points')}${row('mine', '📍 Our places')}${row('sources', '🤝 Suppliers & contacts')}${row('tsunami', '🌊 Tsunami evacuation zones' + (TSUNAMI ? '' : ' <span class="pill warn">not downloaded</span>'))}
   ${Object.entries(PT).map(([k, v]) => row(k, v[0] + ' ' + v[2] + (!OSMDATA && !['H', 'U', 'P', 'F', 'C'].includes(k) ? ' <span class="pill warn">not downloaded</span>' : ''))).join('')}</ul>
   ${!OSMDATA || !TSUNAMI ? `<button class="btn primary" data-go="data">⬇️ Download emergency map data</button>` : `<p class="small muted">Map data downloaded ${fmtDate(S.meta.layersAt)}. Points © OpenStreetMap contributors (ODbL); tsunami zones © Auckland Council.</p>`}`,
  el => {
    $$('[data-base]', el).forEach(b => b.onclick = () => { if (SETS[b.dataset.base].online && navigator.onLine === false) toast('Street map needs the internet — showing what this phone has already viewed'); setBase(b.dataset.base); showLayers(); });
    $$('[data-ly]', el).forEach(t => t.onclick = () => { on[t.dataset.ly] = on[t.dataset.ly] ? 0 : 1; persist(false); drawOverlays(); showLayers(); });
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
    ['west', '🌳 West Auckland & the city', 'Waitākere Ranges to Auckland CBD', [-37.06, 174.42, -36.76, 174.90], 10, 15],
    ['akl', '🗺️ Auckland region — overview', 'Wellsford to Pukekohe', [-37.35, 174.15, -35.95, 175.35], 7, 13],
    ['ni', '🧭 Upper North Island — roads out', 'Whangārei to Taupō', [-39.1, 173.6, -35.6, 177.0], 6, 11],
    ...(v ? [['view', '🔍 What\'s on screen now', 'Pan/zoom first, then choose this', [v.getSouth(), v.getWest(), v.getNorth(), v.getEast()], Math.max(8, MAP.getZoom() - 3), Math.min(17, MAP.getZoom() + 2)]] : []),
  ];
}
let OFF = { busy: false, cancel: false };
function showSave() {
  const P = presets();
  const savedHtml = S.saved.maps.length ? `<h3>Saved on this device</h3><ul class="list">${S.saved.maps.map((m, i) => `<li><div class="grow"><b>${esc(m.name)}</b><div class="small muted">${SETS[m.k] ? SETS[m.k].name : m.k} · ${m.n.toLocaleString()} pieces · ${MB(m.bytes || 0)} · ${fmtDate(m.at)}</div></div><button class="btn sm ghost" data-show="${i}">Show</button><button class="btn sm ghost" data-rm="${i}" style="color:var(--accent)">✕</button></li>`).join('')}</ul>` : '';
  sheet(`<h2>Save maps for no signal</h2><p class="small">Downloads LINZ Topo50 (or aerial photo) maps onto this phone so the map works in a disaster with no internet. Do it on <b>Wi-Fi</b>. Each phone needs its own copy.</p>
  <label class="f">Map type</label><select id="svK">${SAVABLE.map(([k, s]) => `<option value="${k}"${k === 'topo' ? ' selected' : ''}>${s.name}${k === 'topo' ? ' (recommended — smaller)' : ''}</option>`).join('')}</select>
  <ul class="list">${P.map((p, i) => `<li><div class="grow"><b>${p[1]}</b><div class="small muted">${p[2]} · <span data-est="${i}"></span></div></div><button class="btn sm primary" data-sv="${i}">Save</button></li>`).join('')}</ul>
  <div id="svProg"></div>${savedHtml}`, el => {
    const est = () => { const k = $('#svK', el).value; $$('[data-est]', el).forEach(s => { const p = P[s.dataset.est]; const n = countTiles(p[3], p[4], Math.min(p[5], SETS[k].max)); s.textContent = `about ${MB(n * SETS[k].kb * 1024)} (${n.toLocaleString()} pieces)`; }); };
    est(); $('#svK', el).onchange = est;
    $$('[data-sv]', el).forEach(b => b.onclick = () => saveArea(P[b.dataset.sv], $('#svK', el).value));
    $$('[data-rm]', el).forEach(b => b.onclick = () => confirmTwice(b, 'Delete?', () => removeArea(+b.dataset.rm)));
    $$('[data-show]', el).forEach(b => b.onclick = () => { const m = S.saved.maps[+b.dataset.show]; MAP.fitBounds([[m.b[0], m.b[1]], [m.b[2], m.b[3]]]); });
  });
}
async function saveArea(p, k) {
  if (OFF.busy) { toast('A download is already running'); return; }
  if (navigator.onLine === false) { toast('You are offline — connect to Wi-Fi first'); return; }
  const def = SETS[k], z1 = Math.min(p[5], def.max), n = countTiles(p[3], p[4], z1);
  if (n > 40000) { toast('That area is too big — zoom in and use "What\'s on screen"'); return; }
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  const list = tilesFor(p[3], p[4], z1); OFF = { busy: true, cancel: false };
  const prog = $('#svProg'); let done = 0, fail = 0, bytes = 0, skip = 0, auth = false;
  const ui = () => { if (prog) prog.innerHTML = `<div class="progress"><i style="width:${Math.round((done + fail + skip) / list.length * 100)}%"></i></div><div class="row small"><span class="grow">${(done + skip).toLocaleString()} of ${list.length.toLocaleString()} · ${MB(bytes)}${fail ? ' · ' + fail + ' unavailable' : ''}</span>${OFF.busy ? '<button class="btn sm ghost" id="svC">Cancel</button>' : ''}</div>`; const c = $('#svC'); if (c) c.onclick = () => { OFF.cancel = true; }; };
  ui(); let i = 0; let last = 0;
  const url = (z, x, y) => linzUrl(def.set).replace('{z}', z).replace('{x}', x).replace('{y}', y);
  async function worker() {
    while (i < list.length && !OFF.cancel && !auth) {
      const [z, x, y] = list[i++]; const key = tileKey(def.set, z, x, y);
      try {
        if (await idb.has('tiles', key)) { skip++; }
        else {
          const r = await fetch(url(z, x, y), { mode: 'cors', credentials: 'omit' });
          if (r.status === 401 || r.status === 403 || (r.status === 400 && /key/i.test(await r.clone().text().catch(() => '')))) { auth = true; break; }
          if (!r.ok) { fail++; } else { const b = await r.blob(); bytes += b.size; await idb.put('tiles', key, b); done++; }
        }
      } catch (e) { fail++; }
      if (Date.now() - last > 300) { last = Date.now(); ui(); }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  OFF.busy = false; ui();
  if (auth) { linzKeyProblem(); return; }
  if (OFF.cancel) { toast('Cancelled. What downloaded is kept.'); }
  const rec = { name: p[1].replace(/^\S+\s/, ''), k, b: p[3], z0: p[4], z1, n: list.length, bytes, at: Date.now() };
  const ex = S.saved.maps.findIndex(m => m.name === rec.name && m.k === k);
  if (ex >= 0) { rec.bytes += S.saved.maps[ex].bytes || 0; S.saved.maps[ex] = rec; } else S.saved.maps.push(rec);
  persist();
  if (!OFF.cancel) toast(`Saved ${rec.name}: ${MB(bytes)} downloaded${fail ? `, ${fail} pieces not available` : ''}. Works offline now.`, 6000);
  if (BASE && S.set.base !== k && !SETS[S.set.base].online) setBase(k); else if (BASE) BASE.redraw();
  showSave();
}
async function removeArea(i) {
  const m = S.saved.maps[i]; const def = SETS[m.k]; const keep = new Set();
  S.saved.maps.forEach((o, j) => { if (j !== i && o.k === m.k) tilesFor(o.b, o.z0, o.z1).forEach(t => keep.add(tileKey(def.set, ...t))); });
  for (const t of tilesFor(m.b, m.z0, m.z1)) { const k = tileKey(def.set, ...t); if (!keep.has(k)) await idb.del('tiles', k); }
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

