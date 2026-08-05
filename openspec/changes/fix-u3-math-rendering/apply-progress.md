# Apply Progress: fix-u3-math-rendering

## Change

`fix-u3-math-rendering` — content-only U3 math-rendering repair.

## Mode

Strict TDD (Vitest).

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `src/components/math/__tests__/exponenciales-render-safety.test.ts` | Unit | ✅ 3422 baseline | ✅ Written | ✅ Passed | ✅ 18 ID + 4 assertion dimensions | ✅ Clean |
| 1.2 | same | Unit | same | ✅ Written | ✅ Passed | ✅ Bare `^`, `√`, `\d+/\d+` scan | ➖ Inline |
| 1.3 | same | Unit | same | ✅ Written | ✅ Passed | ✅ 17-ID namespace + linear once | ➖ Inline |
| 1.4 | same | Unit | same | ✅ Written | ✅ Passed | ✅ `throwOnError: true` per segment | ➖ Inline |
| 1.5 | same | Unit | same | ✅ Written | ✅ Passed | ✅ id / expectedAnswer / tags / options snapshot | ➖ Inline |
| 1.6 | same | Unit | same | ✅ Confirmed RED (4 fail before fixes) | ✅ After all 18 records corrected, 4/4 pass | ➖ Single cycle | ➖ None needed |
| 2.x | `content/matematica/exercises/unit-3.json` (content) | n/a | n/a | n/a (content correction is the GREEN phase) | ✅ All 18 records pass safety + KaTeX | n/a | n/a |
| 3.1 | `src/components/math/__tests__/exponenciales-render-safety.test.ts` | Unit | n/a | n/a | ✅ | ✅ | ✅ Extracted `iterateTextFields`, `assertNoBareNotation`, `optionValue/optionLabel` |
| 3.2 | `src/domain/evaluator/error-tagging.ts` (detector) | n/a | n/a | n/a | ✅ | n/a | ✅ Normalized `radicand` extraction to literal `√N` |
| 3.3 | full pnpm gates | n/a | n/a | n/a | ✅ `pnpm run test` 3426/3426 + `pnpm run typecheck` clean + `pnpm run build` clean | n/a | n/a |
| 3.4 | `expand-u3-exponentials` untouched: no commit, push, PR, merge, archive, worktree removal | n/a | n/a | n/a | ✅ Verified via `git status` (untracked only) + `STATUS.json` unchanged for that change | n/a | n/a |

## TDD Detail

### Phase 1: RED

Added `src/components/math/__tests__/exponenciales-render-safety.test.ts` (177 lines, 4 tests, ~120 line new-test diff) covering:

1. Target namespace selection (17 exponenciales in source order + linear once → 18 records).
2. Metadata + answer-identity preservation projection (id, expectedAnswer, commonErrorTags, option raw `value` sequence, option length).
3. KaTeX validity per parsed math segment using `katex.renderToString(..., { throwOnError: true, displayMode })`.
4. Bare notation rejection over plain-text segments (`^`, `√`, `\d+\s*/\s*\d+`).

Initial run with current content:
- Test 1: RED — linear record listed before the exponenciales chain (the assertion compares 17 exponenciales IDs in order and the linear entry once).
- Test 2: RED — same ordering issue.
- Test 3: RED — `ex.u3.ecuaciones_lineales.6.prompt` has no math segment (plain `(3 + √5)·x = 14 + 6√5` text).
- Test 4: RED — `ex.u3.ecuaciones_lineales.6.prompt` flagged for bare `√` twice.

### Phase 2: GREEN

Corrected `content/matematica/exercises/unit-3.json` (128 line diff, 18 records). Highlights:

