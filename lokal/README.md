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
  "hatNicht": ["Dinge, die du nicht kannst"]
}
```

- `scriptUrl`: die **Web-App-URL** aus Apps Script (Bereitstellen → Bereitstellungen verwalten, endet auf `/exec`). Nicht der App-Link.
- `since`: ab diesem Tag gespeicherte Anzeigen gelten als neu.
- `testIds`: IDs einzelner Anzeigen, die zusätzlich bewertet werden sollen.
- `hatNicht`: Dinge, die Qwen immer als „fehlt“ einstufen soll.

## Ausprobieren
`node lokal/ats-qwen.mjs --dry` bewertet, schreibt aber nichts zurück. Das Ergebnis steht in `~/.careerway/ats-qwen.log`.

## Jede Stunde automatisch
Einrichten: `lokal/installieren.sh`. Entfernen: `lokal/deinstallieren.sh`.
