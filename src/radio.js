// ---------------------------------------------------------------------------
// RADIOS — NZ PRS (UHF CB) channels ↔ MHz, CTCSS codes ↔ Hz, and how to set each of our radios
// ---------------------------------------------------------------------------
// NZ/AU 80-channel PRS plan: ch 1–40 = 476.425 + 0.025 steps; ch 41–80 sit 12.5 kHz above (476.4375 + 0.025 steps).
const prsMhz = ch => ch >= 1 && ch <= 40 ? 476.425 + (ch - 1) * 0.025 : ch >= 41 && ch <= 80 ? 476.4375 + (ch - 41) * 0.025 : null;
const fmtMhz = f => f == null ? '—' : f.toFixed(4);
function mhzToCh(f) {
  let best = null, d = 1e9;
  for (let c = 1; c <= 80; c++) { const x = Math.abs(prsMhz(c) - f); if (x < d) { d = x; best = c; } }
  return { ch: best, exact: d < 0.0006, off: d };
}
// Standard 38-tone CTCSS list — the numbering Uniden UHF CB radios use (code 12 = 100.0 Hz). Some brands number differently: check the manual.
const CTCSS = [67.0, 71.9, 74.4, 77.0, 79.7, 82.5, 85.4, 88.5, 91.5, 94.8, 97.4, 100.0, 103.5, 107.2, 110.9, 114.8, 118.8, 123.0, 127.3, 131.8, 136.5, 141.3, 146.2, 151.4, 156.7, 162.2, 167.9, 173.8, 179.9, 186.2, 192.8, 203.5, 210.7, 218.1, 225.7, 233.6, 241.8, 250.3];
const toneCode = hz => { const i = CTCSS.findIndex(t => Math.abs(t - hz) < 0.05); return i < 0 ? null : i + 1; };
function chUse(c) {
  if (c === 5 || c === 35) return ['bad', 'Emergency only (repeater)'];
  if (c === 22 || c === 23) return ['bad', 'Data only — no talking'];
  if (c >= 61 && c <= 63) return ['bad', 'Reserved — don\'t use'];
  if ((c >= 1 && c <= 8) || (c >= 41 && c <= 48)) return ['warn', 'Repeater output (shared, long range)'];
  if ((c >= 31 && c <= 38) || (c >= 71 && c <= 78)) return ['warn', 'Repeater input — avoid'];
  if (c === 11) return ['warn', 'Calling channel — call, then move off'];
  return ['ok', 'General chat'];
}
const RADIO_KINDS = [['ch', 'Channel numbers (e.g. Uniden UHF CB)'], ['mhz', 'Frequencies in MHz (e.g. Baofeng)']];
const RADIO_F = [
  { k: 'model', label: 'Make and model', ph: 'e.g. Uniden UH45 or Baofeng UV-5R' },
  { k: 'owner', label: 'Who has it', ph: 'e.g. Dad, our daughter' },
  { k: 'count', label: 'How many', type: 'number' },
  { k: 'kind', label: 'How you pick the channel on it', type: 'select', options: RADIO_KINDS, help: 'If the screen shows a channel number (1–80) choose the first. If you type a frequency like 476.900, choose MHz.' },
  { k: 'notes', label: 'Notes (where it lives, battery type, quirks)', type: 'textarea' },
];
function famRadio() {
  const h = S.home; const ch = Number(h.famCh) || 0; const tone = Number(h.famTone) || 0; const bk = Number(h.backupCh) || 0;
  return { ch, tone, bk, code: tone ? toneCode(tone) : 0 };
}
function radioSummary() {
  const f = famRadio(); if (!f.ch) return S.home.radioCh || '';
  return `PRS channel ${f.ch} (${fmtMhz(prsMhz(f.ch))} MHz), ${f.tone ? `tone ${f.tone.toFixed(1)} Hz${f.code ? ` (Uniden code ${f.code})` : ''}` : 'no tone'}${f.bk ? ` · backup channel ${f.bk} (${fmtMhz(prsMhz(f.bk))} MHz)` : ''}`;
}
function radioMigrate() {
  const h = S.home; if (!Array.isArray(h.radioList)) h.radioList = [];
  if (!h.famCh && h.radioCh) { const m = h.radioCh.match(/channel\s*(\d{1,2})/i); if (m) h.famCh = +m[1]; const t = h.radioCh.match(/(\d{2,3}\.\d)\s*Hz/i); if (t && !h.famTone) h.famTone = +t[1]; const b = h.radioCh.match(/backup[^\d]*(\d{1,2})/i); if (b && !h.backupCh) h.backupCh = +b[1]; }
}
// what to set on one radio
function radioSetup(r) {
  const f = famRadio(); if (!f.ch) return '<p class="small muted">Set the family channel above first.</p>';
  const toneTxt = f.tone ? (r.kind === 'mhz' ? `${f.tone.toFixed(1)} Hz` : `code <b>${f.code || '?'}</b> (${f.tone.toFixed(1)} Hz)`) : 'OFF';
  if (r.kind === 'mhz') return `<table class="small"><tr><td>Frequency</td><td><b>${fmtMhz(prsMhz(f.ch))} MHz</b> (= channel ${f.ch})</td></tr>
    <tr><td>Tone (send and receive)</td><td><b>${toneTxt}</b> — set both T-CTCS and R-CTCS</td></tr>
    <tr><td>Bandwidth</td><td><b>Narrow</b> (12.5 kHz, “N” / NFM)</td></tr><tr><td>Offset / shift</td><td><b>Off</b> (simplex)</td></tr><tr><td>Power</td><td><b>Low</b> unless out of range</td></tr>
    ${f.bk ? `<tr><td>Backup</td><td>${fmtMhz(prsMhz(f.bk))} MHz (channel ${f.bk}), same tone</td></tr>` : ''}</table>
    <details class="small" style="margin-top:6px"><summary>Baofeng UV-5R step by step (other models differ — see the manual)</summary><ol class="steps" style="padding-left:0;margin-top:6px">
    <li><span class="txt">Press <b>VFO/MR</b> until the screen shows a frequency (not “CH”).</span></li>
    ${f.ch > 40 ? '<li><span class="txt">This frequency needs 12.5 kHz steps: <b>MENU</b> → 1 (STEP) → <b>12.5K</b> → MENU → EXIT.</span></li>' : ''}
    <li><span class="txt">Type <b>${fmtMhz(prsMhz(f.ch)).replace('.', '').slice(0, 6)}</b> on the keypad — the screen shows ${fmtMhz(prsMhz(f.ch))}.</span></li>
    <li><span class="txt"><b>MENU</b> → 5 (WN) → <b>NARR</b> → MENU to save → EXIT.</span></li>
    <li><span class="txt"><b>MENU</b> → 13 (T-CTCS) → <b>${f.tone ? f.tone.toFixed(1) : 'OFF'}</b> → MENU → EXIT. Then <b>MENU</b> → 11 (R-CTCS) → the same → MENU → EXIT.</span></li>
    <li><span class="txt"><b>MENU</b> → 2 (TXP) → <b>LOW</b> → MENU → EXIT. Check MENU → 25 (SFT-D) is <b>OFF</b>.</span></li>
    <li><span class="txt">Optional: save it as a channel — MENU → 27 (MEM-CH) → pick a number → MENU.</span></li></ol></details>`;
  return `<table class="small"><tr><td>Channel</td><td><b>${f.ch}</b></td></tr><tr><td>Tone (CTCSS)</td><td><b>${toneTxt}</b></td></tr>
    ${f.bk ? `<tr><td>Backup</td><td>channel ${f.bk}, same code</td></tr>` : ''}</table>
    <p class="small muted" style="margin:4px 0 0">Uniden: turn the channel to ${f.ch}, then press <b>MENU</b> until the CTCSS code flashes and use the arrows to set ${f.code || 'the code'}. Check the code table in your model's manual — most Unidens use code 12 for 100.0 Hz.</p>`;
}
let RCONV = { ch: '', mhz: '', code: '', hz: '' };
function vRadio(main) {
  radioMigrate();
  const h = S.home, f = famRadio();
  const chOpts = sel => Array.from({ length: 80 }, (_, i) => i + 1).map(c => { const u = chUse(c); return `<option value="${c}"${c === sel ? ' selected' : ''}${u[0] === 'bad' ? ' disabled' : ''}>${c} — ${fmtMhz(prsMhz(c))} MHz${u[0] !== 'ok' ? ' · ' + u[1] : ''}</option>`; }).join('');
  main.innerHTML = `<div class="gnav"><button class="btn sm ghost" data-go="g:radios">← Walkie-talkie guide</button></div>
  <div class="card"><h1>📡 Our radio channel</h1>
   <p class="small">Every radio must be on the <b>same channel and the same tone</b>. Channel-number radios and MHz radios talk to each other fine — this page works out what to set on each.</p>
   <label class="f">Family channel</label><select id="rCh"><option value="">Choose…</option>${chOpts(f.ch)}</select>
   <label class="f">Squelch tone (CTCSS)</label><select id="rTone"><option value="0">Off — hear everyone on the channel</option>${CTCSS.map((t, i) => `<option value="${t}"${Math.abs(t - f.tone) < .05 ? ' selected' : ''}>${t.toFixed(1)} Hz — Uniden code ${i + 1}</option>`).join('')}</select>
   <label class="f">Backup channel (if ours is busy)</label><select id="rBk"><option value="">None</option>${chOpts(f.bk)}</select>
   ${f.ch ? `<div class="note" style="margin-top:10px"><b>${esc(radioSummary())}</b></div>` : ''}
  </div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">📻 Our radios</h2><button class="btn sm primary" id="rAdd">＋ Add radio</button></div>
   ${h.radioList.length ? h.radioList.map(r => `<div class="card" style="margin:10px 0 0;padding:10px"><div class="row"><div class="grow"><b>${esc(r.model || 'Radio')}</b>${r.count > 1 ? ' ×' + esc(r.count) : ''} <span class="small muted">${esc(r.owner || '')}</span><div class="small muted">${r.kind === 'mhz' ? 'Frequencies (MHz)' : 'Channel numbers'}</div></div><button class="btn sm" data-re="${r.id}">Edit</button></div>
     ${radioSetup(r)}${r.notes ? `<p class="small">${esc(r.notes)}</p>` : ''}<div class="small" style="margin-top:6px">${manualLinks('radio:' + r.id, 'manual')}</div></div>`).join('') : '<div class="empty">Add each kind of radio (e.g. the Baofeng, and each pair of Unidens) — then attach its manual.</div>'}
  </div>
  <div class="card"><h2>🔁 Converter</h2>
   <div class="row"><div class="grow"><label class="f">Channel (1–80)</label><input type="number" id="cvCh" min="1" max="80" inputmode="numeric" value="${esc(RCONV.ch)}"></div><div class="grow"><label class="f">Frequency (MHz)</label><input type="text" id="cvMhz" inputmode="decimal" placeholder="476.9000" value="${esc(RCONV.mhz)}"></div></div>
   <div id="cvOut1" class="small" style="margin-top:6px"></div>
   <div class="row" style="margin-top:6px"><div class="grow"><label class="f">Uniden tone code</label><input type="number" id="cvCode" min="1" max="38" inputmode="numeric" value="${esc(RCONV.code)}"></div><div class="grow"><label class="f">Tone (Hz)</label><input type="text" id="cvHz" inputmode="decimal" placeholder="100.0" value="${esc(RCONV.hz)}"></div></div>
   <div id="cvOut2" class="small" style="margin-top:6px"></div>
  </div>
  <div class="card"><details><summary><b>All 80 PRS channels</b> — frequency and what each is for</summary>
   <table class="small" style="margin-top:8px"><tr><th>Ch</th><th>MHz</th><th>Use</th></tr>${Array.from({ length: 80 }, (_, i) => i + 1).map(c => { const u = chUse(c); const ours = c === f.ch ? ' style="background:rgba(47,125,79,.15);font-weight:700"' : c === f.bk ? ' style="background:rgba(183,121,31,.12)"' : ''; return `<tr${ours}><td>${c}${c === f.ch ? ' ⭐' : c === f.bk ? ' (backup)' : ''}</td><td>${fmtMhz(prsMhz(c))}</td><td><span class="pill ${u[0]}">${u[1]}</span></td></tr>`; }).join('')}</table></details>
   <details style="margin-top:8px"><summary><b>All tone codes</b> — Uniden code ↔ Hz</summary><table class="small" style="margin-top:8px"><tr><th>Code</th><th>Hz</th><th>Code</th><th>Hz</th></tr>${Array.from({ length: 19 }, (_, i) => `<tr><td>${i + 1}</td><td>${CTCSS[i].toFixed(1)}</td><td>${i + 20}</td><td>${CTCSS[i + 19].toFixed(1)}</td></tr>`).join('')}</table>
   <p class="small muted">The standard 38-tone list used by Uniden UHF CB radios. A few brands number their codes differently — check the table in the manual (attach it above).</p></details>
   <p class="small muted" style="margin-top:8px">NZ PRS band (476–477 MHz), 80 channels, 12.5 kHz spacing. Strictly, NZ PRS radios should be approved for the band; a Baofeng is fine to listen with, and in an emergency anyone may use any radio to call for help.</p></div>`;
  const saveFam = () => { h.famCh = +$('#rCh', main).value || ''; h.famTone = +$('#rTone', main).value || 0; h.backupCh = +$('#rBk', main).value || ''; h.radioCh = radioSummary(); persist(); vRadio(main); };
  ['#rCh', '#rTone', '#rBk'].forEach(s => $(s, main).onchange = saveFam);
  const rForm = (r, isNew) => formModal(isNew ? 'Add radio' : 'Edit radio', RADIO_F, r, v => { if (!v.model) { toast('Add the make or model'); return false; } v.count = Number(v.count) || 1; if (isNew) h.radioList.push(Object.assign({ id: uid() }, v)); else Object.assign(r, v); persist(); vRadio(main); },
    { onDelete: isNew ? null : () => { h.radioList = h.radioList.filter(x => x !== r); persist(); vRadio(main); } });
  $('#rAdd', main).onclick = () => rForm({ kind: 'ch', count: 2 }, true);
  $$('[data-re]', main).forEach(b => b.onclick = () => rForm(h.radioList.find(x => x.id === b.dataset.re)));
  const conv1 = from => {
    const o = $('#cvOut1', main); RCONV.ch = $('#cvCh', main).value; RCONV.mhz = $('#cvMhz', main).value;
    if (from === 'ch') { const c = +RCONV.ch; const m = prsMhz(c); if (!m) { o.textContent = ''; return; } $('#cvMhz', main).value = RCONV.mhz = fmtMhz(m); const u = chUse(c); o.innerHTML = `Channel <b>${c}</b> = <b>${fmtMhz(m)} MHz</b> <span class="pill ${u[0]}">${u[1]}</span>`; }
    else { const v = parseFloat(String(RCONV.mhz).replace(',', '.')); if (!v) { o.textContent = ''; return; } const r = mhzToCh(v); if (r.exact) { $('#cvCh', main).value = RCONV.ch = r.ch; const u = chUse(r.ch); o.innerHTML = `<b>${fmtMhz(v)} MHz</b> = channel <b>${r.ch}</b> <span class="pill ${u[0]}">${u[1]}</span>`; } else { $('#cvCh', main).value = RCONV.ch = ''; o.innerHTML = `<span style="color:var(--warn)">${esc(String(v))} MHz isn't a PRS channel.</span>${r.off < 0.1 ? ` Nearest: channel ${r.ch} (${fmtMhz(prsMhz(r.ch))} MHz).` : ' PRS is 476.4250–477.4125 MHz.'}`; } }
  };
  const conv2 = from => {
    const o = $('#cvOut2', main); RCONV.code = $('#cvCode', main).value; RCONV.hz = $('#cvHz', main).value;
    if (from === 'code') { const c = +RCONV.code; if (!(c >= 1 && c <= 38)) { o.textContent = c ? 'Codes 1–38 are tones. Higher numbers on a Uniden are DCS codes — see the manual.' : ''; return; } $('#cvHz', main).value = RCONV.hz = CTCSS[c - 1].toFixed(1); o.innerHTML = `Uniden code <b>${c}</b> = <b>${CTCSS[c - 1].toFixed(1)} Hz</b>`; }
    else { const v = parseFloat(String(RCONV.hz).replace(',', '.')); if (!v) { o.textContent = ''; return; } const c = toneCode(v); if (c) { $('#cvCode', main).value = RCONV.code = c; o.innerHTML = `<b>${v.toFixed(1)} Hz</b> = Uniden code <b>${c}</b>`; } else o.innerHTML = `<span style="color:var(--warn)">${esc(String(v))} Hz isn't a standard tone.</span>`; }
  };
  $('#cvCh', main).oninput = () => conv1('ch'); $('#cvMhz', main).oninput = () => conv1('mhz');
  $('#cvCode', main).oninput = () => conv2('code'); $('#cvHz', main).oninput = () => conv2('hz');
  if (RCONV.ch) conv1('ch'); if (RCONV.code) conv2('code');
}
