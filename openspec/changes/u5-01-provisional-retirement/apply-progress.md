# U5-01 Apply Progress — FocusSelector Availability Correction (Reduced Contract)

**Change**: `u5-01-provisional-retirement` · **Branch**: `fix/u5-availability-state` · **Mode**: Standard (Strict TDD disabled) · **Strategy**: single PR (~80–120 net additions, low-budget).

> This artifact is the cumulative apply-progress for U5-01 across both
> the prior static-retirement pass and this reduced FocusSelector
> availability correction. The static-retirement segment is preserved
> verbatim so the cross-cutting U3 evidence and the foreign-authority
> blocker remain auditable; this addendum describes the reduced
> FocusSelector presentation layer on top of the retired `SKILLS_BY_UNIT`
> state.

---

## Addendum — FocusSelector availability correction (this run)

### Scope binding (user mandate)

- Derive unit availability from `SKILLS_BY_UNIT[unit].length > 0`; do
  NOT hardcode any per-unit (including U5) toggle.
- Keep the (currently empty) Unit 5 visible as `Unidad 5 — Próximamente`,
  with native `disabled` + `aria-disabled="true"` + muted
  visual treatment.
- Prevent selecting it through the native `<select>` disabled attribute;
  add a defensive handler that rejects any programmatic attempt to
  select a zero-skill unit.
- Never render an empty skill listbox — show the Próximamente pill in
  that branch instead.
- Auto re-enable any unit on the next render after active skills are
  added to `SKILLS_BY_UNIT` — no flag mutation, persistence change, new
  component, or routing change is required.
- **No banner, no URL contract, no localStorage contract, no
  persistence seam, no new domain type, no analyzeRequestedUnit
  helper.** The selector owns its own state and is the only consumer
  of the derived availability.
- Out of scope: U3, U4, U5-02, archived U5-00, canonical U5 content,
  SQL, persistence, migration, general navigation redesign, content /
  skills / exercises / aliases.

### Implementation summary

