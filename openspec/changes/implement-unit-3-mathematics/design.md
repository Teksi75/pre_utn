# Design: Implement Unit 3 Mathematics

## Technical Approach

Activate Unit 3 by extending the existing U1/U2 content pipeline: add U3 JSON content, register it in lazy loaders, compose `unit-3.json` exercises before the legacy monolith, then expose the already-declared U3 skills through pilot registration and the existing `/learn/matematica` UI. No new routes, evaluators, domain modules, or redesign are needed.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Content source | Create split U3 files under `content/matematica/{theory,examples,feedback,exercises}/unit-3.json`. | Extend `exercises.json`; add per-skill files. | Matches U1/U2 unit-file pattern and keeps legacy monolith untouched. |
| Exercise composition | Register `_unit3Exercises` before `_exercisesJson` in `src/domain/catalog/index.ts`; add `UNIT_EXERCISE_FILES[3]` in `content-loaders.ts`. | Compose after monolith. | Unit files are higher priority; duplicate IDs dedupe deterministically while preserving legacy U3 entries in `exercises.json`. |
| UI | Extend `UNIT_KEYS`, `UNIT_LABELS`, `PILOT_SKILLS`, and copy only. | New U3 route or redesigned cards. | Existing learn pages already derive cards/pages from loaders and `PILOT_SKILL_UNIT_MAP`. |
| Error feedback | Add U3 taxonomy tags, detector sets/rules only where deterministic, and feedback mappings. | Reuse U2 tags for U3. | Avoid unsupported/orphan tags and keep feedback pedagogically scoped to U3. |
| Delivery | Use chained PRs, preferably stacked-to-main. | Single PR. | Forecast exceeds 400 changed lines by several multiples. |

## Data Flow

```text
unit-3 JSON ──→ content-loaders ──→ catalog/index ──→ practice/learn consumers
      │                │                    │
      └── feedback ────┴── readiness/bank validation

PILOT_SKILLS ──→ PILOT_SKILL_UNIT_MAP ──→ /learn/matematica/[skillId]
```

## File Changes

| File | Action | Description |
|---|---|---|
| `content/matematica/theory/unit-3.json` | Create | 8 `TheoryNode`s using `concepts`, `notation`, `commonMistakes`, `practicePrompts`, `canonicalTrace`; no `pageReferences`. |
| `content/matematica/examples/unit-3.json` | Create | 16–24 `WorkedExample`s, ≥2 per U3 skill. |
| `content/matematica/feedback/unit-3.json` | Create | 8–12 U3 mappings for declared `u3_*` tags. |
| `content/matematica/exercises/unit-3.json` | Create | 32–48 exercises; MC for intervals, systems, two-root answers; numerical only for scalar answers. |
| `content/matematica/exercises.json` | Preserve | Do not edit/remove 5 legacy U3 entries; new unit source loads before it. |
| `src/domain/catalog/content-loaders.ts` | Modify | Import U3 theory/examples/feedback/exercises; add RAW_REGISTRY keys; add `UNIT_EXERCISE_FILES[3]`; set `UNIT_THRESHOLDS["unit-3"] = 24`. |
| `src/domain/catalog/index.ts` | Modify | Import `_unit3Exercises`; call `addExercises(_unit3Exercises, "unit-3", PER_SKILL_SKILL_IDS)` before `_exercisesJson`. |
| `src/domain/error-taxonomy/index.ts` | Modify | Add U3 tags for linears, quadratics, inequalities, absolute value, line, systems, exponentials, logarithms. |
| `src/domain/evaluator/error-tagging.ts` | Modify | Add deterministic U3 detector sets/rules; leave ambiguous free-text detection out. |
| `src/domain/catalog/pilot-skills.ts` | Modify | Add 8 U3 entries after U2, with `unitKey: "unit-3"`. |
| `src/app/learn/matematica/page.tsx` | Modify | Add `unit-3` label/key. |
| `src/app/page.tsx`, `src/app/learn/page.tsx` | Modify | Update unit copy to include U3 without changing brand voice. |
| `src/domain/__tests__/*`, `src/app/**/__tests__/*`, `src/components/**/__tests__/*` | Modify/Create | Update baselines/fixtures and add U3 content/catalog/taxonomy coverage. |

## Interfaces / Contracts

`unit-3.json` exercises must stay inside existing `Exercise`: `id`, `skillId`, supported `type`, `difficulty`, `prompt`, `expectedAnswer`, `options?`, `commonErrorTags`, `pedagogicalNote`, optional trace/link metadata. New IDs should be unique unless intentionally shadowing a legacy ID; any shadow must be documented in the test name.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Taxonomy tags, answer contracts, detector routing | Vitest tests beside existing U2 suites. |
| Integration | `loadCatalog()`, `loadSkillBank()`, thresholds, split ordering, duplicate IDs | Extend catalog/content-loader/baseline tests for U3. |
| UI | `/learn/matematica` includes U3; U3 skill pages resolve; old “not pilot” fixtures move to U4 | Existing page/component tests. |
| Verification | Full project | `pnpm run test`, `pnpm run typecheck`, `pnpm run build`. |

## Migration / Rollout

No data migration required. Roll out in chained PRs: (1) U3 taxonomy + theory/examples/feedback, (2) exercises + loader/catalog wiring + baselines, (3) pilot/UI activation + final verification. Recommended strategy: stacked PRs to `main`; if using a feature tracker branch, keep tracker draft/no-merge.

## Open Questions

- [ ] Should intentional shadowing of the 5 legacy U3 IDs be allowed, or must all new IDs be non-colliding even if legacy diagnostics remain visible?
