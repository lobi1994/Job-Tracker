# Änderungsverzeichnis

Versionsnummern: **Haupt.Funktion.Korrektur** (z. B. 1.2.1). Es gibt **eine gemeinsame Nummer** für App und Apps Script: Jede Version bekommt die nächste Nummer, aber nur der Teil, der sich ändert, übernimmt sie. Ändert sich nur die App, bleibt das Skript auf seiner Nummer (und umgekehrt). Ändern sich beide, haben App und Skript wieder dieselbe Nummer – Nummern dazwischen werden dann übersprungen.

**Apps Script: Bereitstellen nötig?** Nur bei „ja“ musst du etwas tun:
1. Die genannten Dateien aus `google/` in Apps Script neu kopieren und speichern.
2. **Bereitstellen → Bereitstellungen verwalten → Stift → Version: Neue Version**, im Feld **Beschreibung** den Text aus „Beschreibung für die Bereitstellung“ eintragen → **Bereitstellen**.

Bei „nein“ kommt die Änderung automatisch über GitHub Pages. App einmal ganz schließen und zweimal neu öffnen.
Welche Version gerade läuft, steht in der App unter **Einstellungen (Zahnrad)**.

---

## 1.6.55 – 25.11.2026 (nur App) – Demo zeigt Ansprechperson und Gehalt
- Die Beispiel-Anzeige im Demo-Modus nennt jetzt eine erfundene Ansprechperson und eine erfundene Gehaltsspanne. So sieht man den Block auch ohne eigene Daten.
- Steht „Kontakt“ als Überschrift über der Ansprechperson, erscheint die Person nur noch einmal, mit E-Mail.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.54 – 24.11.2026 (nur App) – Weniger falsche Treffer bei der Ansprechperson
- Firmennamen (zum Beispiel „… GmbH“) und Überschriften (zum Beispiel „About Us“) werden nicht mehr als Person oder Rolle angezeigt.
- Namen werden nur noch erkannt, wenn sie mit Großbuchstaben beginnen.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.53 – 24.11.2026 (nur App) – Ansprechperson und Gehalt sauberer
- Das Gehalt steht jetzt nur noch als „Gehalt“ mit den Zahlen, zum Beispiel „90.000–105.000 USD“. Der lange Satz aus der Anzeige ist weg. Auch Angaben wie „90–105k USD“ werden erkannt.
- Die Ansprechperson wird jetzt auch gefunden, wenn sie mitten im Satz steht, zum Beispiel „Hiring contact: Name (Rolle)“.
- Die App liest zusätzlich deine Notizen. Steht dort ein LinkedIn-Link der Person, führt der Knopf direkt zum Profil.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.52 – 24.11.2026 (nur App) – Ansprechperson und Gehaltsspanne oben in der Anzeige
- In der Stellenausschreibung erscheint direkt unter den Skills ein neuer Block. Er zeigt die Ansprechperson (HR oder Hiring Manager) mit Rolle, E-Mail, Telefon und einem Knopf zum LinkedIn-Profil. Steht ein LinkedIn-Link im Anzeigentext, führt der Knopf direkt dorthin. Sonst öffnet er die LinkedIn-Suche mit Name und Firma.
- Eine genannte Gehaltsspanne wird groß und farbig hervorgehoben, mit dem Satz aus der Anzeige darunter.
- Gefunden wird nur, was wörtlich in der Anzeige steht. Gibt es nichts, erscheint der Block gar nicht.
- Das LinkedIn-Profil kann die App nicht automatisch holen, weil LinkedIn dafür eine Anmeldung verlangt.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.51 – 24.11.2026 (nur App) – LinkedIn-Stellen wieder in Safari
- LinkedIn-Anzeigen öffnen auf dem iPhone und iPad wieder in Safari statt in der LinkedIn-App.
- Grund: Nur in Safari funktioniert der Kurzbefehl „Job speichern“.
- Google-Drive-Links springen weiter in die Drive-App.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.50 – 19.11.2026 (nur App) – Mail-Hinweis erscheint schneller
- Der Hinweis „x neue Rückmeldungen per Mail“ erscheint jetzt sofort beim Öffnen der App. Er zeigt den Stand vom letzten Mal und wird danach aktualisiert.
- Die App fragt die Mail-Vorschläge gleichzeitig mit der Jobliste ab. Vorher kam die zweite Abfrage erst, wenn die erste fertig war.
- Das Fenster „Rückmeldung per Mail“ öffnet sich weiter automatisch, aber erst mit der frischen Antwort. So wird kein Vorschlag angenommen, der schon erledigt ist. Tippst du auf den Hinweis, bevor die frische Antwort da ist, wartet die App kurz darauf.
- Beim Trennen der Verbindung oder beim Wechsel auf ein anderes Konto wird der gemerkte Stand gelöscht.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.49 – 19.11.2026 (nur Apps Script) – ATS-Auswertung aktualisieren
- Neue Funktion `apiAtsRefresh`: Sie berechnet den Tab „ATS-Auswertung“ neu. Das braucht es, weil Claude seine Zeilen direkt in den Tab „ATS-Vergleich“ schreibt (er hat keinen Schlüssel). Das Mac-Programm ruft sie bei jedem Lauf auf, damit Claudes Prozentwerte in der Auswertung erscheinen.
- Sonst ändert sich nichts.

