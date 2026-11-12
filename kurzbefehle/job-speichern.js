/*
 * Job-Tracker – Skript für den iOS-Kurzbefehl „Job speichern“
 * Aktion: „JavaScript auf Webseite ausführen“ (Safari-Teilen-Menü).
 * Liest Titel, Firma, Ort und Text der geöffneten Stellenanzeige und gibt sie als Wörterbuch zurück.
 * Funktioniert auch auf Seiten, die nur im Browser lesbar sind (LinkedIn, Workday).
 */
(function () {
  function txt(sel) {
    for (var i = 0; i < sel.length; i++) {
      var el = document.querySelector(sel[i]);
      if (el && el.innerText && el.innerText.trim()) return el.innerText.trim();
    }
    return '';
  }
  function findJob(o) {
    if (!o || typeof o !== 'object') return null;
    if (Array.isArray(o)) { for (var i = 0; i < o.length; i++) { var f = findJob(o[i]); if (f) return f; } return null; }
    var t = o['@type'];
    if (t === 'JobPosting' || (Array.isArray(t) && t.indexOf('JobPosting') >= 0)) return o;
    return o['@graph'] ? findJob(o['@graph']) : null;
  }
  function strip(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, '$&\n').replace(/<li[^>]*>/gi, '$&- ');
    return (d.textContent || '').replace(/[ \t\u00a0]+/g, ' ').replace(/ *\n */g, '\n').trim();
  }

  var out = { url: location.href.split('#')[0], title: document.title, company: '', role: '', location: '', text: '' };

  // 1. Strukturierte Daten (Personio, Greenhouse, Lever, Ashby, Workday, StepStone …)
  var ld = document.querySelectorAll('script[type="application/ld+json"]');
  for (var i = 0; i < ld.length; i++) {
    try {
      var j = findJob(JSON.parse(ld[i].textContent));
      if (j) {
        out.role = j.title || '';
        var org = j.hiringOrganization; out.company = (org && (org.name || org)) || '';
        var loc = [].concat(j.jobLocation || [])[0], a = loc && loc.address;
        out.location = (a && (a.addressLocality || a.addressRegion)) || '';
        if (j.description) out.text = strip(String(j.description));
        break;
      }
    } catch (e) {}
  }

  // 2. LinkedIn (eingeloggt) und andere Seiten ohne strukturierte Daten
  if (!out.role) out.role = txt(['.job-details-jobs-unified-top-card__job-title', '.top-card-layout__title', 'h1']);
  if (!out.company) out.company = txt(['.job-details-jobs-unified-top-card__company-name', '.topcard__org-name-link', '[data-company-name]']);
  if (!out.text || out.text.length < 200) {
    out.text = txt(['#job-details', '.jobs-description__content', '.show-more-less-html__markup', '.description__text',
      '[class*="job-description"]', '[class*="jobDescription"]', 'main', 'article']) || document.body.innerText.trim();
  }
  if (typeof out.company !== 'string') out.company = '';
  out.text = out.text.replace(/\n{3,}/g, '\n\n').slice(0, 45000);
  completion(out);
})();
