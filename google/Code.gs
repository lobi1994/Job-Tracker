/**
 * Careerway – Google Apps Script für das Tabellenblatt „Bewerbungen“.
 * Created by Matthias Lobinger
 *
 * Die App (GitHub Pages) und der iOS-Kurzbefehl schicken jede Anfrage als
 * POST {fn, key, args}. Erlaubt sind nur Funktionen, deren Name mit „api“ beginnt.
 * Der Kurzbefehl darf statt args auch die Felder direkt mitschicken
 * (z. B. {fn:"apiSavePosting", key, data:{url, title, text}} – data darf auch JSON-Text sein).
 */

const VERSION = '1.6.34'; // siehe CHANGELOG.md
const APP_PAGE = 'https://lobi1994.github.io/Job-Tracker/';
const SHEET = 'Bewerbungen';
const POSTINGS = 'Anzeigen';
const STATUS = ['Noch nicht beworben', 'Beworben', 'Zum Gespräch eingeladen', 'Persönliches Gespräch', 'Jobangebot', 'Abgelehnt', 'Nicht bewerben'];
const NOT_APPLYING = 'Nicht bewerben';
const MAX_TEXT = 45000; // Zellgrenze in Google Sheets liegt bei 50.000 Zeichen

// Spaltenname in der Tabelle -> Feldname in der App
const COLS = {
  'Firma': 'company', 'Stelle': 'role', 'Ort / Remote': 'location', 'Status': 'status',
  'Beworben am': 'appliedOn', 'Gespräch am': 'interview', 'Gefällt mir (1-5)': 'like',
  'CV passt (1-5)': 'fit', 'CV passt (%)': 'fit', 'Gehalt angegeben': 'salary', 'Weg / Portal': 'channel',
  'Link Anzeige': 'url', 'CV-Datei': 'cv', 'Notizen': 'notes', 'ID': 'id',
  'Anzeige gespeichert': 'postingSaved', 'Fit-Begründung': 'fitNote', 'CV-Auftrag': 'cvRequest', 'CV-Link': 'cvLink'
};
const PROFILE = 'Profil';
const EDITABLE = ['company', 'role', 'location', 'status', 'appliedOn', 'interview', 'like', 'fit', 'salary', 'channel', 'url', 'cv', 'notes'];

/* ------------------------------------------------------------------ */
/* Zugang                                                              */
/* ------------------------------------------------------------------ */

function schluessel_() {
  return PropertiesService.getScriptProperties().getProperty('appKey') || '';
}

function check_(key) {
  const k = schluessel_();
  if (!k || key !== k) throw new Error('Kein Zugriff');
}

function doPost(e) {
  let out;
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const fn = String(body.fn || '');
    check_(body.key);
    if (!/^api[A-Za-z]+$/.test(fn) || typeof globalThis[fn] !== 'function') throw new Error('Unbekannte Funktion: ' + fn);
    let data = body.data;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (x) { data = { text: data }; } } // Kurzbefehl schickt Text
    const args = Array.isArray(body.args) ? body.args : [data || body];
    out = { result: globalThis[fn].apply(null, [body.key].concat(args)) };
    if (out.result === undefined) out.result = null;
    if (out.result && out.result.confirm) out.confirm = out.result.confirm; // für den Kurzbefehl: Rückfrage „ersetzen?“
    if (out.result && typeof out.result.message === 'string') out.message = out.result.message; // Kurzbefehl liest message direkt
  } catch (err) {
    out = { error: String((err && err.message) || err) };
    out.message = 'Fehler: ' + out.error;
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const token = e && e.parameter && e.parameter.confirm;
  if (token) {
    let msg;
    try { msg = confirmReplace_(String(token)); } catch (err) { msg = 'Fehler: ' + ((err && err.message) || err); }
    return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
  }
  return ContentService.createTextOutput('Careerway ' + VERSION + ' läuft. Die App findest du unter ' + APP_PAGE)
    .setMimeType(ContentService.MimeType.TEXT);
}

/* ------------------------------------------------------------------ */
/* Tabelle lesen und schreiben                                         */
/* ------------------------------------------------------------------ */

function sheet_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
  if (!sh) throw new Error('Blatt „' + SHEET + '“ fehlt. Bitte im Menü „Careerway → Einrichten“ ausführen.');
  return sh;
}

/** Spaltennummer (1-basiert) je Feldname, aus der Kopfzeile gelesen. */
function colMap_(sh) {
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const map = {};
  head.forEach(function (h, i) { const f = COLS[String(h).trim()]; if (f) map[f] = i + 1; });
  if (!map.id) throw new Error('Spalte „ID“ fehlt. Bitte „Careerway → Einrichten“ ausführen.');
  return map;
}

function iso_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return v === null || v === undefined ? '' : String(v);
}

function rowToJob_(row, map) {
  const job = {};
  Object.keys(map).forEach(function (f) { job[f] = iso_(row[map[f] - 1]); });
  ['like', 'fit'].forEach(function (f) { job[f] = job[f] === '' ? null : Number(job[f]); });
  return job;
}

function newId_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function findRow_(sh, map, id) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const ids = sh.getRange(2, map.id, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

function toCell_(field, value) {
  if (value === null || value === undefined) return '';
  if (field === 'appliedOn') {
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : String(value);
  }
  if (field === 'like') {
    const n = Number(value);
    if (!value && value !== 0) return '';
    if (!(n >= 1 && n <= 5)) throw new Error('Bewertung muss zwischen 1 und 5 liegen.');
    return Math.round(n);
  }
  if (field === 'fit') { // CV-Passung in Prozent (ATS-Bewertung)
    const n = Number(value);
    if (!value && value !== 0) return '';
    if (!(n >= 0 && n <= 100)) throw new Error('CV-Passung muss zwischen 0 und 100 % liegen.');
    return Math.round(n);
  }
  if (field === 'status' && STATUS.indexOf(value) < 0) throw new Error('Unbekannter Status: ' + value);
  return String(value);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ------------------------------------------------------------------ */
/* API für App und Kurzbefehl                                          */
/* ------------------------------------------------------------------ */

/** Alle Jobs plus Status-Liste. */
function apiList(key) {
  check_(key);
  const sh = sheet_();
  const map = colMap_(sh);
  const last = sh.getLastRow();
  const rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  const jobs = rows.filter(function (r) { return String(r[map.company - 1] || r[map.role - 1]).trim(); })
    .map(function (r) { return rowToJob_(r, map); });
  return { jobs: jobs, statuses: STATUS, sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(), version: VERSION, profile: profile_() };
}

/** Eigene Skills aus dem Blatt „Profil“ (Spalte A: Skill, Spalte B: Hard/Soft). */
function profile_() {
  const ps = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PROFILE);
  if (!ps || ps.getLastRow() < 2) return [];
  return ps.getRange(2, 1, ps.getLastRow() - 1, 2).getValues()
    .filter(function (r) { return String(r[0]).trim(); })
    .map(function (r) { return { skill: String(r[0]).trim(), type: /soft/i.test(String(r[1])) ? 'soft' : 'hard' }; });
}

/**
 * Zugeschnittenen CV bei Claude anfordern. Die geplante Claude-Aufgabe sucht nach „angefordert“,
 * baut den CV, legt ihn in Google Drive ab und trägt den Link in „CV-Link“ ein.
 */
function apiRequestCv(key, id) {
  check_(key);
  return withLock_(function () {
    const sh = sheet_();
    const map = colMap_(sh);
    if (!map.cvRequest) throw new Error('Spalte „CV-Auftrag“ fehlt. Bitte „Careerway → Einrichten“ ausführen.');
    const r = findRow_(sh, map, id);
    if (!r) throw new Error('Job nicht gefunden.');
    sh.getRange(r, map.cvRequest).setValue('angefordert ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm'));
    if (map.cvLink) sh.getRange(r, map.cvLink).setValue('');
    return rowToJob_(sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0], map);
  });
}