**Apps Script: Bereitstellen nötig: ja** (Code.gs)
Beschreibung für die Bereitstellung: `1.6.49 ATS-Auswertung aktualisieren`
**App und Kurzbefehl: nichts zu tun**

## 1.6.48 – 19.11.2026 (nur Apps Script) – ATS-Vergleich Qwen und Claude
- Neuer Tab „ATS-Vergleich“: Für jede Anzeige steht dort, wie ein lokales Modell (Qwen) und Claude sie bewerten, getrennt voneinander. Jede Anforderung hat ein Gewicht (Pflicht = 2, sonst 1), eine Einstufung (voll, teilweise, fehlt) und Punkte. Die Rechnung ist dieselbe wie bei der ATS-Bewertung: voll = 1, teilweise = 0,5.
- Die Reise steht in einer eigenen gelben Zeile und zählt nicht für den Wert. Anforderungen mit „Reise“ im Namen werden beim Speichern aussortiert.
- Neuer Tab „ATS-Auswertung“: pro Anzeige die Prozent von Qwen und Claude, die Differenz und die Reise. Rechts oben steht die durchschnittliche Abweichung. Das Skript rechnet das selbst, im Blatt sind keine Formeln.
- Dein Fit-Wert und der CV-Auftrag werden nicht verändert. Der Vergleich ist nur dafür da, dass du dich später entscheiden kannst.
- Neue Funktionen für den Mac und die Claude-Aufgabe: Bewertung speichern, offene Anzeigen holen, Profil holen. Offene Anzeigen gibt es nur mit einem Startdatum, damit nie versehentlich alle alten Anzeigen bewertet werden.
- Beide Tabs legt das Skript beim ersten Speichern selbst an.
- Neuer Ordner `lokal/`: Ein Programm für den Mac holt neue Anzeigen, lässt Qwen3 (über Ollama) sie gegen dein Profil prüfen und speichert das Ergebnis im Tab „ATS-Vergleich“. Es läuft stündlich über launchd, ist aber erst aktiv, wenn du `lokal/installieren.sh` ausführst. Link und Schlüssel stehen nur in `~/.careerway/config.json` auf deinem Mac. Das Programm lehnt jeden Link ab, der nicht die Web-App-URL aus Apps Script ist. Anleitung: `lokal/README.md`.

**Apps Script: Bereitstellen nötig: ja** (Code.gs)
Beschreibung für die Bereitstellung: `1.6.48 ATS-Vergleich Qwen und Claude`
**App und Kurzbefehl: nichts zu tun**

## 1.6.47 – 19.11.2026 (App und Apps Script) – ATS-Bewertung ohne Claude
- Neuer, optionaler Teil im Kurzbefehl „Job speichern“: Apple Intelligence („Modell verwenden“, Private Cloud Compute) liest die Anzeige und macht daraus eine Liste der Anforderungen.
- Das Apps Script rechnet daraus den ATS-Wert in Prozent und trägt ihn samt Kurzbegründung beim Job ein. Ein Begriff, den du nur als „Grundlagen“ kannst, zählt halb.
- Dein Profil für die Rechnung steht im neuen Tab „Profiltext“ (zusammen mit dem Tab „Profil“). Der Tab ist schon angelegt.
- In der App steht bei solchen Bewertungen „Apple-KI:“ statt „Claude:“. Bewertungen von Claude werden nie überschrieben.
- Kurzbefehl-Anleitung Abschnitt 4 vereinfacht: 5 einfache Textfelder statt eines Wörterbuchs.

**Apps Script: Bereitstellen nötig: ja** (Code.gs)
Beschreibung für die Bereitstellung: `1.6.47 ATS-Bewertung lokal mit Apple Intelligence`
**Kurzbefehl: ändern nötig: ja, optional** (Abschnitt 4 in der Kurzbefehl-Anleitung)

## 1.6.46 – 16.11.2026 (nur App)
- Links zu Google Drive (z. B. dein Lebenslauf) und Google-Tabellen öffnen auf dem iPhone direkt die Google-Drive-App statt erst Safari. Damit bleibt in Safari keine weiße Seite mehr zurück. Klappt der Direktsprung nicht, öffnet sich wie bisher Safari.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.45 – 16.11.2026 (nur App)
- **Mehrere Jobs auf einmal bearbeiten:** „Auswählen“ neben der Sortierung. Jobs antippen oder „ATS unter 40 %“ auf einmal auswählen, dann Status für alle ändern und eine gemeinsame Notiz anhängen.
- **LinkedIn-Links** öffnen auf dem iPhone direkt die LinkedIn-App statt erst Safari. Klappt das nicht, öffnet sich wie bisher Safari.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.44 – 16.11.2026 (App und Apps Script) – Skill-Lücken bearbeiten
- **Filter nach Erreichbarkeit** in Skill-Lücken: Leicht, Mittel, Schwer oder ohne Einstufung.
- **„Kann ich doch“** bei jedem Skill: „Hab ich“ oder „Grundlagen“ wählen, kurz notieren, wo du es gelernt oder genutzt hast, und ins Blatt „Profil“ übernehmen. Der Skill verschwindet dann aus „Fehlt“ bzw. wandert zu „Grundlagen“. Claude nutzt den Text für deine Lebensläufe.

