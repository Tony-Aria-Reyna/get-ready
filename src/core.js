// ============================================================================
// FAMILY READY — offline emergency app. All personal data stays on this device.
// ============================================================================
'use strict';
const APP_VERSION = '2026-10-30';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const clone = o => JSON.parse(JSON.stringify(o));
const telHref = n => 'tel:' + String(n).replace(/[^0-9+]/g, '');
const fmtDate = t => t ? new Date(t).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const daysSince = t => t ? Math.floor((Date.now() - t) / 864e5) : Infinity;
const MB = b => (b / 1048576).toFixed(b > 1048576 * 10 ? 0 : 1) + ' MB';
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const fmtNum = n => (Math.round(n * 10) / 10).toLocaleString('en-NZ');

// ---------------------------------------------------------------------------
// Storage: IndexedDB (state, saved map tiles, document photos, map layers)
// ---------------------------------------------------------------------------
let DB = null;
const MEM = { kv: new Map(), tiles: new Map(), files: new Map() };
function openDB() {
  return new Promise(res => {
    try {
      const rq = indexedDB.open('family-ready', 1);
      rq.onupgradeneeded = () => { const d = rq.result; ['kv', 'tiles', 'files'].forEach(n => { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n); }); };
      rq.onsuccess = () => { DB = rq.result; res(true); };
      rq.onerror = () => res(false); rq.onblocked = () => res(false);
    } catch (e) { res(false); }
  });
}
function tx(store, mode, fn) {
  return new Promise((res, rej) => {
    try {
      const t = DB.transaction(store, mode), s = t.objectStore(store); let out;
      const r = fn(s); if (r && 'onsuccess' in r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    } catch (e) { rej(e); }
  });
}
const idb = {
  get: (st, k) => DB ? tx(st, 'readonly', s => s.get(k)) : Promise.resolve(MEM[st].get(k)),
  put: (st, k, v) => DB ? tx(st, 'readwrite', s => s.put(v, k)) : Promise.resolve(MEM[st].set(k, v)),
  del: (st, k) => DB ? tx(st, 'readwrite', s => s.delete(k)) : Promise.resolve(MEM[st].delete(k)),
  count: st => DB ? tx(st, 'readonly', s => s.count()) : Promise.resolve(MEM[st].size),
  has: (st, k) => DB ? tx(st, 'readonly', s => s.getKey(k)).then(x => x !== undefined) : Promise.resolve(MEM[st].has(k)),
  clear: st => DB ? tx(st, 'readwrite', s => s.clear()) : Promise.resolve(MEM[st].clear()),
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const HOME_DEFAULTS = {
  car: 'our PHEV', carModel: '', carOutlet: 1500, carVolts: 'unknown', carKwh: 12, carFuelL: 45, carNotes: '',
  inverter: '', tankL: 0, tankCount: 1, tapWhere: 'the tank tap', tankNotes: '',
  oven: 'the pizza oven', ovenGas: 'unknown', bbq: 'the Big Green Egg', stove: '',
  radios: 'our handheld radios', radioCh: '', radioNotes: '', gasMeter: '', waterToby: '', switchboard: '',
};
const DEFAULT_STATE = () => ({
  v: 2,
  household: { name: 'Our family', address: '', awayName: '', homeName: '', people: 3, days: 30, checkin: '19:00', backupAdult: '', backupPhone: '', homeLat: null, homeLon: null },
  people: [], contacts: [],
  meet: [
    { id: 'm1', label: '1 · Just outside home', desc: 'e.g. the letterbox / front lawn — if we have to get out of the house', lat: null, lon: null },
    { id: 'm2', label: '2 · In our neighbourhood', desc: 'e.g. a park, school or church nearby — if home isn\'t safe or we can\'t get there', lat: null, lon: null },
    { id: 'm3', label: '3 · Out of the area', desc: 'e.g. a friend\'s or relative\'s house in another suburb or town — if we have to leave Auckland', lat: null, lon: null },
  ],
  rules: { pickup: 'Whoever is closest collects the children from school. If we can\'t reach each other, everyone goes home. If home isn\'t safe, meet at meeting point 2.', school: '', note: '' },
  home: clone(HOME_DEFAULTS),
  docs: [], supplies: { have: {}, expiry: {}, note: {}, custom: [], hidden: {} },
  sources: [], points: [], manual: {}, ticks: {},
  gx: {}, gnew: [], hiddenG: {},
  saved: { maps: [] },
  set: { linzKey: '', base: 'topo', layers: { H: 1, U: 1, P: 1, F: 1, L: 1, M: 1, A: 1, C: 0, tsunami: 1, meet: 1, mine: 1, sources: 1 }, theme: 'auto', textSize: 'normal' },
  meta: { created: Date.now(), changed: 0, lastBackup: 0 },
});
let S = DEFAULT_STATE();
let saveTimer = null;
function migrate() {
  const d = DEFAULT_STATE();
  for (const k of Object.keys(d)) if (S[k] === undefined) S[k] = d[k];
  for (const k of ['household', 'rules', 'supplies', 'set', 'meta', 'saved']) S[k] = Object.assign({}, d[k], S[k] || {});
  S.set.layers = Object.assign({}, d.set.layers, S.set.layers || {});
  S.home = Object.assign({}, HOME_DEFAULTS, S.home || {});
  if (S.rules.radioCh && !S.home.radioCh) S.home.radioCh = S.rules.radioCh;
  S.people.forEach(p => { if (!p.age) p.age = /daughter|son|child|kid/i.test(p.role || '') ? 'child4' : /mother|nana|grand|in-law/i.test(p.role || '') ? 'olderF' : 'woman'; });
  S.v = 2;
}
function persist(changed = true) {
  if (changed) S.meta.changed = Date.now();
  SEARCH_INDEX = null;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    idb.put('kv', 'state', clone(S)).catch(() => {});
    try { localStorage.setItem('family-ready-state', JSON.stringify(S)); } catch (e) {}
  }, 250);
}
async function loadState() {
  let st = null;
  try { st = await idb.get('kv', 'state'); } catch (e) {}
  if (!st) { try { st = JSON.parse(localStorage.getItem('family-ready-state') || 'null'); } catch (e) {} }
  if (st && st.v) S = st;
  migrate();
}

// ---------------------------------------------------------------------------
// Household numbers
// ---------------------------------------------------------------------------
const AGE = Object.fromEntries(AGE_GROUPS.map(a => [a[0], a]));
const peopleCount = () => S.people.length || Number(S.household.people) || 3;
const adultEq = () => S.people.length ? S.people.reduce((t, p) => t + ((AGE[p.age] || AGE.woman)[3]), 0) : peopleCount();
const proteinDay = () => S.people.length ? S.people.reduce((t, p) => t + ((AGE[p.age] || AGE.woman)[2]), 0) : peopleCount() * 55;
const daysTarget = () => Number(S.household.days) || 30;
const AW = () => S.household.awayName || 'Mum';
const HA = () => S.household.homeName || 'Dad';
function supplyNeed(row) {
  const [, , q, unit, scale] = row; const d = daysTarget();
  let n = scale === 'day' ? q * peopleCount() * d : scale === 'week' ? q * peopleCount() * Math.min(d, 7) : scale === 'month' ? q * adultEq() * d / 30 : scale === 'person' ? q * peopleCount() : q;
  if (/prescription/i.test(row[1])) n = Math.max(14, Math.min(d, 90));
  n = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
  return { n, unit };
}

