# CI Verification Specification

## Purpose

Provide repository CI that verifies tests, typecheck, build, and coverage signals on PR/push, complementing GGA as the review gate. Pedagogical impact: CI ensures domain logic integrity before content reaches students; teachers benefit from verified build health.

## Requirements

### Requirement: CI Pipeline Gates

The repository CI MUST run `pnpm run test`, `pnpm run typecheck`, and `pnpm run build` on every PR and push to main.

#### Scenario: PR triggers CI gates

- GIVEN a pull request targeting main
- WHEN CI runs
- THEN all three gates (test, typecheck, build) execute and report pass/fail

#### Scenario: push to main triggers CI gates

- GIVEN a push to the main branch
- WHEN CI runs
- THEN all three gates execute and report pass/fail

### Requirement: CI Reports Domain Coverage

CI SHOULD report domain test coverage percentage. The initial floor MUST be a soft signal (warning, not block).

#### Scenario: coverage below soft floor warns

- GIVEN domain coverage is below 60%
- WHEN CI completes
- THEN a coverage warning is emitted but the build does not fail

#### Scenario: coverage above soft floor passes silently

- GIVEN domain coverage is at or above 60%
- WHEN CI completes
- THEN no coverage warning is emitted

### Requirement: CI Uses pnpm

All CI steps MUST use `pnpm` for dependency installation and script execution. CI MUST NOT use `npm` or `yarn`.

#### Scenario: CI installs with pnpm

- GIVEN the CI workflow
- WHEN dependencies are installed
- THEN `pnpm install` is used (not `npm install` or `yarn`)

### Requirement: CI Does Not Replace GGA

CI signals are complementary to GGA pre-commit review. CI MUST NOT be configured to replicate GGA's AI review gate. CI focuses on mechanical verification (tests, types, build); GGA focuses on rule-based review.

#### Scenario: CI and GGA are independent

- GIVEN a commit that passes CI
- WHEN GGA pre-commit runs
- THEN GGA runs its own review independently of CI status
