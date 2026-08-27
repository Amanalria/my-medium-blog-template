#!/usr/bin/env bash
# Local Cron Runner for HiveCloud Daily Agentic AI Publisher
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] Running HiveCloud Daily Auto-Publisher..."
cd "$REPO_DIR"

# Pull latest changes first
git pull --rebase origin main || true

# Execute Python publisher
python3 "${SCRIPT_DIR}/daily_agentic_autopublisher.py"

echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] Done!"
