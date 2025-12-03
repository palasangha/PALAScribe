#!/usr/bin/env zsh
set -euo pipefail

# sync_with_main.sh
# Fetches origin, compares current branch with origin/main, and optionally updates local main and rebases current branch.
# Usage: ./scripts/sync_with_main.sh [--rebase]
#   --rebase : after pulling origin/main, attempt to rebase the current branch onto origin/main (safe if no local uncommitted changes)

REBASE=false
if [[ ${1:-} == "--rebase" ]]; then
  REBASE=true
fi

# Ensure we are in a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository." >&2
  exit 1
fi

# Show current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Check for local uncommitted changes
if ! git diff --quiet || ! git diff --staged --quiet; then
  echo "WARNING: You have uncommitted changes. Please stash or commit them before running automated sync operations."
  echo "Run: git status --porcelain" 
  git status --porcelain
  echo "Exiting."
  exit 2
fi

echo "Fetching origin..."
git fetch origin --prune

# Ensure origin/main exists
if ! git show-ref --verify --quiet refs/remotes/origin/main; then
  echo "origin/main not found. Fetching main branch explicitly..."
  git fetch origin main:refs/remotes/origin/main
fi

# Compare current branch to origin/main
echo "Comparing $CURRENT_BRANCH with origin/main..."
# Count commits ahead/behind
COUNTS=$(git rev-list --left-right --count origin/main...$CURRENT_BRANCH 2>/dev/null || true)
if [[ -z "$COUNTS" ]]; then
  echo "Unable to compare branches. Exiting.";
  exit 3
fi
AHEAD=$(echo $COUNTS | awk '{print $2}')
BEHIND=$(echo $COUNTS | awk '{print $1}')

if [[ "$AHEAD" -eq 0 && "$BEHIND" -eq 0 ]]; then
  echo "Good: $CURRENT_BRANCH is in sync with origin/main (no unique commits on either side)."
else
  echo "Status: $CURRENT_BRANCH is $AHEAD commit(s) ahead and $BEHIND commit(s) behind origin/main."
  if [[ $AHEAD -gt 0 ]]; then
    echo "Commits on $CURRENT_BRANCH not in origin/main (local/branch-only):"
    git --no-pager log --oneline origin/main..$CURRENT_BRANCH
  fi
  if [[ $BEHIND -gt 0 ]]; then
    echo "Commits on origin/main not in $CURRENT_BRANCH (remote-only):"
    git --no-pager log --oneline $CURRENT_BRANCH..origin/main
  fi
fi

# Show diff summary between working branch and origin/main
echo "\nDiff summary (files changed between $CURRENT_BRANCH and origin/main):"
git --no-pager diff --name-status --color=always origin/main...$CURRENT_BRANCH | sed -n '1,200p'

# Offer to update local main and rebase/merge behavior
echo "\nLocal 'main' branch status:"
if git show-ref --verify --quiet refs/heads/main; then
  LOCAL_MAIN_HASH=$(git rev-parse main)
  REMOTE_MAIN_HASH=$(git rev-parse origin/main)
  if [[ "$LOCAL_MAIN_HASH" = "$REMOTE_MAIN_HASH" ]]; then
    echo "Local main is up-to-date with origin/main."
  else
    echo "Local main differs from origin/main. You may want to run:'git checkout main; git pull'"
  fi
else
  echo "No local 'main' branch present. You can create it with: 'git checkout -b main origin/main'"
fi

# If requested, update local main and rebase current branch
if [[ "$REBASE" == true ]]; then
  echo "\n--rebase requested: attempting to update local main and rebase $CURRENT_BRANCH onto origin/main"
  # Ensure safe state again
  if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "Uncommitted changes detected. Aborting rebase."; exit 4
  fi

  # Update local main
  if git show-ref --verify --quiet refs/heads/main; then
    git checkout main
    git pull --ff-only origin main || {
      echo "Failed to fast-forward local main. Please resolve manually."; git checkout "$CURRENT_BRANCH"; exit 5
    }
  else
    git checkout -b main origin/main
  fi

  # Switch back and rebase
  git checkout "$CURRENT_BRANCH"
  echo "Rebasing $CURRENT_BRANCH onto origin/main..."
  if git rebase origin/main; then
    echo "Rebase successful. You can push with: git push --force-with-lease origin $CURRENT_BRANCH"
  else
    echo "Rebase failed / conflicts. Resolve conflicts and run 'git rebase --continue' or abort with 'git rebase --abort'.";
    exit 6
  fi
fi

# Final summary
echo "\nDone. Summary:"
if [[ "$AHEAD" -eq 0 && "$BEHIND" -eq 0 ]]; then
  echo "Branches are in sync with origin/main." 
else
  echo "$CURRENT_BRANCH is $AHEAD ahead / $BEHIND behind origin/main. Review the logs above."
fi

exit 0
