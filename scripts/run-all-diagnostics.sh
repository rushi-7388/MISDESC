#!/usr/bin/env bash
# ==============================================================================
# MISDESC Master System Diagnostic Runner (Bash)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo ">>> Launching MISDESC Master System Diagnostic Suite..."

node "$SCRIPT_DIR/run-all-diagnostics.js"

if [ $? -eq 0 ]; then
  echo -e "\n>>> [SUCCESS] All MISDESC diagnostics passed cleanly!"
  exit 0
else
  echo -e "\n>>> [ERROR] Diagnostic suite detected failures."
  exit 1
fi
