// ---------------------------------------------------------------------------
// LINZ VECTOR MAPS — the "NZ street map" and the place names over aerial photos.
// Drawn by MapLibre inside Leaflet. Every piece (map data, fonts, symbols, style) goes through
// lzRes(): kept on this phone in IndexedDB, fetched from LINZ only when missing.
// ---------------------------------------------------------------------------
const LZ = 'https://basemaps.linz.govt.nz/v1/';
const VSET = 'topographic-v2', VMAX = 15;            // LINZ vector data stops at zoom 15; MapLibre zooms in beyond that
const VSTYLE = { street: VSET, labels: 'labels-v2' };
const FONT_RANGES = ['0-255', '256-511', '8192-8447']; // Latin, macrons (ā ē ī ō ū), punctuation
const SPRITES = ['sprites/topographic.json', 'sprites/topographic.png', 'sprites/topographic@2x.json', 'sprites/topographic@2x.png'];
let GLOK = null, MLLOADED = false, LABELS = null;
function glOK() {
  if (GLOK === null) { try { const c = document.createElement('canvas'); GLOK = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { GLOK = false; } }
  return GLOK;
}
// the storage key for each LINZ path (raster pieces keep their original keys)
function lzKey(rel) {
  const m = rel.match(/^tiles\/([^/]+)\/WebMercatorQuad\/(\d+)\/(\d+)\/(\d+)\.(pbf|webp)$/);
  if (m) return (m[5] === 'pbf' ? 'v/' : '') + m[1] + '/' + m[2] + '/' + m[3] + '/' + m[4];
  return 'r/' + rel;
}
const vecRel = (z, x, y) => `tiles/${VSET}/WebMercatorQuad/${z}/${x}/${y}.pbf`;
const rasRel = (set, z, x, y) => `tiles/${set}/WebMercatorQuad/${z}/${x}/${y}.webp`;
class LzError extends Error { constructor(m, code) { super(m); this.code = code; } }
// opts: force = fetch again even if saved; gate = keep to LINZ's download pace (used when saving)
async function lzRes(rel, opts = {}) {
  const key = lzKey(rel);
  if (!opts.force) { const b = await idb.get('tiles', key).catch(() => null); if (b) return { blob: b, cached: true }; }
  if (navigator.onLine === false) throw new LzError('offline', 'offline');
  if (opts.gate) { await tileGate(); dayCount(1); }
  let r, tries = 0;
  for (;;) {
    try { r = await fetch(LZ + rel + (rel.includes('?') ? '&' : '?') + linzKey().slice(1), { mode: 'cors', credentials: 'omit' }); }
    catch (e) { if (++tries > 2) throw new LzError('network', 'net'); await new Promise(z => setTimeout(z, 1500 * tries)); continue; }
    if ((r.status === 429 || r.status >= 500) && ++tries <= 2) { await new Promise(z => setTimeout(z, 1500 * tries)); continue; }
    break;
  }
  if (r.status === 204 || (r.status === 404 && /^tiles\//.test(rel))) { const b = new Blob([]); if (r.status === 204) await idb.put('tiles', key, b).catch(() => {}); return { blob: b }; }
  if (r.status === 401 || r.status === 403 || (r.status === 400 && /key/i.test(await r.clone().text().catch(() => '')))) throw new LzError('key', 'key');
  if (!r.ok) throw new LzError('http ' + r.status, 'http');
  const b = await r.blob(); await idb.put('tiles', key, b).catch(() => {});
  return { blob: b };
}
function loadMaplibre() {
  if (MLLOADED) return window.maplibregl;
  const css = document.getElementById('lib-maplibre-css');
  if (css) { const st = document.createElement('style'); st.textContent = css.textContent; document.head.appendChild(st); css.textContent = ''; }
  loadLib('lib-maplibre', 'maplibregl'); loadLib('lib-mlleaflet', 'L');
  maplibregl.addProtocol('lz', async (params) => {
    let rel = params.url.replace(/^lz:\/\//, '');
    if (rel.startsWith('fonts/')) rel = rel.split('/').map((p, i) => i === 1 ? encodeURIComponent(decodeURIComponent(p)) : p).join('/');
    try {
      const { blob } = await lzRes(rel);
      if (params.type === 'json') return { data: JSON.parse(await blob.text()) };
      return { data: await blob.arrayBuffer() };
    } catch (e) {
      if (e.code === 'key') linzKeyProblem();
      if (/^tiles\//.test(rel)) return { data: new ArrayBuffer(0) }; // not saved and no signal: leave that square blank
      throw e;
    }
  });
  MLLOADED = true; return window.maplibregl;
}
// The LINZ style, pointed at our own storage. Hill shading and 3D terrain are left out (big downloads; Topo50 shows the hills).
function prepStyle(st) {
  st = JSON.parse(JSON.stringify(st));
  const vs = 'LINZ Basemaps';
  st.sources = { [vs]: { type: 'vector', tiles: ['lz://tiles/' + VSET + '/WebMercatorQuad/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: VMAX } };
  st.layers = st.layers.filter(l => !l.source || l.source === vs);
  delete st.terrain; delete st.sky;
  st.glyphs = 'lz://fonts/{fontstack}/{range}.pbf';
  st.sprite = 'lz://sprites/topographic';
  return st;
}
async function vecStyle(kind, force) {
  const { blob } = await lzRes('styles/' + VSTYLE[kind] + '.json', { force });
  return JSON.parse(await blob.text());
}
function styleFonts(st) {
  const out = new Set();
  st.layers.forEach(l => { const f = l.layout && l.layout['text-font']; if (Array.isArray(f) && f.length && f.every(x => typeof x === 'string')) out.add(f.join(',')); });
  return [...out];
}
async function makeVector(kind) {
  loadMaplibre();
  const st = prepStyle(await vecStyle(kind));
  const lyr = L.maplibreGL({ style: st, pane: kind === 'labels' ? 'labels' : 'tilePane', attributionControl: false, interactive: false, fadeDuration: 0 });
  lyr.getAttribution = () => 'Street map © <a href="https://www.linz.govt.nz/">Toitū Te Whenua LINZ</a> CC BY 4.0';
  return lyr;
}
// the "Show names" layer on top of the aerial photos
async function syncLabels() {
  if (!MAP) return;
  const want = S.set.base === 'aerial' && S.set.labels !== 0 && glOK();
  if (!want) { if (LABELS) { MAP.removeLayer(LABELS); LABELS = null; } return; }
  if (LABELS) return;
  try { const l = await makeVector('labels'); if (MAP && S.set.base === 'aerial' && S.set.labels !== 0 && !LABELS) LABELS = l.addTo(MAP); } catch (e) {}
}
// everything the vector maps need besides the map squares: style, symbols, fonts
async function vecResources(kinds) {
  const rels = SPRITES.slice();
  for (const k of kinds) {
    rels.push('styles/' + VSTYLE[k] + '.json');
    try { const st = await vecStyle(k); styleFonts(st).forEach(f => FONT_RANGES.forEach(r => rels.push('fonts/' + encodeURIComponent(f) + '/' + r + '.pbf'))); } catch (e) {}
  }
  return [...new Set(rels)];
}
// MapLibre draws 512-pixel squares, so Leaflet zoom z uses LINZ vector zoom z-1
const vecRange = (z0, z1) => [Math.max(0, z0 - 1), Math.min(VMAX, z1 - 1)];
