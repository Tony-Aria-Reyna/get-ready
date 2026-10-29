// ---------------------------------------------------------------------------
// EXCEL — template, import, export (SheetJS, bundled for offline use)
// ---------------------------------------------------------------------------
const XL = {
  Family: { list: () => S.people, cols: [
    ['name', 'Name', ['name']], ['role', 'Who they are', ['who', 'role', 'relationship']], ['age', 'Age group', ['age']],
    ['phone', 'Mobile', ['mobile', 'phone']], ['dob', 'Date of birth', ['birth', 'dob']], ['medical', 'Medical conditions', ['medical', 'condition']],
    ['meds', 'Medicines, doses and times', ['medicine', 'meds', 'dose']], ['allergies', 'Allergies', ['allerg']], ['blood', 'Blood type', ['blood']],
    ['doctor', 'GP / doctor and phone', ['gp', 'doctor']], ['aids', 'Glasses, hearing aids, other aids', ['glasses', 'hearing', 'aids']],
    ['mobility', 'Mobility needs', ['mobility']], ['evacHelp', 'Who helps them evacuate', ['evacuat', 'helps']], ['notes', 'Notes', ['note']]] },
  Contacts: { list: () => S.contacts, cols: [
    ['name', 'Name', ['name']], ['rel', 'Who they are', ['who', 'relationship', 'role']], ['phone', 'Phone', ['phone', 'mobile']],
    ['phone2', 'Other phone / email', ['other', 'email']], ['address', 'Address', ['address']], ['outOfTown', 'Out of town (Y/N)', ['out of town', 'outside']], ['notes', 'Notes', ['note']]] },
  Suppliers: { list: () => S.sources, cols: [
    ['name', 'Name', ['name']], ['cat', 'Category', ['category', 'type']], ['supplies', 'What they supply', ['supply', 'supplies', 'what']],
    ['phone', 'Phone', ['phone', 'mobile']], ['phone2', 'Other contact', ['other', 'email']], ['address', 'Address / where', ['address', 'where']],
    ['trade', 'Would take in trade', ['trade']], ['checked', 'Last checked', ['checked', 'last']], ['notes', 'Notes', ['note']],
    ['lat', 'Latitude', ['lat']], ['lon', 'Longitude', ['lon', 'lng']]] },
  Supplies: { cols: [['name', 'Item', ['item', 'name']], ['group', 'Group', ['group', 'category']], ['need', 'How much we need', ['need', 'how much']], ['have', 'Have it (Y/N)', ['have']], ['expiry', 'Use-by date', ['use-by', 'use by', 'expiry', 'date']], ['note', 'Notes', ['note']]] },
  Places: { list: () => S.points, cols: [['name', 'Name', ['name']], ['cat', 'Type', ['type', 'category']], ['lat', 'Latitude', ['lat']], ['lon', 'Longitude', ['lon', 'lng']], ['note', 'Notes', ['note']]] },
};
const yes = v => /^(y|yes|true|1|x|✓)$/i.test(String(v || '').trim());
const ageFrom = v => { const n = norm(v); const a = AGE_GROUPS.find(a => a[0] === v || norm(a[1]) === n) || AGE_GROUPS.find(a => n && norm(a[1]).startsWith(n.slice(0, 6))); return a ? a[0] : (/child|kid/.test(n) ? 'child4' : /70|older|nana|grand/.test(n) ? 'olderF' : /man|male|dad/.test(n) && !/woman/.test(n) ? 'man' : 'woman'); };
const catFrom = v => { const n = norm(v); const c = SOURCE_CATS.find(c => c[0] === n || norm(c[2]) === n) || SOURCE_CATS.find(c => n && (norm(c[2]).includes(n) || n.includes(c[0]))); return c ? c[0] : 'other'; };
const placeFrom = v => { const n = norm(v); const e = Object.entries(MYPT).find(([k, x]) => k === n || norm(x[1]) === n || (n && norm(x[1]).includes(n))); return e ? e[0] : 'other'; };
const dateStr = v => { if (!v) return ''; if (v instanceof Date) return isNaN(v) ? '' : `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`; const s = String(v).trim(); const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/); if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; } return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s; };
function rowsToObjects(rows, def) {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0]);
  const map = def.cols.map(([k, label, aliases]) => { const h = headers.find(h => norm(h) === norm(label)) || headers.find(h => aliases.some(a => norm(h).includes(a))); return [k, h]; });
  return rows.map(r => { const o = {}; map.forEach(([k, h]) => { if (h != null && r[h] !== undefined && r[h] !== '') o[k] = r[h]; }); return o; }).filter(o => o.name && String(o.name).trim() && !/^e\.g\./i.test(String(o.name)));
}
function sheetKind(name, headers) {
  const n = norm(name); const hs = headers.map(norm).join(' ');
  if (/famil|people|household/.test(n)) return 'Family'; if (/contact/.test(n)) return 'Contacts'; if (/supplier|source/.test(n)) return 'Suppliers';
  if (/suppl|kit|pantry/.test(n)) return 'Supplies'; if (/place|map|location/.test(n)) return 'Places'; if (/instruc|read|help|list/.test(n)) return null;
  if (/age group|medical|allerg/.test(hs)) return 'Family'; if (/what they supply|trade|category/.test(hs)) return 'Suppliers';
  if (/item/.test(hs) && /have|use-by/.test(hs)) return 'Supplies'; if (/latitude/.test(hs) && /type/.test(hs)) return 'Places';
  if (/phone|name/.test(hs)) return 'Contacts'; return null;
}
async function importExcel(file) {
  let XLSX; try { XLSX = loadLib('lib-xlsx', 'XLSX'); } catch (e) { toast('Excel reader not available'); return; }
  let wb; try { wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true }); } catch (e) { toast('Could not read that file'); return; }
  const found = {};
  wb.SheetNames.forEach(sn => {
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '', raw: true, blankrows: false }); if (!aoa.length) return;
    // the heading row is the first row with a "Name" or "Item" cell (the template has a title above it)
    let hi = aoa.findIndex(r => r.some(c => /^(name|item)$/.test(norm(c).trim()))); if (hi < 0) hi = 0;
    const head = aoa[hi].map(h => String(h).trim());
    const rows = aoa.slice(hi + 1).map(r => Object.fromEntries(head.map((h, j) => [h || 'col' + j, r[j] === undefined ? '' : r[j]])));
    if (!rows.length) return; const kind = sheetKind(sn, head); if (kind) found[kind] = (found[kind] || []).concat(rowsToObjects(rows, XL[kind]));
  });
  const kinds = Object.keys(found).filter(k => found[k].length);
  if (!kinds.length) { toast('No rows found — use the template headings'); return; }
  const key = o => norm(o.name).trim();
  const plan = kinds.map(k => { const ex = k === 'Supplies' ? supplyItems() : XL[k].list(); const exKeys = new Set(ex.map(key)); const nNew = found[k].filter(o => !exKeys.has(key(o))).length; return [k, found[k].length, nNew, found[k].length - nNew]; });
  modal(`<h2>Import from ${esc(file.name)}</h2><table><tr><th>Sheet</th><th>Rows</th><th>New</th><th>Update</th></tr>${plan.map(p => `<tr><td>${p[0]}</td><td>${p[1]}</td><td>${p[2]}</td><td>${p[3]}</td></tr>`).join('')}</table>
   <p class="small muted">Rows with the same name as something already in the app are <b>updated</b>; others are <b>added</b>. Nothing is deleted.</p>
   <label class="row small"><input type="checkbox" id="xRep"> Replace these lists completely instead (removes anything not in the file — not used for Supplies)</label>
   <div class="actions"><button class="btn ghost" id="xN">Cancel</button><button class="btn primary" id="xY">Import</button></div>`, (m, close) => {
    $('#xN', m).onclick = close;
    $('#xY', m).onclick = () => { applyImport(found, $('#xRep', m).checked); close(); };
  });
}
function applyImport(found, replace) {
  const key = o => norm(o.name).trim(); let n = 0;
  const merge = (list, rows, conv) => { if (replace) list.length = 0; rows.forEach(r => { const o = conv(r); const ex = list.find(x => key(x) === key(o)); if (ex) Object.assign(ex, o); else list.push(Object.assign({ id: uid() }, o)); n++; }); };
  if (found.Family) merge(S.people, found.Family, r => Object.assign({}, r, { name: String(r.name).trim(), age: ageFrom(r.age || r.role), dob: dateStr(r.dob), phone: String(r.phone || '') }));
  if (found.Contacts) merge(S.contacts, found.Contacts, r => Object.assign({}, r, { name: String(r.name).trim(), phone: String(r.phone || ''), outOfTown: yes(r.outOfTown) }));
  if (found.Suppliers) merge(S.sources, found.Suppliers, r => { const o = Object.assign({}, r, { name: String(r.name).trim(), cat: catFrom(r.cat), phone: String(r.phone || ''), checked: dateStr(r.checked) }); if (r.lat && r.lon) { o.lat = +r.lat; o.lon = +r.lon; } else { delete o.lat; delete o.lon; } return o; });
  if (found.Places) merge(S.points, found.Places.filter(r => r.lat && r.lon), r => ({ name: String(r.name).trim(), cat: placeFrom(r.cat), lat: +r.lat, lon: +r.lon, note: r.note || '' }));
  if (found.Supplies) {
    const items = supplyItems();
    found.Supplies.forEach(r => {
      let it = items.find(x => norm(x.name) === norm(r.name));
      if (!it) { const c = { id: 'c' + uid(), name: String(r.name).trim(), group: r.group || 'Our extras', need: r.need || '' }; S.supplies.custom.push(c); it = { key: c.id }; }
      if (r.have !== undefined) { if (yes(r.have)) S.supplies.have[it.key] = true; else delete S.supplies.have[it.key]; }
      if (r.expiry) S.supplies.expiry[it.key] = dateStr(r.expiry);
      if (r.note) S.supplies.note[it.key] = String(r.note);
      n++;
    });
  }
  persist(); toast(`Imported ${n} rows`); render();
}
function sheetFrom(XLSX, def, rows) {
  const head = def.cols.map(c => c[1]);
  const ws = XLSX.utils.aoa_to_sheet([head].concat(rows.map(r => def.cols.map(c => r[c[0]] == null ? '' : r[c[0]]))));
  ws['!cols'] = head.map(h => ({ wch: Math.max(14, Math.min(40, h.length + 6)) }));
  return ws;
}
function buildWorkbook(withData) {
  const XLSX = loadLib('lib-xlsx', 'XLSX'); const wb = XLSX.utils.book_new();
  const info = [['Family Ready — import template'], [''], ['How to use'], ['1. Fill in the Family, Contacts, Suppliers, Supplies and Places sheets. One row per person or item. Keep the heading row.'], ['2. Leave a sheet empty if you don\'t need it. Example rows starting "e.g." are ignored.'], ['3. In the app: ⚙️ Settings → Excel → Import. Rows with the same Name are updated; new names are added.'], [''],
    ['Age groups'], ...AGE_GROUPS.map(a => ['', a[1]]), [''], ['Supplier categories'], ...SOURCE_CATS.map(c => ['', c[2]]), [''], ['Place types'], ...Object.values(MYPT).map(x => ['', x[1]])];
  const wi = XLSX.utils.aoa_to_sheet(info); wi['!cols'] = [{ wch: 4 }, { wch: 90 }]; XLSX.utils.book_append_sheet(wb, wi, 'Instructions');
  const ageLabel = a => (AGE[a] || AGE.woman)[1]; const catLabel = c => (SOURCE_CATS.find(x => x[0] === c) || SOURCE_CATS[SOURCE_CATS.length - 1])[2];
  const fam = withData ? S.people.map(p => Object.assign({}, p, { age: ageLabel(p.age) })) : [{ name: 'e.g. Jane Smith', role: 'Mum', age: 'Woman 19–70', phone: '021 000 0000', medical: 'Asthma', meds: 'Ventolin as needed', allergies: 'Penicillin' }];
  const con = withData ? S.contacts.map(c => Object.assign({}, c, { outOfTown: c.outOfTown ? 'Y' : '' })) : [{ name: 'e.g. Aunty Mere', rel: 'Aunt (Hamilton)', phone: '07 000 0000', outOfTown: 'Y' }];
  const sup = withData ? S.sources.map(s => Object.assign({}, s, { cat: catLabel(s.cat) })) : [{ name: 'e.g. Bob\'s hens', cat: 'Eggs & chickens', supplies: 'Eggs, point-of-lay hens, layer pellets', phone: '09 000 0000', address: 'Oratia', trade: 'Cash or firewood' }];
  const items = supplyItems().map(it => ({ name: it.name, group: it.group, need: it.need + (it.unit ? ' ' + it.unit : ''), have: S.supplies.have[it.key] ? 'Y' : '', expiry: S.supplies.expiry[it.key] || '', note: S.supplies.note[it.key] || '' }));
  const pla = withData ? S.points.map(p => Object.assign({}, p, { cat: (MYPT[p.cat] || MYPT.other)[1] })) : [{ name: 'e.g. Neighbour\'s rain tank', cat: 'Water source', lat: -36.91, lon: 174.65, note: 'Ask first' }];
  XLSX.utils.book_append_sheet(wb, sheetFrom(XLSX, XL.Family, fam), 'Family');
  XLSX.utils.book_append_sheet(wb, sheetFrom(XLSX, XL.Contacts, con), 'Contacts');
  XLSX.utils.book_append_sheet(wb, sheetFrom(XLSX, XL.Suppliers, sup), 'Suppliers');
  XLSX.utils.book_append_sheet(wb, sheetFrom(XLSX, XL.Supplies, items), 'Supplies');
  XLSX.utils.book_append_sheet(wb, sheetFrom(XLSX, XL.Places, pla), 'Places');
  return { XLSX, wb };
}
async function downloadTemplate() {
  // The formatted template (with drop-downs) is published next to the app; fall back to a plain one offline.
  try { if (/^https?:$/.test(location.protocol)) { const r = await fetch('family-ready-template.xlsx'); if (r.ok) { await saveFile(await r.blob(), 'family-ready-template.xlsx'); return; } } } catch (e) {}
  try { const { XLSX, wb } = buildWorkbook(false); const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); await saveFile(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'family-ready-template.xlsx'); } catch (e) { toast('Could not make the template'); }
}
async function exportExcel() {
  try { const { XLSX, wb } = buildWorkbook(true); const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); await saveFile(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `family-ready-${new Date().toISOString().slice(0, 10)}.xlsx`); toast('Exported'); } catch (e) { toast('Export failed'); }
}