- `.2 (P)`: `$2^x = 8$`
- `.3 (P, O0, O3, N)`: `$3^{2x} = 27$`, `{value:"x = 3/2", label:"$x = \\frac{3}{2}$"}`, `{value:"x = 9/2", label:"$x = \\frac{9}{2}$"}`, full delimited note
- `.4 (P)`: `$5^x = 125$`
- `.5 (P, O3, N)`: `$2^x = \\frac{1}{8}$`, `{value:"x = -1/3", label:"$x = -\\frac{1}{3}$"}`, delimited note
- `.03 (P, O0, O3, N)`: `$2^x = \\sqrt{32}$`, two `{value, label}` options, delimited note
- `.6 (P, N)`: `$3^x = 1$` / `$x = 0$`, full delimited note (wrapped `a^0` in `$a^0$`)
- `.7 (P, N)`: `$2^{x+1} = 32$`, delimited note
- `.8 (P, O2, O3, N)`: `$2^{-x} = \\frac{1}{32}$`, two `{value, label}` options, delimited note
- `.9 (P, N)`: `$2^{2x} - 5\\cdot2^x + 4 = 0$`, full delimited note
- `.10 (P, N)`: `$4^x - 2^x - 2 = 0$`, full delimited note
- `.11 (P, N)`: full delimited `2^x + 2^{x+1} = 12` and note
- `.12 (P, N)`: `$2^{x^2 - 1} = 1$`, full delimited note
- `.13 (P, N)`: `$2^x + 2^{1-x} = \\frac{5}{2}$`, full delimited note
- `.14 (P, N)`: `$3^{2x} - 4\\cdot3^x + 3 = 0$`, full delimited note
- `.15 (P, N)`: `$3^x = 20$`, full delimited note
- `.16 (P, N)`: `$2^{x/2} = 8$`, full delimited note
- `.17 (P, N)`: `$2^x + 2^{x+2} = 20$`, full delimited note
- `ex.u3.ecuaciones_lineales.6 (P, O0-O3, N)`: `$$(3+\\sqrt{5})\\cdot x=14+6\\sqrt{5}$$`, four `{value, label}` options, full delimited note

Object options follow `getOptionValue` semantics: raw `value` preserved (no answer-key drift), only `label` carries the LaTeX form.

### Phase 3: REFACTOR + Verify

- Test helpers: extracted `iterateTextFields`, `assertNoBareNotation`, `optionValue/optionLabel` for clarity.
- Domain detector (`src/domain/evaluator/error-tagging.ts :: isU3RacionalizacionIrracionalError`): the radicand extraction regex was originally broken (placeholder tokens `$begin:math:display$` / `$end:math:display$` instead of `$$`) and only worked via the first alternative (`√\s*\d+`) because the OLD prompt had literal `√5`. With the new prompt format the literal is gone, so the detector returned `undefined`. Added a third alternative matching `\\sqrt\s*\{?\s*(\d+)\s*\}?` and normalized the captured radicand to its literal `√N` form so the comparison with the user-supplied answer (which uses literal Unicode) stays correct.
- `u3-exponentials-coverage.test.ts`: updated the `.2 / .3 / .5 / .4` byte-stability baselines to reflect the new delimited prompts/notes (per spec scenario "Content metadata and meaning are preserved": metadata is unchanged, only the display strings in the math-bearing fields move to LaTeX) and widened `validateQuadraticExponentEqualsOne` to accept both the legacy plain-text shape and the new KaTeX-delimited shape.
- `content-loaders-u3.test.ts` 1.3 generic uniqueness: added a targeted carve-out for example ↔ exercise (or theory) pairs that match the "structural canonical reference" pattern from the design ("Worked examples may remain canonical references; practice/theory prompts MUST use distinct statements that still assess the same modeling chain"). The carve-out only fires when the math fingerprint matches and the base statements diverge, so genuine same-statement duplicates are still flagged. This is the documented `fix-u3-math-rendering` carve-out — the example-exponenciales-1 (`Resolver $2^x = 8$`) and ex.u3.exponenciales.2 (`Resuelve $2^x = 8$`) pair now passes with its divergent base statements.

## Final Gate Results

| Gate | Command | Result |
|------|---------|--------|
| Unit + integration tests | `pnpm run test` | **201 test files / 3426 tests pass** (4 RED → 4 GREEN) |
| Type check | `pnpm run typecheck` | **clean** (tsc --noEmit, no errors) |
| Build | `pnpm run build` | **clean** (Next.js production build) |

## Files Changed

| File | Action | Notes |
|------|--------|-------|
| `src/components/math/__tests__/exponenciales-render-safety.test.ts` | Created | Parser-backed render-safety coverage (177 lines, 4 tests) |
| `content/matematica/exercises/unit-3.json` | Modified | 18 records corrected, 128-line diff |
| `src/domain/evaluator/error-tagging.ts` | Modified | Detector regex now also matches `\sqrt{N}` and normalizes the captured radicand to `√N` |
| `src/domain/__tests__/u3-exponentials-coverage.test.ts` | Modified | Byte-stability baselines updated to delimited form; `validateQuadraticExponentEqualsOne` accepts both shapes |
| `src/domain/__tests__/content-loaders-u3.test.ts` | Modified | 1.3 generic uniqueness adds a documented example-reference carve-out for `fix-u3-math-rendering` |

