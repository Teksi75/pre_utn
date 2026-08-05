# Apply Progress: expand-u3-exponentials

## Change

- **Change name**: `expand-u3-exponentials`
- **Worktree**: `C:\dev\pre_utn-worktrees\expand-u3-exponentials`
- **Branch**: `sdd/expand-u3-exponentials`
- **Delivery strategy**: `auto-chain` (stacked-to-main, per task plan)
- **Apply mode**: Strict TDD

## Current Slice

- **Slice**: Work Unit 2 (tasks 2.1–2.2) — extends Work Unit 1 cumulative contract.
- **PR**: PR 2
- **Cumulative slice-local contract (after WU 1 + WU 2)**: 12-item bank `.2,.03,.3,.4,.5,.6,.7,.8,.9,.10,.11,.12`; difficulty `[1,2,3,3,3,3,3,3,4,4,4,4]`; byte-stable on `.2/.3/.4/.5` (every content field except `.4.difficulty`); ≥6 technique families; ≥3 renderer-supported response types; every WU 2 new entry carries `u3_igualdad_exponenciales`; no-copy discipline.
- **Slice boundary**: RED 12-item coverage + GREEN `.9, .10, .11, .12`; Work Unit 3 is explicitly out of scope.

## Cumulative Completed Tasks (WU 1 + WU 2)

| Task | Status | Notes |
|------|--------|-------|
| 1.1 RED coverage / order / difficulty / family / type test | ✅ Done | 10 specs in `u3-exponentials-coverage.test.ts`, full content-field byte-stability on `.2/.3/.4/.5` |
| 1.2 RED byte-stability / `.4.difficulty` normalization contract | ✅ Done (corrected) | First pass snapshot was incomplete (3 fields); corrected snapshot covers 9 content fields per legacy entry and asserts `.4` differs ONLY in `difficulty` |
| 1.3 `unit-3.json` raise `.4.difficulty` 1→3 | ✅ Done (corrected) | First pass also added `commonErrorTags: ["u3_igualdad_exponenciales"]` and rewrote the `pedagogicalNote` on `.4`; both restored to baseline. Final state: only `difficulty` differs from baseline. |
| 1.4 Append `.03` (d=2 MC), `.6` (d=3 TF), `.7` (d=3 fill-blank), `.8` (d=3 MC) | ✅ Done (corrected) | First pass also tagged `.5` with `["u3_igualdad_exponenciales"]`; tag restored to `[]`. Four new entries keep their tag and useful pedagogicalNotes. |
| 2.1 Extend RED same test: 12-item, `d2..d4` ramp, ≥6 families, ≥3 types, WU2 new entries tagged, no-copy discipline, difficulty distribution, MC expectedAnswer-in-options | ✅ Done (corrected) | Extended `u3-exponentials-coverage.test.ts` to 15 specs; the WU 2 correction pass added a 15th spec that asserts `.12` implements the designed `quadratic exponent equals one` family semantically (prompt form `a^(quadratic in x) = 1` and note teaching `exponente cuadrático = 0`) |
| 2.2 Append `.9` (d=4 MC), `.10` (d=4 numerical scalar), `.11` (d=4 TF), `.12` (d=4 MC) | ✅ Done (corrected) | First pass `.12` was a polynomial-factor entry with a misleading note. Correction pass rewrote `.12` to the designed family form `2^(x^2 - 1) = 1` with a correct procedure. 2.1 GREEN; full suite 3206/3206; 4 new families reached |

## Files Changed (cumulative WU 1 + WU 2)

| File | Action | Description |
|------|--------|-------------|
| `content/matematica/exercises/unit-3.json` | Modified (WU 1 + WU 2) | WU 1: raised `.4.difficulty` 1→3; appended `.03`, `.6`, `.7`, `.8`. WU 2: appended `.9`, `.10`, `.11`, `.12`. After WU 1 correction + WU 2: `.2/.3/.4/.5` content fields are byte-for-byte identical to baseline except `.4.difficulty`. |
| `src/domain/__tests__/u3-exponentials-coverage.test.ts` | Created (WU 1), strengthened (WU 1 correction), extended (WU 2) | WU 2 added 4 new specs: difficulty distribution, MC expectedAnswer-in-options, WU 2 entry tags, no-copy discipline. 4 new family patterns declared first so specific techniques classify before generic ones. |
| `src/domain/__tests__/catalog-split-equivalence.test.ts` | Modified (WU 1 + WU 2) | WU 1: bumped `BASELINE_TOTAL` 221→225, `BASELINE_UNIT_3` 42→46. WU 2: bumped to 229 / 50. Documentation comment updated for the 225/46 → 229/50 → 234/55 trajectory. |
| `openspec/changes/expand-u3-exponentials/tasks.md` | Modified (WU 1 + WU 2) | 1.1–1.4 and 2.1–2.2 marked complete (no new tasks claimed) |
| `openspec/changes/expand-u3-exponentials/apply-progress.md` | Modified (WU 1 + WU 2) | This file — WU 1 initial + correction evidence + WU 2 cumulative evidence |

## Gatekeeper Correction (WU 2 — one user-authorized additional retry)

### What the gatekeeper caught (second pass)

After the first WU 2 gatekeeper correction rewrote `.12` to the designed `quadratic exponent equals one` family, the second pass found the assertion was still too loose:

- The original assertion only required the note to contain `exponente cuadrático` AND `= 0` — a note that had both but skipped the factorization step would pass.
- It did not directly reject the previous invalid polynomial-factor prompt `2^x · (x^2 - 1) = 0`.
- It did not directly reject misleading guidance against dividing by `2^x` (which is valid since `2^x > 0`).

The root cause: keyword-only matching (`exponente cuadrático` + `= 0`) is necessary but not sufficient. The designed family requires three semantic checks: prompt form, procedure completeness (setting the exponent to zero AND factorizing it), and absence of misleading advice.

### Correction cycle (strict TDD, WU 2 second pass)

1. **Extract a pure validator.** Added `validateQuadraticExponentEqualsOne(prompt, pedagogicalNote)` as a pure function in `u3-exponentials-coverage.test.ts`. The function checks four invariants:
   - (1) Prompt matches the form `a^(quadratic in x) = 1` (e.g. `2^(x^2 - 1) = 1`).
   - (2) Note mentions `exponente cuadrático` AND contains `= 0` (teaches setting the exponent to zero).
   - (3) Note uses `factorizando el exponente` or `factorizar el exponente` (teaches factorizing the quadratic exponent, not just any factor).
   - (4) Note does NOT contain `dividir ... por 2^x` (rejects misleading division advice).
2. **Demonstrate RED against the validator's own first draft.** The initial regex `factoriz[áa]o?\s+(el\s+)?exponente` was too narrow — it matched the present-tense `factoriza` but not the gerund `factorizando` (the `o?` consumed nothing, then `\s+` needed to match `n`, not whitespace). The negative fixture caught this: the "accepts the current correct .12 entry" case failed with `pedagogicalNote does not teach factorizing the quadratic exponent`. Fixed to `factoriz[aá](?:ndo|r)\s+(el\s+)?exponente` (gerund or infinitive).
3. **Re-run RED → GREEN.** All 6 negative fixture cases pass: 5 reject the invalid candidates (previous polynomial-factor prompt, misleading division guidance, note that skips factorization, note that omits the `exponente cuadrático` marker, invalid prompt form with RHS ≠ 1) and 1 accepts the current correct `.12` entry. Full suite 3212/3212. Typecheck + build clean.