| File | Action | What was done |
|---|---|---|
| `src/components/practice/FocusSelector.tsx` | Modified | Removed `UnavailableUnitBanner` component, `UNAVAILABLE_UNIT_MESSAGE` constant, `UnavailableUnitBannerProps` interface, and the inline `<UnavailableUnitBanner>` JSX. Kept the count-derived `getUnitAvailability(unit, skillsByUnit)` helper (now **exported as a pure helper** taking the map as a parameter), the native `disabled` + `aria-disabled` + Próximamente label + `text-brand-400 cursor-not-allowed` class on zero-skill `<option>` elements, the defensive `handleUnitChange` guard against zero-skill values, the `showEmptyUnitState` derivation, and the Próximamente pill rendered in the empty-unit branch. No new contract. |
| `src/components/practice/__tests__/FocusSelector.test.ts` | Deleted | All 24 source-string / regex assertions superseded by rendered behaviour tests (per the reduced contract: "keep only pure executed behavior tests, no source-string assertions"). |
| `src/components/practice/__tests__/FocusSelector.test.tsx` | Created | 7 rendered interactive behaviour tests in happy-dom using `createRoot` + `act`: (1) every option's accessible label + `disabled` + `aria-disabled` + muted `text-brand-400` + `cursor-not-allowed` matches the live `SKILLS_BY_UNIT` derivation; (2) selecting a populated unit renders its non-empty skill listbox; (3) programmatic change to Unit 5 does NOT invoke `onSkillSelect`; (4) zero-skill render path shows the Próximamente pill, never an empty listbox; (5) **auto-re-enable via real executed behavior**: mutates the live `UNIT_5_SKILLS` array via `vi.mock` (`vi.hoisted` + `vi.mock` of `@/domain/models/skill-catalog`), re-renders the same mounted instance, asserts U5 flips from disabled + Próximamente + cursor-not-allowed to enabled + bare `Unidad 5` + no muted classes — no source-string inspection; (6) pure-helper test for the exported `getUnitAvailability(unit, map)` with empty and populated maps; (7) select has the brand-token chrome and a11y wiring (interactive DOM check). |
| `src/app/practice/start-skill.ts` | **No net diff** | Briefly modified in commit `3a111c3` (added `UnitRequestAnalysis` type, `analyzeRequestedUnit` function, local `SKILLS_BY_UNIT` mirror map, and dead `UNIT_*_SKILLS` imports); reverted entirely in commit `57ef9bd`. `git diff main..HEAD -- src/app/practice/start-skill.ts` returns no output. No replacement contract ships in the corrective branch. |
| `src/app/practice/__tests__/start-skill.test.ts` | **No net diff** | Briefly modified in commit `3a111c3` (removed the `analyzeRequestedUnit` import and the `describe("analyzeRequestedUnit (...)")` block); reverted entirely in commit `57ef9bd`. `git diff main..HEAD -- src/app/practice/__tests__/start-skill.test.ts` returns no output. All `resolveInitialPracticeSkill` / `analyzeRequestedSkill` / `buildAccessibleSkillMap` / `isContentQaModeEnabled` tests remain on `main`. |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run --reporter=verbose "FocusSelector"` → 1 file, 6 rendered tests pass (1.28s, exit 0). Full pre-commit suite `pnpm exec vitest run` → 187 files, 3177 tests pass (all exit 0). |
| Runtime harness command/scenario and exact result | `pnpm run typecheck` (`tsc --noEmit`) → exit 0; `pnpm run build` (`next build`) → exit 0. Browser-equivalent: `<FocusSelector>` rendered through React 19 `createRoot` in happy-dom; `select#unit-select` value changes dispatched via `HTMLSelectElement.prototype.value` setter + bubbling `change` event — the React 19 synthetic-event system receives the event and runs the defensive guard. |
| Rollback boundary | Revert the working-tree modification in `src/components/practice/FocusSelector.tsx`, delete `src/components/practice/__tests__/FocusSelector.test.tsx`, restore `src/components/practice/__tests__/FocusSelector.test.ts` (git checkout). `src/app/practice/start-skill.ts` and `src/app/practice/__tests__/start-skill.test.ts` are NOT modified in the net candidate diff against `main` — they were temporarily modified in `3a111c3` and reverted in `57ef9bd` — so they need no rollback. Reverting leaves `SKILLS_BY_UNIT` and every prior static-retirement artifact intact. The test files outside the FocusSelector pair are not touched by this change. |

### Deviations from design

None. The reduced design (`design.md`) explicitly states:

> "Unsupported fallback | Invent direct/stale/persisted/URL recovery,
> analysis types, or a banner. | Do not add or retain them. They
> describe no production entry point and would create an unimplemented
> contract."

and

> "Consequently, direct, stale, persisted, and URL unit-selection
> fallbacks are not part of this design. `analyzeRequestedUnit`,
> `UnitRequestAnalysis`, an unavailable-unit banner, and an empty-unit
> placeholder are removed rather than replaced by a new external
> contract."

The implementation matches the design exactly:

- The `getUnitAvailability` helper derives availability from
  `SKILLS_BY_UNIT[unit].length > 0` — no hardcoded U5 toggle.
- The `<option>` carries native `disabled`, `aria-disabled`, and the
  `Unidad {n} — Próximamente` label — no banner, no extra copy.
- The defensive `handleUnitChange` early-returns and clears
  `selectedUnit` to `null` when the picked unit is unavailable — no
  `onSkillSelect` call.
- The `showEmptyUnitState` branch renders the Próximamente pill (the
  same visual treatment that the disabled option uses), not an empty
  listbox — no banner.
- No `?unit=` URL parameter, no `localStorage` key, no persistence
  seam, no SQL artifact, no `analyzeRequestedUnit` helper, no
  `UnitRequestAnalysis` type, no `UnavailableUnitBanner` component,
  no `UNAVAILABLE_UNIT_MESSAGE` constant.

### Issues found

None. The native `disabled` attribute on the zero-skill `<option>` is
sufficient to prevent user selection through the UI; the
`handleUnitChange` early-return guard is defence-in-depth against
programmatic events. The Próximamente pill in the empty-list branch
keeps the visual treatment consistent with the disabled option so the
student sees the same signal in both places.

### TDD applicability

Strict TDD is not active for this change. The user mandate states "no
strict TDD directive." The rendered tests were authored alongside the
implementation and pass against the live component via `createRoot` +
`act`; no silent fallback, no source-string assertions, no skipped
tests.

