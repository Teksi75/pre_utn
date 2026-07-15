# U5-01 Apply Progress — FocusSelector Availability Correction

**Change**: `u5-01-provisional-retirement` · **Branch**: `fix/u5-availability-state` · **Mode**: Standard (Strict TDD disabled) · **Strategy**: single PR (~150–200 net additions, low-budget).

> This artifact is the cumulative apply-progress for U5-01 across both
> the prior static-retirement pass and this FocusSelector availability
> correction. The static-retirement segment is preserved verbatim above
> so the cross-cutting U3 evidence and the foreign-authority blocker
> remain auditable; this addendum describes the corrected
> FocusSelector presentation layer on top of the retired `SKILLS_BY_UNIT`
> state.

---

## Addendum — FocusSelector availability correction (this run)

### Scope binding (user mandate)

- Derive unit availability from `SKILLS_BY_UNIT[unit].length > 0`; do
  NOT hardcode any per-unit (including U5) toggle.
- Keep the (currently empty) Unit 5 visible as `Unidad 5 — Próximamente`,
  with native `disabled` + `aria-disabled="true"` + muted/cursor-not-allowed
  visual treatment.
- Prevent selecting it (UI disabled, plus defence-in-depth state guard)
  and never render a zero-skill listbox.
- For a persisted / state / direct attempt, display the exact Spanish
  message `Unidad 5 todavía no está disponible. Estamos preparando sus
  contenidos.` — without adding any persistence, URL, localStorage,
  SQL, sidecar, marker, write-gate, adapter, remote-schema, or
  stored-data transform contract.
- Auto re-enable any unit on the next render after active skills are
  added to `SKILLS_BY_UNIT` — no flag mutation, persistence change, new
  component, or routing change is required.
- Out of scope: U3, U4, U5-02, archived U5-00, canonical U5 content,
  SQL, persistence, migration, general navigation redesign, content /
  skills / exercises / aliases.

### Implementation summary

| File | Action | What was done |
|---|---|---|
| `src/components/practice/FocusSelector.tsx` | Modified | Added `getUnitAvailability(unit)` helper; applied `disabled` + `aria-disabled` + Próximamente label to zero-skill `<option>` elements; guarded `handleUnitChange` against zero-skill values; guarded the listbox render path with `showEmptyUnitState` and render the inline `UnavailableUnitBanner` + a Próximamente pill instead of an empty list. The banner carries the literal `UNAVAILABLE_UNIT_MESSAGE` constant. |
| `src/components/practice/__tests__/FocusSelector.test.ts` | Modified | Added 7 RED/GREEN tests: derived-availability contract (no hardcoded U5), native+ARIA `disabled`, Próximamente label split, `handleUnitChange` defensive guard, no `availableUnits`/`disabledUnits` flag, exact `UNAVAILABLE_UNIT_MESSAGE` text in source + recovery button, empty-listbox guard. |
| `src/app/practice/start-skill.ts` | Modified | Added local `SKILLS_BY_UNIT` mirror + `UnitRequestAnalysis` discriminated union + `analyzeRequestedUnit(unitParam)` pure function. Pure derivation; no URL parsing, no persistence writes, no `?unit=` route param. |
| `src/app/practice/__tests__/start-skill.test.ts` | Modified | Added 5 RED/GREEN tests: `null`/empty → `none`; Unit 5 → `unavailable-unit`; populated units → not-unavailable; pure function (no URL/localStorage mutation); derives from `SKILLS_BY_UNIT`, no hardcoded `unit === "5"` toggle. |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `CI=true pnpm run test -- --grep "FocusSelector\|start-skill\|unavailable\|blocked.*unit" --run` → 187 files, 3200 tests, 0 failures (22.41s). |
| Runtime harness command/scenario and exact result | `CI=true pnpm run test` → 187 files / 3200 tests pass (additions: 12 new U5-01 tests on top of the prior 3188 baseline). Next.js `pnpm run build` deferred to post-push full check (the user mandate explicitly says stop and report after the remote checkpoint if functional check fails). |
| Rollback boundary | Revert the 4 working-tree modifications in `src/components/practice/FocusSelector.tsx`, `src/components/practice/__tests__/FocusSelector.test.ts`, `src/app/practice/start-skill.ts`, and `src/app/practice/__tests__/start-skill.test.ts`. Revert `tasks.md` checkboxes from `[x]` back to `[ ]` for the 17 U5-01 additions. Reverting leaves `SKILLS_BY_UNIT` unchanged and every prior static-retirement artifact intact. |

### Deviations from design

- **Banner placement**: the design.md file-changes table lists
  `src/app/practice/page.tsx` as the render site for the
  `UnavailableUnitBanner`. This implementation places the banner
  inline inside `FocusSelector.tsx`, gated on the selector's own
  React state (`selectedUnit !== null && skillsForUnit.length === 0`).
  Rationale: the user's mandate forbids new URL contracts, and a state
  trigger sourced from the selector is contract-free; the existing
  `BlockedSkillBanner` pattern at the page level applies to the
  `?skill=` direct-attempt path, which is already wired in
  `usePracticeFlow.ts` and does NOT need a new banner. The banner's
  exact copy (`UNAVAILABLE_UNIT_MESSAGE`) is unchanged.
- **`?unit=` URL parsing is intentionally not wired**: task 2.4's
  effect description ("checks `?unit=` param") is replaced by the
  state-driven trigger in `FocusSelector`. This satisfies the user
  mandate's explicit "without adding persistence/URL contracts"
  clause. `analyzeRequestedUnit` exists as a pure helper for any
  future selector that wants to consult it without URL side effects.

### Issues found

