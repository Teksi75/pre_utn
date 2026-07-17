## Exploration: recuperar-u3-ecuaciones-lineales

### Current State

`mat.u3.ecuaciones_lineales` is already a declared pilot skill and is technically "practice-ready" under the current readiness rules: it has theory (4 concepts), two worked examples, and four numerical exercises (`ex.u3.ecuaciones_lineales.2`–`.5`). However, it is a thin slice:

- No exercise declares an in-scope error tag, so the existing `u3_aislamiento_incorrecto` feedback mapping is unused.
- All four exercises are `numerical`, which means the existing `isU3AislamientoIncorrectoError` detector (MC-only) cannot fire.
- There is no challenge, so the skill does not reach canonical maximum difficulty per the coverage-audit contract.
- The canonical P1l exercise from `03_ej_utn.pdf` (linear equation with irrational coefficients) is missing.
- `u3_racionalizacion_irracional` does not exist in the taxonomy, feedback, or detector dispatch.

The prior foundation change (`recuperar-u3-fundacion-minima`) recovered `validateTracePath`; the trace-contract change (`recuperar-u3-traza-canonica-ejercicios`) owns canonical-trace compatibility. This change can therefore treat `canonicalTrace` fields as an existing contract and focus on pedagogical content and behavior.

### Affected Areas

- `content/matematica/exercises/unit-3.json` — add MC exercises that exercise `u3_aislamiento_incorrecto` and the recovered P1l canonical exercise (`ex.u3.ecuaciones_lineales.6`).
- `content/matematica/challenges/unit-3.json` — add one `difficulty: 5` MC challenge anchored in P1l.
- `content/matematica/feedback/unit-3.json` — add `u3_racionalizacion_irracional` feedback mapping.
- `src/domain/error-taxonomy/index.ts` — add `u3_racionalizacion_irracional` entry.
- `src/domain/evaluator/error-tagging.ts` — add `isU3RacionalizacionIrracionalError` detector and wire it into the U3 dispatch.
- `src/domain/__tests__/error-tagging-u3.test.ts` — add detector tests for the new tag.
- `src/domain/__tests__/error-taxonomy-u3.test.ts` — extend coverage for the new tag (treated as an additional U3 tag, not a replacement of the 8 spec tags).
- `src/domain/__tests__/u3-exercise-shape.test.ts` — add `u3_racionalizacion_irracional` to the declared tag catalog.
- Readiness/loader tests may need a coverage bump, but no new loaders or UI components are required.

### Approaches

1. **Single PR — minimal complete slice**
   - Add the P1l exercise, one MC isolation exercise, the challenge, the taxonomy entry, the feedback mapping, the detector, and focused tests in one change.
   - Pros: simplest branch/STATUS overhead; immediately deployable as one vertical slice.
   - Cons: content + domain + tests together may land close to or above the 400-line budget; harder to review.
   - Effort: Medium

2. **Chained PRs — pedagogical boundary**
   - PR1: Base practice honesty — add MC exercises that use `u3_aislamiento_incorrecto`, update shape tests, add readiness assertions.
   - PR2: Canonical maximum — add P1l exercise + challenge, `u3_racionalizacion_irracional` taxonomy/feedback/detector, and detector tests.
   - Pros: each PR is a coherent pedagogical milestone, stays well under 400 lines, easier to verify.
   - Cons: slightly more branch bookkeeping; PR2 depends on PR1.
   - Effort: Medium

### Recommendation

Use **Approach 2 (chained PRs)**. The base practice slice (PR1) makes the existing detector and feedback honest; the canonical maximum slice (PR2) adds the P1l content and the new rationalization detector. This respects the 400-line hard limit and gives each PR a clear, previewable pedagogical outcome. It also mirrors the roadmap's milestone independence rule.

### Risks

- **Budget creep**: even minimal P1l content is verbose because of the irrational-coefficient prompt, distractors, and verification narrative. Keep each PR under 400 authored changed lines by splitting content from domain.
- **MC-only detector limitation**: `isU3AislamientoIncorrectoError` only works for `multiple-choice`. Converting existing numerical exercises to MC would alter their surface; instead, add new MC exercises.
- **Tag-catalog test drift**: `u3-exercise-shape.test.ts` and `error-taxonomy-u3.test.ts` have hard-coded tag lists. Adding `u3_racionalizacion_irracional` requires updating both, and those updates must travel with the content that uses the tag.
- **Trace path**: new content must use the existing valid path `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`. Do not modify existing `canonicalTrace` entries with the obsolete `material_canonico/Matemática/UNIDAD3_matemática.pdf` path; that belongs to `recuperar-u3-traza-canonica-ejercicios`.
- **Voice compliance**: feedback and pedagogical notes must stay in the support-material register; avoid any "profe digital" or personalization language.

### Ready for Proposal

Yes. The scope is narrow enough to write a concrete proposal: make `mat.u3.ecuaciones_lineales` an honest, preview-deployable topic by (1) activating the existing isolation-error detector with MC exercises and (2) adding the P1l canonical exercise + challenge with a new rationalization-error detector. The orchestrator should confirm whether to proceed with chained PRs and whether the P1l challenge should be recovered verbatim from `0f79d634` or adapted for length.
