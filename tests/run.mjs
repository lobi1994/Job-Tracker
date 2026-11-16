import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, fail = 0;
async function test(name, fn) {
  try { await fn(); ok++; console.log('ok – ' + name); }
  catch (e) { fail++; console.log('FEHLER – ' + name + ': ' + String(e && e.message || e).split('\n')[0]); }
}

/* ---------- Teil A: App im Demo-Modus ---------- */
const html = read('index.html');
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://example.test/index.html#demo',
  pretendToBeVisual: true,
  beforeParse(w) {
    if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    w.scrollTo = () => {};
    w.Element.prototype.scrollIntoView = function () {};
  },
});
const w = dom.window;
const ev = (code) => w.eval(code);
await sleep(600);

await test('A-a Demo-Daten geladen und Liste gerendert', () => {
  assert.ok(ev('jobs.length') >= 5, 'jobs.length = ' + ev('jobs.length'));
  assert.ok(w.document.querySelectorAll('#list > *').length > 0, '#list leer');
});
await test('A-b fitPct', () => {
  assert.equal(ev('fitPct(3)'), 70); assert.equal(ev('fitPct(5)'), 95);
  assert.equal(ev('fitPct(83)'), 83); assert.equal(ev('fitPct("")'), 0);
});
await test('A-c webUrl', () => {
  assert.equal(ev('webUrl("javascript:alert(1)")'), '');
  assert.equal(ev('webUrl("https://a.b/c")'), 'https://a.b/c');
});
await test('A-d esc', () => {
  const r = ev('esc("<img src=x onerror=1>")');
  assert.ok(!r.includes('<'), r);
});
await test('A-e encSetup/parseSetup Rundreise', () => {
  const u = 'https://script.google.com/macros/s/X/exec', k = 'abcdefgh1234';
  const enc = ev(`encSetup({u:${JSON.stringify(u)},k:${JSON.stringify(k)}})`);
  const o = ev(`parseSetup(${JSON.stringify('#setup=' + enc)})`);
  assert.ok(o, 'parseSetup lieferte null');
  assert.equal(o.u, u); assert.equal(o.k, k);
  assert.equal(ev('parseSetup("#setup=kaputt")'), null);
});
const names = (r) => r.hard.concat(r.soft).map((x) => x.name);
await test('A-f extractSkills', () => {
  const a = names(ev('extractSkills("We can do this. Experience with SQL and Python required.", [])'));
  assert.ok(a.includes('SQL'), 'SQL fehlt: ' + a); assert.ok(a.includes('Python'), 'Python fehlt: ' + a);
  assert.ok(!a.includes('CAN-Bus'), 'CAN-Bus fälschlich erkannt');
  const b = names(ev('extractSkills("Kenntnisse in CAN-Bus und LIN-Bus", [])'));
  assert.ok(b.includes('CAN-Bus'), 'CAN-Bus fehlt: ' + b);
});
await test('A-g computeGaps', () => {
  const r = ev(`computeGaps([{id:'1',role:'Projektmanager',status:'Beworben',company:'A'},{id:'2',role:'Support',status:'Nicht bewerben',company:'B'}], [{id:'1',text:'Sehr gute SQL-Kenntnisse. Python ist von Vorteil.'},{id:'2',text:'SAP erforderlich'}], [])`);
  assert.equal(r.total, 1);
  const g = (n) => r.list.find((x) => x.name === n);
  assert.ok(g('SQL'), 'SQL fehlt'); assert.equal(g('SQL').must, 1);
  assert.ok(g('Python'), 'Python fehlt'); assert.equal(g('Python').must, 0);
  assert.ok(!g('SAP'), 'SAP darf nicht vorkommen');
});
await test('A-h XSS-Rendertest', () => {
  ev(`jobs[0].company = '<img src=x onerror="window.__x=1">'; render();`);
  assert.equal(w.document.querySelectorAll('img[src="x"]').length, 0);
});
await test('A-i saveLater sofort + Outbox leert sich', async () => {
  ev(`saveLater(jobs[1].id, { notes: 'Testnotiz' })`);
  assert.equal(ev('jobs[1].notes'), 'Testnotiz');
  await sleep(300);
  assert.equal(ev('outbox.length'), 0);
});

