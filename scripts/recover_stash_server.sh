#!/usr/bin/env zsh
set -euo pipefail

# Recover palascribe_server.py from the latest stash into a new branch
# Usage: ./scripts/recover_stash_server.sh

# Ensure we're inside a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: must be run from inside the git repository root" >&2
  exit 1
fi

# Show stash list
echo "Stashes available:"
git stash list

echo "\nCreating recovery branch 'recover-stash-changes'..."
if git show-ref --verify --quiet refs/heads/recover-stash-changes; then
  echo "Branch 'recover-stash-changes' already exists. Checking it out..."
  git checkout recover-stash-changes
else
  git checkout -b recover-stash-changes
fi

# Attempt to restore only palascribe_server.py from the latest stash
echo "\nRestoring 'palascribe_server.py' from stash@{0}..."
if git rev-parse --verify --quiet "stash@{0}"; then
  git checkout stash@{0} -- palascribe_server.py
  echo "Stashed file restored into working tree."
else
  echo "No stash@{0} found. Use 'git stash list' to see available stashes." >&2
  exit 2
fi

# Commit and push
echo "\nCommitting recovered file..."
git add palascribe_server.py
if git diff --cached --quiet; then
  echo "Nothing to commit (file unchanged)" 
else
  git commit -m "Recover palascribe_server.py from stash"
fi

echo "Pushing branch to origin..."
git push -u origin recover-stash-changes

echo "\nDone. Review branch 'recover-stash-changes' on origin and open a PR if desired."