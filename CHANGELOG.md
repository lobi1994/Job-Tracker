# Änderungsverzeichnis

Versionsnummern: **Haupt.Funktion.Korrektur** (z. B. 1.2.1). Es gibt **eine gemeinsame Nummer** für App und Apps Script: Jede Version bekommt die nächste Nummer, aber nur der Teil, der sich ändert, übernimmt sie. Ändert sich nur die App, bleibt das Skript auf seiner Nummer (und umgekehrt). Ändern sich beide, haben App und Skript wieder dieselbe Nummer – Nummern dazwischen werden dann übersprungen.

**Apps Script: Bereitstellen nötig?** Nur bei „ja“ musst du etwas tun:
1. Die genannten Dateien aus `google/` in Apps Script neu kopieren und speichern.
2. **Bereitstellen → Bereitstellungen verwalten → Stift → Version: Neue Version**, im Feld **Beschreibung** den Text aus „Beschreibung für die Bereitstellung“ eintragen → **Bereitstellen**.

Bei „nein“ kommt die Änderung automatisch über GitHub Pages. App einmal ganz schließen und zweimal neu öffnen.
Welche Version gerade läuft, steht in der App unter **Einstellungen (Zahnrad)**.

---

## 1.6.5 – 12.11.2026
- **Nachfrage vor dem Ersetzen:** Hat ein Job schon eine Anzeige und der Kurzbefehl liefert eine andere, fragt er „Durch die neue ersetzen?“. OK ersetzt, Abbrechen lässt die alte stehen. Gleicher Text: keine Frage. Dafür die Kurzbefehle einmal um die Schritte aus Abschnitt 3 der Kurzbefehl-Seite ergänzen.
- In der App fragen „Anzeige vom Link speichern“ und „Text einfügen“ ebenfalls nach, bevor eine gespeicherte Anzeige ersetzt wird.
- **Anzeige löschen:** Im Job unter „Unterlagen“ neben „lesen“ jetzt „löschen“.
- Nach Ersetzen oder Löschen wird Claudes Fit-Begründung geleert, damit der Job neu bewertet wird. Zeigte der Link des Jobs auf die falsche Seite, wird er mit ersetzt.
- **Firmen besser wiedererkannt:** „Spheros Germany GmbH“ und „Spheros“ gelten jetzt als dieselbe Firma (Rechtsform und Land werden ignoriert). Vorher entstand dadurch ein doppelter Job.

**Apps Script: Bereitstellen nötig: ja** – `Code.gs` und `Mail.gs` neu kopieren (enthält alles ab 1.3.0; 1.6.4 musst du nicht extra bereitstellen)
**Beschreibung für die Bereitstellung:** `1.6.5 – Skills, Claude-Bewertung, CV erstellen, Greenhouse, Nicht bewerben, Anzeige ersetzen/löschen`

## 1.6.4 – 12.11.2026
- Neuer Status **„Nicht bewerben“** (grau): für Jobs, die nach dem Lesen der Anzeige doch nicht passen. Eigener Filter-Chip, steht in der Liste ganz unten.
- Bei „Nicht bewerben“ wird kein Bewerbungsdatum gesetzt, der Gmail-Abgleich ignoriert diese Jobs, und Claude bewertet sie nicht und baut keinen CV dafür.
- Im Sheet: Auswahlliste, graue Formatierung und Zählung in „Übersicht“ ergänzt.

**Apps Script: Bereitstellen nötig: ja** – `Code.gs` und `Mail.gs` neu kopieren (enthält alles ab 1.3.0)
**Beschreibung für die Bereitstellung:** `1.6.4 – Skills, Claude-Bewertung, CV erstellen, Greenhouse, Nicht bewerben`

## 1.6.3 – 12.11.2026
- App und Apps Script wieder auf derselben Nummer (Skript inhaltlich wie 1.6.2).
- Unter „Unterlagen“ jetzt ein Knopf **„📄 CV öffnen“** statt Textlink (öffnet den zugeschnittenen CV aus Google Drive bzw. sucht die CV-Datei dort).
- Der Bereich **„CV mit Claude erstellen“** erscheint nur noch bei Jobs mit Status „Noch nicht beworben“.

