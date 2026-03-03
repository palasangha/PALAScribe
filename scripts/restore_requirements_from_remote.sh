#!/usr/bin/env bash
set -euo pipefail

# Restore requirements.txt from remote origin/main (safe flow)
# Usage: ./scripts/restore_requirements_from_remote.sh [--branch BRANCH] [--push]
# This will:
#  - fetch origin
#  - create a new branch (default: feat/restore-requirements)
#  - copy the remote's requirements.txt into the working tree
#  - commit and optionally push the branch

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REQ_FILE="$ROOT_DIR/requirements.txt"
BRANCH="feat/restore-requirements"
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

echo "Fetching origin..."
git fetch origin --quiet

echo "Creating and switching to branch: $BRANCH"
git checkout -b "$BRANCH"

# Restore remote file into working tree
echo "Checking out requirements.txt from origin/main"
if git show origin/main:requirements.txt > "$REQ_FILE" 2>/dev/null; then
  echo "Restored requirements.txt from origin/main"
  git add "$REQ_FILE"
  git commit -m "Restore requirements.txt from origin/main"
  if [[ "$PUSH" = true ]]; then
    git push -u origin "$BRANCH"
    echo "Pushed $BRANCH to origin"
  else
    echo "Created branch $BRANCH with restored requirements.txt. Run 'git push -u origin $BRANCH' to push."
  fi
else
  echo "No requirements.txt found at origin/main (or git cannot access remote file)." >&2
  echo "You can manually copy or create the desired requirements.txt and commit to a branch." >&2
  exit 2
fi

exit 0