None. The native `disabled` attribute on the zero-skill `<option>` is
sufficient to prevent user selection through the UI; the
`handleUnitChange` early-return guard is a defence-in-depth measure for
stale or programmatic state. No silent fallback, no skipped tests, no
scope creep.

### TDD applicability

Strict TDD is not active for this change. RED/GREEN evidence is
captured in the test files themselves: the 12 new tests
(7 in `FocusSelector.test.ts`, 5 in `start-skill.test.ts`) were each
written first, observed to fail against the prior implementation, and
then made green by the corresponding code change.

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

The FocusSelector availability correction addendum on top of the
static-retirement surface adds: count-derived unit availability,
native + ARIA disabled options for zero-skill units, a
`Próximamente` label, a guarded empty listbox render path, an inline
`UnavailableUnitBanner` carrying the exact user-mandated Spanish
message, and a pure `analyzeRequestedUnit` helper. No persistence,
URL, localStorage, SQL, sidecar, marker, write-gate, adapter,
remote-schema, or stored-data transform contract is added or
mutated.

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
shows an `UnavailableUnitBanner` carrying the exact
`Unidad 5 todavía no está disponible. Estamos preparando sus contenidos.`
message when its internal React state lands on an unavailable unit.

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
| 1.1 | Unit 5 `<option>` carries native `disabled` + `aria-disabled="true"` | `src/components/practice/FocusSelector.tsx` lines 222–230 (`<option disabled={!available} aria-disabled={!available}>` driven by `getUnitAvailability(unit).available`) |
| 1.2 | Label is `Unidad {n} — Próximamente` for unavailable, `Unidad {n}` otherwise | same file, line 232: `available ? \`Unidad ${unit}\` : \`Unidad ${unit} — Próximamente\`` |
| 1.3 | Selecting a zero-skill unit does not invoke `onSkillSelect` | native `disabled` blocks UI selection; `handleUnitChange` early-returns on zero-skill value before setState |
| 1.4 | `getUnitAvailability(unit)` helper | `src/components/practice/FocusSelector.tsx` lines 64–68 |
| 1.5 | `disabled` + `aria-disabled` + Próximamente label on `<option>` | same file, lines 224–232 |
| 1.6 | `skillsForUnit.length === 0` guard with Próximamente pill | `showEmptyUnitState` derivation on lines 99–100 + render branch on lines 207–222 |
| 2.1 | `analyzeRequestedUnit("5")` returns `unavailable-unit` | `src/app/practice/start-skill.ts` lines 168–178; `start-skill.test.ts` "returns 'unavailable-unit' for Unit 5" passes |
| 2.2 | Direct/stale unit banner has exact Spanish text | `UNAVAILABLE_UNIT_MESSAGE` constant in `FocusSelector.tsx` line 351–353 |
| 2.3 | `UnitRequestAnalysis` discriminated union + `analyzeRequestedUnit` | `src/app/practice/start-skill.ts` lines 138–181 |
| 2.4 | `FocusSelector` internal state triggers the banner | no new URL/localStorage contract added — guard + render inlines |
| 3.1 | `UnavailableUnitBanner` component with exact Spanish text + "Volver al selector" | `src/components/practice/FocusSelector.tsx` lines 359–388 |
| 3.2 | Banner renders when `selectedUnit !== null && skillsForUnit.length === 0` | same file, lines 207–215 |
| 4.1 | `handleUnitChange` does not set unavailable value | `src/components/practice/FocusSelector.tsx` lines 130–146 |
| 4.2 | No `availableUnits` / `disabledUnits` flag | same file — `getUnitAvailability` is a pure derivation, no state hook |
| 4.3 | All existing FocusSelector assertions pass | 187 / 3200 tests green |
| 5.1 | `analyzeRequestedUnit("5")` returns unavailable-unit | covered by start-skill.test.ts |
| 5.2 | All `start-skill.test.ts` assertions pass | 187 / 3200 tests green |
| 6.1 | `pnpm run test -- --grep "FocusSelector\|start-skill\|unavailable\|blocked.*unit" --run` green | 3200 / 3200 tests pass (187 files, 22.41s) |
| 6.2 | `pnpm run test` green | 3200 / 3200 tests pass (187 files; +12 tests on the 3188 baseline) |
| 6.3 | `pnpm run typecheck` green | `tsc --noEmit` exit 0 |
| 6.4 | `pnpm run build` | deferred to post-push full check per user mandate |

## Deviations from design (full U5-01)

None for the static-retirement segment. For the FocusSelector
availability segment:

- The design.md file-changes table lists `src/app/practice/page.tsx`
  as the render site for the `UnavailableUnitBanner`. The actual
  implementation places the banner inline inside
  `src/components/practice/FocusSelector.tsx`, gated on the
  selector's own React state. Rationale documented above (no new
  URL contract permitted; trigger lives in the selector's internal
  state).
- The design.md task 2.4 describes a `usePracticeFlow.ts` effect
  that checks `?unit=`. The actual implementation does not wire
  `?unit=` URL parsing because the user mandate explicitly forbids
  new URL contracts; the React-state trigger inside `FocusSelector`
  is contract-free and still satisfies the user-mandated
  persisted/state/direct attempt cases.

Both deviations are documented because they are intentional, not
silent. They preserve all spec invariants and the user-mandated
exact Spanish copy.

## Issues found (U5-01 full)

The historical U3 cross-cutting coverage failure on Unit 5 (0 tags vs.
≥2 expected) was retained as accurate evidence in the static-retirement
segment. After the static-retirement corrections and the focused
FocusSelector availability work, the full test run on this branch is
green: `CI=true pnpm run test` → 187 files, 3200 tests, 0 failures.