// ---------------------------------------------------------------------------
// Tokens used inside guides: {{name}}
// ---------------------------------------------------------------------------
function tokens() {
  const h = S.home, ppl = peopleCount(), tank = (Number(h.tankL) || 0) * (Number(h.tankCount) || 1);
  const pantryRows = SUPPLIES.filter(r => r[4] === 'month' && /Grains|Protein/.test(r[0]))
    .map(r => { const nd = supplyNeed(r); return `| ${r[1]} | ${fmtNum(r[2])} ${r[3]} | **${fmtNum(nd.n)} ${nd.unit}** |`; });
  return {
    away: AW(), homeAdult: HA(), people: String(ppl), days: String(daysTarget()), checkin: S.household.checkin || '19:00',
    backupAdult: S.household.backupAdult || 'not set yet — add in Our plan',
    proteinDay: String(Math.round(proteinDay())), proteinMonth: fmtNum(proteinDay() * 30 / 1000),
    waterMin7: String(ppl * 3 * 7), water20x7: String(ppl * 20 * 7),
    car: h.car || 'our PHEV', Car: (h.car || 'our PHEV').replace(/^./, c => c.toUpperCase()), carModel: h.carModel || (h.car || 'Our PHEV').replace(/^./, c => c.toUpperCase()),
    carOutlet: String(h.carOutlet || 1500), carKwh: String(h.carKwh || '?'), carFuel: String(h.carFuelL || '?'),
    voltsWarning: h.carVolts === '230' ? 'Our car socket is **230 V** — NZ appliances plug straight in (no transformer needed).'
      : h.carVolts === '100' ? 'Our car is a **Japanese import with 100 V sockets**. NZ appliances need 230 V. **Always plug through the step-up transformer** (100 V → 230 V, rated at least 1,500 W). A fridge plugged straight into 100 V can be damaged.'
      : '**Check the label on the car\'s power socket.** Japanese-import Outlanders have **100 V** sockets; NZ appliances need **230 V** and must be plugged in through a step-up transformer. Then set the voltage in Our plan → Our home.',
    inverter: h.inverter || 'our solar inverter', inverterNote: h.inverter ? ' (' + h.inverter + ')' : '',
    tank: tank ? tank.toLocaleString('en-NZ') + ' L' : 'our tank', tapWhere: h.tapWhere || 'the tank tap',
    tankDays20: tank ? String(Math.floor(tank / (ppl * 20))) : '?', tankDays3: tank ? String(Math.floor(tank / (ppl * 3))) : '?',
    Oven: (h.oven || 'the pizza oven').replace(/^./, c => c.toUpperCase()), oven: h.oven || 'the pizza oven', bbq: h.bbq || 'the Big Green Egg',
    ovenGasLine: h.ovenGas === 'yes' ? '> We have the **gas burner** — the easiest way to use it. Wood steps are below for when the gas runs out.' : h.ovenGas === 'no' ? '> We don\'t have the gas burner — use the wood steps below.' : '> If we have the gas burner, use these steps. Otherwise skip to wood.',
    radios: h.radios || 'our handheld radios', radioCh: h.radioCh || '(not set yet — add it in Our plan → Our home)',
    gasMeter: h.gasMeter || 'add where it is in Our plan → Our home', waterToby: h.waterToby || 'add where it is in Our plan → Our home', switchboard: h.switchboard || 'add where it is in Our plan → Our home',
    pantryTable: ['| Food | Per adult per month | For us — ' + daysTarget() + ' days |', ...pantryRows].join('\n'),
  };
}
function fill(str, T) { T = T || tokens(); return String(str).replace(/\{\{(\w+)\}\}/g, (m, k) => T[k] != null ? T[k] : m); }

// ---------------------------------------------------------------------------
// Guides: built-in + our edits + our new guides
// ---------------------------------------------------------------------------
const BUILTIN = Object.fromEntries(GUIDES.map((g, i) => [g.id, Object.assign({ order: i, builtin: true }, g)]));
const CAT = Object.fromEntries(CATS.map(c => [c[0], { id: c[0], name: c[1], icon: c[2], colour: c[3], desc: c[4] }]));
function getGuide(id) {
  const b = BUILTIN[id];
  if (b) { const x = S.gx[id]; return x ? Object.assign({}, b, x, { edited: true }) : b; }
  const u = S.gnew.find(g => g.id === id); return u ? Object.assign({ cat: 'ours', builtin: false }, u) : null;
}
function allGuides(includeHidden) {
  const list = GUIDES.map(g => getGuide(g.id)).concat(S.gnew.map(g => getGuide(g.id)));
  return includeHidden ? list : list.filter(g => !S.hiddenG[g.id]);
}
const guideTitle = (g, T) => fill(g.title, T);
const catOf = g => CAT[g.cat] || CAT.ours;

