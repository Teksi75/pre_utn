# Proposal: Challenge Exercises Expansion

## Intent

12 of 15 pilot skills lack challenge content. Students finishing standard exercises have no stretch material. This adds 2 challenges per skill across all U1+U2 pilot skills.

## Scope

### In Scope
- 24 new challenge JSON entries (2/skill × 12 skills)
- Append-only to `unit-1.json` and `unit-2.json`
- 4 stacked PRs, each < 400 lines

| Batch | File | Skills | ~Lines |
|-------|------|--------|--------|
| A | unit-1 | `potencias_raices`, `racionalizacion` | ~160 |
| B | unit-1 | `intervalos`, `logaritmos` | ~160 |
| C | unit-1 + unit-2 | `conjuntos_numericos`, `propiedades_operaciones_reales`, `polinomios_basico`, `operaciones_polinomios` | ~320 |
| D | unit-2 | `ruffini_resto`, `factorizacion`, `gauss`, `mcm_mcd_polinomios` | ~320 |

### Out of Scope
- Loader, store, UI, mastery, `usePracticeFlow`
- U3–U6, new error tags, refactoring existing 6 challenges
- Optional: `来源于` typo fix in `complejos.desafio-01` (separate micro-PR)

## Capabilities

None — pure content addition. Existing challenge infra permits appending validated entries to `unit-{1,2}.json`. No spec-level change.

## Approach

Append-only in 4 stacked PRs. Branch `feat/challenge-exercises-expansion-batch-{a|b|c|d}`, append block, run `pnpm run test` + `pnpm run typecheck` (loader validates at init), merge `--no-ff`. All `multiple-choice` (4 LaTeX options), `difficulty: 4`, `canonicalTrace`, `commonErrorTags`, `pedagogicalNote` with distractor rationale.

## Affected Areas

| Path | Impact |
|------|--------|
| `content/matematica/challenges/unit-1.json` | Modified (Batch A, B, C) |
| `content/matematica/challenges/unit-2.json` | Modified (Batch C, D) |
| `src/lib/challenges/`, `src/domain/catalog/challenges/`, `src/components/practice/challenges/`, `src/app/practice/usePracticeFlow.ts` | Unchanged |

## Risks

| Risk | Mitigation |
|------|------------|
| Distractor quality (Batch C procedural) | Each distractor → `commonErrorTag`; reject if none fits |
| Malformed JSON crashes loader | CI runs loader at init; safety net |
| Format drift (free-text) | All MC with LaTeX; AGENTS.md forbids structured free-text |
| Canonical trace fragments | Spanish `pedagogicalIntent`, review checklist |
| Cross-PC STATUS.json conflict | Serialize batches |

## Rollback Plan

`git revert` per batch. No code, no migration.

## Dependencies

- Existing challenge infra (loader, facade, store, UI)
- `src/domain/error-taxonomy/` — reuse tags only

## Success Criteria

- [ ] 24 entries pass loader validation (build + typecheck green)
- [ ] `pnpm run test` stays at 2053+ (no regressions)
- [ ] Each of 12 skills has exactly 2 challenges
- [ ] Every challenge: MC 4 options, `difficulty ≥ 4`, `canonicalTrace`, `commonErrorTags`, `pedagogicalNote`
- [ ] No challenge copies canonical exam literally
- [ ] 4 PRs merged, each < 400 lines
- [ ] STATUS.json updated after Batch D

## Proposal question round

- Elevate specific U2 synthesis skills to `difficulty: 5` vs all at 4?
- `来源于` typo fix: inside Batch A or separate micro-PR?
- `pedagogicalNote` language: Spanish or neutral Spanish?