**Apps Script: Bereitstellen nötig: ja** (Code.gs)
Beschreibung für die Bereitstellung: `1.6.44 Fähigkeiten aus der App ins Profil schreiben`

## 1.6.43 – 16.11.2026 (nur App)
- iPhone: Die Startseite lässt sich nicht mehr seitlich verschieben. Ursache war die Kopfzeile, die auf schmalen Geräten ein paar Pixel zu breit war.
- **ATS-Aufschlüsselung** in jedem Job mit gespeicherter Stellenausschreibung: „So setzt sich die Passung zusammen“ zeigt je Fähigkeit, ob sie Pflicht oder Wunsch ist, den Satz aus der Anzeige und wie viele Prozentpunkte sie bringt oder kostet. Pflicht zählt doppelt, Grundlagen halb.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.42 – 16.11.2026 (nur App) – Dubletten-Warnung
- Legst du über „+“ einen Job an, den es schon gibt (gleicher Link, gleiche Stellen-ID im Link oder gleiche Firma und Stelle), fragt die App nach. „Abbrechen“ öffnet den vorhandenen Job, „OK“ legt ihn trotzdem an.
- Beim Speichern über den Kurzbefehl prüft das Apps Script das schon länger selbst. Dort ändert sich nichts.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.41 – 15.11.2026 (nur App) – Nachfassen, Termine, Statistik, Gesprächsvorbereitung
- **Nachfassen:** Steht ein Job seit 10 Tagen auf „Beworben“, zeigt die Karte „Nachfassen“ und der Kalender-Knopf oben eine rote Zahl. Im Job gibt es den Knopf „Heute nachgefasst“. Er schreibt „Nachgefasst am …“ in die Notizen, danach zählen die 10 Tage neu.
- **Termine und Fristen** (Kalender-Knopf oben): anstehende Gespräche, fällige Nachfass-Aktionen, offene Rückmeldungen nach einem Gespräch, Angebote und alles, was noch auf Antwort wartet. Ein Tipp öffnet den Job.
- **Statistik** (in Termine und Fristen unten oder in den Einstellungen): Bewerbungen, Antwortquote, der Weg von der Bewerbung bis zum Angebot, Bewerbungen pro Woche, Wege und Portale im Vergleich.
- **Gesprächsvorbereitung:** Bei „Zum Gespräch eingeladen“ und „Persönliches Gespräch“ steht oben im Job der Knopf „Vorbereitung“ (sonst unter „Mehr“). Die Seite zeigt Termin, Eckdaten, was du für die Stelle mitbringst, wo du eine Antwort brauchst, und ein Feld für eigene Notizen und Fragen. Die Notizen stehen in der Tabelle in der Spalte Notizen unter „[Vorbereitung]“.
- Der Demo-Modus rechnet seine Datumsangaben auf heute um, damit Termine und Fristen dort immer sinnvoll aussehen.
- Auf dem iPhone ist oben kein Platz für fünf Knöpfe. Der Knopf „Skill-Lücken“ steht dort deshalb nur noch in den Einstellungen, auf iPad und Desktop bleibt er oben.
- Bei eingeladenen Jobs steht statt „Bewerben“ jetzt „Vorbereitung“ oben. Der Link zur Anzeige im Netz ist unter „Mehr“.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.40 – 15.11.2026 (nur App)
- Am Desktop (ab 1100 px Breite) steht die Liste in zwei Spalten.
- README neu geschrieben: Englisch als Hauptfassung (`README.md`), Deutsch in `README.de.md`, mit Architektur, Einrichtung und neuen Screenshots aus dem Demo-Modus.
- Demo-Modus: Beispielfirma umbenannt, alle Firmen dort sind erfunden.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.39 – 15.11.2026 (nur App)
- Nach „Neuen Schlüssel erzeugen“ reicht es, sich in der Home-Bildschirm-App einmal neu zu verbinden. Vorher hat die App bei jedem Start wieder den alten Schlüssel aus ihrem Startlink genommen und erneut nach der Verbindung gefragt.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.38 – 15.11.2026 (nur App) – Schneller Start
- **Start ohne Warten aufs Netz:** Antwortet das Netz nicht innerhalb von 0,7 s, startet die App sofort aus dem Gerät (vorher bis zu 4 s Wartezeit). Gibt es eine neuere Version, lädt die App sie im Hintergrund und wechselt automatisch, sobald kein Fenster offen ist und nichts mehr gespeichert wird. Bei schnellem Netz siehst du wie bisher immer direkt die neueste Version.
- Fällt GitHub Pages aus, startet die App trotzdem aus dem Gerät.
- **Diagnose** unten in den Einstellungen: App bedienbar nach … · Liste von Google … · letztes Speichern …
- Größere Tippflächen (Knöpfe oben 44 px, Filter 40 px, Suchfeld und Sortierung 44 px), Suchfeld auf dem iPhone nicht mehr abgeschnitten.
- Gerätespeicher: Stellenausschreibungen gelöschter Jobs werden entfernt; ist der Speicher voll, werden zwischengespeicherte Stellenausschreibungen verworfen statt die Liste nicht mehr zu sichern.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.37 – 15.11.2026 (nur App) – Sofort speichern
- **Speichern ohne Warten:** Änderungen an einem Job (Status, Datum, Gespräche, Bewertung, Notizen …) erscheinen sofort in der Liste, das Fenster schließt direkt. Gespeichert wird im Hintergrund; oben steht kurz „Speichert …“.
- **Ohne Netz geht nichts verloren:** Änderungen warten auf dem Gerät („Offline – 1 Änderung(en) warten“) und werden automatisch nachgeschickt, auch nach dem Schließen der App.
- Lehnt Google eine Änderung ab (z. B. Job wurde gelöscht), wird sie zurückgenommen und du bekommst eine Meldung.
- Ein Nachladen der Liste, das noch vor dem Speichern gestartet ist, überschreibt die neue Änderung nicht mehr.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.36 – 15.11.2026 (App und Apps Script) – Sicherheit
- **Schlüssel nicht mehr dauerhaft in der Adresszeile.** Im Browser wird der Teil `#setup=…` sofort nach dem Übernehmen entfernt, damit er nicht in Screenshots, im Verlauf oder im Teilen-Menü landet. Für „Zum Home-Bildschirm“ gibt es in den Einstellungen den Punkt **„Auf den Home-Bildschirm legen“** (blendet die Verbindung 3 Minuten ein). Bereits angelegte Home-Bildschirm-Apps laufen unverändert weiter.
- **Schutz beim Schreiben ins Sheet:** Text, der mit „=“ oder „+“ beginnt (z. B. ein Seitentitel oder ein Mail-Betreff), wird nicht mehr als Formel ausgeführt. Werte wie „10-12“ oder „17.11.2026 15:00“ bleiben Text und werden nicht mehr in ein Datum umgewandelt.
- Links werden nur noch geöffnet, wenn sie mit http(s) beginnen.
- Die Lebenslauf-Suche in Google Drive findet nur noch Dateien, die bei einem Job als „CV-Datei“ eingetragen sind.
- CHANGELOG: Beispiele mit Firmennamen entfernt.