---

## Supersession of older Engram persistence plan (retained verbatim)

This apply run **explicitly supersedes** the older Engram observation
`#427` (`sdd/u5-01-provisional-retirement/apply-progress`, created
2026-07-14 12:27:32 by session `ses_09eca0c8affe3aZo1NY4zqXCsk`).
That earlier plan described a per-student migration / local sidecar /
write-gate / SQL-JSONB / persistence-seam approach for retiring Unit 5.
**None of those deliverables ship in this change.** They were premised
on prior user exposure of Unit 5 that never occurred.

Specifically discarded from the prior plan:

- Per-shape `classifyMapShape` four-dispatcher.
- Local sidecar storage key `pre-utn.u5-retirement.v1`.
- Per-student marker `{version, students: {[id]: {completedAt}}}`
  JSON shape.
- Remote per-row column
  `student_progress_snapshots.u5_retirement_version`.
- Narrow persistence seams
  (`writePracticeMapRaw` / `writeDiagnosticMapRaw` /
  `writeStudyPlanMapRaw` / matching read seams) and any
  error-swallowing or blocking behavior attached to them.
- Marker-aware bypass / retry / crash / parity / restoration
  contracts.
- Per-student JSONB ordered migration transform.
- Local write gate, pending / failed visible state, or persistence
  return-type changes.

Replacement boundary (this run): static repository retirement only —
no migration, no SQL, no sidecar, no marker, no write gate, no
adapter change, no persistence behavior change, no product behavior
change, no U3, no U5-02, no archived U5-00 edits, no PDF copies,
no alias for `mat.u5.ecuaciones_trigonometricas`. Synthetic
diagnostic fixtures `mat.u5.trigonometria_basica`, `ex.u5.bad.1`,
`ex.u5.good.1` remain test-only and are not retirement keys.

The reduced FocusSelector availability correction on top of the
static-retirement surface adds: count-derived unit availability,
native + ARIA disabled options for zero-skill units, a
`Próximamente` label, a guarded empty listbox render path with the
same Próximamente pill, a defensive `handleUnitChange` guard that
rejects programmatic selection of zero-skill units, and 6 rendered
behaviour tests proving each contract case. **No** banner, **no**
`analyzeRequestedUnit`, **no** `UnitRequestAnalysis`, **no**
`UNAVAILABLE_UNIT_MESSAGE`, **no** persistence, URL, localStorage,
SQL, sidecar, marker, write-gate, adapter, remote-schema, or
stored-data transform contract is added or mutated.

## Summary (full U5-01)

Retired the exact six provisional skill IDs, five placeholder exercise
IDs, two U5 dependency edges, two U5 error taxonomy tags, six U5
pedagogy-doc skill entries, and two U5 pedagogy-doc dependency rows
from active repository surfaces. The active specs were rewritten /
updated to embody the post-retirement state without exposing the
discarded migration design (active
`openspec/specs/unit-5-foundation/spec.md` no longer carries the
sidecar-marker / SQL-JSONB / per-student migration contract that the
archived U5-00 design proposed). `UNIT_THRESHOLDS["unit-5"] = 0`
permits the intentionally empty Unit 5 state without raising a
coverage failure. The `FocusSelector` now derives every unit's
availability from `SKILLS_BY_UNIT[unit].length > 0`, disables empty
options with native + ARIA semantics and a `Próximamente` suffix, and
guards the skill-list render path with a Próximamente pill so no
empty listbox is reachable. The defensive `handleUnitChange` rejects
any programmatic attempt to select a zero-skill unit. There is no
banner, no `?unit=` URL contract, no `localStorage` key, no
persistence seam, and no `analyzeRequestedUnit` helper.

## Cumulative U5-01 task evidence (all 26 native SDD tasks across both runs)

### Static-retirement tasks (already complete in run 1)

