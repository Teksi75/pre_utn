# Pre-Commit Hooks Specification

## Purpose

Define the lifecycle and documentation expectations for the repository pre-commit GGA hook. Pedagogical impact: automatic review reduces accidental violations in math/domain code before they affect learners or teacher-facing quality signals.

## Requirements

### Requirement: Active Pre-Commit Review Hook

The repository MUST have an active GGA pre-commit hook on each developer machine, while preserving Git's documented bypass for exceptional cases.

#### Scenario: Hook file exists and is executable

- GIVEN GGA has been installed for the repository
- WHEN the developer lists `.git/hooks/pre-commit`
- THEN the hook exists and is executable

#### Scenario: Rules violation blocks commit

- GIVEN a staged TypeScript file clearly violates `AGENTS.md`, such as unjustified `any` in `src/domain/`
- WHEN the developer runs `git commit`
- THEN GGA blocks the commit with a non-zero exit code

#### Scenario: Git bypass remains available

- GIVEN a developer intentionally uses Git's escape hatch
- WHEN the developer runs `git commit --no-verify`
- THEN Git allows the commit attempt without running the pre-commit hook

### Requirement: Multi-PC Installation Documentation

The project MUST document that GGA installation is per-machine and must be repeated by each developer or on each new PC.

#### Scenario: Platform install guide exists

- GIVEN documentation under `docs/qa/`
- WHEN `docs/qa/gga-setup.md` or equivalent is inspected
- THEN it lists install steps for macOS, Linux, and Windows Git Bash
- AND it explains the binary and hook are machine-local, not stored in the repo

#### Scenario: Main guidance links setup guide

- GIVEN repository onboarding or rule documentation exists
- WHEN `README.md` or `AGENTS.md` is inspected
- THEN it links to the GGA setup documentation

### Requirement: Manual Smoke Checklist

The project MUST provide a manual checklist for validating the GGA gate after setup or machine changes.

#### Scenario: Checklist covers required smoke checks

- GIVEN `docs/qa/gga-checklist.md` exists
- WHEN the checklist is inspected
- THEN it covers rules file presence, provider reachability, hook activity, and a sample commit review
- AND it documents `--no-verify` as an escape hatch