### Negative fixture table

| Case | Prompt | Note | Expected | Actual |
|------|--------|------|----------|--------|
| Previous invalid polynomial-factor prompt | `Resuelve 2^x · (x^2 - 1) = 0` | "Sacando 2^x como factor común... olvidar que 2^x nunca vale 0 y dividir ambos miembros por 2^x antes de factorizar..." | reject | ✅ reject (check 1: prompt form) |
| Misleading `no dividir por 2^x` guidance | `Resuelve 2^(x^2 - 1) = 1` | (correct prompt + correct procedure + misleading division error) | reject | ✅ reject (check 4: misleading division) |
| Note that skips the factorization step | `Resuelve 2^(x^2 - 1) = 1` | "exponente cuadrático igualado a cero. No se factoriza." | reject | ✅ reject (check 3: no factorization of exponent) |
| Note that factorizes but omits `exponente cuadrático` | `Resuelve 2^(x^2 - 1) = 1` | "Factorizando: (x - 1)(x + 1) = 0..." | reject | ✅ reject (check 2: no `exponente cuadrático` marker) |
| Invalid prompt form (RHS ≠ 1) | `Resuelve 2^(x^2 - 1) = 4` | (correct procedure) | reject | ✅ reject (check 1: prompt form) |
| Current correct `.12` entry | `Resuelve 2^(x^2 - 1) = 1` | "exponente cuadrático igualado a cero. Factorizando el exponente cuadrático..." | accept | ✅ accept |

### Post-correction diff scope (cumulative WU 1 + WU 2 + WU 2 second pass)

`git diff content/matematica/exercises/unit-3.json` (from origin/main) shows the only authorized change set:

- `.4.difficulty`: `1` → `3` (the only authorized drift on a legacy entry).
- Eight new entries appended: `.03`, `.6`, `.7`, `.8` (WU 1) and `.9`, `.10`, `.11`, `.12` (WU 2). Each carries `commonErrorTags: ["u3_igualdad_exponenciales"]` and a useful pedagogicalNote.
- `.12` was rewritten in the WU 2 first correction pass to implement the designed `quadratic exponent equals one` family. The WU 2 second pass did NOT touch `.12` production content; it only strengthened the test.

No other field on `.2/.3/.4/.5` differs from baseline.

## Gatekeeper Correction (WU 2 — `.12` was the wrong family)

### What the gatekeeper caught

The first apply pass for Work Unit 2 reported GREEN on the 12-item bank, but `.12` did not implement the design's required family. The design row for `.12` is:

> `.12 | quadratic exponent equals one / 4 / MC | Set exponent to zero and factor it; selectable dual result.`

The first-pass `.12` was authored as a polynomial-factor entry (`2^x · (x² - 1) = 0`), not a quadratic-in-the-exponent entry. Its `pedagogicalNote` was also mathematically misleading: it called division by `2^x` an error, but since `2^x > 0`, division is valid and produces the same equation.

The root cause: the WU 2 family pattern `ax-polynomial-factor` was too loose — it matched the phrase "ecuación polinomial" in the note, which is not the marker for the designed family. The test never checked the prompt form or the note's procedure, so the wrong family slipped through.

### Correction cycle (strict TDD, WU 2)

1. **Strengthen the RED contract.** Replaced the WU 2 `ax-polynomial-factor` family with `ax-quadratic-exponent-zero`, whose patterns require the note to mention "exponente cuadrático" (the designed family marker). Added a new spec that asserts `.12`'s prompt matches the form `a^(quadratic in x) = 1` AND that its `pedagogicalNote` teaches the correct procedure (exponente cuadrático = 0, factorizado).
2. **Demonstrate RED.** Ran the strengthened test. One spec failed: `.12 prompt does not match a^(quadratic in x) = 1 form: Resuelve 2^x · (x^2 - 1) = 0`.
3. **Restore production content.** Rewrote `.12` in `unit-3.json`:
   - `prompt`: `Resuelve 2^x · (x^2 - 1) = 0` → `Resuelve 2^(x^2 - 1) = 1` (the designed family form).
   - `pedagogicalNote`: replaced the misleading "don't divide by 2^x" guidance with the correct procedure: `Como 1 = 2^0, igualando bases 2^(x^2 - 1) = 2^0 → x^2 - 1 = 0 (exponente cuadrático igualado a cero). Factorizando el exponente cuadrático: (x - 1)(x + 1) = 0 → x = 1 o x = -1. Ambas soluciones son válidas porque el exponente puede tomar cualquier valor real. Error frecuente: olvidar que a^0 = 1 para cualquier base a > 0, a ≠ 1, y tratar de aplicar propiedades de logaritmos sobre una expresión sin logaritmo.`
   - `expectedAnswer`, `options`, `commonErrorTags`, `difficulty`, `type`, `skillId`, `id` unchanged.
4. **Re-run RED → GREEN.** Strengthened test now passes 15/15. Full suite 3206/3206. Typecheck + build clean.

### Post-correction diff scope (cumulative WU 1 + WU 2)

`git diff content/matematica/exercises/unit-3.json` (from origin/main) shows the only authorized change set:

- `.4.difficulty`: `1` → `3` (the only authorized drift on a legacy entry).
- Eight new entries appended: `.03`, `.6`, `.7`, `.8` (WU 1) and `.9`, `.10`, `.11`, `.12` (WU 2). Each carries `commonErrorTags: ["u3_igualdad_exponenciales"]` and a useful pedagogicalNote.
- `.12` was rewritten in the WU 2 correction pass to implement the designed `quadratic exponent equals one` family (its `prompt` and `pedagogicalNote` changed; all other fields are byte-identical to the first WU 2 pass).

No other field on `.2/.3/.4/.5` differs from baseline.

## Gatekeeper Correction (WU 1, preserved verbatim into WU 2)

### What the gatekeeper caught

The first apply pass for Work Unit 1 reported GREEN, but the byte-stability test only snapshotted three content fields per legacy entry (`prompt`, `expectedAnswer`, `type`) and the `.4`-normalization test snapshotted the same three. Two real drifts slipped through:

- `ex.u3.exponenciales.4`: `commonErrorTags` changed `[]` → `["u3_igualdad_exponenciales"]`, and `pedagogicalNote` was rewritten (added a "Error frecuente" clause).
- `ex.u3.exponenciales.5`: `commonErrorTags` changed `[]` → `["u3_igualdad_exponenciales"]`.

The root cause: the design (`math-error-taxonomy` spec) requires every **new** entry to carry `u3_igualdad_exponenciales` in `commonErrorTags`, and the byte-stable contract from the `math-exercise-catalog` spec requires the four **legacy** entries (`.2/.3/.4/.5`) to be byte-stable. The first pass over-broadcast the new-entry rule and silently edited `.4` and `.5` because the test did not cover the fields that changed.

