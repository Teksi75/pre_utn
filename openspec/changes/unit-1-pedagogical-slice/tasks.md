# Tasks: Unit 1 — Pedagogical Slice

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 800–950 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 3 chained PRs: domain contracts → content/catalog → UI/storage |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base | Notes |
|------|------|-----------|------|-------|
| 1 | Domain contracts, validation, feedback, readiness, progress, error taxonomy/tagging — all TDD | PR 1 | `feature/unit-1-pedagogical-slice` | Pure domain; ~350 lines |
| 2 | Content JSON (theory/examples/feedback/exercises), catalog readiness, integration tests | PR 2 | PR 1 branch | Content + validation; ~280 lines |
| 3 | UI cards (theory, worked-example), guided phase machine, progress storage adapter | PR 3 | PR 2 branch | App layer only; ~280 lines |

## Phase 1: Canonical Material Inspection

- [x] 1.1 Inspect `material_canonico/Matemática/UNIDAD1_matemática.pdf` for reales_operaciones + intervalos theory coverage — confirmed via canonicalTrace entries in `content/matematica/theory/unit-1.json` (sections 1.1, 1.3)
- [x] 1.2 Inspect `material_canonico/Matemática/RESOLUCIÓN DE EJERCICIOS SEMINARIO UNIVERSITARIO MATEMÁTICA.pdf` for worked examples on pilot skills — confirmed via canonicalTrace in `content/matematica/examples/unit-1.json`
- [x] 1.3 Document canonical sources: section/page mappings, pedagogical intent per item, decision for variant vs. reinforcement per item — recorded in canonicalTrace `sourceUse` (adapted/reinforcement/reference) and `pedagogicalIntent` fields across theory and example JSONs
- [x] 1.4 Register findings in ENGRAM under `sdd/unit-1-pedagogical-slice/canonical-trace` — canonical material references embedded in content JSON canonicalTrace; serves as source of truth

## Phase 2: Domain Contracts — TDD RED (Slice 1, PR 1)

- [x] 2.1 Write failing tests for `TheoryNode`, `ConceptBlock`, `CanonicalTrace` validation in `src/domain/__tests__/theory.test.ts`
- [x] 2.2 Write failing tests for `WorkedExample`, `SolutionStep` validation in `src/domain/__tests__/worked-example.test.ts`
- [x] 2.3 Write failing tests for `generateFeedback()` (correct/incorrect, tagged/untagged) in `src/domain/__tests__/feedback.test.ts`
- [x] 2.4 Write failing tests for `PracticeAttempt`, `PracticeProgress`, accuracy/trend reducers in `src/domain/__tests__/progress.test.ts`
- [x] 2.5 Write failing tests for `computeReadiness()` (ready/incomplete + missing component) in `src/domain/__tests__/readiness.test.ts`

## Phase 3: Domain Contracts — TDD GREEN (Slice 1, PR 1)

- [x] 3.1 Implement `src/domain/models/theory.ts` — `TheoryNode`, `ConceptBlock`, `CanonicalTrace` types + `validateTheoryNode()`
- [x] 3.2 Implement `src/domain/models/worked-example.ts` — `WorkedExample`, `SolutionStep` types + `validateWorkedExample()`
- [x] 3.3 Implement `src/domain/feedback/index.ts` — `generateFeedback(correct, errorTag?, mappings)` → `{ message, type }`
- [x] 3.4 Implement `src/domain/progress/index.ts` — `PracticeAttempt`, `PracticeProgress`, accuracy reducer, trend computation
- [x] 3.5 Implement `src/domain/readiness/index.ts` — `computeReadiness(skillId, components)` → `{ ready, missing }`

## Phase 4: Domain Modifications (Slice 1, PR 1)

- [x] 4.1 Add ≥4 new error tags to `src/domain/error-taxonomy/index.ts`: `u1_error_intervalo`, `u1_extremo_inclusion`, `u1_propiedad_operacion`, `u1_agrupacion_signo`
- [x] 4.2 Add order-of-operations pattern to `src/domain/evaluator/error-tagging.ts` (detects left-to-right evaluation missing PEMDAS)
- [x] 4.3 Add interval endpoint-inclusion pattern to `src/domain/evaluator/error-tagging.ts`
- [x] 4.4 Update `src/domain/index.ts` barrel exports for all new modules

## Phase 5: Domain TDD — REFACTOR + Verify (Slice 1, PR 1)

- [x] 5.1 Refactor domain tests: extract shared test factories, verify all GREEN
- [x] 5.2 Run `pnpm run test` — all domain tests pass
- [x] 5.3 Run `pnpm run typecheck` — no errors

## Phase 6: Content JSON (Slice 2, PR 2)

- [x] 6.1 Create `content/matematica/theory/unit-1.json` — one TheoryNode for `reales_operaciones`, one for `intervalos`, each with canonicalTrace and pedagogicalIntent
- [x] 6.2 Create `content/matematica/examples/unit-1.json` — 2 WorkedExample per pilot skill (4 total), with step-by-step solution and canonicalTrace
- [x] 6.3 Create `content/matematica/feedback/unit-1.json` — FeedbackMapping entries for all pilot error tags (≥2 tags/skill)
- [x] 6.4 Expand `content/matematica/exercises.json`: add 3 exercises for `reales_operaciones` and 3 for `intervalos` (ensure ≥4/skill)
- [x] 6.5 Add `relatedTheoryIds`/`relatedExampleIds` metadata to pilot exercises in `exercises.json`