/* ---------- Teil A (seit 1.6.41): Nachfassen, Termine, Statistik ---------- */
const NOW = 'new Date(2026, 10, 15, 12)';
const J = (o) => JSON.stringify(Object.assign({ id: 'x', company: 'F', role: 'R', status: 'Beworben', appliedOn: '', interview: '', notes: '', channel: '', fit: '' }, o));
await test('A-j splitNotes/joinNotes', () => {
  const j = ev(`joinNotes('Hauptnotiz', 'Frage 1\\nFrage 2')`);
  assert.ok(j.includes('[Vorbereitung]'), j);
  const s = ev(`splitNotes(${JSON.stringify(j)})`);
  assert.equal(s.main, 'Hauptnotiz'); assert.equal(s.prep, 'Frage 1\nFrage 2');
  assert.equal(ev(`joinNotes(${JSON.stringify(s.main)}, ${JSON.stringify(s.prep)})`), j);
  const p = ev(`splitNotes('Nur eine Notiz')`);
  assert.equal(p.main, 'Nur eine Notiz'); assert.equal(p.prep, '');
  assert.equal(ev(`joinNotes('Nur eine Notiz', '')`), 'Nur eine Notiz');
  assert.equal(ev(`joinNotes('Nur eine Notiz', '  \\n ')`), 'Nur eine Notiz');
});
await test('A-k lastFollowUp', () => {
  assert.equal(ev(`lastFollowUp('Nachgefasst am 03.11.2026\\nText\\nNachgefasst am 12.11.2026')`), '2026-11-12');
  assert.equal(ev(`lastFollowUp('Nachgefasst am 12.11.2026\\nNachgefasst am 03.11.2026')`), '2026-11-12');
  assert.equal(ev(`lastFollowUp('nichts hier')`), '');
  assert.equal(ev(`lastFollowUp('')`), '');
});
await test('A-l followUp', () => {
  const f = (o) => ev(`followUp(${J(o)}, ${NOW})`);
  const a = f({ appliedOn: '2026-11-06' });
  assert.equal(a.days, 9); assert.equal(a.due, false); assert.equal(a.dueIn, 1);
  assert.equal(f({ appliedOn: '2026-11-05' }).due, true);
  assert.equal(f({ appliedOn: '2026-11-05', status: 'Abgelehnt' }), null);
  assert.equal(f({ appliedOn: '' }), null);
  const b = f({ appliedOn: '2026-10-26', notes: 'Nachgefasst am 12.11.2026' });
  assert.equal(b.due, false); assert.equal(b.again, true); assert.equal(b.total, 20); assert.equal(b.days, 3);
});
await test('A-m agendaData', () => {
  const list = [
    { id: 'i2', status: 'Zum Gespräch eingeladen', appliedOn: '2026-11-01', interview: '20.11.2026 10:00 · Video' },
    { id: 'i1', status: 'Zum Gespräch eingeladen', appliedOn: '2026-11-01', interview: '17.11.2026 09:00 · Telefon' },
    { id: 'rej', status: 'Abgelehnt', appliedOn: '2026-10-01', interview: '18.11.2026 09:00 · Video' },
    { id: 'off', status: 'Jobangebot', appliedOn: '2026-10-01', interview: '05.11.2026 09:00 · Video' },
    { id: 'aft', status: 'Zum Gespräch eingeladen', appliedOn: '2026-10-20', interview: '10.11.2026 10:00 · Video' },
    { id: 'due', status: 'Beworben', appliedOn: '2026-11-03' },
  ].map((o) => JSON.parse(J(o)));
  const a = ev(`agendaData(${JSON.stringify(list)}, ${NOW})`);
  assert.equal(JSON.stringify(a.iv.map((x) => x.j.id)), JSON.stringify(['i1', 'i2']));
  assert.equal(a.iv[0].inDays, 2);
  assert.equal(JSON.stringify(a.offer.map((x) => x.j.id)), JSON.stringify(['off']));
  assert.equal(JSON.stringify(a.after.map((x) => x.j.id)), JSON.stringify(['aft'])); assert.equal(a.after[0].days, 5);
  assert.equal(JSON.stringify(a.due.map((x) => x.j.id)), JSON.stringify(['due']));
  const all = [].concat(a.iv, a.after, a.due, a.wait, a.offer).map((x) => x.j.id);
  assert.ok(!all.includes('rej'), 'abgelehnter Job taucht auf');
});
await test('A-n computeStats', () => {
  const list = [
    { id: '1', status: 'Beworben', appliedOn: '2026-11-05', channel: 'Personio' },
    { id: '2', status: 'Beworben', appliedOn: '2026-11-12', channel: 'Personio' },
    { id: '3', status: 'Zum Gespräch eingeladen', appliedOn: '2026-11-01', interview: '20.11.2026 10:00 · Video', channel: 'LinkedIn', fit: 80 },
    { id: '4', status: 'Persönliches Gespräch', appliedOn: '2026-10-20', interview: '12.11.2026 14:00 · Persönlich (vor Ort)', channel: 'LinkedIn', fit: 90 },
    { id: '5', status: 'Jobangebot', appliedOn: '2026-10-01', channel: 'Personio', fit: 70 },
    { id: '6', status: 'Abgelehnt', appliedOn: '2026-09-01' },
    { id: '7', status: 'Noch nicht beworben' },
    { id: '8', status: 'Nicht bewerben', appliedOn: '2026-11-10' },
  ].map((o) => JSON.parse(J(o)));
  const s = ev(`computeStats(${JSON.stringify(list)}, ${NOW})`);
  assert.equal(s.applied, 6); assert.equal(s.answered, 4); assert.equal(s.interview, 3);
  assert.equal(s.offer, 1); assert.equal(s.rejected, 1); assert.equal(s.waiting, 2); assert.equal(s.rate, 67);
  assert.equal(s.onsite, 2); assert.equal(s.silent, 1); assert.equal(s.todo, 1);
  assert.equal(s.weeks.length, 8);
  assert.equal(s.weeks.reduce((a, b) => a + b.n, 0), 5, 'Wochensumme (Job 6 liegt außerhalb)');
  assert.equal(s.weeks[7].n, 1);
  assert.equal(JSON.stringify(s.channels.map((c) => c.name + ':' + c.n)), JSON.stringify(['Personio:3', 'LinkedIn:2', 'ohne Angabe:1']));
});
await test('A-o Oberfläche: Agenda, Statistik, Vorbereitung', () => {
  ev('openAgenda()');
  const sh = w.document.getElementById('sheet');
  assert.ok(sh.textContent.includes('Termine und Fristen'));
  assert.ok(sh.querySelectorAll('.arow').length >= 1, 'keine .arow');
  ev('openStats()');
  assert.ok(w.document.querySelectorAll('#sheet .tile').length >= 4, 'weniger als 4 .tile');
  const id = ev(`(jobs.find((j) => j.status === 'Zum Gespräch eingeladen') || {}).id`);
  assert.ok(id, 'kein Demo-Job mit Status Zum Gespräch eingeladen');
  ev(`openDetail(${JSON.stringify(id)})`);
  assert.ok(w.document.getElementById('aPrep'), '#aPrep fehlt');
  ev('closeSheet()');
});
await test('A-p XSS in Agenda', () => {
  ev(`jobs.push({ id: 'xss1', company: '<img src=x onerror=window.__x=1>', role: 'R', status: 'Beworben', appliedOn: '2026-01-01', interview: '', notes: '' }); render();`);
  try {
    ev('openAgenda()');
    assert.ok(w.document.querySelectorAll('#sheet .arow').length >= 1);
    assert.equal(w.document.querySelectorAll('#sheet img').length, 0, 'img in Agenda');
    assert.ok(!w.__x);
  } finally {
    ev(`jobs.splice(jobs.findIndex((j) => j.id === 'xss1'), 1); render(); closeSheet();`);
  }
});

