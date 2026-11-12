/**
 * Job-Tracker – Google Apps Script für das Tabellenblatt „Bewerbungen“.
 *
 * Die App (GitHub Pages) und der iOS-Kurzbefehl schicken jede Anfrage als
 * POST {fn, key, args}. Erlaubt sind nur Funktionen, deren Name mit „api“ beginnt.
 * Der Kurzbefehl darf statt args auch die Felder direkt mitschicken
 * (z. B. {fn:"apiSavePosting", key, data:{url, title, text}} – data darf auch JSON-Text sein).
 */

const VERSION = '1.3.0'; // siehe CHANGELOG.md
const APP_PAGE = 'https://lobi1994.github.io/Job-Tracker/';
const SHEET = 'Bewerbungen';
const POSTINGS = 'Anzeigen';
const STATUS = ['Noch nicht beworben', 'Beworben', 'Zum Gespräch eingeladen', 'Persönliches Gespräch', 'Jobangebot', 'Abgelehnt'];
const MAX_TEXT = 45000; // Zellgrenze in Google Sheets liegt bei 50.000 Zeichen

// Spaltenname in der Tabelle -> Feldname in der App
const COLS = {
  'Firma': 'company', 'Stelle': 'role', 'Ort / Remote': 'location', 'Status': 'status',
  'Beworben am': 'appliedOn', 'Gespräch am': 'interview', 'Gefällt mir (1-5)': 'like',
  'CV passt (1-5)': 'fit', 'Gehalt angegeben': 'salary', 'Weg / Portal': 'channel',
  'Link Anzeige': 'url', 'CV-Datei': 'cv', 'Notizen': 'notes', 'ID': 'id',
  'Anzeige gespeichert': 'postingSaved'
};
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
  } catch (err) {
    out = { error: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('Job-Tracker ' + VERSION + ' läuft. Die App findest du unter ' + APP_PAGE)
    .setMimeType(ContentService.MimeType.TEXT);
}

/* ------------------------------------------------------------------ */
/* Tabelle lesen und schreiben                                         */
/* ------------------------------------------------------------------ */

function sheet_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
  if (!sh) throw new Error('Blatt „' + SHEET + '“ fehlt. Bitte im Menü „Job-Tracker → Einrichten“ ausführen.');
  return sh;
}

