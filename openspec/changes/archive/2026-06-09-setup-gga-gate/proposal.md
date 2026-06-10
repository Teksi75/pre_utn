# Proposal: Setup GGA Gate

## Intent

AGENTS.md mandates "Pasar GGA antes de cerrar tareas o commits" but the GGA binary is not installed and the pre-commit hook is not registered. This change makes GGA actionable across all development machines (multi-PC) so the quality gate policy is enforceable, not aspirational.

## Scope

### In
- Install `gentleman-guardian-angel` binary: Homebrew on macOS/Linux, `bash install.sh` on Windows (Git Bash)
- Update `.gga` config: switch provider from `opencode:openai/gpt-5.4-mini` to `opencode:deepseek-v4-flash`
- Register GGA as a pre-commit hook
- Create `docs/qa/gga-checklist.md` with multi-PC install/recovery instructions
- Update AGENTS.md to mark GGA as available (remove "not available" flag)

### Out
- No `pnpm run gga` script — GGA is a pre-commit hook, not a pnpm script
- No DB migrations
- No changes to domain logic, exercises, or Supabase
- No modifications to existing specs beyond this change's delta

## Capabilities

### New: `code-review-gate`
Provider-agnostic AI code review that runs automatically before commits, using configurable rules from AGENTS.md and a pluggable AI backend.

### New: `pre-commit-hooks`
Registration and lifecycle management of pre-commit hooks (install, uninstall, verify, bypass with `--no-verify`).

## Approach

| Step | Action | Detail |
|------|--------|--------|
| 1 | Install GGA binary | Homebrew (`brew install gentleman-guardian-angel`) on macOS/Linux; `bash install.sh` from cloned repo on Windows Git Bash |
| 2 | Update `.gga` | Change `PROVIDER="opencode:deepseek-v4-flash"`; keep existing file patterns and strict mode |
| 3 | Register hook | Run `gga install` to register pre-commit hook in `.git/hooks/` |
| 4 | Verify | Run `gga run` on a dummy commit to confirm provider connectivity and rule parsing |
| 5 | Document | Create `docs/qa/gga-checklist.md` with install steps per OS, troubleshooting, and `--no-verify` escape hatch |
| 6 | Update AGENTS.md | Mark GGA as available; reference the checklist |

## Affected Areas

- `.gga` — provider update
- `AGENTS.md` — availability status + checklist reference
- `docs/qa/gga-checklist.md` — new file, multi-PC install docs
- `openspec/changes/STATUS.json` — updated after merge (not in this change)

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `deepseek-v4-flash` provider unavailable or rate-limited | Medium | Fallback to another opencode Zen model; document in checklist |
| Multi-PC re-install after machine switch | High | Checklist covers all 3 platforms; `gga --version` verify step |
| Hook bypass with `--no-verify` | Medium | Policy enforcement via team convention; GGA logs bypassed commits |
| Git Bash not available on Windows | Low | Document WSL2 as alternative; AGENTS.md already assumes Git Bash |

## Rollback Plan

1. `gga uninstall` — removes pre-commit hook
2. Restore `.gga` to previous provider via git revert
3. No DB migrations to reverse
4. Delete `docs/qa/gga-checklist.md` if desired (harmless to keep)

## Dependencies

- `Gentleman-Programming/gentleman-guardian-angel` repository accessible (MIT, pure bash)
- opencode CLI authenticated with Zen models endpoint
- Git Bash available on Windows machines

## Success Criteria

- [ ] `gga run` passes on a dummy commit with the new provider
- [ ] `gga install` successfully registers the pre-commit hook
- [ ] `docs/qa/gga-checklist.md` exists with install steps for macOS, Linux, and Windows
- [ ] AGENTS.md updated to mark GGA as available (no longer flagged as missing)
- [ ] **Explicitly NOT created**: `pnpm run gga` — GGA is a pre-commit hook, not a pnpm script. This must not be added.