// ---- the simple text format -------------------------------------------------
function lineType(t) {
  if (/^###\s/.test(t)) return 'sub';
  if (/^\d+\.\s/.test(t)) return 'step';
  if (/^-\s/.test(t)) return 'bullet';
  if (/^\[( |x|X)?\]\s/.test(t)) return 'check';
  if (/^!\s/.test(t)) return 'warn';
  if (/^>\s/.test(t)) return 'note';
  if (/^\+\s/.test(t)) return 'tip';
  if (/^\|/.test(t)) return 'table';
  if (!t.trim()) return 'blank';
  return 'para';
}
const stripMark = (t, ty) => ty === 'step' ? t.replace(/^\d+\.\s/, '') : ty === 'bullet' || ty === 'warn' || ty === 'note' || ty === 'tip' ? t.slice(2) : ty === 'check' ? t.replace(/^\[( |x|X)?\]\s/, '') : ty === 'sub' ? t.replace(/^###\s/, '') : t;
function expandTokens(body, T) { // a line that is only a {{token}} can expand to several lines (e.g. tables)
  return body.split('\n').map(l => { const m = l.trim().match(/^\{\{(\w+)\}\}$/); return m && T[m[1]] != null ? T[m[1]] : l; }).join('\n');
}
function sections(body) {
  const lines = body.split('\n'); const out = []; let cur = { title: '', start: 0, lines: [] };
  lines.forEach((t, i) => { if (/^##\s/.test(t)) { if (cur.title || cur.lines.some(l => l.t.trim())) { cur.end = i - 1; out.push(cur); } cur = { title: t.slice(3).trim(), start: i, lines: [] }; } else cur.lines.push({ t, i }); });
  cur.end = lines.length - 1; if (cur.title || cur.lines.some(l => l.t.trim())) out.push(cur);
  return out;
}
function blocks(lines) {
  const out = []; let b = null;
  for (const l of lines) {
    const ty = lineType(l.t);
    if (ty === 'blank') { b = null; continue; }
    const groupable = ['step', 'bullet', 'check', 'table'].includes(ty);
    if (b && b.type === ty && groupable) b.items.push(l);
    else { b = { type: ty, items: [l] }; out.push(b); if (!groupable) b = null; }
  }
  return out;
}
function inline(s, opts = {}) {
  let h = esc(s);
  h = h.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, id, txt) => {
    id = id.trim();
    if (/^(tab|tool):/.test(id)) return `<a href="#" data-go="${esc(id.replace(/^tab:/, ''))}">${txt || id}</a>`;
    const g = getGuide(id); const label = txt || (g ? esc(guideTitle(g, opts.T)) : id);
    return `<a href="#" data-go="g:${esc(id)}">${label}</a>`;
  });
  h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, '$1<i>$2</i>');
  if (opts.q) h = highlight(h, opts.q);
  return h;
}
function highlight(html, q) {
  const words = q.filter(w => w.length > 1); if (!words.length) return html;
  return html.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, text) => {
    if (tag) return tag;
    const n = norm(text); let out = '', last = 0; const hits = [];
    words.forEach(w => { let i = n.indexOf(w); while (i >= 0) { hits.push([i, i + w.length]); i = n.indexOf(w, i + w.length); } });
    if (!hits.length) return text;
    hits.sort((a, b) => a[0] - b[0]); const merged = [];
    hits.forEach(hh => { if (merged.length && hh[0] <= merged[merged.length - 1][1]) merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], hh[1]); else merged.push(hh); });
    merged.forEach(([a, b]) => { out += text.slice(last, a) + '<mark>' + text.slice(a, b) + '</mark>'; last = b; });
    return out + text.slice(last);
  });
}
function renderBlocks(bl, g, opts) {
  const T = opts.T;
  return bl.map(b => {
    if (b.type === 'step') return `<ol class="steps">${b.items.map(l => { const k = 's' + l.i, on = (TICKS[g.id] || {})[k]; return `<li class="${on ? 'done' : ''}" data-line="${l.i}"><span class="tick ${on ? 'on' : ''}" data-step="${k}" role="checkbox" aria-checked="${!!on}" tabindex="0">${on ? '✓' : ''}</span><span class="txt">${inline(fill(stripMark(l.t, 'step'), T), opts)}</span></li>`; }).join('')}</ol>`;
    if (b.type === 'bullet') return `<ul class="bul">${b.items.map(l => `<li data-line="${l.i}">${inline(fill(stripMark(l.t, 'bullet'), T), opts)}</li>`).join('')}</ul>`;
    if (b.type === 'check') return `<ul class="checks">${b.items.map(l => { const k = hash(l.t), on = ((S.ticks[g.id] || {})[k]); return `<li class="${on ? 'done' : ''}" data-line="${l.i}"><span class="tick ${on ? 'on' : ''}" data-check="${k}" role="checkbox" aria-checked="${!!on}" tabindex="0">${on ? '✓' : ''}</span><span class="txt">${inline(fill(stripMark(l.t, 'check'), T), opts)}</span></li>`; }).join('')}</ul>`;
    if (b.type === 'table') {
      const rows = b.items.map(l => l.t.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      return `<div class="tablewrap"><table>${rows.map((r, i) => `<tr data-line="${b.items[i].i}">${r.map(c => i === 0 ? `<th>${inline(fill(c, T), opts)}</th>` : `<td>${inline(fill(c, T), opts)}</td>`).join('')}</tr>`).join('')}</table></div>`;
    }
    const l = b.items[0]; const txt = inline(fill(stripMark(l.t, b.type), T), opts);
    if (b.type === 'sub') return `<h4 data-line="${l.i}">${txt}</h4>`;
    if (b.type === 'warn') return `<div class="warn" data-line="${l.i}">⚠️ ${txt}</div>`;
    if (b.type === 'note') return `<div class="note" data-line="${l.i}">${txt}</div>`;
    if (b.type === 'tip') return `<div class="tipbox" data-line="${l.i}">✅ ${txt}</div>`;
    return `<p data-line="${l.i}">${txt}</p>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function toast(msg, ms = 3500) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }
function modal(html, onMount, cls = '') {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg) close(); });
  document.body.appendChild(bg);
  function close() { bg.remove(); }
  if (onMount) onMount(bg.firstElementChild, close);
  return close;
}
function formModal(title, fields, values, onSave, opts = {}) {
  const f = fields.map(fl => {
    const v = values[fl.k] == null ? '' : values[fl.k];
    let input;
    if (fl.type === 'textarea') input = `<textarea id="f_${fl.k}" placeholder="${esc(fl.ph || '')}"${fl.rows ? ` rows="${fl.rows}"` : ''}>${esc(v)}</textarea>`;
    else if (fl.type === 'select') input = `<select id="f_${fl.k}">${fl.options.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}"${String(val) === String(v) ? ' selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
    else if (fl.type === 'check') input = `<label class="row"><input type="checkbox" id="f_${fl.k}"${v ? ' checked' : ''}> ${esc(fl.ph || '')}</label>`;
    else input = `<input type="${fl.type || 'text'}" id="f_${fl.k}" value="${esc(v)}" placeholder="${esc(fl.ph || '')}"${fl.type === 'number' ? ' inputmode="decimal" step="any"' : ''}>`;
    return `${fl.section ? `<h3>${esc(fl.section)}</h3>` : ''}<label class="f" for="f_${fl.k}">${esc(fl.label)}</label>${fl.help ? `<div class="small muted" style="margin:-2px 0 4px">${fl.help}</div>` : ''}${input}`;
  }).join('');
  modal(`<h2>${esc(title)}</h2>${opts.intro || ''}${f}<div class="actions">${opts.onDelete ? '<button class="btn ghost" id="fDel" style="margin-right:auto;color:var(--accent)">Delete</button>' : ''}<button class="btn ghost" id="fCancel">Cancel</button><button class="btn primary" id="fSave">Save</button></div>`, (m, close) => {
    $('#fCancel', m).onclick = close;
    let armed = false;
    if (opts.onDelete) $('#fDel', m).onclick = () => { if (!armed) { armed = true; $('#fDel', m).textContent = 'Tap again to delete'; return; } opts.onDelete(); close(); };
    $('#fSave', m).onclick = () => {
      const out = {};
      fields.forEach(fl => { const el = $('#f_' + fl.k, m); out[fl.k] = fl.type === 'check' ? el.checked : fl.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value.trim(); });
      if (onSave(out) !== false) close();
    };
    if (opts.onMount) opts.onMount(m, close);
  });
}
function confirmTwice(btn, label, fn) {
  if (btn.dataset.armed) { fn(); return; }
  btn.dataset.armed = '1'; const old = btn.textContent; btn.textContent = label;
  setTimeout(() => { if (btn.isConnected) { btn.textContent = old; delete btn.dataset.armed; } }, 4000);
}
async function saveFile(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  try { if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) { await navigator.share({ files: [file], title: name }); return true; } } catch (e) { if (e && e.name === 'AbortError') return false; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  return true;
}
const LOADED = {};
function loadLib(id, globalName) {
  if (LOADED[id]) return window[globalName];
  const el = document.getElementById(id); if (!el) throw new Error('missing ' + id);
  (0, eval)(el.textContent); el.textContent = ''; LOADED[id] = true;
  return window[globalName];
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const TABS = [['now', '🆘', 'Now'], ['guides', '📖', 'Guides'], ['map', '🗺️', 'Map'], ['plan', '👪', 'Our plan'], ['kit', '🎒', 'Supplies'], ['sources', '🤝', 'Contacts']];
let ROUTE = 'now';
const LEGACY = { sc: 'g', lib: 'g', home: 'g' };
function go(r, push = true) {
  if (!r) r = 'now';
  r = r.replace(/^tab:/, '');
  if (r === 'supplies') r = 'kit';
  if (r === 'away') r = 'g:away-general';
  const [p, ...rest] = r.split(':'); if (LEGACY[p]) r = LEGACY[p] + ':' + rest.join(':');
  if (r.startsWith('g:h-')) r = 'g:' + ({ 'h-power': 'car-power', 'h-water': 'tank-water', 'h-cook': 'cook-options', 'h-egg': 'egg', 'h-oven': 'ooni', 'h-charcoal': 'charcoal', 'h-radio': 'radios', 'h-shutoff': 'shutoffs' }[r.slice(2)] || r.slice(2));
  ROUTE = r;
  if (push) { try { history.pushState({ r }, '', '#' + r); } catch (e) {} }
  render(); window.scrollTo(0, 0);
}
window.addEventListener('popstate', e => { ROUTE = (e.state && e.state.r) || (location.hash.slice(1) || 'now'); render(); });
document.addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (a) { e.preventDefault(); const m = a.closest('.modal-bg'); if (m) m.remove(); go(a.dataset.go); } });
function render() {
  const main = $('main'); const top = ROUTE.split(':')[0];
  const tabFor = { g: 'guides', cat: 'guides', tool: 'guides', search: '', data: '', pack: '' }[top] ?? top;
  $$('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tabFor));
  if (top !== 'map' && typeof teardownMap === 'function') teardownMap();
  main.classList.toggle('mapmode', top === 'map');
  const views = { now: vNow, guides: vGuides, cat: vCat, g: vGuide, search: vSearch, plan: vPlan, kit: vKit, sources: vSources, tool: vTool, data: vData, pack: vPack, map: vMap };
  (views[top] || vNow)(main, ROUTE.split(':').slice(1).join(':'));
}

// ---------------------------------------------------------------------------
// NOW
// ---------------------------------------------------------------------------
function isInstalled() { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } }
function readiness() {
  return [
    ['people', 'Add everyone in the family, with medicines and age group', S.people.length > 0, 'plan'],
    ['contacts', 'Add key contacts, including one outside Auckland', S.contacts.some(c => c.outOfTown), 'plan'],
    ['meet', 'Choose all three meeting points', S.meet.every(m => m.desc && !m.desc.startsWith('e.g.')), 'plan'],
    ['homeset', 'Check the car socket voltage & set the family radio channel', S.home.carVolts !== 'unknown' && !!S.home.radioCh, 'plan'],
    ['maps', 'Save maps for offline use', S.saved.maps.length > 0, 'map'],
    ['layers', 'Download emergency map data (tsunami zones, hospitals…)', !!S.meta.layersAt, 'data'],
    ['kit', 'Go through the supplies list', Object.keys(S.supplies.have).length >= 15, 'kit'],
    ['sources', 'Add at least 5 suppliers / contacts for food and essentials', S.sources.length >= 5, 'sources'],
    ['backup', 'Back up in the last 30 days', daysSince(S.meta.lastBackup) <= 30, 'data'],
    ['install', 'Add this app to the home screen on every phone', isInstalled() || !!S.manual.install, 'data'],
    ['print', 'Make the A4 pack and keep a printed copy with the grab bags', !!S.manual.print, 'pack', true],
    ['practise', 'Practise the plan together (every 6 months)', S.manual.practise && daysSince(S.manual.practise) < 183, 'g:drills', true],
    ['away', AW() + ': crew-bag kit packed & Safety Tips app installed', !!S.manual.away, 'g:away-kit', true],
  ];
}
function readinessItems() {
  const ov = S.manual.ovr || {};
  return readiness().map(i => { const k = i[0]; const auto = i[4] ? null : i[2]; const v = k in ov ? ov[k] : i[2]; return [k, i[1], v, i[3], true, auto]; });
}
function vNow(main) {
  const items = readinessItems(); const done = items.filter(i => i[2]).length;
  const T = tokens();
  const sc = allGuides().filter(g => g.cat === 'scenario');
  const expiring = expiringItems(45);
  const phones = [...S.people.filter(p => p.phone).map(p => ({ name: p.name, sub: p.role, phone: p.phone })), ...S.contacts.filter(c => c.phone).map(c => ({ name: c.name, sub: c.rel, phone: c.phone }))].slice(0, 10);
  main.innerHTML = `
  <button class="searchbar" data-go="search" aria-label="Search everything">🔍 <span>Search everything — e.g. "water", "eggs", "burns"</span></button>
  <a class="call111" href="tel:111">📞 Call 111</a>
  <div class="card" style="padding-bottom:4px"><h2 style="margin-bottom:10px">What's happening?</h2>
  <div class="sos">${sc.map(s => `<button style="background:${s.colour || '#b91c1c'}" data-go="g:${s.id}"><span class="i">${s.icon}</span><b>${esc(guideTitle(s, T))}</b></button>`).join('')}
  <button style="background:#0e7490" data-go="g:away-general"><span class="i">✈️</span><b>${esc(AW())} is overseas</b></button>
  <button style="background:#6d28d9" data-go="g:car-power"><span class="i">⚡</span><b>Power cut at home</b></button></div></div>
  ${expiring.length || (S.meta.changed > S.meta.lastBackup && daysSince(S.meta.lastBackup) > 30) ? `<div class="card">${expiring.length ? `<div class="note" style="margin-bottom:8px">⏰ <b>${expiring.length} supply item${expiring.length > 1 ? 's' : ''}</b> near the use-by date: ${expiring.slice(0, 4).map(e => esc(e.name)).join(', ')}${expiring.length > 4 ? '…' : ''} <a href="#" data-go="kit">Check</a></div>` : ''}${S.meta.changed > S.meta.lastBackup && daysSince(S.meta.lastBackup) > 30 ? `<div class="note">💾 Changes not backed up${S.meta.lastBackup ? ' since ' + fmtDate(S.meta.lastBackup) : ''}. <a href="#" data-go="data">Back up now</a></div>` : ''}</div>` : ''}
  <div class="grid2">
   <div class="card"><h2>Where we meet</h2>
    <ul class="list">${S.meet.map(m => `<li><div class="grow"><b>${esc(m.label)}</b><div class="${m.desc.startsWith('e.g.') ? 'muted small' : ''}">${esc(m.desc)}</div></div>${m.lat ? `<button class="btn sm" data-showmeet="${m.id}">Map</button>` : ''}</li>`).join('')}</ul>
    <div class="small" style="margin-top:6px"><b>If we can't reach each other:</b> ${esc(S.rules.pickup)}</div>
    ${S.home.radioCh ? `<div class="small" style="margin-top:6px"><b>📡 Radio:</b> ${esc(S.home.radioCh)}</div>` : ''}</div>
   <div class="card"><h2>Our people</h2>
    ${phones.length ? `<div class="numbers">${phones.map(c => `<a href="${telHref(c.phone)}"><span>${esc(c.name)}${c.sub ? ` <span class="muted small">· ${esc(c.sub)}</span>` : ''}</span><b>${esc(c.phone)}</b></a>`).join('')}</div>` : `<div class="empty">No numbers yet. <a href="#" data-go="plan">Add family and contacts</a></div>`}</div>
  </div>
  <div class="grid2">
   <div class="card"><h2>Key numbers</h2><div class="numbers">${NUMBERS.map(n => `<a href="${telHref(n.n)}"><span>${esc(n.label)}</span><b>${esc(n.n)}</b></a>`).join('')}</div></div>
   <div class="card"><h2>📻 Radio</h2><table>${RADIO.map(r => `<tr><td><b>${r[0]}</b><div class="small muted">${r[2]}</div></td><td>${r[1]}</td></tr>`).join('')}</table>
   <p class="small muted" style="margin-bottom:0">Car radio works too. Text instead of calling — texts get through when calls don't.</p></div>
  </div>
  <div class="card"><h2>How ready are we?</h2>
   <div class="row"><b>${done} of ${items.length}</b><span class="muted small">done</span></div>
   <div class="ready-bar"><i style="width:${Math.round(done / items.length * 100)}%"></i></div>
   ${items.map(i => `<div class="check"><span class="tick ${i[2] ? 'on' : ''}" ${i[4] ? `data-manual="${i[0]}" role="checkbox" aria-checked="${!!i[2]}" tabindex="0"` : ''}>${i[2] ? '✓' : ''}</span><div class="grow">${esc(i[1])}${i[0] === 'practise' && S.manual.practise ? ` <span class="small muted">(last ${fmtDate(S.manual.practise)})</span>` : ''}</div>${!i[2] && i[3] ? `<button class="btn sm ghost" data-go="${i[3]}">Do it</button>` : ''}</div>`).join('')}
  </div>
  <p class="small muted" style="text-align:center">Everything you type is stored only on this device and works with no internet.<br>Version ${APP_VERSION}</p>`;
  $$('[data-manual]', main).forEach(el => el.onclick = () => {
    const k = el.dataset.manual; const it = items.find(i => i[0] === k); const now = !it[2];
    S.manual.ovr = S.manual.ovr || {};
    if (k === 'practise') { S.manual.practise = now ? Date.now() : 0; delete S.manual.ovr[k]; }
    else if (['print', 'away'].includes(k)) { S.manual[k] = now; delete S.manual.ovr[k]; }
    else if (it[5] === now) delete S.manual.ovr[k]; else S.manual.ovr[k] = now;
    persist(); vNow(main);
  });
  $$('[data-showmeet]', main).forEach(b => b.onclick = () => { const m = S.meet.find(x => x.id === b.dataset.showmeet); MAPFOCUS = [m.lat, m.lon, 16]; go('map'); });
}

