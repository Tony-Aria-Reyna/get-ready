// ---------------------------------------------------------------------------
// A4 PACK — a designed PDF of everything (pdfmake, bundled for offline use)
// ---------------------------------------------------------------------------
const PACK_PARTS = [
  ['quick', 'Quick reference (first pages)', true], ['plan', 'Our family plan — people, contacts, meeting points, home', true],
  ['health', 'Include everyone\'s medical details', true],
  ...CATS.map(c => ['cat:' + c[0], c[2] + ' ' + c[1], true]),
  ['supplies', 'Supplies checklist', true], ['sources', 'Suppliers & contacts directory', true], ['notes', 'Blank notes pages', true],
  ['newpage', 'Start every guide on a new page (easier to find and tear out)', true],
];
function vPack(main) {
  const on = Object.assign(Object.fromEntries(PACK_PARTS.map(p => [p[0], p[2]])), S.set.pack || {});
  const T = tokens(); const cnt = c => allGuides().filter(g => g.cat === c).length;
  main.innerHTML = `<div class="gnav"><button class="btn sm ghost" data-go="data">← Settings</button></div>
  <div class="card"><h1>📄 A4 pack</h1><p>A designed, printable PDF with a cover, a contents page with page numbers (tap to jump), colour-coded chapters, and every guide with all your edits and notes. Keep a printed copy with the grab bags and one in the car.</p>
  <h3>Include</h3><ul class="list">${PACK_PARTS.map(p => { const c = p[0].startsWith('cat:') ? p[0].slice(4) : null; if (c && !cnt(c)) return ''; return `<li><span class="tick ${on[p[0]] ? 'on' : ''}" data-p="${p[0]}" role="checkbox" aria-checked="${!!on[p[0]]}" tabindex="0">${on[p[0]] ? '✓' : ''}</span><span class="grow">${esc(c === 'away' ? p[1] + ' (' + AW() + ')' : p[1])}${c ? ` <span class="muted small">${cnt(c)} guides</span>` : ''}</span></li>`; }).join('')}</ul>
  <div class="row" style="margin-top:12px"><button class="btn primary" id="mk">📄 Make the PDF</button><span id="mkS" class="small muted"></span></div>
  <p class="small muted">Takes 5–30 seconds on a phone. On iPhone, choose "Save to Files" or "Print" from the share sheet.</p></div>`;
  $$('[data-p]', main).forEach(t => t.onclick = () => { on[t.dataset.p] = !on[t.dataset.p]; S.set.pack = on; persist(false); vPack(main); });
  $('#mk', main).onclick = async e => {
    e.target.disabled = true; $('#mkS', main).textContent = 'Building…';
    try {
      await new Promise(r => setTimeout(r, 30));
      const blob = await buildPack(on);
      S.manual.print = true; persist();
      await saveFile(blob, `${slug(S.household.name || 'family')}-emergency-pack-${new Date().toISOString().slice(0, 10)}.pdf`);
      $('#mkS', main).textContent = `Done — ${MB(blob.size)}`;
    } catch (err) { console.error(err); $('#mkS', main).textContent = 'Something went wrong: ' + err.message; }
    e.target.disabled = false;
  };
}

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu;
const deEmoji = s => String(s || '').replace(/→/g, '>').replace(/←/g, '<').replace(EMOJI, '').replace(/\s{2,}/g, ' ').trim();
function pdfRuns(s, T, dests) {
  s = deEmoji(fill(s, T)); const out = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*(.+?)\*\*|\*([^*\n]+?)\*/g; let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    if (m[1]) { const id = m[1].trim(); const g = /^(tab|tool):/.test(id) ? null : getGuide(id); const label = deEmoji(m[2] || (g ? guideTitle(g, T) : id.replace(/^(tab|tool):/, '')));
      out.push(g && dests.has(id) ? { text: label, linkToDestination: 'g-' + id, color: '#24527f', decoration: 'underline' } : { text: label, italics: true }); }
    else if (m[3]) out.push(...pdfRuns(m[3], T, dests).map(r => Object.assign(r, { bold: true })));
    else if (m[4]) out.push({ text: m[4], italics: true });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out.length ? out : [{ text: '' }];
}
const BOX = { warn: ['#fdecea', '#c62828'], note: ['#eaf1f8', '#24527f'], tip: ['#e9f5ee', '#2f7d4f'] };
function boxNode(content, kind) {
  const [fill, line] = BOX[kind];
  return { table: { widths: ['*'], body: [[{ text: content, fillColor: fill, margin: [8, 5, 6, 5] }]] }, layout: { hLineWidth: () => 0, vLineWidth: i => i === 0 ? 3 : 0, vLineColor: () => line }, margin: [0, 3, 0, 6] };
}
function tickBox(done) { return { canvas: [{ type: 'rect', x: 0, y: 1.5, w: 8.5, h: 8.5, lineWidth: 0.8, lineColor: '#555' }].concat(done ? [{ type: 'polyline', lineWidth: 1.4, lineColor: '#2f7d4f', points: [{ x: 1.5, y: 6 }, { x: 4, y: 8.5 }, { x: 8, y: 2.5 }] }] : []), width: 14 }; }
function guidePdf(g, T, dests, colour, opts) {
  const nodes = [];
  nodes.push({ text: deEmoji(guideTitle(g, T)), style: 'gtitle', color: colour, id: 'g-' + g.id, tocItem: true, tocStyle: 'tocG', tocMargin: [12, 2, 0, 0], pageBreak: opts.newpage ? 'before' : undefined });
  if (g.one) nodes.push(boxNode(pdfRuns(g.one, T, dests).map(r => Object.assign(r, { bold: r.bold !== false })), 'note'));
  for (const s of sections(expandTokens(g.body, T))) {
    const sec = [];
    for (const b of blocks(s.lines)) {
      if (b.type === 'step') sec.push({ ol: b.items.map(l => ({ text: pdfRuns(stripMark(l.t, 'step'), T, dests), margin: [0, 0, 0, 3] })), margin: [0, 2, 0, 6], markerColor: colour, n: b.items.length });
      else if (b.type === 'bullet') sec.push({ ul: b.items.map(l => ({ text: pdfRuns(stripMark(l.t, 'bullet'), T, dests), margin: [0, 0, 0, 2] })), margin: [0, 2, 0, 6], n: b.items.length });
      else if (b.type === 'check') sec.push({ table: { widths: [14, '*'], dontBreakRows: true, body: b.items.map(l => [tickBox((S.ticks[g.id] || {})[hash(l.t)]), { text: pdfRuns(stripMark(l.t, 'check'), T, dests), margin: [0, 0, 0, 2] }]) }, layout: 'noBorders', margin: [0, 2, 0, 6], n: b.items.length });
      else if (b.type === 'table') {
        const rows = b.items.map(l => l.t.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())); const n = Math.max(...rows.map(r => r.length));
        sec.push({ table: { headerRows: 1, widths: Array(n).fill('*'), dontBreakRows: true, body: rows.map((r, i) => Array.from({ length: n }, (_, j) => ({ text: pdfRuns(r[j] || '', T, dests), bold: i === 0, fillColor: i === 0 ? '#eef0f3' : null, fontSize: 9 }))) }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#c9ced6', vLineColor: () => '#c9ced6', paddingTop: () => 3, paddingBottom: () => 3 }, margin: [0, 3, 0, 8], n: rows.length });
      } else {
        const l = b.items[0]; const runs = pdfRuns(stripMark(l.t, b.type), T, dests);
        if (b.type === 'sub') sec.push({ text: runs, style: 'h4', n: 1 });
        else if (BOX[b.type]) sec.push(Object.assign(boxNode(b.type === 'warn' ? [{ text: '! ', bold: true, color: '#c62828' }].concat(runs) : runs, b.type), { n: 1 }));
        else sec.push({ text: runs, margin: [0, 2, 0, 5], n: 1 });
      }
    }
    // keep a heading together with the start of what follows it
    const head = s.title ? { text: pdfRuns(s.title, T, dests), style: 'h3', color: colour } : null;
    if (head && sec.length && sec[0].n <= 6) nodes.push({ stack: [head, sec.shift()], unbreakable: true });
    else if (head) nodes.push(head);
    sec.forEach(x => { delete x.n; nodes.push(x); });
    nodes.forEach(x => { if (x.stack) x.stack.forEach(y => delete y.n); });
  }
  nodes.push({ text: '', margin: [0, 0, 0, 10] });
  return nodes;
}
function chapterHead(title, colour, desc, id) {
  return [{ canvas: [{ type: 'rect', x: 0, y: 0, w: 499, h: 70, color: colour, r: 6 }], pageBreak: 'before' },
    { text: deEmoji(title), style: 'chapter', margin: [16, -58, 0, 0], id, tocItem: true, tocStyle: 'tocC', tocMargin: [0, 8, 0, 0] },
    { text: deEmoji(desc || ''), color: '#ffffff', fontSize: 10, margin: [16, 2, 0, 26] }];
}
const tbl = (head, rows, widths) => ({ table: { headerRows: 1, widths: widths || head.map(() => '*'), body: [head.map(h => ({ text: h, bold: true, fillColor: '#eef0f3', fontSize: 9 }))].concat(rows.length ? rows.map(r => r.map(c => ({ text: typeof c === 'string' ? deEmoji(c) : c, fontSize: 9 }))) : [[{ text: '—', colSpan: head.length }].concat(head.slice(1).map(() => ''))]) }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#c9ced6', vLineColor: () => '#c9ced6', paddingTop: () => 3, paddingBottom: () => 3 }, margin: [0, 2, 0, 10] });
async function buildPack(on) {
  loadLib('lib-pdfmake', 'pdfMake'); loadLib('lib-vfs', 'pdfMake');
  const T = tokens(); const h = S.household; const today = new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
  const guides = allGuides(); const included = guides.filter(g => on['cat:' + g.cat]);
  const dests = new Set(included.map(g => g.id));
  const content = [];
  let chapN = 0;
  // ---- cover
  content.push({ canvas: [{ type: 'rect', x: -48, y: -62, w: 595, h: 360, color: '#16324f' }, { type: 'rect', x: -48, y: 298, w: 595, h: 8, color: '#d1462f' }] });
  content.push({ text: deEmoji(h.name || 'Our family'), fontSize: 34, bold: true, color: '#ffffff', margin: [0, -250, 0, 6] });
  content.push({ text: 'Emergency Plan & Survival Guide', fontSize: 20, color: '#ffffff', margin: [0, 0, 0, 4] });
  content.push({ text: 'What to do, step by step — for every member of the family', fontSize: 12, color: '#cfd8e3', margin: [0, 0, 0, 175] });
  content.push({ table: { widths: ['*'], body: [[{ stack: [{ text: 'In an emergency call 111', fontSize: 22, bold: true, color: '#d1462f' }, { text: 'Healthline 0800 611 116  ·  Poisons 0800 764 766  ·  RNZ National 101.4 FM', fontSize: 11, margin: [0, 4, 0, 0] }], margin: [14, 12, 14, 12] }]] }, layout: { hLineColor: () => '#d1462f', vLineColor: () => '#d1462f', hLineWidth: () => 1.5, vLineWidth: () => 1.5 } });
  content.push({ text: [{ text: 'Updated: ', bold: true }, today, '   ·   ', { text: 'People: ', bold: true }, String(peopleCount()), h.address ? '   ·   ' + deEmoji(h.address) : ''], margin: [0, 24, 0, 4], fontSize: 10 });
  content.push({ text: 'Keep one copy with the grab bags and one in the car. Reprint after changes. The app has the same information and works with no internet.', fontSize: 9, color: '#5d6670' });
  // ---- contents
  content.push({ toc: { title: { text: 'Contents', style: 'h1' }, numberStyle: { bold: true } }, pageBreak: 'before' });
  // ---- quick reference
  if (on.quick) {
    content.push(...chapterHead('Quick reference', '#b91c1c', 'The most important things, on two pages.', 'ch-' + (chapN++)));
    const fh = getGuide('first-hour');
    content.push({ columns: [
      { width: '*', stack: [{ text: 'Call 111 if life is at risk', style: 'h3', color: '#b91c1c' },
        { text: 'The first hour — in this order', bold: true, margin: [0, 4, 0, 2] },
        { ol: ['Make yourself safe. Shoes on. Torch.', 'Check people and treat injuries.', 'Gas smell? Everyone out, gas off.', 'One text to the family: where you are, OK or hurt, battery %.', 'Radio: RNZ National 101.4 FM.', 'Fill water bottles and the bath if taps still run.', 'Stay or go? Follow the plan.'].map(t => ({ text: t, margin: [0, 0, 0, 2] })) },
        { text: 'Earthquake', bold: true, margin: [0, 8, 0, 1] }, { text: 'Drop, Cover, Hold. Near the coast and it was long or strong: walk to high ground now.' },
        { text: 'Tsunami', bold: true, margin: [0, 6, 0, 1] }, { text: 'Long or strong — get gone. Walk or run inland or uphill. Stay out until the all clear.' },
        { text: 'Flood', bold: true, margin: [0, 6, 0, 1] }, { text: 'Never drive or walk through floodwater. 15 cm can knock you over; 30 cm floats a car.' },
        { text: 'Gas, BBQs, generators', bold: true, margin: [0, 6, 0, 1] }, { text: 'Outdoors only — carbon monoxide kills.' }] },
      { width: 230, stack: [{ text: 'Key numbers', style: 'h3' }, tbl(['Who', 'Number'], NUMBERS.map(n => [n.label, { text: n.n, bold: true }]), ['*', 78]),
        { text: 'Radio', style: 'h3' }, tbl(['Station', 'Frequency'], RADIO.map(r => [r[0], r[1]]), ['*', 90])] }], columnGap: 18 });
    content.push({ text: 'Where we meet', style: 'h3', pageBreak: 'before' });
    content.push(tbl(['Meeting point', 'Where'], S.meet.map(m => [{ text: m.label.replace(/^\d · /, ''), bold: true }, m.desc.startsWith('e.g.') ? '(not set yet)' : m.desc + (m.lat ? `  (${m.lat.toFixed(5)}, ${m.lon.toFixed(5)})` : '')]), [130, '*']));
    content.push(boxNode([{ text: 'If we can\'t reach each other: ', bold: true }, { text: deEmoji(S.rules.pickup) }], 'warn'));
    content.push({ text: 'Our people', style: 'h3' });
    content.push(tbl(['Name', 'Who', 'Phone'], [...S.people.map(p => [p.name || '', p.role || '', p.phone || '']), ...S.contacts.map(c => [c.name, (c.rel || '') + (c.outOfTown ? ' (out of town)' : ''), c.phone || '']), ...(h.backupAdult ? [[h.backupAdult, 'Backup adult for the children', h.backupPhone || '']] : [])], ['*', '*', 110]));
    content.push({ columns: [{ width: '*', stack: [{ text: 'At home', style: 'h3' }, tbl(['', ''], [['Radio channel', S.home.radioCh || '—'], ['Daily check-in when apart', (h.checkin || '19:00') + ' NZ time'], ['Gas shut-off', S.home.gasMeter || '—'], ['Water toby', S.home.waterToby || '—'], ['Main switchboard', S.home.switchboard || '—'], ['Power in a cut', deEmoji(T.car) + ' — see the Power cut guide']], [110, '*'])] },
      { width: 200, stack: [{ text: deEmoji(AW()) + ' overseas', style: 'h3' }, tbl(['', ''], [['NZ consular 24/7', '+64 99 20 20 20'], ['Japan', '110 police · 119 fire/ambulance'], ['Australia', '000 (112 mobile)'], ['USA', '911'], ['Fiji', '911 · 917 police'], ['Singapore', '995 · 999 police'], ['Bali', '112 · 118 ambulance'], ['Taipei', '119 · 110 police']], [80, '*'])] }], columnGap: 14 });
  }
  // ---- family plan
  if (on.plan) {
    content.push(...chapterHead('Our family plan', '#0f766e', 'People, contacts, meeting points, rules and our home systems.', 'ch-' + (chapN++)));
    content.push({ text: 'Our family', style: 'h3' });
    content.push(tbl(['Name', 'Who', 'Age group', 'Phone', 'Date of birth'], S.people.map(p => [{ text: p.name || '', bold: true }, p.role || '', (AGE[p.age] || ['', ''])[1], p.phone || '', p.dob || '']), ['*', '*', 80, 80, 66]));
    if (on.health) content.push({ text: 'Health and getting out safely', style: 'h3' }, tbl(['Name', 'Conditions', 'Medicines', 'Allergies', 'Other'], S.people.map(p => [{ text: p.name || p.role || '', bold: true }, p.medical || '', p.meds || '', p.allergies || '', [p.blood && 'Blood: ' + p.blood, p.doctor && 'GP: ' + p.doctor, p.aids, p.mobility && 'Mobility: ' + p.mobility, p.evacHelp && 'Evacuation help: ' + p.evacHelp].filter(Boolean).join('\n')]), [62, '*', '*', 70, '*']));
    content.push({ text: 'Contacts', style: 'h3' }, tbl(['Name', 'Who', 'Phone', 'Other / notes'], S.contacts.map(c => [{ text: c.name, bold: true }, (c.rel || '') + (c.outOfTown ? ' — OUT OF TOWN' : ''), c.phone || '', [c.phone2, c.address, c.notes].filter(Boolean).join('\n')]), [90, '*', 90, '*']));
    content.push({ text: 'Rules when we\'re apart', style: 'h3' }, { ul: [S.rules.pickup, 'Daily check-in when apart: ' + (h.checkin || '19:00') + ' NZ time.', 'Backup adult for the children: ' + (h.backupAdult || 'not set') + ' ' + (h.backupPhone || ''), S.rules.school ? 'School: ' + S.rules.school : 'School: ask whether they hold or release children, and check the pickup list.', S.rules.note].filter(Boolean).map(deEmoji), margin: [0, 2, 0, 8] });
    content.push({ text: 'Our home systems', style: 'h3' }, tbl(['', ''], [['Car (backup power)', `${S.home.carModel || S.home.car} · ${S.home.carOutlet} W · socket ${S.home.carVolts === 'unknown' ? 'voltage not checked' : S.home.carVolts + ' V'}`], ['Solar', S.home.inverter], ['Water tank', `${S.home.tankL ? S.home.tankCount + ' × ' + S.home.tankL + ' L' : '—'} · ${S.home.tapWhere}`], ['Cookers', [S.home.stove, S.home.oven + (S.home.ovenGas === 'yes' ? ' (gas + wood)' : ''), S.home.bbq].filter(Boolean).join(' · ')], ['Radios', `${S.home.radios} — ${S.home.radioCh || 'channel not set'}`], ['Gas shut-off', S.home.gasMeter || '—'], ['Water toby', S.home.waterToby || '—'], ['Switchboard', S.home.switchboard || '—']], [120, '*']));
  }
  // ---- guide chapters
  for (const c of CATS) {
    if (!on['cat:' + c[0]]) continue;
    const list = included.filter(g => g.cat === c[0]); if (!list.length) continue;
    content.push(...chapterHead(c[0] === 'away' ? c[1] + ' — ' + AW() : c[1], c[3], c[4] + '  ·  ' + list.length + ' guides', 'ch-' + (chapN++)));
    content.push({ table: { widths: [150, '*'], body: list.map(g => [{ text: deEmoji(guideTitle(g, T)), linkToDestination: 'g-' + g.id, color: '#24527f', bold: true, fontSize: 9.5 }, { text: pdfRuns(g.one || '', T, dests), fontSize: 9, color: '#444' }]) }, layout: { hLineWidth: (i, n) => i === 0 || i === n.table.body.length ? 0 : 0.5, vLineWidth: () => 0, hLineColor: () => '#dde1e6', paddingTop: () => 5, paddingBottom: () => 5 }, margin: [0, 0, 0, 10] });
    list.forEach((g, i) => content.push(...guidePdf(g, T, dests, g.colour || c[3], { newpage: on.newpage })));
  }
  // ---- supplies
  if (on.supplies) {
    content.push(...chapterHead('Supplies checklist', '#a16207', `Sized for ${peopleCount()} people for ${daysTarget()} days. Tick what we have.`, 'ch-' + (chapN++)));
    const groups = {}; supplyItems().forEach(it => (groups[it.group] = groups[it.group] || []).push(it));
    Object.entries(groups).forEach(([g, arr]) => { content.push({ text: g, style: 'h4' }); content.push({ table: { headerRows: 1, widths: [14, '*', 80, 70], dontBreakRows: true, body: [[{ text: '' }, { text: 'Item', bold: true }, { text: 'Need', bold: true }, { text: 'Use by', bold: true }].map(x => Object.assign(x, { fillColor: '#eef0f3', fontSize: 9 }))].concat(arr.map(it => [tickBox(S.supplies.have[it.key]), { text: deEmoji(it.name) + (S.supplies.note[it.key] ? '  — ' + deEmoji(S.supplies.note[it.key]) : ''), fontSize: 9 }, { text: (it.need + ' ' + (it.unit || '')).trim(), fontSize: 9 }, { text: S.supplies.expiry[it.key] ? fmtDate(S.supplies.expiry[it.key]) : '', fontSize: 9 }])) }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => '#d8dce2' }, margin: [0, 0, 0, 8] }); });
  }
  // ---- suppliers
  if (on.sources) {
    content.push(...chapterHead('Suppliers & contacts directory', '#475569', 'People and places to get food, animals and essentials from.', 'ch-' + (chapN++)));
    SOURCE_CATS.forEach(c => { const arr = S.sources.filter(s => s.cat === c[0]); content.push({ text: c[2], style: 'h4' }); if (!arr.length) { content.push({ text: 'Who to line up: ' + c[3], fontSize: 9, color: '#5d6670', margin: [0, 0, 0, 2] }); content.push({ table: { widths: ['*', '*', 90], body: [[{ text: 'Name', bold: true, fontSize: 9, fillColor: '#eef0f3' }, { text: 'What they supply', bold: true, fontSize: 9, fillColor: '#eef0f3' }, { text: 'Phone', bold: true, fontSize: 9, fillColor: '#eef0f3' }], [' ', ' ', ' '], [' ', ' ', ' ']] }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#c9ced6', vLineColor: () => '#c9ced6', paddingTop: () => 7, paddingBottom: () => 7 }, margin: [0, 2, 0, 8] }); }
      else content.push(tbl(['Name', 'What they supply', 'Phone', 'Where / trade / notes'], arr.map(s => [{ text: s.name, bold: true }, s.supplies || '', s.phone || '', [s.address, s.trade && 'Trade: ' + s.trade, s.notes, s.checked && 'Checked ' + fmtDate(s.checked)].filter(Boolean).join('\n')]), [90, '*', 80, '*'])); });
  }
  // ---- notes pages
  if (on.notes) {
    content.push(...chapterHead('Our notes', '#334155', 'Write here — then add it to the app later.', 'ch-' + (chapN++)));
    const lines = n => ({ canvas: Array.from({ length: n }, (_, i) => ({ type: 'line', x1: 0, y1: i * 22, x2: 499, y2: i * 22, lineWidth: 0.4, lineColor: '#b9c0ca' })) });
    content.push(lines(27), { text: '', pageBreak: 'before' }, lines(32));
  }
  const dd = {
    pageSize: 'A4', pageMargins: [48, 58, 48, 50],
    info: { title: (h.name || 'Family') + ' — Emergency Plan', author: 'Family Ready', subject: 'Emergency plan and survival guide' },
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.22, color: '#1b1f24' },
    styles: {
      h1: { fontSize: 22, bold: true, color: '#16324f', margin: [0, 0, 0, 12] }, chapter: { fontSize: 24, bold: true, color: '#ffffff' },
      gtitle: { fontSize: 16, bold: true, margin: [0, 6, 0, 6] }, h3: { fontSize: 12.5, bold: true, color: '#16324f', margin: [0, 10, 0, 4] }, h4: { fontSize: 11, bold: true, color: '#333', margin: [0, 8, 0, 3] },
      tocC: { bold: true, fontSize: 11.5, color: '#16324f' }, tocG: { fontSize: 9.5, color: '#333' },
    },
    content,
    header: (page) => page <= 1 ? null : { columns: [{ text: deEmoji(h.name || 'Our family') + ' · Emergency Plan & Survival Guide', color: '#8a939d', fontSize: 8.5 }, { text: 'Updated ' + today, alignment: 'right', color: '#8a939d', fontSize: 8.5 }], margin: [48, 24, 48, 0] },
    footer: (page, pages) => page === 1 ? null : { columns: [{ text: 'Call 111 if life is at risk', fontSize: 8, color: '#b91c1c', bold: true }, { text: `${page} / ${pages}`, alignment: 'right', fontSize: 8.5, color: '#5d6670' }], margin: [48, 14, 48, 0] },
  };
  return await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('Timed out making the PDF')), 180000); try { pdfMake.createPdf(dd).getBlob(b => { clearTimeout(t); res(b); }); } catch (e) { clearTimeout(t); rej(e); } });
}
