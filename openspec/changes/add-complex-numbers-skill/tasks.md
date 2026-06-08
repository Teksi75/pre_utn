# Tasks: Add Complex Numbers Skill

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 750–850 (8 files: 1 new test ~250, 6 JSON content ~400, 2 TS modifications ~100) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 (stacked to main) |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | RED domain tests + error taxonomy + pilot entry | PR 1 (~305 lines) | Standalone; tests define contract; infra makes CI green |
| 2 | Content pipeline: theory + examples + feedback + catalog | PR 2 (~230 lines) | Depends on PR 1; turns domain tests green |
| 3 | Exercise bank + final verification | PR 3 (~260 lines) | Depends on PR 2; completes readiness; full suite green |

## Phase 1: Test Infrastructure and Error Taxonomy (PR 1)

- [x] 1.1 Create `src/domain/__tests__/complejos-domain.test.ts` mirroring `logaritmos-domain.test.ts`: test pilot order (8th after logaritmos), prerequisite `mat.u1.reales_operaciones`, `isSkillReady` returns `ready: true`, theory ≥ 8 concepts, examples ≥ 5, exercises 10–14, permitted types only, all `u1_complejo_*` tags have feedback.
- [x] 1.2 Add `mat.u1.complejos` entry to `src/domain/catalog/pilot-skills.ts` as 8th element after `logaritmos`: `{ skillId: "mat.u1.complejos", unitKey: "unit-1", label: "Números complejos" }`.
- [x] 1.3 Add 8 error tags to `src/domain/error-taxonomy/index.ts`: `u1_complejo_i_definicion`, `u1_complejo_partes_confusion`, `u1_complejo_suma_real`, `u1_complejo_i_cuadrado_signo`, `u1_complejo_conjugado_signo`, `u1_complejo_division_sin_conjugado`, `u1_complejo_potencia_ciclo`, `u1_complejo_igualdad_parcial` — each with `unit: 1`, description, and ≥ 2 examples.

## Phase 2: Content Pipeline (PR 2)

- [x] 2.1 Update `src/domain/__tests__/catalog-readiness.test.ts`: add `mat.u1.complejos` to `PILOT_SKILL_IDS`, replace lines 79–113 negative assertions with positive readiness, remove `mat.u1.complejos` from downstream not-ready arrays (lines 147–155).
- [x] 2.2 Add theory node to `content/matematica/theory/unit-1.json` with `skillId: "mat.u1.complejos"` and 9 concepts: imaginary unit i, standard form a+bi, Re/Im parts, equality, addition/subtraction, multiplication (distributive + i²=−1), conjugate, division, powers of i cycle. No polar/Unit 5 content.
- [x] 2.3 Add ≥ 5 worked examples to `content/matematica/examples/unit-1.json` with `skillId: "mat.u1.complejos"`: add/sub, multiplication, conjugate, division, powers of i.
- [x] 2.4 Add 8 feedback mappings to `content/matematica/feedback/unit-1.json`, one per `u1_complejo_*` tag, each explaining the specific misconception and guiding toward correct reasoning.

## Phase 3: Exercise Bank and Verification (PR 3)

- [ ] 3.1 Add 10–14 exercises to `content/matematica/exercises.json` with `skillId: "mat.u1.complejos"`, IDs `ex.u1.complejos.N`, difficulty 1–4, types `multiple-choice` / `true-false` / `numerical`. Numerical exercises ask Re(z) or Im(z) separately. No free-form `a+bi`. Each exercise links `commonErrorTags` to covered `u1_complejo_*` tags only.
- [ ] 3.2 Run `pnpm run test && pnpm run typecheck && pnpm run build`. Verify `isSkillReady("mat.u1.complejos")` returns `{ ready: true, missing: [] }`, all exercises use permitted types, all referenced error tags have feedback, `mat.u5.complejos_forma_polar` prerequisite resolves.