**Apps Script: Bereitstellen nötig: ja** (Code.gs und Mail.gs)

Beschreibung für die Bereitstellung: `1.6.36 – Schutz vor Formeln, sichere Links`

## 1.6.35 – 14.11.2026 (App und Apps Script)
- **Neuer Bereich „Skill-Lücken“** (Zielscheiben-Symbol oben oder Einstellungen → Skill-Lücken): zählt über alle gespeicherten Stellenausschreibungen (ohne „Nicht bewerben“), welche Fähigkeiten gefordert sind, die laut Blatt „Profil“ fehlen.
  - Wichtigkeit: Pflichtanforderungen zählen doppelt, PM-, Produkt- und Testrollen 1,5-fach.
  - Pro Skill: in wie vielen Stellen gefordert, wie oft als Pflicht, und um wie viele Prozentpunkte deine Hard-Skill-Passung im Schnitt steigen würde.
  - „Beste Hebel“ ganz oben: oft gefordert und leicht oder mittel erreichbar.
  - Getrennt nach Hard Skills, Soft Skills und „Nur Grundlagen“ (Skills mit Hinweis „teilweise“ im Profil).
  - Lernkarten aus dem neuen Blatt **„Lernplan“**: Erreichbarkeit, ob Grundlagen reichen oder ein Zertifikat nötig ist, Lernweg, Dauer, Kosten, Link und Formulierung für den Lebenslauf.
- Skill-Erkennung genauer: „can“ im englischen Text zählt nicht mehr als CAN-Bus, „Budget“ aus Benefits und „AI“ aus Firmenbeschreibungen werden nicht mehr gezählt. Neu erkannt: Budgetverantwortung, Projektkalkulation, PM-Zertifikate, Vertragsmanagement, ERP, Power BI, CI/CD, KI, Photovoltaik/Speicher, BIM, Key Account, Business Development, Regulatorik Medizinprodukte.
- Apps Script: neue Funktion `apiSkillData`, Profil liefert jetzt auch den Hinweis (z. B. „teilweise“).

**Apps Script: Bereitstellen nötig: ja** (Code.gs)

Beschreibung für die Bereitstellung: `1.6.35 – Skill-Lücken und Lernplan`

## 1.6.34 – 14.11.2026 (App und Apps Script)
- **CV-Passung in Prozent statt Sternen.** Claude bewertet Lebensläufe jetzt wie ein Bewerbermanagement-System (ATS): Anforderungen der Stellenausschreibung (Pflicht doppelt gewichtet) gegen die Begriffe im Lebenslauf. Ergebnis in %.
- Filter heißen jetzt **CV 90 %+** (früher CV 4+) und **CV 70 %+** (früher CV 3+).
- Karten zeigen „CV 83 %“, in der Detailansicht steht ein Zahlenfeld (0–100) statt Sternen.
- Alte Sternwerte werden automatisch umgerechnet: 1 → 30 %, 2 → 50 %, 3 → 70 %, 4 → 90 %, 5 → 95 %.
- Apps Script: Spalte darf „CV passt (%)“ heißen und nimmt Werte von 0 bis 100 an.

