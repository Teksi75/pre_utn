# Tasks: U5-01 — FocusSelector Availability Correction (Reduced Contract)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120–160 across Phases 4 + 5 + 7 (FocusSelector-only) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR — FocusSelector-only changes |
| Delivery strategy | auto-chain |
| Chain strategy | not-applicable |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: not-applicable
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|--------------------|
| 1 | FocusSelector count-derived availability + unavailable-unit option + live readiness recompute + dead-branch removal + live-removal invariant (Phase 7) | PR 1 | `pnpm exec vitest run --reporter=verbose "FocusSelector"` | `pnpm run typecheck && pnpm run build` | `src/components/practice/FocusSelector.tsx` revert + test file revert |

## Phase 1: FocusSelector — Derived Availability

- [x] 1.1 RED: Add test — Unit 5 `<option>` carries `disabled` attribute and `aria-disabled="true"` when `SKILLS_BY_UNIT[5].length === 0`
- [x] 1.2 RED: Add test — Unit 5 option label reads `Unidad 5 — Próximamente`; other units read `Unidad N`
- [x] 1.3 RED: Add test — Selecting a zero-skill unit does NOT invoke `onSkillSelect`; no empty skill list renders
- [x] 1.4 GREEN: In `FocusSelector.tsx`, add `getUnitAvailability(unit, skillsByUnit): { available, activeSkillCount }` deriving `available` from `skillsByUnit[unit]?.length > 0`
- [x] 1.5 GREEN: In unit `<option>`, apply `disabled` attribute and `aria-disabled` when `!available`; set label to `Unidad {n} — Próximamente`
- [x] 1.6 GREEN: Keep the skill-list render path gated on `selectedUnit !== null` (no separate empty-list branch)

## Phase 2: FocusSelector — Defensive Handler & Automatic Re-enable

- [x] 2.1 RED: Add test — `handleUnitChange` rejects a zero-skill value early and does NOT call `setSelectedUnit` with that value (defence-in-depth; the disabled `<option>` already blocks the user via the UI)
- [x] 2.2 RED: Add test — auto-re-enable: no per-unit `availableUnits`/`disabledUnits` flag is carried; availability is derived live from `SKILLS_BY_UNIT` so a future populated Unit 5 automatically becomes selectable
- [x] 2.3 GREEN: `handleUnitChange` validates target has skills before calling `setSelectedUnit`; guard stays in sync with `SKILLS_BY_UNIT` derivation
- [x] 2.4 GREEN: All `FocusSelector.test.tsx` rendered assertions pass (existing source-string tests superseded by rendered behaviour coverage)

## Phase 3: FocusSelector — Rendered Integration Tests

- [x] 3.1 RED: Add test — render `<FocusSelector>` with `SKILLS_BY_UNIT[5].length === 0`; verify: (a) option 5 is `disabled` + `aria-disabled="true"`, (b) label is `Unidad 5 — Próximamente`, (c) selecting it does not trigger `onSkillSelect`, (d) no empty skill listbox appears
- [x] 3.2 GREEN: All FocusSelector rendered tests pass

## Phase 4: FocusSelector — Live Readiness/Map Recompute (audit-finding fix)

- [x] 4.1 RED: Add test — pushing a skill into `UNIT_5_SKILLS` lets the student select U5 and pick a usable, non-empty skill option (button enabled, `aria-disabled="false"`, "Disponible" pill present, click invokes `onSkillSelect` with the new skill ID)
- [x] 4.2 GREEN: Drop the `useMemo([accessibleSkills])` wrapper around `readinessMap` so the map recomputes every render from the LIVE `SKILLS_BY_UNIT` contents AND the `accessibleSkills` prop — a stale memoization made the new skill render as `?? false` (disabled, `Próximamente`) even after the unit was re-enabled
- [x] 4.3 GREEN: All FocusSelector rendered tests pass

## Phase 5: FocusSelector — Remove Unreachable Empty-State Branch (audit-finding fix)

