# Änderungsverzeichnis

Versionsnummern: **Haupt.Funktion.Korrektur** (z. B. 1.2.1).

**Apps Script: Bereitstellen nötig?** Nur bei „ja“ musst du etwas tun:
1. Die genannten Dateien aus `google/` in Apps Script neu kopieren und speichern.
2. **Bereitstellen → Bereitstellungen verwalten → Stift → Version: Neue Version**, im Feld **Beschreibung** den Text aus „Beschreibung für die Bereitstellung“ eintragen → **Bereitstellen**.

Bei „nein“ kommt die Änderung automatisch über GitHub Pages. App einmal ganz schließen und zweimal neu öffnen.
Welche Version gerade läuft, steht in der App unter **Einstellungen (Zahnrad)**.

---

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