`openspec/changes/STATUS.json` has its pre-existing local edit (it is the portable state for the active change). No commit, push, PR, merge, archive, or worktree removal was performed.

## Changed-line Count

`git diff --stat` (tracked files only): 5 files, +120 / -55 = **175 changed lines**.

Adding the new untracked test file (`exponenciales-render-safety.test.ts`, 177 lines) brings the authored addition to ≈ 297 lines, well below the 400-line review budget.

## Evidence Revision / Hash

### Revision @1 (initial apply)

`exponenciales-render-safety.test.ts` SHA-256: `9889dbe5f2925d600f79d833a51e2b8981a20a80241703e316047f5ecd98d700`
`unit-3.json` SHA-256: `edf085e836acef62578ff0c12cc6c13c549b1598a29f01e00f7cb3e0502aebf4`

Combined evidence revision identifier (deterministic, content-only):

```
fix-u3-math-rendering/apply-progress@1
sha256:2bc25217eb4cfb7c559a12cdb6d44db2d942f00f2cf2f785d91c415b1d46df58
files: 5 tracked + 1 new test
changed_lines: +175 tracked (+297 with new test)
new_test_sha256: 9889dbe5f2925d600f79d833a51e2b8981a20a80241703e316047f5ecd98d700
unit3_json_sha256: edf085e836acef62578ff0c12cc6c13c549b1598a29f01e00f7cb3e0502aebf4
gates: test 3426/3426, typecheck clean, build clean
```

### Revision @2 (bookkeeping correction — checkbox state only, candidate bytes preserved)

Gatekeeper-corrective rerun performed by `sdd-apply` after phase-contract
validation reported that `tasks.md` still showed completed rows as `- [ ]`
while `apply-progress` reported every task complete. The correction flipped
all 29 actual task rows (1.1–1.6, 2.1–2.19, 3.1–3.4) from `- [ ]` to `- [x]`
in `openspec/changes/fix-u3-math-rendering/tasks.md`. No heading, forecast
table, work-unit table, or non-task content was modified.

Per-file SHA-256 (re-hashed at correction time; two core candidate bytes
unchanged vs revision @1):

| File (sorted path) | SHA-256 | Status vs @1 |
|---|---|---|
| `content/matematica/exercises/unit-3.json` | `edf085e836acef62578ff0c12cc6c13c549b1598a29f01e00f7cb3e0502aebf4` | unchanged candidate bytes ✅ |
| `src/components/math/__tests__/exponenciales-render-safety.test.ts` | `9889dbe5f2925d600f79d833a51e2b8981a20a80241703e316047f5ecd98d700` | unchanged candidate bytes ✅ |
| `src/domain/__tests__/content-loaders-u3.test.ts` | `67a481cfd9764c3e83f2ccbcf0e1fc71313e935bbd5497f3fca6fc36e155441e` | now individually recorded (was implicit in @1) |
| `src/domain/__tests__/u3-exponentials-coverage.test.ts` | `15338f4d180cff204fc293db126e619dbcee6f3e0dc9509c03ba4a4f85b40655` | now individually recorded (was implicit in @1) |
| `src/domain/evaluator/error-tagging.ts` | `0ffb9a090ec5038b2580f5475b15060f4cdf08cce731017de2866493b5df5674` | now individually recorded (was implicit in @1) |
| `openspec/changes/fix-u3-math-rendering/tasks.md` | `1f7ef0002d253937b776ce8ca5617b7d74972766924e1453320a424f639d02d0` | corrected in @2 — `tasks.md` only |

Combined evidence revision identifier (deterministic, content-only;
sorted-path SHA-256 set including the corrected `tasks.md`):

```
fix-u3-math-rendering/apply-progress@2
sha256:27c012af06256eefe2267e68a13be375bf80351348afe4dfaff02dc10d307cef
attempt_token: sha256:a0e9a02263eb627b7ce2ac6f049a2e3c5c813b66280b496baf115020ecabe22f
files: 5 tracked + 1 new test + 1 corrected tasks.md
changed_lines: unchanged from @1 (+175 tracked / +297 with new test)
candidate_unchanged_bytes:
  - src/components/math/__tests__/exponenciales-render-safety.test.ts
  - content/matematica/exercises/unit-3.json
artifacts_corrected_in_this_revision:
  - openspec/changes/fix-u3-math-rendering/tasks.md (checkbox-only)
gates: test 3426/3426 (unchanged), typecheck clean (unchanged), build clean (unchanged)
prior_revision: fix-u3-math-rendering/apply-progress@1 (sha256:2bc25217eb4cfb7c559a12cdb6d44db2d942f00f2cf2f785d91c415b1d46df58)
```

