/**
 * Job-Tracker – Gmail-Abgleich
 *
 * Durchsucht neue Mails nach Rückmeldungen zu deinen Bewerbungen (Absage, Einladung,
 * Eingangsbestätigung) und legt Vorschläge im Blatt „Vorschläge“ an.
 * Eingangsbestätigungen setzen den Status direkt auf „Beworben“. Absagen und Einladungen
 * ändern nichts automatisch: Die App fragt nach, du bestätigst.
 * Deine Mails bleiben in deinem Google-Konto; das Skript schickt nichts nach außen.
 */

const SUGGEST = 'Vorschläge';
const SUGGEST_HEAD = ['VID', 'Job-ID', 'Firma', 'Stelle', 'Art', 'Vorgeschlagener Status', 'Mail-Datum', 'Absender', 'Betreff', 'Auszug', 'Mail-Link', 'Erledigt', 'Mail-ID'];
const FIRST_RUN_DAYS = 30;

// Erkennung: je Treffer Punkte; die Art mit den meisten Punkten gewinnt (mind. 2 Punkte).
const RULES = {
  Absage: [
    [/\bleider\b[\s\S]{0,160}\b(nicht|keine[nm]?|absage|anderen?|entschieden|berücksichtig)/i, 2],
    [/(nicht|keine) (weiter )?(berücksichtig|in (die )?engere auswahl|mehr im (auswahl|bewerbungs)prozess)/i, 3],
    [/(für (einen|eine) )?andere[nr]? (kandidat|bewerber|profil)/i, 2],
    [/\babsage\b/i, 2],
    [/(stelle|position) (wurde |ist )?(bereits )?(besetzt|vergeben)/i, 3],
    [/unfortunately/i, 2],
    [/(not|won't) (be )?(moving|move) forward|decided to (move forward|proceed) with other|not (been )?selected|other candidates|position has been filled|will not be progressing/i, 3],
    [/wish(ing)? you (all the best|every success|success|good luck) (in|with) your (job )?search|viel erfolg (bei|für) (ihre|deine) (weitere|berufliche)/i, 1]
  ],
  Einladung: [
    [/(lade[nt]?|laden wir|möchten (wir )?)(sie|dich|ihnen|dir)? ?(gerne |herzlich )?(zu|zum|zur) [\wäöüß-]*(gespräch|interview|kennenlernen|call)/i, 3],
    [/einladung (zu|zum|zur) [\wäöüß-]*(gespräch|interview|kennenlernen)/i, 3],
    [/termin(vorschlag|vorschläge|e)? für (ein|das|unser) [\wäöüß-]*(gespräch|interview|kennenlernen)/i, 3],
    [/(invite|invitation) (you )?(to|for) (an? )?(interview|call|chat|conversation|meeting)/i, 3],
    [/(schedule|book|arrange) (a|an|the) (call|interview|meeting|time)/i, 2],
    [/calendly\.com|cal\.com\/|doodle\.com|teams\.microsoft\.com\/l\/meetup|meet\.google\.com/i, 2],
    [/(vorstellungs|bewerbungs|telefon|video|kennenlern)gespräch/i, 1]
  ],
  Bestaetigung: [
    [/(eingang|erhalt) (ihrer|deiner) bewerbung/i, 3],
    [/bewerbung (ist )?(gut |erfolgreich )?(bei uns )?eingegangen|bewerbung (haben wir )?erhalten/i, 3],
    [/(vielen |herzlichen )?dank für (ihre|deine) bewerbung/i, 1],
    [/(we have |we've )?received your application|thank you for (your )?(applying|application)|application (has been )?(received|submitted)/i, 3]
  ]
};
const ART_STATUS = { Absage: 'Abgelehnt', Einladung: 'Zum Gespräch eingeladen', Bestaetigung: 'Beworben' };
const ART_NAME = { Absage: 'Absage', Einladung: 'Einladung', Bestaetigung: 'Eingangsbestätigung' };

/* ------------------------------------------------------------------ */
/* Erkennung (ohne Google-Dienste, damit sie testbar bleibt)           */
/* ------------------------------------------------------------------ */

function classifyMail_(subject, body) {
  const text = (String(subject || '') + '\n' + String(body || '')).slice(0, 6000);
  const score = {};
  Object.keys(RULES).forEach(function (art) {
    score[art] = RULES[art].reduce(function (s, r) { return s + (r[0].test(text) ? r[1] : 0); }, 0);
  });
  // Eine Einladung sticht eine reine Eingangsbestätigung; eine klare Absage sticht beides.
  let best = null;
  ['Absage', 'Einladung', 'Bestaetigung'].forEach(function (art) {
    if (score[art] >= 2 && (!best || score[art] > score[best])) best = art;
  });
  return best ? { art: best, score: score[best], scores: score } : null;
}

const LEGAL = /\b(gmbh|ag|se|kg|kgaa|co|mbh|ug|inc|ltd|llc|plc|group|gruppe|holding|deutschland|germany|europe|emea|international|technologies|technology|solutions|systems|software)\b/g;

function normCompany_(name) {
  return String(name || '').toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[+&]/g, ' ')
    .replace(/[^a-z0-9äöüß. ]/g, ' ')
    .replace(LEGAL, ' ')
    .replace(/\s+/g, ' ').trim();
}

function normText_(t) {
  return String(t || '').toLowerCase().replace(/[+&]/g, ' ').replace(/[^a-z0-9äöüß.@ ]/g, ' ').replace(/\s+/g, ' ');
}

function escRe_(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Wie gut passt die Mail zu diesem Job? 0 = gar nicht. */
function matchScore_(job, mail) {
  const n = normCompany_(job.company);
  if (!n || n.length < 2) return 0;
  const head = normText_(mail.from + ' ' + mail.subject);
  const body = normText_(String(mail.body || '').slice(0, 6000));
  // Firmenname als ganzes Wort (auch mit Punkt/Bindestrich-Varianten, z. B. „e.on“ / „eon“)
  const variants = [n, n.replace(/[. ]/g, ''), n.replace(/\./g, '')].filter(function (v, i, a) { return v.length >= 2 && a.indexOf(v) === i; });
  let s = 0;
  variants.forEach(function (v) {
    const re = new RegExp('(^|[^a-z0-9äöüß])' + escRe_(v) + '([^a-z0-9äöüß]|$)', 'i');
    if (re.test(head)) s = Math.max(s, 3);
    else if (v.length >= 4 && re.test(body)) s = Math.max(s, 2);
  });
  if (!s) return 0;
  // Stellen-Wörter als Gleichstand-Brecher (z. B. zwei Stellen bei derselben Firma)
  const words = String(job.role || '').toLowerCase().split(/[^a-z0-9äöüß]+/).filter(function (w) { return w.length >= 5; });
  const all = head + ' ' + body;
  words.forEach(function (w) { if (all.indexOf(w) >= 0) s += 0.25; });
  return s;
}

/** Ermittelt den passenden Job (oder null) und den Vorschlag für eine Mail. */
function suggestForMail_(jobs, mail) {
  const cls = classifyMail_(mail.subject, mail.body);
  if (!cls) return null;
  let best = null, bestScore = 0, tie = false;
  jobs.forEach(function (j) {
    const sc = matchScore_(j, mail);
    if (sc > bestScore) { best = j; bestScore = sc; tie = false; }
    else if (sc && sc === bestScore) tie = true;
  });
  if (!best || tie) return null;
  let status = ART_STATUS[cls.art];
  if (cls.art === 'Einladung' && best.status === 'Zum Gespräch eingeladen' && /vor ort|persönlich|on-?site|in person|in unseren? (büro|räumen)/i.test(mail.body)) status = 'Persönliches Gespräch';
  if (cls.art === 'Einladung' && ['Persönliches Gespräch', 'Jobangebot'].indexOf(best.status) >= 0) return null;
  if (cls.art === 'Bestaetigung' && best.status !== 'Noch nicht beworben') return null;
  if (best.status === status) return null;
  return { job: best, art: cls.art, status: status };
}

function excerpt_(body) {
  const t = String(body || '').replace(/\s+/g, ' ').trim();
  const m = t.match(/[^.!?]*(leider|unfortunately|einlad|invite|interview|gespräch|eingang|received)[^.!?]*[.!?]/i);
  return (m ? m[0] : t).trim().slice(0, 280);
}

/* ------------------------------------------------------------------ */
/* Gmail durchsuchen                                                   */
/* ------------------------------------------------------------------ */

function suggestSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SUGGEST);
  if (!sh) {
    sh = ss.insertSheet(SUGGEST);
    sh.getRange(1, 1, 1, SUGGEST_HEAD.length).setValues([SUGGEST_HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function jobsForMatching_() {
  const sh = sheet_();
  const map = colMap_(sh);
  const last = lastDataRow_(sh, map);
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues().map(function (r) {
    return { id: String(r[map.id - 1]), company: String(r[map.company - 1]), role: String(r[map.role - 1]), status: String(r[map.status - 1]) };
  }).filter(function (j) { return j.id && j.company; });
}

/** Prüft neue Mails seit dem letzten Lauf. Gibt die Zahl neuer Vorschläge zurück. */
function jtMailPruefen() {
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();
  const since = Number(props.getProperty('mailSince')) || (now - FIRST_RUN_DAYS * 864e5);
  const jobs = jobsForMatching_();
  const ss = suggestSheet_();
  const known = {};
  if (ss.getLastRow() > 1) ss.getRange(2, 13, ss.getLastRow() - 1, 1).getValues().forEach(function (r) { known[r[0]] = 1; });
  const me = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  // Eine Stunde Überlappung, damit keine Mail zwischen zwei Läufen verloren geht
  const query = 'after:' + Math.floor((since - 3600e3) / 1000) + ' -in:sent -in:chats -in:spam -in:trash';
  const rows = [];
  let start = 0;
  for (let page = 0; page < 5; page++) {
    const threads = GmailApp.search(query, start, 100);
    if (!threads.length) break;
    threads.forEach(function (t) {
      t.getMessages().forEach(function (m) {
        const id = m.getId();
        if (known[id] || m.getDate().getTime() < since - 3600e3) return;
        const from = String(m.getFrom() || '');
        if (me && from.toLowerCase().indexOf(me) >= 0) return;
        const mail = { from: from, subject: m.getSubject(), body: m.getPlainBody() };
        const sug = suggestForMail_(jobs, mail);
        known[id] = 1;
        if (!sug) return;
        let done = '';
        if (sug.art === 'Bestaetigung') {
          // Eingangsbestätigungen werden direkt übernommen (geringes Risiko), alles andere fragt die App nach.
          const d = m.getDate();
          const cur = apiListOne_(sug.job.id);
          const note = 'Eingangsbestätigung per Mail (' + Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd.MM.yyyy') + ')';
          updateJob_(sug.job.id, { status: 'Beworben', appliedOn: (cur && cur.appliedOn) || Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
            notes: cur && cur.notes ? cur.notes + '; ' + note : note });
          sug.job.status = 'Beworben';
          done = 'automatisch';
        }
        rows.push([Utilities.getUuid().slice(0, 8), sug.job.id, sug.job.company, sug.job.role, ART_NAME[sug.art], sug.status,
          m.getDate(), from, mail.subject, excerpt_(mail.body), 'https://mail.google.com/mail/u/0/#all/' + t.getId(), done, id]);
      });
    });
    if (threads.length < 100) break;
    start += 100;
  }
  if (rows.length) ss.getRange(ss.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  props.setProperty('mailSince', String(now));
  return rows.length;
}

/** Offene Vorschläge für die App (älteste zuerst). */
function apiSuggestions(key) {
  check_(key);
  const ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SUGGEST);
  if (!ss || ss.getLastRow() < 2) return [];
  return ss.getRange(2, 1, ss.getLastRow() - 1, SUGGEST_HEAD.length).getValues()
    .filter(function (r) { return r[0] && !r[11]; })
    .map(function (r) {
      return { vid: String(r[0]), jobId: String(r[1]), company: String(r[2]), role: String(r[3]), art: String(r[4]),
        status: String(r[5]), date: iso_(r[6]), from: String(r[7]), subject: String(r[8]), excerpt: String(r[9]), link: String(r[10]) };
    })
    .sort(function (a, b) { return a.date.localeCompare(b.date); });
}

/** Vorschlag annehmen (Status setzen + Notiz) oder ignorieren. */
function apiResolveSuggestion(key, vid, accept) {
  check_(key);
  const ss = suggestSheet_();
  const last = ss.getLastRow();
  if (last < 2) throw new Error('Vorschlag nicht gefunden.');
  const vals = ss.getRange(2, 1, last - 1, SUGGEST_HEAD.length).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) !== String(vid)) continue;
    let job = null;
    if (accept) {
      const d = vals[i][6] instanceof Date ? Utilities.formatDate(vals[i][6], Session.getScriptTimeZone(), 'dd.MM.yyyy') : '';
      const cur = apiListOne_(String(vals[i][1]));
      const note = vals[i][4] + ' per Mail' + (d ? ' (' + d + ')' : '');
      job = updateJob_(String(vals[i][1]), {
        status: String(vals[i][5]),
        notes: cur && cur.notes ? cur.notes + '; ' + note : note
      });
    }
    ss.getRange(i + 2, 12).setValue(accept ? 'übernommen' : 'ignoriert');
    return { job: job };
  }
  throw new Error('Vorschlag nicht gefunden.');
}

function apiListOne_(id) {
  const sh = sheet_();
  const map = colMap_(sh);
  const r = findRow_(sh, map, id);
  return r ? rowToJob_(sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0], map) : null;
}

/** Mails jetzt prüfen (aus der App). */
function apiCheckMail(key) {
  check_(key);
  return { added: jtMailPruefen() };
}

/* ------------------------------------------------------------------ */
/* Menü                                                                */
/* ------------------------------------------------------------------ */

/** Legt den Zeitplan an (alle 30 Minuten) und prüft einmal die letzten 30 Tage. */
function jtMailEinrichten() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'jtMailPruefen') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('jtMailPruefen').timeBased().everyMinutes(30).create();
  const n = jtMailPruefen();
  SpreadsheetApp.getUi().alert('Job-Tracker', 'Gmail-Abgleich ist eingerichtet und läuft alle 30 Minuten.\n\n' +
    n + ' Vorschlag/Vorschläge aus den letzten ' + FIRST_RUN_DAYS + ' Tagen gefunden. Sie erscheinen beim nächsten Öffnen der App.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function jtMailJetzt() {
  const n = jtMailPruefen();
  SpreadsheetApp.getUi().alert('Job-Tracker', n + ' neue(r) Vorschlag/Vorschläge.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function jtMailAus() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'jtMailPruefen') ScriptApp.deleteTrigger(t); });
  SpreadsheetApp.getUi().alert('Job-Tracker', 'Gmail-Abgleich ist ausgeschaltet.', SpreadsheetApp.getUi().ButtonSet.OK);
}
