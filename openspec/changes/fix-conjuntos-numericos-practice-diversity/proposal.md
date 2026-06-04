# Proposal: Fix Conjuntos Numericos Practice Diversity

## Intent

The practice bank for `mat.u1.conjuntos_numericos` has duplicated and near-duplicated exercises across categories. Users see the same question (e.g., "¿A qué conjuntos pertenece el número 5?") in both `pertenencia` and `clasificacion` categories, reducing pedagogical value and confusing the practice experience.

## Scope

### In Scope
- Remove 4 exact-duplicate exercises from `clasificacion` category (cn-cla-01, cn-cla-02, cn-cla-04, cn-cla-10)
- Replace with 4 genuinely different exercises preserving category count (12)
- Verify exercise 22 (cn-cla-04) answer correctness
- Improve pedagogical notes on near-duplicate √9 exercises to justify intentional repetition

### Out of Scope
- Changes to other exercise files (u2-u6)
- Changes to feedback mappings
- Changes to the catalog loader or validator logic

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `math-exercise-catalog`: Data-only change to exercise JSON; no spec-level behavior change.

## Approach

Direct JSON edit of `content/matematica/exercises/conjuntos-numericos.json`. Replace 4 duplicate entries with exercises that test different numbers/concepts while staying within the `clasificacion` category scope.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/exercises/conjuntos-numericos.json` | Modified | Replace 4 duplicates, update notes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| New exercises have incorrect answers | Low | Verify each mathematically before writing |
| Category minimum violated | Low | Replace same-for-same count |

## Rollback Plan

Revert `conjuntos-numericos.json` via `git checkout`.

## Success Criteria

- [ ] No exact-duplicate prompts remain in the bank
- [ ] All 6 categories meet their minimum counts
- [ ] Exercise 22 answer verified (or corrected)
- [ ] `pnpm run test` passes
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run build` passes
