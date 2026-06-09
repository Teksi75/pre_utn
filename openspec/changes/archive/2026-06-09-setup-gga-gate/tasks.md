# Tasks: Setup GGA Gate

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120 (config + docs + AGENTS line) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Config + install + hook + docs in one commit | PR 1 | Single PR; tests not applicable (tooling/docs only) |

## Phase 1 — Branch & housekeeping

- [x] 1.1 Create branch `setup-gga-gate` from `main` and add an entry to `openspec/changes/STATUS.json` with `status: "in-progress"`, `branch: "setup-gga-gate"`, and a short `summary`. Acceptance: `git branch --show-current` returns `setup-gga-gate`; STATUS.json is valid JSON and lists the entry.
- [x] 1.2 Confirm `tasks.md` (this file) exists in the change folder. Acceptance: `openspec/changes/setup-gga-gate/tasks.md` is committed on the branch.

## Phase 2 — `.gga` config

- [x] 2.1 In `.gga`, change `PROVIDER="opencode:openai/gpt-5.4-mini"` to `PROVIDER="opencode:deepseek-v4-flash"`. Keep `RULES_FILE="AGENTS.md"`, `STRICT_MODE="true"`, `FILE_PATTERNS="*.ts,*.tsx,*.js,*.jsx"`, and `EXCLUDE_PATTERNS="*.test.ts,*.spec.ts,*.test.tsx,*.spec.tsx,*.d.ts"` unchanged. Acceptance: `grep PROVIDER .gga` shows the new value; remaining lines are identical.
- [x] 2.2 Fix the header comment `# https://github.com/your-org/gga` to the real repo URL (`https://github.com/Gentleman-Programming/gentleman-guardian-angel`). Acceptance: `grep -c "your-org" .gga` returns `0`.
- [x] 2.3 Verify `.gga-tmp/` is in `.gitignore` (it already is at line 32). No-op if present. Acceptance: `grep ".gga-tmp/" .gitignore` matches.

## Phase 3 — Install GGA & register hook

- [x] 3.1 Install GGA on this machine. macOS/Linux: `brew install gentleman-programming/tap/gga`. Windows (Git Bash): `git clone https://github.com/Gentleman-Programming/gentleman-guardian-angel.git && cd gentleman-guardian-angel && bash install.sh`. Acceptable: `which gga` prints a path; `gga version` reports `2.8.x`. Capture the install path in the commit message body.
- [x] 3.2 From the repo root, run `gga install` to register `.git/hooks/pre-commit`. Acceptance: command exits 0; `ls -l .git/hooks/pre-commit` exists and is executable.
- [x] 3.3 Sanity checks: `gga version` reports `2.8.x`; `gga config` shows the new provider and `RULES_FILE=AGENTS.md`; `gga --help` lists `init, install, run, uninstall, config, cache`. Acceptance: all three commands produce the expected output.

## Phase 4 — Multi-PC install docs

- [x] 4.1 Create `docs/qa/gga-setup.md` with per-OS install steps: macOS (`brew install gentleman-programming/tap/gga`), Linux (Homebrew or `git clone` + `bash install.sh`), Windows (`git clone` + `bash install.sh` in Git Bash + add `~/bin` to PATH if needed). State explicitly that the binary AND the hook are machine-local and must be re-installed on every new PC. Acceptance: file exists; each OS has a copy-pasteable command block.
- [x] 4.2 Create `docs/qa/gga-checklist.md` — manual smoke checklist covering: (a) `AGENTS.md` present, (b) `gga version` reports `2.8.x`, (c) provider reachable (run `gga run` on a trivial change), (d) hook active (`ls .git/hooks/pre-commit`), (e) sample commit triggers review, (f) `--no-verify` documented as Git's escape hatch. Acceptance: file exists; all six items are listed with one-line commands.

## Phase 5 — Update AGENTS.md & README

- [x] 5.1 In `AGENTS.md` (verification section, line 14), replace `- Pasar GGA antes de cerrar tareas o commits.` with `- GGA corre automáticamente en pre-commit vía `.gga` + `AGENTS.md`. Instalación por máquina: ver `docs/qa/gga-setup.md`.` Acceptance: `grep -n "Pasar GGA" AGENTS.md` returns nothing; new line is present and references the setup doc.
- [x] 5.2 In `README.md`, add a link to `docs/qa/gga-setup.md` in any QA / development / contributing section (create the section if none exists). Acceptance: `README.md` contains a relative link to `docs/qa/gga-setup.md`.

## Phase 6 — Verification

- [x] 6.1 Stage a trivial change (one-character typo fix in `docs/`) and run `gga run` from the repo root. Acceptance: GGA invokes the provider and reports a review verdict (pass or fail — both prove the pipeline works). Then `git restore` the test change.
- [ ] 6.2 (Optional) Stage a deliberate violation (add `const x: any = 1;` inside a `src/domain/` file) and run `git commit -m "test gga"`. Acceptance: GGA blocks the commit with non-zero exit and a rule-violation message. Then `git restore` the staged violation.
- [x] 6.3 Confirm no `pnpm run gga` script was added (explicit non-goal from the proposal). Acceptance: `grep -r "gga" package.json` returns nothing; `pnpm run` does not list a `gga` task.
- [ ] 6.4 Commit the change itself through the normal GGA flow (let the hook fire). Acceptance: commit is created; `.git/hooks/pre-commit` was executed.

## Spec → Task Coverage

- `code-review-gate::GGA Binary Availability` → 3.1, 3.3
- `code-review-gate::Repository GGA Configuration` → 2.1, 2.2, 2.3, 3.3
- `code-review-gate::GGA Availability Documentation` → 5.1
- `pre-commit-hooks::Active Pre-Commit Review Hook` → 3.2, 6.1, 6.2, 6.3
- `pre-commit-hooks::Multi-PC Installation Documentation` → 4.1, 5.2
- `pre-commit-hooks::Manual Smoke Checklist` → 4.2