**Apps Script: Bereitstellen nötig: ja** (Code.gs; falls 1.6.29 noch nicht bereitgestellt: auch Mail.gs)

Beschreibung für die Bereitstellung: `1.6.34 – CV-Passung in Prozent (ATS-Bewertung)`

## 1.6.33 – 13.11.2026 (nur App)
- Einstellungen: Icons und Texte der Menüpunkte stehen jetzt bündig links.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.32 – 13.11.2026 (nur App)
- **Neues Design „Nacht & Mint“** passend zum Kompass-Icon: fast schwarzer Hintergrund, feine Linien, Mint als einzige Akzentfarbe. Aufbau und Funktionen bleiben gleich.
- **Linien-Icons statt Emojis** in den Einstellungen, auf den Karten (Stellenausschreibung gespeichert, Lebenslauf vorhanden, Gesprächstermin) und beim Löschen.
- **Karten ruhiger:** Status als farbiger Punkt mit Text statt bunter Rand; Bewertungen als Zahl („♥ 4/5“, „CV 4/5“) statt Punkten.
- Filter als dezente Umrandungen, Eingabefelder mit Mint-Fokus, Kopfleiste leicht durchscheinend, Fenster gleiten sanft auf.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.31 – 13.11.2026 (nur App)
- **Gliederung englischer Stellenausschreibungen verbessert:** Erkannt werden jetzt auch Überschriften wie „Main Responsibilities“, „… Related Duties“, „Prerequisites“, „Essential / Desirable“, „You should apply if“, „Your day-to-day“, „What you'll be working on“, „Attractive work conditions“, „What's in it for you“ und „The interview process“ – auch mit Emoji oder „#“ davor, Leerzeichen vor dem Doppelpunkt oder typografischem Apostroph.
- Deutsch zusätzlich: „Diese Herausforderungen erwarten Sie“, „Damit begeistern Sie uns“, „Das zeichnet dich aus“, „Was du mitbringst“.
- Ganze Sätze (mehr als 7 Wörter oder mit Punkt am Ende) werden nicht mehr fälschlich als Überschrift erkannt.
- Kommt ein Abschnitt doppelt vor (z. B. zweimal „Aufgaben“), zeigt die Sprungleiste oben den Originaltitel statt zweimal denselben Namen.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.30 – 13.11.2026 (nur App)
- Englischer Modus: Abschnitte der Stellenausschreibung (z. B. „Introduction“, „We offer“) und die erkannten Skills (z. B. „Networking“, „Customer focus“) werden ebenfalls englisch angezeigt; kürzerer Übersetzungs-Hinweis.

**Apps Script: Bereitstellen nötig: nein** (für die Übersetzung selbst ist die Bereitstellung aus 1.6.29 nötig)

## 1.6.29 – 13.11.2026 (App und Apps Script)
- **Sprache Deutsch / Englisch:** In den Einstellungen gibt es oben den Umschalter „Sprache / Language“. Im englischen Modus sind alle Knöpfe, Überschriften, Hinweise und Meldungen englisch (z. B. „Job posting“, „Résumé“, „Apply ↗“). Deine eigenen Einträge (Firma, Stelle, Notizen) und die Werte in der Tabelle (z. B. Status) bleiben unverändert.
- **Stellenausschreibungen auf Englisch:** Im englischen Modus wird eine deutsche Stellenausschreibung beim Öffnen automatisch mit Google Übersetzer übersetzt. Oben steht ein Hinweis, dass es eine maschinelle Übersetzung ist und Fehler enthalten kann. Die Übersetzung wird in der Tabelle (Blatt „Anzeigen“, Spalten H und I) und auf dem Gerät gespeichert, damit jede Ausschreibung nur einmal übersetzt wird. Englische Ausschreibungen bleiben, wie sie sind. Im deutschen Modus ändert sich nichts.

**Apps Script: Bereitstellen nötig: ja** (`google/Code.gs`; enthält auch 1.6.23 und 1.6.25). Beim ersten Ausführen fragt Google evtl. nach einer zusätzlichen Berechtigung für den Übersetzer – bestätigen.

Beschreibung für die Bereitstellung: `1.6.29 – Careerway: Englisch-Übersetzung der Stellenausschreibungen, Anzeigen aufräumen`

