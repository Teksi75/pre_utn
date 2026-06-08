#!/usr/bin/env bash
# audit-branches.sh — Detect zombie/stale branches across machines
#
# Reads openspec/changes/STATUS.json as the single source of truth.
# Reports branches that:
#   1. Exist locally/remotely but are NOT in STATUS.json (zombies)
#   2. Are in STATUS.json but no longer exist (stale entries)
#   3. Have diverged significantly from main (drift risk)
#
# Usage: ./scripts/audit-branches.sh [--fix]
#   --fix  Auto-delete zombie branches (local + remote) after confirmation

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
STATUS_FILE="$REPO_ROOT/openspec/changes/STATUS.json"
MAIN_BRANCH="main"
DRIFT_THRESHOLD=20  # commits ahead before warning

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FIX_MODE=false
[[ "${1:-}" == "--fix" ]] && FIX_MODE=true

if [[ ! -f "$STATUS_FILE" ]]; then
  echo -e "${RED}ERROR: $STATUS_FILE not found${NC}"
  echo "This file is the portable source of truth for SDD change status."
  echo "Create it or run from the repo root."
  exit 1
fi

# Ensure we have latest remote info
echo -e "${BLUE}Fetching remote...${NC}"
git fetch --prune --quiet 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SDD Branch Audit — $(date +%Y-%m-%d)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Extract registered branches from STATUS.json
REGISTERED_BRANCHES=$(jq -r '.changes | to_entries[] | select(.value.branch != null) | .value.branch' "$STATUS_FILE" 2>/dev/null || echo "")
ACTIVE_BRANCHES=$(jq -r '.activeBranches[]?' "$STATUS_FILE" 2>/dev/null || echo "")
ALL_REGISTERED=$(echo -e "${REGISTERED_BRANCHES}\n${ACTIVE_BRANCHES}" | sort -u | grep -v '^$' || true)

# Get all local branches (excluding main)
LOCAL_BRANCHES=$(git branch --format='%(refname:short)' | grep -v "^${MAIN_BRANCH}$" || true)

# Get all remote branches (excluding main, HEAD, and the remote name itself)
REMOTE_BRANCHES=$(git branch -r --format='%(refname:short)' | grep -v "^origin/${MAIN_BRANCH}$" | grep -v "origin/HEAD" | grep -v "^origin$" | sed 's|^origin/||' || true)

# Combine all known branches
ALL_BRANCHES=$(echo -e "${LOCAL_BRANCHES}\n${REMOTE_BRANCHES}" | sort -u | grep -v '^$' || true)

# ─── ZOMBIE DETECTION ───────────────────────────────────────────────────────
echo -e "${YELLOW}▸ ZOMBIE BRANCHES${NC} (exist but not in STATUS.json)"
echo "─────────────────────────────────────────────────────────────"

ZOMBIES=""
for branch in $ALL_BRANCHES; do
  if ! echo "$ALL_REGISTERED" | grep -qxF "$branch"; then
    # Check if it's ahead of main
    AHEAD=$(git rev-list --count "${MAIN_BRANCH}..${branch}" 2>/dev/null || echo "0")
    BEHIND=$(git rev-list --count "${branch}..${MAIN_BRANCH}" 2>/dev/null || echo "0")
    
    if [[ "$AHEAD" -eq 0 ]]; then
      STATUS_ICON="🗑️  empty/merged"
    elif [[ "$AHEAD" -gt "$DRIFT_THRESHOLD" ]]; then
      STATUS_ICON="⚠️  ${AHEAD} ahead, ${BEHIND} behind (HIGH DRIFT)"
    else
      STATUS_ICON="📌 ${AHEAD} ahead, ${BEHIND} behind"
    fi
    
    ZOMBIES="${ZOMBIES}${branch}\n"
    echo -e "  ${RED}✗${NC} ${branch}  ${STATUS_ICON}"
  fi
done

if [[ -z "$ZOMBIES" ]]; then
  echo -e "  ${GREEN}✓ No zombie branches detected${NC}"
fi

# ─── STALE ENTRIES ──────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▸ STALE ENTRIES${NC} (in STATUS.json but branch doesn't exist)"
echo "─────────────────────────────────────────────────────────────"