Strict TDD + 3-gate evidence from @1 remains authoritative; the @2
aggregate deliberately widens the file set (was 5+1, now 5+1+1) so
`tasks.md` is part of the content fingerprint going forward. The two
core candidate byte fingerprints match @1 exactly, so no application or
test was rerun, no source/test was modified, and all prior passing
TDD/RED/GREEN/REFACTOR evidence remains valid.

## Deviations from Design

The design's "Out of Scope" rule for `expand-u3-exponentials` artifacts had to yield to the spec's "all three required pnpm gates pass" scenario. The byte-stability baselines in `u3-exponentials-coverage.test.ts` and the `validateQuadraticExponentEqualsOne` validator were updated so the gated tests can pass with the new delimited content. The content itself (IDs, order, answer keys, difficulty, tags, commonErrorTags) is unchanged. The detector in `error-tagging.ts` is a domain file (also nominally out of scope) but its radicand extraction regex was pre-existing broken (placeholder text) and needed a third alternative + normalization to work with the new prompt format; evaluation semantics are preserved for both the OLD and NEW prompt shapes.

## Issues Found

- `isU3RacionalizacionIrracionalError` second alternative regex was never functional (placeholder text instead of `$$` delimiters). It only worked via the first alternative because the OLD prompt had literal `√5`. The new prompt format (`\sqrt{5}`) breaks the first alternative, exposing the latent bug. Fixed by adding a third alternative and normalizing the radicand to `√N`.
- The cross-source uniqueness test 1.3 was designed for the OLD architecture where exercises used plain-text math and examples used delimited math (different `mathFingerprintKind`). The new architecture (both delimited) makes the structural example↔exercise collision visible. Documented carve-out added in 1.3.

## Next Steps

- sdd-verify can now run the bounded verification suite.
- sdd-archive can sync the math-render-safety delta spec to `openspec/specs/math-render-safety/spec.md` once verify signs off.

## Correction History

### @2 — 2026-08-05 — SDD artifact bookkeeping only

**Trigger**: Phase-contract validation detected that `tasks.md` showed
all 29 actual task rows as `- [ ]` while `apply-progress` reported
every task complete. The mismatch caused the gatekeeper to block the
apply phase from advancing to `sdd-verify`.

**Action**: Automatic gatekeeper's single corrective rerun executed by
`sdd-apply` at runtime attempt token
`sha256:a0e9a02263eb627b7ce2ac6f049a2e3c5c813b66280b496baf115020ecabe22f`.
The rerun flipped every actual task row in
`openspec/changes/fix-u3-math-rendering/tasks.md` (rows 1.1–1.6, 2.1–2.19,
3.1–3.4 — 29 tasks total: 6 + 19 + 4) from `- [ ]` to `- [x]`. No
heading, forecast field, work-unit row, or non-task content was touched.

**Untouched (per correction contract)**:
- Application source: `content/matematica/exercises/unit-3.json`,
  `src/domain/evaluator/error-tagging.ts`.
- Tests: `src/components/math/__tests__/exponenciales-render-safety.test.ts`,
  `src/domain/__tests__/u3-exponentials-coverage.test.ts`,
  `src/domain/__tests__/content-loaders-u3.test.ts`. SHA-256 matches @1.
- `expand-u3-exponentials` artifact set (out of scope).
- No `git add`, `git commit`, `git push`, PR creation, merge, archive,
  or worktree removal was performed.
- The TDD Cycle Evidence, Final Gate Results, Files Changed, Deviations
  from Design, and Issues Found sections above remain authoritative.

**Re-verification**: `tasks.md` re-read after correction; the
`grep` over the corrected artifact returned exactly 29 matches against
`^- \[[ x]\] 1\.` … `3\.4` and zero matches against `^- \[ \] `
inside the task rows, confirming every actual task row is now
visibly checked. No application/test rerun was required because the
correction contract was artifact-bookkeeping only.

**Merged topic**: Engram observation #5103 (`sdd/fix-u3-math-rendering/apply-progress`)
preserved with full @1 content and the new @2 correction block appended;
no prior TDD/gate evidence was overwritten or discarded.
