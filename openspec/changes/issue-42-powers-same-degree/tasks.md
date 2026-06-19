# Tasks: issue-42-powers-same-degree — Powers of Same Degree Pedagogical Bridge

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150–220 net |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | not-applicable |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: not-applicable
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | theory: expand bodyParagraphs (T1) | PR 1 | Standalone; theory-only file |
| 2 | content: add 3 worked examples (T2, T3, T4) | PR 1 | Same PR, same content file |
| 3 | feedback+test: caso-6 mapping + voice gate (T5, T6) | PR 1 | Same PR, feedback+test files |

T7 (verify gates) is a CI gate, not a commit unit.

---

## Phase 1: Theory Content

- [x] **T1 — Expand `concept-fac-potencias-igual-grado` bodyParagraphs**
  - **File**: `content/matematica/theory/unit-2.json`
  - **Description**: Replace the 2 existing bodyParagraphs with 5-6 new paragraphs that bridge divisibility rules → procedure (divisibility table, factor selection, non-monic root `2x+3=0⇒x=-3/2`, Ruffini second-factor construction, disminución method, method comparison).
  - **Affected files**: `content/matematica/theory/unit-2.json`
  - **Acceptance criteria**:
    - `bodyParagraphs.length` is 5 or 6
    - P1 covers the 4-row divisibility table with explicit siempre/si-par/si-impar/nunca conditions
    - P2 walks factor selection for `8x^3+27 = (2x)^3+3^3` → first factor `2x+3`
    - P3 derives `2x+3=0 ⇒ x=-3/2` and states the Ruffini number
    - P4 shows cociente `4x^2-6x+9` via Ruffini table, reconciles with non-monic divisor
    - P5 applies `a^3+b^3=(a+b)(a^2-ab+b^2)` with `a=2x, b=3`, no Ruffini
    - P6 contrasts Ruffini (divide) vs disminución (construct directly)
    - No paragraph uses "fórmula conocida" as sole justification
    - No forbidden Ingenium strings
  - **Estimated lines**: +40–50 (replaces 2 paragraphs ≈10 lines; adds 5-6 paragraphs ≈50-60 lines)
  - **Dependencies**: None
  - **Commit**: `theory: expand concept-fac-potencias-igual-grado bodyParagraphs`

---

## Phase 2: Worked Examples

- [x] **T2 — Add worked example `example-factorizacion-3` (Ruffini on 8x³+27)**
  - **File**: `content/matematica/examples/unit-2.json`
  - **Description**: Add Ruffini walkthrough for `8x^3+27` with non-monic divisor `2x+3`. Step 1 identifies divisor and resolves `2x+3=0⇒x=-3/2` before the table.
  - **Affected files**: `content/matematica/examples/unit-2.json`
  - **Acceptance criteria**:
    - `id === "example-factorizacion-3"`, `skillId === "mat.u2.factorizacion"`
    - `steps.length >= 2`, ordered sequentially starting at 1
    - Step 1 identifies `2x+3` and derives `x=-3/2` before the Ruffini table
    - Full Ruffini table present with coefficients `[8, 0, 0, 27]` and left number `-3/2`
    - `finalAnswer` matches `8x^3+27=(2x+3)(4x^2-6x+9)` or equivalent
    - `canonicalTrace` present with ≥1 entry; `pedagogicalNote` present
    - Passes `validateWorkedExample` (catalog-content test)
  - **Estimated lines**: +20–30
  - **Dependencies**: None
  - **Commit**: `content: add 3 worked examples for factorizacion caso 6`

- [x] **T3 — Add worked example `example-factorizacion-4` (disminución on 8x³+27)**
  - **File**: `content/matematica/examples/unit-2.json`
  - **Description**: Add disminución de exponentes walkthrough for `8x^3+27` using `a=2x, b=3` and `a^3+b^3=(a+b)(a^2-ab+b^2)`.
  - **Affected files**: `content/matematica/examples/unit-2.json`
  - **Acceptance criteria**:
    - `id === "example-factorizacion-4"`, `skillId === "mat.u2.factorizacion"`
    - Recognizes `8x^3+27 = (2x)^3+3^3`, identifies `a=2x, b=3`
    - Applies `a^3+b^3=(a+b)(a^2-ab+b^2)` without division
    - `finalAnswer` matches `(2x+3)(4x^2-6x+9)` or equivalent
    - `steps.length >= 2`; `canonicalTrace` and `pedagogicalNote` present
  - **Estimated lines**: +20–30
  - **Dependencies**: None (parallel with T2)
  - **Commit**: `content: add 3 worked examples for factorizacion caso 6`

