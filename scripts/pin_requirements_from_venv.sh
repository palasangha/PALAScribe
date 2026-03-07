#!/usr/bin/env bash
set -euo pipefail

# Pin installed packages from the project's whisper-env into requirements.txt
# Usage: ./scripts/pin_requirements_from_venv.sh [--push] [--branch BRANCH]
# Examples:
#   ./scripts/pin_requirements_from_venv.sh            # update requirements.txt locally
#   ./scripts/pin_requirements_from_venv.sh --branch feat/pin-reqs --push

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REQ_FILE="$ROOT_DIR/requirements.txt"
VENV_DIR="$ROOT_DIR/whisper-env"
BRANCH="feat/pin-requirements"
PUSH=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --push) PUSH=true; shift ;;
    --branch) BRANCH="$2"; shift 2 ;;
    -b) BRANCH="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 [--push] [--branch BRANCH]"; exit 0 ;;
    *) echo "Unknown arg: $1"; echo "Usage: $0 [--push] [--branch BRANCH]"; exit 1 ;;
  esac
done

if [[ ! -d "$VENV_DIR" ]]; then
  echo "Virtualenv not found at $VENV_DIR"
  echo "If your venv is elsewhere, set VENV_DIR in the script or run 'python3 -m venv whisper-env' first."
  exit 2
fi

# Use the venv's pip to freeze
PIP_BIN="$VENV_DIR/bin/pip"
PY_BIN="$VENV_DIR/bin/python"

if [[ ! -x "$PIP_BIN" ]]; then
  echo "Pip not found in $VENV_DIR/bin. Try creating the venv with: python3 -m venv whisper-env" >&2
  exit 3
fi

echo "Generating pinned requirements from venv at: $VENV_DIR"
"$PIP_BIN" freeze > "$REQ_FILE".tmp

# Add a small header with timestamp
awk 'NR==1{print "# Pinned requirements generated from whisper-env (run scripts/pin_requirements_from_venv.sh)"; print "# Generated: " strftime("%Y-%m-%d %T"); print ""} {print}' "$REQ_FILE".tmp > "$REQ_FILE"
rm -f "$REQ_FILE".tmp

echo "Wrote $REQ_FILE"

echo "If you want to commit the pinned requirements, run:" 
if [[ "$PUSH" = true ]]; then
  echo "  git checkout -b $BRANCH"
  echo "  git add requirements.txt"
  echo "  git commit -m \"Pin dependencies via venv freeze\""
  echo "  git push -u origin $BRANCH"
  echo "(Script will now create branch and push)"
  git checkout -b "$BRANCH"
  git add requirements.txt
  git commit -m "Pin dependencies via venv freeze"
  git push -u origin "$BRANCH"
else
  echo "  git add requirements.txt && git commit -m 'Pin dependencies via venv freeze'"
  echo "Or run: ./scripts/pin_requirements_from_venv.sh --branch BRANCH --push to create a branch and push automatically"
fi

exit 0
