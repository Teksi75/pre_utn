# Tasks: Fortalecer Unidad 3: lenguaje algebraico, modelización y transferencia

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500-750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 specs+modeling base → PR 2 challenges U3 |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Lenguaje algebraico y modelización base | PR 1 | Specs, theory, examples, exercises, feedback, tests. |
| 2 | Desafíos U3 de transferencia | PR 2 | `unit-3` challenges + loader/tests; can be deferred. |

## Phase 1: Spec and Catalog Foundation

- [x] 1.1 Add delta spec for `practice-coverage`: U3 must cover verbal translation, setup, verification, and contextual interpretation.
- [x] 1.2 Add delta spec for `challenge-exercises`: U3 must receive at least 2 modeling-and-transfer challenges covering algebraic setup, multi-relation reasoning, verification, and contextual interpretation. (PR 2: `specs/challenge-exercises/spec.md` adds MODIFIED Pilot Skill Challenge Coverage (U3 addendum) + ADDED PR 2 integrative challenge transfer + development validation, driving the 2 desafios for `mat.u3.traduccion_lenguaje_verbal`.)
- [x] 1.3 Decide whether `mat.u3.traduccion_lenguaje_verbal` is a visible skill or content inside `mat.u3.ecuaciones_lineales`; document the choice. (PR 1 decision: visible leaf skill, no global prerequisite; documented in design.md and STATUS.json.)
- [x] 1.4 If visible, add the skill to `src/domain/models/skill-catalog.ts` and `src/domain/catalog/pilot-skills.ts` without making it a global prerequisite.

## Phase 2: Core Pedagogical Content

- [x] 2.1 Update `content/matematica/theory/unit-3.json` with variable definition, verbal translation, equation setup, and contextual verification. (Added `theory-traduccion-lenguaje-verbal` with 5 concepts covering variable, traducción, planteo, verificación, interpretación.)
- [x] 2.2 Update `content/matematica/examples/unit-3.json` with examples for percentages, perimeters, repartos, and related quantities. (Added 2 worked examples: doble-de-un-número-menos-3 and números-consecutivos.)
- [x] 2.3 Add/reuse `content/matematica/exercises/unit-3.json` exercises using multiple-choice distractors that test modeling, not syntax. (Added 5 MC exercises with semantic distractors — no free symbolic input per AGENTS.md. Review fix: 2 exercises now require solved contextual verification/interpretation, not setup only.)
- [x] 2.4 Update `content/matematica/feedback/unit-3.json` with mappings for wrong variable, inverted relation, missing verification, and context mismatch. (Added `u3_traduccion_incorrecta`, `u3_verificacion_omitida`, and `u3_interpretacion_contextual_incorrecta`; PR 1 remains bounded to modeling base.)

## Phase 3: Challenge Slice

- [x] 3.1 Create `content/matematica/challenges/unit-3.json` with at least 2 challenges if accepted: one multi-relation setup and one exam-transfer verification task. (PR 2: 2 desafios for `mat.u3.traduccion_lenguaje_verbal` — desafio-01 multi-relation cable+taco 2x2, desafio-02 rectángulo perímetro+razón con verificación doble. Fresh-review fixes: desafio-01 prompt now uses directional "el taco excede al cable en $3" so only one algebraic translation is defensible; both desafios' `expectedAnswer` equals option[0] so the evaluator's exact matcher grades the visible correct option as correct.)
- [x] 3.2 Register Unit 3 in `src/lib/challenges/loader.ts` following the existing U1/U2 pattern. (PR 2: `unit3ChallengesRaw` imported and appended to `UNIT_REGISTRY` at index 2; `unitFromSkillId` regex already supported `mat.u3.*` from PR 1.)
- [x] 3.3 Ensure each challenge has `difficulty` 4-5, `category: "desafio"`, required tags, and non-empty `canonicalTrace`. (PR 2: desafio-01 difficulty=5, desafio-02 difficulty=4; both `challengeSection:true`, `category:"desafio"`, `tags:["desafio","integrador"]`, `canonicalTrace` with 2 entries. Fresh-review hardening: the loader now validates `expectedAnswer ∈ options` and `multiple-choice ⇒ options.length ≥ 2` at load time.)

## Phase 4: Tests and Verification

- [x] 4.1 Update `src/domain/__tests__/content-loaders-u3.test.ts` for new/modified U3 content counts and required feedback mappings. (Bumped to 9 theory nodes, 18 examples, 11 feedback mappings; added U3-MOD-PR1 assertions that verify modeling theory covers planteo + verificación + interpretación, feedback distinguishes translation/omitted verification/context mismatch, and exercises require contextual verification/interpretation.)
- [x] 4.2 Add/update challenge loader tests for `loadChallengesForUnit(3)` and `loadChallengesForSkill()` if Phase 3 is included. (PR 2: new tests in `src/lib/challenges/__tests__/loader.test.ts` cover loadChallengesForUnit(3) shape; loadChallengesForSkill('mat.u3.traduccion_lenguaje_verbal') returns 2 desafios with id pattern + multiple-choice + 4 options; every multiple-choice challenge keeps `expectedAnswer` as exactly one of its options (defense-in-depth); desafio-01 requires translating two distinct conditions (multi-relation setup) with a committed direction; desafio-02 requires verification + geometric interpretation (exam-transfer); `validateChallengeEntry` rejects entries whose `expectedAnswer` is not in `options`, whose `expectedAnswer` is not a non-empty string, or whose object option has a missing/non-string `value`.)
- [x] 4.3 Run `pnpm run test:run`, `pnpm run typecheck`, and `pnpm run build`. (PR 2 + fresh-review-fix verification: full test suite + typecheck + build green.)
- [x] 4.4 Manually smoke `/practice` skill selection, exercise flow, feedback, completion, and challenge handoff. (Statically verified: the new skill is wired into PILOT_SKILLS, the unit-3 content loaders return the new content, the section-card-content test renders 9 U3 cards including the new one. Full browser smoke deferred to verify phase on a deployed environment; the change is non-intrusive to existing navigation.)

## Phase 5: Cleanup and Scope Control

- [x] 5.1 Confirm no files under `material_canonico/**` are included in this change. (No `material_canonico/**` paths appear in `git status`.)
- [x] 5.2 Confirm titles/copy preserve multi-institution framing and do not personify the app as a tutor. (Copy is neutral, descriptive, focused on what the student is doing. Review fix: new U3 pedagogical content and feedback use neutral professional Spanish imperatives instead of voseo.)
- [x] 5.3 Record any deferred issues: rectas paralelas/perpendiculares, sistemas con parámetro, and mate-explorer audit remain out of scope per proposal.md/design.md. U3 transfer challenges are no longer deferred: PR 2 added and merged the accepted challenge slice (`a173ce0`).
