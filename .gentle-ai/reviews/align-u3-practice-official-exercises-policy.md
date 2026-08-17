# Review Policy: align-u3-practice-official-exercises

## Target Identity

- **Lineage**: `align-u3-practice-official-exercises-committed-range`
- **Target Kind**: `commit-range`
- **Base Commit**: `05639d48a264e871d01031984c05a127c51f8d57`
- **Candidate Commit**: `0f79d634843651366eb0ee8b0cb1467fb77f73de`
- **Changed Files**: 78 files, +16,388 / -310 lines

## Review Mode

- **Mode**: `ordinary_4r`
- **Generation**: 1
- **Initial Lenses**: Full 4R — `review-risk`, `review-resilience`, `review-readability`, `review-reliability`

## Scope

This review covers the complete diff of branch `feat/align-u3-practice-official-exercises` against `origin/main`. The change implements Unit 3 (Absolute Value, Sign Charts, Linear/Quadratic Equations, Recta) practice exercises aligned with official UTN exam content, including:

- Domain evaluation and error-tagging extensions
- Persistence layer updates (practice progress, challenges)
- React display components for exercises
- Content files (challenges, examples, exercises, feedback, theory)
- Test suites for all new functionality
- SDD artifacts (specs, design, tasks, proposal, exploration)

## Constraints

### Read-Only Review

This is a **read-only review**. The reviewer must NOT modify any files in the repository. All findings must be recorded as structured observations with concrete evidence references (file paths, line numbers, code excerpts).

### Frozen Ledger

Once findings are frozen, the ledger is immutable. Each finding must have:
- A unique ID
- A severity level (blocker, critical, major, minor, info)
- A specific location (file path and line range)
- A clear claim describing the issue
- Concrete evidence (code excerpt, test output, or structural proof)

### Correction Budget

- **Full reviews**: 1 (this initial review)
- **Refuter batches**: 1
- **Fix batches**: 1
- **Scoped fix validations**: 1
- **Final verifications**: 1

Any finding classified as `blocker` or `critical` requires deterministic evidence and triggers the fix workflow. Inferential findings trigger refutation. Insufficient evidence escalates.

## Lens Execution Order

The 4R lenses must be executed in canonical order:

1. **review-risk**: Security, correctness, data integrity, API contracts, breaking changes
2. **review-resilience**: Error handling, edge cases, fallback behavior, recovery paths
3. **review-readability**: Code clarity, naming conventions, documentation, cognitive load
4. **review-reliability**: Test coverage, determinism, reproducibility, performance characteristics

Each lens produces a `LensResult` with findings bound to that lens and concrete evidence strings.

## Reviewer Instructions

- Do NOT edit any source files, tests, or configuration
- Do NOT run `gentle-ai review-step` or any mutation operation
- Record findings with exact file paths and line references
- Cite specific code excerpts as evidence
- Follow the AGENTS.md conventions for this repository (SDD, TDD, pnpm, strict TypeScript)
- Respect the brand/voice constraints defined in AGENTS.md
- Verify that domain code remains free of React/Next.js/Supabase dependencies
