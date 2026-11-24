# Lokale ATS-Vorbewertung (Ollama und Qwen3)

Ein kleines Programm für den Mac. Es holt neue Stellenanzeigen aus deinem Google Sheet, lässt Qwen3 sie gegen dein Profil prüfen und schreibt das Ergebnis in den Tab „ATS-Vergleich“. Dein Fit-Wert und der CV-Auftrag bleiben unverändert.

## Vorbereitung
1. Ollama installieren und das Modell laden: `ollama pull qwen3:8b`
2. Apps Script ab Version 1.6.48 bereitstellen (siehe `CHANGELOG.md`).
3. Die Datei `~/.careerway/config.json` anlegen. Sie liegt nur auf deinem Mac, nie im Repo:

```json
{
  "scriptUrl": "https://script.google.com/macros/s/…/exec",
  "key": "dein Schlüssel",
  "since": "JJJJ-MM-TT",
  "testIds": [],
  "model": "qwen3:8b",
  "limitPerRun": 5,
  "berufsjahre": 8,
  "hatNicht": ["Dinge, die du nicht kannst"]
}
```

- `scriptUrl`: die **Web-App-URL** aus Apps Script (Bereitstellen → Bereitstellungen verwalten, endet auf `/exec`). Nicht der App-Link.
- `since`: ab diesem Tag gespeicherte Anzeigen gelten als neu.
- `testIds`: IDs einzelner Anzeigen, die zusätzlich bewertet werden sollen.
- `berufsjahre`: deine Jahre Berufserfahrung. Ohne Angabe wird die Jahre-Regel übersprungen. Sonst zählt eine Anforderung wie „mind. 10 Jahre“ höchstens halb, wenn du weniger Jahre hast.
- `hatNicht`: Dinge, die Qwen immer als „fehlt“ einstufen soll.

## Ausprobieren
`node lokal/ats-qwen.mjs --dry` bewertet, schreibt aber nichts zurück. Das Ergebnis steht in `~/.careerway/ats-qwen.log`.

## Genauigkeit messen
Mit `lokal/ats-eval.mjs` siehst du, wie weit Qwen von Claudes Prozentwerten entfernt liegt. Das Skript schreibt nichts ins Sheet.

1. Lege die Datei `~/.careerway/eval-ref.json` an. Sie enthält die IDs gespeicherter Anzeigen und Claudes Prozentwert dazu:

```json
{ "ads": [ { "id": "beispiel-1", "claude": 76 }, { "id": "beispiel-2", "claude": 58 } ] }
```

2. Starte die Messung: `node lokal/ats-eval.mjs --model qwen3:8b`
3. Du bekommst eine Tabelle mit Qwen-Prozent, Claude-Prozent, Differenz, Anzahl der Anforderungen und Sekunden pro Anzeige, darunter die durchschnittliche Differenz und die durchschnittliche Abweichung.

So rechnet das Programm: Qwen zerlegt die Anzeige in Anforderungen und nennt je Anforderung Suchbegriffe. Ob die Begriffe im Profil stehen, prüft ein fester Rechenweg, den das Programm direkt aus `google/Code.gs` lädt. Das ist dieselbe Rechnung wie bei Claude und bei Apple.

Weitere Angaben: `--ids a,b` bewertet nur diese Anzeigen, `--label name` benennt den Lauf. Mit `--ohne-profil` bekommt Qwen das Profil nicht im Prompt und sieht nur die Anzeige. Jeder Lauf wird in `~/.careerway/eval-runs/` gespeichert. Einen anderen Pfad für die Referenzdatei setzt du mit `CAREERWAY_EVAL_REF`.

## Jede Stunde automatisch
Das Programm läuft mit `caffeinate`, damit der Mac nicht mitten im Lauf einschläft. Nach einer Änderung an der Startdatei `lokal/installieren.sh` erneut ausführen.

Einrichten: `lokal/installieren.sh`. Entfernen: `lokal/deinstallieren.sh`.
