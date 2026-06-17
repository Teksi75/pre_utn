# Proposal: Challenge Exercises

## Intent

Students who finish standard exercises have no way to push further. Challenges provide optional harder items that stretch understanding without penalizing base mastery, closing the "I finished, now what?" gap.

## Scope

### In Scope
- New directory: `content/matematica/challenges/unit-{1,2}.json`
- Reuse `Exercise` schema with markers: `challengeSection: true`, `category: "desafio"`, `tags: ["desafio", "integrador"]`
- New loader: `loadChallengesForSkill(skillId)` + query: `queryChallengesBySkill(skillId)`
- New practice phase `"challenges"` after standard completion
- Separate advanced mastery metric (challenges only); base mastery unaffected
- Pilot: 3 skills → extend to all pilot U1/U2

### Out of Scope
- `Exercise` schema changes, gating, teacher dashboard, physics

## Capabilities

### New
- `challenge-exercises`: optional harder exercises per skill, separate JSON, independent mastery

### Modified
- `math-exercise-catalog`: new `loadChallengesForSkill` loader
- `guided-practice`: optional `"challenges"` phase after standard completion

## Approach

**Separate JSON files.** `content/matematica/challenges/unit-{N}.json` mirrors standard structure. `queryBySkill` returns only standard exercises; `queryChallengesBySkill` returns challenges sorted by difficulty asc, ID asc.

**Flow:** After last standard exercise → challenge intro card (non-blocking). Accept → exercise→feedback→recovery loop. Skip → normal `resetToSelect()`. After challenges → combined completion summary.

**Mastery:** Challenge attempts persist via `addAttempt`. `computeMasteryLevel` filters them out → base mastery unaffected. New `computeAdvancedMastery(skillId, progress)` reads challenge-only attempts.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/challenges/` | New | Challenge JSON files |
| `src/domain/catalog/content-loaders.ts` | Modified | `loadChallengesForSkill()` |
| `src/domain/catalog/index.ts` | Modified | `queryChallengesBySkill()` |
| `src/app/practice/phases.ts` | Modified | `"challenges"` phase + `nextPhase` |
| `src/app/practice/usePracticeFlow.ts` | Modified | Challenge detection, skip/accept |
| `src/app/practice/page.tsx` | Modified | Intro card, combined summary |
| `src/domain/progress/index.ts` | Modified | Filter base mastery; `computeAdvancedMastery()` |

## Risks

| Risk | Mitigation |
|------|------------|
| Challenges leak into base mastery | Filter by `exercise.challengeSection`; test |
| Phase machine regression | Unit test for new transition |
| Content bottleneck | Start with 3 pilot skills |

## Rollback

1. Remove `content/matematica/challenges/`
2. Remove `loadChallengesForSkill`, `queryChallengesBySkill`
3. Remove `"challenges"` phase from union/switch
4. Revert `usePracticeFlow.ts` to direct `resetToSelect()`
5. Remove `computeAdvancedMastery`
6. Standard tests remain green (no schema changes)

## Success Criteria

- [ ] Challenges load from separate JSON, appear after standard exercises
- [ ] Student can skip challenges → return to selector
- [ ] Challenge attempts persist via `addAttempt`
- [ ] Base mastery unaffected by challenge performance
- [ ] Advanced mastery tracks challenge-only performance
- [ ] 3 pilot skills have ≥2 challenges each
- [ ] All existing tests pass
- [ ] Copy: neutral, no tutor claims