await test('A-q findDuplicate Treffer', () => {
  const r = ev(`(() => {
    const L = [{ id: 'a', company: 'X', role: 'Y', url: 'https://example.com/jobs/1' }, { id: 'b', company: 'Q', role: 'R', url: 'https://a.com/p/ab12cd34ef' }, { id: 'c', company: 'Spheros', role: 'Projektleiter', url: '' }];
    const f = (j) => (findDuplicate(j, L) || {}).id || null;
    return JSON.stringify([f({ company: 'Z', role: 'W', url: 'https://www.example.com/jobs/1/?utm=x' }), f({ company: 'Z', role: 'W', url: 'https://b.org/view/ab12cd34ef?x=1' }), f({ company: 'Spheros Germany GmbH', role: 'Projektleiter (m/w/d)', url: '' })]);
  })()`);
  assert.equal(r, JSON.stringify(['a', 'b', 'c']));
});
await test('A-r findDuplicate kein Treffer', () => {
  const r = ev(`(() => {
    const L = [{ id: 'a', company: 'Spheros', role: 'Projektleiter', url: '' }];
    const f = (j, l) => (findDuplicate(j, l) || {}).id || null;
    return JSON.stringify([f({ company: 'Spheros', role: 'Entwickler', url: '' }, L), f({ company: 'Andere AG', role: 'Projektleiter', url: '' }, L), f({ company: 'Spheros', role: 'Projektleiter', url: '' }, []), f({ company: 'Andere AG', role: 'Entwickler', url: '' }, L)]);
  })()`);
  assert.equal(r, JSON.stringify([null, null, null, null]));
});
await test('A-s Oberfläche: Dublette fragt nach', () => {
  const n0 = ev('jobs.length');
  ev(`window.__cf = null; window.confirm = (t) => { window.__cf = t; return false; };`);
  ev(`$('bAdd').click(); $('nCompany').value = jobs[0].company; $('nRole').value = jobs[0].role; $('nSave').click();`);
  try {
    assert.ok(String(w.__cf).includes('Diesen Job gibt es schon'), 'kein confirm');
    assert.equal(ev('jobs.length'), n0);
  } finally { ev('closeSheet()'); }
});

