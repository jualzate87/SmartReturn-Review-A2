#!/usr/bin/env bash
# Deploy SmartReturn-ProtoA2 to GitHub Pages.
#
# TODO: Create repo (e.g. jualzate87/SmartReturn-Review-A2) and wire remote before first deploy:
#   git remote add github https://github.com/jualzate87/SmartReturn-Review-A2.git
#   Pages source: gh-pages branch / (root)
#
# Builds with base path /SmartReturn-Review-A2/ (see vite.config.ts).

set -euo pipefail
cd "$(dirname "$0")"

BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo detached)"
if [ "$BRANCH" != "main" ]; then
  echo "Refusing to deploy from branch '$BRANCH' — switch to main first." >&2
  exit 1
fi

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "Uncommitted changes present — commit or stash before deploying." >&2
  exit 1
fi

REMOTE="${DEPLOY_REMOTE:-github}"
if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "Remote '$REMOTE' not found. Add github remote for SmartReturn-Review-A2 first." >&2
  exit 1
fi

echo "==> Pushing main to $REMOTE"
git push "$REMOTE" main

echo "==> Building with GitHub Pages base path"
GITHUB_ACTIONS=true npx vite build

echo "==> Publishing dist/ to gh-pages"
REPO_ROOT="$(pwd)"
WORKTREE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/smartreturn-protoa2-gh-pages.XXXXXX")"
cleanup() {
  git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || true
  rm -rf "$WORKTREE_DIR"
}
trap cleanup EXIT

rmdir "$WORKTREE_DIR"

git worktree add -f "$WORKTREE_DIR" gh-pages 2>/dev/null || {
  git worktree add -f --detach "$WORKTREE_DIR"
  (cd "$WORKTREE_DIR" && git checkout --orphan gh-pages && git rm -rf . >/dev/null)
}

find "$WORKTREE_DIR" -mindepth 1 -maxdepth 1 -not -name '.git' -exec rm -rf {} +
rsync -a --exclude '.git' "$REPO_ROOT/dist/" "$WORKTREE_DIR/"
cd "$WORKTREE_DIR"
git add -A
git commit -m "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)" --allow-empty
git push "$REMOTE" gh-pages --force
cd "$REPO_ROOT"

echo "==> Done. Site will be live at https://jualzate87.github.io/SmartReturn-Review-A2/"
echo "    (confirm Pages source = gh-pages branch in repo settings)"