## 1.6.28 – 13.11.2026 (nur App)
- Gespräche: Das Notizfeld ist jetzt so breit wie die ganze Zeile.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.27 – 13.11.2026 (nur App)
- **Job-Ansicht neu geordnet:** Direkt unter Firma und Stelle stehen drei große Knöpfe mit neuen Symbolen: **Stellenausschreibung** (Dokument), **Lebenslauf** (Ausweis-Symbol) und **Bewerben ↗** (Papierflieger; bei offenen Jobs grün hervorgehoben). Der frühere Kasten „Unterlagen“ unten entfällt.
- Selten Genutztes steht eingeklappt ganz unten unter **„Mehr“**: Stellenausschreibung vom Link speichern, Text einfügen, löschen sowie Firma, Stelle, Ort, Link und Lebenslauf-Datei ändern.
- **Begriffe:** „Anzeige“ heißt in der App jetzt überall „Stellenausschreibung“, „CV“ in der Job-Ansicht „Lebenslauf“ (z. B. „Lebenslauf passt“, „Lebenslauf mit Claude erstellen“). Die kurzen Filter „CV 4+ / CV 3+“ bleiben.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.26 – 13.11.2026 (nur App)
- **Neues App-Icon: Kompass in Nacht und Mint** (dunkler Hintergrund, mintgrüne Nadel nach rechts oben). Ersetzt das Weg-Logo aus 1.6.25 – oben in der App, auf dem Einrichtungs-Bildschirm und auf dem Home-Bildschirm.
- Für das neue Home-Bildschirm-Icon: App-Symbol löschen und in Safari neu „Zum Home-Bildschirm“ hinzufügen.

**Apps Script: Bereitstellen nötig: nein** (die Bereitstellung aus 1.6.25 bleibt nötig, falls noch nicht erledigt)

## 1.6.25 – 13.11.2026 (App und Apps Script)
- **Neuer Name: Careerway.** Die App, der Startbildschirm-Name, das Menü in der Tabelle („Careerway“ statt „Job-Tracker“), Meldungen und Anleitungen heißen jetzt so. Die Internetadresse der App bleibt gleich (`lobi1994.github.io/Job-Tracker/`), damit bestehende Links und der Kurzbefehl weiter funktionieren.
- **Neues Logo und App-Icon:** ein Weg mit Zwischenstation, der an einer gelben Zielmarke endet. Es steht oben neben dem Namen, auf dem Einrichtungs-Bildschirm und als Icon auf dem Home-Bildschirm.
- Damit das neue Icon auf dem Home-Bildschirm erscheint: App-Symbol löschen und die Seite in Safari neu über Teilen → „Zum Home-Bildschirm“ hinzufügen (iOS übernimmt neue Icons sonst nicht).

**Apps Script: Bereitstellen nötig: ja** (`google/Code.gs` und `google/Mail.gs`; enthält auch die Änderungen aus 1.6.23)

Beschreibung für die Bereitstellung: `1.6.25 – Careerway: neuer Name, Anzeigen einheitlich aufbereiten, Menü „Gespeicherte Anzeigen aufräumen“`

## 1.6.24 – 13.11.2026 (nur App)
- **Filterleiste neu sortiert:** Die Status-Filter (Offen, Beworben, Gespräch, Vor Ort …) stehen jetzt vorne und sind sofort sichtbar. „Alle aus/an“ und die CV-Filter „CV 4+“ und „CV 3+“ folgen rechts dahinter, durch einen feinen Strich getrennt.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.23 – 13.11.2026 (App und Apps Script)
- **Gespeicherte Anzeigen werden einheitlich aufbereitet** (App und Skript nutzen dieselbe Regel):
  - HTML wird zu Text, Sonderzeichen wie `&uuml;` werden zu „ü“.
  - Aufzählungen erscheinen einheitlich als „- “.
  - Navigation, Cookie-Hinweise, „Apply now“, Fußzeilen und angehängte Bewerbungsformulare werden entfernt.
  - Fließtext ohne Zeilenumbrüche wird an Überschriften wie „Ihre Aufgaben:“ oder „Requirements:“ getrennt.
  - Leere Überschriften am Ende fallen weg.
- Das gilt beim Speichern neuer Anzeigen und beim Öffnen bereits gespeicherter Anzeigen.
- Neuer Menüpunkt **Job-Tracker → Gespeicherte Anzeigen aufräumen**: bereitet alle vorhandenen Anzeigen im Blatt „Anzeigen“ einmal neu auf.
- Greenhouse-Anzeigen, die über eine Firmen-Karriereseite eingebettet sind, werden jetzt auch über den EU-Server von Greenhouse gesucht.

**Apps Script: Bereitstellen nötig: ja** (`google/Code.gs`)

Beschreibung für die Bereitstellung: `1.6.23 – Anzeigen einheitlich aufbereiten, Menü „Gespeicherte Anzeigen aufräumen“, Greenhouse EU`

