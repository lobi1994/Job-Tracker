#!/usr/bin/env node
/**
 * Careerway: lokale ATS-Vorbewertung mit Ollama (Qwen3). Läuft auf dem Mac, gestartet von launchd.
 *
 * Ablauf: Profil und offene Anzeigen aus dem Apps Script holen, jede Anzeige von Qwen gegen das Profil einstufen
 * lassen (voll / teilweise / fehlt), das Ergebnis mit apiSaveAtsCompare zurückschreiben.
 * Es ändert weder den Fit-Wert noch den CV-Auftrag. Die Rechnung macht das Apps Script.
 *
 * Alle privaten Werte (Web-App-Link, Schlüssel, Startdatum, Test-IDs) stehen in ~/.careerway/config.json,
 * nie in dieser Datei. Aufruf: node ats-qwen.mjs [--dry]   (--dry: nichts zurückschreiben)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CONFIG_PATH = process.env.CAREERWAY_CONFIG || path.join(os.homedir(), '.careerway', 'config.json');
const CONFIG_DIR = path.dirname(CONFIG_PATH);
const LOG_PATH = path.join(CONFIG_DIR, 'ats-qwen.log');
const LOCK_PATH = path.join(CONFIG_DIR, 'ats-qwen.lock');
const BUDGET_MS = 45 * 60 * 1000; // danach keine neue Anzeige mehr anfangen
const MATCHES = ['voll', 'teilweise', 'fehlt'];
const MATCH_SCORE = { voll: 1, teilweise: 0.5, fehlt: 0 };

export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reise: { type: 'string' },
    reqs: {
      type: 'array', minItems: 8, maxItems: 14,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          w: { type: 'integer', enum: [1, 2] },
          beleg: { type: 'string' },
          match: { type: 'string', enum: MATCHES },
        },
        required: ['name', 'w', 'beleg', 'match'],
      },
    },
  },
  required: ['reise', 'reqs'],
};

/** config.json prüfen und mit Standardwerten ergänzen. Wirft einen verständlichen Fehler. */
export function validateConfig(c) {
  if (!c || typeof c !== 'object') throw new Error('config.json ist leer oder kein Objekt.');
  const url = String(c.scriptUrl || '').trim();
  // Nur die Web-App-URL aus Apps Script (…/exec) ist erlaubt. So geht der Schlüssel nie an eine falsche Adresse,
  // etwa an den App-Link auf GitHub Pages. Für Tests ist localhost erlaubt.
  const isScript = /^https:\/\/script\.google\.com\/(a\/macros\/[^/]+\/|macros\/)s\/[\w-]+\/exec$/.test(url);
  const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
  if (!isScript && !isLocal) {
    throw new Error('scriptUrl muss die Web-App-URL aus Apps Script sein (endet auf /exec), nicht der App-Link und nicht der Einrichtungs-Link.');
  }
  const key = String(c.key || '').trim();
  if (!key || key === 'DEIN_SCHLUESSEL') throw new Error('key fehlt (Platzhalter noch nicht ersetzt).');
  const since = String(c.since || '').trim();
  if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) throw new Error('since muss das Format JJJJ-MM-TT haben.');
  const testIds = Array.isArray(c.testIds) ? c.testIds.map(String).filter(Boolean) : [];
  if (!since && !testIds.length) throw new Error('Es muss since oder testIds gesetzt sein.');
  return {
    scriptUrl: url, key, since, testIds,
    model: String(c.model || 'qwen3:8b'),
    limitPerRun: Math.max(1, Math.min(Number(c.limitPerRun) || 5, 10)),
    hatNicht: Array.isArray(c.hatNicht) ? c.hatNicht.map(String).filter(Boolean) : [],
    ollamaUrl: String(c.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, ''),
  };
}

