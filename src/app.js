// ============================================================================
// FAMILY READY — offline emergency app. All data stays on this device.
// ============================================================================
'use strict';
const APP_VERSION = '2026-10-29';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const clone = o => JSON.parse(JSON.stringify(o));
const telHref = n => 'tel:' + String(n).replace(/[^0-9+]/g, '');
const fmtDate = t => t ? new Date(t).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const daysSince = t => t ? Math.floor((Date.now() - t) / 864e5) : Infinity;
const MB = b => (b / 1048576).toFixed(b > 1048576 * 10 ? 0 : 1) + ' MB';

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
      rq.onerror = () => res(false);
      rq.onblocked = () => res(false);
    } catch (e) { res(false); }
  });
}
function tx(store, mode, fn) {
  if (!DB) return Promise.resolve(fn(null));
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
  keys: st => DB ? tx(st, 'readonly', s => s.getAllKeys()) : Promise.resolve([...MEM[st].keys()]),
  has: (st, k) => DB ? tx(st, 'readonly', s => s.getKey(k)).then(x => x !== undefined) : Promise.resolve(MEM[st].has(k)),
  clear: st => DB ? tx(st, 'readwrite', s => s.clear()) : Promise.resolve(MEM[st].clear()),
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const DEFAULT_STATE = () => ({
  v: 1,
  household: { name: 'Our family', address: '', awayName: '', homeName: '', people: 3, days: 7, checkin: '19:00', backupAdult: '', backupPhone: '', homeLat: null, homeLon: null },
  people: [],
  contacts: [],
  meet: [
    { id: 'm1', label: '1 · Just outside home', desc: 'e.g. the letterbox / front lawn — if we have to get out of the house', lat: null, lon: null },
    { id: 'm2', label: '2 · In our neighbourhood', desc: 'e.g. a park, school or church nearby — if home isn\'t safe or we can\'t get there', lat: null, lon: null },
    { id: 'm3', label: '3 · Out of the area', desc: 'e.g. a friend\'s or relative\'s house in another suburb or town — if we have to leave Auckland', lat: null, lon: null },
  ],
  rules: { pickup: 'Whoever is closest collects our daughter from school. If we can\'t reach each other, everyone goes home. If home isn\'t safe, meet at meeting point 2.', school: '', radioCh: '', note: '' },
  home: clone(HOME_DEFAULTS),
  docs: [],
  supplies: { have: {}, expiry: {}, note: {}, custom: [], hidden: {} },
  grab: {},
  awayKit: {},
  sources: [],
  points: [],
  manual: {},
  saved: { maps: [] },
  set: { linzKey: '', base: 'topo', layers: { H: 1, U: 1, P: 1, F: 1, L: 1, M: 1, A: 1, C: 0, tsunami: 1, meet: 1, mine: 1, sources: 1 }, theme: 'auto' },
  meta: { created: Date.now(), changed: 0, lastBackup: 0 },
});
let S = DEFAULT_STATE();
let saveTimer = null;
function migrate() {
  const d = DEFAULT_STATE();
  for (const k of Object.keys(d)) if (S[k] === undefined) S[k] = d[k];
  for (const k of ['household', 'rules', 'home', 'supplies', 'set', 'meta', 'saved']) S[k] = Object.assign({}, d[k], S[k] || {});
  S.set.layers = Object.assign({}, d.set.layers, S.set.layers || {});
  S.home = Object.assign({}, HOME_DEFAULTS, S.home);
}
function persist(changed = true) {
  if (changed) S.meta.changed = Date.now();
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
// UI helpers
// ---------------------------------------------------------------------------
function toast(msg, ms = 3500) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
function modal(html, onMount) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg) close(); });
  document.body.appendChild(bg);
  function close() { bg.remove(); }
  if (onMount) onMount(bg.firstElementChild, close);
  return close;
}
// fields: [{k,label,type,help,options,ph}]
function formModal(title, fields, values, onSave, opts = {}) {
  const f = fields.map(fl => {
    const v = values[fl.k] == null ? '' : values[fl.k];
    let input;
    if (fl.type === 'textarea') input = `<textarea id="f_${fl.k}" placeholder="${esc(fl.ph || '')}">${esc(v)}</textarea>`;
    else if (fl.type === 'select') input = `<select id="f_${fl.k}">${fl.options.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}"${String(val) === String(v) ? ' selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
    else if (fl.type === 'check') input = `<label class="row"><input type="checkbox" id="f_${fl.k}"${v ? ' checked' : ''}> ${esc(fl.ph || '')}</label>`;
    else input = `<input type="${fl.type || 'text'}" id="f_${fl.k}" value="${esc(v)}" placeholder="${esc(fl.ph || '')}"${fl.type === 'number' ? ' inputmode="decimal" step="any"' : ''}>`;
    return `<label class="f" for="f_${fl.k}">${esc(fl.label)}</label>${fl.help ? `<div class="small muted" style="margin:-2px 0 4px">${fl.help}</div>` : ''}${input}`;
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
    const first = $('input,textarea,select', m); if (first && window.innerWidth > 700) first.focus();
  });
}
function confirmTwice(btn, label, fn) {
  if (btn.dataset.armed) { fn(); return; }
  btn.dataset.armed = '1'; const old = btn.textContent; btn.textContent = label;
  setTimeout(() => { if (btn.isConnected) { btn.textContent = old; delete btn.dataset.armed; } }, 4000);
}
const AW = () => S.household.awayName || 'Mum';
const HA = () => S.household.homeName || 'Dad';
function fill(str) {
  const h = S.home;
  const tankTotal = (Number(h.tankL) || 0) * (Number(h.tankCount) || 1);
  const ppl = Number(S.household.people) || 3;
  const tok = {
    away: esc(AW()), homeAdult: esc(HA()), Car: esc((h.car || 'our PHEV').replace(/^./, c => c.toUpperCase())),
    car: esc(h.car || 'our PHEV'), carOutlet: esc(h.carOutlet || 2000), carKwh: esc(h.carKwh || '?'),
    carNotes: h.carNotes ? esc(h.carNotes) : '',
    voltsLine: h.carVolts === '230' ? '' : h.carVolts === '100' ? `<div class="warn"><b>Our car's socket is 100 volts (Japanese).</b> New Zealand appliances are made for 230 volts. Plugged straight in, a fridge or freezer can be damaged and most things won't work properly. Only use the socket through our <b>step-up transformer</b> (100 V → 230 V, rated at least 1,500 W). ${h.carNotes ? '' : 'Add how ours is set up in Our plan → Our home.'}</div>` : `<div class="warn"><b>Check the label on the car's power socket.</b> Many Outlander PHEVs in NZ are Japanese imports with a <b>100 volt</b> socket. NZ appliances need <b>230 volts</b> — a fridge plugged straight into 100 V can be damaged. If it says 100 V, you need a step-up transformer (100 V → 230 V, at least 1,500 W). Then set the voltage in Our plan → Our home.</div>`,
    radios: esc(h.radios || 'walkie-talkies'), radioCh: esc(h.radioCh || S.rules.radioCh || '(not set yet — add in Our plan → Our home)'), radioNotes: h.radioNotes ? `<p>${esc(h.radioNotes)}</p>` : '',
    inverterLine: h.inverterSocket === 'yes' ? `<br><br><b>Good news:</b> our inverter${h.inverter ? ' (' + esc(h.inverter) + ')' : ''} has an emergency power socket. On a sunny day it can give a small amount of power (enough to charge phones, run a fridge on and off) — only while the sun is on the panels.` : h.inverterSocket === 'no' ? '' : `<br><br>Some inverters have a daytime emergency power socket. ${h.inverter ? 'Check the manual for the ' + esc(h.inverter) + '.' : 'Check the inverter label and add its model in Our plan → Our home.'}`,
    tankLine: tankTotal ? `(<b>${tankTotal.toLocaleString()} litres</b> when full)` : '',
    tankDays: tankTotal ? `A full ${tankTotal.toLocaleString()} L of tank water gives the ${ppl} of us about <b>${Math.floor(tankTotal / (ppl * 20))} days at 20 L each per day</b>, or <b>${Math.floor(tankTotal / (ppl * 3))} days at the bare minimum of 3 L each</b>.` : 'Add the tank size in Our plan → Our home systems to see how many days it will last.',
    tapWhere: esc(h.tapWhere || 'the hose tap by the tanks'), tankNotes: h.tankNotes ? `<p>${esc(h.tankNotes)}</p>` : '',
    oven: esc(h.oven || 'the pizza oven'), bbq: esc(h.bbq || 'the Big Green Egg'),
    ovenGasLine: h.ovenGas === 'yes' ? 'It also has a <b>gas burner</b> — that is the easiest way to use it: connect the gas bottle, turn the knob, press the igniter. The wood steps below are for when gas runs out.' : 'It burns wood (and charcoal). These steps are for wood.',
    stoveLine: h.stove ? ` — ${esc(h.stove)}` : ' <span class="pill warn">worth buying</span>',
    gasMeter: esc(h.gasMeter || '(add where it is in Our plan → Our home)'), waterToby: esc(h.waterToby || '(add where it is)'), switchboard: esc(h.switchboard || '(add where it is)'),
  };
  return str.replace(/\{\{(\w+)\}\}/g, (m, k) => tok[k] != null ? tok[k] : m);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const TABS = [['now', '🆘', 'Now'], ['map', '🗺️', 'Map'], ['guides', '📖', 'Guides'], ['plan', '👪', 'Our plan'], ['kit', '🎒', 'Supplies'], ['sources', '🤝', 'Contacts']];
let ROUTE = 'now';
function go(r, push = true) {
  if (!r) r = 'now';
  if (r === 'tab:supplies') r = 'kit';
  if (r.startsWith('tab:')) r = r.slice(4);
  ROUTE = r;
  if (push) { try { history.pushState({ r }, '', '#' + r); } catch (e) {} }
  render();
  window.scrollTo(0, 0);
}
window.addEventListener('popstate', e => { ROUTE = (e.state && e.state.r) || (location.hash.slice(1) || 'now'); render(); });
document.addEventListener('click', e => {
  const a = e.target.closest('[data-go]');
  if (a) { e.preventDefault(); go(a.dataset.go); }
});
function render() {
  const main = $('main');
  const top = ROUTE.split(':')[0];
  const tabFor = { sc: 'guides', lib: 'guides', home: 'guides', away: 'guides', tool: 'guides', data: '' }[top] ?? top;
  $$('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tabFor));
  if (top !== 'map') teardownMap();
  main.classList.toggle('mapmode', top === 'map');
  const views = { now: vNow, map: vMap, guides: vGuides, plan: vPlan, kit: vKit, sources: vSources, sc: vScenario, lib: vArticle, home: vHomeGuide, away: vAway, tool: vPower, data: vData };
  (views[top] || vNow)(main, ROUTE.split(':').slice(1).join(':'));
}

// ---------------------------------------------------------------------------
// NOW
// ---------------------------------------------------------------------------
function readiness() {
  const h = S.household;
  const items = [
    ['people', 'Add everyone in the family (with medical notes)', S.people.length > 0, 'plan'],
    ['contacts', 'Add key contacts, including one outside Auckland', S.contacts.some(c => c.outOfTown), 'plan'],
    ['meet', 'Choose all three meeting points', S.meet.every(m => m.desc && !m.desc.startsWith('e.g.')), 'plan'],
    ['homeset', 'Check the car socket voltage & set the family radio channel', S.home.carVolts !== 'unknown' && !!S.home.radioCh, 'plan'],
    ['maps', 'Save maps for offline use', S.saved.maps.length > 0, 'map'],
    ['layers', 'Download emergency map data (tsunami zones, hospitals…)', !!S.meta.layersAt, 'data'],
    ['kit', 'Go through the supplies list', Object.keys(S.supplies.have).length >= 10, 'kit'],
    ['sources', 'Add at least 3 suppliers / contacts for food and essentials', S.sources.length >= 3, 'sources'],
    ['backup', 'Back up in the last 30 days', daysSince(S.meta.lastBackup) <= 30, 'data'],
    ['install', 'Add this app to the home screen on every phone', isInstalled() || !!S.manual.install, 'data'],
    ['print', 'Print a paper copy and keep it with the grab bags', !!S.manual.print, 'data', true],
    ['practise', 'Practise the plan with our daughter (every 6 months)', S.manual.practise && daysSince(S.manual.practise) < 183, null, true],
    ['away', AW() + ': install Safety Tips (Japan) & check the crew-bag kit', !!S.manual.away, 'away', true],
  ];
  return items;
}
function isInstalled() { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } }
function vNow(main) {
  const items = readiness(); const done = items.filter(i => i[2]).length;
  const expiring = expiringItems(45);
  const contactsWithPhone = [...S.people.filter(p => p.phone), ...S.contacts.filter(c => c.phone)].slice(0, 8);
  main.innerHTML = `
  <a class="call111" href="tel:111">📞 Call 111</a>
  <div class="card" style="padding-bottom:4px"><h2 style="margin-bottom:10px">What's happening?</h2>
  <div class="sos">${SCENARIOS.map(s => `<button style="background:${s.colour}" data-go="sc:${s.id}"><span class="i">${s.icon}</span><b>${esc(s.title)}</b></button>`).join('')}
  <button style="background:#0e7490" data-go="away"><span class="i">✈️</span><b>${esc(AW())} is overseas</b></button>
  <button style="background:#9333ea" data-go="home:h-power"><span class="i">⚡</span><b>Power cut at home</b></button></div></div>
  ${expiring.length || daysSince(S.meta.lastBackup) > 30 && S.meta.changed > S.meta.lastBackup ? `<div class="card">${expiring.length ? `<div class="note" style="margin-bottom:8px">⏰ <b>${expiring.length} supply item${expiring.length > 1 ? 's' : ''}</b> expire${expiring.length > 1 ? '' : 's'} soon: ${expiring.slice(0, 4).map(e => esc(e.name)).join(', ')}${expiring.length > 4 ? '…' : ''} <a href="#" data-go="kit">Check</a></div>` : ''}${S.meta.changed > S.meta.lastBackup && daysSince(S.meta.lastBackup) > 30 ? `<div class="note">💾 Changes not backed up${S.meta.lastBackup ? ' since ' + fmtDate(S.meta.lastBackup) : ''}. <a href="#" data-go="data">Back up now</a></div>` : ''}</div>` : ''}
  <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
   <div class="card"><h2>Where we meet</h2>
    <ul class="list">${S.meet.map(m => `<li><div class="grow"><b>${esc(m.label)}</b><div class="${m.desc.startsWith('e.g.') ? 'muted small' : ''}">${esc(m.desc)}</div></div>${m.lat ? `<button class="btn sm" data-showmeet="${m.id}">Map</button>` : ''}</li>`).join('')}</ul>
    <div class="small" style="margin-top:6px"><b>If we can't reach each other:</b> ${esc(S.rules.pickup)}</div>
   </div>
   <div class="card"><h2>Our people</h2>
    ${contactsWithPhone.length ? `<div class="numbers">${contactsWithPhone.map(c => `<a href="${telHref(c.phone)}"><span>${esc(c.name)}${c.rel || c.role ? ` <span class="muted small">· ${esc(c.rel || c.role)}</span>` : ''}</span><b>${esc(c.phone)}</b></a>`).join('')}</div>` : `<div class="empty">No numbers yet. <a href="#" data-go="plan">Add family and contacts</a></div>`}
   </div>
  </div>
  <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
   <div class="card"><h2>Key numbers</h2><div class="numbers">${NUMBERS.map(n => `<a href="${telHref(n.n)}"><span>${esc(n.label)}</span><b>${esc(n.n)}</b></a>`).join('')}</div></div>
   <div class="card"><h2>📻 Radio</h2><table>${RADIO.map(r => `<tr><td><b>${r[0]}</b><div class="small muted">${r[2]}</div></td><td style="white-space:nowrap">${r[1]}</td></tr>`).join('')}</table>
   <p class="small muted" style="margin-bottom:0">Car radio works too. Text instead of calling — texts get through when calls don't.</p></div>
  </div>
  <div class="card"><h2>How ready are we?</h2>
   <div class="row"><b>${done} of ${items.length}</b><span class="muted small">done</span></div>
   <div class="ready-bar"><i style="width:${Math.round(done / items.length * 100)}%"></i></div>
   ${items.map(i => `<div class="check"><span class="tick ${i[2] ? 'on' : ''}" ${i[4] ? `data-manual="${i[0]}" role="checkbox" aria-checked="${!!i[2]}" tabindex="0"` : ''}>${i[2] ? '✓' : ''}</span><div class="grow">${esc(i[1])}${i[0] === 'practise' && S.manual.practise ? ` <span class="small muted">(last ${fmtDate(S.manual.practise)})</span>` : ''}</div>${!i[2] && i[3] ? `<button class="btn sm ghost" data-go="${i[3]}">Do it</button>` : ''}</div>`).join('')}
  </div>
  <p class="small muted" style="text-align:center">Everything in this app is stored only on this device and works with no internet.<br>Version ${APP_VERSION}</p>`;
  $$('[data-manual]', main).forEach(el => el.onclick = () => {
    const k = el.dataset.manual;
    if (k === 'practise') S.manual.practise = S.manual.practise && daysSince(S.manual.practise) < 183 ? 0 : Date.now();
    else S.manual[k] = !S.manual[k];
    persist(); vNow(main);
  });
  $$('[data-showmeet]', main).forEach(b => b.onclick = () => { const m = S.meet.find(x => x.id === b.dataset.showmeet); MAPFOCUS = [m.lat, m.lon, 16]; go('map'); });
}

// ---------------------------------------------------------------------------
// GUIDES
// ---------------------------------------------------------------------------
function vGuides(main) {
  const groups = {};
  LIBRARY.forEach(a => (groups[a.group] = groups[a.group] || []).push(a));
  const tile = (go, icon, title, sub) => `<button class="btn" style="justify-content:flex-start;text-align:left;width:100%;min-height:60px" data-go="${go}"><span style="font-size:1.4rem">${icon}</span><span><span style="display:block">${title}</span>${sub ? `<span class="small muted" style="font-weight:400">${sub}</span>` : ''}</span></button>`;
  main.innerHTML = `
  <div class="card"><h2>When it happens</h2><div class="grid3">${SCENARIOS.map(s => tile('sc:' + s.id, s.icon, esc(s.title))).join('')}${tile('away', '✈️', esc(AW()) + ' stuck overseas')}</div></div>
  <div class="card"><h2>Our home</h2><p class="small muted" style="margin-top:-6px">Step-by-step for our own car, tanks, cookers and power.</p><div class="grid3">${HOME_GUIDES.map(g => tile('home:' + g.id, g.icon, fill(g.title))).join('')}${tile('tool:power', '🧮', 'Power calculator', 'What the car can run, and for how long')}</div></div>
  ${Object.entries(groups).map(([g, arr]) => `<div class="card"><h2>${esc(g)}</h2><div class="grid3">${arr.map(a => tile('lib:' + a.id, a.icon, esc(a.title))).join('')}</div></div>`).join('')}
  <div class="card"><button class="btn" data-go="data">🖨️ Print everything / backup / settings</button></div>`;
}
const TICKS = {};
function vScenario(main, id) {
  const s = SCENARIOS.find(x => x.id === id); if (!s) return go('guides');
  TICKS[id] = TICKS[id] || {};
  const sec = (key, title) => s[key] ? `<div class="card"><h2>${title}</h2><ul class="steps">${s[key].map((t, i) => { const k = key + i, on = TICKS[id][k]; return `<li class="${on ? 'done' : ''}"><span class="tick ${on ? 'on' : ''}" data-k="${k}" role="checkbox" aria-checked="${!!on}" tabindex="0">${on ? '✓' : ''}</span><span class="txt">${t}</span></li>`; }).join('')}</ul></div>` : '';
  main.innerHTML = `
  <div class="sc-head" style="background:${s.colour}"><div style="font-size:2rem">${s.icon}</div><h1 style="margin:0">${esc(s.title)}</h1><div class="one">${s.one}</div></div>
  ${s.before ? `<details class="card"><summary><b>If there's a warning beforehand</b></summary><ul class="steps" style="margin-top:8px">${s.before.map(t => `<li><span class="txt">${t}</span></li>`).join('')}</ul></details>` : ''}
  ${sec('now', 'Do now')}${sec('next', 'Next few hours')}${sec('later', 'The days after')}
  ${s.local ? `<div class="card note"><b>Around us:</b> ${s.local}</div>` : ''}
  <div class="row" style="margin-bottom:14px"><button class="btn primary" data-go="map">🗺️ Map & nearest help</button><button class="btn" data-go="plan">👪 Our plan</button><button class="btn ghost" id="resetTicks">Clear ticks</button></div>`;
  $$('.tick[data-k]', main).forEach(t => t.onclick = () => { TICKS[id][t.dataset.k] = !TICKS[id][t.dataset.k]; vScenario(main, id); });
  $('#resetTicks', main).onclick = () => { TICKS[id] = {}; vScenario(main, id); };
}
function vArticle(main, id) {
  const a = LIBRARY.find(x => x.id === id); if (!a) return go('guides');
  const body = a.body.replace('${RADIO_ROWS}', RADIO.map(r => `<tr><td><b>${r[0]}</b><div class="small muted">${r[2]}</div></td><td>${r[1]}</td></tr>`).join(''));
  main.innerHTML = `<div class="card article"><div style="font-size:2rem">${a.icon}</div><h1>${esc(a.title)}</h1>${body}</div><button class="btn" data-go="guides">← All guides</button>`;
}
function vHomeGuide(main, id) {
  const a = HOME_GUIDES.find(x => x.id === id); if (!a) return go('guides');
  main.innerHTML = `<div class="card article"><div style="font-size:2rem">${a.icon}</div><h1>${fill(a.title)}</h1>${fill(a.body)}</div>
  <div class="row"><button class="btn" data-go="guides">← All guides</button><button class="btn ghost" id="editHome">✏️ Edit our home details</button></div>`;
  $('#editHome', main).onclick = editHome;
}

// ---------------------------------------------------------------------------
// POWER CALCULATOR
// ---------------------------------------------------------------------------
const PSEL = {};
function vPower(main) {
  const h = S.home, outlet = Number(h.carOutlet) || 2000, kwh = Number(h.carKwh) || 0;
  const sel = APPLIANCES.filter((a, i) => PSEL[i]);
  const run = sel.reduce((t, a) => t + a[1], 0), avg = sel.reduce((t, a) => t + a[2], 0), surge = sel.reduce((t, a) => Math.max(t, a[3] - a[1]), 0) + run;
  const perDay = avg * 24 / 1000;
  const hours = kwh && avg ? (kwh * 0.85 * 1000) / avg : 0;
  main.innerHTML = `<div class="card"><h1>🧮 Power calculator</h1>
  ${h.carVolts === '100' ? '<div class="warn small" style="margin-bottom:8px">Our socket is 100 V — run everything through the step-up transformer.</div>' : h.carVolts !== '230' ? '<div class="warn small" style="margin-bottom:8px">Check the socket voltage first — see the Power cut guide.</div>' : ''}<p>Tick what you want to run from <b>${esc(h.car)}</b> at the same time. Plug limit: <b>${outlet} W</b>. Battery: <b>${kwh || '?'} kWh</b>. <a href="#" id="pe">Change</a></p>
  <ul class="list">${APPLIANCES.map((a, i) => `<li><span class="tick ${PSEL[i] ? 'on' : ''}" data-i="${i}" role="checkbox" aria-checked="${!!PSEL[i]}" tabindex="0">${PSEL[i] ? '✓' : ''}</span><div class="grow"><b>${esc(a[0])}</b> <span class="muted small">${a[1]} W</span>${a[4] ? `<div class="small muted">${esc(a[4])}</div>` : ''}</div></li>`).join('')}</ul></div>
  <div class="card" style="position:sticky;bottom:calc(var(--nav) + 8px)">
  ${sel.length ? `<div class="row"><div class="grow"><b>${run.toLocaleString()} W</b> if all on at once <span class="pill ${run > outlet ? 'bad' : run > outlet * .8 ? 'warn' : 'ok'}">${run > outlet ? 'Too much — will trip' : run > outlet * .8 ? 'Close to the limit' : 'OK'}</span></div></div>
  ${surge > outlet && run <= outlet ? `<div class="small" style="color:var(--warn)">Start-up surge may reach ~${surge.toLocaleString()} W — switch things on one at a time.</div>` : ''}
  <div style="margin-top:6px">Uses about <b>${perDay.toFixed(1)} kWh a day</b> on average.${hours ? ` The battery alone lasts about <b>${hours >= 48 ? (hours / 24).toFixed(1) + ' days' : Math.round(hours) + ' hours'}</b>, then the engine recharges it.` : ''}</div>` : '<div class="muted">Tick some appliances above.</div>'}
  </div><button class="btn" data-go="home:h-power">← Power cut guide</button>`;
  $$('.tick[data-i]', main).forEach(t => t.onclick = () => { PSEL[t.dataset.i] = !PSEL[t.dataset.i]; vPower(main); });
  $('#pe', main).onclick = e => { e.preventDefault(); editHome(); };
}

// ---------------------------------------------------------------------------
// AWAY (parent overseas for work)
// ---------------------------------------------------------------------------
function timeIn(tz, d = new Date()) { try { return d.toLocaleTimeString('en-NZ', { timeZone: tz, hour: 'numeric', minute: '2-digit', weekday: 'short' }); } catch (e) { return ''; } }
function checkinIn(tz) {
  const [hh, mm] = (S.household.checkin || '19:00').split(':').map(Number);
  // build today's check-in moment in NZ time
  const now = new Date();
  const nzParts = new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now).reduce((o, p) => (o[p.type] = p.value, o), {});
  const nzNowMin = (+nzParts.hour % 24) * 60 + +nzParts.minute;
  const target = new Date(now.getTime() + ((hh * 60 + mm) - nzNowMin) * 60000);
  return timeIn(tz, target);
}
function vAway(main, rid) {
  const G = AWAY_GENERAL;
  if (rid) {
    const r = AWAY_REGIONS.find(x => x.id === rid); if (!r) return go('away');
    main.innerHTML = `<div class="sc-head" style="background:#0e7490"><div style="font-size:2rem">${r.flag}</div><h1 style="margin:0">${esc(r.name)}</h1>
    <div class="one" style="font-weight:600">${r.zones.map(z => `${esc(z[0])}: ${timeIn(z[1])}`).join('<br>')}<br>Home (NZ): ${timeIn('Pacific/Auckland')}</div></div>
    <div class="card note">📲 Daily check-in: <b>${esc(S.household.checkin || '19:00')} NZ time</b> = <b>${checkinIn(r.zones[0][1])}</b> in ${esc(r.zones[0][0])}.</div>
    <div class="card"><h2>Emergency numbers here</h2><div class="numbers">${r.numbers.map(n => `<a href="${/^[0-9 +]+$/.test(n[0]) ? telHref(n[0]) : '#'}"><span>${esc(n[1])}</span><b>${esc(n[0])}</b></a>`).join('')}</div></div>
    <div class="card"><h2>Warnings & alerts</h2><ul class="steps">${r.alerts.map(t => `<li><span class="txt">${t}</span></li>`).join('')}</ul></div>
    <div class="card"><h2>What can happen here</h2><ul class="steps">${r.hazards.map(t => `<li><span class="txt">${t}</span></li>`).join('')}</ul></div>
    <div class="card"><h2>🇳🇿 NZ help here</h2><div class="numbers">${r.missions.map(n => `<a href="${telHref(n[1])}"><span>${esc(n[0])}</span><b>${esc(n[1])}</b></a>`).join('')}${G.mfat.map(n => `<a href="${telHref(n[0])}"><span>${esc(n[1])}</span><b>${esc(n[0])}</b></a>`).join('')}</div></div>
    <button class="btn" data-go="away">← Away overview</button>`;
    return;
  }
  const kitDone = G.kit.filter((k, i) => S.awayKit[i]).length;
  main.innerHTML = `<div class="sc-head" style="background:#0e7490"><div style="font-size:2rem">✈️</div><h1 style="margin:0">${esc(AW())} stuck overseas</h1><div class="one">Stay with the crew. Message home once a day. Let ${esc(HA())} handle home.</div></div>
  <div class="card"><h2>Where are you?</h2><div class="grid2">${AWAY_REGIONS.map(r => `<button class="btn" style="min-height:64px" data-go="away:${r.id}">${r.flag} ${esc(r.name)}</button>`).join('')}</div></div>
  <div class="card"><h2>What to do</h2><ul class="steps">${G.steps.map(t => `<li><span class="txt">${fill(t)}</span></li>`).join('')}</ul>
  <div class="numbers" style="margin-top:8px">${G.mfat.map(n => `<a href="${telHref(n[0])}"><span>${esc(n[1])}</span><b>${esc(n[0])}</b></a>`).join('')}</div></div>
  <div class="card"><h2>Keeping in touch</h2><p>Daily check-in time: <b>${esc(S.household.checkin || '19:00')} NZ time</b> <a href="#" id="ci">Change</a></p><ul class="steps">${G.checkin.map(t => `<li><span class="txt">${fill(t)}</span></li>`).join('')}</ul>
  ${S.household.backupAdult ? `<p>Backup adult for our daughter: <b>${esc(S.household.backupAdult)}</b> ${S.household.backupPhone ? `<a href="${telHref(S.household.backupPhone)}">${esc(S.household.backupPhone)}</a>` : ''}</p>` : `<p class="muted">No backup adult set yet. <a href="#" data-go="plan">Add one in Our plan</a></p>`}</div>
  <div class="card"><h2>Crew-bag kit <span class="pill ${kitDone === G.kit.length ? 'ok' : ''}">${kitDone}/${G.kit.length}</span></h2><ul class="list">${G.kit.map((k, i) => `<li><span class="tick ${S.awayKit[i] ? 'on' : ''}" data-ak="${i}" role="checkbox" aria-checked="${!!S.awayKit[i]}" tabindex="0">${S.awayKit[i] ? '✓' : ''}</span><span>${esc(k)}</span></li>`).join('')}</ul></div>`;
  $$('[data-ak]', main).forEach(t => t.onclick = () => { S.awayKit[t.dataset.ak] = !S.awayKit[t.dataset.ak]; persist(); vAway(main); });
  $('#ci', main).onclick = e => { e.preventDefault(); formModal('Daily check-in time', [{ k: 'checkin', label: 'Time (NZ time, 24-hour)', type: 'time' }], S.household, v => { S.household.checkin = v.checkin || '19:00'; persist(); vAway(main); }); };
}

// ---------------------------------------------------------------------------
// OUR PLAN
// ---------------------------------------------------------------------------
const PERSON_F = [
  { k: 'name', label: 'Name' }, { k: 'role', label: 'Who', ph: 'e.g. Dad, Mum, daughter' }, { k: 'phone', label: 'Mobile', type: 'tel' },
  { k: 'dob', label: 'Date of birth', type: 'date' }, { k: 'blood', label: 'Blood type', ph: 'if known' },
  { k: 'medical', label: 'Medical conditions', type: 'textarea' }, { k: 'meds', label: 'Medicines & doses', type: 'textarea' },
  { k: 'allergies', label: 'Allergies', type: 'textarea' }, { k: 'doctor', label: 'GP / doctor & phone' }, { k: 'notes', label: 'Other notes (school, work, usual places)', type: 'textarea' },
];
const CONTACT_F = [
  { k: 'name', label: 'Name' }, { k: 'rel', label: 'Who they are', ph: 'e.g. neighbour, Nana, school office' }, { k: 'phone', label: 'Phone', type: 'tel' },
  { k: 'phone2', label: 'Other phone / email' }, { k: 'outOfTown', label: 'Out-of-town contact', type: 'check', ph: 'This person lives outside Auckland — everyone checks in with them' },
  { k: 'notes', label: 'Notes', type: 'textarea' },
];
const HOME_F = [
  { k: 'car', label: 'What we call the car in the guides', ph: 'e.g. the Outlander' },
  { k: 'carModel', label: 'Make, model and year', ph: 'e.g. Mitsubishi Outlander PHEV (2014)' },
  { k: 'carOutlet', label: 'Car power outlet limit (watts)', type: 'number', ph: '1500' },
  { k: 'carVolts', label: 'Voltage on the car\'s power socket label', type: 'select', options: [['unknown', "Haven't checked"], ['230', '230 V (NZ/Australian appliances plug straight in)'], ['100', '100 V (Japanese — needs a step-up transformer)']] },
  { k: 'carKwh', label: 'Car battery size (kWh)', type: 'number', help: 'In the car\'s specs. Used to estimate how long it lasts.' },
  { k: 'carNotes', label: 'How to turn on the car\'s power outlet', type: 'textarea', ph: 'e.g. Car in READY, press the 1500W button on the dash, plug into the socket behind the back seat' },
  { k: 'inverter', label: 'Solar inverter make & model', ph: 'On the box on the wall near the switchboard' },
  { k: 'inverterSocket', label: 'Does the inverter have an emergency power socket?', type: 'select', options: [['unknown', "Don't know"], ['yes', 'Yes'], ['no', 'No']] },
  { k: 'tankL', label: 'Size of each water tank (litres)', type: 'number' }, { k: 'tankCount', label: 'Number of tanks', type: 'number' },
  { k: 'tapWhere', label: 'Where the tank hose tap is', ph: 'e.g. the tap at the back of the garage by the tanks' },
  { k: 'tankNotes', label: 'Tank notes', type: 'textarea', ph: 'e.g. first-flush diverter on the left downpipe; tank lid needs a screwdriver' },
  { k: 'stove', label: 'Camp stove / gas BBQ (if we have one)', ph: 'e.g. butane camp stove in the garage cupboard' },
  { k: 'oven', label: 'Pizza oven make', ph: 'e.g. Ooni Karu 16' },
  { k: 'ovenGas', label: 'Does the pizza oven have a gas burner?', type: 'select', options: [['unknown', "Don't know"], ['yes', 'Yes'], ['no', 'No']] },
  { k: 'bbq', label: 'Charcoal cooker', ph: 'Big Green Egg' },
  { k: 'radios', label: 'Our walkie-talkies', ph: 'e.g. 3 handheld radios' }, { k: 'radioCh', label: 'Family radio channel / frequency', ph: 'e.g. PRS channel 12 (476.700 MHz)' },
  { k: 'radioNotes', label: 'Radio notes (where they live, chargers, settings)', type: 'textarea' },
  { k: 'gasMeter', label: 'Where the gas meter / bottles are' }, { k: 'waterToby', label: 'Where the water toby (street tap) is' }, { k: 'switchboard', label: 'Where the main switchboard is' },
];
function editHome() { formModal('Our home systems', HOME_F, S.home, v => { Object.assign(S.home, v); persist(); render(); }, { intro: '<p class="small muted">These details are written into the step-by-step guides.</p>' }); }
function vPlan(main) {
  const h = S.household;
  main.innerHTML = `
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">🏠 Household</h2><button class="btn sm" id="eh">Edit</button></div>
   <table style="margin-top:8px"><tr><td>Name</td><td><b>${esc(h.name)}</b></td></tr><tr><td>Parents</td><td>${esc(HA())} (usually home) · ${esc(AW())} (travels)</td></tr><tr><td>Address</td><td>${esc(h.address) || '<span class="muted">—</span>'}</td></tr>
   <tr><td>People</td><td>${esc(h.people)}</td></tr><tr><td>Supplies target</td><td>${esc(h.days)} days</td></tr><tr><td>Daily check-in when apart</td><td>${esc(h.checkin)} NZ time</td></tr>
   <tr><td>Backup adult for our daughter</td><td>${esc(h.backupAdult) || '<span class="muted">—</span>'} ${esc(h.backupPhone)}</td></tr>
   <tr><td>Home on the map</td><td>${h.homeLat ? '✓ set' : '<span class="muted">not set</span>'} <button class="btn sm ghost" id="sethome">${h.homeLat ? 'Move' : 'Set'}</button></td></tr></table></div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">👪 Family</h2><button class="btn sm primary" id="addP">+ Add</button></div>
   ${S.people.length ? `<ul class="list">${S.people.map(p => `<li data-p="${p.id}" style="cursor:pointer"><div class="grow"><b>${esc(p.name)}</b> <span class="muted small">${esc(p.role)}</span>${p.phone ? ` · <a href="${telHref(p.phone)}" onclick="event.stopPropagation()">${esc(p.phone)}</a>` : ''}
   ${p.medical || p.meds || p.allergies ? `<div class="small">${p.medical ? '🩺 ' + esc(p.medical) + ' ' : ''}${p.meds ? '💊 ' + esc(p.meds) + ' ' : ''}${p.allergies ? '⚠️ ' + esc(p.allergies) : ''}</div>` : ''}</div><span class="muted">›</span></li>`).join('')}</ul>` : '<div class="empty">Add each person, with medicines and allergies.</div>'}</div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">📞 Contacts</h2><button class="btn sm primary" id="addC">+ Add</button></div>
   ${S.contacts.length ? `<ul class="list">${S.contacts.map(c => `<li data-c="${c.id}" style="cursor:pointer"><div class="grow"><b>${esc(c.name)}</b> <span class="muted small">${esc(c.rel)}</span> ${c.outOfTown ? '<span class="pill ok">out of town</span>' : ''}<div>${c.phone ? `<a href="${telHref(c.phone)}" onclick="event.stopPropagation()">${esc(c.phone)}</a>` : ''} ${esc(c.phone2 || '')}</div></div><span class="muted">›</span></li>`).join('')}</ul>` : '<div class="empty">Neighbours, relatives, school, work, and one person outside Auckland.</div>'}</div>
  <div class="card"><h2>📍 Meeting points</h2><ul class="list">${S.meet.map(m => `<li><div class="grow"><b>${esc(m.label)}</b><div class="${m.desc.startsWith('e.g.') ? 'muted small' : ''}">${esc(m.desc)}</div></div><div class="row"><button class="btn sm" data-em="${m.id}">Edit</button><button class="btn sm ghost" data-pm="${m.id}">${m.lat ? 'Move pin' : 'Pin'}</button></div></li>`).join('')}</ul></div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">📋 Family rules</h2><button class="btn sm" id="er">Edit</button></div>
   <p><b>If we can't reach each other:</b> ${esc(S.rules.pickup)}</p>
   <p><b>School emergency plan:</b> ${esc(S.rules.school) || '<span class="muted">Ask the school: do they hold children or release them, and who is on the pickup list?</span>'}</p>
   <p><b>Walkie-talkie channel:</b> ${esc(S.rules.radioCh) || '<span class="muted">not set</span>'}</p>${S.rules.note ? `<p>${esc(S.rules.note)}</p>` : ''}</div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">🔧 Our home systems</h2><button class="btn sm" id="ehome">Edit</button></div>
   <table style="margin-top:8px"><tr><td>Car (power)</td><td>${esc(S.home.carModel || S.home.car)} · ${esc(S.home.carOutlet)} W · ${S.home.carVolts === 'unknown' ? '<span class="pill warn">socket voltage not checked</span>' : esc(S.home.carVolts) + ' V'}${S.home.carKwh ? ' · ' + esc(S.home.carKwh) + ' kWh' : ''}</td></tr>
   <tr><td>Radios</td><td>${esc(S.home.radios)} · channel: ${esc(S.home.radioCh) || '<span class="muted">not set</span>'}</td></tr>
   <tr><td>Solar inverter</td><td>${esc(S.home.inverter) || '<span class="muted">—</span>'}</td></tr>
   <tr><td>Water tanks</td><td>${S.home.tankL ? esc(S.home.tankCount) + ' × ' + esc(S.home.tankL) + ' L' : '<span class="muted">size not set</span>'} · ${esc(S.home.tapWhere)}</td></tr>
   <tr><td>Cookers</td><td>${[S.home.stove, S.home.oven, S.home.bbq].filter(Boolean).map(esc).join(' · ')}</td></tr>
   <tr><td>Shut-offs</td><td class="small">Gas: ${esc(S.home.gasMeter) || '—'}<br>Water: ${esc(S.home.waterToby) || '—'}<br>Power: ${esc(S.home.switchboard) || '—'}</td></tr></table></div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">📄 Documents & photos</h2><label class="btn sm primary">+ Add photo<input type="file" accept="image/*,application/pdf" id="docIn" multiple hidden></label></div>
   <p class="small muted">Passports, licences, insurance policies, prescriptions, the gas/water/power shut-offs. Stored only on this phone — keep the phone locked with a passcode.</p>
   <div id="docs" class="grid3"></div></div>`;
  $('#eh', main).onclick = () => formModal('Household', [
    { k: 'name', label: 'Household name' }, { k: 'address', label: 'Home address' },
    { k: 'homeName', label: 'Name of the parent usually at home', ph: 'e.g. Dad' }, { k: 'awayName', label: 'Name of the parent who travels overseas for work', ph: 'e.g. Mum' },
    { k: 'people', label: 'Number of people', type: 'number' }, { k: 'days', label: 'Days of supplies to aim for', type: 'select', options: [[3, '3 days (minimum)'], [7, '7 days (recommended)'], [14, '14 days'], [30, '30 days'], [90, '3 months']] },
    { k: 'checkin', label: 'Daily check-in time when apart (NZ time)', type: 'time' },
    { k: 'backupAdult', label: 'Backup adult who can collect our daughter', help: 'If neither of us can get to her. Make sure the school has them on the pickup list.' }, { k: 'backupPhone', label: 'Their phone', type: 'tel' },
  ], h, v => { Object.assign(S.household, v); S.household.people = Number(v.people) || 3; S.household.days = Number(v.days) || 7; persist(); vPlan(main); });
  $('#addP', main).onclick = () => formModal('Add person', PERSON_F, {}, v => { if (!v.name) { toast('Add a name'); return false; } S.people.push(Object.assign({ id: uid() }, v)); persist(); vPlan(main); });
  $$('[data-p]', main).forEach(li => li.onclick = () => { const p = S.people.find(x => x.id === li.dataset.p); formModal('Edit ' + p.name, PERSON_F, p, v => { Object.assign(p, v); persist(); vPlan(main); }, { onDelete: () => { S.people = S.people.filter(x => x !== p); persist(); vPlan(main); } }); });
  $('#addC', main).onclick = () => formModal('Add contact', CONTACT_F, {}, v => { if (!v.name) { toast('Add a name'); return false; } S.contacts.push(Object.assign({ id: uid() }, v)); persist(); vPlan(main); });
  $$('[data-c]', main).forEach(li => li.onclick = () => { const c = S.contacts.find(x => x.id === li.dataset.c); formModal('Edit ' + c.name, CONTACT_F, c, v => { Object.assign(c, v); persist(); vPlan(main); }, { onDelete: () => { S.contacts = S.contacts.filter(x => x !== c); persist(); vPlan(main); } }); });
  $$('[data-em]', main).forEach(b => b.onclick = () => { const m = S.meet.find(x => x.id === b.dataset.em); formModal(m.label, [{ k: 'desc', label: 'Where exactly?', type: 'textarea' }], { desc: m.desc.startsWith('e.g.') ? '' : m.desc }, v => { m.desc = v.desc || m.desc; persist(); vPlan(main); }); });
  $$('[data-pm]', main).forEach(b => b.onclick = () => { const m = S.meet.find(x => x.id === b.dataset.pm); startPick('Tap the map where meeting point ' + m.label.split(' ')[0] + ' is', (lat, lon) => { m.lat = lat; m.lon = lon; persist(); toast('Meeting point pinned'); go('plan'); }, m.lat ? [m.lat, m.lon] : null); });
  $('#sethome', main).onclick = () => startPick('Tap the map on our house', (lat, lon) => { S.household.homeLat = lat; S.household.homeLon = lon; persist(); toast('Home set'); go('plan'); }, h.homeLat ? [h.homeLat, h.homeLon] : null);
  $('#er', main).onclick = () => formModal('Family rules', [
    { k: 'pickup', label: 'If we can\'t reach each other…', type: 'textarea' }, { k: 'school', label: 'School emergency plan', type: 'textarea' },
    { k: 'radioCh', label: 'Walkie-talkie (PRS) channel', ph: 'e.g. channel 12' }, { k: 'note', label: 'Anything else', type: 'textarea' }], S.rules, v => { Object.assign(S.rules, v); persist(); vPlan(main); });
  $('#ehome', main).onclick = editHome;
  $('#docIn', main).onchange = async e => {
    for (const f of e.target.files) {
      const id = uid(); const blob = f.type.startsWith('image/') ? await shrinkImage(f) : f;
      await idb.put('files', id, blob); S.docs.push({ id, name: f.name.replace(/\.[^.]+$/, ''), type: blob.type, at: Date.now() });
    }
    persist(); renderDocs();
  };
  renderDocs();
}
async function shrinkImage(file, max = 1800) {
  try {
    const bmp = await createImageBitmap(file); const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.82));
  } catch (e) { return file; }
}
async function renderDocs() {
  const el = $('#docs'); if (!el) return;
  if (!S.docs.length) { el.innerHTML = '<div class="empty" style="grid-column:1/-1">No documents yet.</div>'; return; }
  el.innerHTML = '';
  for (const d of S.docs) {
    const b = await idb.get('files', d.id); const div = document.createElement('div'); div.className = 'card'; div.style.padding = '8px'; div.style.margin = '0';
    const url = b ? URL.createObjectURL(b) : '';
    div.innerHTML = `${b && d.type.startsWith('image/') ? `<img src="${url}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:8px">` : `<div style="height:110px;display:flex;align-items:center;justify-content:center;font-size:2rem">📄</div>`}
    <div class="small" style="margin-top:4px;word-break:break-word"><b>${esc(d.name)}</b></div><div class="row" style="margin-top:4px"><a class="btn sm" href="${url}" target="_blank" rel="noopener">Open</a><button class="btn sm ghost" data-ren>Rename</button><button class="btn sm ghost" data-del style="color:var(--accent)">✕</button></div>`;
    $('[data-ren]', div).onclick = () => formModal('Rename', [{ k: 'name', label: 'Name' }], d, v => { d.name = v.name || d.name; persist(); renderDocs(); });
    $('[data-del]', div).onclick = e => confirmTwice(e.target, 'Delete?', async () => { await idb.del('files', d.id); S.docs = S.docs.filter(x => x !== d); persist(); renderDocs(); });
    el.appendChild(div);
  }
}

// ---------------------------------------------------------------------------
// SUPPLIES
// ---------------------------------------------------------------------------
function supplyItems() {
  const ppl = Number(S.household.people) || 3, days = Number(S.household.days) || 7;
  const base = SUPPLY_TEMPLATE.map((t, i) => {
    const [group, name, q, unit, scales, perPerson, expires] = t;
    let need = q * (scales ? days : 1) * (perPerson ? ppl : 1);
    if (name.startsWith('Prescription')) need = Math.max(14, days);
    need = Math.round(need * 10) / 10;
    return { key: 't' + i + ':' + name.slice(0, 18), group, name, need, unit, expires };
  });
  const custom = S.supplies.custom.map(c => ({ key: c.id, group: c.group || 'Our extras', name: c.name, need: c.need || '', unit: c.unit || '', expires: true, custom: c }));
  return base.concat(custom).filter(it => !S.supplies.hidden[it.key]);
}
function expiringItems(withinDays) {
  const now = Date.now();
  return supplyItems().filter(it => { const d = S.supplies.expiry[it.key]; return d && (new Date(d).getTime() - now) / 864e5 <= withinDays; })
    .map(it => ({ name: it.name, date: S.supplies.expiry[it.key] }));
}
let KITFILTER = 'all';
function vKit(main) {
  const items = supplyItems(); const groups = {};
  items.forEach(it => (groups[it.group] = groups[it.group] || []).push(it));
  const have = items.filter(it => S.supplies.have[it.key]).length;
  const grabDone = GRAB_BAG.filter((g, i) => S.grab[i]).length;
  const exp = expiringItems(45);
  main.innerHTML = `
  <div class="card"><h2>🎒 Supplies</h2>
   <p>Sized for <b>${esc(S.household.people)} people</b> for <b>${esc(S.household.days)} days</b>. <a href="#" id="chg">Change</a></p>
   <div class="ready-bar"><i style="width:${Math.round(have / items.length * 100)}%"></i></div>
   <div class="row small"><b>${have} of ${items.length}</b> ticked
    <span class="grow"></span>
    ${['all', 'need', 'have', 'expiry'].map(f => `<button class="chip ${KITFILTER === f ? 'on' : ''}" data-f="${f}" style="border:0;cursor:pointer">${{ all: 'All', need: 'Still need', have: 'Have', expiry: 'Expiry dates' }[f]}</button>`).join('')}</div>
  </div>
  ${exp.length ? `<div class="card note"><b>Expiring within 45 days:</b><ul style="margin:6px 0 0">${exp.map(e => `<li>${esc(e.name)} — ${fmtDate(e.date)}</li>`).join('')}</ul></div>` : ''}
  ${Object.entries(groups).map(([g, arr]) => {
    const shown = arr.filter(it => KITFILTER === 'all' || (KITFILTER === 'need' && !S.supplies.have[it.key]) || (KITFILTER === 'have' && S.supplies.have[it.key]) || (KITFILTER === 'expiry' && it.expires));
    if (!shown.length) return '';
    return `<div class="card"><h3 style="margin-top:0">${esc(g)}</h3><ul class="list">${shown.map(it => `<li><span class="tick ${S.supplies.have[it.key] ? 'on' : ''}" data-have="${esc(it.key)}" role="checkbox" aria-checked="${!!S.supplies.have[it.key]}" tabindex="0">${S.supplies.have[it.key] ? '✓' : ''}</span>
     <div class="grow"><div>${esc(it.name)}</div><div class="small muted">${it.need !== '' ? 'Need about <b>' + esc(it.need) + (it.unit ? ' ' + esc(it.unit) : '') + '</b>' : ''}${S.supplies.note[it.key] ? ' · ' + esc(S.supplies.note[it.key]) : ''}${S.supplies.expiry[it.key] ? ` · <span class="${(new Date(S.supplies.expiry[it.key]) - Date.now()) / 864e5 < 45 ? 'pill warn' : ''}">use by ${fmtDate(S.supplies.expiry[it.key])}</span>` : ''}</div></div>
     <button class="btn sm ghost" data-ed="${esc(it.key)}" aria-label="Edit">✏️</button></li>`).join('')}</ul></div>`;
  }).join('')}
  <div class="card"><button class="btn" id="addItem">+ Add our own item</button> <button class="btn ghost" id="showHidden">${Object.keys(S.supplies.hidden).length ? 'Show hidden items (' + Object.keys(S.supplies.hidden).length + ')' : ''}</button></div>
  <div class="card"><h2>Grab bag (one each) <span class="pill ${grabDone === GRAB_BAG.length ? 'ok' : ''}">${grabDone}/${GRAB_BAG.length}</span></h2><p class="small muted" style="margin-top:-6px">A backpack by the door for each person, to leave in a hurry.</p>
   <ul class="list">${GRAB_BAG.map((g, i) => `<li><span class="tick ${S.grab[i] ? 'on' : ''}" data-grab="${i}" role="checkbox" aria-checked="${!!S.grab[i]}" tabindex="0">${S.grab[i] ? '✓' : ''}</span><span>${esc(g)}</span></li>`).join('')}</ul></div>`;
  if (!Object.keys(S.supplies.hidden).length) $('#showHidden', main).remove();
  $('#chg', main).onclick = e => { e.preventDefault(); go('plan'); setTimeout(() => $('#eh') && $('#eh').click(), 50); };
  $$('[data-f]', main).forEach(b => b.onclick = () => { KITFILTER = b.dataset.f; vKit(main); });
  $$('[data-have]', main).forEach(t => t.onclick = () => { const k = t.dataset.have; S.supplies.have[k] = !S.supplies.have[k]; if (!S.supplies.have[k]) delete S.supplies.have[k]; persist(); vKit(main); });
  $$('[data-grab]', main).forEach(t => t.onclick = () => { S.grab[t.dataset.grab] = !S.grab[t.dataset.grab]; persist(); vKit(main); });
  $$('[data-ed]', main).forEach(b => b.onclick = () => {
    const k = b.dataset.ed; const it = items.find(x => x.key === k);
    const fields = [{ k: 'note', label: 'Note (where it is, how much we have)' }, { k: 'expiry', label: 'Use-by / replace date', type: 'date' }];
    if (it.custom) fields.unshift({ k: 'name', label: 'Item' }, { k: 'group', label: 'Group' }, { k: 'need', label: 'How much we need' });
    formModal(it.name, fields, Object.assign({ note: S.supplies.note[k] || '', expiry: S.supplies.expiry[k] || '' }, it.custom || {}), v => {
      if (v.note) S.supplies.note[k] = v.note; else delete S.supplies.note[k];
      if (v.expiry) S.supplies.expiry[k] = v.expiry; else delete S.supplies.expiry[k];
      if (it.custom) Object.assign(it.custom, { name: v.name || it.custom.name, group: v.group || 'Our extras', need: v.need });
      persist(); vKit(main);
    }, { onDelete: () => { if (it.custom) S.supplies.custom = S.supplies.custom.filter(c => c !== it.custom); else S.supplies.hidden[k] = 1; persist(); vKit(main); } });
  });
  $('#addItem', main).onclick = () => formModal('Add item', [{ k: 'name', label: 'Item' }, { k: 'group', label: 'Group', ph: 'e.g. Food, Tools, Our extras' }, { k: 'need', label: 'How much we need' }, { k: 'expiry', label: 'Use-by date', type: 'date' }], {}, v => {
    if (!v.name) { toast('Add a name'); return false; } const c = { id: 'c' + uid(), name: v.name, group: v.group || 'Our extras', need: v.need }; S.supplies.custom.push(c); if (v.expiry) S.supplies.expiry[c.id] = v.expiry; persist(); vKit(main);
  });
  const sh = $('#showHidden', main); if (sh) sh.onclick = () => { S.supplies.hidden = {}; persist(); vKit(main); };
}

// ---------------------------------------------------------------------------
// SUPPLIERS & CONTACTS
// ---------------------------------------------------------------------------
let SRCQ = '', SRCCAT = '';
const SOURCE_F = () => [
  { k: 'name', label: 'Name (person or business)' },
  { k: 'cat', label: 'Category', type: 'select', options: SOURCE_CATS.map(c => [c[0], c[1] + ' ' + c[2]]) },
  { k: 'supplies', label: 'What they can supply', type: 'textarea', ph: 'e.g. eggs, point-of-lay hens, layer pellets' },
  { k: 'phone', label: 'Phone', type: 'tel' }, { k: 'phone2', label: 'Other contact (email, Facebook, etc.)' },
  { k: 'address', label: 'Address / where they are' },
  { k: 'trade', label: 'What they might take in trade', ph: 'e.g. cash, firewood, help in the garden, our eggs' },
  { k: 'checked', label: 'Last checked they\'re still around', type: 'date' },
  { k: 'notes', label: 'Notes', type: 'textarea' },
];
function vSources(main) {
  const q = SRCQ.toLowerCase();
  const list = S.sources.filter(s => (!SRCCAT || s.cat === SRCCAT) && (!q || [s.name, s.supplies, s.notes, s.address, s.trade].join(' ').toLowerCase().includes(q)));
  const cat = c => SOURCE_CATS.find(x => x[0] === c) || SOURCE_CATS[SOURCE_CATS.length - 1];
  main.innerHTML = `
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">🤝 Suppliers & contacts</h2><button class="btn sm primary" id="addS">+ Add</button></div>
   <p class="small muted">People and places we can get food, animals and essentials from when the shops are empty. Build this list now, while it's easy.</p>
   <input type="search" id="sq" placeholder="Search — e.g. eggs, seed, gas, firewood" value="${esc(SRCQ)}">
   <div style="margin-top:8px">${SOURCE_CATS.map(c => `<button class="chip ${SRCCAT === c[0] ? 'on' : ''}" data-cat="${c[0]}" style="border:0;cursor:pointer">${c[1]} ${esc(c[2])} <span class="muted">${S.sources.filter(s => s.cat === c[0]).length || ''}</span></button>`).join('')}</div>
   ${SRCCAT ? `<div class="note small" style="margin-top:8px"><b>Who to line up:</b> ${esc(cat(SRCCAT)[3])}</div>` : ''}
  </div>
  ${list.length ? list.map(s => { const c = cat(s.cat); const stale = s.checked && daysSince(new Date(s.checked).getTime()) > 365; return `<div class="card"><div class="row"><div class="grow"><div class="small muted">${c[1]} ${esc(c[2])}</div><h3 style="margin:2px 0">${esc(s.name)}</h3></div><button class="btn sm ghost" data-es="${s.id}">✏️</button></div>
    ${s.supplies ? `<div>${esc(s.supplies)}</div>` : ''}
    <div class="row" style="margin-top:8px">${s.phone ? `<a class="btn sm primary" href="${telHref(s.phone)}">📞 ${esc(s.phone)}</a><a class="btn sm" href="sms:${esc(s.phone.replace(/[^0-9+]/g, ''))}">💬 Text</a>` : ''}${s.lat ? `<button class="btn sm" data-ms="${s.id}">🗺️ Map</button>` : ''}</div>
    <div class="small muted" style="margin-top:6px">${[s.address, s.phone2, s.trade ? 'Trade: ' + s.trade : '', s.notes].filter(Boolean).map(esc).join(' · ')}</div>
    ${s.checked ? `<div class="small ${stale ? '' : 'muted'}" style="margin-top:4px">${stale ? '⚠️ ' : ''}Last checked ${fmtDate(s.checked)}</div>` : ''}</div>`; }).join('')
    : `<div class="card empty">${S.sources.length ? 'Nothing matches.' : 'No suppliers yet.<br><br>Tap a category above for ideas on who to add, then <b>+ Add</b>.'}</div>`}`;
  $('#sq', main).oninput = e => { SRCQ = e.target.value; const pos = e.target.selectionStart; vSources(main); const n = $('#sq', main); n.focus(); n.setSelectionRange(pos, pos); };
  $$('[data-cat]', main).forEach(b => b.onclick = () => { SRCCAT = SRCCAT === b.dataset.cat ? '' : b.dataset.cat; vSources(main); });
  const editSrc = s => {
    const isNew = !s; s = s || { id: uid(), cat: SRCCAT || 'produce' };
    formModal(isNew ? 'Add supplier / contact' : 'Edit ' + s.name, SOURCE_F(), s, v => {
      if (!v.name) { toast('Add a name'); return false; }
      Object.assign(s, v); if (isNew) S.sources.push(s); persist(); vSources(main);
      if (!s.lat) toast('Tip: tap ✏️ then "Pin on map" to add their location', 4500);
    }, { onDelete: isNew ? null : () => { S.sources = S.sources.filter(x => x !== s); persist(); vSources(main); },
      intro: isNew ? '' : `<button class="btn sm" id="pinS" type="button">📍 ${s.lat ? 'Move pin on map' : 'Pin on map'}</button>` });
    const pb = $('#pinS'); if (pb) pb.onclick = () => { $('.modal-bg').remove(); startPick('Tap where ' + s.name + ' is', (lat, lon) => { s.lat = lat; s.lon = lon; persist(); toast('Location saved'); go('sources'); }, s.lat ? [s.lat, s.lon] : null); };
  };
  $('#addS', main).onclick = () => editSrc(null);
  $$('[data-es]', main).forEach(b => b.onclick = () => editSrc(S.sources.find(x => x.id === b.dataset.es)));
  $$('[data-ms]', main).forEach(b => b.onclick = () => { const s = S.sources.find(x => x.id === b.dataset.ms); MAPFOCUS = [s.lat, s.lon, 15]; go('map'); });
}

// ---------------------------------------------------------------------------
// MAP
// ---------------------------------------------------------------------------
const LINZ_ATTR = 'Topo50 & aerials © <a href="https://www.linz.govt.nz/">Toitū Te Whenua LINZ</a> CC BY 4.0';
const SETS = { topo: { set: 'topo-raster', name: 'NZ Topo50 map', max: 17, kb: 22 }, aerial: { set: 'aerial', name: 'Aerial photos', max: 19, kb: 38 } };
const PT = { // point categories
  H: ['🏥', '#c62828', 'Hospitals'], U: ['🩺', '#e65100', 'Urgent care'], P: ['💊', '#2e7d32', 'Pharmacies'], F: ['🚒', '#b71c1c', 'Fire stations'],
  L: ['🚓', '#1565c0', 'Police'], M: ['🏛️', '#6d4c41', 'Marae'], A: ['❤️', '#ad1457', 'Defibrillators (AED)'], C: ['🏘️', '#546e7a', 'Community centres & halls'],
};
const MYPT = { water: ['💧', 'Water source'], shelter: ['⛺', 'Shelter'], cache: ['📦', 'Supply cache'], danger: ['⚠️', 'Danger / avoid'], food: ['🍎', 'Food / fruit trees'], other: ['📍', 'Other'] };
const DEFAULT_CENTRE = [-36.87, 174.70];
let MAP = null, BASE = null, LYR = {}, MEPOS = null, MEMARK = null, WATCH = null, PICK = null, MAPFOCUS = null, OSMDATA = null, TSUNAMI = null;
const linzKey = () => S.set.linzKey ? '?api=' + encodeURIComponent(S.set.linzKey) : '';
const linzUrl = set => 'https://basemaps.linz.govt.nz/v1/tiles/' + set + '/WebMercatorQuad/{z}/{x}/{y}.webp' + linzKey();
const tileKey = (set, z, x, y) => set + '/' + z + '/' + x + '/' + y;
function makeBase(k) {
  const def = SETS[k];
  const Off = L.TileLayer.extend({
    createTile(coords, done) {
      const img = document.createElement('img'); img.alt = ''; img.setAttribute('role', 'presentation');
      const key = tileKey(def.set, coords.z, coords.x, coords.y);
      idb.get('tiles', key).then(b => {
        if (b) { const u = URL.createObjectURL(b); img.onload = () => { URL.revokeObjectURL(u); done(null, img); }; img.onerror = () => done(new Error('bad tile'), img); img.src = u; }
        else if (navigator.onLine !== false) { img.onload = () => done(null, img); img.onerror = () => done(new Error('net'), img); img.crossOrigin = 'anonymous'; img.src = this.getTileUrl(coords); }
        else done(new Error('offline'), img);
      }).catch(() => { img.src = this.getTileUrl(coords); img.onload = () => done(null, img); img.onerror = () => done(new Error('x'), img); });
      return img;
    },
  });
  return new Off(linzUrl(def.set), { maxZoom: 19, maxNativeZoom: def.max, minZoom: 4, attribution: LINZ_ATTR });
}
function teardownMap() {
  if (WATCH != null && navigator.geolocation) { navigator.geolocation.clearWatch(WATCH); WATCH = null; }
  if (MAP) { try { MAP.remove(); } catch (e) {} MAP = null; LYR = {}; MEMARK = null; }
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
  setBase(S.set.base || 'topo');
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
  if (!MEMARK) MEMARK = L.marker(MEPOS, { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), zIndexOffset: 2000 }).addTo(MAP).bindPopup('You are here');
  else MEMARK.setLatLng(MEPOS);
}
function locate() {
  if (!navigator.geolocation) { toast('Location is not available on this device'); return; }
  toast('Finding you… (GPS works without mobile signal)');
  const first = !MEPOS;
  if (WATCH != null) navigator.geolocation.clearWatch(WATCH);
  WATCH = navigator.geolocation.watchPosition(p => {
    MEPOS = [p.coords.latitude, p.coords.longitude]; placeMe();
    if (first && MAP) { MAP.setView(MEPOS, Math.max(MAP.getZoom(), 15)); }
  }, e => toast(e.code === 1 ? 'Location permission is off — allow it in your phone settings' : 'Could not get your location'), { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 });
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
   <h3>Show</h3><ul class="list">${row('meet', '⭐ Home & meeting points')}${row('mine', '📍 Our places')}${row('sources', '🤝 Suppliers & contacts')}${row('tsunami', '🌊 Tsunami evacuation zones' + (TSUNAMI ? '' : ' <span class="pill warn">not downloaded</span>'))}
   ${Object.entries(PT).map(([k, v]) => row(k, v[0] + ' ' + v[2] + (!OSMDATA && !['H', 'U', 'P', 'F', 'C'].includes(k) ? ' <span class="pill warn">not downloaded</span>' : ''))).join('')}</ul>
   ${!OSMDATA || !TSUNAMI ? `<button class="btn primary" data-go="data">⬇️ Download emergency map data</button>` : `<p class="small muted">Map data downloaded ${fmtDate(S.meta.layersAt)}. Points © OpenStreetMap contributors (ODbL); tsunami zones © Auckland Council.</p>`}`,
  el => {
    $$('[data-base]', el).forEach(b => b.onclick = () => { setBase(b.dataset.base); showLayers(); });
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
  <label class="f">Map type</label><select id="svK">${Object.entries(SETS).map(([k, s]) => `<option value="${k}"${k === 'topo' ? ' selected' : ''}>${s.name}${k === 'topo' ? ' (recommended — smaller)' : ''}</option>`).join('')}</select>
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
          if (r.status === 401 || r.status === 403) { auth = true; break; }
          if (!r.ok) { fail++; } else { const b = await r.blob(); bytes += b.size; await idb.put('tiles', key, b); done++; }
        }
      } catch (e) { fail++; }
      if (Date.now() - last > 300) { last = Date.now(); ui(); }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  OFF.busy = false; ui();
  if (auth) { toast('LINZ needs an access key — see Settings → Maps', 7000); return; }
  if (OFF.cancel) { toast('Cancelled. What downloaded is kept.'); }
  const rec = { name: p[1].replace(/^\S+\s/, ''), k, b: p[3], z0: p[4], z1, n: list.length, bytes, at: Date.now() };
  const ex = S.saved.maps.findIndex(m => m.name === rec.name && m.k === k);
  if (ex >= 0) { rec.bytes += S.saved.maps[ex].bytes || 0; S.saved.maps[ex] = rec; } else S.saved.maps.push(rec);
  persist();
  if (!OFF.cancel) toast(`Saved ${rec.name}: ${MB(bytes)} downloaded${fail ? `, ${fail} pieces not available` : ''}. Works offline now.`, 6000);
  if (BASE && S.set.base !== k) setBase(k); else if (BASE) BASE.redraw();
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

// ---------------------------------------------------------------------------
// SETTINGS / DATA — backup, restore, print, maps, storage
// ---------------------------------------------------------------------------
async function vData(main) {
  const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate().catch(() => null) : null;
  const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted().catch(() => false) : false;
  const tiles = await idb.count('tiles').catch(() => 0);
  main.innerHTML = `
  <div class="card"><h2>💾 Backup & share</h2>
   <p>Last backup: <b>${S.meta.lastBackup ? fmtDate(S.meta.lastBackup) : 'never'}</b>${S.meta.changed > S.meta.lastBackup ? ' <span class="pill warn">changes since</span>' : ''}</p>
   <p class="small muted">One file with everything (plan, contacts, supplies, suppliers, documents). Use it to copy everything to the other phone: back up here, send the file (AirDrop, email, Messages), then on her phone tap Restore. Keep a copy in OneDrive and on a USB stick in the grab bag.</p>
   <div class="row"><button class="btn primary" id="bk">⬇️ Back up now</button><label class="btn">⬆️ Restore from file<input type="file" id="rs" accept=".json,application/json" hidden></label></div></div>
  <div class="card"><h2>🖨️ Paper copy</h2><p class="small muted">Prints the family plan, contacts, every scenario's steps, home guides, water, first aid and suppliers. Keep one with the grab bags and one in the car. Reprint after changes.</p>
   <button class="btn" id="pr">🖨️ Print / save as PDF</button></div>
  <div class="card"><h2>🗺️ Map data</h2>
   <p>Saved map areas: <b>${S.saved.maps.length}</b> (${tiles.toLocaleString()} pieces). <a href="#" data-go="map">Open the map → ⬇️ Save maps</a></p>
   <p>Emergency map data (tsunami zones, hospitals, pharmacies, AEDs, fire, police, marae): <b>${S.meta.layersAt ? 'downloaded ' + fmtDate(S.meta.layersAt) : 'not downloaded'}</b></p>
   <button class="btn primary" id="dl">⬇️ ${S.meta.layersAt ? 'Refresh' : 'Download'} emergency map data</button><div id="dlS" class="small" style="margin-top:8px"></div>
   <label class="f">LINZ access key (only if the map says it needs one)</label><div class="row"><input type="text" id="lk" value="${esc(S.set.linzKey)}" placeholder="Paste a link from basemaps.linz.govt.nz or a key" class="grow" style="flex:1"><button class="btn" id="lkS">Save</button></div>
   <p class="small muted">Maps: Toitū Te Whenua LINZ (CC BY 4.0). Places: © OpenStreetMap contributors (ODbL). Tsunami zones: Auckland Council.</p></div>
  <div class="card"><h2>📱 This device</h2>
   <p>Installed as an app: <b>${isInstalled() ? 'yes' : 'no'}</b>${!isInstalled() ? ` <label class="row small" style="display:inline-flex"><input type="checkbox" id="inst"${S.manual.install ? ' checked' : ''}> I've done this on our phones</label>` : ''}</p>
   ${!isInstalled() ? `<div class="note small"><b>iPhone:</b> open in Safari → Share button → <b>Add to Home Screen</b>.<br><b>Android:</b> open in Chrome → ⋮ menu → <b>Install app</b> / Add to Home screen.<br>Then open it once with the phone in airplane mode to check it works offline.</div>` : ''}
   <p>Storage used: <b>${est ? MB(est.usage || 0) : '—'}</b>${est && est.quota ? ' of ' + MB(est.quota) + ' available' : ''} · Protected from clean-up: <b>${persisted ? 'yes' : 'no'}</b>${!persisted ? ' <button class="btn sm" id="pp">Protect</button>' : ''}</p>
   <label class="f">Appearance</label><select id="th"><option value="auto">Match phone</option><option value="light">Light</option><option value="dark">Dark (easier at night)</option></select></div>
  <div class="card"><h2>About</h2><p class="small">Family Ready · version ${APP_VERSION}. Guidance from NEMA / Get Ready, Auckland Emergency Management, Te Whatu Ora, MPI, NZ SafeTravel and Smartraveller. Check getready.govt.nz for updates. This app is a guide, not a replacement for official instructions — always follow Civil Defence and emergency services.</p>
   <button class="btn ghost" id="wipe" style="color:var(--accent)">Erase everything on this device</button></div>`;
  $('#th', main).value = S.set.theme || 'auto';
  $('#th', main).onchange = e => { S.set.theme = e.target.value; applyTheme(); persist(false); };
  $('#bk', main).onclick = backup;
  $('#rs', main).onchange = e => e.target.files[0] && restore(e.target.files[0]);
  $('#pr', main).onclick = printAll;
  $('#dl', main).onclick = async e => { e.target.disabled = true; await downloadLayers(m => { const s = $('#dlS'); if (s) s.textContent = m; }); e.target.disabled = false; };
  $('#lkS', main).onclick = () => { const v = $('#lk', main).value.trim(); const m = v.match(/[?&]api=([A-Za-z0-9_-]+)/); S.set.linzKey = m ? m[1] : v; persist(); toast('Saved'); };
  const inst = $('#inst', main); if (inst) inst.onchange = e => { S.manual.install = e.target.checked; persist(); };
  const pp = $('#pp', main); if (pp) pp.onclick = async () => { const ok = navigator.storage && await navigator.storage.persist(); toast(ok ? 'Protected' : 'The browser said no — installing the app usually fixes this'); vData(main); };
  $('#wipe', main).onclick = e => confirmTwice(e.target, 'Tap again — this cannot be undone', async () => { await idb.clear('kv'); await idb.clear('tiles'); await idb.clear('files'); try { localStorage.removeItem('family-ready-state'); } catch (x) {} S = DEFAULT_STATE(); migrate(); OSMDATA = TSUNAMI = null; toast('Erased'); go('now'); });
}
function blobToB64(b) { return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(b); }); }
async function backup() {
  const files = [];
  for (const d of S.docs) { const b = await idb.get('files', d.id); if (b) files.push({ id: d.id, type: b.type, data: await blobToB64(b) }); }
  S.meta.lastBackup = Date.now();
  const data = { app: 'family-ready', version: APP_VERSION, at: Date.now(), state: S, files };
  const name = `family-ready-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([JSON.stringify(data)], name, { type: 'application/json' });
  persist(false);
  try { if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) { await navigator.share({ files: [file], title: 'Family Ready backup' }); toast('Backup shared'); render(); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  toast('Backup saved: ' + name); render();
}
async function restore(f) {
  try {
    const d = JSON.parse(await f.text()); if (d.app !== 'family-ready' || !d.state) throw new Error('not a backup');
    modal(`<h2>Restore backup?</h2><p>From <b>${fmtDate(d.at)}</b>. This replaces the plan, contacts, supplies and suppliers on this device. Saved maps on this device are kept.</p><div class="actions"><button class="btn ghost" id="rN">Cancel</button><button class="btn primary" id="rY">Restore</button></div>`, (m, close) => {
      $('#rN', m).onclick = close;
      $('#rY', m).onclick = async () => {
        const keepMaps = S.saved, keepKey = S.set.linzKey, keepLayers = S.meta.layersAt;
        for (const fl of d.files || []) { const bin = atob(fl.data); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); await idb.put('files', fl.id, new Blob([u], { type: fl.type })); }
        S = d.state; migrate(); S.saved = keepMaps; S.meta.layersAt = keepLayers; if (keepKey && !S.set.linzKey) S.set.linzKey = keepKey;
        persist(); close(); toast('Restored'); go('now');
      };
    });
  } catch (e) { toast('That file isn\'t a Family Ready backup'); }
}

// ---------------------------------------------------------------------------
// PRINT
// ---------------------------------------------------------------------------
function printAll() {
  const h = S.household, list = a => `<ol>${a.map(t => `<li>${t}</li>`).join('')}</ol>`;
  const strip = s => s.replace(/<a [^>]*>(.*?)<\/a>/g, '$1');
  const people = S.people.map(p => `<tr><td><b>${esc(p.name)}</b><br>${esc(p.role)}</td><td>${esc(p.phone)}</td><td>${esc(p.dob)}</td><td>${[p.medical && 'Conditions: ' + esc(p.medical), p.meds && 'Medicines: ' + esc(p.meds), p.allergies && 'Allergies: ' + esc(p.allergies), p.blood && 'Blood: ' + esc(p.blood), p.doctor && 'GP: ' + esc(p.doctor)].filter(Boolean).join('<br>')}</td></tr>`).join('');
  const html = `
  <h1>${esc(h.name)} — Emergency Plan</h1><div>${esc(h.address)} · Printed ${fmtDate(Date.now())}</div>
  <div class="box"><b>Emergency: 111</b> · Healthline 0800 611 116 · Poisons 0800 764 766 · Radio: RNZ National 101.4 FM, Newstalk ZB 89.4 FM</div>
  <h2>Family</h2><table><tr><th>Name</th><th>Phone</th><th>DOB</th><th>Medical</th></tr>${people || '<tr><td colspan=4>—</td></tr>'}</table>
  <h2>Contacts</h2><table><tr><th>Name</th><th>Who</th><th>Phone</th><th>Notes</th></tr>${S.contacts.map(c => `<tr><td>${esc(c.name)}${c.outOfTown ? ' (out of town)' : ''}</td><td>${esc(c.rel)}</td><td>${esc(c.phone)} ${esc(c.phone2 || '')}</td><td>${esc(c.notes || '')}</td></tr>`).join('') || '<tr><td colspan=4>—</td></tr>'}
   ${h.backupAdult ? `<tr><td>${esc(h.backupAdult)}</td><td>Backup adult for our daughter</td><td>${esc(h.backupPhone)}</td><td></td></tr>` : ''}</table>
  <h2>Meeting points & rules</h2><ol>${S.meet.map(m => `<li><b>${esc(m.label.replace(/^\d · /, ''))}:</b> ${esc(m.desc)}${m.lat ? ` (${m.lat.toFixed(5)}, ${m.lon.toFixed(5)})` : ''}</li>`).join('')}</ol>
  <p><b>If we can't reach each other:</b> ${esc(S.rules.pickup)}</p>${S.rules.school ? `<p><b>School:</b> ${esc(S.rules.school)}</p>` : ''}${S.rules.radioCh ? `<p><b>Walkie-talkie channel:</b> ${esc(S.rules.radioCh)}</p>` : ''}
  <p><b>Daily check-in when apart:</b> ${esc(h.checkin)} NZ time. <b>Shut-offs:</b> gas — ${esc(S.home.gasMeter || '?')}; water toby — ${esc(S.home.waterToby || '?')}; switchboard — ${esc(S.home.switchboard || '?')}.</p>
  ${SCENARIOS.map((s, i) => `<${i === 0 ? 'h2 class="pb"' : 'h2'}>${s.icon} ${esc(s.title)}</h2><div class="box"><b>${s.one}</b></div>${s.before ? '<h3>If there\'s warning</h3>' + list(s.before.map(strip)) : ''}<h3>Do now</h3>${list(s.now.map(strip))}<h3>Next few hours</h3>${list(s.next.map(strip))}<h3>Days after</h3>${list(s.later.map(strip))}${s.local ? `<p><i>${s.local}</i></p>` : ''}`).join('')}
  <h2 class="pb">Our home</h2>${HOME_GUIDES.map(g => `<h3>${g.icon} ${fill(g.title)}</h3>${strip(fill(g.body)).replace(/<h3>/g, '<h4>').replace(/<\/h3>/g, '</h4>')}`).join('')}
  <h2 class="pb">✈️ ${esc(AW())} overseas</h2>${list(AWAY_GENERAL.steps.map(t => strip(fill(t))))}<p><b>NZ consular emergency:</b> +64 99 20 20 20 (from overseas) · 0800 30 10 30 (in NZ)</p>
  ${AWAY_REGIONS.map(r => `<h3>${r.flag} ${esc(r.name)}</h3><p><b>Emergency:</b> ${r.numbers.map(n => esc(n[0]) + ' ' + esc(n[1])).join(' · ')}<br><b>NZ missions:</b> ${r.missions.map(m => esc(m[0]) + ' ' + esc(m[1])).join(' · ')}</p>`).join('')}
  <h2 class="pb">Survival reference</h2>${['water', 'toilet', 'firstaid', 'food'].map(id => { const a = LIBRARY.find(x => x.id === id); return `<h3>${a.icon} ${esc(a.title)}</h3>${strip(a.body).replace(/<h3>/g, '<h4>').replace(/<\/h3>/g, '</h4>')}`; }).join('')}
  <h2 class="pb">Suppliers & contacts</h2><table><tr><th>Name</th><th>Supplies</th><th>Phone</th><th>Where / trade / notes</th></tr>${S.sources.map(s => `<tr><td>${esc(s.name)}</td><td>${esc(s.supplies)}</td><td>${esc(s.phone)}</td><td>${[s.address, s.trade && 'Trade: ' + s.trade, s.notes].filter(Boolean).map(esc).join('<br>')}</td></tr>`).join('') || '<tr><td colspan=4>—</td></tr>'}</table>
  <h2>Supplies checklist (${esc(h.people)} people, ${esc(h.days)} days)</h2><table><tr><th>✓</th><th>Item</th><th>Need</th></tr>${supplyItems().map(it => `<tr><td>${S.supplies.have[it.key] ? '✓' : '☐'}</td><td>${esc(it.name)}</td><td>${esc(it.need)} ${esc(it.unit || '')}</td></tr>`).join('')}</table>`;
  $('#print').innerHTML = html.replace('${RADIO_ROWS}', '');
  S.manual.print = true; persist();
  setTimeout(() => window.print(), 50);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
function applyTheme() { const t = S.set.theme; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
function netStatus() { const n = $('#net'); if (!n) return; const on = navigator.onLine !== false; n.textContent = on ? 'Online' : 'Offline — all good'; n.classList.toggle('off', !on); }
async function boot() {
  await openDB();
  await loadState();
  applyTheme();
  $('nav.tabs').innerHTML = TABS.map(t => `<button data-tab="${t[0]}" aria-label="${t[2]}"><span class="i">${t[1]}</span>${t[2]}</button>`).join('');
  $$('nav.tabs button').forEach(b => b.onclick = () => go(b.dataset.tab));
  $('#gear').onclick = () => go('data');
  $('#hdrTitle').onclick = () => go('now');
  window.addEventListener('online', netStatus); window.addEventListener('offline', netStatus); netStatus();
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('tick')) { e.preventDefault(); e.target.click(); } });
  ROUTE = location.hash.slice(1) || 'now';
  try { history.replaceState({ r: ROUTE }, '', '#' + ROUTE); } catch (e) {}
  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/localhost|127\.0\.0\.1/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => {});
  loadLayersData();
}
boot();
