// ---------------------------------------------------------------------------
// OUR PLAN
// ---------------------------------------------------------------------------
const PERSON_F = () => [
  { k: 'name', label: 'Name' },
  { k: 'role', label: 'Who they are', ph: 'e.g. Dad, Mum, daughter, Nana' },
  { k: 'age', label: 'Age group', type: 'select', options: AGE_GROUPS.map(a => [a[0], a[1]]), help: 'Sets how much food and protein they need.' },
  { k: 'phone', label: 'Mobile', type: 'tel' },
  { k: 'dob', label: 'Date of birth', type: 'date' },
  { k: 'medical', label: 'Medical conditions', type: 'textarea', section: 'Health' },
  { k: 'meds', label: 'Medicines, doses and times', type: 'textarea' },
  { k: 'allergies', label: 'Allergies', type: 'textarea' },
  { k: 'blood', label: 'Blood type', ph: 'if known' },
  { k: 'doctor', label: 'GP / doctor and phone' },
  { k: 'aids', label: 'Glasses, hearing aids, other aids' },
  { k: 'mobility', label: 'Mobility — anything that makes evacuating harder', type: 'textarea', section: 'Getting out safely' },
  { k: 'evacHelp', label: 'Who helps them evacuate, and how' },
  { k: 'notes', label: 'Other notes (school, work, usual places)', type: 'textarea', section: 'Other' },
];
const CONTACT_F = [
  { k: 'name', label: 'Name' }, { k: 'rel', label: 'Who they are', ph: 'e.g. neighbour, Nana, school office' }, { k: 'phone', label: 'Phone', type: 'tel' },
  { k: 'phone2', label: 'Other phone / email' }, { k: 'address', label: 'Address' },
  { k: 'outOfTown', label: 'Out-of-town contact', type: 'check', ph: 'Lives outside Auckland — everyone checks in with them' },
  { k: 'notes', label: 'Notes', type: 'textarea' },
];
const HOME_F = [
  { k: 'car', label: 'What we call the car in the guides', ph: 'e.g. the Outlander', section: 'Car (our backup power)' },
  { k: 'carModel', label: 'Make, model and year', ph: 'e.g. Mitsubishi Outlander PHEV (2014)' },
  { k: 'carVolts', label: 'Voltage on the car\'s power socket label', type: 'select', options: [['unknown', "Haven't checked"], ['230', '230 V (NZ appliances plug straight in)'], ['100', '100 V (Japanese — needs a step-up transformer)']] },
  { k: 'carOutlet', label: 'Socket power limit (watts)', type: 'number', help: 'Japanese Outlander PHEV sockets are usually 1,500 W in total.' },
  { k: 'carKwh', label: 'Car battery size (kWh)', type: 'number' }, { k: 'carFuelL', label: 'Fuel tank (litres)', type: 'number' },
  { k: 'carNotes', label: 'How we set it up (where the transformer lives, etc.)', type: 'textarea' },
  { k: 'inverter', label: 'Solar inverter', ph: 'e.g. SolarEdge (grid-tied, no battery)', section: 'Solar' },
  { k: 'tankL', label: 'Size of each water tank (litres)', type: 'number', section: 'Water' }, { k: 'tankCount', label: 'Number of tanks', type: 'number' },
  { k: 'tapWhere', label: 'Where the tank tap is', ph: 'e.g. the hose tap near the bottom of the tank' },
  { k: 'tankNotes', label: 'Tank notes', type: 'textarea' },
  { k: 'oven', label: 'Pizza oven', ph: 'e.g. the Ooni Karu', section: 'Cooking' },
  { k: 'ovenGas', label: 'Does it have the gas burner?', type: 'select', options: [['unknown', "Don't know"], ['yes', 'Yes'], ['no', 'No']] },
  { k: 'bbq', label: 'Charcoal cooker', ph: 'e.g. the Big Green Egg' }, { k: 'stove', label: 'Camp stove / gas BBQ (if any)' },
  { k: 'radios', label: 'Our walkie-talkies', ph: 'e.g. a Baofeng and four Unidens', section: 'Radios' },
  { k: 'radioCh', label: 'Family radio channel and tone', ph: 'e.g. PRS channel 20 (476.900 MHz), tone 100.0 Hz' },
  { k: 'radioNotes', label: 'Radio notes', type: 'textarea' },
  { k: 'gasMeter', label: 'Where the gas meter / bottles are', section: 'Shut-offs' }, { k: 'waterToby', label: 'Where the water toby (street tap) is' }, { k: 'switchboard', label: 'Where the main switchboard is' },
];
function editHome() { formModal('Our home systems', HOME_F, S.home, v => { Object.assign(S.home, v); persist(); render(); }, { intro: '<p class="small muted">These details are written into the step-by-step guides.</p>' }); }
function personSummary(p) {
  const a = AGE[p.age];
  return [a ? a[1] : '', p.medical ? '🩺 ' + p.medical : '', p.meds ? '💊 ' + p.meds : '', p.allergies ? '⚠️ ' + p.allergies : '', p.mobility ? '🦯 ' + p.mobility : ''].filter(Boolean).map(esc).join(' · ');
}
function vPlan(main) {
  const h = S.household;
  main.innerHTML = `
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">👪 Family (${peopleCount()})</h2><button class="btn sm primary" id="addP">＋ Add person</button></div>
   <p class="small muted">Everyone in the household. Food, water and protein amounts across the app update automatically.</p>
   ${S.people.length ? `<ul class="list">${S.people.map(p => `<li data-p="${p.id}" style="cursor:pointer"><div class="grow"><b>${esc(p.name || '(no name)')}</b> <span class="muted small">${esc(p.role)}</span>${p.phone ? ` · <a href="${telHref(p.phone)}" onclick="event.stopPropagation()">${esc(p.phone)}</a>` : ''}<div class="small">${personSummary(p)}</div></div><span class="muted">›</span></li>`).join('')}</ul>` : '<div class="empty">Add each person — with medicines, allergies and age group.</div>'}</div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">🏠 Household</h2><button class="btn sm" id="eh">Edit</button></div>
   <table style="margin-top:8px"><tr><td>Name</td><td><b>${esc(h.name)}</b></td></tr><tr><td>Address</td><td>${esc(h.address) || '<span class="muted">—</span>'}</td></tr>
   <tr><td>Parents</td><td>${esc(HA())} (usually home) · ${esc(AW())} (travels for work)</td></tr>
   <tr><td>Supplies target</td><td>${esc(daysTarget())} days</td></tr><tr><td>Daily check-in when apart</td><td>${esc(h.checkin)} NZ time</td></tr>
   <tr><td>Backup adult for the children</td><td>${esc(h.backupAdult) || '<span class="muted">—</span>'} ${esc(h.backupPhone)}</td></tr>
   <tr><td>Home on the map</td><td>${h.homeLat ? '✓ set' : '<span class="muted">not set</span>'} <button class="btn sm ghost" id="sethome">${h.homeLat ? 'Move' : 'Set'}</button></td></tr></table></div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">📞 Contacts</h2><button class="btn sm primary" id="addC">＋ Add</button><button class="btn sm" data-go="data">⬆️ Import from Excel</button></div>
   ${S.contacts.length ? `<ul class="list">${S.contacts.map(c => `<li data-c="${c.id}" style="cursor:pointer"><div class="grow"><b>${esc(c.name)}</b> <span class="muted small">${esc(c.rel)}</span> ${c.outOfTown ? '<span class="pill ok">out of town</span>' : ''}<div>${c.phone ? `<a href="${telHref(c.phone)}" onclick="event.stopPropagation()">${esc(c.phone)}</a>` : ''} <span class="small muted">${esc(c.phone2 || '')}</span></div></div><span class="muted">›</span></li>`).join('')}</ul>` : '<div class="empty">Neighbours, relatives, school, work — and one person outside Auckland.</div>'}</div>
  <div class="card"><h2>📍 Meeting points</h2><ul class="list">${S.meet.map(m => `<li><div class="grow"><b>${esc(m.label)}</b><div class="${m.desc.startsWith('e.g.') ? 'muted small' : ''}">${esc(m.desc)}</div></div><div class="row"><button class="btn sm" data-em="${m.id}">Edit</button><button class="btn sm ghost" data-pm="${m.id}">${m.lat ? 'Move pin' : 'Pin'}</button></div></li>`).join('')}</ul></div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">📋 Family rules</h2><button class="btn sm" id="er">Edit</button></div>
   <p><b>If we can't reach each other:</b> ${esc(S.rules.pickup)}</p>
   <p><b>School emergency plan:</b> ${esc(S.rules.school) || '<span class="muted">Ask the school: do they hold children or release them, and who is on the pickup list?</span>'}</p>${S.rules.note ? `<p>${esc(S.rules.note)}</p>` : ''}
   <p class="small"><a href="#" data-go="g:apart">Full "When we're apart" guide →</a></p></div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">🔧 Our home systems</h2><button class="btn sm" id="ehome">Edit</button></div>
   <table style="margin-top:8px"><tr><td>Car (power)</td><td>${esc(S.home.carModel || S.home.car)} · ${esc(S.home.carOutlet)} W · ${S.home.carVolts === 'unknown' ? '<span class="pill warn">socket voltage not checked</span>' : esc(S.home.carVolts) + ' V'}</td></tr>
   <tr><td>Solar</td><td>${esc(S.home.inverter)}</td></tr>
   <tr><td>Water tank</td><td>${S.home.tankL ? esc(S.home.tankCount) + ' × ' + esc(S.home.tankL) + ' L' : '<span class="muted">size not set</span>'} · ${esc(S.home.tapWhere)}</td></tr>
   <tr><td>Cookers</td><td>${[S.home.stove, S.home.oven + (S.home.ovenGas === 'yes' ? ' (gas + wood)' : ''), S.home.bbq].filter(Boolean).map(esc).join(' · ')}</td></tr>
   <tr><td>Radios</td><td>${esc(S.home.radios)}<br><b>${esc(S.home.radioCh) || '<span class="muted">channel not set</span>'}</b></td></tr>
   <tr><td>Shut-offs</td><td class="small">Gas: ${esc(S.home.gasMeter) || '—'}<br>Water: ${esc(S.home.waterToby) || '—'}<br>Power: ${esc(S.home.switchboard) || '—'}</td></tr></table></div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">📄 Documents & photos</h2><label class="btn sm primary">＋ Add photo<input type="file" accept="image/*,application/pdf" id="docIn" multiple hidden></label></div>
   <p class="small muted">Passports, licences, insurance, prescriptions, photos of the shut-offs. Stored only on this phone — keep it locked with a passcode.</p>
   <div id="docs" class="grid3"></div></div>`;
  const personForm = (p, isNew) => formModal(isNew ? 'Add person' : 'Edit ' + (p.name || 'person'), PERSON_F(), p, v => { if (!v.name && !v.role) { toast('Add a name'); return false; } if (isNew) S.people.push(Object.assign({ id: uid() }, v)); else Object.assign(p, v); persist(); vPlan(main); },
    { onDelete: isNew ? null : () => { S.people = S.people.filter(x => x !== p); persist(); vPlan(main); } });
  $('#addP', main).onclick = () => personForm({ age: 'woman' }, true);
  $$('[data-p]', main).forEach(li => li.onclick = () => personForm(S.people.find(x => x.id === li.dataset.p)));
  $('#eh', main).onclick = () => formModal('Household', [
    { k: 'name', label: 'Household name' }, { k: 'address', label: 'Home address' },
    { k: 'homeName', label: 'Name of the adult usually at home', ph: 'e.g. Dad' }, { k: 'awayName', label: 'Name of a family member who often travels overseas (optional)', ph: 'e.g. Mum' },
    { k: 'days', label: 'Days of supplies to aim for', type: 'select', options: [[3, '3 days (bare minimum)'], [7, '7 days'], [14, '14 days'], [30, '30 days (recommended)'], [60, '60 days'], [90, '3 months'], [180, '6 months']] },
    { k: 'checkin', label: 'Daily check-in time when apart (NZ time)', type: 'time' },
    { k: 'backupAdult', label: 'Backup adult who can collect the children', help: 'If neither parent can. Make sure the school has them on the pickup list.' }, { k: 'backupPhone', label: 'Their phone', type: 'tel' },
  ], h, v => { Object.assign(S.household, v); S.household.days = Number(v.days) || 30; persist(); vPlan(main); });
  $('#addC', main).onclick = () => formModal('Add contact', CONTACT_F, {}, v => { if (!v.name) { toast('Add a name'); return false; } S.contacts.push(Object.assign({ id: uid() }, v)); persist(); vPlan(main); });
  $$('[data-c]', main).forEach(li => li.onclick = () => { const c = S.contacts.find(x => x.id === li.dataset.c); formModal('Edit ' + c.name, CONTACT_F, c, v => { Object.assign(c, v); persist(); vPlan(main); }, { onDelete: () => { S.contacts = S.contacts.filter(x => x !== c); persist(); vPlan(main); } }); });
  $$('[data-em]', main).forEach(b => b.onclick = () => { const m = S.meet.find(x => x.id === b.dataset.em); formModal(m.label, [{ k: 'desc', label: 'Where exactly?', type: 'textarea' }], { desc: m.desc.startsWith('e.g.') ? '' : m.desc }, v => { m.desc = v.desc || m.desc; persist(); vPlan(main); }); });
  $$('[data-pm]', main).forEach(b => b.onclick = () => { const m = S.meet.find(x => x.id === b.dataset.pm); startPick('Tap the map where meeting point ' + m.label.split(' ')[0] + ' is', (lat, lon) => { m.lat = lat; m.lon = lon; persist(); toast('Meeting point pinned'); go('plan'); }, m.lat ? [m.lat, m.lon] : null); });
  $('#sethome', main).onclick = () => startPick('Tap the map on our house', (lat, lon) => { S.household.homeLat = lat; S.household.homeLon = lon; persist(); toast('Home set'); go('plan'); }, h.homeLat ? [h.homeLat, h.homeLon] : null);
  $('#er', main).onclick = () => formModal('Family rules', [{ k: 'pickup', label: 'If we can\'t reach each other…', type: 'textarea' }, { k: 'school', label: 'School emergency plan', type: 'textarea' }, { k: 'note', label: 'Anything else', type: 'textarea' }], S.rules, v => { Object.assign(S.rules, v); persist(); vPlan(main); });
  $('#ehome', main).onclick = editHome;
  $('#docIn', main).onchange = async e => { for (const f of e.target.files) { const id = uid(); const blob = f.type.startsWith('image/') ? await shrinkImage(f) : f; await idb.put('files', id, blob); S.docs.push({ id, name: f.name.replace(/\.[^.]+$/, ''), type: blob.type, at: Date.now() }); } persist(); renderDocs(); };
  renderDocs();
}
async function shrinkImage(file, max = 1800) {
  try { const bmp = await createImageBitmap(file); const k = Math.min(1, max / Math.max(bmp.width, bmp.height)); const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.82)); } catch (e) { return file; }
}
async function renderDocs() {
  const el = $('#docs'); if (!el) return;
  if (!S.docs.length) { el.innerHTML = '<div class="empty" style="grid-column:1/-1">No documents yet.</div>'; return; }
  el.innerHTML = '';
  for (const d of S.docs) {
    const b = await idb.get('files', d.id); const div = document.createElement('div'); div.className = 'card'; div.style.cssText = 'padding:8px;margin:0';
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
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').slice(0, 40);
function supplyItems() {
  const base = SUPPLIES.map(r => { const nd = supplyNeed(r); return { key: 's:' + slug(r[1]), group: r[0], name: r[1], need: fmtNum(nd.n), unit: nd.unit, expires: r[5] }; });
  const custom = S.supplies.custom.map(c => ({ key: c.id, group: c.group || 'Our extras', name: c.name, need: c.need || '', unit: c.unit || '', expires: true, custom: c }));
  return base.concat(custom).filter(it => !S.supplies.hidden[it.key]);
}
function expiringItems(within) { const now = Date.now(); return supplyItems().filter(it => { const d = S.supplies.expiry[it.key]; return d && (new Date(d).getTime() - now) / 864e5 <= within; }).map(it => ({ name: it.name, date: S.supplies.expiry[it.key] })); }
let KITFILTER = 'all';
function vKit(main) {
  const items = supplyItems(); const groups = {}; items.forEach(it => (groups[it.group] = groups[it.group] || []).push(it));
  const have = items.filter(it => S.supplies.have[it.key]).length; const exp = expiringItems(45);
  main.innerHTML = `
  <div class="card"><h2>🎒 Supplies</h2>
   <p>Sized for <b>${peopleCount()} people</b> for <b>${daysTarget()} days</b> (protein ${Math.round(proteinDay())} g a day). <a href="#" id="chg">Change days</a> · <a href="#" data-go="g:pantry">Pantry guide</a></p>
   <div class="ready-bar"><i style="width:${Math.round(have / items.length * 100)}%"></i></div>
   <div class="row small"><b>${have} of ${items.length}</b> ticked<span class="grow"></span>${['all', 'need', 'have', 'expiry'].map(f => `<button class="chip ${KITFILTER === f ? 'on' : ''}" data-f="${f}" style="border:0;cursor:pointer">${{ all: 'All', need: 'Still need', have: 'Have', expiry: 'Use-by dates' }[f]}</button>`).join('')}</div></div>
  ${exp.length ? `<div class="card note"><b>Near the use-by date (45 days):</b><ul style="margin:6px 0 0">${exp.map(e => `<li>${esc(e.name)} — ${fmtDate(e.date)}</li>`).join('')}</ul></div>` : ''}
  ${Object.entries(groups).map(([g, arr]) => { const shown = arr.filter(it => KITFILTER === 'all' || (KITFILTER === 'need' && !S.supplies.have[it.key]) || (KITFILTER === 'have' && S.supplies.have[it.key]) || (KITFILTER === 'expiry' && it.expires)); if (!shown.length) return '';
    return `<div class="card"><h3 style="margin-top:0">${esc(g)}</h3><ul class="list">${shown.map(it => `<li><span class="tick ${S.supplies.have[it.key] ? 'on' : ''}" data-have="${esc(it.key)}" role="checkbox" aria-checked="${!!S.supplies.have[it.key]}" tabindex="0">${S.supplies.have[it.key] ? '✓' : ''}</span>
     <div class="grow"><div>${esc(it.name)}</div><div class="small muted">${it.need !== '' ? 'Need about <b>' + esc(it.need) + (it.unit ? ' ' + esc(it.unit) : '') + '</b>' : ''}${S.supplies.note[it.key] ? ' · ' + esc(S.supplies.note[it.key]) : ''}${S.supplies.expiry[it.key] ? ` · <span class="${(new Date(S.supplies.expiry[it.key]) - Date.now()) / 864e5 < 45 ? 'pill warn' : ''}">use by ${fmtDate(S.supplies.expiry[it.key])}</span>` : ''}</div></div>
     <button class="btn sm ghost" data-ed="${esc(it.key)}" aria-label="Edit">✏️</button></li>`).join('')}</ul></div>`; }).join('')}
  <div class="card row"><button class="btn primary" id="addItem">＋ Add our own item</button>${Object.keys(S.supplies.hidden).length ? `<button class="btn ghost" id="showHidden">Show hidden items (${Object.keys(S.supplies.hidden).length})</button>` : ''}<button class="btn" data-go="data">⬆️ Import / export Excel</button></div>
  <p class="small muted">Grab-bag contents: see the <a href="#" data-go="g:grab-bags">Grab bags</a> guide.</p>`;
  $('#chg', main).onclick = e => { e.preventDefault(); go('plan'); setTimeout(() => $('#eh') && $('#eh').click(), 50); };
  $$('[data-f]', main).forEach(b => b.onclick = () => { KITFILTER = b.dataset.f; vKit(main); });
  $$('[data-have]', main).forEach(t => t.onclick = () => { const k = t.dataset.have; if (S.supplies.have[k]) delete S.supplies.have[k]; else S.supplies.have[k] = true; persist(); vKit(main); });
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
    if (!v.name) { toast('Add a name'); return false; } const c = { id: 'c' + uid(), name: v.name, group: v.group || 'Our extras', need: v.need }; S.supplies.custom.push(c); if (v.expiry) S.supplies.expiry[c.id] = v.expiry; persist(); vKit(main); });
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
  { k: 'checked', label: 'Last checked they\'re still around', type: 'date' }, { k: 'notes', label: 'Notes', type: 'textarea' },
];
function vSources(main) {
  const q = norm(SRCQ);
  const list = S.sources.filter(s => (!SRCCAT || s.cat === SRCCAT) && (!q || q.split(/\s+/).every(w => norm([s.name, s.supplies, s.notes, s.address, s.trade].join(' ')).includes(w))));
  const cat = c => SOURCE_CATS.find(x => x[0] === c) || SOURCE_CATS[SOURCE_CATS.length - 1];
  main.innerHTML = `
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">🤝 Suppliers & contacts</h2><button class="btn sm primary" id="addS">＋ Add</button><button class="btn sm" data-go="data">⬆️ Import Excel</button></div>
   <p class="small muted">People and places we can get food, animals and essentials from when the shops are empty. Build this list now.</p>
   <input type="search" id="sq" placeholder="Search — e.g. eggs, seed, gas, firewood" value="${esc(SRCQ)}">
   <div style="margin-top:8px">${SOURCE_CATS.map(c => `<button class="chip ${SRCCAT === c[0] ? 'on' : ''}" data-cat="${c[0]}" style="border:0;cursor:pointer">${c[1]} ${esc(c[2])} <span class="muted">${S.sources.filter(s => s.cat === c[0]).length || ''}</span></button>`).join('')}</div>
   ${SRCCAT ? `<div class="note small" style="margin-top:8px"><b>Who to line up:</b> ${esc(cat(SRCCAT)[3])}</div>` : ''}</div>
  ${list.length ? list.map(s => { const c = cat(s.cat); const stale = s.checked && daysSince(new Date(s.checked).getTime()) > 365; return `<div class="card"><div class="row"><div class="grow"><div class="small muted">${c[1]} ${esc(c[2])}</div><h3 style="margin:2px 0">${esc(s.name)}</h3></div><button class="btn sm ghost" data-es="${s.id}">✏️</button></div>
    ${s.supplies ? `<div>${esc(s.supplies)}</div>` : ''}
    <div class="row" style="margin-top:8px">${s.phone ? `<a class="btn sm primary" href="${telHref(s.phone)}">📞 ${esc(s.phone)}</a><a class="btn sm" href="sms:${esc(s.phone.replace(/[^0-9+]/g, ''))}">💬 Text</a>` : ''}${s.lat ? `<button class="btn sm" data-ms="${s.id}">🗺️ Map</button>` : ''}</div>
    <div class="small muted" style="margin-top:6px">${[s.address, s.phone2, s.trade ? 'Trade: ' + s.trade : '', s.notes].filter(Boolean).map(esc).join(' · ')}</div>
    ${s.checked ? `<div class="small ${stale ? '' : 'muted'}" style="margin-top:4px">${stale ? '⚠️ ' : ''}Last checked ${fmtDate(s.checked)}</div>` : ''}</div>`; }).join('')
    : `<div class="card empty">${S.sources.length ? 'Nothing matches.' : 'No suppliers yet.<br><br>Tap a category above for ideas on who to add, then <b>＋ Add</b> — or fill in the Excel template and import it.'}</div>`}`;
  $('#sq', main).oninput = e => { SRCQ = e.target.value; const pos = e.target.selectionStart; vSources(main); const n = $('#sq', main); n.focus(); n.setSelectionRange(pos, pos); };
  $$('[data-cat]', main).forEach(b => b.onclick = () => { SRCCAT = SRCCAT === b.dataset.cat ? '' : b.dataset.cat; vSources(main); });
  const editSrc = s => {
    const isNew = !s; s = s || { id: uid(), cat: SRCCAT || 'produce' };
    formModal(isNew ? 'Add supplier / contact' : 'Edit ' + s.name, SOURCE_F(), s, v => { if (!v.name) { toast('Add a name'); return false; } Object.assign(s, v); if (isNew) S.sources.push(s); persist(); vSources(main); },
      { onDelete: isNew ? null : () => { S.sources = S.sources.filter(x => x !== s); persist(); vSources(main); }, intro: isNew ? '' : `<button class="btn sm" id="pinS" type="button">📍 ${s.lat ? 'Move pin on map' : 'Pin on map'}</button>`,
        onMount: (m, close) => { const pb = $('#pinS', m); if (pb) pb.onclick = () => { close(); startPick('Tap where ' + s.name + ' is', (lat, lon) => { s.lat = lat; s.lon = lon; persist(); toast('Location saved'); go('sources'); }, s.lat ? [s.lat, s.lon] : null); }; } });
  };
  $('#addS', main).onclick = () => editSrc(null);
  $$('[data-es]', main).forEach(b => b.onclick = () => editSrc(S.sources.find(x => x.id === b.dataset.es)));
  $$('[data-ms]', main).forEach(b => b.onclick = () => { const s = S.sources.find(x => x.id === b.dataset.ms); MAPFOCUS = [s.lat, s.lon, 15]; go('map'); });
}