- [x] 5.1 RED: Replace the awkward "zero-skill render path shows the Próximamente pill, never an empty listbox" test (which exercised the dead branch indirectly via defensive-handler reset) with the defensive-selection test already proving "no reachable empty listbox via interaction"
- [x] 5.2 GREEN: Remove the `showEmptyUnitState` derivation and the Próximamente pill render branch — under defensive selection (`handleUnitChange` rejects zero-skill values) `selectedUnit !== null` always implies `skillsForUnit.length > 0`, so the pill branch is unreachable dead code. The "no reachable empty list" contract is enforced by defensive selection, not by a render-time fallback
- [x] 5.3 GREEN: All FocusSelector rendered tests pass

## Phase 6: Validation

- [x] 6.1 Run `pnpm exec vitest run --reporter=verbose "FocusSelector"` — 1 file, 7/7 rendered tests pass
- [x] 6.2 Run `CI=true pnpm run test` — 187 files, 3178 tests pass
- [x] 6.3 Run `pnpm run typecheck` — no errors
- [x] 6.4 Run `pnpm run build` — clean build (11/11 static pages)

## Phase 7: FocusSelector — Live-Removal Invariant (audit-finding fix)

- [x] 7.1 RED: Add test — selecting a populated unit, emptying its live skill array between renders, and re-rendering MUST (a) render no listbox, (b) reset `select.value` to `""`, (c) flip the selected unit's option to the disabled/Próximamente state, and (d) recover automatically when the live skills return; the same mounted instance MUST still let a different contentful (unaffected) unit be selected and render its real skill list
- [x] 7.2 GREEN: Replace the module-level `SKILLS_BY_UNIT` capture with a per-render frozen object whose properties are `get` accessors that read the live `UNIT_*_SKILLS` exports each time, so closures (including `handleUnitChange`) always see the current catalog length when they consult `getUnitAvailability`; derive an `effectiveSelectedUnit` from `SKILLS_BY_UNIT[selectedUnit].length > 0` on every render and use it for the `<select value=…>`, the `skillsForUnit` derivation, and the listbox render gate. No `useState` setter, no URL parameter, no localStorage key, no component swap is introduced
- [x] 7.3 GREEN: All FocusSelector rendered tests pass (8/8 after Phase 7)

## Superseded by Reduced Contract

The following tasks are **superseded** (removed from this plan — not implemented):

- ~~Phase 2 (original 2.1–2.4): `analyzeRequestedUnit` in `start-skill.ts` with `UnitRequestAnalysis` discriminated union~~
- ~~Phase 3 (original 3.1–3.2): `UnavailableUnitBanner` inline in `FocusSelector` with `?unit=` URL parsing or localStorage persistence~~
- ~~Phase 5 (original 5.1–5.2): `start-skill.test.ts` integration tests for `analyzeRequestedUnit` return values and banner message~~
- ~~Phase 6 (original 6.1–6.4): Full suite validation including `start-skill` tests~~

These were part of the original scope but are out of scope for the reduced contract. Replan if the full `start-skill.ts` + banner contract is revived.

## Out-of-Scope Reminders

- Do NOT modify U3, U4, U5-02, archived U5-00, canonical U5 content, SQL, or persistence
- Do NOT add `analyzeRequestedUnit`, `UnitRequestAnalysis`, or `start-skill.ts` changes
- Do NOT add URL parsing, localStorage persistence, or `?unit=` route parameters
- Do NOT add a banner — the disabled option is the only UI signal for empty units
- Do NOT hardcode U5 unavailability — use `SKILLS_BY_UNIT[unit].length > 0` derivation
- Do NOT restore provisional IDs, canonical U5 content, aliases, or mappings
- Do NOT add a render-time empty-list fallback — defensive selection is the contract; the empty-list branch is dead code under it
- Do NOT add `useState` setters, URL parameters, or localStorage keys to clear the selection — the live-removal invariant is enforced by per-render derivation, not by mutating component state on the down-render path
