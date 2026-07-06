# Design: Align U2 Practice with Official UTN 2025 Guide

## Technical Approach

Implement this as a catalog-content alignment, not an architecture change. Keep the existing `unit-2.json` loader path through `loadExercisesForSkill`, preserve the 7 current Unit 2 skills, and add official-guide coverage as append-only exercise content plus stronger domain tests. The first implementation artifact must be the audit document; the exercise additions and test changes follow it in chained PR slices under the 400-line review budget.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Catalog architecture | Keep `content/matematica/exercises/unit-2.json` and current loaders | New per-skill files or loader changes | `loadExercisesForSkill` already composes unit files by `skillId`; changing loading would add risk unrelated to official alignment. |
| Rational expressions | Store under `mat.u2.ecuaciones_fraccionarias` with `category: expresiones_racionales` | Create `mat.u2.expresiones_racionales` | The spec forbids new U2 skills; `Exercise.category?: string` already exists and is additive. |
| Answer controls | Use `multiple-choice`, `matching`, or `ordering`; `numerical` only for one finite scalar | Free-form symbolic/fill-blank algebra | Existing validation and tests reject structured numerical/free-text answers; structured math must be selected, not typed. |
| PR sequencing | Audit first, then one content/test slice per skill family | One large catalog PR | `force-chained` and 400-line budget require independently reviewable, revertable slices. |

## Data Flow

```text
Audit map (02_ej_utn.pdf)
  -> append exercises in unit-2.json
  -> loadExercisesForSkill(skillId)
  -> validateExercise + answer-contract tests
  -> U2 shape/coverage assertions
```

No runtime data flow changes are planned.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `docs/auditorias/unidad-2/alineacion-02-ej-utn.md` | Create | Official coverage map, trace source, and per-family gaps; must be created before content/test implementation artifacts. |
| `content/matematica/exercises/unit-2.json` | Modify | Append new U2 exercises only; preserve existing 31 IDs and 7 skills. |
| `src/domain/__tests__/exercises-u2-shape.test.ts` | Modify | Replace legacy count floors with official family floors, trace assertions, rational-expression category checks, and scalar-only numerical guards. |
| `src/domain/__tests__/catalog-answer-contract.test.ts` | Modify | Extend structured-answer audit coverage for U2 domain-rich and rational-expression cases if needed. |
| `src/domain/__tests__/catalog-content.test.ts` | Modify | Add official trace/source consistency checks if they fit better at raw catalog level. |
| `src/domain/error-taxonomy/index.ts` | Modify | Add missing `u2_*` error tags for long division, notable products/powers, factorization cases, rational expressions, and denominator/domain mistakes. |
| `openspec/specs/math-exercise-catalog/spec.md` | Modify | Archive final accepted coverage/input restrictions after implementation. |
| `openspec/specs/ecuaciones-fraccionarias/spec.md` | Modify | Archive rational-expression and fractional-equation requirements after implementation. |

## Interfaces / Contracts

Existing contract is sufficient:

```ts
interface Exercise {
  readonly skillId: SkillId;
  readonly type: ExerciseType;
  readonly expectedAnswer: string;
  readonly category?: string;
  readonly tags?: readonly string[];
}
```

New official-alignment exercises must include `canonicalTrace` entries for `02_ej_utn.pdf` and a searchable tag such as `02_ej_utn_<item>`. Rational-expression exercises must set `category: "expresiones_racionales"`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit/domain | Existing exercises still validate; `numerical` remains scalar-only | Run `pnpm run test:run`; extend `catalog-answer-contract.test.ts` only where current guards are insufficient. |
| Content regression | 7 U2 skills preserved, >=5 per skill, official family floors met, no new rational-expression skill | Extend `exercises-u2-shape.test.ts` with family/category/trace assertions. |
| Integration/build | Catalog imports and strict TS remain valid | Run `pnpm run typecheck` and `pnpm run build`. |

## Migration / Rollout

No data migration required. Roll out as chained PRs: audit document first, then incremental append-only content/test slices by skill family. Each slice is revertable without schema or loader rollback.

## Open Questions

None.