**Apps Script: Bereitstellen nötig: ja** – `Code.gs` und `Mail.gs` neu kopieren (enthält alles ab 1.3.0)
**Beschreibung für die Bereitstellung:** `1.6.3 – Skills, Claude-Bewertung, CV erstellen, Greenhouse-Anzeigen`

## 1.6.2 – 12.11.2026
- **Karriereseiten mit eingebettetem Greenhouse** (z. B. LucaNet, Link mit `?gh_jid=…`): Der Kurzbefehl sah dort nur den Hinweis „bitte Cookies akzeptieren“, weil die eigentliche Anzeige in einem eingebetteten Fenster steckt. Das Skript holt die Anzeige jetzt direkt über die Greenhouse-Schnittstelle.
- **Anzeigen mit HTML-Code** (u. a. von LinkedIn: `<p>`, `<li>` …) werden jetzt sauber als Text angezeigt, auch bei bereits gespeicherten Anzeigen. Neue Anzeigen werden direkt sauber gespeichert.
- Mehr englische Überschriften erkannt („Key responsibilities“, „Qualification and experience“, „About the role“).

**Apps Script: Bereitstellen nötig: ja** – `Code.gs` und `Mail.gs` neu kopieren (enthält alles ab 1.3.0)
**Beschreibung für die Bereitstellung:** `1.6.2 – Skills, Claude-Bewertung, CV erstellen, Greenhouse-Anzeigen`

## 1.6.1 – 12.11.2026
- Korrektur iPhone: Beim Scrollen in einem offenen Fenster (z. B. Stellenanzeige) scrollte die Liste im Hintergrund mit. Der Hintergrund ist jetzt gesperrt, solange ein Fenster offen ist; danach steht die Liste wieder an derselben Stelle.

**Apps Script: Bereitstellen nötig: nein** (für 1.6.0 weiterhin ja)

## 1.6.0 – 12.11.2026
- **Hard und Soft Skills:** In der gespeicherten Stellenanzeige erscheint oben „Skills aus der Anzeige“ mit Hard- und Soft-Skills. Grün mit ✓ = steht in deinem Profil, grau = fehlt dort. Dazu **„Passung Hard Skills: x %“**.
- **Neues Blatt „Profil“** in der Tabelle: deine Skills (aus dem CV vorbefüllt, Soft Skills bitte prüfen). Ergänzen oder löschen jederzeit möglich.
- **Bewertung durch Claude:** Eine geplante Claude-Aufgabe (alle 2 Stunden, 8–20 Uhr) bewertet Jobs mit gespeicherter Anzeige und trägt „CV passt“ und eine kurze **Fit-Begründung** ein (in der App unter „CV passt“).
- **„CV mit Claude erstellen“** in der Detailansicht: legt einen Auftrag an. Die geplante Aufgabe baut den zugeschnittenen CV (nur wahre Inhalte, Sprache der Anzeige), legt ihn in Google Drive ab und zeigt in der App „CV öffnen“.
- Neue Spalten: „Fit-Begründung“, „CV-Auftrag“, „CV-Link“.

**Apps Script: Bereitstellen nötig: ja** – `Code.gs` und `Mail.gs` neu kopieren (enthält alles ab 1.3.0)
**Beschreibung für die Bereitstellung:** `1.6.0 – Skills, Claude-Bewertung, CV erstellen`

## 1.5.3 – 12.11.2026
- Gmail-Abgleich erkennt jetzt auch die **LinkedIn-Easy-Apply-Bestätigung** („Ihre Bewerbung wurde an … gesendet“ / „Your application was sent to …“) und setzt den Job automatisch auf „Beworben“.

**Apps Script: Bereitstellen nötig: ja** – `Code.gs` und `Mail.gs` neu kopieren (enthält alles ab 1.3.0)
**Beschreibung für die Bereitstellung:** `1.5.3 – Bewerben-Knopf, LinkedIn, Bestätigungen automatisch`