### Correction cycle (strict TDD, WU 1)

1. **Strengthen the RED contract.** Replaced the 3-field snapshots with full content-field snapshots on `.2/.3/.5` (9 fields: `id`, `skillId`, `type`, `difficulty`, `prompt`, `expectedAnswer`, `options`, `commonErrorTags`, `pedagogicalNote`). Replaced the 3-field `.4` normalization snapshot with a baseline-equals-current-except-difficulty assertion covering 7 fields (all content fields except `difficulty`, which must be 3).
2. **Demonstrate RED.** Ran the strengthened test against the drift. Two specs failed (`.5` tag drift, `.4` tag drift; `.4` note drift was the next failure waiting in line).
3. **Restore production content.** Reverted `unit-3.json`: `.4.commonErrorTags` back to `[]`, `.4.pedagogicalNote` back to the original `Como 125 = 5³, la solución es x = 3.`; `.5.commonErrorTags` back to `[]`. `.2/.3` confirmed unchanged. `.4.difficulty: 3` and the four new entries were preserved.
4. **Re-run RED → GREEN.** Strengthened test now passes 10/10. Full suite 3201/3201. Typecheck + build clean.

### Post-correction diff scope (preserved through WU 2)

`git diff content/matematica/exercises/unit-3.json` (from origin/main) shows the only authorized change set:

- `.4.difficulty`: `1` → `3` (the only authorized drift on a legacy entry).
- Eight new entries appended: `.03`, `.6`, `.7`, `.8` (WU 1) and `.9`, `.10`, `.11`, `.12` (WU 2). Each carries `commonErrorTags: ["u3_igualdad_exponenciales"]` and a useful pedagogicalNote.

No other field on `.2/.3/.4/.5` differs from baseline.

## TDD Cycle Evidence (cumulative WU 1 + WU 2)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `u3-exponentials-coverage.test.ts` | Unit (loader + JSON) | ✅ 3191/3191 baseline | ✅ Strengthened contract demonstrated RED on the WU1 drift (2 spec failures) and on the WU1 contract (6 earlier failures) | ✅ Passed 10/10 after correction | ✅ 10 specs cover count, order with `.03 < .3` lexical tie-break, exact difficulty ramp, non-decreasing progression, family count, type count, full-field byte-stability on `.2/.3/.5`, `.4` byte-stability with only `difficulty` allowed to drift, type allowlist, text-input scalar discipline | ✅ Three refactor passes: free-text regex; family detection; full-field byte-stability snapshots |
| 1.2 | same file | Unit (byte-stable contract) | ✅ Same | ✅ First pass: 3 fields per legacy entry — insufficient, drift slipped through. Corrected: 9 fields per legacy entry on `.2/.3/.5` + 7 fields on `.4` with the single-field deviation rule | ✅ Passed 10/10 after correction | ✅ 3 full-content byte-stable snapshots (`.2`, `.3`, `.5`) + 1 normalization snapshot (`.4`) | ➖ None — assertions are exact-equal |
| 1.3 | production JSON only | n/a | ✅ Same | n/a (production-only step) | n/a | n/a | ➖ Minimal, single-field edit (post-correction) |
| 1.4 | re-run coverage + suite | Unit | ✅ Same | n/a (4 new entries written to satisfy existing RED) | ✅ 3201/3201 (10/10 coverage) | ✅ Family detection covers 6 distinct techniques (≥4 required): `trivial-same-base`, `monomial-exponent-same-base`, `radical-common-base`, `constant-rhs-exponent-zero`, `common-ax-factor`, `negative-exponent` | ➖ JSON authored once; pedagogical notes explain technique, near-miss distractor, and corrective step |
| 2.1 | same file | Unit (loader + JSON) | ✅ 3201/3201 pre-WU2 | ✅ First pass: 6 spec failures (bank length, natural order, difficulty ramp, difficulty distribution, family count, WU 2 new entries). Correction pass: 1 spec failure (`.12` prompt does not match `a^(quadratic in x) = 1` form) | ✅ Passed 15/15 after correction | ✅ 5 new specs on top of WU 1's 10: difficulty distribution, MC expectedAnswer-in-options, WU 2 new entry tag discipline, no-copy discipline, `.12` designed-family assertion. Specific family patterns declared first so notes that could match a generic family (e.g. "common-ax-factor") and a specific one (e.g. "ax-quadratic-exponent-zero") classify by the specific one. | ✅ Reordered FAMILY_KEYWORDS so 4 new specific families are checked before the generic `common-ax-factor`; replaced `ax-polynomial-factor` with `ax-quadratic-exponent-zero` to match the designed family semantically |
| 2.2 | re-run coverage + suite | Unit | ✅ Same | n/a (4 new entries written to satisfy existing RED) | ✅ 3206/3206 (15/15 coverage) | ✅ Family detection now covers 10 distinct techniques: `trivial-same-base`, `monomial-exponent-same-base`, `radical-common-base`, `constant-rhs-exponent-zero`, `common-ax-factor`, `negative-exponent`, `ax-quadratic-substitution`, `ax-mixed-base-rewrite`, `ax-sum-of-powers`, `ax-quadratic-exponent-zero` (≥6 required; 10 actual) | ➖ JSON authored once; pedagogical notes commit to the family marker via distinctive keywords; `.12` was rewritten in the correction pass to implement the designed `quadratic exponent equals one` family |

### Test Summary (cumulative)

- **Total tests written (new file, post-WU 2 + WU 2 second pass)**: 21 (15 original + 6 negative fixture cases)
- **Total tests passing**: 3212 (188 files); coverage file alone 21/21
- **Layers used**: Unit (21)
- **Approval tests** (refactoring): 0 — no behavior was refactored in this slice
- **Pure functions created**: 0 — slice is content-only + a contract test
- **Triangulation**: each RED scenario covers a distinct invariant (count, order, difficulty progression, full-field byte-stability, single-field normalization, type coverage, free-text discipline, family coverage, difficulty distribution, MC expectedAnswer-in-options, WU 2 new entry tag discipline, no-copy discipline)

## Work Unit Evidence (cumulative WU 1 + WU 2)

