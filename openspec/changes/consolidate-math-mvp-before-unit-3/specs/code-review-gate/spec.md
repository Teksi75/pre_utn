# Delta for code-review-gate

## ADDED Requirements

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
