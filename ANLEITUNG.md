# Job-Tracker einrichten

Du brauchst: ein Google-Konto, ca. 15 Minuten und für Schritt 1 bis 4 am besten einen Rechner.

---

## 1. Google-Tabelle

**Du hast schon eine Tabelle mit dem Blatt „Bewerbungen“?** Dann öffne sie und mach mit Schritt 2 weiter. Das Skript erkennt die Spalten an ihren Namen in Zeile 1:

`Firma` · `Stelle` · `Ort / Remote` · `Status` · `Beworben am` · `Gespräch am` · `Gefällt mir (1-5)` · `CV passt (1-5)` · `Gehalt angegeben` · `Weg / Portal` · `Link Anzeige` · `CV-Datei` · `Notizen`

Die Reihenfolge ist egal. Die Spalten `ID` und `Anzeige gespeichert` legt das Skript selbst an.

**Neu anfangen?** Öffne [sheets.new](https://sheets.new) und nenne die Tabelle „Job-Tracker“. Das Blatt „Bewerbungen“ mit allen Spalten legt das Skript in Schritt 3 an.

## 2. Skript einfügen

1. In der Tabelle: **Erweiterungen → Apps Script**. Es öffnet sich ein neuer Tab mit der Datei `Code.gs`.
2. Öffne [google/Code.gs](google/Code.gs) und klicke oben rechts auf **Copy raw file**.
3. Zurück in Apps Script: alles in `Code.gs` markieren, löschen, den kopierten Text einfügen.
4. Auf das **Speichern-Symbol** klicken. Oben links kannst du das Projekt „Job-Tracker“ nennen.
5. Links auf das **Zahnrad (Projekteinstellungen)** → Zeitzone **(GMT+01:00) Berlin** wählen. Sonst stimmen die Daten nicht.

## 3. Einrichten ausführen

1. Zurück zur Tabelle und die Seite **neu laden**. Nach ein paar Sekunden erscheint das Menü **Job-Tracker**.
2. **Job-Tracker → Einrichten** wählen.
3. Google fragt nach Berechtigungen. Weil das Skript dein eigenes ist und nicht von Google geprüft wurde, kommt eine Warnung:
   **Konto wählen → Erweitert → „Job-Tracker öffnen (unsicher)“ → Zulassen.**
   Das Skript braucht Zugriff auf die Tabelle, auf externe Seiten (um Stellenanzeigen abzurufen) und auf Google Drive (um deine CV-Datei zu finden).
4. Falls „Fertig eingerichtet“ nicht gleich kommt: **Einrichten** einfach noch einmal wählen.

Dabei entsteht auch dein **eigener zufälliger Schlüssel**.

## 4. Als Web-App bereitstellen (einmalig)

1. Im Apps-Script-Tab oben rechts: **Bereitstellen → Neue Bereitstellung**.
2. Beim Zahnrad neben „Typ auswählen“ **Web-App** wählen.
3. Einstellungen:
   - **Ausführen als:** Ich
   - **Zugriff:** Jeder
4. **Bereitstellen** (ggf. noch einmal „Zugriff autorisieren“).

„Jeder“ ist nötig, damit App und Kurzbefehl deine Tabelle erreichen. Ohne deinen Schlüssel kann niemand etwas lesen oder ändern.

**Später das Skript geändert?** Dann **Bereitstellen → Bereitstellungen verwalten → Stift → Version: Neue Version → Bereitstellen**. So bleibt der Link gleich.

## 5. App auf iPhone / iPad

1. In der Tabelle: **Job-Tracker → App-Link anzeigen**. Beim ersten Mal fragt die Tabelle nach dem **Web-App-Link**: in Apps Script **Bereitstellen → Bereitstellungen verwalten**, die URL der Web-App kopieren (endet auf `/exec`) und einfügen.
2. Den **Einrichtungs-Link** kopieren (beginnt mit `https://lobi1994.github.io/Job-Tracker/#setup=`) und aufs iPhone/iPad bringen, z. B. über Notizen, AirDrop oder eine Mail an dich selbst.
3. Den Link in **Safari** öffnen. Deine Bewerbungen erscheinen.
4. **Teilen → Zum Home-Bildschirm.** Jetzt hast du den Job-Tracker als App.

Am Mac oder PC: Link im Browser öffnen und als Lesezeichen speichern.

> **Wichtig:** Einrichtungs-Link, App-Link und Schlüssel nicht weitergeben. Wer sie hat, kann deine Bewerbungen lesen und ändern. Falls doch: **Job-Tracker → Neuen Schlüssel erzeugen**, dann den neuen Einrichtungs-Link öffnen.

## 6. Kurzbefehle „Job speichern“ und „Job-Link speichern“ (iPhone / iPad)

Die ausführliche Anleitung mit Kopier-Knöpfen steht auf einer eigenen Seite: in der App **Zahnrad → Kurzbefehle „Job speichern“ einrichten** (oder [kurzbefehl.html](https://lobi1994.github.io/Job-Tracker/kurzbefehl.html)). Aus der App geöffnet, stehen dort auch dein App-Link und dein Schlüssel zum Kopieren.

- **Job speichern** (aus Safari): speichert die komplette Stellenbeschreibung der offenen Seite, auch bei LinkedIn, wenn du in Safari eingeloggt bist. Script dazu: [kurzbefehle/job-speichern.js](kurzbefehle/job-speichern.js).
- **Job-Link speichern** (aus der LinkedIn-App und anderen Apps): legt den Job mit Link an; die Beschreibung holt der Job-Tracker selbst, wenn die Seite das zulässt.

Gibt es den Job schon (gleicher Link), wird die Anzeige dort angehängt, sonst wird ein neuer Job angelegt.

## 7. Gmail-Abgleich (optional)

Der Job-Tracker kann dein Gmail nach Rückmeldungen durchsuchen: **Absagen, Einladungen und Eingangsbestätigungen**. Eingangsbestätigungen setzen den Status direkt auf „Beworben“. Bei Absagen und Einladungen ändert er nichts selbst: Beim nächsten Öffnen der App fragt er nach, z. B. *„Mail von Firma X: Absage. Als ‚Abgelehnt‘ markieren?“*, und du tippst **Ja**, **Nein** oder **Später**.

1. In Apps Script links neben „Dateien“ auf **+ → Skript** und die neue Datei `Mail` nennen.
2. Den Inhalt von [google/Mail.gs](google/Mail.gs) hineinkopieren und speichern. (Falls du `Code.gs` aus einer älteren Version hast: auch diese neu kopieren.)
3. **Bereitstellen → Bereitstellungen verwalten → Stift → Version: Neue Version → Bereitstellen.** Sonst kennt die App die neuen Funktionen nicht.
4. Tabelle neu laden → **Job-Tracker → Gmail-Abgleich einrichten**. Google fragt einmal nach Zugriff auf Gmail (wieder: Erweitert → unsicher → Zulassen).
5. Fertig. Das Skript prüft alle 30 Minuten neue Mails und beim Einrichten einmal die letzten 30 Tage. Die Vorschläge stehen im Blatt **„Vorschläge“**.

**Wie wird erkannt?** Die Mail muss den Firmennamen aus deiner Liste enthalten (Absender, Betreff oder Text) und typische Formulierungen wie „leider … anderen Kandidaten“, „laden Sie zu einem Gespräch ein“ oder „Eingang Ihrer Bewerbung“, auf Deutsch und Englisch. Gibt es zwei Stellen bei derselben Firma, entscheidet der Stellentitel in der Mail. Ist das nicht eindeutig, kommt lieber kein Vorschlag als ein falscher.

**Ausschalten:** Job-Tracker → Gmail-Abgleich ausschalten. Deine Mails verlassen dein Google-Konto nicht.

## Häufige Fragen

**„Die Seite liefert keinen lesbaren Text“** – LinkedIn und manche Workday-Seiten lassen sich nicht über den Link abrufen. Nimm den Kurzbefehl in Safari oder **Text einfügen** in der App.

**Neue Statuswerte oder Spalten?** Die Statusliste steht oben in `Code.gs` (`STATUS`). Wenn du sie änderst, auch das Dropdown in der Tabelle anpassen.

**Dropdowns und Farben in der Tabelle** gelten für die Zeilen, für die sie eingerichtet sind. Neue Jobs aus der App landen in der ersten freien Zeile darunter.