await test('A-t atsBreakdown Rechnung', () => {
  const r = JSON.parse(ev(`JSON.stringify(atsBreakdown('Sehr gute SQL-Kenntnisse.\\nPython ist ein Plus.\\nErfahrung im technischen Support.', [{ skill: 'Technischer Support', type: 'hard', note: '' }, { skill: 'Python', type: 'hard', note: 'teilweise' }]))`));
  const by = Object.fromEntries(r.items.map((x) => [x.name, x]));
  assert.equal(by['SQL'].weight, 2); assert.equal(by['SQL'].state, 'missing');
  assert.equal(by['Python'].weight, 1); assert.equal(by['Python'].state, 'partial');
  assert.equal(by['Technischer Support'].weight, 2); assert.equal(by['Technischer Support'].state, 'have');
  assert.equal(r.totalWeight, 5); assert.equal(r.score, 50); assert.equal(by['SQL'].loss, 40);
  assert.equal(r.items[0].name, 'SQL');
});
await test('A-u atsBreakdown leerer Text', () => {
  const r = JSON.stringify(ev(`atsBreakdown('', [])`));
  assert.equal(r, JSON.stringify({ score: null, items: [], skipped: [], totalWeight: 0 }));
});
await test('A-v Oberfläche: ATS-Aufschlüsselung und XSS', async () => {
  try {
    ev(`profile.push({ skill: '<img src=x>', type: 'hard', note: '' })`);
    ev(`openDetail('d1')`);
    const box = w.document.getElementById('atsBox');
    assert.ok(box, '#atsBox fehlt');
    box.open = true; box.dispatchEvent(new w.Event('toggle'));
    await sleep(400);
    assert.ok(w.document.querySelectorAll('#atsBody .atsr').length >= 3, 'weniger als 3 .atsr');
    assert.ok(w.document.getElementById('atsSum').textContent.includes('%'), 'Zusammenfassung ohne %');
    assert.equal(w.document.querySelectorAll('#atsBody img').length, 0);
    ev(`$('atsBody').innerHTML = atsHtml({ fit: 0 }, atsBreakdown('Wir nutzen <img src=x> und Python.', profile))`);
    assert.equal(w.document.querySelectorAll('#atsBody img').length, 0, 'img in ATS-Block');
  } finally { ev(`profile = profile.filter((p) => p.skill !== '<img src=x>'); closeSheet()`); }
});
await test('A-w CSS gegen seitliches Wischen', () => {
  assert.ok(html.includes('overflow-x:clip'));
});