/** Anweisung an Qwen. profile = {full, basic} im Originaltext. */
export function buildSystemPrompt(profile, hatNicht) {
  const not = hatNicht && hatNicht.length ? '\n\nHAT NICHT: ' + hatNicht.join(', ') : '';
  return `Du bist ein strenger, fairer Bewerbermanagement-Prüfer (ATS). Du bekommst das Profil einer Bewerberin oder eines Bewerbers und eine Stellenanzeige. Zerlege die Anzeige in 10 bis 14 verschiedene Anforderungen und stufe jede gegen das Profil ein.

PROFIL, BELEGT (volle Treffer):
${profile.full}

PROFIL, NUR GRUNDLAGEN (zählt nur halb):
${profile.basic}${not}

Einstufung "match":
- "voll": das Profil belegt die Anforderung eindeutig (Fähigkeit, Abschluss, Sprache oder Erfahrung steht im belegten Teil).
- "teilweise": nur Grundlagen, nur ein verwandtes Thema oder nur ein Teil der Anforderung ist belegt.
- "fehlt": nichts im Profil belegt es, oder es steht unter HAT NICHT.
Schreibe zuerst in "beleg" kurz (höchstens 12 Wörter), welche Profilzeile die Entscheidung trägt, dann erst "match".

Immer als eigene Anforderungen aufnehmen, sofern die Anzeige sie erwähnt: Studium/Abschluss, Berufserfahrung, Sprachen (Deutsch und Englisch zusammen), die 4 bis 6 wichtigsten fachlichen Aufgaben und Kenntnisse, wichtige Eigenschaften.
Gewicht "w": 2 nur für Abschluss, Berufserfahrung, Sprachen und Punkte aus dem Abschnitt Profil/Anforderungen/Qualifikation, die nicht mit wünschenswert, idealerweise, von Vorteil oder Plus eingeschränkt sind. 1 für alles aus dem Abschnitt Aufgaben und für alles Eingeschränkte.
Reisebereitschaft und Dienstreisen sind KEINE Anforderung. Schreibe nur das ins Feld "reise", was in der Anzeige steht (Prozentzahl oder Häufigkeit), sonst "keine Angabe".
Jede Anforderung kommt nur einmal vor.`;
}

/** Antwort von Qwen prüfen. Reise-Anforderungen und Doppelte fliegen raus. */
export function parseModelAnswer(raw) {
  let o;
  try { o = JSON.parse(raw); } catch (e) { throw new Error('Die Antwort von Qwen ist kein JSON.'); }
  if (!o || !Array.isArray(o.reqs)) throw new Error('Die Antwort von Qwen hat keine Anforderungen.');
  const seen = {}, reqs = [];
  o.reqs.forEach((r) => {
    if (!r || typeof r !== 'object') return;
    const name = String(r.name || '').trim();
    const match = String(r.match || '').trim().toLowerCase();
    if (!name || !MATCHES.includes(match) || /reise|travel/i.test(name)) return;
    const k = name.toLowerCase();
    if (seen[k]) return;
    seen[k] = 1;
    reqs.push({ name, w: Number(r.w) === 2 ? 2 : 1, match, beleg: String(r.beleg || '').trim() });
  });
  if (reqs.length < 3) throw new Error('Zu wenige brauchbare Anforderungen in der Antwort.');
  return { reise: String(o.reise || '').trim() || 'keine Angabe', reqs };
}

/** Prozent wie im Apps Script: round(100 · Σ(Gewicht·Punkte) / ΣGewicht). */
export function scorePct(reqs) {
  let tot = 0, got = 0;
  reqs.forEach((r) => { tot += r.w; got += r.w * MATCH_SCORE[r.match]; });
  return tot ? Math.round((100 * got) / tot) : 0;
}

/** Schlüssel und Link aus Meldungen entfernen, bevor sie ins Log kommen. */
export function redact(text, cfg) {
  let s = String(text);
  if (cfg) [cfg.key, cfg.scriptUrl].forEach((v) => { if (v) s = s.split(v).join('***'); });
  return s;
}

/* ---------- ab hier: Ablauf mit Netzwerk und Dateien ---------- */

let secrets = null;
function log(msg) {
  const line = new Date().toISOString().replace('T', ' ').slice(0, 19) + '  ' + redact(msg, secrets) + '\n';
  try {
    if (fs.existsSync(LOG_PATH) && fs.statSync(LOG_PATH).size > 1e6) fs.renameSync(LOG_PATH, LOG_PATH + '.alt');
    fs.appendFileSync(LOG_PATH, line, { mode: 0o600 });
  } catch (e) { /* Log ist nicht kritisch */ }
  process.stdout.write(line);
}

function takeLock() {
  try {
    if (fs.existsSync(LOCK_PATH)) {
      const [pid, t] = fs.readFileSync(LOCK_PATH, 'utf8').split(' ').map(Number);
      let alive = false;
      try { process.kill(pid, 0); alive = true; } catch (e) { /* Prozess gibt es nicht mehr */ }
      if (alive && Date.now() - t < 2 * 3600 * 1000) return false;
    }
    fs.writeFileSync(LOCK_PATH, process.pid + ' ' + Date.now(), { mode: 0o600 });
    return true;
  } catch (e) { return true; }
}
function dropLock() { try { fs.unlinkSync(LOCK_PATH); } catch (e) { /* egal */ } }

