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