await test('A-x Skill-Lücken: Filter Leicht', async () => {
  try {
    ev(`gapTab = 'hard'; gapEase = 0; openGaps()`);
    await sleep(500);
    const chip = Array.from(w.document.querySelectorAll('.gfilt button')).find((b) => b.textContent.startsWith('Leicht'));
    assert.ok(chip, 'Chip Leicht fehlt');
    chip.click();
    const list = Array.from(w.document.querySelectorAll('.gfilt ~ details.gap'));
    assert.ok(list.length >= 1, 'kein Leicht-Eintrag (SQL erwartet)');
    assert.ok(list.every((el) => el.querySelector('.ease.e1')), 'Eintrag ohne Leicht-Badge');
    assert.equal(JSON.stringify(list.map((el) => el.querySelector('.gt .notr').textContent)), JSON.stringify(['SQL']));
  } finally { ev(`gapEase = 0; closeSheet()`); }
});
await test('A-y Skill-Lücken: Kann ich doch speichern', async () => {
  try {
    ev(`gapTab = 'hard'; gapEase = 0; openGaps()`);
    await sleep(500);
    const names = () => Array.from(w.document.querySelectorAll('.gfilt ~ details.gap .gt .notr')).map((e) => e.textContent);
    assert.ok(names().includes('SQL'), 'SQL fehlt vorab');
    const det = Array.from(w.document.querySelectorAll('.gfilt ~ details.gap')).find((e) => e.querySelector('.gt .notr').textContent === 'SQL');
    det.open = true;
    const save = det.querySelector('.gsave');
    assert.ok(save.disabled, 'Speichern vorab aktiv');
    det.querySelector('[data-lv="have"]').click();
    assert.ok(!save.disabled, 'Speichern nach Stufenwahl noch deaktiviert');
    det.querySelector('.gtxt').value = 'Eigenes Projekt 2025, SQLite';
    save.click();
    await sleep(600);
    assert.ok(!names().includes('SQL'), 'SQL noch in Fehlt-Liste');
    assert.ok(ev(`profile.some((p) => p.skill === 'SQL')`), 'profile ohne SQL');
    assert.equal(JSON.stringify(ev(`profile.find((p) => p.skill === 'SQL').type`)), JSON.stringify('hard'));
  } finally { ev(`closeSheet()`); }
});