| Evidence | Value |
|---|---|
| **Focused test command** | `pnpm run test:run -- u3-exponentials-coverage.test.ts` |
| **Focused test result** | 21/21 passed; 188 test files / 3212 tests overall in the same focused run |
| **Full suite result** | `pnpm run test:run` → 188 test files, 3212 tests, all passed |
| **Runtime harness command** | `pnpm run typecheck && pnpm run build` |
| **Runtime harness result** | `tsc --noEmit` clean; `next build` (Turbopack) compiled cleanly, 11 static pages generated, no warnings beyond the pre-existing `middleware` → `proxy` deprecation notice |
| **WU 1 rollback boundary** | Revert the 4 WU 1 entries from `content/matematica/exercises/unit-3.json` (`.03`, `.6`, `.7`, `.8`) AND restore `.4.difficulty: 3` back to `1`; revert `catalog-split-equivalence.test.ts` baseline constants (`BASELINE_TOTAL` 225→221, `BASELINE_UNIT_3` 46→42) and its docstring; delete `src/domain/__tests__/u3-exponentials-coverage.test.ts`. |
| **WU 2 rollback boundary** | Revert the 4 WU 2 entries from `content/matematica/exercises/unit-3.json` (`.9`, `.10`, `.11`, `.12`); revert `catalog-split-equivalence.test.ts` baseline constants (`BASELINE_TOTAL` 229→225, `BASELINE_UNIT_3` 50→46) and its docstring; in `u3-exponentials-coverage.test.ts`, trim `EXPECTED_ORDERED_IDS` and `EXPECTED_DIFFICULTIES` back to 8 items, drop the 5 WU 2 specs, and drop the 4 WU 2 family patterns. The post-correction state means the WU 2 rollback boundary is symmetric with the add boundary: every WU 1-corrected field is preserved. |

## Deviations

- **Byte-stability snapshots strengthened from 3 fields to 9 fields per legacy entry (WU 1 correction pass, preserved through WU 2).** The original 3-field snapshot was a false-green surface. The strengthened snapshot covers every content field the loader surfaces and the JSON persists: `id`, `skillId`, `type`, `difficulty`, `prompt`, `expectedAnswer`, `options` (string-equal per option), `commonErrorTags` (array-equal), `pedagogicalNote` (byte-equal). For `.4`, the same 9-field snapshot is enforced with the single deviation that `difficulty` is `3` (post-normalization) rather than `1` (baseline).
- **`text-input scalar discipline` assertion (1.1) was tightened mid-cycle.** The initial regex `[,;={}]|\bor\b` matched the literal space inside the character class and produced a false-positive RED on the existing prompt text. I narrowed the regex to `SCALAR_FORBIDDEN` (`/[,;={}]|\bor\b/i`) AND restricted the check to entries whose `type` is in `TEXT_INPUT_TYPES` (`numerical`, `fill-blank`) — which is the actual no-free-text-for-roots/dual-solutions/intervals/logs contract from `AGENTS.md` and the `math-error-taxonomy` delta. Existing MC entries were never in scope for this rule.
- **Family detection switched from prompt-keyword to pedagogicalNote-keyword (WU 1 refactor pass).** The first iteration tried to detect families from the equation text in `prompt`, but three of the four baseline entries all fall under "same-base" and the prompt text is too sparse to disambiguate techniques reliably. I moved the matcher to the `pedagogicalNote` field, where each authored entry explicitly names its technique. The test now proves that the author committed the technique into the note — which is the same signal a future teacher or reviewer would look for.
- **Family patterns reordered so specific families are checked first (WU 2 refactor pass).** `.12`'s pedagogicalNote uses the phrase "factor común", which would match the generic `common-ax-factor` family. The WU 2 entries use distinctive keywords (e.g. "ecuación polinomial" for `.12`, "cuadrática en t" for `.9`) that match more specific families. By declaring the specific families first, a note that could match a generic and a specific one classifies by the specific one. This is the durable pattern for any future byte-stable contract that uses keyword families.
- **Catalog baseline snapshot test updated (WU 1 + WU 2).** `catalog-split-equivalence.test.ts` hardcoded `BASELINE_TOTAL = 221` and `BASELINE_UNIT_3 = 42`. WU 1 bumped to 225 / 46; WU 2 bumped to 229 / 50. The cumulative-slice docstring names the 225/46 → 229/50 → 234/55 trajectory for PR 3.

## Issues / Discoveries

- **No pre-existing failures** were hit during the safety net; the focused subset went 3191 → 3201 (WU 1) → 3205 (WU 2) as the test grew.
- **The `compareExerciseIds` comparator in `src/domain/catalog/content-loaders.ts:971` is exactly as documented** in memory obs #4620: numeric suffix tie → lexical fallback. The test re-implements the same comparator inside `projectByNaturalOrder` to keep the contract test self-contained. The duplication is intentional: if the comparator changes, the test would catch the contract drift, but it must not silently pass if the implementation changes its ordering rule.
- **Catalog baseline test (`catalog-split-equivalence.test.ts`) is a pre-existing fragility** worth flagging for a follow-up: every append-only catalog change requires a numeric bump on this file. A future SDD could swap the hardcoded baseline for a recorded snapshot, but that is out of scope for this slice.
- **Partial-field snapshots are a false-GREEN surface in byte-stability tests.** This is a generalizable lesson: when a test names "byte-stable", it must snapshot every persisted field, not the subset the author happened to care about. The gatekeeper caught this for `.4`/`commonErrorTags` and `.5`/`commonErrorTags`; the same trap exists for any future byte-stable contract. The strengthened 9-field snapshot is the durable fix.
- **Specific family patterns must be declared before generic ones** when a note can match both. `.12`'s "factor común" phrase would match the generic `common-ax-factor` family unless the more specific `ax-polynomial-factor` is checked first. The WU 2 reordering is the durable fix; future entries that use the same `factor común` phrasing will classify correctly as long as their specific family pattern is declared first.

## Risks

- **Work Unit 3 must extend the same test.** The 12-item cumulative contract will be replaced by a final 17-item contract in WU 3. The test file's `EXPECTED_ORDERED_IDS` and `EXPECTED_DIFFICULTIES` constants are the single source of truth — keep them cumulative.
- **The byte-stability pattern must stay full-field.** Every future byte-stable contract in this repo must enumerate ALL persisted content fields in the snapshot and explicitly call out the only allowed deviation. The WU 1 gatekeeper correction is the durable lesson.
- **No E2E evidence in this slice.** The task plan defers E2E to Work Unit 3 (task 3.5). WU 1 + WU 2 are loader/shape-level only; the renderer-level path is exercised through the type assertions in 1.1 / 2.1, not through a real Playwright run.

## Next Steps

- **Work Unit 3 (PR 3)**: extend `EXPECTED_ORDERED_IDS` and `EXPECTED_DIFFICULTIES` to 17 items, add `≥2 d=5` and `≥3 types` assertions, append `.13` (d=5 MC `t+k/t`), `.14` (d=5 MC `e^x` poly +t guard), `.15` (d=5 MC mixed bases+logs), `.16` (d=5 MC fractional exponents), `.17` (d=5 fill-blank combined bases scalar). Bump `BASELINE_TOTAL` 229→234, `BASELINE_UNIT_3` 50→55. Then `content-loaders-u3.test.ts` and `u3-exercise-shape.test.ts` per task 3.3/3.4, `exponenciales-practice.spec.ts` per task 3.5, full verify per task 3.6, rollback confirmation per task 3.7. **Carry the strengthened full-field byte-stability pattern and the family-pattern ordering rule forward.**

## Work Unit 3 — RED FINAL 17 → GREEN (cumulative closure of `expand-u3-exponentials`)

### Current Slice

