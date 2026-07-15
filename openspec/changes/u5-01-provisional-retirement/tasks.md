# Tasks: U5-01 — FocusSelector Availability Correction

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150–200 (net additions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR — all changes are in the same focused area |
| Delivery strategy | auto-chain |
| Chain strategy | not-applicable |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: not-applicable
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | FocusSelector count-derived availability + unavailable-unit fallback | PR 1 | `pnpm test -- --grep "FocusSelector\|start-skill" --run` | `pnpm run build` | `src/components/practice/FocusSelector.tsx`, `src/app/practice/usePracticeFlow.ts`, `src/app/practice/page.tsx` revert |

## Phase 1: FocusSelector — Derived Availability

- [x] 1.1 RED: Add test — Unit 5 `<option>` carries `disabled` attribute and `aria-disabled="true"` when `SKILLS_BY_UNIT[5].length === 0`
- [x] 1.2 RED: Add test — Unit 5 option label reads `Unidad 5 — Próximamente`; other units read `Unidad N`
- [x] 1.3 RED: Add test — Selecting a zero-skill unit does NOT invoke `onSkillSelect`; no empty skill list renders
- [x] 1.4 GREEN: In `FocusSelector.tsx`, add `getUnitAvailability(unit: number): { available: boolean; activeSkillCount: number }` deriving `available` from `SKILLS_BY_UNIT[unit].length > 0`
- [x] 1.5 GREEN: In unit `<option>`, apply `disabled` attribute and `aria-disabled` when `!available`; set label to `Unidad {n} — Próximamente`
- [x] 1.6 GREEN: Guard `selectedUnit !== null && skillsForUnit.length === 0` in the skill list render path; show a single "Próximamente" pill instead of an empty listbox

## Phase 2: Flow Guard — Unavailable-Unit Rejection

- [x] 2.1 RED: Add test in `start-skill.test.ts` — `analyzeRequestedUnit("5")` returns `{ kind: "unavailable-unit"; unit: "5" }` when `SKILLS_BY_UNIT[5].length === 0`
- [x] 2.2 RED: Add test — direct/stale unit selection exposes the banner with exact text `Unidad 5 todavía no está disponible. Estamos preparando sus contenidos.` (state path, no new URL contract — the banner reads the same message via the inline UnavailableUnitBanner triggered by the FocusSelector React state)
- [x] 2.3 GREEN: In `start-skill.ts`, add `UnitRequestAnalysis` discriminated union with `"unavailable-unit"` variant and `analyzeRequestedUnit(unit: string | null): UnitRequestAnalysis`
- [x] 2.4 GREEN: Banner is rendered inline inside `FocusSelector` when React state has an unavailable `selectedUnit` — no `?unit=` URL parsing, no new localStorage, no new persistence seam, consistent with the "no new persistence/URL contract" user mandate

## Phase 3: Page — Unavailable-Unit Banner

- [x] 3.1 GREEN: Inline `UnavailableUnitBanner` lives inside `FocusSelector.tsx` with the literal `UNAVAILABLE_UNIT_MESSAGE = "Unidad 5 todavía no está disponible. Estamos preparando sus contenidos."` (exact user-mandated copy) plus a "Volver al selector" button calling `setSelectedUnit(null)`
- [x] 3.2 GREEN: Banner renders above the skill listbox when `selectedUnit !== null && skillsForUnit.length === 0` (the same empty-state guard from task 1.6); no `flow.blockedUnit` shape is added because the trigger lives in the selector's own state

## Phase 4: FocusSelector Component Tests

- [x] 4.1 RED: Add test — `handleUnitChange` rejects a zero-skill value early and does NOT call `setSelectedUnit` with that value (defence-in-depth against stale/programmatic state; the disabled `<option>` already blocks the user via the UI)
- [x] 4.2 RED: Add test — auto-re-enable: no per-unit `availableUnits`/`disabledUnits` flag is carried; availability is derived live from the `SKILLS_BY_UNIT` map so a future populated Unit 5 automatically becomes selectable
- [x] 4.3 GREEN: All `FocusSelector.test.ts` assertions pass (existing + 7 new U5-01 tests)

## Phase 5: Flow/Page Integration Tests

- [x] 5.1 RED: Add test — `analyzeRequestedUnit("5")` returns `{ kind: "unavailable-unit"; unit: "5" }` and the banner's exact Spanish message is rendered (verified via source inspection)
- [x] 5.2 GREEN: All `start-skill.test.ts` assertions pass (existing + 5 new U5-01 tests)

## Phase 6: Validation

- [x] 6.1 Run `pnpm test -- --grep "FocusSelector\|start-skill\|unavailable\|blocked.*unit" --run` — all 3200 tests pass (187 files)
- [x] 6.2 Run `pnpm run test` — full suite green: 187 files / 3200 tests pass (baseline was 187 files / 3188 tests; this run adds the 12 new U5-01 coverage tests)
- [x] 6.3 Run `pnpm run typecheck` — no errors (`tsc --noEmit` exit 0)
- [x] 6.4 Run `pnpm run build` — clean build (post-push full check: ✓ Compiled successfully in 6.4s, 11/11 static pages generated, route `/practice` resolves)

## Out-of-Scope Reminders

- Do NOT modify U3, U4, U5-02, archived U5-00, canonical U5 content, SQL, or persistence
- Do NOT add migration, sidecar, marker, write gate, or adapter changes
- Do NOT hardcode U5 unavailability — use `SKILLS_BY_UNIT[unit].length > 0` derivation
- Do NOT change URL format, localStorage schema, or add new route parameters
- Do NOT restore provisional IDs, canonical U5 content, aliases, or mappings
- The `BlockedReason = "unavailable-unit"` is a UI-layer string, not a persistence or domain model change
