# Code Review Gate Specification

## Purpose

Provide an enforceable AI code-review gate for Pre UTN so repository rules in `AGENTS.md` are applied before work is closed. Pedagogical impact: this protects strict domain modeling and exercise quality for students, and helps teachers trust review/verification signals.

## Requirements

### Requirement: GGA Binary Availability

Developer machines MUST provide a working GGA CLI compatible with the repository gate.

#### Scenario: macOS or Linux binary is discoverable

- GIVEN a macOS or Linux developer shell
- WHEN the developer runs `which gga`
- THEN the command returns a filesystem path

#### Scenario: Windows Git Bash reports supported version

- GIVEN a Windows developer using Git Bash
- WHEN the developer runs `gga version`
- THEN the output reports version `2.8.x`

#### Scenario: CLI exposes required commands

- GIVEN GGA is installed
- WHEN the developer runs `gga --help`
- THEN the output lists `init`, `install`, `run`, `uninstall`, `config`, and `cache`

### Requirement: Repository GGA Configuration

The repository MUST commit a `.gga` configuration that uses `AGENTS.md` as the rules file and avoids stale template references.

#### Scenario: Config exposes expected review settings

- GIVEN the repository root contains `.gga`
- WHEN the developer runs `gga config`
- THEN it shows `RULES_FILE=AGENTS.md`, `PROVIDER=opencode`, and `STRICT_MODE=true`
- AND it shows `FILE_PATTERNS=*.ts,*.tsx,*.js,*.jsx` plus `EXCLUDE_PATTERNS` covering test, spec, and `.d.ts` files

#### Scenario: Provider uses OpenCode integration

- GIVEN `.gga` is committed
- WHEN the `PROVIDER` line is inspected
- THEN it is `PROVIDER="opencode"` (no model suffix)
- BECAUSE the repository GGA MUST use the OpenCode provider so the pre-commit gate runs through the same OpenCode integration used by the project workflow, avoiding stale Codex-specific or model-pinned local configuration

#### Scenario: Config comments reference real project source

- GIVEN `.gga` is committed
- WHEN its comments are inspected
- THEN no comment references `your-org/gga`

### Requirement: GGA Availability Documentation

Project guidance MUST describe GGA as available through `.gga` and `AGENTS.md`, not as a missing manual step.

#### Scenario: AGENTS documents automatic gate

- GIVEN `AGENTS.md` describes verification expectations
- WHEN the GGA line is inspected
- THEN it states GGA runs automatically in pre-commit through `.gga` and `AGENTS.md`

---

## Added by consolidate-math-mvp-before-unit-3

### Requirement: CI Verification Signals

The repository CI MUST report test, typecheck, and build status on PRs and pushes. These signals complement but do not replace the GGA pre-commit gate.

#### Scenario: CI status visible on PR

- GIVEN a pull request
- WHEN CI completes
- THEN test, typecheck, and build status are reported as check results

#### Scenario: CI failure does not bypass GGA

- GIVEN a commit where CI fails
- WHEN GGA pre-commit runs
- THEN GGA still runs its independent review

### Requirement: Domain Coverage Signal

CI SHOULD report domain test coverage as a non-blocking signal. The initial soft floor is 60%.

#### Scenario: coverage report is generated

- GIVEN CI runs on a PR
- WHEN tests complete
- THEN domain coverage percentage is reported in CI output
