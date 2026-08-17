# Design: Unit 1 Rotonda Problem-Solving Capstone

## Technical Approach

Add an isolated capstone bounded by the existing Unit 1 completion signal: all eight Unit 1 pilot skills must return `mastered` from `computeMasteryLevel`. Extract that predicate for the home view and route gate. A prominent home card opens `/capstone/unidad-1-rotonda`; it is not a practice overlay and does not alter `phases.ts`, `usePracticeFlow`, mastery, challenges, or Unit 2.

The server route loads static content. A client gate checks active-student practice progress; a client runner owns theory/stage interaction and isolated persistence. Theory renders first, stages mount in order, and general concepts omit substituted rotonda results. Expected answers are never rendered ahead of their stage. Stage 3 reveals the exact/rounded chain only after its final item.

## Architecture Decisions

| Area | Choice | Rejected | Rationale |
|---|---|---|---|
| Entry | `isUnitComplete(1, progress, PILOT_SKILLS)` plus home card and dedicated route | Single-skill trigger, post-skill overlay | Honors genuine completion and the selected surface. |
| Content | Dedicated JSON/loader; `TheoryNode` and `ExerciseBaseShape` contracts | Third U1 skill or catalog change | Reuses `TheoryCard`, `ExerciseAnswerInput`, and `evaluateAnswer` without practice/mastery coupling. |
| Stages | Five ordered stages; `Llevarlo a cabo` has numerical `D`, `r`, `d` items; `Verificar` has multiple true/false/numerical checks | One final-number field; multi-select/structured/free text | Preserves modeling within supported controls. An isolated numeric adapter accepts decimal comma; global behavior stays unchanged. |
| State | `CapstoneProvider`; validated per-student `pre-utn.capstone.v1` map with `everCompleted` | Base/challenge stores or persistence-port expansion | Follows challenge isolation without mastery contamination or remote migration. |

## Data Flow

```text
active student ─→ home loader ─→ whole-U1 predicate ─→ UnitCapstoneCard
       │                                      │                    │
       └── capstone.v1 ─→ CapstoneProvider ───┴──→ dedicated route
                                      theory → stages → feedback → summary
```

The card derives hidden/not-started/in-progress/completed states; the runner exposes the current stage. The store stamps writes with `getActiveProfileId()`, preserves other students, fails closed without a profile, and treats malformed/version-mismatched/stale stage IDs as empty incomplete state. `everCompleted` survives repeats; current stage/item progress remains resumable.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/domain/student-home/index.ts` | Modify | Extract/export whole-unit completion for route derivation. |
| `src/domain/capstone/index.ts` | Create | Pure stage/reveal rules, card state, comma-normalizing evaluator adapter. |
| `src/domain/catalog/capstone-loader.ts` | Create | Lazy parser/validator; rejects unsupported controls and bad stage order. |
| `content/matematica/capstones/unit-1-rotonda.json` | Create | Theory plus five stages; theory gives model/formula/method without final result. |
| `src/lib/capstone-progress.ts` | Create | Versioned active-student store and repeat semantics. |
| `src/components/home/HomeNextStepClient.tsx`, `UnitCapstoneCard.tsx` | Modify/Create | Load state and render prominent neutral-Spanish card after the hero. |
| `src/app/capstone/unidad-1-rotonda/page.tsx`, `src/components/capstone/*` | Create | Server shell, eligibility gate, provider runner, explicit views. |
| `src/**/__tests__/*capstone*`, `tests/e2e/specs/u1-rotonda-capstone.spec.ts` | Create/Modify | TDD, storage, content, UI, routing, a11y, regression, E2E. |

## Interfaces / Contracts

```ts
type StageId = "comprender" | "buscar-plan" | "llevarlo-a-cabo" | "verificar" | "comunicar";
interface CapstoneProgress {
  schemaVersion: 1; current: "theory" | StageId | "complete";
  completedItemIds: readonly string[]; everCompleted: boolean;
}
interface CapstoneStage { id: StageId; items: readonly CapstoneItem[]; }
```

The loader injects an evaluator-only U1 identity; it is never registered in `PILOT_SKILLS`, the catalog, route units, or progress writes. Stage 3 uses `D = √(70² + 30²) = 10√58 \cong 76.16 m` and `dmax = 2(D − 30 − 10) = 20√58 − 80 \cong 72.32 m`; rounded values never use `=`.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Domain | All-eight completion, transitions, reveal policy, comma/dot tolerance | Pure Vitest RED→GREEN. |
| Storage | Isolation, malformed/versioned/stale recovery, repeats, no-profile writes | Inject storage; assert no unlock or cross-student reads. |
| Content | Stage order/counts, formulas, controls, voice/source scans | Loader contracts plus JSON validation. |
| UI/routing | Card, theory-first route, announcements, focus/labels, 44px controls, narrow layout | Component and route integration tests. |
| E2E | Mastered-U1 seed, reload at `Verificar`, comma input, repeat, Unit 2/base/challenge invariance | Playwright; practice phase snapshot unchanged. |

## Threat Matrix

| Boundary | Applicability | Planned RED tests |
|---|---|---|
| Documentation-like paths | N/A — capstone JSON is data, not executable documentation | None |
| Git repository selection | N/A — no Git command or repository selector | None |
| Commit state | N/A — no commit automation | None |
| Push state | N/A — no push automation | None |
| PR commands | N/A — no PR command construction | None |

## Migration / Rollout

No migration required. `pre-utn.capstone.v1` is additive; invalid data resets safely, old clients ignore it, and rollback removes only the capstone surface/store. Delivery seams are domain/loader, content, storage, home/route entry, and runner/E2E; each stays below 400 authored lines under `auto-chain`.

## Open Questions

- None. Cross-device capstone sync is intentionally a separate future persistence change.