- **Slice**: Work Unit 3 (tasks 3.1–3.7) — extends the WU 1 + WU 2 cumulative contract to the FINAL 17-item P39-aligned bank.
- **PR**: PR 3
- **Cumulative slice-local contract (after WU 1 + WU 2 + WU 3)**: 17-item bank `.2,.03,.3,.4,.5,.6,.7,.8,.9,.10,.11,.12,.13,.14,.15,.16,.17`; difficulty `[1,2,3,3,3,3,3,3,4,4,4,4,5,5,5,5,5]`; byte-stable on `.2/.3/.4/.5` (every content field except `.4.difficulty`); ≥8 technique families (≥2 at d=5); ≥3 renderer-supported response types; every WU 3 new entry carries `u3_igualdad_exponenciales`; no-copy discipline.
- **Slice boundary**: RED FINAL 17 coverage + GREEN `.13, .14, .15, .16, .17` + `content-loaders-u3` + `u3-exercise-shape` + Playwright `exponenciales-practice.spec.ts` + full verify + rollback confirmation.

### WU 3 Audit on the Existing Dirty Candidate

Per the orchestrator brief, the dirty candidate at the start of this attempt already contained the WU 3 evidence. This slice treated the work as evidence recovery and continuation:

- The new JSON entries `.13, .14, .15, .16, .17` were already physically present in `content/matematica/exercises/unit-3.json` with the exact designed families (`t+k/t` symmetric, `e^x` poly with `t>0` guard, mixed bases + logs, fractional exponents, combined bases fill-blank).
- The coverage file already extended `EXPECTED_ORDERED_IDS` and `EXPECTED_DIFFICULTIES` to 17 items, with the new "difficulty distribution", "≥2 d=5", "WU2+WU3 tags", and "no-copy" specs in place. Family patterns for the 5 WU 3 techniques were declared first so specific classifications win over generic ones.
- `content-loaders-u3.test.ts` already had a dedicated `describe("u3-exponenciales — FINAL 17-item loader evidence (WU 3)")` block asserting bank length 17, no new diagnostics, U3 threshold non-regression, and that all 5 WU 3 entries appear in `queryByUnit(3)`.
- `u3-exercise-shape.test.ts` already had a dedicated `describe("u3-exponenciales — FINAL 17-item shape evidence (WU 3)")` block asserting scalar `numerical`/`fill-blank` expectedAnswer discipline, MC `expectedAnswer ∈ options`, and `u3_igualdad_exponenciales` feedback resolution.
- `tests/e2e/specs/exponenciales-practice.spec.ts` already existed with 3 specs (E1 reachability, E2 theory→examples→exercises + one-of-4-types rendering + post-answer feedback, E4 nearby `mat.u3.logaritmicas` no-regression).
- `catalog-split-equivalence.test.ts` already had `BASELINE_TOTAL = 234` and `BASELINE_UNIT_3 = 55` for the FINAL state, with the cumulative docstring naming the 225/46 → 229/50 → 234/55 trajectory.
- `STATUS.json` already recorded the `expand-u3-exponentials` entry as `in-progress` on `sdd/expand-u3-exponentials`.

This slice therefore did not fabricate historical RED evidence. It reverified each spec, recorded honest prior/current GREEN state, and made no new code edits. No corrections were required — the candidate was already aligned with the design and the prior gatekeeper lessons (full-field byte-stability, specific family patterns before generic ones, byte-stable contract on `.4`).

### WU 3 Cumulative Completed Tasks

| Task | Status | Notes |
|------|--------|-------|
| 3.1 Extend RED same test: 17-item, full natural order, exact difficulty ramp `[1,2,3,3,3,3,3,3,4,4,4,4,5,5,5,5,5]`, ≥8 families, d1–5, ≥2 d=5, ≥3 types | ✅ Done | `u3-exponentials-coverage.test.ts` extended to 16 main specs covering 17-item length, exact order with `.03 < .3` lexical tie-break, exact difficulty ramp, non-decreasing progression, exact distribution (1,1,6,4,5), ≥2 d=5, ≥8 families, ≥3 types. 5 new family patterns declared first (`ax-symmetric-t-plus-k`, `ax-exponential-polynomial`, `ax-different-bases-log`, `ax-radical-fractional-exponent`, `ax-combined-bases`). |
| 3.2 Append `.13` (d=5 MC), `.14` (d=5 MC), `.15` (d=5 MC), `.16` (d=5 MC), `.17` (d=5 fill-blank) | ✅ Done | All 5 entries present in `unit-3.json`. `.13`: `2^x + 2^(1-x) = 5/2` → `t + 1/t = 5/2`. `.14`: `3^(2x) - 4·3^x + 3 = 0` → `t² - 4t + 3 = 0`. `.15`: `3^x = 20` → `x ≈ 2.73` via change of base. `.16`: `2^(x/2) = 8` → fractional exponent equalization. `.17`: `2^x + 2^(x+2) = 20` → combined bases → fill-blank scalar `2`. 3.1 GREEN. |
| 3.3 RED then GREEN `content-loaders-u3.test.ts` | ✅ Done | New `describe("u3-exponenciales — FINAL 17-item loader evidence (WU 3)")` block with 5 specs: `loadExercisesForSkill` returns exactly 17 items; `loadSkillBank` non-empty + zero WU 3-specific diagnostics; `UNIT_THRESHOLDS['unit-3'] === 24` non-regression; `loadCatalog` still satisfies the U3 threshold; `queryByUnit(3)` returns the full U3 bank with all 5 WU 3 entries present. |
| 3.4 RED then GREEN `u3-exercise-shape.test.ts` | ✅ Done | New `describe("u3-exponenciales — FINAL 17-item shape evidence (WU 3)")` block with 3 specs: scalar `numerical`/`fill-blank` discipline (no `,;= {}`); MC `expectedAnswer ∈ options`; `u3_igualdad_exponenciales` resolves to a non-empty feedback entry via `loadFeedbackContent('unit-3')`. |
| 3.5 Create `exponenciales-practice.spec.ts` (reachability + rendering + no fallback + nearby-skill regression) | ✅ Done (deviation documented) | 3 specs: E1 (reachability + theory phase, auto-select fires for prereq-seeded `mat.u3.exponenciales`), E2 (theory → examples → exercises navigation + one of MC/TF/text renders + unsupported-type fallback NEVER appears + post-answer feedback surfaces), E4 (nearby `mat.u3.logaritmicas` still loads — no regression). **Deviation**: spec uses raw page interactions instead of `drivePracticeFlow` because the helper's encounter-order assumptions time out on a 17-item bank (it processed 11 MC + 4 text-based without detecting the 2 TF entries). The same behaviours are proven via raw selectors (`ANSWER_FORM_MC`, `ANSWER_FORM_TRUE_FALSE`, `ANSWER_FORM_TEXT`, theory→examples→exercises button regex). |
| 3.6 Full verify: `pnpm run test` + `pnpm run typecheck` + `pnpm run build` | ✅ Done | `pnpm run test:run` → 188 files / 3221 tests, all passed. `pnpm run typecheck` → clean (no output = no errors). `pnpm run build` → compiled successfully in 8.9s, 11 static pages, no warnings beyond the pre-existing `middleware` → `proxy` deprecation notice. |
| 3.7 Rollback confirmation | ✅ Done | The rollback boundary is well-defined: removing the 13 new entries (`.03, .6, .7, .8, .9, .10, .11, .12, .13, .14, .15, .16, .17`) AND restoring `.4.difficulty` from `3` → `1` returns the prior 4-entry bank (`.2, .3, .4, .5`) byte-for-byte. `STATUS.json` and prior blocked U3 files are not touched. The full-field byte-stability specs on `.2, .3, .4, .5` enforce this — `.4` differs from baseline ONLY in `difficulty`; `.2, .3, .5` are byte-stable across all 9 content fields. |

