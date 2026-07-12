# Tasks: Recover Canonical Trace-Path Validation

## Review Workload Forecast

Planning: 153. Impl+test: ~200. STATUS: 11. Total: ~364.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

| Unit | Goal | Focused test cmd | Rollback |
|------|------|------------------|----------|
| 1 | Full delivery | `pnpm exec vitest run src/lib/__tests__/trace-path.test.ts` | Reverts all. |

## TDD Cycle Evidence

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| 2.1 / 2.3 | Test file added against missing `src/lib/trace-path.ts` module — vitest reports module-not-found | `trace-path.ts` recovered; 7/7 tests pass | Cleaned with `mkdtempSync` + `rmSync` + `vi.restoreAllMocks`; no further refactor needed |

## Phase 1: Preparation

- [x] 1.1 Branch `feat/u3-recuperar-fundacion-minima` from `05639d48`.
- [x] 1.2 Confirm planning artifacts exist and trimmed.

## Phase 2: TDD (RED → GREEN → REFACTOR)

- [x] 2.1 RED: `src/lib/__tests__/trace-path.test.ts` (6 normative + 1 `@ts-expect-error`). `mkdtempSync` temp root, native path ops, real fixture, `rmSync` afterEach, `vi.restoreAllMocks()` afterEach.
- [x] 2.2 Confirm RED.
- [x] 2.3 GREEN: `src/lib/trace-path.ts` from source `0f79d63`. `import * as fs from "node:fs"` for spy-ability.
- [x] 2.4 Confirm GREEN. `pnpm run test`, `pnpm run typecheck`, `pnpm run build` exit 0.

## Phase 3: Verification

- [x] 3.1 `git diff --stat 05639d48..HEAD`; assert <=400.

Post-apply review, receipt validation, commit, push, PR creation, merge, and the terminal `STATUS.json` transition belong to the delivery lifecycle; they are not implementation tasks.

## Rollback

Revert single PR. Source/base refs `0f79d63`/`05639d48` immutable.