// ---------------------------------------------------------------------------
// BACKUP / RESTORE
// ---------------------------------------------------------------------------
function blobToB64(b) { return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(b); }); }
async function backup() {
  const files = [];
  for (const d of S.docs) { const b = await idb.get('files', d.id); if (b) files.push({ id: d.id, type: b.type, data: await blobToB64(b) }); }
  S.meta.lastBackup = Date.now(); persist(false);
  const data = { app: 'family-ready', version: APP_VERSION, at: Date.now(), state: S, files };
  await saveFile(new Blob([JSON.stringify(data)], { type: 'application/json' }), `family-ready-backup-${new Date().toISOString().slice(0, 10)}.json`);
  toast('Backup made'); render();
}
async function restore(f) {
  try {
    const d = JSON.parse(await f.text()); if (d.app !== 'family-ready' || !d.state) throw new Error('not a backup');
    modal(`<h2>Restore backup?</h2><p>From <b>${fmtDate(d.at)}</b>. This replaces the plan, people, contacts, supplies, suppliers and guide edits on this device. Saved maps on this device are kept.</p><div class="actions"><button class="btn ghost" id="rN">Cancel</button><button class="btn primary" id="rY">Restore</button></div>`, (m, close) => {
      $('#rN', m).onclick = close;
      $('#rY', m).onclick = async () => {
        const keepMaps = S.saved, keepKey = S.set.linzKey, keepLayers = S.meta.layersAt;
        for (const fl of d.files || []) { const bin = atob(fl.data); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); await idb.put('files', fl.id, new Blob([u], { type: fl.type })); }
        S = d.state; migrate(); S.saved = keepMaps; S.meta.layersAt = keepLayers; if (keepKey && !S.set.linzKey) S.set.linzKey = keepKey;
        persist(); applyTheme(); close(); toast('Restored'); go('now');
      };
    });
  } catch (e) { toast('That file isn\'t a Family Ready backup'); }
}