/** Spaltennummer (1-basiert) je Feldname, aus der Kopfzeile gelesen. */
function colMap_(sh) {
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const map = {};
  head.forEach(function (h, i) { const f = COLS[String(h).trim()]; if (f) map[f] = i + 1; });
  if (!map.id) throw new Error('Spalte „ID“ fehlt. Bitte „Job-Tracker → Einrichten“ ausführen.');
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
  if (field === 'like' || field === 'fit') {
    const n = Number(value);
    if (!value && value !== 0) return '';
    if (!(n >= 1 && n <= 5)) throw new Error('Bewertung muss zwischen 1 und 5 liegen.');
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
  return { jobs: jobs, statuses: STATUS, sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(), version: VERSION };
}

/** Ändert einzelne Felder eines Jobs. Setzt bei „Beworben“ automatisch das Datum, falls leer. */
function apiUpdate(key, id, changes) {
  check_(key);
  return withLock_(function () {
    const sh = sheet_();
    const map = colMap_(sh);
    const r = findRow_(sh, map, id);
    if (!r) throw new Error('Job nicht gefunden (ID ' + id + ').');
    Object.keys(changes || {}).forEach(function (f) {
      if (EDITABLE.indexOf(f) < 0 || !map[f]) return;
      sh.getRange(r, map[f]).setValue(toCell_(f, changes[f]));
    });
    if (changes && changes.status && changes.status !== STATUS[0] && map.appliedOn && !sh.getRange(r, map.appliedOn).getValue()) {
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
  data = data || {};
  let text = String(data.text || '').trim();
  const url = String(data.url || '').trim();
  let info = {};
  if (!text) {
    if (!url) throw new Error('Kein Text und kein Link übergeben.');
    info = fetchPosting_(url);
    text = info.text;
    if (!text || text.length < 200) {
      throw new Error('Die Seite liefert keinen lesbaren Text (z. B. LinkedIn oder Workday). Bitte die Anzeige über den Kurzbefehl in Safari speichern oder den Text einfügen.');
    }
  }
  return withLock_(function () {
    const sh = sheet_();
    const map = colMap_(sh);
    let r = data.id ? findRow_(sh, map, data.id) : 0;
    if (!r && url && map.url) r = findByUrl_(sh, map, url);
    let created = false;
    if (!r) {
      const parsed = splitTitle_(data.title || info.title || '');
      addRow_({
        company: data.company || info.company || parsed.company,
        role: data.role || info.role || parsed.role,
        location: data.location || info.location || '',
        url: url,
        notes: 'per Kurzbefehl gespeichert'
      });
      r = lastDataRow_(sh, map);
      created = true;
    }
    const id = String(sh.getRange(r, map.id).getValue());
    const ps = postingsSheet_();
    const now = new Date();
    const existing = findPosting_(ps, id);
    const values = [[id, url, now, text.slice(0, MAX_TEXT)]];
    if (existing) ps.getRange(existing, 1, 1, 4).setValues(values);
    else ps.appendRow(values[0]);
    if (map.postingSaved) sh.getRange(r, map.postingSaved).setValue(Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy'));
    const job = rowToJob_(sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0], map);
    return { created: created, job: job, chars: Math.min(text.length, MAX_TEXT),
      message: (created ? 'Neuer Job angelegt: ' : 'Anzeige gespeichert: ') + [job.company, job.role].filter(String).join(' – ') };
  });
}

/** Gespeicherter Anzeigentext eines Jobs. */
function apiGetPosting(key, id) {
  check_(key);
  const ps = postingsSheet_();
  const r = findPosting_(ps, id);
  if (!r) return null;
  const v = ps.getRange(r, 1, 1, 4).getValues()[0];
  return { id: String(v[0]), url: String(v[1]), savedAt: iso_(v[2]), text: String(v[3]) };
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
        if (found.description) out.text = htmlToText_(String(found.description));
        break;
      }
    } catch (e) { /* kaputtes JSON-LD überspringen */ }
  }
  if (!out.text) out.text = htmlToText_(html);
  if (typeof out.company !== 'string') out.company = '';
  return out;
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
  return decode_(String(h)
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
  SpreadsheetApp.getUi().createMenu('Job-Tracker')
    .addItem('Einrichten', 'jtEinrichten')
    .addItem('App-Link anzeigen', 'jtAppLink')
    .addItem('Web-App-Link ändern', 'jtLinkAendern')
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
  ['ID', 'Anzeige gespeichert'].forEach(function (h) {
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
  const props = PropertiesService.getScriptProperties();
  if (!schluessel_()) props.setProperty('appKey', zufallsSchluessel_());
  SpreadsheetApp.getUi().alert('Job-Tracker',
    'Fertig eingerichtet.\n\nNächster Schritt (nur einmal):\nErweiterungen → Apps Script → Bereitstellen → Neue Bereitstellung → Typ „Web-App“\n' +
    '• Ausführen als: Ich\n• Zugriff: Jeder\n→ Bereitstellen.\n\nDanach hier im Menü „Job-Tracker → App-Link anzeigen“ wählen.',
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
    ui.alert('Job-Tracker', 'Das ist kein Web-App-Link. Er beginnt mit https://script.google.com/ und endet auf /exec.', ui.ButtonSet.OK);
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
    ui.alert('Job-Tracker', 'Noch keine Web-App bereitgestellt oder kein Schlüssel vorhanden.\nBitte zuerst „Einrichten“ ausführen und die Web-App bereitstellen.', ui.ButtonSet.OK);
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
  ui.showModalDialog(html, 'Job-Tracker – App-Link');
}

function jtNeuerSchluessel() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert('Neuen Schlüssel erzeugen?', 'Danach musst du den Einrichtungs-Link neu öffnen und den Schlüssel im Kurzbefehl ersetzen.', ui.ButtonSet.OK_CANCEL);
  if (r !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperty('appKey', zufallsSchluessel_());
  jtAppLink();
}

function jtLinkAendern() { if (jtAppLinkEintragen()) jtAppLink(); }