- [x] **T4 — Add worked example `example-factorizacion-5` (diferencia branch)**
  - **File**: `content/matematica/examples/unit-2.json`
  - **Description**: Add worked example using diferencia de potencias with exponent ≥4 (suggested `x^4-16`) via disminución de exponentes.
  - **Affected files**: `content/matematica/examples/unit-2.json`
  - **Acceptance criteria**:
    - `id === "example-factorizacion-5"`, `skillId === "mat.u2.factorizacion"`
    - Expression uses subtraction and exponent ≥4 (e.g., `x^4-16`)
    - Applies correct diferencia branch (e.g., `a^4-b^4=(a^2-b^2)(a^2+b^2)` or equivalent valid factorization)
    - `canonicalTrace` and `pedagogicalNote` present; `steps.length >= 2`
  - **Estimated lines**: +20–30
  - **Dependencies**: None (parallel with T2, T3)
  - **Commit**: `content: add 3 worked examples for factorizacion caso 6`

---

## Phase 3: Feedback and Voice Gate

- [x] **T5 — Add feedback mapping reusing `u2_ruffini_signo_a`**
  - **File**: `content/matematica/feedback/unit-2.json`
  - **Description**: Add mapping keyed to `u2_ruffini_signo_a` with recovery target `example-factorizacion-3`. Message must be context-neutral (no profe digital). No new error tag in taxonomy; no new detector.
  - **Affected files**: `content/matematica/feedback/unit-2.json`
  - **Acceptance criteria**:
    - `errorTag === "u2_ruffini_signo_a"` (reuse existing, no new tag in `src/domain/error-taxonomy/index.ts`)
    - No new detector in `src/domain/evaluator/error-tagging.ts`
    - `recoveryTarget === "example-factorizacion-3"`
    - Message (or `pedagogicalNote`) explicitly mentions divisor identification and divisor=0 step
    - Voice is neutral to use context; no forbidden Ingenium strings
  - **Estimated lines**: +5–10
  - **Dependencies**: T2 (recovery target must exist)
  - **Commit**: `feedback: add caso-6 ruffini-raiz mapping + voice test`

- [x] **T6 — Extend `copy-strings-acceptance.test.ts` (voice gate)**
  - **File**: `src/domain/__tests__/copy-strings-acceptance.test.ts`
  - **Description**: Add content files (`theory/unit-2.json`, `examples/unit-2.json`, `feedback/unit-2.json`) to the forbidden-strings check. No new forbidden strings needed; existing global list covers the patterns.
  - **Affected files**: `src/domain/__tests__/copy-strings-acceptance.test.ts`
  - **Acceptance criteria**:
    - `filesToCheck` array includes all three content files
    - All new theory paragraphs and example copy pass the existing FORBIDDEN_STRINGS checks
    - Test runs as part of `pnpm run test`
  - **Estimated lines**: +5–15
  - **Dependencies**: T1, T2, T3, T4 (content must be written before the gate can be meaningful)
  - **Commit**: `feedback: add caso-6 ruffini-raiz mapping + voice test`

---

## Phase 4: Verification

- [x] **T7 — Verify gates pass**
  - **Commands**: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`
  - **Description**: Run the full verification suite. All three commands must succeed.
  - **Affected files**: None (execution only)
  - **Acceptance criteria**:
    - `pnpm run test` exits 0 — no new test failures
    - `pnpm run typecheck` exits 0 — no new type warnings
    - `pnpm run build` exits 0 — generates all 7 routes
  - **Estimated lines**: 0 (execution only)
  - **Dependencies**: T1, T2, T3, T4, T5, T6
  - **Commit**: Not a commit; gate of the PR

---

## Commit Plan (Work Units)

| # | Message | Files | Gate |
|---|---------|-------|------|
| 1 | `theory: expand concept-fac-potencias-igual-grado bodyParagraphs` | `content/matematica/theory/unit-2.json` | `pnpm run typecheck && pnpm run test` |
| 2 | `content: add 3 worked examples for factorizacion caso 6` | `content/matematica/examples/unit-2.json` | `pnpm run typecheck && pnpm run test` |
| 3 | `feedback: add caso-6 ruffini-raiz mapping + voice test` | `content/matematica/feedback/unit-2.json`, `src/domain/__tests__/copy-strings-acceptance.test.ts` | `pnpm run typecheck && pnpm run test` |

Each commit is independently verifiable. T7 is the final PR gate.
