# Design: Math Domain Foundations

## Executive Summary

Designs the first functional math domain layer: `Skill` and `Exercise` models, a loadable catalog of ~30 original exercises, a type-specific answer evaluator, and an error taxonomy. All code lives in `src/domain/` (framework-free) and `content/matematica/`. TDD throughout.

## File Architecture

```
src/domain/
  models/
    skill.ts              — Skill type + validateSkill()
    exercise.ts           — Exercise type + validateExercise()
    error-tag.ts          — ErrorTag type + validateErrorTag()
  evaluator/
    index.ts              — evaluateAnswer() dispatcher
    numeric.ts            — tolerance-based comparison
    exact.ts              — trimmed/case-insensitive comparison
    boolean.ts            — Spanish/English alias resolution
  catalog/
    index.ts              — loadCatalog(), queryByUnit(), queryBySkill()
  error-taxonomy/
    index.ts              — loadTaxonomy(), lookupTag(), filterByUnit()
  index.ts                — barrel: re-exports all public contracts
  __tests__/
    skill.test.ts
    exercise.test.ts
    evaluator-numeric.test.ts
    evaluator-exact.test.ts
    evaluator-boolean.test.ts
    catalog.test.ts
    error-taxonomy.test.ts

content/matematica/
  exercises.json          — single catalog file (~30 exercises)
```

## Interface Contracts

### Skill

```ts
type SkillId = `mat.u${1 | 2 | 3 | 4 | 5 | 6}.${string}`;
interface Skill {
  id: SkillId; unit: 1|2|3|4|5|6;
  displayName: string; description: string;
  prerequisites: SkillId[];
  learnerPurpose: string; teacherInterpretation: string[];
  tags: string[];
}
function validateSkill(input: unknown): Result<Skill, ValidationError>;
```

### Exercise

```ts
type ExerciseType = 'multiple-choice'|'true-false'|'numerical'|'symbolic'
  |'fill-blank'|'matching'|'ordering'|'free-response'|'graphical';
type Difficulty = 1|2|3|4|5;
type ExerciseId = `ex.u${1|2|3|4|5|6}.${string}.${number}`;
interface Exercise {
  id: ExerciseId; skillId: SkillId; type: ExerciseType;
  difficulty: Difficulty; prompt: string; expectedAnswer: string;
  commonErrorTags: string[]; pedagogicalNote: string;
}
function validateExercise(input: unknown, knownSkills: Set<SkillId>): Result<Exercise, ValidationError>;
```

### ErrorTag

```ts
type ErrorTagId = `u${1|2|3|4|5|6}_${string}`;
interface ErrorTag {
  id: ErrorTagId; unit: 1|2|3|4|5|6;
  description: string; examples: string[];
}
```

### Evaluator

```ts
interface EvaluationResult {
  correct: boolean; errorTag?: string; feedback?: string;
}
function evaluateAnswer(exercise: Exercise, userAnswer: string): EvaluationResult;
```

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Catalog format | Single `exercises.json` | Simpler for MVP; split later if needed |
| Validation return type | Custom `Result<T, E>` | No external deps; forces error handling |
| Evaluator dispatch | Type-based switch in `index.ts` | Each type gets own module; easy to extend |
| Numeric tolerance | `Math.abs(a - b) < 0.01` | Sufficient for MVP; configurable later |
| Catalog loading | Synchronous `import` | Static data; no async needed |
| Prerequisite validation | At catalog load time | Catches cycles and missing refs in one pass |
| Unsupported types | Return `{ correct: false, feedback: 'manual-review' }` | Spec requires no guessing |

## Data Flow

```
evaluateAnswer(exercise, userAnswer)
  → dispatch by exercise.type → numeric/exact/boolean/manual
  → if incorrect + matching pattern → attach errorTag
  → return EvaluationResult

loadCatalog()
  → read content/matematica/exercises.json
  → validate each exercise against known skill IDs
  → return Exercise[] or fail

loadTaxonomy()
  → validate coverage (≥2 tags/unit, no duplicates)
  → return ErrorTag[] or fail
```

## Testing Strategy

| Module | Focus | Approach |
|---|---|---|
| `skill.test.ts` | Valid/invalid IDs, cycles | Table-driven, 5+ invalid cases |
| `exercise.test.ts` | All 9 types, missing fields | One test per type + edges |
| `evaluator-numeric.test.ts` | Tolerance boundaries | Boundary value analysis |
| `evaluator-exact.test.ts` | Whitespace, case | Equivalence classes |
| `evaluator-boolean.test.ts` | All aliases (v/verdadero/true/sí) | Exhaustive matrix |
| `catalog.test.ts` | Coverage ≥5/unit, ordering | 30-exercise fixture |
| `error-taxonomy.test.ts` | Coverage ≥2/unit, uniqueness | Table-driven |

All tests are pure unit tests — no mocks, no I/O, no framework imports.

## Migration / Rollout

- **No migration needed** — `src/domain/` currently exports only constants. New exports are additive.
- **Rollback**: delete all new files under `src/domain/` (except `index.ts` which is restored) and `content/matematica/exercises.json`.
- **Rollout order**: models → error taxonomy → catalog → evaluator (each independently testable).

## Open Questions

| Question | Impact | Needed by |
|---|---|---|
| Multiple correct answers for numerical exercises? | Affects `expectedAnswer` type | Before evaluator |
| Symbolic equivalence (e.g., `x+1` vs `1+x`)? | `symbolic` type design | Mark manual-review for MVP |
| Lazy loading per unit? | Scale, irrelevant for 30 exercises | Defer |
| Where do 37 skills from spec 06 live? | `validateExercise` needs known IDs | Embed as `skill-catalog.ts` constant |

## Verification Checklist

- [ ] `pnpm run test` — all domain tests pass
- [ ] `pnpm run typecheck` — strict mode, no `any`
- [ ] `pnpm run build` — compiles cleanly
- [ ] `src/domain/` imports: zero React, Next.js, Supabase, browser APIs
- [ ] Catalog: 30 exercises, ≥5 per unit, all original
- [ ] Taxonomy: ≥12 error tags (≥2 per unit), no duplicates
- [ ] Evaluator: handles all 9 types (5 auto, 4 manual-review)