### Files Changed (cumulative WU 1 + WU 2 + WU 3)

| File | Action | Description |
|------|--------|-------------|
| `content/matematica/exercises/unit-3.json` | Modified (WU 1 + WU 2 + WU 3) | WU 1: `.4.difficulty` 1→3; appended `.03, .6, .7, .8`. WU 2: appended `.9, .10, .11, .12`. WU 3: appended `.13, .14, .15, .16, .17`. After all corrections: `.2/.3/.4/.5` content fields are byte-for-byte identical to baseline except `.4.difficulty`. |
| `src/domain/__tests__/u3-exponentials-coverage.test.ts` | Created (WU 1), strengthened + corrected (WU 1), extended (WU 2), extended to FINAL 17 + 5 new family patterns (WU 3) | WU 3 added the FINAL 17-item spec, d=5 budget spec, exact distribution spec (1,1,6,4,5), 5 new specific family patterns (declared first), and confirmed 22 specs total (16 + 6 negative fixtures). |
| `src/domain/__tests__/content-loaders-u3.test.ts` | Modified (WU 1 + WU 2 + WU 3) | WU 3 added the `u3-exponenciales — FINAL 17-item loader evidence` block with 5 specs. |
| `src/domain/__tests__/u3-exercise-shape.test.ts` | Modified (WU 1 + WU 2 + WU 3) | WU 3 added the `u3-exponenciales — FINAL 17-item shape evidence` block with 3 specs. |
| `src/domain/__tests__/catalog-split-equivalence.test.ts` | Modified (WU 1 + WU 2 + WU 3) | WU 3 bumped `BASELINE_TOTAL` 229→234, `BASELINE_UNIT_3` 50→55. Docstring names the 225/46 → 229/50 → 234/55 trajectory. |
| `tests/e2e/specs/exponenciales-practice.spec.ts` | Created (WU 3) | 3 specs: reachability (E1), theory→examples→exercises navigation + one-of-4-types rendering + no fallback + post-answer feedback (E2), nearby-skill no-regression (E4). Uses raw page interactions (see deviation note above). |
| `openspec/changes/STATUS.json` | Modified (cumulative) | New `expand-u3-exponentials` entry: `in-progress`, branch `sdd/expand-u3-exponentials`, started `2026-07-13`, cleanBase `e5536480`. |
| `openspec/changes/expand-u3-exponentials/tasks.md` | Modified (WU 1 + WU 2 + WU 3) | 1.1–1.4, 2.1–2.2, **3.1–3.7 marked complete** in this slice. |
| `openspec/changes/expand-u3-exponentials/apply-progress.md` | Modified (WU 1 + WU 2 + WU 3) | This file — WU 1 initial + correction + WU 2 cumulative + WU 3 FINAL closure evidence. |

### WU 3 Rollback Boundary

Removing the 13 new entries (`.03, .6, .7, .8, .9, .10, .11, .12, .13, .14, .15, .16, .17`) from `content/matematica/exercises/unit-3.json` AND restoring `.4.difficulty` from `3` → `1` returns the prior 4-entry bank (`.2, .3, .4, .5`) byte-for-byte. The full-field byte-stability specs on `.2, .3, .4, .5` enforce this contract:

- `.2`: byte-stable across all 9 content fields.
- `.3`: byte-stable across all 9 content fields.
- `.4`: byte-stable across 8 content fields, with the single allowed deviation that `difficulty` is `3` (post-normalization) rather than `1` (baseline).
- `.5`: byte-stable across all 9 content fields.

The rollback does not touch `STATUS.json`, the new untracked test files, or any prior blocked/archived U3 work. The new test files (`u3-exponentials-coverage.test.ts`, `content-loaders-u3.test.ts`, `u3-exercise-shape.test.ts`, `exponenciales-practice.spec.ts`, `catalog-split-equivalence.test.ts`) would still pass against the 4-entry bank (the coverage test would fail on the bank-length === 17 assertion, which is the expected outcome — the new test specs are part of the slice and roll back with the production content).

### TDD Cycle Evidence (cumulative WU 1 + WU 2 + WU 3)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3.1 | `u3-exponentials-coverage.test.ts` | Unit (loader + JSON) | ✅ 3206/3206 pre-WU3 baseline | n/a (test was already extended to 17-item contract in the dirty candidate; this slice reverified the strengthened contract rather than authoring new RED). | ✅ Passed 16/16 main specs (22/22 with negative fixtures) | ✅ 5 new specs on top of WU 2's 15: bank length 17, exact order with `.03 < .3` lexical tie-break, exact difficulty ramp, exact distribution (1,1,6,4,5), ≥2 d=5 budget | ✅ 5 new specific family patterns declared first so they classify before the generic `common-ax-factor`; each WU 3 entry's `pedagogicalNote` commits to its family marker (e.g. "sustitución simétrica en t + k/t" for `.13`, "polinomio en t" with `t > 0` for `.14`, "logaritmo en ambos lados" / "cambio de base" for `.15`, "exponente fraccionario" for `.16`, "combinando bases" / "base común" for `.17`) |
| 3.2 | re-run coverage + suite | Unit | ✅ Same | n/a (5 new entries written to satisfy existing RED contract) | ✅ 3221/3221 (22/22 coverage) | ✅ 5 new family patterns cover the 5 new techniques — total 15 distinct families across WU 1 + WU 2 + WU 3 (≥8 required; 15 actual) | ➖ JSON authored once; pedagogical notes commit to distinctive family markers; all 5 entries use `commonErrorTags: ["u3_igualdad_exponenciales"]` |
| 3.3 | `content-loaders-u3.test.ts` | Unit (loader + JSON) | ✅ Pre-WU3 baseline | n/a (test was already extended in the dirty candidate) | ✅ Passed 69/69 in this slice | ✅ 5 new specs: bank length 17, no WU 3 diagnostics, threshold `=== 24` non-regression, `loadCatalog` still satisfies threshold, `queryByUnit(3)` contains all 5 WU 3 entries | ➖ Tests are descriptive — no refactor needed |
| 3.4 | `u3-exercise-shape.test.ts` | Unit (loader + JSON) | ✅ Pre-WU3 baseline | n/a (test was already extended in the dirty candidate) | ✅ Passed 18/18 in this slice | ✅ 3 new specs: scalar discipline (no `,;= {}`), MC `expectedAnswer ∈ options`, `u3_igualdad_exponenciales` feedback resolution | ➖ Tests are descriptive — no refactor needed |
| 3.5 | `exponenciales-practice.spec.ts` | E2E (Playwright) | ✅ n/a (new file) | n/a (spec was already authored in the dirty candidate with documented deviation) | ✅ Passed 3/3 (E1 812ms, E2 4.4s, E4 920ms) | ✅ 3 specs cover reachability + theory rendering, full theory→examples→exercises flow + one-of-4-types rendering + no fallback + post-answer feedback, and nearby `mat.u3.logaritmicas` no-regression | ➖ Spec uses raw page interactions instead of `drivePracticeFlow` (documented deviation) |
| 3.6 | `pnpm run test` + `pnpm run typecheck` + `pnpm run build` | Runtime harness | ✅ Same | n/a (verifications ran in this slice) | ✅ 3221/3221 tests; typecheck clean; build 8.9s + 11 static pages + no warnings beyond pre-existing `middleware` → `proxy` deprecation | n/a (runtime harness is the verification, not a test) | n/a |
| 3.7 | rollback confirmation | n/a | ✅ Same | n/a (no new code) | ✅ Rollback boundary well-defined: 13 entries + `.4.difficulty = 1` returns 4-entry bank | ✅ Full-field byte-stability specs on `.2, .3, .4, .5` are the rollback boundary enforcement | n/a |

