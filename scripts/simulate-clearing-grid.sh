#!/usr/bin/env bash
# ==============================================================================
# MISDESC National Clearing Grid Traffic Simulator (Bash)
# ==============================================================================
set -e

CYCLES=${1:-3}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo ">>> Launching MISDESC Clearing Grid Traffic Simulator ($CYCLES cycles)..."

node "$SCRIPT_DIR/simulate-clearing-grid.js" "$CYCLES"

if [ $? -eq 0 ]; then
  echo -e "\n>>> [SUCCESS] Interbank simulation completed successfully!"
  exit 0
else
  echo -e "\n>>> [ERROR] Simulation failed."
  exit 1
fi
