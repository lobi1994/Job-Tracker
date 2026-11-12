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

## 6. Kurzbefehl „Job speichern“ (iPhone / iPad)

Damit speicherst du eine Stellenanzeige direkt aus Safari: Anzeige öffnen → **Teilen → Job speichern**. Gibt es den Job schon (gleicher Link), wird die Anzeige dort angehängt. Sonst legt der Kurzbefehl einen neuen Job an, mit Firma, Stelle und Ort.

Das klappt auch bei LinkedIn, wenn du in Safari eingeloggt bist.

**Job-Tracker → App-Link anzeigen** zeigt dir **App-Link** und **Schlüssel**. Beides brauchst du hier.

Öffne die App **Kurzbefehle** → **+**:

1. Oben auf den Namen tippen → **Umbenennen** → `Job speichern`. Unter ⓘ **Im Share-Sheet anzeigen** einschalten und als Eingabe nur **Safari-Webseiten** erlauben.
2. Aktion **JavaScript auf Webseite ausführen** → Eingabe: **Kurzbefehleingabe**. Den Inhalt von [kurzbefehle/job-speichern.js](kurzbefehle/job-speichern.js) komplett hineinkopieren (vorhandenen Beispieltext vorher löschen).
3. Aktion **Inhalte von URL abrufen**:
   - URL: deinen **App-Link** einfügen
   - Methode: **POST**
   - Anfragetext: **JSON** mit drei Feldern:
     - `fn` (Text): `apiSavePosting`
     - `key` (Text): deinen **Schlüssel**
     - `data` (Wörterbuch): Variable **JavaScript-Ergebnis**
4. Aktion **Wörterbuchwert abrufen** → Schlüssel `result` aus **Inhalte der URL**.
5. Aktion **Wörterbuchwert abrufen** → Schlüssel `message` aus dem vorherigen **Wörterbuchwert**.
6. Aktion **Mitteilung anzeigen** → **Wörterbuchwert**.

Beim ersten Ausführen fragt Safari, ob der Kurzbefehl auf die Seite zugreifen darf: **Erlauben**.

Kommt keine Mitteilung, steht der Fehler in **Inhalte der URL** unter `error` (z. B. „Kein Zugriff“ bei falschem Schlüssel).

## Häufige Fragen

**„Die Seite liefert keinen lesbaren Text“** – LinkedIn und manche Workday-Seiten lassen sich nicht über den Link abrufen. Nimm den Kurzbefehl in Safari oder **Text einfügen** in der App.

**Neue Statuswerte oder Spalten?** Die Statusliste steht oben in `Code.gs` (`STATUS`). Wenn du sie änderst, auch das Dropdown in der Tabelle anpassen.

**Dropdowns und Farben in der Tabelle** gelten für die Zeilen, für die sie eingerichtet sind. Neue Jobs aus der App landen in der ersten freien Zeile darunter.