## 1.6.22 – 13.11.2026 (nur App)
- **Mehrere Gespräche pro Job:** Statt eines einzelnen Felds „Gespräch am“ gibt es jetzt den Bereich „Gespräche“. Mit „＋ Gespräch hinzufügen“ legst du beliebig viele Termine an, jeweils mit Datum/Uhrzeit, Art (Telefon, Video, Persönlich (vor Ort), Assessment Center, Sonstiges) und optionaler Notiz. ✕ entfernt einen Termin. Beim Speichern werden die Termine nach Datum sortiert.
- In der Liste zeigt die Karte alle Termine kurz an, z. B. „📅 📞 12.11. 16:30 | 🤝 19.11. 09:00“.
- In der Tabelle steht weiterhin alles in der Spalte „Gespräch am“, ein Termin pro Zeile („TT.MM.JJJJ HH:MM · Art · Notiz“). Bisherige Einträge werden automatisch übernommen.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.21 – 13.11.2026 (nur App)
- **„Beworben am“ füllt sich automatisch:** Stellst du im Job den Status von „Noch nicht beworben“ auf „Beworben“ (oder einen späteren Status), trägt die App das heutige Datum ein, sofern noch keins drinsteht. Das Datum bleibt änderbar. Bei „Nicht bewerben“ passiert nichts.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.20 – 13.11.2026 (nur App)
- **„Unterlagen“ im Job neu sortiert und zentriert:** oben „📖 Gespeicherte Anzeige lesen“ und „📄 CV öffnen“ nebeneinander, darunter Speicherdatum und CV-Dateiname, dann „🌐 Bewerben ↗“ (öffnet die Anzeige online). Unten unter „Anzeige verwalten“: „Vom Link speichern“, „Text einfügen“ und „🗑 Löschen“ als gleich breite Knöpfe.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.19 – 13.11.2026 (nur App)
- **Nach „Mails jetzt prüfen“ lädt die Liste automatisch neu** – automatisch erkannte Bewerbungsbestätigungen sind sofort sichtbar, neue Rückmeldungen werden direkt angezeigt.
- **Automatisches Aktualisieren:** Kommst du nach mindestens 1 Minute in die App zurück, oder ist sie offen, lädt sie alle 3 Minuten still neu. So erscheinen Änderungen von Claude (Bewertungen, fertige CVs) und vom Gmail-Abgleich ohne „Neu laden“. Ist gerade ein Job oder eine Anzeige geöffnet, wird nicht neu geladen, damit nichts dazwischenfunkt.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.18 – 13.11.2026 (nur App)
- **Klarere Symbole in der Liste:** 📋 hinter der Stelle = Stellenanzeige gespeichert. 📄 hinter der CV-Bewertung = zugeschnittener CV vorhanden.
- **Filter „CV 4+“ und „CV 3+“** in der Chip-Leiste: zeigt nur Jobs mit entsprechender Claude-Bewertung (nochmal tippen = aus). Wird mit den anderen Filtern gespeichert.
- **Sortierung nach Bewerbungsdatum:** „Beworben: neueste“ und neu „Beworben: älteste“ (Jobs ohne Datum stehen am Ende) – praktisch zum Nachfassen.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.17 – 12.11.2026 (nur App)
- **Automatischer Rundgang für Demo-Videos:** `lobi1994.github.io/Job-Tracker/#tour` spielt die App mit Beispieldaten selbst ab (ca. 50 Sekunden): Liste, Filter, Sortierung, Job öffnen, Bewertung, Claudes Einschätzung, gespeicherte Anzeige mit Skills, CV anfordern, Status ändern, Gmail-Rückmeldung. Kurze Texte unten erklären jeden Schritt. Keine echten Bewerbungen, nichts wird gespeichert.
- Demo hat jetzt 10 Beispiel-Jobs (inkl. „Nicht bewerben“).

**Apps Script: Bereitstellen nötig: nein**

## 1.6.16 – 12.11.2026 (nur App)
- **Weniger „Laden fehlgeschlagen“:** Google antwortet manchmal beim ersten Mal nicht (z. B. wenn das Skript gerade „aufwacht“). Lesende Abrufe (Liste, gespeicherte Anzeige, Vorschläge, CV-Link) versucht die App jetzt automatisch bis zu 3-mal. Schreibende Aktionen werden nicht wiederholt, damit nichts doppelt passiert.
- **Gespeicherte Anzeigen öffnen sofort:** Einmal geöffnete Anzeigen merkt sich das Gerät. Beim nächsten Mal erscheinen sie sofort und werden im Hintergrund aktualisiert; klappt das Laden nicht, bleibt die gespeicherte Kopie stehen.
- Klarere Fehlermeldung bei Verbindungsproblemen („Google hat nicht geantwortet … bitte nochmal versuchen“ statt Hinweis auf falsche Einrichtung). Zeitlimit 45 Sekunden.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.15 – 12.11.2026 (nur Apps Script)
- **SmartRecruiters** und **Personio** werden jetzt über deren öffentliche Schnittstellen abgerufen. Bei Personio wird die Sprache genommen, in der die Anzeige vorliegt.
- Enthält 1.6.12 und 1.6.13.

**Apps Script: Bereitstellen nötig: ja** – nur `Code.gs` neu kopieren
**Beschreibung für die Bereitstellung:** `1.6.15 – SmartRecruiters und Personio`

## 1.6.14 – 12.11.2026 (nur App)
- „Anzeige vom Link speichern“ und „Text einfügen“ fragen jetzt zuverlässig „ersetzen?“, wenn schon eine Anzeige gespeichert ist. Ob eine da ist, entscheidet jetzt die Tabelle und nicht mehr der zwischengespeicherte Stand in der App (der konnte veraltet sein, dann kam keine Frage).
- Ist der Text gleich, kommt keine Frage, nur „unverändert“.

**Apps Script: Bereitstellen nötig: nein** (braucht Skript ab 1.6.5)