STALE_FOUND=false
for branch in $ALL_REGISTERED; do
  if ! echo "$ALL_BRANCHES" | grep -qxF "$branch"; then
    # Check if it was intentionally null (no branch needed)
    IS_NULL=$(jq -r --arg b "$branch" '.changes | to_entries[] | select(.value.branch == $b) | .value.branch' "$STATUS_FILE" 2>/dev/null || echo "")
    if [[ -n "$IS_NULL" ]]; then
      STALE_FOUND=true
      echo -e "  ${YELLOW}⚠${NC} ${branch} — registered but not found locally/remotely"
    fi
  fi
done

if [[ "$STALE_FOUND" == "false" ]]; then
  echo -e "  ${GREEN}✓ No stale entries${NC}"
fi

# ─── DRIFT ANALYSIS ─────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▸ DRIFT ANALYSIS${NC} (registered branches vs main)"
echo "─────────────────────────────────────────────────────────────"

DRIFT_FOUND=false
for branch in $ALL_REGISTERED; do
  if echo "$ALL_BRANCHES" | grep -qxF "$branch"; then
    AHEAD=$(git rev-list --count "${MAIN_BRANCH}..${branch}" 2>/dev/null || echo "0")
    BEHIND=$(git rev-list --count "${branch}..${MAIN_BRANCH}" 2>/dev/null || echo "0")
    
    if [[ "$AHEAD" -gt "$DRIFT_THRESHOLD" ]] || [[ "$BEHIND" -gt "$DRIFT_THRESHOLD" ]]; then
      DRIFT_FOUND=true
      echo -e "  ${YELLOW}⚠${NC} ${branch}: ${AHEAD} ahead, ${BEHIND} behind main"
    fi
  fi
done

if [[ "$DRIFT_FOUND" == "false" ]]; then
  echo -e "  ${GREEN}✓ No significant drift${NC}"
fi

# ─── SUMMARY ────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SUMMARY"
echo "═══════════════════════════════════════════════════════════════"

CHANGE_COUNT=$(jq '.changes | length' "$STATUS_FILE")
DONE_COUNT=$(jq '[.changes | to_entries[] | select(.value.status == "done")] | length' "$STATUS_FILE")
WIP_COUNT=$(jq '[.changes | to_entries[] | select(.value.status == "in-progress")] | length' "$STATUS_FILE")
EXPLORATION_COUNT=$(jq '[.changes | to_entries[] | select(.value.status == "exploration-only")] | length' "$STATUS_FILE")

echo "  Changes in STATUS.json: ${CHANGE_COUNT}"
echo "    Done: ${DONE_COUNT}  |  In-progress: ${WIP_COUNT}  |  Exploration: ${EXPLORATION_COUNT}"
echo "  Local branches: $(echo "$LOCAL_BRANCHES" | grep -c '.' || echo 0)"
echo "  Remote branches: $(echo "$REMOTE_BRANCHES" | grep -c '.' || echo 0)"

# ─── FIX MODE ───────────────────────────────────────────────────────────────
if [[ "$FIX_MODE" == "true" ]] && [[ -n "$ZOMBIES" ]]; then
  echo ""
  echo -e "${YELLOW}▸ FIX MODE: Delete zombie branches?${NC}"
  echo -e "  Branches to delete:"
  echo -e "$ZOMBIES" | sed 's/^/    /'
  echo ""
  read -p "  Confirm deletion (y/N): " CONFIRM
  if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    for branch in $(echo -e "$ZOMBIES" | grep -v '^$'); do
      echo -n "  Deleting $branch... "
      # Try local first
      if git branch -D "$branch" 2>/dev/null; then
        echo -n "local "
      fi
      # Then remote
      if git push origin --delete "$branch" 2>/dev/null; then
        echo -n "remote "
      fi
      echo "done"
    done
    echo -e "${GREEN}✓ Cleanup complete${NC}"
  else
    echo "  Skipped."
  fi
fi

echo ""
echo -e "${BLUE}Last audit: $(jq -r '.lastAudit' "$STATUS_FILE")${NC}"
echo -e "${BLUE}Run with --fix to auto-delete zombies after confirmation${NC}"
echo ""
