# Tasks: Fix U3 Mathematical Rendering

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250 (≈200 new test + ~50 in-place edits in unit-3.json) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR; 3 reviewable local commits (RED / GREEN / REFACTOR) |
| Delivery strategy | auto-chain |
| Chain strategy | N/A (single PR; no chain) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: N/A (single PR; no chain)
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | RED test on 17 exponenciales + lineales.6 | PR 1 commit 1 | `pnpm run test -- src/components/math/__tests__/exponenciales-render-safety.test.ts` | N/A (Vitest is the only harness) | Test file reverts cleanly; no content touched |
| 2 | GREEN content corrections | PR 1 commit 2 | same as above | N/A | `unit-3.json` reverts; 18 records restored |
| 3 | REFACTOR + full pnpm gates | PR 1 commit 3 | `pnpm run test && pnpm run typecheck && pnpm run build` | N/A | Test-only revert; content stays GREEN |

## Phase 1: RED — Parser-backed render-safety coverage

- [x] 1.1 Create `src/components/math/__tests__/exponenciales-render-safety.test.ts` importing `parseRichTextSegments`, `katex`, `unit-3.json`
- [x] 1.2 Scan every P, O, N for the 17 exponenciales + `ex.u3.ecuaciones_lineales.6` for bare `^`, `√`, `\d+/\d+` in plain-text segments
- [x] 1.3 Assert the 17-ID namespace `ex.u3.exponenciales.{2,3,4,5,03,6,7,8,9,10,11,12,13,14,15,16,17}` in source order + `ex.u3.ecuaciones_lineales.6` exactly once
- [x] 1.4 KaTeX validity: every math segment passes `katex.renderToString(..., { throwOnError: true, displayMode: <parsed> })`
- [x] 1.5 Metadata preservation snapshot: id, expectedAnswer, commonErrorTags, options length, raw `value` sequence
- [x] 1.6 Run focused test — confirm RED (fails on bare notation)

## Phase 2: GREEN — Wrap math in `$...$` / `$$...$$`

- [x] 2.1 Wrap `ex.u3.exponenciales.2` prompt `$2^x = 8$`
- [x] 2.2 Wrap `ex.u3.exponenciales.3` P, O0, O3, N (`\frac{3}{2}`, `\frac{9}{2}`)
- [x] 2.3 Wrap `ex.u3.exponenciales.4` prompt `$5^x = 125$`
- [x] 2.4 Wrap `ex.u3.exponenciales.5` P, O3, N (O3 → `{ value, label }` for `x = 1/8`)
- [x] 2.5 Wrap `ex.u3.exponenciales.03` P, O0, O3, N (`\sqrt{32}`, `\frac{5}{2}`, `2^{5/2}`)
- [x] 2.6 Wrap `ex.u3.exponenciales.6` prompt `$3^x = 1$`
- [x] 2.7 Wrap `ex.u3.exponenciales.7` P, N (`2^{x+1}`)
- [x] 2.8 Wrap `ex.u3.exponenciales.8` P, O2, O3, N (`2^{-x}`, `1/32`, `2^{-5}`)
- [x] 2.9 Wrap `ex.u3.exponenciales.9` P, N (`2^{2x}`, `5\cdot2^x`, `t^2 - 5t + 4 = 0`)
- [x] 2.10 Wrap `ex.u3.exponenciales.10` P, N (`4^x`, `2^{2x}`, `t^2 - t - 2 = 0`)
- [x] 2.11 Wrap `ex.u3.exponenciales.11` P, N (`2^x + 2^{x+1} = 12`)
- [x] 2.12 Wrap `ex.u3.exponenciales.12` P, N (`2^{x^2 - 1}`)
- [x] 2.13 Wrap `ex.u3.exponenciales.13` P, N (`2^x + 2^{1-x} = 5/2`, `t + 1/t = 5/2`, `t^2 - \frac{5}{2}t + 1 = 0`)
- [x] 2.14 Wrap `ex.u3.exponenciales.14` P, N (`3^{2x}`, `4\cdot3^x`)
- [x] 2.15 Wrap `ex.u3.exponenciales.15` P, N (`3^x = 20`, `\ln 20`, `\ln 3`, `\frac{\ln 20}{\ln 3}`)
- [x] 2.16 Wrap `ex.u3.exponenciales.16` P, N (`2^{x/2}`)
- [x] 2.17 Wrap `ex.u3.exponenciales.17` P, N (`2^x + 2^{x+2} = 20`, `4\cdot2^x`, `5\cdot2^x`)
- [x] 2.18 Wrap `ex.u3.ecuaciones_lineales.6` P, all O, N (math-bearing O → `{ value, label }`; e.g. `$$(3+\sqrt{5})\cdot x=14+6\sqrt{5}$$` + `$\frac{14+6\sqrt{5}}{3-\sqrt{5}}$` label)
- [x] 2.19 Run focused test — confirm GREEN

## Phase 3: REFACTOR + Verify

- [x] 3.1 DRY helpers: extract `iterateTextFields` (handles string + `{ value, label }` options) and `assertNoBareNotation`
- [x] 3.2 Verify object-option raw `value` matches baseline (no answer-key drift)
- [x] 3.3 Run `pnpm run test`, `pnpm run typecheck`, `pnpm run build` — all three pass
- [x] 3.4 Confirm `expand-u3-exponentials` artifacts untouched, no push/PR/merge/worktree removal/archive actions taken