async function callScript(cfg, fn, args) {
  const res = await fetch(cfg.scriptUrl, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, key: cfg.key, args }), signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  let out;
  try { out = JSON.parse(text); } catch (e) { throw new Error('Die Web-App hat kein JSON geantwortet (HTTP ' + res.status + ').'); }
  if (out.error) throw new Error('Web-App: ' + out.error);
  return out.result;
}

async function ollamaReady(cfg) {
  try {
    const res = await fetch(cfg.ollamaUrl + '/api/tags', { signal: AbortSignal.timeout(5000) });
    const j = await res.json();
    return (j.models || []).some((m) => m.name === cfg.model || m.model === cfg.model) ? 'ok' : 'kein Modell';
  } catch (e) { return 'aus'; }
}

/** Streamt die Antwort, damit lange Läufe nicht in das 5-Minuten-Limit von fetch laufen. */
async function askOllama(cfg, system, ad) {
  const res = await fetch(cfg.ollamaUrl + '/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      model: cfg.model, stream: true, think: false, format: RESPONSE_SCHEMA,
      options: { temperature: 0, num_ctx: 12288, num_predict: 2500 },
      messages: [{ role: 'system', content: system }, { role: 'user', content: 'Stellenanzeige:\n' + ad.text }],
    }),
    signal: AbortSignal.timeout(15 * 60 * 1000),
  });
  if (!res.ok) throw new Error('Ollama antwortete mit HTTP ' + res.status + '.');
  const dec = new TextDecoder();
  let buf = '', out = '';
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      const j = JSON.parse(line);
      if (j.error) throw new Error('Ollama: ' + j.error);
      out += (j.message && j.message.content) || '';
    }
  }
  return out;
}

async function main() {
  const dry = process.argv.includes('--dry');
  const start = Date.now();
  let cfg;
  try { cfg = validateConfig(JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))); }
  catch (e) { log('Konfiguration nicht brauchbar: ' + e.message); process.exitCode = 1; return; }
  secrets = cfg;
  if (!takeLock()) { log('Ein anderer Lauf ist noch aktiv, überspringe.'); return; }
  try {
    const state = await ollamaReady(cfg);
    if (state !== 'ok') {
      log(state === 'aus' ? 'Ollama ist nicht erreichbar. Nächster Versuch beim nächsten Lauf.' : 'Das Modell ' + cfg.model + ' ist nicht installiert (ollama pull ' + cfg.model + ').');
      if (state !== 'aus') process.exitCode = 1;
      return;
    }
    const todo = [], seen = {};
    const add = (r) => (r.items || []).forEach((a) => { if (!seen[a.id]) { seen[a.id] = 1; todo.push(a); } });
    if (cfg.testIds.length) add(await callScript(cfg, 'apiAtsPending', [{ by: 'Qwen', ids: cfg.testIds, limit: 10 }]));
    if (cfg.since) add(await callScript(cfg, 'apiAtsPending', [{ by: 'Qwen', since: cfg.since, limit: cfg.limitPerRun }]));
    // Auswertung neu berechnen, auch wenn Qwen nichts zu tun hat: Claude schreibt seine Zeilen direkt in den Tab
    const refresh = async () => {
      if (dry) return;
      try { await callScript(cfg, 'apiAtsRefresh', []); } catch (e) { log('Auswertung nicht aktualisiert: ' + e.message); }
    };
    if (!todo.length) { await refresh(); log('Nichts zu bewerten.'); return; }
    const profile = await callScript(cfg, 'apiAtsProfile', []);
    const system = buildSystemPrompt(profile, cfg.hatNicht);
    log('Offen: ' + todo.length + ' Anzeige(n), Modell ' + cfg.model + (dry ? ' (Trockenlauf)' : ''));
    let done = 0;
    for (const ad of todo) {
      if (Date.now() - start > BUDGET_MS) { log('Zeitbudget erreicht, der Rest kommt im nächsten Lauf.'); break; }
      const t0 = Date.now();
      try {
        const a = parseModelAnswer(await askOllama(cfg, system, ad));
        if (!dry) await callScript(cfg, 'apiSaveAtsCompare', [{ id: ad.id, by: 'Qwen', model: cfg.model, reise: a.reise, reqs: a.reqs }]);
        done++;
        log(ad.company + ' | ' + ad.role + ': ' + scorePct(a.reqs) + ' % (' + a.reqs.length + ' Anforderungen, ' + Math.round((Date.now() - t0) / 1000) + ' s, Reise: ' + a.reise + ')');
      } catch (e) { log('Fehler bei ' + ad.id + ': ' + e.message); }
    }
    await refresh();
    log('Fertig: ' + done + ' von ' + todo.length + ' gespeichert.');
  } catch (e) {
    log('Abbruch: ' + e.message);
    process.exitCode = 1;
  } finally { dropLock(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
