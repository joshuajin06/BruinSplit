#!/usr/bin/env bash
# Simple wrapper to run the Node test and show output
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_SCRIPT="$ROOT_DIR/rideTesting/testJoinLeave.js"

if ! command -v node >/dev/null 2>&1; then
  echo "node not found in PATH"
  exit 2
fi

echo "Running join/leave ride integration test against ${API_URL:-http://localhost:8080}"
API_URL=${API_URL:-http://localhost:8080}
API_URL="$API_URL" node "$NODE_SCRIPT"