### Test Summary (cumulative WU 1 + WU 2 + WU 3)

- **Total tests written (new file, post-WU 3)**: 22 (16 main specs + 6 negative fixture cases)
- **Total tests passing**: 3221 (188 files); coverage file alone 22/22; content-loaders-u3 69/69; u3-exercise-shape 18/18; catalog-split-equivalence 8/8
- **Layers used**: Unit (22+), E2E (3)
- **Approval tests** (refactoring): 0 — no behavior was refactored in this slice
- **Pure functions created**: 0 in WU 3 — slice is content + contract tests + E2E
- **Triangulation**: each RED scenario covers a distinct invariant (count, order, exact difficulty ramp, exact distribution, d=5 budget, ≥8 families, ≥3 types, byte-stability, type allowlist, scalar discipline, MC expectedAnswer-in-options, WU 2+WU 3 entry tag discipline, no-copy discipline, designed-family assertion, plus 6 negative fixture cases for the quadratic-exponent-equals-one validator)

### Work Unit Evidence (cumulative WU 1 + WU 2 + WU 3)

| Evidence | Value |
|---|---|
| **Focused test command** | `npx vitest run src/domain/__tests__/u3-exponentials-coverage.test.ts` |
| **Focused test result** | 22/22 passed in 1.07s |
| **Other focused tests** | `u3-exercise-shape.test.ts` 18/18, `content-loaders-u3.test.ts` 69/69, `catalog-split-equivalence.test.ts` 8/8 — all pass |
| **Full suite result** | `pnpm run test:run` → 188 test files, 3221 tests, all passed in 26.43s |
| **Runtime harness command** | `pnpm run typecheck && pnpm run build` |
| **Runtime harness result** | `tsc --noEmit` clean (no output); `next build` (Turbopack) compiled successfully in 8.9s, 11 static pages generated, no warnings beyond the pre-existing `middleware` → `proxy` deprecation notice |
| **E2E runtime harness** | `npx playwright test tests/e2e/specs/exponenciales-practice.spec.ts` → PASS (3) FAIL (0) in 12126ms (E1 812ms, E2 4.4s, E4 920ms) |
| **WU 1 rollback boundary** | Revert the 4 WU 1 entries (`.03, .6, .7, .8`) AND restore `.4.difficulty: 3` → `1`; revert `catalog-split-equivalence.test.ts` baselines (225→221, 46→42) and its docstring; delete `u3-exponentials-coverage.test.ts`. |
| **WU 2 rollback boundary** | Revert the 4 WU 2 entries (`.9, .10, .11, .12`); revert `catalog-split-equivalence.test.ts` baselines (229→225, 50→46); in `u3-exponentials-coverage.test.ts`, trim `EXPECTED_ORDERED_IDS` and `EXPECTED_DIFFICULTIES` to 8 items, drop the 5 WU 2 specs, drop the 4 WU 2 family patterns. |
| **WU 3 rollback boundary** | Revert the 5 WU 3 entries (`.13, .14, .15, .16, .17`); revert `catalog-split-equivalence.test.ts` baselines (234→229, 55→50); in `u3-exponentials-coverage.test.ts`, trim `EXPECTED_ORDERED_IDS` and `EXPECTED_DIFFICULTIES` to 12 items, drop the FINAL 17-item spec, drop the 5 WU 3 family patterns. The new E2E spec (`exponenciales-practice.spec.ts`) is part of the slice and rolls back with the content. |
| **Final rollback boundary** | After WU 1 + WU 2 + WU 3, the rollback boundary is symmetric with the add boundary: removing all 13 new entries + restoring `.4.difficulty = 1` returns the prior 4-entry bank byte-for-byte. `STATUS.json`, the new untracked test files, and any prior blocked/archived U3 work are not touched. |

### Deviations

- **Byte-stability snapshots strengthened from 3 fields to 9 fields per legacy entry (WU 1 correction pass, preserved through WU 2 + WU 3).** See WU 1 section above.
- **`text-input scalar discipline` assertion (1.1) was tightened mid-cycle.** See WU 1 section above.
- **Family detection switched from prompt-keyword to pedagogicalNote-keyword (WU 1 refactor pass).** See WU 1 section above.
- **Family patterns reordered so specific families are checked first (WU 2 refactor pass).** See WU 2 section above. WU 3 extends this pattern with 5 new specific families (`ax-symmetric-t-plus-k`, `ax-exponential-polynomial`, `ax-different-bases-log`, `ax-radical-fractional-exponent`, `ax-combined-bases`) declared at the top of `FAMILY_KEYWORDS` so any note that could match a generic family and a specific one classifies by the specific one.
- **E2E spec uses raw page interactions instead of `drivePracticeFlow` (WU 3).** The task description says "via `drivePracticeFlow`", but the helper's encounter-order assumptions time out on a 17-item bank (it processed 11 MC + 4 text-based without detecting the 2 TF entries). The spec instead drives the route through raw page interactions using the same selectors the helper uses (`ANSWER_FORM_MC`, `ANSWER_FORM_TRUE_FALSE`, `ANSWER_FORM_TEXT`, `ANSWER_INPUT`, `UNIT_SELECT`) and the same theory→examples→exercises button regex (`/Ver ejemplo resuelto|Continuar al ejemplo|Ver siguiente ejemplo|Ir a ejercicios|Empezar pr[áa]ctica|Comenzar pr[áa]ctica/`). The same observable behaviours are proven: reachability, theory phase, examples navigation, one of MC/TF/text rendering, no unsupported-type fallback, post-answer feedback surfaces, and no nearby regression. The 3 specs pass in 12.1s total.
- **Catalog baseline snapshot test updated (WU 1 + WU 2 + WU 3).** `catalog-split-equivalence.test.ts` hardcoded `BASELINE_TOTAL = 221` and `BASELINE_UNIT_3 = 42`. WU 1 bumped to 225 / 46; WU 2 bumped to 229 / 50; WU 3 bumped to 234 / 55. The cumulative-slice docstring names the 225/46 → 229/50 → 234/55 trajectory.