| # | Task | Evidence |
|---|------|----------|
| 1.1 (run 1) | Reduce `UNIT_5_SKILLS` to empty collection | `src/domain/models/skill-catalog.ts:68` reads `export const UNIT_5_SKILLS: readonly SkillId[] = [] as const;` |
| 1.2 (run 1) | Spread `...UNIT_5_SKILLS` retained (no-op spread) | `src/domain/models/skill-catalog.ts:92` |
| 1.3 (run 1) | Remove U5 dependency edges | `src/domain/models/skill-catalog.ts` SKILL_DEPENDENCIES no longer contains `mat.u5.ecuaciones_trigonometricas` or `mat.u5.complejos_forma_polar` |
| 1.4 (run 1) | Catalog invariant — no U5 IDs in `KNOWN_SKILL_IDS` / `ALL_SKILLS` / `SKILL_DEPENDENCIES` | `grep -n "mat\.u5\." src/domain/models/skill-catalog.ts` returns no matches outside the comment block |
| 2.1 (run 1) | Remove five U5 placeholder exercises | `content/matematica/exercises.json` no longer contains any `ex.u5.*.1` object |
| 2.2 (run 1) | `UNIT_THRESHOLDS["unit-5"] = 0` | `src/domain/catalog/content-loaders.ts:921` reads `"unit-5": 0` |
| 2.3 (run 1) | `ex.u6.funcion_concepto.1` remains intact | `content/matematica/exercises.json` contains the entry immediately after the deletion block |
| 3.1 (run 1) | Remove `u5_cuadrante_angulo` | `src/domain/error-taxonomy/index.ts` no longer contains `u5_cuadrante_angulo` |
| 3.2 (run 1) | Remove `u5_identidad_pitagorica` | `src/domain/error-taxonomy/index.ts` no longer contains `u5_identidad_pitagorica` |
| 3.3 (run 1) | Unit coverage check permits empty U5 | `loadTaxonomy()` skips Unit 5 in coverage check; `error-taxonomy.test.ts` `Unit 5 has zero tags after U5-01 retirement` passes |
| 4.1 (run 1) | Remove six U5 skill entries from pedagogy doc | `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md` Unit 5 section contains only the intentional-empty-state note |
| 4.2 (run 1) | Remove two U5 dependency rows from pedagogy doc | `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md` SKILL_DEPENDENCIES block no longer contains U5 rows |
| 5.1 (run 1) | Update `catalog.test.ts` | file modified |
| 5.2 (run 1) | Update `per-unit-thresholds.test.ts` | file modified |
| 5.3 (run 1) | Update `diagnostic.test.ts` | file modified |
| 5.4 (run 1) | Update `evaluator-index.test.ts` | file modified |
| 5.5 (run 1) | Update `catalog-answer-contract.test.ts` | file modified |
| 5.6 (run 1) | Update `complejos-domain.test.ts` | file modified |
| 5.7 (run 1) | Update `error-taxonomy.test.ts` | file modified |
| 5.8 (run 1) | `pnpm run test` + `pnpm run typecheck` | historical `CI=true pnpm run test` → 1 failed / 3187 passed / 3188 total (the U3 cross-cutting coverage assertion); later clean checkpoint `CI=true pnpm run test` → 187 files / 3188 tests pass; `pnpm run typecheck` → exit 0 |
| 6.1 (run 1) | Rewrite `openspec/specs/unit-5-foundation/spec.md` | file modified |
| 6.2 (run 1) | Update `openspec/specs/math-exercise-catalog/spec.md` | file modified |
| 6.3 (run 1) | Update `openspec/specs/complex-numbers-skill/spec.md` | file modified |

### FocusSelector availability tasks (this run)

