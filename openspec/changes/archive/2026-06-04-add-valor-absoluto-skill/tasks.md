# Tasks: Add Traversable Valor Absoluto Skill

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 550–800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 domain/content readiness → PR 2 route/docs validation |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain/content readiness for `mat.u1.valor_absoluto` | PR 1 | Tests with taxonomy, dependency, theory/examples/exercises/feedback; base per resolved chain. |
| 2 | Learn/practice routing, README, final validation | PR 2 | Depends on PR 1; include route tests, README status, full checks. |

## Phase 1: RED — Domain Contracts

- [x] 1.1 Verify canonical valor absoluto section before content authoring; record source notes for `content/matematica/theory/unit-1.json`.
- [x] 1.2 Create `src/domain/__tests__/valor-absoluto-domain.test.ts` failing tests for pilot order, intervalos prerequisite, no logaritmos dependency, readiness, and content loading.
- [x] 1.3 Add failing tests in `valor-absoluto-domain.test.ts` for 9 theory concepts, ≥5 examples, 8–12 MC/numerical exercises, MC option matching, difficulty 1–4, and no symbolic/free-response.
- [x] 1.4 Add failing tests in `valor-absoluto-domain.test.ts` for all 9 `u1_abs_*` feedback tags, exercise tag coverage, and safe KaTeX delimiters.
- [x] 1.5 Update `src/domain/__tests__/error-taxonomy.test.ts` and `src/domain/__tests__/catalog-readiness.test.ts` with failing expectations for the 9 tags and pilot readiness.

## Phase 2: GREEN — Domain and Content

- [x] 2.1 Update `src/domain/models/skill-catalog.ts` so valor_absoluto requires intervalos; keep logaritmos dependency unchanged.
- [x] 2.2 Update `src/domain/catalog/pilot-skills.ts` inserting valor_absoluto between intervalos and logaritmos.
- [x] 2.3 Add all 9 `u1_abs_*` entries to `src/domain/error-taxonomy/index.ts`.
- [x] 2.4 Add `theory-valor-absoluto` to `content/matematica/theory/unit-1.json` covering the 9 required concepts only.
- [x] 2.5 Add ≥5 worked examples to `content/matematica/examples/unit-1.json` for numeric, distance, properties, `|x|=a`, and misconception validation.
- [x] 2.6 Update `content/matematica/exercises.json`: link `ex.u1.valor_absoluto.1`, then reach 8–12 graduated MC/numerical exercises with covered tags.
- [x] 2.7 Add all 9 feedback mappings to `content/matematica/feedback/unit-1.json`.

## Phase 3: GREEN — Routing and UX Access

- [x] 3.1 Update `src/app/practice/__tests__/start-skill.test.ts` for requested-skill readiness and intervalos prerequisite behavior.
- [x] 3.2 Update `src/app/learn/matematica/page.tsx` display names and `src/app/learn/matematica/[skillId]/page.tsx` skill-unit map for valor_absoluto.

## Phase 4: REFACTOR, Docs, Validation

- [x] 4.1 Refactor duplicated constants in tests if useful without weakening content-contract assertions.
- [x] 4.2 After tests pass, update `README.md`: mark valor_absoluto Listo; keep complejos Pendiente.
- [x] 4.3 Run `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, and GGA; fix regressions before completion.
