# Careerway – Regeln für Claude

Diese Datei liest Claude Code bei jedem Start. Sie gilt für alle Arbeiten in diesem Repo.
Private Werte (Sheet-ID, Drive-Ordner, CV-Fakten, Budgets) stehen NICHT hier, sondern in `CLAUDE.local.md` (nicht im Repo, siehe unten).

## Sprache und Antworten
- Mit Matthias immer auf Deutsch sprechen.
- Antworten im ADHD-Format: zuerst die nächste Handlung, nummerierte Schritte, höchstens 5 Punkte pro Gruppe, Stand immer kurz nennen, am Ende genau ein konkreter nächster Schritt. Keine Einleitung, keine Zusammenfassung am Ende, keine Floskeln.
- Änderungen in einfachen Worten erklären. Texte für Menschen (UI, README, Changelog) einfach und klar, keine Buzzwords („leveraging“, „seamless“, „cutting-edge“), keine Gedankenstriche als Stilmittel.

## Arbeitsweise: Claude ist Architekt und Berater
- Claude plant, entscheidet und prüft. Alles, was ein günstigeres Modell kann, geht an einen Subagent: Sonnet für normale Code-Änderungen, Haiku für sehr einfache Dinge (Filtern, kleine Textänderungen).
- Briefs an Subagents sind vollständig und eigenständig: Ziel, betroffene Dateien, genaue Regeln, Prüfschritte, Format des Berichts. Keine Mini-Aufträge.
- Jedes Ergebnis selbst prüfen (Diff lesen, Tests laufen lassen, bei UI einen Screenshot ansehen), bevor es veröffentlicht wird.
- Im Bericht an Matthias sagen, was Claude selbst gemacht hat und was ein Subagent.

## Aufbau
- `index.html`: die ganze Web-App (eine Datei, Vanilla-JS, kein Build). Deutsch mit Übersetzungsschicht ins Englische (`EN`, `EN_PAT`, `trText`). Demo-Modus über `#demo`, Tour über `#tour`.
- `sw.js`: Service Worker. Cache-Name bei jeder App-Änderung um 1 erhöhen.
- `google/Code.gs`, `google/Mail.gs`: Google Apps Script (Backend auf Matthias' eigenem Google Sheet). Aufruf per POST `{fn, key, data}`; nur Funktionen mit Präfix `api` sind erlaubt; Schlüssel wird zuerst geprüft (`check_`); Schreibzugriffe in `withLock_`; Text aus Webseiten und Mails über `textCell_` schreiben (Schutz vor Formeln).
- `kurzbefehl.html`, `kurzbefehle/`: Anleitung und Code für die iOS-Kurzbefehle „Job speichern“ und „Job-Link speichern“.
- `tests/run.mjs`: Tests mit Node und jsdom (`npm test`), laufen auch in GitHub Actions.
- ATS-Bewertung: Anforderungsliste (Spec-JSON mit `reqs: [{name, w, full, partial}]`) gegen Profiltext; voll = 1, nur verwandt = 0,5, Pflicht zählt doppelt. In `Code.gs` als `parseSpec_` / `atsScore_` / `apiSaveAtsSpec`, gleiche Rechnung wie das Python-Skript `ats_score.py` (liegt in Matthias' Drive).

## Versionen, Changelog, Bereitstellung
- Ein gemeinsamer Zähler für App und Apps Script. Jede Veröffentlichung bekommt die nächste Nummer, aber nur der geänderte Teil: nur App → nur `APP_VERSION`; nur Script → nur `VERSION` in `Code.gs`; beides → beide dieselbe Nummer. Lücken sind okay.
- Zu jeder Veröffentlichung ein Abschnitt oben in `CHANGELOG.md`, im Stil der vorhandenen, mit „Apps Script: Bereitstellen nötig: ja/nein“.
- Muss das Apps Script neu bereitgestellt werden: Matthias Schritt für Schritt sagen, wie (Code.gs kopieren, Bereitstellen → Bereitstellungen verwalten → Stift → Neue Version) und eine kurze Beschreibung für die Bereitstellung mitgeben, z. B. `1.6.47 ATS-Bewertung lokal`.
- Muss ein Kurzbefehl geändert werden: genaue Anleitung, und `kurzbefehl.html` anpassen.
- `NEED_SCRIPT` in `index.html` nur erhöhen, wenn die App eine neue Script-Funktion braucht.
- Wiki: Ändert eine Version eine Funktion, die im Wiki steht (Seiten Funktionen, Architektur, Entscheidungen, ATS-Bewertung, Sicherheit), wird die deutsche und die englische Seite (Endung `-EN`) im selben Zug angepasst und im Wiki-Repository gepusht. Neue Entscheidungen bekommen einen Eintrag mit Grund. Das Wiki ist öffentlich: keine privaten Daten. Das Wiki-Repository liegt im Ordner `../Job-Tracker.wiki` (fehlt er: `git clone https://github.com/lobi1994/Job-Tracker.wiki.git ../Job-Tracker.wiki`).

## Öffentliches Repo: keine privaten Daten
Das Repo ist öffentlich. Nie in Code, Commits oder Git-Historie: Schlüssel, Sheet-IDs, Drive-IDs, Script-URLs, Namen von Firmen, bei denen Matthias sich beworben hat, oder andere persönliche Daten. Beispiele und Demo-Daten nur mit erfundenen Firmen. Vor jedem Commit kurz prüfen (`git diff`).

## Prüfen vor dem Veröffentlichen
1. `npm test` muss komplett grün sein.
2. Bei UI-Änderungen: Demo-Modus lokal öffnen (`python3 -m http.server 8765` im Repo, dann `http://localhost:8765/index.html#demo`), auf 320 und 390 px Breite prüfen, dass nichts seitlich überläuft (`scrollWidth === clientWidth`), Screenshot ansehen, Deutsch und Englisch.
3. Commit mit kurzer deutscher Nachricht, dann pushen und mit `git ls-remote` prüfen.
4. Matthias sagen, was er selbst prüfen soll (z. B. auf dem iPhone).

## Laufendes Vorhaben: KI lokal statt Claude-Tokens
Ziel: Bewertungen und CVs ohne Claude-Tokens, Claude nur noch als Kontrolle.
1. Erledigt (1.6.47): Kurzbefehl lässt Apple Intelligence („Modell verwenden“, Private Cloud Compute) die Spec erstellen, `apiSaveAtsSpec` rechnet und trägt „Lokal (Apple) ATS xx %“ ein. Eine geplante Claude-Aufgabe prüft Stichproben.
2. Offen: Ollama auf dem MacBook Air M4 (16 GB) mit Qwen3 8B. Test an 5 alten Anzeigen gegen Claudes Bewertung, Ziel: höchstens 5 Prozentpunkte Abweichung im Schnitt.
3. Offen: Hintergrundprogramm auf dem Mac (launchd, alle 2 Stunden), das angeforderte CVs mit Qwen3 und dem CV-Baukasten baut und hochlädt. Regeln für CVs (nur wahre Inhalte, nur aus bestätigten Bausteinen auswählen und umformulieren, Rechtschreib- und Namensprüfung, 1 Seite) stehen in `CLAUDE.local.md`. Die Claude-Aufgabe prüft danach nur noch neue CVs.
Hinweis: Safari blockiert Anfragen von der App (HTTPS) an Ollama (`http://localhost`). Darum läuft die lokale KI als Hintergrundprogramm, nicht als Knopf in der App.

## Private Werte
`CLAUDE.local.md` liegt nur auf Matthias' Mac im Repo-Ordner und ist in `.gitignore`. Fehlt sie, danach fragen, nicht raten.