// ---------------------------------------------------------------------------
// GUIDES list
// ---------------------------------------------------------------------------
function guideTile(g, T) { return `<button class="gtile" data-go="g:${g.id}"><span class="gi">${g.icon || '📄'}</span><span class="gt"><span class="gn">${esc(guideTitle(g, T))}${g.edited ? ' <span class="pill">edited</span>' : ''}${!g.builtin ? ' <span class="pill ok">ours</span>' : ''}</span><span class="gs">${esc(fill(g.one || '', T)).slice(0, 110)}</span></span></button>`; }
function vGuides(main) {
  const T = tokens(); const list = allGuides();
  const byCat = {}; list.forEach(g => (byCat[g.cat] = byCat[g.cat] || []).push(g));
  const hiddenCount = Object.keys(S.hiddenG).filter(k => S.hiddenG[k]).length;
  main.innerHTML = `
  <button class="searchbar" data-go="search">🔍 <span>Search all guides, contacts and supplies…</span></button>
  <div class="row" style="margin-bottom:12px"><button class="btn primary" id="newG">＋ New guide</button><button class="btn" data-go="pack">📄 A4 pack</button><button class="btn" data-go="tool:power">🧮 Power calculator</button>${hiddenCount ? `<button class="btn ghost" id="unhide">Show ${hiddenCount} hidden</button>` : ''}</div>
  <div class="catjump">${CATS.filter(c => (byCat[c[0]] || []).length || c[0] === 'ours').map(c => `<button class="chip" data-jump="${c[0]}" style="border:0;cursor:pointer">${c[2]} ${esc(c[1].split(' ')[0].replace(/,$/, ''))}</button>`).join('')}</div>
  ${CATS.map(c => { const arr = byCat[c[0]] || []; if (!arr.length && c[0] !== 'ours') return ''; return `<div class="card catcard" id="cat-${c[0]}"><div class="cathead" style="border-color:${c[3]}"><span style="font-size:1.4rem">${c[2]}</span><div class="grow"><h2 style="margin:0">${esc(c[0] === 'away' ? c[1] + ' — ' + AW() : c[1])}</h2><div class="small muted">${esc(c[4])}</div></div></div>
    <div class="gtiles">${arr.map(g => guideTile(g, T)).join('') || '<div class="empty">Nothing here yet — tap <b>＋ New guide</b> to add your own.</div>'}</div></div>`; }).join('')}`;
  $('#newG', main).onclick = () => newGuide();
  $$('[data-jump]', main).forEach(b => b.onclick = () => { const el = $('#cat-' + b.dataset.jump); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  const uh = $('#unhide', main); if (uh) uh.onclick = () => { S.hiddenG = {}; persist(); vGuides(main); };
}
function vCat(main, id) { go('guides', false); }

// ---------------------------------------------------------------------------
// ONE GUIDE
// ---------------------------------------------------------------------------
const TICKS = {};
let SHOWQ = null;
function timeIn(tz, d = new Date()) { try { return d.toLocaleTimeString('en-NZ', { timeZone: tz, hour: 'numeric', minute: '2-digit', weekday: 'short' }); } catch (e) { return ''; } }
function checkinIn(tz) {
  const [hh, mm] = (S.household.checkin || '19:00').split(':').map(Number); const now = new Date();
  const p = new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now).reduce((o, x) => (o[x.type] = x.value, o), {});
  return timeIn(tz, new Date(now.getTime() + ((hh * 60 + mm) - ((+p.hour % 24) * 60 + +p.minute)) * 60000));
}
function vGuide(main, arg) {
  const [id, qs] = arg.split('?'); const g = getGuide(id); if (!g) return go('guides');
  const q = qs ? decodeURIComponent(qs).split(/\s+/).map(norm).filter(Boolean) : (SHOWQ || null); SHOWQ = null;
  const T = tokens(); const c = catOf(g); const colour = g.colour || c.colour;
  const secs = sections(expandTokens(g.body, T)); TICKS[g.id] = TICKS[g.id] || {};
  const opts = { T, q };
  const away = g.zones ? `<div class="card note">🕐 ${g.zones.map(z => `${esc(z[0])}: <b>${timeIn(z[1])}</b>`).join(' · ')} · Home (NZ): <b>${timeIn('Pacific/Auckland')}</b><br>📲 Daily check-in ${esc(S.household.checkin)} NZ time = <b>${checkinIn(g.zones[0][1])}</b> in ${esc(g.zones[0][0].split('·')[0].trim())}.</div>` : '';
  main.innerHTML = `
  <div class="gnav"><button class="btn sm ghost" data-go="guides">← Guides</button><span class="grow"></span><button class="btn sm ghost" data-go="search">🔍</button></div>
  <div class="sc-head" style="background:${colour}"><div class="small" style="opacity:.85">${c.icon} ${esc(c.name)}</div><div class="row" style="align-items:flex-start"><span style="font-size:2rem;line-height:1.2">${g.icon || '📄'}</span><h1 class="grow" style="margin:0">${esc(guideTitle(g, T))}</h1></div>${g.one ? `<div class="one">${inline(fill(g.one, T))}</div>` : ''}</div>
  ${away}
  ${secs.map((s, si) => `<section class="card gsec" id="sec${si}">${s.title ? `<div class="sechead"><h2>${inline(fill(s.title, T), opts)}</h2><button class="btn sm ghost secedit" data-sec="${si}" aria-label="Edit this section">✏️</button></div>` : `<div class="sechead" style="justify-content:flex-end;margin-bottom:-6px"><button class="btn sm ghost secedit" data-sec="${si}" aria-label="Edit">✏️</button></div>`}
    ${renderBlocks(blocks(s.lines), g, opts)}
    <details class="addline"><summary>＋ Add to this section</summary>
      <div class="row" style="margin-top:8px"><select class="alType" style="flex:0 0 auto;width:auto"><option value="1. ">Step</option><option value="- ">Point</option><option value="[ ] ">Tick-box</option><option value="> ">Note</option><option value="! ">Warning</option><option value="+ ">Tip</option></select>
      <input type="text" class="alText grow" style="flex:1" placeholder="Type it here…"><button class="btn sm primary alAdd" data-sec="${si}">Add</button></div></details>
  </section>`).join('')}
  <div class="card"><div class="row"><button class="btn primary" id="addNote">📝 Add a note</button><button class="btn" id="editG">✏️ Edit whole guide</button><button class="btn ghost" id="addSec">＋ New section</button><span class="grow"></span><button class="btn ghost" id="clrTicks">Clear ticks</button></div>
  <div class="small muted" style="margin-top:8px">${g.builtin ? (g.edited ? 'You\'ve edited this guide. <a href="#" id="resetG">Reset to the original</a> · ' : '') + '<a href="#" id="hideG">Hide this guide</a>' : 'Our own guide · <a href="#" id="delG" style="color:var(--accent)">Delete it</a>'}</div></div>`;
  // ticks
  $$('.tick[data-step]', main).forEach(t => t.onclick = () => { const k = t.dataset.step; TICKS[g.id][k] = !TICKS[g.id][k]; t.classList.toggle('on'); t.textContent = TICKS[g.id][k] ? '✓' : ''; t.closest('li').classList.toggle('done'); });
  $$('.tick[data-check]', main).forEach(t => t.onclick = () => { const k = t.dataset.check; S.ticks[g.id] = S.ticks[g.id] || {}; S.ticks[g.id][k] = !S.ticks[g.id][k]; persist(); t.classList.toggle('on'); t.textContent = S.ticks[g.id][k] ? '✓' : ''; t.closest('li').classList.toggle('done'); });
  $('#clrTicks', main).onclick = () => { TICKS[g.id] = {}; S.ticks[g.id] = {}; persist(); vGuide(main, arg); };
  // edits
  $$('.secedit', main).forEach(b => b.onclick = () => editSection(g, +b.dataset.sec));
  $$('.alAdd', main).forEach(b => b.onclick = () => { const box = b.closest('.addline'); const txt = $('.alText', box).value.trim(); if (!txt) return; addLine(g, +b.dataset.sec, $('.alType', box).value + txt); });
  $$('.alText', main).forEach(inp => inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); inp.closest('.addline').querySelector('.alAdd').click(); } });
  $('#addNote', main).onclick = () => formModal('Add a note', [{ k: 't', label: 'Note', type: 'textarea', ph: 'e.g. The toby key is in the garage drawer.' }], {}, v => { if (!v.t) return false; addNote(g, v.t); });
  $('#editG', main).onclick = () => editGuide(g);
  $('#addSec', main).onclick = () => formModal('New section', [{ k: 'title', label: 'Section heading' }, { k: 'body', label: 'Content', type: 'textarea', rows: 8, help: FORMAT_HELP_SHORT }], {}, v => { if (!v.title) return false; setBody(g, g.body + '\n## ' + v.title + '\n' + (v.body || '')); });
  const rg = $('#resetG', main); if (rg) rg.onclick = e => { e.preventDefault(); confirmTwice(rg, 'Tap again to reset', () => { delete S.gx[g.id]; persist(); toast('Back to the original'); vGuide(main, arg); }); };
  const hg = $('#hideG', main); if (hg) hg.onclick = e => { e.preventDefault(); S.hiddenG[g.id] = 1; persist(); toast('Hidden — "Show hidden" on the Guides page brings it back'); go('guides'); };
  const dg = $('#delG', main); if (dg) dg.onclick = e => { e.preventDefault(); confirmTwice(dg, 'Tap again to delete', () => { S.gnew = S.gnew.filter(x => x.id !== g.id); persist(); go('guides'); }); };
  if (q && q.length) { const m = $('mark', main); if (m) setTimeout(() => m.scrollIntoView({ block: 'center' }), 50); }
}
const FORMAT_HELP_SHORT = 'One item per line. Start a line with <b>1.</b> for a step, <b>-</b> for a point, <b>[ ]</b> for a tick-box, <b>!</b> for a warning, <b>&gt;</b> for a note, <b>+</b> for a tip. <b>**bold**</b>.';
const FORMAT_HELP = `<details class="small"><summary><b>How to format</b></summary><table style="margin-top:6px">
<tr><td><code>## Heading</code></td><td>New section</td></tr><tr><td><code>### Sub-heading</code></td><td>Small heading</td></tr>
<tr><td><code>1. Do this</code></td><td>Numbered step (tickable)</td></tr><tr><td><code>- A point</code></td><td>Bullet point</td></tr>
<tr><td><code>[ ] An item</code></td><td>Tick-box (remembered)</td></tr><tr><td><code>! Careful</code></td><td>Red warning box</td></tr>
<tr><td><code>&gt; Note</code></td><td>Blue note box</td></tr><tr><td><code>+ It's right when…</code></td><td>Green tip box</td></tr>
<tr><td><code>| A | B |</code></td><td>Table row (first row = headings)</td></tr><tr><td><code>**bold**</code> <code>*italic*</code></td><td>Emphasis</td></tr>
<tr><td><code>[[egg]]</code> or <code>[[egg|the Egg]]</code></td><td>Link to another guide</td></tr><tr><td><code>{{car}}</code> <code>{{people}}</code></td><td>Filled in from Our plan</td></tr></table></details>`;
function setBody(g, body, extra = {}) {
  if (g.builtin) S.gx[g.id] = Object.assign({}, S.gx[g.id] || {}, { body }, extra);
  else { const u = S.gnew.find(x => x.id === g.id); Object.assign(u, { body }, extra); }
  persist(); render();
}
function addLine(g, si, line) {
  const lines = g.body.split('\n'); const s = sections(g.body)[si];
  let at = s.end; while (at > s.start && !lines[at].trim()) at--;
  lines.splice(at + 1, 0, line); setBody(g, lines.join('\n')); toast('Added');
}
function addNote(g, text) {
  const d = new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
  const lines = text.split('\n').map(t => t.trim()).filter(Boolean);
  let body = g.body; const ix = body.search(/^## Our notes\s*$/m);
  const add = lines.map((t, i) => i === 0 ? `- **${d}:** ${t}` : `- ${t}`).join('\n');
  if (ix < 0) body = body + '\n## Our notes\n' + add;
  else { const secs = sections(body); const s = secs.find(x => x.title === 'Our notes'); const L = body.split('\n'); L.splice(s.end + 1, 0, add); body = L.join('\n'); }
  setBody(g, body); toast('Note added');
}
function editSection(g, si) {
  const s = sections(g.body)[si]; const lines = g.body.split('\n');
  const text = lines.slice(s.start, s.end + 1).join('\n');
  modal(`<h2>Edit section</h2>${FORMAT_HELP}<textarea id="secTxt" class="code" rows="14">${esc(text)}</textarea><div class="actions"><button class="btn ghost" id="sdel" style="margin-right:auto;color:var(--accent)">Delete section</button><button class="btn ghost" id="sx">Cancel</button><button class="btn primary" id="ss">Save</button></div>`, (m, close) => {
    $('#sx', m).onclick = close;
    $('#ss', m).onclick = () => { const L = g.body.split('\n'); L.splice(s.start, s.end - s.start + 1, ...$('#secTxt', m).value.replace(/\s+$/, '').split('\n')); setBody(g, L.join('\n').replace(/^\n+/, '')); close(); toast('Saved'); };
    $('#sdel', m).onclick = e => confirmTwice(e.target, 'Tap again to delete', () => { const L = g.body.split('\n'); L.splice(s.start, s.end - s.start + 1); setBody(g, L.join('\n')); close(); });
  }, 'wide');
}
function editGuide(g, isNew) {
  modal(`<h2>${isNew ? 'New guide' : 'Edit guide'}</h2>
   <label class="f">Title</label><input type="text" id="eT" value="${esc(g.title)}">
   <div class="row"><div style="flex:0 0 90px"><label class="f">Icon</label><input type="text" id="eI" value="${esc(g.icon || '📄')}" maxlength="4"></div>
   <div class="grow"><label class="f">Section of the app</label><select id="eC">${CATS.map(c => `<option value="${c[0]}"${g.cat === c[0] ? ' selected' : ''}>${c[2]} ${esc(c[1])}</option>`).join('')}</select></div></div>
   <label class="f">One-line summary (shown at the top)</label><input type="text" id="eO" value="${esc(g.one || '')}">
   <label class="f">Content</label>${FORMAT_HELP}
   <div class="row" style="margin:6px 0"><button class="btn sm" id="eP" type="button">👁 Preview</button></div>
   <textarea id="eB" class="code" rows="18">${esc(g.body)}</textarea><div id="ePrev" class="card" style="display:none"></div>
   <div class="actions"><button class="btn ghost" id="eX">Cancel</button><button class="btn primary" id="eS">Save</button></div>`, (m, close) => {
    $('#eX', m).onclick = close;
    $('#eP', m).onclick = () => { const p = $('#ePrev', m); const on = p.style.display === 'none'; p.style.display = on ? 'block' : 'none'; $('#eB', m).style.display = on ? 'none' : 'block'; $('#eP', m).textContent = on ? '✏️ Back to editing' : '👁 Preview'; if (on) { const tmp = Object.assign({}, g, { body: $('#eB', m).value }); p.innerHTML = sections(expandTokens(tmp.body, tokens())).map(s => `${s.title ? `<h3>${inline(fill(s.title))}</h3>` : ''}${renderBlocks(blocks(s.lines), tmp, { T: tokens() })}`).join(''); } };
    $('#eS', m).onclick = () => {
      const v = { title: $('#eT', m).value.trim() || 'Untitled', icon: $('#eI', m).value.trim() || '📄', cat: $('#eC', m).value, one: $('#eO', m).value.trim(), body: $('#eB', m).value.replace(/\s+$/, '') };
      if (isNew) { const ng = Object.assign({ id: 'u-' + uid() }, v); S.gnew.push(ng); persist(); close(); go('g:' + ng.id); return; }
      if (g.builtin) S.gx[g.id] = v; else Object.assign(S.gnew.find(x => x.id === g.id), v);
      persist(); close(); render(); toast('Saved');
    };
  }, 'wide');
}
function newGuide(cat) { editGuide({ title: '', icon: '📝', cat: cat || 'ours', one: '', body: '## What to do\n1. First step\n1. Second step\n\n## You\'ll need\n[ ] Item\n\n## Notes\n- ' }, true); }

// ---------------------------------------------------------------------------
// SEARCH — everything
// ---------------------------------------------------------------------------
let SEARCH_INDEX = null;
const SYN = { power: ['electricity', 'electric'], electricity: ['power'], petrol: ['fuel'], fuel: ['petrol', 'gas'], loo: ['toilet'], toilet: ['loo'], eggs: ['egg'], chicken: ['chickens', 'hens', 'poultry'], hens: ['chickens'], meat: ['protein'], protein: ['meat', 'beans'], kids: ['children', 'child', 'daughter'], children: ['kids', 'child'], quake: ['earthquake'], earthquake: ['quake'], phone: ['phones', 'mobile'], doctor: ['gp', 'medical'], medicine: ['medicines', 'pills', 'prescription'], fire: ['fires', 'firelighting'], radio: ['radios', 'walkie'], walkie: ['radio'], cooking: ['cook', 'cooker'], bread: ['damper', 'flatbread'] };
function buildIndex() {
  const T = tokens(); const idx = [];
  allGuides().forEach(g => {
    const title = guideTitle(g, T); const secs = sections(expandTokens(g.body, T));
    idx.push({ kind: 'guide', g, title, one: fill(g.one || '', T), ntitle: norm(title), none: norm(fill(g.one || '', T)),
      lines: secs.flatMap(s => [{ t: s.title, i: s.start, sec: true }].concat(s.lines.filter(l => l.t.trim()).map(l => ({ t: fill(stripMark(l.t, lineType(l.t)), T), i: l.i })))).filter(l => l.t).map(l => Object.assign(l, { n: norm(l.t) })) });
  });
  const add = (kind, title, sub, goTo, extra) => idx.push({ kind, title, sub, goTo, n: norm([title, sub, extra].join(' ')) });
  S.people.forEach(p => add('person', p.name, [p.role, p.phone].filter(Boolean).join(' · '), 'plan', [p.medical, p.meds, p.allergies, p.notes].join(' ')));
  S.contacts.forEach(c => add('contact', c.name, [c.rel, c.phone].filter(Boolean).join(' · '), 'plan', [c.notes, c.phone2].join(' ')));
  S.sources.forEach(s => { const c = SOURCE_CATS.find(x => x[0] === s.cat); add('supplier', s.name, [c ? c[2] : '', s.supplies, s.phone].filter(Boolean).join(' · '), 'sources', [s.notes, s.address, s.trade].join(' ')); });
  supplyItems().forEach(it => add('supply', it.name, it.group + (S.supplies.have[it.key] ? ' · ✓ have' : ' · still need'), 'kit', S.supplies.note[it.key] || ''));
  S.points.forEach(p => add('place', p.name, p.note || '', 'map', ''));
  S.docs.forEach(d => add('document', d.name, 'Document / photo', 'plan', ''));
  SEARCH_INDEX = idx; return idx;
}
function search(q) {
  const words = norm(q).split(/[^a-z0-9]+/).filter(w => w.length > 1); if (!words.length) return [];
  const expand = w => [w].concat(SYN[w] || []);
  const groups = words.map(expand);
  const idx = SEARCH_INDEX || buildIndex(); const res = [];
  for (const e of idx) {
    if (e.kind === 'guide') {
      const all = e.ntitle + ' ' + e.none + ' ' + e.lines.map(l => l.n).join(' ');
      if (!groups.every(gr => gr.some(w => all.includes(w)))) continue;
      let score = 0; groups.forEach(gr => { if (gr.some(w => e.ntitle.includes(w))) score += 20; if (gr.some(w => e.none.includes(w))) score += 6; });
      const hits = e.lines.map(l => ({ l, s: groups.filter(gr => gr.some(w => l.n.includes(w))).length + (l.sec ? 0.5 : 0) })).filter(h => h.s >= 1).sort((a, b) => b.s - a.s);
      score += Math.min(hits.length, 10) + (hits[0] ? hits[0].s * 3 : 0);
      res.push({ e, score, hits: hits.slice(0, 3) });
    } else {
      if (!groups.every(gr => gr.some(w => e.n.includes(w)))) continue;
      res.push({ e, score: 15 + (groups.every(gr => gr.some(w => norm(e.title).includes(w))) ? 10 : 0) });
    }
  }
  return res.sort((a, b) => b.score - a.score);
}
let LASTQ = '';
function vSearch(main) {
  main.innerHTML = `<div class="searchwrap"><input type="search" id="sq" placeholder="Search everything…" value="${esc(LASTQ)}" autocomplete="off" enterkeyhint="search"></div>
  <div class="row small" style="margin:-4px 0 10px;flex-wrap:wrap">${['water', 'protein', 'eggs', 'burns', 'power cut', 'tsunami', 'toilet', 'radio', 'bread', 'fishing'].map(w => `<button class="chip" data-w="${w}" style="border:0;cursor:pointer">${w}</button>`).join('')}</div>
  <div id="sres"></div>`;
  const inp = $('#sq', main); const out = $('#sres', main);
  const run = () => {
    LASTQ = inp.value; const q = inp.value.trim();
    if (!q) { out.innerHTML = '<div class="empty">Type a word or two. Searches every guide, step, note, contact, supplier and supply.</div>'; return; }
    const r = search(q); const words = norm(q).split(/[^a-z0-9]+/).filter(w => w.length > 1); const qq = words.flatMap(w => [w].concat(SYN[w] || []));
    if (!r.length) { out.innerHTML = `<div class="empty">Nothing found for "${esc(q)}". Try a simpler word.</div>`; return; }
    const KIND = { person: '👤 Family', contact: '📞 Contact', supplier: '🤝 Supplier', supply: '🎒 Supplies', place: '📍 Place', document: '📄 Document' };
    out.innerHTML = `<div class="small muted" style="margin-bottom:6px">${r.length} result${r.length > 1 ? 's' : ''}</div>` + r.slice(0, 60).map(x => {
      if (x.e.kind === 'guide') { const g = x.e.g; const c = catOf(g);
        return `<a class="sres" href="#" data-go="g:${g.id}?${encodeURIComponent(q)}"><div class="small muted">${c.icon} ${esc(c.name)}</div><div class="st">${g.icon || ''} ${highlight(esc(x.e.title), qq)}</div>${x.hits.map(h => `<div class="ss">${highlight(esc(h.l.t.replace(/\*\*/g, '').slice(0, 180)), qq)}</div>`).join('')}</a>`; }
      return `<a class="sres" href="#" data-go="${x.e.goTo}"><div class="small muted">${KIND[x.e.kind] || ''}</div><div class="st">${highlight(esc(x.e.title), qq)}</div><div class="ss">${highlight(esc(x.e.sub || ''), qq)}</div></a>`;
    }).join('');
  };
  inp.oninput = run; $$('[data-w]', main).forEach(b => b.onclick = () => { inp.value = b.dataset.w; run(); });
  run(); setTimeout(() => inp.focus(), 50);
}

// ---------------------------------------------------------------------------
// TOOLS: power calculator
// ---------------------------------------------------------------------------
const APPLIANCES = [
  ['Fridge', 150, 50, 900, 'Cycles on and off. Uses most power just after it starts.'], ['Chest freezer', 120, 40, 700, 'Keep it full and shut.'],
  ['Fridge-freezer (large)', 200, 70, 1200, ''], ['LED lights (×4)', 40, 40, 40, ''], ['Phone charging (×4)', 40, 40, 40, ''], ['Laptop', 60, 60, 60, ''],
  ['Wi-Fi router + fibre box', 25, 25, 25, 'Only useful if the internet still works.'], ['TV', 100, 100, 100, ''], ['Walkie-talkie chargers', 20, 20, 20, ''],
  ['Rice cooker', 700, 700, 700, 'About 30–40 minutes per batch.'], ['Slow cooker (low)', 200, 200, 200, 'Very efficient way to cook.'],
  ['Induction hob (medium)', 1200, 1200, 1200, 'Fine at medium. Full power may trip the limit.'], ['Microwave', 1200, 1200, 1500, 'Short bursts only.'],
  ['Electric frying pan', 1500, 1500, 1500, ''], ['Electric blanket', 80, 80, 80, 'Cheapest way to stay warm at night.'], ['CPAP / medical device', 60, 60, 60, ''],
  ['Small fan heater (low)', 1000, 1000, 1000, 'Uses the battery fast — avoid.'], ['Kettle', 2200, 2200, 2200, 'Too much — boil water on gas instead.'],
];
const PSEL = {};
function vTool(main, which) {
  if (which !== 'power') return go('guides');
  const h = S.home, outlet = Number(h.carOutlet) || 1500, kwh = Number(h.carKwh) || 0;
  const sel = APPLIANCES.filter((a, i) => PSEL[i]);
  const run = sel.reduce((t, a) => t + a[1], 0), avg = sel.reduce((t, a) => t + a[2], 0), surge = sel.reduce((t, a) => Math.max(t, a[3] - a[1]), 0) + run;
  const hours = kwh && avg ? (kwh * 0.8 * 1000) / avg : 0;
  main.innerHTML = `<div class="gnav"><button class="btn sm ghost" data-go="g:car-power">← Power cut guide</button></div><div class="card"><h1>🧮 Power calculator</h1>
  ${h.carVolts === '100' ? '<div class="warn small">Our sockets are 100 V — run everything through the step-up transformer.</div>' : h.carVolts !== '230' ? '<div class="warn small">Check the car socket voltage first — see the Power cut guide.</div>' : ''}
  <p>Tick what you want to run from <b>${esc(h.car)}</b> at the same time. Socket limit: <b>${outlet} W</b>. Battery: <b>${kwh || '?'} kWh</b>. <a href="#" id="pe">Change</a></p>
  <ul class="list">${APPLIANCES.map((a, i) => `<li><span class="tick ${PSEL[i] ? 'on' : ''}" data-i="${i}" role="checkbox" aria-checked="${!!PSEL[i]}" tabindex="0">${PSEL[i] ? '✓' : ''}</span><div class="grow"><b>${esc(a[0])}</b> <span class="muted small">${a[1]} W</span>${a[4] ? `<div class="small muted">${esc(a[4])}</div>` : ''}</div></li>`).join('')}</ul></div>
  <div class="card stickybottom">${sel.length ? `<div><b>${run.toLocaleString()} W</b> if all on at once <span class="pill ${run > outlet ? 'bad' : run > outlet * .8 ? 'warn' : 'ok'}">${run > outlet ? 'Too much — will trip' : run > outlet * .8 ? 'Close to the limit' : 'OK'}</span></div>
  ${surge > outlet && run <= outlet ? `<div class="small" style="color:var(--warn)">Start-up surge may reach ~${surge.toLocaleString()} W — switch things on one at a time.</div>` : ''}
  <div style="margin-top:6px">About <b>${(avg * 24 / 1000).toFixed(1)} kWh a day</b>.${hours ? ` The battery alone lasts about <b>${hours >= 48 ? (hours / 24).toFixed(1) + ' days' : Math.round(hours) + ' hours'}</b>, then the engine recharges it.` : ''}</div>` : '<div class="muted">Tick some appliances above.</div>'}</div>`;
  $$('.tick[data-i]', main).forEach(t => t.onclick = () => { PSEL[t.dataset.i] = !PSEL[t.dataset.i]; vTool(main, which); });
  $('#pe', main).onclick = e => { e.preventDefault(); editHome(); };
}