## 1.6.13 – 12.11.2026 (nur Apps Script)
- **Sauberere Anzeigen von Karriereseiten** (z. B. SAP SuccessFactors): Statt der ganzen Seite wird nur noch die Anzeige gespeichert, mit Titel, Datum, Ort und Firma oben. Cookie-Hinweise, Sprach- und Regionsauswahl, Suche, Menüs, Login-Links und Fußzeile fallen weg.
- Seiten ohne erkennbare Anzeige: Es wird der Hauptbereich der Seite genommen, und nur eindeutige Bereiche (Cookie-Banner, Navigation, Kopf- und Fußzeile, Suche, Sprachauswahl, Formulare) werden entfernt. Im Zweifel bleibt Text drin.
- Enthält 1.6.12 (Fehlende Anzeigen holen). 1.6.12 musst du nicht extra bereitstellen.

**Apps Script: Bereitstellen nötig: ja** – nur `Code.gs` neu kopieren
**Beschreibung für die Bereitstellung:** `1.6.13 – Fehlende Anzeigen holen, saubere Anzeigentexte`

## 1.6.12 – 12.11.2026
- **Fehlende Anzeigen holen:** Neuer Knopf im Zahnrad (und im Tabellen-Menü **Job-Tracker → Fehlende Anzeigen holen**). Holt für alle Jobs mit Link, aber ohne gespeicherte Anzeige, den Text über den Link. Bis 25 pro Durchgang in der App, 40 im Menü. Danach steht da, was nicht geklappt hat.
- Mehr Portale werden direkt erkannt: LinkedIn, Greenhouse (auch `job-boards.eu.greenhouse.io`), Lever und Ashby über deren öffentliche Schnittstellen. Bei anderen Seiten wird die strukturierte Anzeige genutzt; reine Startseiten oder Cookie-Hinweise werden nicht mehr als Anzeige gespeichert.
- Gilt auch für „Anzeige vom Link speichern“ und den Kurzbefehl „Job-Link speichern“.

**Apps Script: Bereitstellen nötig: ja** – nur `Code.gs` neu kopieren
**Beschreibung für die Bereitstellung:** `1.6.12 – Fehlende Anzeigen holen, mehr Portale`

## 1.6.11 – 12.11.2026 (nur Apps Script)
- Wird eine Anzeige zu einem bestehenden Job ohne Link gespeichert, übernimmt der Job jetzt den Link der Anzeige. Ein vorhandener Link wird nie überschrieben.

**Apps Script: Bereitstellen nötig: ja** – nur `Code.gs` neu kopieren
**Beschreibung für die Bereitstellung:** `1.6.11 – Link bei bestehendem Job übernehmen`

## 1.6.10 – 12.11.2026 (nur App)
- **Updates kommen sofort:** Die App lädt sich beim Öffnen zuerst frisch aus dem Netz und nimmt die gespeicherte Kopie nur noch, wenn du offline bist. Vorher konnte eine ältere Version aus dem Zwischenspeicher wieder auftauchen.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.9 – 12.11.2026 (nur App)
- Gespeicherte Anzeige: **„📖 Gespeicherte Anzeige lesen“** und **„🗑 Anzeige löschen“** sind jetzt Knöpfe statt Textlinks.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.8 – 12.11.2026 (nur App)
- Im Job unter „Unterlagen“: **„🌐 Anzeige online öffnen“** ist jetzt ein Knopf neben **„📄 CV öffnen“** (öffnet in Safari).

**Apps Script: Bereitstellen nötig: nein**

## 1.6.7 – 12.11.2026 (nur App)
- **Einstellungen (Zahnrad) neu:** Statt Textlinks große Knöpfe mit kurzer Erklärung: Tabelle öffnen, Kurzbefehle einrichten, Änderungen, Mails jetzt prüfen, Anders verbinden, Verbindung trennen.
- Die Knöpfe öffnen die Seiten direkt in Safari (vorher klappte der Link zur Kurzbefehl-Seite oft erst beim zweiten Mal).
- Kein falsches „Apps Script alt – bitte aktualisieren“ mehr nach dem Zurückkehren in die App: Die Skript-Version wird jetzt mit der Liste zwischengespeichert. Solange sie noch nicht geladen ist, steht dort „wird geprüft …“.

**Apps Script: Bereitstellen nötig: nein**

## 1.6.6 – 12.11.2026 (nur Apps Script)
- Die Antwort an den Kurzbefehl enthält `message` jetzt direkt (nicht nur in `result`). Dadurch braucht der Kurzbefehl nur noch **eine** Aktion „Wörterbuchwert abrufen“ mit Schlüssel `message`. Fehler kommen ebenfalls als lesbare `message`.

**Apps Script: Bereitstellen nötig: ja** – nur `Code.gs` neu kopieren
**Beschreibung für die Bereitstellung:** `1.6.6 – Kurzbefehl liest message direkt`

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
- Korrektur: „Job speichern“ erkennt einen Job jetzt auch, wenn die Anzeige unter einem **anderen Link** gespeichert wird (z. B. Karriereseite der Firma statt Bewerbungsportal). Erkannt wird über die Stellen-ID im Link oder gleiche Firma + Stelle. Vorher entstand ein doppelter Job.

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
