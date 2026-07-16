# Design: U5-01 Provisional Retirement — FocusSelector Availability Correction

## Technical Approach

Keep the completed static retirement intact. `FocusSelector` derives availability from the active skill count in its existing `SKILLS_BY_UNIT` map. A zero-skill unit remains visible but cannot be selected; defensive selection in `handleUnitChange` makes the empty skill-list path unreachable from the user-facing flow. The selector renders only when a populated unit is selected, so the listbox is always non-empty. This is limited to the real selector contract and introduces no unit-entry mechanism.

## Architecture Decisions

| Decision | Options / trade-off | Choice and rationale |
|---|---|---|
| Availability source | Hard-code U5, or derive from catalog contents. | Use `SKILLS_BY_UNIT[unit].length > 0`. It reflects active content and automatically re-enables a future populated unit. |
| Empty unit UX | Hide Unit 5, allow a dead-end list, or retain a disabled option. | Render `Unidad 5 — Próximamente` as disabled. This keeps the curriculum visible without creating a selectable empty state. |
| Rejection boundary | Rely only on native UI, or also protect the change handler. | Native `disabled` blocks normal mouse/keyboard/form interaction; `handleUnitChange` also rejects an unavailable programmatic value and clears selection. |
| Empty-list fallback | Render a "Próximamente" pill on `selectedUnit !== null && skillsForUnit.length === 0`, or trust defensive selection. | Trust defensive selection. `handleUnitChange` rejects zero-skill values before they reach state, so the branch is unreachable from any user-facing flow; the pill was dead code. |
| Readiness/map state source | Memoize on `[accessibleSkills]`, recompute every render, or memoize on a derived `SKILLS_BY_UNIT` signature. | Recompute every render. `SKILLS_BY_UNIT` is a module-level constant whose contents can mutate between renders (HMR, test fixtures); the previous `useMemo([accessibleSkills])` made the map stale when a new skill was added, so the new skill rendered as `?? false` (disabled) even after the unit was re-enabled. Recomputing every render is O(N) over a small (~30–40) skill set and dominates only the JSX reconciliation already happening. |
| Unsupported fallback | Invent direct/stale/persisted/URL recovery, analysis types, or a banner. | Do not add or retain them. They describe no production entry point and would create an unimplemented contract. |

## Data Flow

```text
UNIT_*_SKILLS -> SKILLS_BY_UNIT -> active skill count -> select option
                                                    |-> > 0: select unit -> skill list
                                                    `-> 0: disabled + Próximamente
programmatic unavailable change ---------------------> reject -> no selected unit
SKILLS_BY_UNIT + accessibleSkills ------------------> readinessMap (per render)
                                                    |-> accessible: ready
                                                    `-> missing: not ready (Prerequisite / Próximamente)
```

Availability and the readiness/map state are render-derived, not React or persisted state. Once active skills are added (or the `accessibleSkills` map is updated), the same calculations make the unit selectable and the new skill usable on the next render — no flag mutation, no persistence seam, no component swap.

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
| `src/components/practice/FocusSelector.tsx` | Modify | Keep count-derived availability; render disabled `Próximamente` options with native, ARIA, muted, and `cursor-not-allowed` semantics; reject unavailable programmatic values; **recompute `readinessMap` every render** from the LIVE `SKILLS_BY_UNIT` contents and `accessibleSkills` prop (no stale `useMemo([accessibleSkills])`); remove the now-unreachable `showEmptyUnitState` branch and Próximamente pill JSX. |
| `src/app/practice/start-skill.ts` | **No net diff** | The corrective candidate briefly introduced `analyzeRequestedUnit` + a `SKILLS_BY_UNIT` mirror + extra `UNIT_*_SKILLS` imports here in commit `3a111c3`, then removed all of it in commit `57ef9bd`. The net candidate diff against `main` is empty — `git diff main..HEAD -- src/app/practice/start-skill.ts` returns no output. No replacement contract ships in the reduced surface. |
| `src/components/practice/__tests__/FocusSelector.test.tsx` | Modify | Rendered, interactive availability tests using the repository's React/Vitest harness. Mutates the catalog mock to prove live auto-re-enable. New "auto-re-enable with usable skill" test pushes a fixture skill into `UNIT_5_SKILLS`, mounts the selector with an `accessibleSkills` map marking the fixture as accessible, re-renders the same instance, selects U5 through the change handler, and asserts the skill button is enabled (`disabled === false`, `aria-disabled === "false"`) with a `Disponible` pill and a click that invokes `onSkillSelect`. Replaces the awkward "zero-skill render path shows the Próximamente pill" test with one that proves defensive selection directly. |
| `src/components/practice/__tests__/FocusSelector.test.ts` | Modify → Delete | Remove source-inspection assertions superseded by rendered behavior coverage. |

## Interfaces / Contracts

```ts
type UnitAvailability = {
  readonly available: boolean;
  readonly activeSkillCount: number;
};
// available === activeSkillCount > 0
```

No domain model, URL, localStorage, persistence, flow, routing, Supabase, or SQL contract changes. Per-skill readiness remains separate from unit availability and now resolves against the live `SKILLS_BY_UNIT` contents on every render.

## Testing Strategy

| Layer | What to test | Approach |
|---|---|---|
| Component | Unit 5 is rendered as `Unidad 5 — Próximamente`, disabled, `aria-disabled="true"`, muted, and cursor-not-allowed. | Render `FocusSelector` in a `happy-dom` Vitest test; assert DOM attributes and visual classes. |
| Interaction | Native and programmatic attempts cannot select an empty unit or call `onSkillSelect`; no listbox is rendered. | Dispatch/select Unit 5 in the rendered control, then dispatch a change with value `5`; assert reset state, callback silence, and no listbox. |
| Regression | Populated units select normally; a non-empty Unit 5 becomes selectable after re-render. | Render against a populated fixture/map seam and assert enabled option plus normal skill-list interaction. |
| Re-enable with usable skill | Pushing a skill into `UNIT_5_SKILLS` lets the student select U5 and pick a usable skill (button enabled, `aria-disabled="false"`, `Disponible` pill, click invokes `onSkillSelect`). | Mount with an `accessibleSkills` map marking the fixture as accessible; mutate the catalog mock; re-render; select U5; assert the rendered button is enabled and clickable. Catches the previous stale-`useMemo` bug — without the per-render recompute fix, the button renders with `?? false` (disabled). |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The existing `?skill=` behavior is unchanged; no unit URL behavior is added.

## Migration / Rollout

No migration required.

## Open Questions

None.
