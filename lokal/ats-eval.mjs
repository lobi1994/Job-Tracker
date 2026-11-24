#!/usr/bin/env node
/**
 * Careerway: misst, wie nah die lokale Qwen-Bewertung an Claudes Referenzwerten liegt.
 *
 * Ablauf: Profil und die Anzeigen aus der Referenzdatei aus dem Apps Script holen, jede Anzeige mit Qwen bewerten,
 * Prozent von Qwen und Claude vergleichen. Es wird NICHTS ins Google Sheet geschrieben (kein apiSaveAtsCompare,
 * kein apiAtsRefresh). Der ganze Lauf wird als JSON in ~/.careerway/eval-runs/<label>.json gespeichert.
 *
 * Referenzdatei: ~/.careerway/eval-ref.json (anderer Pfad über CAREERWAY_EVAL_REF)
 *   { "ads": [ { "id": "abc", "claude": 76 }, ... ] }
 * Aufruf: node ats-eval.mjs [--model <name>] [--ids a,b] [--label <text>] [--ohne-profil]
 * --ohne-profil: Qwen bekommt das Profil nicht im Prompt (nur die Anzeige).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig, callScript, ollamaReady, rateAd, redact } from './ats-qwen.mjs';

const BASE_DIR = path.join(os.homedir(), '.careerway');
const REF_PATH = process.env.CAREERWAY_EVAL_REF || path.join(BASE_DIR, 'eval-ref.json');
const RUNS_DIR = path.join(BASE_DIR, 'eval-runs');

const round1 = (x) => Math.round(x * 10) / 10;

/** Kennzahlen eines Laufs. results = [{ pct, claude }]. Leere Liste ergibt n 0 und 0 statt NaN. */
export function summarize(results) {
  const list = (results || []).filter((r) => r && Number.isFinite(r.pct) && Number.isFinite(r.claude));
  const n = list.length;
  if (!n) return { avgDiff: 0, avgAbs: 0, n: 0 };
  const diffs = list.map((r) => r.pct - r.claude);
  return {
    avgDiff: round1(diffs.reduce((s, d) => s + d, 0) / n),
    avgAbs: round1(diffs.reduce((s, d) => s + Math.abs(d), 0) / n),
    n,
  };
}

/** Kommandozeile lesen: --model, --ids, --label. */
function parseArgs(argv) {
  const out = { model: '', ids: [], label: '', mitProfil: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--model') out.model = String(argv[++i] || '').trim();
    else if (a === '--ids') out.ids = String(argv[++i] || '').split(',').map((x) => x.trim()).filter(Boolean);
    else if (a === '--ohne-profil') out.mitProfil = false;
    else if (a === '--think') out.think = true;
    else if (a === '--label') out.label = String(argv[++i] || '').trim();
  }
  return out;
}

function readRef() {
  let j;
  try { j = JSON.parse(fs.readFileSync(REF_PATH, 'utf8')); }
  catch (e) {
    throw new Error('Referenzdatei nicht lesbar: ' + REF_PATH + '. Lege sie an, Format: {"ads":[{"id":"abc","claude":76}]}');
  }
  const ads = Array.isArray(j && j.ads) ? j.ads : [];
  const list = ads.map((a) => ({ id: String((a && a.id) || '').trim(), claude: Number(a && a.claude) }))
    .filter((a) => a.id && Number.isFinite(a.claude));
  if (!list.length) throw new Error('Die Referenzdatei enthält keine Anzeigen mit id und claude.');
  return list;
}

const pad = (v, n) => String(v).padEnd(n);
const padL = (v, n) => String(v).padStart(n);
const sign = (d) => (d > 0 ? '+' : '') + d;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let cfg;
  try { cfg = loadConfig(); }
  catch (e) { console.error('Konfiguration nicht brauchbar: ' + e.message); process.exitCode = 1; return; }
  if (args.model) cfg.model = args.model;
  if (args.think) cfg.think = true;
  const say = (m) => console.error(redact(m, cfg)); // Hinweise auf stderr, die Tabelle auf stdout
  let refs;
  try { refs = readRef(); } catch (e) { say(e.message); process.exitCode = 1; return; }
  if (args.ids.length) refs = refs.filter((r) => args.ids.includes(r.id));
  if (!refs.length) { say('Keine passende Anzeige in der Referenzdatei.'); process.exitCode = 1; return; }

  const state = await ollamaReady(cfg);
  if (state !== 'ok') {
    say(state === 'aus' ? 'Ollama ist nicht erreichbar. Starte Ollama und versuche es erneut.' : 'Das Modell ' + cfg.model + ' ist nicht installiert (ollama pull ' + cfg.model + ').');
    process.exitCode = 1; return;
  }

  const label = args.label || new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeLabel = label.replace(/[^\w.-]+/g, '_');
  let profile;
  try { profile = await callScript(cfg, 'apiAtsProfile', []); }
  catch (e) { say('Profil nicht geladen: ' + e.message); process.exitCode = 1; return; }

  const results = [];
  console.log(pad('ID', 14) + padL('Qwen %', 8) + padL('Claude %', 10) + padL('Diff', 7) + padL('Anf.', 6) + padL('raus', 6) + padL('Sek.', 7));
  for (const ref of refs) {
    let ad;
    try { ad = await callScript(cfg, 'apiGetPosting', [ref.id]); }
    catch (e) { say('Fehler beim Laden von ' + ref.id + ': ' + e.message); continue; }
    if (!ad || !ad.text) { say('Anzeige ' + ref.id + ' nicht gefunden, übersprungen.'); continue; }
    const t0 = Date.now();
    try {
      const a = await rateAd(cfg, profile, ad, { mitProfil: args.mitProfil });
      const sec = Math.round((Date.now() - t0) / 1000);
      results.push({ id: ref.id, claude: ref.claude, pct: a.pct, reqs: a.reqs, dropped: a.dropped, spec: a.spec, sec, raw: a.raw });
      console.log(pad(ref.id, 14) + padL(a.pct, 8) + padL(ref.claude, 10) + padL(sign(a.pct - ref.claude), 7) + padL(a.reqs.length, 6) + padL(a.dropped.length, 6) + padL(sec, 7));
    } catch (e) { say('Fehler bei ' + ref.id + ': ' + e.message); }
  }

  const sum = summarize(results);
  console.log('');
  console.log('Ø Differenz (Qwen minus Claude): ' + sign(sum.avgDiff) + ' Prozentpunkte');
  console.log('Ø Abweichung (Betrag): ' + sum.avgAbs + ' Prozentpunkte');
  console.log('Bewertet: ' + sum.n + ' von ' + refs.length);

  // Lauf speichern, ohne Schlüssel und Link
  try {
    fs.mkdirSync(RUNS_DIR, { recursive: true });
    const file = path.join(RUNS_DIR, safeLabel + '.json');
    const body = { label, model: cfg.model, mitProfil: args.mitProfil, time: new Date().toISOString(), summary: sum, ads: results };
    fs.writeFileSync(file, redact(JSON.stringify(body, null, 2), cfg), { mode: 0o600 });
    say('Gespeichert: ' + file);
  } catch (e) { say('Lauf nicht gespeichert: ' + e.message); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
