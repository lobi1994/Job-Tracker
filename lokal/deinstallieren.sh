#!/bin/sh
# Entfernt den stündlichen Lauf wieder. config.json und Log in ~/.careerway bleiben liegen.
PLIST="$HOME/Library/LaunchAgents/de.careerway.ats-qwen.plist"
launchctl bootout "gui/$(id -u)/de.careerway.ats-qwen" 2>/dev/null || true
rm -f "$PLIST"
echo "Entfernt."