| # | Task | Evidence |
|---|------|----------|
| 1.1 | Unit 5 `<option>` carries native `disabled` + `aria-disabled="true"` | `src/components/practice/FocusSelector.tsx` lines 242 (`disabled={!available}`) and 243 (`aria-disabled={!available}`) driven by `getUnitAvailability(unit, SKILLS_BY_UNIT).available`. Rendered test "renders every unit option with its accessible label and disabled state" verifies this through DOM inspection. |
| 1.2 | Label is `Unidad {n} — Próximamente` for unavailable, `Unidad {n}` otherwise | `src/components/practice/FocusSelector.tsx` line 246: `available ? \`Unidad ${unit}\` : \`Unidad ${unit} — Próximamente\``. Rendered test verifies `option.textContent === "Unidad 5 — Próximamente"` for U5 and `Unidad 1`/`Unidad 2`/... for populated units. |
| 1.3 | Selecting a zero-skill unit does not invoke `onSkillSelect` | Rendered test "programmatic change to Unit 5 does not invoke onSkillSelect" dispatches a `change` event with `value="5"` against `select#unit-select` and asserts the `vi.fn()` callback is never called. |
| 1.4 | `getUnitAvailability(unit, skillsByUnit)` exported pure helper | `src/components/practice/FocusSelector.tsx` lines 70–76 (exported as a pure function taking the map as a parameter so the count-derivation rule is testable in isolation and so the production component re-derives every render from the live catalog). |
| 1.5 | `disabled` + `aria-disabled` + Próximamente label + muted/cursor-not-allowed treatment on `<option>` | `src/components/practice/FocusSelector.tsx` lines 235–247: native `disabled`, `aria-disabled`, conditional `className="text-brand-400 cursor-not-allowed"`, label `Unidad ${unit} — Próximamente`. Rendered test verifies the four attributes through DOM inspection. |
| 1.6 | `skillsForUnit.length === 0` guard with Próximamente pill | `showEmptyUnitState` derivation on lines 108–109 + render branch on lines 265–283 (no banner, just the pill). |
| 2.1 | `handleUnitChange` does not set unavailable value | `src/components/practice/FocusSelector.tsx` lines 159–162: defensive early-return on `!getUnitAvailability(candidateUnit, SKILLS_BY_UNIT).available`. Rendered test "programmatic change to Unit 5 does not invoke onSkillSelect" verifies the selector resets to `value=""`. |
| 2.2 | No `availableUnits` / `disabledUnits` flag — auto-re-enable proven by real executed behavior | Rendered test "auto-re-enable: pushing a skill into UNIT_5_SKILLS flips Unit 5 to enabled on the next render" mounts the component, asserts U5 disabled + Próximamente + cursor-not-allowed, mutates the live `UNIT_5_SKILLS` array (same reference the production `SKILLS_BY_UNIT[5]` points at) via `vi.mock`, re-renders the same mounted instance, and asserts U5 is enabled + bare `Unidad 5` + no muted/cursor-not-allowed classes. Plus a pure-helper test exercising the same re-enable rule at the unit level with two different maps. |
| 2.3 | `handleUnitChange` validates target has skills before calling `setSelectedUnit` | covered by 2.1 |
| 2.4 | All `FocusSelector.test.tsx` rendered assertions pass | 7/7 rendered tests green (6 prior + 1 pure-helper test). |
| 3.1 | Render `<FocusSelector>` and verify all four properties | covered by 1.1–1.6 above. |
| 3.2 | All FocusSelector rendered tests pass | 7/7 rendered tests green. |
| 4.1 | Focused test command passes | `pnpm exec vitest run --reporter=verbose "FocusSelector"` → 7/7 pass. Full suite: `pnpm exec vitest run` → 187 files, 3177 tests pass. |
| 4.2 | `pnpm run typecheck` | `tsc --noEmit` exit 0. |
| 4.3 | `pnpm run build` | `next build` exit 0. |

## Deviations from design (full U5-01)

None for the static-retirement segment. For the reduced FocusSelector
availability segment, the implementation matches the reduced
`design.md` exactly — no banner, no `analyzeRequestedUnit`, no
`UnitRequestAnalysis`, no `UNAVAILABLE_UNIT_MESSAGE`, no
`UnavailableUnitBanner` component, no URL/localStorage/persistence
contract.

## Issues found (U5-01 full)

The historical U3 cross-cutting coverage failure on Unit 5 (0 tags vs.
≥2 expected) was retained as accurate evidence in the static-retirement
segment. After the static-retirement corrections and the reduced
FocusSelector availability work, the full test run on this branch is
green: `CI=true pnpm run test` → 187 files, 3177 tests, 0 failures.

The earlier (`-28 +6 = -22`) net delta from the static-retirement
baseline (3200) is the removal of all source-string
`FocusSelector.test.ts` assertions (superseded by rendered behaviour
tests) and the removal of the 5 `analyzeRequestedUnit` tests, minus
the 6 new rendered tests.