## 1.5.2 – 12.11.2026
- Neues App-Icon „Karriere-Rakete“ (mit „ML“).
- Damit das neue Icon erscheint: App vom Home-Bildschirm löschen, Einrichtungs-Link in Safari öffnen (Tabelle → Job-Tracker → App-Link anzeigen) und erneut „Zum Home-Bildschirm“.

**Apps Script: Bereitstellen nötig: nein**

## 1.5.1 – 12.11.2026
- „Created by Matthias Lobinger“ unten in der Liste (mit Link zu LinkedIn), in den Einstellungen, auf der Einrichtungs- und der Kurzbefehl-Seite und in der README.

**Apps Script: Bereitstellen nötig: nein** (in `Code.gs` steht der Name nur als Kommentar; beim nächsten Kopieren automatisch dabei)

## 1.5.0 – 12.11.2026
- **Stellenanzeige gegliedert:** Die gespeicherte Anzeige wird in Abschnitte aufgeteilt – Aufgaben, Profil, Wir bieten, Über die Firma, Bewerbung & Kontakt – mit Farben, Aufzählungen, größerer Schrift und Sprung-Knöpfen oben. Erkennt deutsche und englische Überschriften, auch „Ihre Aufgaben: …“ in einer Zeile.
- Es geht nichts verloren: Der gespeicherte Text bleibt unverändert, die Reihenfolge bleibt wie im Original, Unbekanntes landet unter „Einleitung“ bzw. „Weitere Informationen“. Unten jederzeit „Originaltext anzeigen“.

**Apps Script: Bereitstellen nötig: nein**

## 1.4.2 – 12.11.2026
- Korrektur: „Job speichern“ erkennt einen Job jetzt auch, wenn die Anzeige unter einem **anderen Link** gespeichert wird (z. B. Teltonika-Karriereseite statt Workable). Erkannt wird über die Stellen-ID im Link oder gleiche Firma + Stelle. Vorher entstand ein doppelter Job.

**Apps Script: Bereitstellen nötig: ja** – `Code.gs` und `Mail.gs` neu kopieren (enthält 1.3.0 bis 1.4.2; ersetzt die Bereitstellung von 1.4.0)
**Beschreibung für die Bereitstellung:** `1.4.2 – Bewerben-Knopf, LinkedIn-Link, Bestätigung automatisch, Doppelte vermeiden`

## 1.4.1 – 12.11.2026
- Stellenanzeigen öffnen sich auf iPhone/iPad jetzt **immer in Safari** (auch LinkedIn-Links, statt in der LinkedIn-App). So funktioniert dort direkt „Job speichern“. Gilt für „Jetzt bewerben“, „Anzeige online öffnen“ und „Original öffnen“. Voraussetzung: iOS 17 oder neuer.

**Apps Script: Bereitstellen nötig: nein**

## 1.4.0 – 12.11.2026
- **Schließen / Speichern unten:** große Knöpfe in einer festen Leiste, immer sichtbar beim Scrollen (Detail, Neuer Job, Text einfügen, Stellenanzeige, Mail-Rückmeldung).
- **„Jetzt bewerben ↗“**: erscheint nur bei „Noch nicht beworben“ (in der Detailansicht und auf der Karte). Öffnet die hinterlegte Anzeige und speichert dabei den Anzeigentext automatisch im Hintergrund, falls noch keiner da ist (klappt bei Personio, Greenhouse, softgarden, JOIN, Lever & Co.).
- **Neuer Kurzbefehl „Job-Link speichern“** für die LinkedIn-App und andere Apps: legt den Job mit Link an und versucht, die Beschreibung über die öffentliche LinkedIn-Jobansicht zu holen. Klappt das nicht, steht in der App „Anzeige noch nicht gespeichert“.
- **Eingangsbestätigungen per Mail** setzen den Status jetzt **automatisch** auf „Beworben“ (inkl. Datum und Notiz). Absagen und Einladungen fragen weiter nach.
- **Neue Seite „Kurzbefehle einrichten“** (in der App: Zahnrad → Kurzbefehle) mit Schritt-für-Schritt-Anleitung und Kopier-Knöpfen für Code, App-Link und Schlüssel.