/** Ändert einzelne Felder eines Jobs. Setzt bei „Beworben“ automatisch das Datum, falls leer. */
function apiUpdate(key, id, changes) {
  check_(key);
  return updateJob_(id, changes);
}

function updateJob_(id, changes) {
  return withLock_(function () {
    const sh = sheet_();
    const map = colMap_(sh);
    const r = findRow_(sh, map, id);
    if (!r) throw new Error('Job nicht gefunden (ID ' + id + ').');
    Object.keys(changes || {}).forEach(function (f) {
      if (EDITABLE.indexOf(f) < 0 || !map[f]) return;
      sh.getRange(r, map[f]).setValue(toCell_(f, changes[f]));
    });
    if (changes && changes.status && changes.status !== STATUS[0] && changes.status !== NOT_APPLYING && map.appliedOn && !sh.getRange(r, map.appliedOn).getValue()) {
      sh.getRange(r, map.appliedOn).setValue(new Date());
    }
    return rowToJob_(sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0], map);
  });
}

/** Legt einen neuen Job an. */
function apiAdd(key, job) {
  check_(key);
  job = job || {};
  if (!String(job.company || '').trim() && !String(job.role || '').trim()) throw new Error('Bitte mindestens Firma oder Stelle angeben.');
  return withLock_(function () { return addRow_(job); });
}

function addRow_(job) {
  const sh = sheet_();
  const map = colMap_(sh);
  const row = new Array(sh.getLastColumn()).fill('');
  EDITABLE.forEach(function (f) { if (map[f] && job[f] !== undefined) row[map[f] - 1] = toCell_(f, job[f]); });
  if (map.status && !row[map.status - 1]) row[map.status - 1] = STATUS[0];
  row[map.id - 1] = newId_();
  // erste wirklich leere Zeile nach den Daten (Dropdowns und Farben reichen bis Zeile 500)
  const last = Math.max(1, lastDataRow_(sh, map));
  sh.getRange(last + 1, 1, 1, row.length).setValues([row]);
  if (map.appliedOn) sh.getRange(last + 1, map.appliedOn).setNumberFormat('dd.MM.yyyy');
  return rowToJob_(sh.getRange(last + 1, 1, 1, sh.getLastColumn()).getValues()[0], map);
}

function lastDataRow_(sh, map) {
  const last = sh.getLastRow();
  if (last < 2) return 1;
  const v = sh.getRange(2, map.company, last - 1, 1).getValues();
  const w = sh.getRange(2, map.role, last - 1, 1).getValues();
  for (let i = v.length - 1; i >= 0; i--) if (String(v[i][0]).trim() || String(w[i][0]).trim()) return i + 2;
  return 1;
}

/**
 * Speichert eine Stellenanzeige.
 * data: {id?, url?, title?, company?, role?, location?, text?}
 * - mit id: hängt die Anzeige an diesen Job
 * - ohne id: sucht einen Job mit demselben Link, sonst wird ein neuer Job angelegt
 * - ohne text: die Seite wird hier abgerufen (klappt nicht bei LinkedIn und manchen Workday-Seiten)
 */
function apiSavePosting(key, data) {
  check_(key);
  return savePosting_(data || {}, false);
}

/**
 * Für den Kurzbefehl „Job-Link speichern“ (geteilt aus einer App, z. B. LinkedIn).
 * data.shared: der geteilte Text oder Link. Legt den Job auch dann an, wenn die Anzeige nicht geladen werden kann.
 */
function apiSaveShared(key, data) {
  check_(key);
  data = data || {};
  const shared = String(data.shared || data.text || data.url || '').trim();
  const m = shared.match(/https?:\/\/[^\s<>"']+/);
  if (!m) throw new Error('Im geteilten Inhalt ist kein Link.');
  const url = m[0].replace(/[).,]+$/, '');
  const hint = parseShareText_(shared.replace(m[0], ' '));
  return savePosting_({ url: url, hintCompany: hint.company, hintRole: hint.role }, true);
}

/** „Schau dir diesen Job bei Firma an: Titel“ / „Check out this job at Company: Title“ grob auswerten. */
function parseShareText_(t) {
  t = String(t || '').replace(/\s+/g, ' ').trim();
  let m = t.match(/(?:\bbei|\bat)\s+(.+?)(?:\s+an)?\s*[:–-]\s+(.+)$/i);
  if (m) return { company: m[1].trim(), role: m[2].trim() };
  return { company: '', role: '' };
}

/** Text säubern: HTML (auch doppelt kodiert, z. B. aus LinkedIn) in lesbaren Text umwandeln. */
/* ------------------------------------------------------------------ */
/* Anzeigentext vereinheitlichen (seit 1.6.23)                          */
/* HTML → Text, alle Sonderzeichen (&uuml; …) dekodiert, Aufzählungen als „- “,   */
/* Navigation, Cookie-Hinweise und Bewerbungsformulare entfernt,         */
/* Fließtext ohne Umbrüche an Überschriften getrennt, leere Überschriften am Ende weg. */
/* ------------------------------------------------------------------ */
const ENT_ = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü',
  szlig: 'ß', ndash: '–', mdash: '—', bdquo: '„', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', sbquo: '‚', hellip: '…', euro: '€',
  bull: '•', middot: '·', eacute: 'é', egrave: 'è', agrave: 'à', copy: '©', reg: '®', trade: '™', shy: '', zwnj: '', zwj: '', laquo: '«', raquo: '»' };
function decodeAll_(s) {
  return String(s)
    .replace(/&([a-zA-Z]+);/g, (m, n) => (n in ENT_ ? ENT_[n] : m))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}
function htmlToTextN_(h) {
  return String(h).replace(/\r/g, '')
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|ul|ol)>/gi, '\n')
    .replace(/<(h[1-6]|p|div|ul|ol|section)[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<[^>]+>/g, '');
}
const HEADINGS_ = ['Ihre Aufgaben', 'Deine Aufgaben', 'Aufgaben', 'Ihr Profil', 'Dein Profil', 'Profil', 'Was wir bieten', 'Wir bieten', 'Das bieten wir', 'Unser Angebot',
  'Diese Herausforderungen erwarten Sie', 'Damit begeistern Sie uns', 'Das bringst du mit', 'Das bringen Sie mit', 'Benefits', 'Über uns', 'Wer wir sind',
  'Responsibilities', 'Requirements', 'Qualifications', 'What you will do', 'What you bring', 'What we offer', 'Nice to have', 'About us', 'About the role',
  'Your tasks', 'Your profile', 'Your mission', 'Key responsibilities'];
