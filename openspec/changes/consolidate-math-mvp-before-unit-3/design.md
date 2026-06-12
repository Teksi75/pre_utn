# Design: Consolidate Math MVP Before Unit 3

## Technical Approach

Consolidate the current Math MVP without changing visible student or teacher behavior. The implementation should first add safety-net tests around the existing static catalog, then backfill metadata, add CI/coverage signals, split exercise content into smaller unit/skill files, and finally remove duplicated unit parsing. The pedagogical goal is to protect exercise quality, feedback traceability, and progression before Unit 3 content expands.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Content composition | Keep static JSON imports, but centralize exercise composition in `src/domain/catalog/content-loaders.ts` and let `src/domain/catalog/index.ts` consume the same composed source. | Add a repository/persistence abstraction now. | Current loaders are pure/lazy and Supabase is out of scope; centralizing avoids duplicated split-file wiring without throwaway persistence. |
| Unit metadata | Add explicit `unit` metadata during exercise defaulting/validation and derive it from IDs only as a compatibility fallback. | Continue deriving unit everywhere from regex. | Specs require explicit grouping; fallback keeps existing content working during backfill. |
| Unit parsing | Create `src/domain/shared/skill-id.ts` with `parseSkillUnit(skillId): number` defaulting unknown patterns to `1`. | Keep private helpers in `teacher-home` and `next-step`. | Existing code duplicates regexes and one helper only matches one digit; shared pure helper aligns Teacher Home and catalog behavior. |
| Validation scope | Replace global U1 category minimums with per-unit validation config in the catalog domain. | One global minimum table. | U1 thresholds currently risk false positives for U2/U3; per-unit thresholds match practice coverage requirements. |
| CI signal | Add pnpm-based GitHub Actions plus non-blocking domain coverage reporting. | Make coverage blocking immediately. | A soft 60% signal improves review visibility without blocking useful consolidation work. |

## Data Flow

```text
content/matematica/exercises/**/*.json
        │
        ▼
content-loaders compose + defaults + traceability audit
        │
        ├─► loadCatalog/queryBySkill/queryByUnit
        └─► loadSkillBank ──► per-unit validatePracticeBank diagnostics

PracticeProgress + ready/pilot skills
        │
        ├─► deriveHomeNextStep
        └─► deriveTeacherHomeViewModel
              ▲
              └─ shared parseSkillUnit
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/domain/shared/skill-id.ts` | Create | Pure skill/unit helpers used by catalog, next-step, and teacher-home. |
| `src/domain/catalog/content-loaders.ts` | Modify | Compose split exercise files, apply explicit unit metadata, add difficulty/traceability audits, expose reusable composed exercise loading. |
| `src/domain/catalog/index.ts` | Modify | Stop duplicating per-skill merge logic; use content-loader composition and shared unit helper. |
| `src/domain/next-step/index.ts` | Modify | Replace private `parseSkillUnit` with shared helper; behavior unchanged. |
| `src/domain/teacher-home/index.ts` | Modify | Replace private `parseSkillUnit`; preserve the current `TeacherHomeInput` contract. |
| `src/domain/__tests__/*.test.ts` | Modify/Create | TDD tests for progression, metadata traceability, split-file equivalence, per-unit thresholds, helper reuse, and Teacher Home contract. |
| `content/matematica/exercises.json` | Modify | Backfill metadata and remove entries migrated to split files. |
| `content/matematica/exercises/unit-*.json` or `content/matematica/exercises/{unit}/{skill}.json` | Create | Smaller unit/skill exercise files loaded deterministically. |
| `vitest.config.ts` | Modify | Add coverage provider/config for domain coverage reporting. |
| `package.json` | Modify | Add `test:coverage` using `vitest run --coverage`. |
| `.github/workflows/ci.yml` | Create | Run `pnpm install`, `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, and coverage warning. |
| `openspec/changes/STATUS.json` | Modify | Register/annotate this active SDD change for portable multi-PC state. |

## Interfaces / Contracts

```ts
export function parseSkillUnit(skillId: string): number; // unknown => 1

export interface UnitValidationThresholds {
  readonly minimumExercises: number;
  readonly categoryMinimums?: Readonly<Record<string, number>>;
}
```

Exercise loading should accept exercise data already composed by static imports; future Supabase can supply the same `readonly Exercise[]` to query/validation logic without changing domain algorithms.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `parseSkillUnit`, difficulty monotonicity, traceability audit, per-unit thresholds | RED tests in `src/domain/__tests__/` before implementation. |
| Integration | Split catalog equals previous loaded IDs/counts and preserves sorting | Compare `loadCatalog`, `queryBySkill`, `queryByUnit`, and `loadSkillBank` outputs. |
| CI | pnpm gates and soft domain coverage | GitHub Actions plus `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, `pnpm run test:coverage`. |

## Migration / Rollout

No runtime data migration required. Roll out as four chained PRs: safety tests/backfill, coverage/CI, content split/validator, cleanup/GGA Linux validation. Roll back by reverting the affected slice; static content and loader changes are isolated.

## Open Questions

None. The Teacher Home contract preserves the current implementation (`availableSkills` + `nextStep`) and only replaces duplicated unit parsing.
