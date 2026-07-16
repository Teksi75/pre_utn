# Design: U5-01 Provisional Retirement — FocusSelector Availability Correction

## Technical Approach

Keep the completed static retirement intact. `FocusSelector` derives availability from the active skill count in its existing `SKILLS_BY_UNIT` map. A zero-skill unit remains visible but cannot be selected; the selector therefore has no reachable empty skill-list path. This is limited to the real selector contract and introduces no unit-entry mechanism.

## Architecture Decisions

| Decision | Options / trade-off | Choice and rationale |
|---|---|---|
| Availability source | Hard-code U5, or derive from catalog contents. | Use `SKILLS_BY_UNIT[unit].length > 0`. It reflects active content and automatically re-enables a future populated unit. |
| Empty unit UX | Hide Unit 5, allow a dead-end list, or retain a disabled option. | Render `Unidad 5 — Próximamente` as disabled. This keeps the curriculum visible without creating a selectable empty state. |
| Rejection boundary | Rely only on native UI, or also protect the change handler. | Native `disabled` blocks normal mouse/keyboard/form interaction; `handleUnitChange` also rejects an unavailable programmatic value and clears selection. |
| Unsupported fallback | Invent direct/stale/persisted/URL recovery, analysis types, or a banner. | Do not add or retain them. They describe no production entry point and would create an unimplemented contract. |

## Data Flow

```text
UNIT_*_SKILLS -> SKILLS_BY_UNIT -> active skill count -> select option
                                                    |-> > 0: select unit -> skill list
                                                    `-> 0: disabled + Próximamente
programmatic unavailable change ---------------------> reject -> no selected unit
```

Availability is render-derived, not React or persisted state. Once active skills are added, the same calculation makes the unit selectable on the next render.

## Investigation Evidence

No direct unit entry exists in the current flow:

- `PracticeSelectPhase` only passes `FocusSelector`'s `onSkillSelect` callback.
- `FocusSelector` owns `selectedUnit`; it emits only a selected `SkillId`.
- `usePracticeFlow` reads only the existing `?skill=` parameter and has no unit parameter, persisted-unit restore, route state, or unit setter.
- `page.tsx` renders the selector from that flow and supplies no unit input.

Consequently, direct, stale, persisted, and URL unit-selection fallbacks are not part of this design. `analyzeRequestedUnit`, `UnitRequestAnalysis`, an unavailable-unit banner, and an empty-unit placeholder are removed rather than replaced by a new external contract.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/components/practice/FocusSelector.tsx` | Modify | Keep count-derived availability; render disabled `Próximamente` options with native, ARIA, muted, and `cursor-not-allowed` semantics; reject unavailable programmatic values; remove banner and empty-list branches. |
| `src/app/practice/start-skill.ts` | Modify | Remove the unused unit-request analysis and its duplicate unit availability map. |
| `src/components/practice/__tests__/FocusSelector.test.tsx` | Create | Rendered, interactive availability tests using the repository's React/Vitest harness. |
| `src/components/practice/__tests__/FocusSelector.test.ts` | Modify | Remove source-inspection assertions superseded by rendered behavior coverage. |

## Interfaces / Contracts

```ts
type UnitAvailability = {
  readonly available: boolean;
  readonly activeSkillCount: number;
};
// available === activeSkillCount > 0
```

No domain model, URL, localStorage, persistence, flow, routing, Supabase, or SQL contract changes. Per-skill readiness remains separate from unit availability.

## Testing Strategy

| Layer | What to test | Approach |
|---|---|---|
| Component | Unit 5 is rendered as `Unidad 5 — Próximamente`, disabled, `aria-disabled="true"`, muted, and cursor-not-allowed. | Render `FocusSelector` in a `happy-dom` Vitest test; assert DOM attributes and visual classes. |
| Interaction | Native and programmatic attempts cannot select an empty unit or call `onSkillSelect`; no listbox is rendered. | Dispatch/select Unit 5 in the rendered control, then dispatch a change with value `5`; assert reset state, callback silence, and no listbox. |
| Regression | Populated units select normally; a non-empty Unit 5 becomes selectable after re-render. | Render against a populated fixture/map seam and assert enabled option plus normal skill-list interaction. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The existing `?skill=` behavior is unchanged; no unit URL behavior is added.

## Migration / Rollout

No migration required.

## Open Questions

None.