const JUNK_ = /^(language|view profile|search by keyword|show more options|clear|apply now ?»?|apply|apply here|back to jobs|bewerben|jetzt bewerben|submit application|select\.\.\.|indicates a required field|\*|,|;|impressum|imprint.*|renew or change your cookie consent|create alert|.*opens in a new tab\.?|select how often.*)$/i;
const FORM_START_ = /^(apply for this job|apply for this position|bewerbungsformular|first name ?\*?|vorname ?\*)$/i;

function normalizePosting_(t) {
  t = String(t || '').replace(/\r/g, '');
  if (/<\/?(p|br|li|ul|ol|strong|div|span|b|em|h[1-6])\b[^>]*>/i.test(t) || /&lt;\/?(p|br|li|ul|strong)/i.test(t)) t = htmlToTextN_(decodeAll_(t));
  t = decodeAll_(t);
  t = t.replace(/[‎‏​­﻿]/g, '').replace(/ /g, ' ').replace(/\s*\$\$\s*/g, '\n');
  // Fließtext ohne Zeilenumbrüche: an typischen Überschriften und Satzgrenzen trennen
  const nl = (t.match(/\n/g) || []).length;
  if (t.length > 1200 && nl < t.length / 800) {
    HEADINGS_.forEach((h) => { t = t.replace(new RegExp('\\s*(' + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(\\s*:)[ \\t]*\\n?', 'g'), '\n\n$1$2\n'); });
    t = t.replace(/([.!?])(?=[A-ZÄÖÜ][a-zäöüß])/g, '$1\n');
  }
  let lines = t.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).map((l) => l.replace(/^[•·▪●◦]\s*(?=[^•·▪●◦\s])/, '- ').replace(/^\*\s+(?=\S)/, '- '));
  // Bewerbungsformular am Ende abschneiden
  const cut = lines.findIndex((l, i) => i > lines.length * 0.4 && FORM_START_.test(l));
  if (cut > 0) lines = lines.slice(0, cut);
  lines = lines.filter((l) => !JUNK_.test(l));
  // Cookie-Hinweise entfernen, wenn genug echter Text bleibt
  const body = lines.join('\n');
  if (body.length > 1200) lines = lines.filter((l) => !(l.length < 300 && /cookie/i.test(l)));
  // leere Überschriften am Ende entfernen
  const isHead = (l) => l && l.length <= 60 && !/[.!]$/.test(l) && (/:$/.test(l) || /\?$/.test(l) || l === l.toUpperCase());
  while (lines.length) {
    const nonEmpty = lines.filter(Boolean); const last = nonEmpty[nonEmpty.length - 1];
    if (last && isHead(last) && !/^- /.test(last)) { const i = lines.lastIndexOf(last); lines = lines.slice(0, i); } else break;
  }
  let out = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  for (let k = 0; k < 3; k++) out = out.replace(/(\n- [^\n]*)\n\n(?=- )/g, '$1\n');
  return out;
}

function cleanText_(t) {
  return normalizePosting_(t);
}

/** Greenhouse-Anzeige über die öffentliche Schnittstelle (Board-Name wird aus der Karriereseite gelesen). */
function fetchGreenhouse_(url) {
  try {
    const id = (String(url).match(/[?&]gh_jid=(\d+)/) || [])[1];
    if (!id) return { text: '' };
    let board = (String(url).match(/greenhouse\.io\/([a-z0-9_-]+)\/jobs/i) || [])[1] || '';
    if (!board) {
      const page = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true }).getContentText();
      board = (page.match(/greenhouse\.io\/(?:embed\/job_board(?:\/js)?\?for=|v1\/boards\/)([a-z0-9_-]+)/i) || [])[1] ||
              (page.match(/["']?(?:for|board)["']?\s*[:=]\s*["']([a-z0-9_-]+)["']/i) || [])[1] || '';
    }
    const tries = board ? [board] : [];
    const host = (String(url).match(/https?:\/\/(?:www\.)?([a-z0-9-]+)\./i) || [])[1];
    if (host && tries.indexOf(host) < 0) tries.push(host);
    for (let i = 0; i < tries.length; i++) {
      let res = UrlFetchApp.fetch('https://boards-api.greenhouse.io/v1/boards/' + tries[i] + '/jobs/' + id, { muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) res = UrlFetchApp.fetch('https://boards-api.eu.greenhouse.io/v1/boards/' + tries[i] + '/jobs/' + id, { muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) continue;
      const j = JSON.parse(res.getContentText());
      return { text: htmlToText_(decode_(String(j.content || ''))), role: j.title || '', location: (j.location && j.location.name) || '', company: '', title: '' };
    }
  } catch (e) { /* ignorieren */ }
  return { text: '' };
}

/** LinkedIn-Job-ID aus verschiedenen Linkformen. */
function linkedinId_(url) {
  if (!/linkedin\.com|lnkd\.in/i.test(url)) return '';
  const m = String(url).match(/currentJobId=(\d{6,})/) || String(url).match(/\/jobs\/view\/(?:[^/?]*?-)?(\d{6,})/) || String(url).match(/(\d{8,})/);
  return m ? m[1] : '';
}

/**
 * Anzeige über den Link holen – mit Sonderwegen für Portale, deren Seite die Anzeige erst per JavaScript lädt.
 * Gibt {text, role, company, location, title} zurück; text ist leer, wenn nichts Brauchbares kam.
 */
function fetchAny_(url) {
  url = String(url || '');
  let info = { text: '' };
  try {
    const li = linkedinId_(url);
    if (li) info = fetchLinkedin_(li);
    else if (/[?&]gh_jid=\d+/.test(url)) info = fetchGreenhouse_(url);
    else if (/greenhouse\.io\/[a-z0-9_-]+\/jobs\/\d+/i.test(url)) {
      const m = url.match(/greenhouse\.io\/([a-z0-9_-]+)\/jobs\/(\d+)/i);
      const hosts = /\.eu\.greenhouse/i.test(url) ? ['boards-api.eu.greenhouse.io', 'boards-api.greenhouse.io'] : ['boards-api.greenhouse.io', 'boards-api.eu.greenhouse.io'];
      for (let i = 0; i < hosts.length && !info.text; i++) {
        const res = UrlFetchApp.fetch('https://' + hosts[i] + '/v1/boards/' + m[1] + '/jobs/' + m[2], { muteHttpExceptions: true });
        if (res.getResponseCode() === 200) { const j = JSON.parse(res.getContentText()); info = { text: htmlToText_(decode_(String(j.content || ''))), role: j.title || '', location: (j.location && j.location.name) || '' }; }
      }
    } else if (/jobs\.(eu\.)?lever\.co\/[^/]+\/[0-9a-f-]{36}/i.test(url)) {
      const m = url.match(/jobs\.(eu\.)?lever\.co\/([^/]+)\/([0-9a-f-]{36})/i);
      const res = UrlFetchApp.fetch('https://api.' + (m[1] || '') + 'lever.co/v0/postings/' + m[2] + '/' + m[3], { muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        const j = JSON.parse(res.getContentText());
        const parts = [j.descriptionPlain || htmlToText_(j.description || '')];
        (j.lists || []).forEach(function (l) { parts.push(l.text + '\n' + htmlToText_(l.content || '')); });
        if (j.additionalPlain) parts.push(j.additionalPlain);
        info = { text: parts.join('\n\n'), role: j.text || '', location: (j.categories && j.categories.location) || '' };
      }
    } else if (/jobs\.ashbyhq\.com\/[^/]+\/[0-9a-f-]{36}/i.test(url)) {
      const m = url.match(/jobs\.ashbyhq\.com\/([^/]+)\/([0-9a-f-]{36})/i);
      const res = UrlFetchApp.fetch('https://api.ashbyhq.com/posting-api/job-board/' + m[1], { muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        const job = (JSON.parse(res.getContentText()).jobs || []).filter(function (x) { return x.id === m[2]; })[0];
        if (job) info = { text: job.descriptionPlain || htmlToText_(job.descriptionHtml || ''), role: job.title || '', location: job.location || '' };
      }
    } else if (/smartrecruiters\.com\/[^/]+\/(\d{9,})/i.test(url)) {
      const m = url.match(/smartrecruiters\.com\/([^/]+)\/(\d{9,})/i);
      const res = UrlFetchApp.fetch('https://api.smartrecruiters.com/v1/companies/' + m[1] + '/postings/' + m[2], { muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        const j = JSON.parse(res.getContentText());
        const sec = (j.jobAd && j.jobAd.sections) || {};
        const parts = ['companyDescription', 'jobDescription', 'qualifications', 'additionalInformation'].map(function (k) {
          const x = sec[k]; return x && x.text ? (x.title ? x.title + '\n' : '') + htmlToText_(x.text) : '';
        }).filter(String);
        const loc = j.location ? [j.location.city, j.location.country].filter(String).join(', ') : '';
        info = { text: parts.join('\n\n'), role: j.name || '', company: (j.company && j.company.name) || '', location: loc };
      }
    } else if (/\.jobs\.personio\.(com|de)\/job\/(\d+)/i.test(url)) {
      const m = url.match(/\/\/([a-z0-9-]+)\.jobs\.personio\.(com|de)\/job\/(\d+)/i);
      info = fetchPersonio_(m[1], m[2], m[3]) || fetchPosting_(url);
    } else {
      info = fetchPosting_(url);
      // Ohne strukturierte Anzeige (JSON-LD) nur längere Seitentexte nehmen – sonst ist es oft nur Cookie-Hinweis oder Startseite
      if (info && !info.role && String(info.text || '').length < 1500) info.text = '';
    }
  } catch (e) { info = { text: '' }; }
  info = info || { text: '' };
  info.text = cleanText_(info.text || '');
  if (info.text.length < 200) info.text = '';
  return info;
}

/** Personio: öffentlicher XML-Feed aller Stellen der Firma. */
function fetchPersonio_(company, tld, id) {
  const langs = ['de', 'en'];
  for (let i = 0; i < langs.length; i++) {
    const res = UrlFetchApp.fetch('https://' + company + '.jobs.personio.' + tld + '/xml?language=' + langs[i], { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) continue;
    const root = XmlService.parse(res.getContentText()).getRootElement();
    const pos = root.getChildren('position').filter(function (p) { return p.getChildText('id') === String(id); })[0];
    if (!pos) continue;
    const jd = pos.getChild('jobDescriptions');
    const parts = jd ? jd.getChildren('jobDescription').map(function (d) { return d.getChildText('name') + '\n' + htmlToText_(d.getChildText('value') || ''); }) : [];
    if (!parts.length) continue; // Anzeige gibt es nur in der anderen Sprache
    const head = [pos.getChildText('name'), pos.getChildText('subcompany'), pos.getChildText('office'), pos.getChildText('recruitingCategory')].filter(String).join('\n');
    parts.unshift(head);
    return { text: parts.join('\n\n'), role: pos.getChildText('name') || '', location: pos.getChildText('office') || '', company: '' };
  }
  return null;
}

/** Für alle Jobs mit Link, aber ohne gespeicherte Anzeige, die Anzeige holen (höchstens max pro Lauf). */
function fetchMissing_(max) {
  const sh = sheet_(), map = colMap_(sh);
  const last = lastDataRow_(sh, map);
  if (last < 2 || !map.url) return { ok: [], failed: [], left: 0 };
  const rows = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  const ps = postingsSheet_();
  const todo = [];
  rows.forEach(function (r, i) {
    const job = rowToJob_(r, map);
    if (job.url && job.id && !job.postingSaved && !findPosting_(ps, job.id)) todo.push({ row: i + 2, job: job });
  });
  const ok = [], failed = [];
  const started = Date.now();
  for (let i = 0; i < todo.length && i < max && Date.now() - started < 270000; i++) {
    const t = todo[i], name = t.job.company + ' – ' + t.job.role;
    const info = fetchAny_(t.job.url);
    if (!info.text) { failed.push(name); continue; }
    withLock_(function () {
      const now = new Date();
      ps.appendRow([String(t.job.id), t.job.url, now, info.text.slice(0, MAX_TEXT)]);
      markPostingChanged_(sh, map, t.row, now);
    });
    ok.push(name);
    if (linkedinId_(t.job.url)) Utilities.sleep(700); // LinkedIn nicht zu schnell hintereinander fragen
  }
  return { ok: ok, failed: failed, left: Math.max(0, todo.length - ok.length - failed.length) };
}

/** App: „Fehlende Anzeigen holen“. */
function apiFetchMissing(key) {
  check_(key);
  return fetchMissing_(25);
}

/** Menü: Fehlende Anzeigen holen. */
function jtAnzeigenNachladen() {
  const r = fetchMissing_(40);
  SpreadsheetApp.getUi().alert('Anzeigen nachgeladen',
    'Gespeichert: ' + r.ok.length + (r.ok.length ? '\n' + r.ok.join('\n') : '') +
    '\n\nNicht abrufbar: ' + r.failed.length + (r.failed.length ? '\n' + r.failed.join('\n') + '\n→ in Safari mit „Job speichern“ oder in der App mit „Text einfügen“ sichern.' : '') +
    (r.left ? '\n\nNoch offen: ' + r.left + ' – einfach nochmal ausführen.' : ''), SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Menü: alle gespeicherten Anzeigen einheitlich aufbereiten (Text bleibt inhaltlich gleich). */
function jtAnzeigenAufraeumen() {
  const ps = postingsSheet_();
  const last = ps.getLastRow();
  if (last < 2) return;
  const rg = ps.getRange(2, 4, last - 1, 1);
  const vals = rg.getValues();
  let n = 0;
  const out = vals.map(function (r) { const t = normalizePosting_(r[0]); if (t !== String(r[0])) n++; return [t]; });
  rg.setValues(out);
  SpreadsheetApp.getUi().alert('Anzeigen aufgeräumt', n + ' von ' + vals.length + ' Anzeigen wurden vereinheitlicht.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Öffentliche LinkedIn-Jobansicht (ohne Login). Kann von LinkedIn blockiert werden. */
function fetchLinkedin_(id) {
  try {
    const res = UrlFetchApp.fetch('https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/' + id, { muteHttpExceptions: true,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', 'Accept-Language': 'de,en;q=0.8' } });
    if (res.getResponseCode() !== 200) return { text: '' };
    const h = res.getContentText();
    const pick = function (re) { const x = h.match(re); return x ? decode_(htmlToText_(x[1])).trim() : ''; };
    return {
      role: pick(/<h2[^>]*top-card-layout__title[^>]*>([\s\S]*?)<\/h2>/i),
      company: pick(/<a[^>]*topcard__org-name-link[^>]*>([\s\S]*?)<\/a>/i),
      location: pick(/<span[^>]*topcard__flavor--bullet[^>]*>([\s\S]*?)<\/span>/i),
      text: pick(/<div[^>]*show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/i),
      title: ''
    };
  } catch (e) { return { text: '' }; }
}

/**
 * Speichert eine Stellenanzeige.
 * data: {id?, url?, title?, company?, role?, location?, text?}
 * - mit id: hängt die Anzeige an diesen Job
 * - ohne id: sucht einen Job mit demselben Link, sonst wird ein neuer Job angelegt
 * - ohne text: die Seite wird hier abgerufen (LinkedIn über die öffentliche Jobansicht)
 * linkOnly: Job auch ohne Anzeigentext anlegen (Kurzbefehl aus Apps)
 */
function savePosting_(data, linkOnly) {
  let text = cleanText_(data.text);
  let url = String(data.url || '').trim();
  let info = {};
  // Karriereseiten mit eingebettetem Greenhouse (z. B. ?gh_jid=…): Der Kurzbefehl sieht nur die Hülle
  // („bitte Cookies akzeptieren“). Dann die Anzeige direkt über die Greenhouse-Schnittstelle holen.
  if (/[?&]gh_jid=\d+/.test(url) && (text.length < 1500 || /cookie/i.test(text))) {
    const gh = fetchGreenhouse_(url);
    if (gh.text && gh.text.length >= 200) { text = gh.text; info = gh; }
  }
  if (!text) {
    if (!url) throw new Error('Kein Text und kein Link übergeben.');
    const li = linkedinId_(url);
    if (li) url = 'https://www.linkedin.com/jobs/view/' + li + '/';
    info = fetchAny_(url);
    text = info.text || '';
    if (text.length < 200) {
      text = '';
      if (!linkOnly) throw new Error('Die Seite liefert keinen lesbaren Text (z. B. LinkedIn oder Workday). Bitte in Safari über Teilen → „Job speichern“ sichern oder den Text einfügen.');
    }
  }
  return withLock_(function () {
    const sh = sheet_();
    const map = colMap_(sh);
    let r = data.id ? findRow_(sh, map, data.id) : 0;
    if (!r && url && map.url) r = findByUrl_(sh, map, url);
    const parsed = splitTitle_(data.title || info.title || '');
    if (!r) r = findSameJob_(sh, map, data.company || info.company || data.hintCompany || parsed.company,
      data.role || info.role || data.hintRole || parsed.role, url);
    let created = false;
    if (!r) {
      addRow_({
        company: data.company || info.company || data.hintCompany || parsed.company,
        role: data.role || info.role || data.hintRole || parsed.role || (linkedinId_(url) ? 'LinkedIn-Job (bitte ergänzen)' : 'Neuer Job (bitte ergänzen)'),
        location: data.location || info.location || '',
        url: url,
        notes: text ? 'per Kurzbefehl gespeichert' : 'per Kurzbefehl gespeichert – Anzeige fehlt noch'
      });
      r = lastDataRow_(sh, map);
      created = true;
    }
    // Bestehender Job ohne Link: den Link der gespeicherten Seite übernehmen
    if (!created && url && map.url && !String(sh.getRange(r, map.url).getValue() || '').trim()) sh.getRange(r, map.url).setValue(url);
    const job0 = rowToJob_(sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0], map);
    const name = [job0.company, job0.role].filter(String).join(' – ');
    if (!text) {
      return { created: created, job: job0, chars: 0,
        message: (created ? 'Job angelegt: ' : 'Job schon vorhanden: ') + name + '. Anzeige konnte nicht geladen werden – in Safari „Job speichern“ nutzen.' };
    }
    const id = String(job0.id);
    const ps = postingsSheet_();
    const now = new Date();
    const existing = findPosting_(ps, id);
    if (existing && !created && !data.replace) {
      const old = ps.getRange(existing, 1, 1, 4).getValues()[0];
      if (sameText_(old[3], text)) return { created: false, job: job0, chars: String(old[3]).length, message: 'Anzeige war schon gespeichert (unverändert): ' + name };
      // Nicht still überschreiben: neue Anzeige parken und nachfragen. Bestätigt wird über confirmUrl (Kurzbefehl) oder replace:true (App).
      const token = Utilities.getUuid().replace(/-/g, '');
      ps.getRange(existing, 5, 1, 3).setValues([[text.slice(0, MAX_TEXT), url, token + '|' + now.getTime()]]);
      const savedOn = old[2] instanceof Date ? Utilities.formatDate(old[2], Session.getScriptTimeZone(), 'dd.MM.yyyy') : String(old[2]);
      return { created: false, job: job0, chars: 0, ask: true,
        confirm: ScriptApp.getService().getUrl() + '?confirm=' + token,
        message: 'Für ' + name + ' ist schon eine Anzeige gespeichert (' + savedOn + '). Durch die neue ersetzen?' };
    }
    const values = [[id, url, now, text.slice(0, MAX_TEXT)]];
    if (existing) { ps.getRange(existing, 1, 1, 4).setValues(values); ps.getRange(existing, 5, 1, 3).clearContent(); }
    else ps.appendRow(values[0]);
    markPostingChanged_(sh, map, r, now);
    const job = rowToJob_(sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0], map);
    return { created: created, job: job, chars: Math.min(text.length, MAX_TEXT),
      message: (created ? 'Neuer Job angelegt: ' : 'Anzeige gespeichert: ') + name };
  });
}

/** Nach neuer oder gelöschter Anzeige: Datum setzen und alte Claude-Bewertung leeren (wird dann neu bewertet). */
function markPostingChanged_(sh, map, r, when) {
  if (map.postingSaved) sh.getRange(r, map.postingSaved).setValue(when ? Utilities.formatDate(when, Session.getScriptTimeZone(), 'dd.MM.yyyy') : '');
  if (map.fitNote) sh.getRange(r, map.fitNote).setValue('');
}

function sameText_(a, b) {
  const n = function (t) { return String(t || '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT - 100); };
  return n(a) === n(b);
}

/** Bestätigung aus dem Kurzbefehl: geparkte neue Anzeige übernehmen (Link gilt 30 Minuten). */
function confirmReplace_(token) {
  if (!/^[a-f0-9]{32}$/.test(token)) throw new Error('Ungültiger Link.');
  return withLock_(function () {
    const ps = postingsSheet_();
    const last = ps.getLastRow();
    if (last < 2) throw new Error('Nichts zu ersetzen.');
    const rows = ps.getRange(2, 1, last - 1, 7).getValues();
    for (let i = 0; i < rows.length; i++) {
      const parts = String(rows[i][6] || '').split('|');
      if (parts[0] !== token) continue;
      if (Date.now() - Number(parts[1]) > 30 * 60 * 1000) { ps.getRange(i + 2, 5, 1, 3).clearContent(); throw new Error('Zu spät – bitte den Kurzbefehl nochmal ausführen.'); }
      const now = new Date();
      ps.getRange(i + 2, 1, 1, 7).setValues([[rows[i][0], rows[i][5] || rows[i][1], now, rows[i][4], '', '', '']]);
      const sh = sheet_(), map = colMap_(sh);
      const r = findRow_(sh, map, rows[i][0]);
      if (r) markPostingChanged_(sh, map, r, now);
      // Link des Jobs mitziehen, wenn er leer ist oder auf die alte (falsche) Seite zeigte
      if (r && map.url && rows[i][5]) {
        const cur = String(sh.getRange(r, map.url).getValue() || '');
        if (!cur || normUrl_(cur) === normUrl_(rows[i][1])) sh.getRange(r, map.url).setValue(rows[i][5]);
      }
      return 'Anzeige ersetzt ✓';
    }
    throw new Error('Nicht gefunden – bitte den Kurzbefehl nochmal ausführen.');
  });
}

/** Gespeicherte Anzeige eines Jobs löschen (App: „Anzeige löschen“). */
function apiDeletePosting(key, id) {
  check_(key);
  return withLock_(function () {
    const sh = sheet_(), map = colMap_(sh);
    const r = findRow_(sh, map, id);
    if (!r) throw new Error('Job nicht gefunden.');
    const ps = postingsSheet_();
    const p = findPosting_(ps, id);
    if (p) ps.deleteRow(p);
    markPostingChanged_(sh, map, r, null);
    return rowToJob_(sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0], map);
  });
}

/** Gespeicherter Anzeigentext eines Jobs. */
function apiGetPosting(key, id) {
  check_(key);
  const ps = postingsSheet_();
  const r = findPosting_(ps, id);
  if (!r) return null;
  const v = ps.getRange(r, 1, 1, 4).getValues()[0];
  return { id: String(v[0]), url: String(v[1]), savedAt: iso_(v[2]), text: normalizePosting_(v[3]) };
}

/* ------------------------------------------------------------------ */
/* Übersetzung der Stellenausschreibung ins Englische (seit 1.6.29)     */
/* Google Übersetzer über LanguageApp; Ergebnis wird in „Anzeigen“ H/I   */
/* zwischengespeichert, damit jede Ausschreibung nur einmal übersetzt wird. */
/* ------------------------------------------------------------------ */
function looksEnglish_(t) {
  const w = String(t).toLowerCase().match(/[a-zäöüß]+/g) || [];
  const DE = { und: 1, der: 1, die: 1, das: 1, mit: 1, für: 1, sie: 1, wir: 1, ist: 1, eine: 1, ein: 1, bei: 1, oder: 1, auf: 1, zu: 1, im: 1, von: 1, dich: 1, dein: 1, deine: 1, ihre: 1 };
  const EN = { the: 1, and: 1, with: 1, for: 1, you: 1, we: 1, is: 1, are: 1, a: 1, of: 1, to: 1, in: 1, your: 1, our: 1, will: 1, on: 1 };
  let de = 0, en = 0;
  w.forEach(function (x) { if (DE[x]) de++; if (EN[x]) en++; });
  return en > de * 1.5;
}

function translateLong_(text) {
  // LanguageApp verarbeitet nur begrenzte Längen: in Absätzen bis ca. 4500 Zeichen übersetzen
  const parts = String(text).split(/\n{2,}/);
  const chunks = []; let cur = '';
  parts.forEach(function (p) {
    if ((cur + '\n\n' + p).length > 4500 && cur) { chunks.push(cur); cur = p; } else cur = cur ? cur + '\n\n' + p : p;
  });
  if (cur) chunks.push(cur);
  return chunks.map(function (c) { return LanguageApp.translate(c, 'de', 'en'); }).join('\n\n');
}

function apiTranslatePosting(key, id) {
  check_(key);
  const ps = postingsSheet_();
  const r = findPosting_(ps, id);
  if (!r) return null;
  if (ps.getMaxColumns() < 9) ps.insertColumnsAfter(ps.getMaxColumns(), 9 - ps.getMaxColumns());
  if (!ps.getRange(1, 8).getValue()) ps.getRange(1, 8, 1, 2).setValues([['Übersetzung (Englisch)', 'Übersetzt von']]).setFontWeight('bold');
  const v = ps.getRange(r, 1, 1, 9).getValues()[0];
  const text = normalizePosting_(v[3]);
  const sig = iso_(v[2]) + '|' + text.length;
  if (!text) return { id: String(id), text: '', translated: false };
  if (looksEnglish_(text)) return { id: String(id), text: text, translated: false };
  if (String(v[8]) === sig && v[7]) return { id: String(id), text: String(v[7]), translated: true };
  const en = translateLong_(text);
  ps.getRange(r, 8, 1, 2).setValues([[en, sig]]);
  return { id: String(id), text: en, translated: true };
}

/** Link zur CV-Datei in Google Drive (sucht nach dem Dateinamen). */
function apiCvLink(key, name) {
  check_(key);
  name = String(name || '').trim();
  if (!name) return null;
  const it = DriveApp.getFilesByName(name);
  return it.hasNext() ? it.next().getUrl() : null;
}

/* ------------------------------------------------------------------ */
/* Hilfsfunktionen Anzeigen                                            */
/* ------------------------------------------------------------------ */

function postingsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ps = ss.getSheetByName(POSTINGS);
  if (!ps) {
    ps = ss.insertSheet(POSTINGS);
    ps.getRange(1, 1, 1, 4).setValues([['ID', 'Link', 'Gespeichert am', 'Text']]).setFontWeight('bold');
    ps.setFrozenRows(1);
    ps.setColumnWidth(4, 600);
  }
  if (ps.getMaxColumns() >= 7 && !ps.getRange(1, 5).getValue()) ps.getRange(1, 5, 1, 3).setValues([['Neu (wartet auf Bestätigung)', 'Neuer Link', 'Bestätigungs-Code']]).setFontWeight('bold');
  else if (ps.getMaxColumns() < 7) { ps.insertColumnsAfter(ps.getMaxColumns(), 7 - ps.getMaxColumns()); ps.getRange(1, 5, 1, 3).setValues([['Neu (wartet auf Bestätigung)', 'Neuer Link', 'Bestätigungs-Code']]).setFontWeight('bold'); }
  return ps;
}

function findPosting_(ps, id) {
  const last = ps.getLastRow();
  if (last < 2) return 0;
  const ids = ps.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

function normUrl_(u) {
  return String(u || '').trim().toLowerCase().replace(/^https?:\/\/(www\.|de\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
}

function findByUrl_(sh, map, url) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const want = normUrl_(url);
  const v = sh.getRange(2, map.url, last - 1, 1).getValues();
  for (let i = 0; i < v.length; i++) if (want && normUrl_(v[i][0]) === want) return i + 2;
  return 0;
}

/**
 * Derselbe Job unter anderem Link? (z. B. Karriereseite vs. Workable/LinkedIn)
 * Treffer, wenn beide Links dieselbe Stellen-ID enthalten (mind. 8 Zeichen, mit Ziffer)
 * oder Firma gleich ist und die Stellenbezeichnungen (ohne m/w/d, Satzzeichen) übereinstimmen.
 */
function findSameJob_(sh, map, company, role, url) {
  const last = lastDataRow_(sh, map);
  if (last < 2) return 0;
  const norm = function (t) { return String(t || '').toLowerCase().replace(/\((m|w|d|f|x|all genders?|alle)[^)]*\)/g, ' ').replace(/[^a-z0-9äöüß]+/g, ''); };
  const ids = function (u) { return (String(u || '').match(/[A-Za-z0-9]{8,}/g) || []).filter(function (x) { return /\d/.test(x) && !/^(https?|linkedin|personio|greenhouse|workable)$/i.test(x); }); };
  // Firmenname ohne Rechtsform/Region vergleichen: „Spheros Germany GmbH“ = „Spheros“
  const normC = function (t) { return norm(String(t || '').toLowerCase().replace(/\b(gmbh|mbh|ag|se|kg|kgaa|co|inc|ltd|llc|bv|sa|sas|plc|germany|deutschland|europe|europa|emea|group|gruppe|holding)\b\.?/g, ' ')); };
  const sameCo = function (a, b) { return a === b || (Math.min(a.length, b.length) >= 4 && (a.indexOf(b) === 0 || b.indexOf(a) === 0)); };
  const myIds = ids(url), c = normC(company), ro = norm(role);
  const rows = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const theirIds = map.url ? ids(r[map.url - 1]) : [];
    if (myIds.some(function (x) { return theirIds.indexOf(x) >= 0; })) return i + 2;
    const rc = normC(r[map.company - 1]), rr = norm(r[map.role - 1]);
    if (c && ro && rc && sameCo(rc, c) && rr && (rr === ro || (Math.min(rr.length, ro.length) >= 12 && (rr.indexOf(ro) >= 0 || ro.indexOf(rr) >= 0)))) return i + 2;
  }
  return 0;
}

/** „Stelle – Firma“ / „Stelle at Firma“ / „Stelle | Firma“ grob trennen. */
function splitTitle_(t) {
  t = String(t || '').replace(/\s*\|\s*LinkedIn.*$/i, '').trim();
  let m = t.match(/^(.*?)\s+(?:at|bei)\s+(.+)$/i);
  if (m) return { role: m[1].trim(), company: m[2].trim() };
  m = t.match(/^(.*?)\s+[-–|]\s+(.+)$/);
  if (m) return { role: m[1].trim(), company: m[2].trim() };
  return { role: t, company: '' };
}

/** Lädt eine Seite und holt Text, Titel und Firma (bevorzugt aus JSON-LD „JobPosting“). */
function fetchPosting_(url) {
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true,
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) JobTracker/1.0', 'Accept-Language': 'de,en;q=0.8' } });
  if (res.getResponseCode() >= 400) return { text: '' };
  return parsePostingHtml_(res.getContentText());
}

function parsePostingHtml_(html) {
  const out = { text: '', title: '', company: '', role: '', location: '' };
  const tm = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (tm) out.title = decode_(tm[1]).trim();
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const found = findJobPosting_(JSON.parse(m[1]));
      if (found) {
        out.role = found.title || '';
        const org = found.hiringOrganization;
        out.company = (org && (org.name || org)) || '';
        const loc = [].concat(found.jobLocation || [])[0];
        const a = loc && loc.address;
        out.location = (a && (a.addressLocality || a.addressRegion)) || '';
        if (found.description) out.text = cleanText_(htmlToText_(String(found.description)));
        break;
      }
    } catch (e) { /* kaputtes JSON-LD überspringen */ }
  }
  if (!out.text) out.text = mainText_(html);
  if (typeof out.company !== 'string') out.company = '';
  return out;
}

/* ---- Seiten ohne JSON-LD: nur den Anzeigenteil nehmen, Cookie-Banner, Menüs, Suche, Fußzeile weglassen ---- */

/** Ende (Index nach dem schließenden Tag) des Elements, das bei start beginnt; -1 wenn nicht gefunden. */
function elementEnd_(html, start) {
  const tag = (html.slice(start).match(/^<([a-z0-9]+)/i) || [])[1];
  if (!tag) return -1;
  if (/^(br|img|input|meta|link|hr)$/i.test(tag)) return html.indexOf('>', start) + 1;
  const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (/\/>$/.test(m[0]) && !m[1]) continue;
    depth += m[1] ? -1 : 1;
    if (depth === 0) return re.lastIndex;
  }
  return -1;
}

/** Inhalt des ersten Elements, dessen öffnendes Tag auf re passt. */
function elementByAttr_(html, re) {
  const m = re.exec(html);
  if (!m) return '';
  const end = elementEnd_(html, m.index);
  return end > m.index ? html.slice(m.index, end) : '';
}

const NOISE_ = /(^|[\s_-])(cookie\w*|consent\w*|onetrust\w*|gdpr|privacy-banner|nav|navbar|navigation|menu\w*|footer\w*|header|search\w*|savesearch\w*|language\w*|locale\w*|langselect\w*|modal|breadcrumbs?|social\w*|share\w*|skip\w*|sitemap)([\s_-]|$)/i;

function mainText_(html) {
  html = String(html).replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  // 1) Strukturierte Anzeige (Microdata, z. B. SAP SuccessFactors): Kopfdaten + Beschreibung
  const desc = elementByAttr_(html, /<[a-z0-9]+[^>]*itemprop=["']description["'][^>]*>/i);
  if (desc && htmlToText_(desc).length >= 300) {
    const head = [];
    const pick = function (re) { const x = elementByAttr_(html, re); return x ? htmlToText_(x).replace(/\s+/g, ' ').trim() : ''; };
    const t = pick(/<[a-z0-9]+[^>]*itemprop=["']title["'][^>]*>/i);
    const d = pick(/<[a-z0-9]+[^>]*id=["']job-date["'][^>]*>/i) || pick(/<[a-z0-9]+[^>]*itemprop=["']datePosted["'][^>]*>/i);
    const l = pick(/<[a-z0-9]+[^>]*id=["']job-location["'][^>]*>/i) || pick(/<[a-z0-9]+[^>]*itemprop=["']jobLocation["'][^>]*>/i);
    const c = pick(/<[a-z0-9]+[^>]*id=["']job-company["'][^>]*>/i);
    if (t) head.push(t);
    [d, l, c].forEach(function (x) { if (x) head.push(x); });
    return (head.length ? head.join('\n') + '\n\n' : '') + htmlToText_(desc);
  }
  // 2) Sonst: Hauptbereich (<main>/<article>), daraus Rauschen entfernen
  let part = elementByAttr_(html, /<main\b[^>]*>/i) || elementByAttr_(html, /<[a-z0-9]+[^>]*role=["']main["'][^>]*>/i) || elementByAttr_(html, /<article\b[^>]*>/i);
  if (!part || htmlToText_(part).length < 300) part = (html.match(/<body[\s\S]*<\/body>/i) || [html])[0];
  return htmlToText_(stripNoise_(part));
}

/** Entfernt Menüs, Kopf-/Fußzeilen, Formulare und Blöcke mit Cookie-/Such-/Sprach-Klassen. */
function stripNoise_(h) {
  h = h.replace(/<(select|button)\b[\s\S]*?<\/\1>/gi, ' ');
  const re = /<([a-z0-9]+)\b([^>]*)>/gi;
  let out = '', pos = 0, m;
  while ((m = re.exec(h))) {
    const tag = m[1].toLowerCase(), attrs = m[2] || '';
    const cls = ((attrs.match(/\b(?:class|id)=["']([^"']*)["']/gi) || []).join(' ')).replace(/\b(?:class|id)=["']/gi, ' ').replace(/["']/g, ' ');
    const noisy = /^(nav|header|footer|aside|form|dialog)$/.test(tag) || cls.split(/\s+/).some(function (c) { return c && NOISE_.test(c); }) || /aria-hidden=["']true["']/i.test(attrs);
    if (!noisy) continue;
    const end = elementEnd_(h, m.index);
    if (end <= m.index) continue;
    out += h.slice(pos, m.index) + ' ';
    pos = end; re.lastIndex = end;
  }
  return out + h.slice(pos);
}

function findJobPosting_(o) {
  if (!o || typeof o !== 'object') return null;
  if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) { const f = findJobPosting_(o[i]); if (f) return f; } return null; }
  const t = o['@type'];
  if (t === 'JobPosting' || (Array.isArray(t) && t.indexOf('JobPosting') >= 0)) return o;
  if (o['@graph']) return findJobPosting_(o['@graph']);
  return null;
}

function htmlToText_(h) {
  return decode_(String(h).replace(/\r/g, '')
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|ul|ol)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decode_(s) {
  return String(s)
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
    .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); });
}

/* ------------------------------------------------------------------ */
/* Menü und Einrichtung                                                */
/* ------------------------------------------------------------------ */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Careerway')
    .addItem('Einrichten', 'jtEinrichten')
    .addItem('App-Link anzeigen', 'jtAppLink')
    .addItem('Web-App-Link ändern', 'jtLinkAendern')
    .addSeparator()
    .addItem('Fehlende Anzeigen holen', 'jtAnzeigenNachladen')
    .addItem('Gespeicherte Anzeigen aufräumen', 'jtAnzeigenAufraeumen')
    .addSeparator()
    .addItem('Gmail-Abgleich einrichten', 'jtMailEinrichten')
    .addItem('Mails jetzt prüfen', 'jtMailJetzt')
    .addItem('Gmail-Abgleich ausschalten', 'jtMailAus')
    .addSeparator()
    .addItem('Neuen Schlüssel erzeugen', 'jtNeuerSchluessel')
    .addToUi();
}

/** Ergänzt fehlende Spalten (ID, Anzeige gespeichert), vergibt IDs, legt „Anzeigen“ an. Mehrfach ausführbar. */
function jtEinrichten() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.getRange(1, 1, 1, 13).setValues([Object.keys(COLS).slice(0, 13)]);
  }
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  ['ID', 'Anzeige gespeichert', 'Fit-Begründung', 'CV-Auftrag', 'CV-Link'].forEach(function (h) {
    if (head.indexOf(h) < 0) {
      const c = sh.getLastColumn() + 1;
      sh.getRange(1, c).setValue(h).setFontWeight('bold');
      head.push(h);
    }
  });
  const map = colMap_(sh);
  const last = lastDataRow_(sh, map);
  if (last >= 2) {
    const rng = sh.getRange(2, map.id, last - 1, 1);
    const ids = rng.getValues().map(function (r) { return [r[0] ? r[0] : newId_()]; });
    rng.setValues(ids);
  }
  postingsSheet_();
  if (!ss.getSheetByName(PROFILE)) {
    const pr = ss.insertSheet(PROFILE);
    pr.getRange(1, 1, 1, 3).setValues([['Skill', 'Art (Hard/Soft)', 'Hinweis']]).setFontWeight('bold');
    pr.setFrozenRows(1);
  }
  const props = PropertiesService.getScriptProperties();
  if (!schluessel_()) props.setProperty('appKey', zufallsSchluessel_());
  SpreadsheetApp.getUi().alert('Careerway',
    'Fertig eingerichtet.\n\nNächster Schritt (nur einmal):\nErweiterungen → Apps Script → Bereitstellen → Neue Bereitstellung → Typ „Web-App“\n' +
    '• Ausführen als: Ich\n• Zugriff: Jeder\n→ Bereitstellen.\n\nDanach hier im Menü „Careerway → App-Link anzeigen“ wählen.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function zufallsSchluessel_() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid() + Date.now());
  let s = '';
  for (let i = 0; i < 24; i++) s += abc.charAt(((bytes[i] % 256) + 256) % 256 % abc.length);
  return s;
}

function appUrl_() {
  const saved = PropertiesService.getScriptProperties().getProperty('appUrl') || '';
  if (saved) return saved;
  const url = ScriptApp.getService().getUrl() || '';
  return /\/exec$/.test(url) ? url : '';
}

function jtAppLinkEintragen() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Web-App-Link eintragen',
    'In Apps Script: Bereitstellen → Bereitstellungen verwalten → bei der Web-App die URL kopieren (endet auf /exec) und hier einfügen:',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return false;
  const url = r.getResponseText().trim().replace(/\?.*$/, '');
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) {
    ui.alert('Careerway', 'Das ist kein Web-App-Link. Er beginnt mit https://script.google.com/ und endet auf /exec.', ui.ButtonSet.OK);
    return false;
  }
  PropertiesService.getScriptProperties().setProperty('appUrl', url);
  return true;
}

function jtAppLink() {
  const ui = SpreadsheetApp.getUi();
  if (!appUrl_() && schluessel_() && !jtAppLinkEintragen()) return;
  const url = appUrl_(), k = schluessel_();
  if (!url || !k) {
    ui.alert('Careerway', 'Noch keine Web-App bereitgestellt oder kein Schlüssel vorhanden.\nBitte zuerst „Einrichten“ ausführen und die Web-App bereitstellen.', ui.ButtonSet.OK);
    return;
  }
  const page = APP_PAGE + '#setup=' + Utilities.base64EncodeWebSafe(JSON.stringify({ u: url, k: k }), Utilities.Charset.UTF_8).replace(/=+$/, '');
  const esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.45">' +
    '<p><b>1. Einrichtungs-Link</b> – auf iPhone/iPad in Safari öffnen, dann Teilen → „Zum Home-Bildschirm“:</p>' +
    '<textarea readonly style="width:100%;height:84px" onclick="this.select()">' + esc(page) + '</textarea>' +
    '<p><a href="' + esc(page) + '" target="_blank">Jetzt öffnen</a></p>' +
    '<p><b>2. Für den Kurzbefehl „Job speichern“</b>:</p>' +
    '<p>App-Link:<br><textarea readonly style="width:100%;height:54px" onclick="this.select()">' + esc(url) + '</textarea></p>' +
    '<p>Schlüssel:<br><input readonly style="width:100%" value="' + esc(k) + '" onclick="this.select()"></p>' +
    '<p style="color:#a33">Link und Schlüssel nicht weitergeben – damit kann jeder deine Bewerbungen lesen und ändern.</p></div>'
  ).setWidth(520).setHeight(470);
  ui.showModalDialog(html, 'Careerway – App-Link');
}

function jtNeuerSchluessel() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert('Neuen Schlüssel erzeugen?', 'Danach musst du den Einrichtungs-Link neu öffnen und den Schlüssel im Kurzbefehl ersetzen.', ui.ButtonSet.OK_CANCEL);
  if (r !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperty('appKey', zufallsSchluessel_());
  jtAppLink();
}

function jtLinkAendern() { if (jtAppLinkEintragen()) jtAppLink(); }