// ---------------------------------------------------------------------------
// SETTINGS / DATA
// ---------------------------------------------------------------------------
async function vData(main) {
  const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate().catch(() => null) : null;
  const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted().catch(() => false) : false;
  const tiles = await idb.count('tiles').catch(() => 0);
  main.innerHTML = `
  <div class="card"><h2>📄 A4 pack</h2><p class="small muted">A designed PDF of everything — cover, contents, quick reference, our plan, every guide, supplies and suppliers. Print it or keep it on a USB stick.</p><button class="btn primary" data-go="pack">Make the A4 pack</button></div>
  <div class="card"><h2>📊 Excel — import & export</h2>
   <p class="small muted">Fill in the Excel template (Family, Contacts, Suppliers, Supplies, Places), then import it. Or export what's in the app, edit it in Excel and import it again.</p>
   <div class="row"><button class="btn" id="xTpl">⬇️ Excel template</button><label class="btn primary">⬆️ Import Excel / CSV<input type="file" id="xIn" accept=".xlsx,.xls,.csv" hidden></label><button class="btn" id="xOut">⬇️ Export to Excel</button></div></div>
  <div class="card"><h2>💾 Backup & share to the other phones</h2>
   <p>Last backup: <b>${S.meta.lastBackup ? fmtDate(S.meta.lastBackup) : 'never'}</b>${S.meta.changed > S.meta.lastBackup ? ' <span class="pill warn">changes since</span>' : ''}</p>
   <p class="small muted">One file with everything — plan, people, contacts, supplies, suppliers, our guide edits and documents. Send it to the other phones (AirDrop, email, Messages) and tap Restore there. Keep a copy on OneDrive and a USB stick in the grab bag.</p>
   <div class="row"><button class="btn primary" id="bk">⬇️ Back up now</button><label class="btn">⬆️ Restore from file<input type="file" id="rs" accept=".json,application/json" hidden></label></div></div>
  <div class="card"><h2>🗺️ Map data</h2>
   <p>Saved map areas: <b>${S.saved.maps.length}</b> (${tiles.toLocaleString()} pieces). <a href="#" data-go="map">Open the map → ⬇️ Save maps</a></p>
   <p>Emergency map data (tsunami zones, hospitals, pharmacies, AEDs, fire, police, marae): <b>${S.meta.layersAt ? 'downloaded ' + fmtDate(S.meta.layersAt) : 'not downloaded'}</b></p>
   <button class="btn primary" id="dl">⬇️ ${S.meta.layersAt ? 'Refresh' : 'Download'} emergency map data</button><div id="dlS" class="small" style="margin-top:8px"></div>
   <label class="f">LINZ map key (needed for Topo50 and aerial maps)</label><div class="small muted" style="margin:-2px 0 6px">Open basemaps.linz.govt.nz, copy its link (contains api=c…), paste it here. It lasts 90 days — or email basemaps@linz.govt.nz for a free Developer key that doesn't expire. Saved maps keep working without a key.</div><div class="row"><input type="text" id="lk" value="${esc(S.set.linzKey)}" placeholder="Paste a link from basemaps.linz.govt.nz or a key" style="flex:1"><button class="btn" id="lkS">Save</button></div>
   <p class="small muted">Maps: Toitū Te Whenua LINZ (CC BY 4.0). Places: © OpenStreetMap contributors (ODbL). Tsunami zones: Auckland Council.</p></div>
  <div class="card"><h2>📱 This device</h2>
   <p>Installed as an app: <b>${isInstalled() ? 'yes' : 'no'}</b>${!isInstalled() ? ` <label class="row small" style="display:inline-flex"><input type="checkbox" id="inst"${S.manual.install ? ' checked' : ''}> Done on our phones</label>` : ''}</p>
   ${!isInstalled() ? `<div class="note small"><b>iPhone:</b> open in Safari → Share → <b>Add to Home Screen</b>.<br><b>Android:</b> open in Chrome → ⋮ → <b>Install app</b>.<br>Then open it once in airplane mode to check it works offline.</div>` : ''}
   <p>Storage used: <b>${est ? MB(est.usage || 0) : '—'}</b> · Protected from clean-up: <b>${persisted ? 'yes' : 'no'}</b>${!persisted ? ' <button class="btn sm" id="pp">Protect</button>' : ''}</p>
   <div class="grid2" style="grid-template-columns:1fr 1fr"><div><label class="f">Appearance</label><select id="th"><option value="auto">Match phone</option><option value="light">Light</option><option value="dark">Dark (easier at night)</option></select></div>
   <div><label class="f">Text size</label><select id="ts"><option value="normal">Normal</option><option value="large">Large</option><option value="xl">Extra large</option></select></div></div></div>
  <div class="card"><h2>About</h2><p class="small">Family Ready · version ${APP_VERSION}. A free, non-commercial guide for NZ households. Guidance drawn from NEMA / Get Ready, Auckland Emergency Management, Te Whatu Ora, St John and ANZCOR first aid, MPI, NZ SafeTravel and Smartraveller. <b>This app is a guide, not official advice</b> — always follow Civil Defence, emergency services and official warnings. Everything you type stays on this device.</p>
   <div class="row" style="margin-bottom:10px"><a class="btn sm" href="${reportUrl('Report: ', 'App version: ' + APP_VERSION + '\n\nWhat is wrong or missing (please don\'t include personal details):\n')}" target="_blank" rel="noopener">🐞 Report a mistake or suggest a change</a><button class="btn sm ghost" id="wAgain">Show the welcome note</button></div>
   <p class="small muted">Reports go to the app's public GitHub page (a free GitHub account is needed) — don't include personal details.</p>
   <button class="btn ghost" id="wipe" style="color:var(--accent)">Erase everything on this device</button></div>`;
  $('#th', main).value = S.set.theme || 'auto'; $('#ts', main).value = S.set.textSize || 'normal';
  $('#th', main).onchange = e => { S.set.theme = e.target.value; applyTheme(); persist(false); };
  $('#ts', main).onchange = e => { S.set.textSize = e.target.value; applyTheme(); persist(false); };
  $('#bk', main).onclick = backup;
  $('#rs', main).onchange = e => e.target.files[0] && restore(e.target.files[0]);
  $('#xTpl', main).onclick = downloadTemplate;
  $('#xOut', main).onclick = exportExcel;
  $('#xIn', main).onchange = e => { if (e.target.files[0]) importExcel(e.target.files[0]); e.target.value = ''; };
  $('#dl', main).onclick = async e => { e.target.disabled = true; await downloadLayers(m => { const s = $('#dlS'); if (s) s.textContent = m; }); e.target.disabled = false; };
  $('#lkS', main).onclick = () => { const v = $('#lk', main).value.trim(); const m = v.match(/[?&]api=([A-Za-z0-9_-]+)/); S.set.linzKey = m ? m[1] : v; persist(); toast('Saved'); };
  const inst = $('#inst', main); if (inst) inst.onchange = e => { S.manual.install = e.target.checked; persist(); };
  const pp = $('#pp', main); if (pp) pp.onclick = async () => { const ok = navigator.storage && await navigator.storage.persist(); toast(ok ? 'Protected' : 'The browser said no — installing the app usually fixes this'); vData(main); };
  $('#wAgain', main).onclick = () => showWelcome(true);
  $('#wipe', main).onclick = e => confirmTwice(e.target, 'Tap again — this cannot be undone', async () => { await idb.clear('kv'); await idb.clear('tiles'); await idb.clear('files'); try { localStorage.removeItem('family-ready-state'); } catch (x) {} S = DEFAULT_STATE(); migrate(); OSMDATA = TSUNAMI = null; toast('Erased'); go('now'); });
}