await test('A-appUrl', () => {
  assert.equal(ev(`appUrl('https://drive.google.com/file/d/abc/view?usp=drivesdk')`), 'googledrive://https://drive.google.com/file/d/abc/view?usp=drivesdk');
  assert.equal(ev(`appUrl('https://docs.google.com/spreadsheets/d/xyz/edit#gid=0')`), 'googledrive://https://docs.google.com/spreadsheets/d/xyz/edit#gid=0');
  assert.equal(ev(`appUrl('https://www.linkedin.com/jobs/view/4488834282/')`), 'linkedin://jobs/view/4488834282');
  assert.equal(ev(`appUrl('https://example.com/x')`), null);
  assert.equal(ev(`appUrl('https://evil.com/drive.google.com/x')`), null);
});
await test('A-LinkedIn linkedInJobId', () => {
  assert.equal(ev(`linkedInJobId('https://de.linkedin.com/jobs/view/technischer-projektmanager-at-ferchau-4438587077')`), '4438587077');
  assert.equal(ev(`linkedInJobId('https://www.linkedin.com/jobs/view/4488834282/')`), '4488834282');
  assert.equal(ev(`linkedInJobId('https://www.linkedin.com/jobs/search/?currentJobId=4123456789')`), '4123456789');
  assert.equal(ev(`linkedInJobId('https://example.com/jobs/view/123456789')`), null);
});
await test('A-Bulk Mehrfachauswahl: Status + Notiz, [Vorbereitung] bleibt', async () => {
  w.confirm = () => true;
  ev(`jobs[1].notes = 'Alt\\n\\n' + PREP_MARK + '\\nPrep-Text'`);
  const id1 = ev('jobs[0].id'), id2 = ev('jobs[1].id');
  w.document.getElementById('bSel').click();
  assert.ok(ev('selMode'));
  const cards = w.document.querySelectorAll('#list .card');
  const pick = (id) => w.document.querySelector('#list .card[data-id="' + id + '"]').click();
  pick(id1); pick(id2);
  assert.equal(ev('sel.size'), 2);
  w.document.getElementById('bEdit').click();
  w.document.getElementById('bkStatus').value = 'Nicht bewerben';
  w.document.getElementById('bkNote').value = 'Test';
  w.document.getElementById('bkNote').dispatchEvent(new w.Event('input'));
  w.document.getElementById('bkStatus').dispatchEvent(new w.Event('change'));
  assert.ok(!w.document.getElementById('bkGo').disabled);
  w.document.getElementById('bkGo').click();
  await sleep(300);
  for (const id of [id1, id2]) {
    assert.equal(ev(`jobById('${id}').status`), 'Nicht bewerben');
    assert.ok(/: Test$/.test(ev(`splitNotes(jobById('${id}').notes).main`)), 'Notiz endet nicht auf „: Test“');
  }
  assert.equal(ev(`splitNotes(jobById('${id2}').notes).prep`), 'Prep-Text');
  assert.ok(!ev('selMode'));
});
await test('A-Bulk ATS unter 50 wählt genau 0 < fit < 50', () => {
  ev(`filter.on = statuses.slice(); filter.q = ''; render()`);
  ev(`jobs[2].fit = 30; jobs[3].fit = 49; jobs[4].fit = 50; jobs[5].fit = ''`);
  w.document.getElementById('bSel').click();
  w.document.getElementById('bAts').value = '50';
  w.document.getElementById('bAtsGo').click();
  const exp = ev(`visible().filter((j) => fitPct(j.fit) > 0 && fitPct(j.fit) < 50).map((j) => j.id).sort().join()`);
  assert.equal(ev(`[...sel].sort().join()`), exp);
  assert.ok(ev('sel.size') >= 2);
  w.document.getElementById('bDone').click();
});

/* ---------- Teil B: Apps Script ---------- */
const gs = read('google/Code.gs') + '\n' + read('google/Mail.gs');
await test('B Syntax Code.gs + Mail.gs', () => { new Function(gs); });
await test('B textCell_', () => {
  const m = read('google/Code.gs').match(/function textCell_[\s\S]*?\n}/);
  assert.ok(m, 'textCell_ nicht gefunden');
  const textCell_ = new Function(m[0] + '\nreturn textCell_;')();
  for (const s of ['=IMPORTDATA("x")', '+49 172', '10-12', '17.11.2026 15:00'])
    assert.ok(textCell_(s).startsWith("'"), s + ' -> ' + textCell_(s));
  assert.equal(textCell_('München'), 'München');
  assert.equal(textCell_('- Rückruf'), '- Rückruf');
});

/* ---------- Teil C: Konsistenz ---------- */
await test('C APP_VERSION im CHANGELOG', () => {
  const m = html.match(/const APP_VERSION = '([^']+)'/);
  assert.ok(m, 'APP_VERSION nicht gefunden');
  const esc = m[1].replace(/\./g, '\\.');
  assert.ok(new RegExp('^## ' + esc + '(\\s|$)', 'm').test(read('CHANGELOG.md')), 'Überschrift "## ' + m[1] + '" fehlt');
});
await test('C sw.js Syntax', () => { new Function(read('sw.js')); });

console.log(`\n${ok} ok, ${fail} Fehler`);
process.exit(fail ? 1 : 0);