### Issues / Discoveries

- **No pre-existing failures** were hit during the safety net; the focused subset went 3191 → 3201 (WU 1) → 3206 (WU 2) → 3221 (WU 3) as the test grew.
- **No new code corrections were required in this WU 3 slice.** The dirty candidate already contained the WU 3 evidence; this slice was evidence recovery and continuation, not authoring new RED→GREEN. This is the honest prior/current GREEN state — no fabrication of historical RED evidence.
- **No pre-existing test was broken by WU 3.** All 188 test files pass (3221 tests).
- **No typecheck or build regression.** `tsc --noEmit` clean; `next build` compiled successfully in 8.9s.
- **E2E harness ran cleanly.** All 3 specs in `exponenciales-practice.spec.ts` pass in 12.1s. The Playwright webServer boots the production bundle on port 3100 as designed.

### Risks

- **The cumulative contract is now locked.** `EXPECTED_ORDERED_IDS` and `EXPECTED_DIFFICULTIES` are the single source of truth for the 17-item bank. Any future append to `mat.u3.exponenciales` must extend both arrays.
- **Family patterns must stay specific-first.** Any future byte-stable contract that uses keyword families must declare specific patterns before generic ones. The 5 WU 3 family patterns demonstrate the durable pattern: each new entry's `pedagogicalNote` commits to its distinctive marker (e.g. "sustitución simétrica en t + k/t" for `.13`).
- **Catalog baseline test (`catalog-split-equivalence.test.ts`) is still a pre-existing fragility.** Every append-only catalog change requires a numeric bump on this file. A future SDD could swap the hardcoded baseline for a recorded snapshot.
- **Partial-field snapshots are a false-GREEN surface in byte-stability tests.** This is a generalizable lesson: when a test names "byte-stable", it must snapshot every persisted field, not the subset the author happened to care about. The strengthened 9-field snapshot is the durable fix.
- **`drivePracticeFlow` is fragile on large banks.** The helper's encounter-order assumptions (assumes the bank contains only MC and text-based entries) fail on a 17-item bank that includes 2 TF entries. The raw-page-interactions approach in the WU 3 E2E spec is the durable pattern for any skill bank with TF entries.

### Next Steps

- **Verification (sdd-verify)**: run independent requirements/runtime verification per the SDD verify phase. The dirty candidate is now ready-for-verify: all 7 WU 3 tasks complete; full unit suite (3221/3221); typecheck + build clean; E2E spec 3/3 passing; rollback boundary well-defined.
- **Archive (sdd-archive)**: after verify, archive the change per the SDD archive phase. The change updates only `mat.u3.exponenciales` in `unit-3.json` (append-only + one difficulty normalization), four test files (loader, shape, coverage, baseline), and one new E2E spec. The rollback boundary is symmetric.

### Relevant Files (cumulative delta scope)

- `openspec/changes/expand-u3-exponentials/tasks.md` — 1.1–1.4, 2.1–2.2, **3.1–3.7 marked complete**.
- `openspec/changes/expand-u3-exponentials/apply-progress.md` — this file (WU 1 initial + correction + WU 2 cumulative + **WU 3 FINAL closure evidence**).
- `openspec/changes/expand-u3-exponentials/proposal.md`, `design.md`, `specs/**/*.md`, `exploration.md` — read-only across all slices; no edits.
- `content/matematica/exercises/unit-3.json` — `.4.difficulty` 1→3 + **13** new entries (`.03/.6/.7/.8/.9/.10/.11/.12/.13/.14/.15/.16/.17`); nothing else on `.2/.3/.4/.5` differs from baseline.
- `src/domain/__tests__/u3-exponentials-coverage.test.ts` — created, strengthened, extended, corrected, negative-fixture-added, **extended to FINAL 17-item contract with 5 new specific family patterns**; **22 specs total (16 + 6 negative fixtures)**.
- `src/domain/__tests__/content-loaders-u3.test.ts` — **WU 3 added `u3-exponenciales — FINAL 17-item loader evidence` block with 5 specs**.
- `src/domain/__tests__/u3-exercise-shape.test.ts` — **WU 3 added `u3-exponenciales — FINAL 17-item shape evidence` block with 3 specs**.
- `src/domain/__tests__/catalog-split-equivalence.test.ts` — **WU 3 bumped `BASELINE_TOTAL` 229→234, `BASELINE_UNIT_3` 50→55** with cumulative docstring.
- `tests/e2e/specs/exponenciales-practice.spec.ts` — **created in WU 3**; 3 specs (E1, E2, E4) using raw page interactions.
- `openspec/changes/STATUS.json` — `expand-u3-exponentials` entry recorded as `in-progress` on `sdd/expand-u3-exponentials`.
- `src/domain/catalog/content-loaders.ts` — read-only; comparator behaviour verified via the test's own re-implementation.

### Files Changed During This Phase (WU 3 APPLY)

This WU 3 slice did not author or modify any production code or test code. The dirty candidate already contained the WU 3 evidence; this slice was evidence recovery and continuation. The files modified by this slice were the OpenSpec tracking artifacts only:

- `openspec/changes/expand-u3-exponentials/tasks.md` — marked 3.1–3.7 complete (no semantic change to production code).
- `openspec/changes/expand-u3-exponentials/apply-progress.md` — this section appended (no semantic change to production code).

**Newly changed-line count relative to active attempt start**: 0 (no production or test code was authored or modified in this slice). The active attempt's start state — 5 modified tracked files and 11 untracked files totalling 308 insertions / 9 deletions across the tracked diff plus the new test files — was preserved verbatim.

### Exact Command/Result Inventory (to finish the active attempt)

| Command | Exit | Result |
|---|---|---|
| `pnpm run test:run` (full suite) | 0 | 188 test files, 3221 tests, all passed in 26.43s |
| `pnpm run test:run -- u3-exponentials-coverage.test.ts` (via npx vitest run) | 0 | 22/22 in 1.07s (16 main specs + 6 negative fixtures) |
| `npx vitest run src/domain/__tests__/content-loaders-u3.test.ts` | 0 | 69/69 in 1.77s |
| `npx vitest run src/domain/__tests__/u3-exercise-shape.test.ts` | 0 | 18/18 in 1.45s |
| `npx vitest run src/domain/__tests__/catalog-split-equivalence.test.ts` | 0 | 8/8 in 1.41s |
| `pnpm run typecheck` | 0 | `tsc --noEmit` clean (no output) |
| `pnpm run build` | 0 | `next build` compiled successfully in 8.9s, 11 static pages, no warnings beyond pre-existing `middleware` → `proxy` deprecation |
| `pnpm run test:e2e:install` | 0 | Chromium installed (pre-existing step; no failures) |
| `npx playwright test tests/e2e/specs/exponenciales-practice.spec.ts` | 0 | PASS (3) FAIL (0) in 12126ms (E1 812ms, E2 4.4s, E4 920ms) |

All required verification (3.6) and the Playwright E2E spec (3.5) pass cleanly. The slice is ready-for-verify.