**Apps Script: Bereitstellen nötig: ja** – `Code.gs` **und** `Mail.gs` neu kopieren (enthält auch die Änderungen aus 1.3.0)
**Beschreibung für die Bereitstellung:** `1.4.0 – Bewerben-Knopf, LinkedIn-Link, Bestätigung automatisch`

## 1.3.0 – 12.11.2026
- Detailansicht fürs iPhone überarbeitet: **Speichern und Schließen oben** (bleiben beim Scrollen sichtbar), Felder untereinander statt verschoben, Abschnitte Status / Bewertung / Details, größere Tipp-Flächen, kein Hineinzoomen beim Tippen.
- Auch „Neuer Job“, „Text einfügen“ und „Stellenanzeige“ haben die Knöpfe jetzt oben.
- Kurzbefehl „Job speichern“: einfachere Einrichtung (alle Felder als Text), Anleitung Schritt für Schritt.

**Apps Script: Bereitstellen nötig: ja** – nur `Code.gs` neu kopieren (übersprungen? Dann reicht die Bereitstellung von 1.4.0)
**Beschreibung für die Bereitstellung:** `1.3.0 – Kurzbefehl und Design`

## 1.2.1 – 12.11.2026
- Versionsnummer in der App (Einstellungen) und im Skript; die App warnt, wenn das Apps Script veraltet ist.
- Dieses Änderungsverzeichnis.

**Apps Script: Bereitstellen nötig: ja** – `Code.gs` neu kopieren (`Mail.gs` aus 1.2.0 bleibt gleich)
**Beschreibung für die Bereitstellung:** `1.2.1 – Versionsanzeige`

## 1.2.0 – 12.11.2026
- **Gmail-Abgleich:** erkennt Absagen, Einladungen und Eingangsbestätigungen in Gmail (alle 30 Minuten) und fragt beim Öffnen der App, ob der Status geändert werden soll (Ja / Nein / Mail öffnen / Später).
- Neues Blatt „Vorschläge“, neue Menüpunkte „Gmail-Abgleich einrichten“, „Mails jetzt prüfen“, „Gmail-Abgleich ausschalten“.
- Einstellungen: Knopf „Mails jetzt prüfen“.

**Apps Script: Bereitstellen nötig: ja** – `Code.gs` neu kopieren, neue Datei `Mail.gs` anlegen; danach **Job-Tracker → Gmail-Abgleich einrichten**
**Beschreibung für die Bereitstellung:** `1.2.0 – Gmail-Abgleich`

## 1.1.2 – 12.11.2026
- Klare Fehlermeldung statt „Laden fehlgeschlagen“, wenn die Web-App nicht erreichbar ist (z. B. falscher Link, Zugriff nicht „Jeder“).

**Apps Script: Bereitstellen nötig: nein**

## 1.1.1 – 12.11.2026
- Korrektur: Die Verbindung bleibt im Einrichtungs-Link, damit die App auf dem Home-Bildschirm verbunden ist.

**Apps Script: Bereitstellen nötig: nein**

## 1.1.0 – 12.11.2026
- „Neuer Job“: Text der Stellenanzeige direkt einfügen (z. B. am PC aus Chrome kopiert).

**Apps Script: Bereitstellen nötig: nein**

## 1.0.0 – 12.11.2026
- Erste Version: Liste mit Status-Filtern, Suche, Sortierung, Bearbeiten, Neuer Job, Anzeige speichern (Link, Text, iOS-Kurzbefehl), CV-Link in Drive, Demo-Modus.

**Apps Script: Bereitstellen nötig: ja** (Ersteinrichtung, siehe ANLEITUNG.md)
**Beschreibung für die Bereitstellung:** `1.0.0 – Ersteinrichtung`
