#!/bin/sh
# Richtet den stündlichen Lauf von ats-qwen.mjs auf dem Mac ein (launchd, nur für deinen Benutzer).
# Rückgängig machen: ./deinstallieren.sh
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
NODE="$(command -v node || true)"
[ -n "$NODE" ] || { echo "Node.js wurde nicht gefunden."; exit 1; }
[ -f "$HOME/.careerway/config.json" ] || { echo "Es fehlt ~/.careerway/config.json."; exit 1; }
PLIST="$HOME/Library/LaunchAgents/de.careerway.ats-qwen.plist"
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/.careerway"
sed -e "s|__NODE__|$NODE|" -e "s|__SCRIPT__|$DIR/ats-qwen.mjs|" -e "s|__HOME__|$HOME|g" "$DIR/de.careerway.ats-qwen.plist" > "$PLIST"
launchctl bootout "gui/$(id -u)/de.careerway.ats-qwen" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Eingerichtet: läuft jetzt und danach jede Stunde. Log: ~/.careerway/ats-qwen.log"