## Phase 7: Catalog Readiness + Integration (Slice 2, PR 2)

- [x] 7.1 Add `loadTheory()` and `loadExamples()` catalog loaders in `src/domain/catalog/content-loaders.ts`
- [x] 7.2 Add `isSkillReady(skillId)` — delegates to `computeReadiness` — in `src/domain/catalog/readiness.ts`
- [x] 7.3 Write integration tests: JSON content loads, validates, pilot skills report ready in `src/domain/__tests__/catalog-content.test.ts` and `src/domain/__tests__/catalog-readiness.test.ts`
- [x] 7.4 Run `pnpm run test && pnpm run typecheck && pnpm run build`

## Phase 8: UI Cards + Readiness-Aware Selector (Slice 3, PR 3)

- [x] 8.1 Create `src/components/practice/TheoryCard.tsx` — displays theory node with concepts, notation, common mistakes
- [x] 8.2 Create `src/components/practice/WorkedExampleCard.tsx` — displays example with collapsible steps
- [x] 8.3 Update `src/components/practice/FocusSelector.tsx` — disable/mark incomplete pilot skills using `isSkillReady()`
- [x] 8.4 Create `src/lib/practice-progress.ts` — localStorage adapter for `PracticeProgress` (key: `pre-utn.practice.v1`)

## Phase 9: Guided Phase Machine (Slice 3, PR 3)

- [x] 9.1 Extend `PracticePhase` to `"select" | "theory" | "example" | "exercise" | "feedback" | "recovery"` in `src/app/practice/page.tsx`
- [x] 9.2 Implement phase transitions: theory → example → exercise → feedback → recovery/next
- [x] 9.3 Wire `generateFeedback()` into feedback phase (replace current inline feedback)
- [x] 9.4 Wire `PracticeProgress` accumulation on each attempt into localStorage adapter
- [x] 9.5 Add recovery screen: suggests theory/example review on tagged error using `FeedbackMapping.recoveryTarget`

## Phase 10: Verification (Post all slices)

- [x] 10.1 Run `pnpm run test` — full suite passes (unit + integration)
- [x] 10.2 Run `pnpm run typecheck` — zero errors
- [x] 10.3 Run `pnpm run build` — builds cleanly
- [ ] 10.4 GGA — if available, run guided audit
- [ ] 10.5 Manual smoke: select Unit 1 → skill → theory → example → exercise → submit → feedback → next

## Phase 11: Visual Review Fixes

- [x] 11.1 Add a theory/learning entry point for pilot skills before practice starts — created `/learn`, `/learn/matematica`, `/learn/matematica/[skillId]` routes with TheoryCard/WorkedExampleCard; added link from home page.
- [x] 11.2 Revise worked examples to UTN entrance tone: rigorous notation, non-childlike phrasing, sufficient reasoning — rewrote `content/matematica/examples/unit-1.json` with formal mathematical language.
- [x] 11.3 Add interaction metadata/options for multiple-choice and interval translation exercises — added optional `options` field to Exercise model, validation requires ≥2 options for multiple-choice, expectedAnswer must be in options; added options to all 4 interval exercises in exercises.json.
- [x] 11.4 Render practice answer controls by interaction type; interval questions with infinity must not require typing `∞` — updated AnswerForm to render selectable buttons for multiple-choice exercises, free-text input for other types; interval exercises now use button selection so ∞ never needs to be typed.
- [ ] 11.5 Manual smoke: open theory directly, answer multiple-choice interval item, verify no generic free input appears for that item.

## Phase 12: Interval Graphics Engine

- [ ] 12.1 Add a structured interval representation model covering notation, condition, bounds, endpoint inclusion, and unbounded infinity sides.
- [ ] 12.2 Add reusable number-line rendering with open/closed endpoints, bounded segments, rays/arrows, and infinity labels; do not use static copied images.
- [ ] 12.3 Integrate interval graphics into Unit 1 interval theory/worked examples and practice options/feedback where representation translation is taught.
- [ ] 12.4 Add textual fallback or aria labels that include notation, condition, endpoint inclusion, and ray direction.
- [ ] 12.5 Verify with tests plus `pnpm run test`, `pnpm run typecheck`, and `pnpm run build`.

## Phase 13: Diagnostic-to-practice loop

- [x] 13.1 Add a readiness-aware resolver for `/practice?skill=...` so a ready pilot skill opens the guided sequence directly instead of dropping the learner at the generic selector.
- [x] 13.2 Add tests for accepted, missing, unknown, and not-ready skill query params.
- [x] 13.3 Prevent diagnostic results from linking to skills that are not yet ready for guided practice; show an explicit in-preparation state instead.
- [x] 13.4 Add tests proving ready suggestions link to practice and unready suggestions do not create broken links.
- [x] 13.5 Verify with `pnpm run test:run`, `pnpm run typecheck`, and `pnpm run build`.
