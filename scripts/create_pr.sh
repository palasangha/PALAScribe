#!/usr/bin/env zsh
set -euo pipefail

# Usage: ./scripts/create_pr.sh [branch] [commit-message] [pr-title]
# Example: ./scripts/create_pr.sh feat/dashboard-compact "WIP: UI changes" "Compact dashboard and header improvements"

BRANCH=${1:-feat/dashboard-compact}
COMMIT_MSG=${2:-"UI: Compact dashboard & header — remove Quick Actions, relocate actions, enlarge banner"}
PR_TITLE=${3:-"Compact dashboard and header improvements"}

read -r -d '' PR_BODY <<'EOF'
Compact dashboard and header improvements

Summary
- Removed the "Quick Actions" section and relocated the primary actions into the Recent Projects toolbar.
- Increased header/banner height and scaled up the logo/title for better visual balance.
- Removed redundant headings and deduped the "Recent Projects" title.
- Renamed "Manage Dictionary" → "Manage Pali Dictionary" and ensured the label is visible in-page.
- Made link styling explicit in page content so the Manage link shows icon + text (not icon-only).

Files changed:
- index-server.html
- css/styles.css
EOF

# Ensure we're inside a git repository
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: this script must be run from inside a git repository." >&2
  exit 1
fi

# Stage all changes
git add -A

# Commit if there are staged changes
if git diff --cached --quiet; then
  echo "No staged changes to commit. Proceeding with branch creation and push." 
else
  git commit -m "$COMMIT_MSG"
fi

# Create or switch to branch
if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  echo "Switching to existing branch '$BRANCH'"
  git checkout "$BRANCH"
else
  echo "Creating and switching to branch '$BRANCH'"
  git checkout -b "$BRANCH"
fi

# Push branch to origin
git push -u origin "$BRANCH"

# Create PR using GitHub CLI if available
if command -v gh >/dev/null 2>&1; then
  echo "Creating PR with GitHub CLI..."
  gh pr create --title "$PR_TITLE" --body "$PR_BODY" --base main --head "$BRANCH"
  echo "PR created (check your browser or gh output)."
else
  echo ""
  echo "GitHub CLI (gh) not found. To create a PR manually, run:" 
  echo "  gh pr create --title \"$PR_TITLE\" --body \"$PR_BODY\" --base main --head $BRANCH"
  echo "Or open in browser: https://github.com/palasangha/PALAScribe/compare/main...$BRANCH?expand=1"
fi

echo "Done."
