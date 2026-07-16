# U5-01 — Verification Report

> **Independent verification of the reduced FocusSelector availability
> correction for OpenSpec change `u5-01-provisional-retirement` on
> `fix/u5-availability-state@57ef9bd5790a196f3da21a6f4704acbcecb75ffa`.**

---

## Change Under Verification

| Field | Value |
|---|---|
| OpenSpec change | `u5-01-provisional-retirement` |
| Branch | `fix/u5-availability-state` |
| Verified commit | `57ef9bd5790a196f3da21a6f4704acbcecb75ffa` |
| Mode | Standard (Strict TDD disabled) |
| Verifier | `sdd-verify` sub-agent (independent run) |

---

## Completeness Table — Artifacts Reviewed

| Artifact | Present | Reviewer Judgment |
|---|---|---|
| `openspec/changes/u5-01-provisional-retirement/proposal.md` | ✅ | Reviewed — binding decision and out-of-scope clauses honored. |
| `openspec/changes/u5-01-provisional-retirement/design.md` | ✅ | Reviewed — reduced contract documented; "no banner / no `?unit=` / no localStorage" decisions explicit. |
| `openspec/changes/u5-01-provisional-retirement/specs/unit-5-foundation/spec.md` | ✅ | Reviewed — 3 ADDED requirements + 2 MODIFIED requirements (delta). |
| `openspec/changes/u5-01-provisional-retirement/specs/math-skill-model/spec.md` | ✅ | Reviewed — 1 ADDED requirement. |
| `openspec/changes/u5-01-provisional-retirement/specs/math-exercise-catalog/spec.md` | ✅ | Reviewed — 1 MODIFIED requirement. |
| `openspec/changes/u5-01-provisional-retirement/specs/complex-numbers-skill/spec.md` | ✅ | Reviewed — 1 MODIFIED requirement. |
| `openspec/changes/u5-01-provisional-retirement/tasks.md` | ✅ | All checkboxes ticked; superseded tasks explicitly struck-through. |
| `openspec/changes/u5-01-provisional-retirement/apply-progress.md` | ✅ | Cumulative apply-progress + addendum; no unresolved issues; explicit deviation table states "None". |

---

## Reduced Contract — Compliance Matrix

Each row maps one explicit user-mandated contract element to its
implementation evidence and runtime proof.

| # | Reduced contract element | Spec ref | Implementation evidence (`src/components/practice/FocusSelector.tsx`) | Runtime evidence (test) | Verdict |
|---|---|---|---|---|---|
| 1 | Active-skill derived availability (`SKILLS_BY_UNIT[unit].length > 0`) | unit-5-foundation "Derived Unit Availability" | Lines 70–76 exported `getUnitAvailability(unit, skillsByUnit)` derives from `skillsByUnit[unit]?.length ?? 0`; no hard-coded per-unit toggle; the production component re-derives every render by passing the live `SKILLS_BY_UNIT` map | "renders every unit option with its accessible label and disabled state" — Unit 5 disabled, Units 1/2/3/4/6 enabled | ✅ |
| 2 | Visible accessible disabled Unit 5 with `Próximamente` label | unit-5-foundation "Visible and Accessible Disabled Unit 5" | Lines 235–247: native `disabled={!available}`, `aria-disabled={!available}`, conditional `className="text-brand-400 cursor-not-allowed"` for the muted + cursor-not-allowed treatment, label `Unidad ${unit} — Próximamente` for unavailable units | "renders every unit option …" — U5 text == `"Unidad 5 — Próximamente"`, U1/U2/U3/U4/U6 text == `"Unidad N"`; disabled + aria-disabled + `text-brand-400` + `cursor-not-allowed` asserted per option, and the muted/cursor-not-allowed classes are explicitly **absent** on enabled options | ✅ |
| 3 | Defensive rejection of programmatic unavailable-unit selection; no reachable empty skill list | unit-5-foundation "Programmatic Unavailable-Unit Selection Is Rejected" | `handleUnitChange` lines 147–162: rejects unavailable value via `getUnitAvailability(candidateUnit, SKILLS_BY_UNIT).available` and resets `setSelectedUnit(null)`. Empty-list guard at lines 108–109 + render branch at lines 265–283 renders Próximamente pill, never an empty listbox | "programmatic change to Unit 5 does not invoke onSkillSelect" + "zero-skill render path shows the Próximamente pill, never an empty listbox" — both pass; `onSkillSelect` callback never fires; `select.value === ""` after rejection; no listbox/empty-state reachable | ✅ |
| 4 | Active units work as before (no regression) | design + design table | Same `handleUnitChange` path retains `setSelectedUnit(candidateUnit)` for available values; the skill-listbox branch retains the listbox render path | "selecting a populated unit renders its non-empty skill listbox" passes — selecting Unit 1 renders ≥1 `[role="option"]` | ✅ |
| 5 | Auto-re-enable when active skills are added to `SKILLS_BY_UNIT` — proven by **executed behavior**, not source inspection | unit-5-foundation "active-skill counts control usability" + "content arrival automatically re-enables a unit" | `getUnitAvailability` is exported as a pure helper (lines 70–76) and called with the live `SKILLS_BY_UNIT` map on every render; no `availableUnits` / `disabledUnits` flag in state; no `useRef` / `useState` for per-unit availability. Availability is recomputed every render from the catalog. | (a) Rendered test "auto-re-enable: pushing a skill into UNIT_5_SKILLS flips Unit 5 to enabled on the next render" mounts the component, asserts U5 disabled + Próximamente + cursor-not-allowed, mutates the live `UNIT_5_SKILLS` array (the same reference the production `SKILLS_BY_UNIT[5]` points at) via `vi.mock`, re-renders the same mounted instance, and asserts U5 is enabled + bare "Unidad 5" + no muted classes. (b) Pure-helper test "getUnitAvailability pure helper: empty unit is unavailable, populated unit is available" calls the exported helper with empty and populated maps and asserts the available/activeSkillCount flips accordingly. | ✅ |
| 6 | Rendered behavioral tests (no source-string / regex assertions) | design §Testing Strategy; tasks §Phase 3 | `src/components/practice/__tests__/FocusSelector.test.tsx` uses React 19 `createRoot` + `act` in `happy-dom` to mount the real `<FocusSelector />`, dispatch native `change` events via `HTMLSelectElement.prototype.value` setter + bubbling `change`, mock `@/domain/models/skill-catalog` to expose a mutable `UNIT_5_SKILLS` reference (`vi.hoisted` + `vi.mock`), and assert DOM attributes (`disabled`, `aria-disabled`, `textContent`, `className` for muted/cursor-not-allowed, `[role="listbox"]`, `[data-testid="unit-empty-state"]`, `select.value`). The pure-helper test exercises the exported `getUnitAvailability` directly with different unit maps. | Focused run: `pnpm exec vitest run --reporter=verbose "FocusSelector"` → 1 file, **7/7** tests pass in 1.42s (exit 0). The auto-re-enable test mutates `UNIT_5_SKILLS` between renders, so it is real executed behavior — no source-string inspection. | ✅ |
| 7 | No direct / persisted / URL fallback promised or added | design §Architecture Decisions, §Investigation Evidence; user mandate | Implementation has no `?unit=` URL parsing, no `localStorage` read/write, no `useSearchParams` for units, no Supabase/Persistence seam for unit selection. `grep -E "(unit-select.*onChange\|selectedUnit.*localStorage\|localStorage.*unit\|unit.*URLSearchParams\|searchParams.*unit\|useSearchParams.*unit)"` returns 0 matches. | "programmatic change to Unit 5 does not invoke onSkillSelect" — the only `change` handler is `handleUnitChange` and it has no persistence side-effect | ✅ |

---

## Forbidden-Contract Defensive Sweep

| Pattern | Where (if found) | Verdict |
|---|---|---|
| `analyzeRequestedUnit` | Only in OpenSpec docs (`design.md`, `tasks.md`, `apply-progress.md`) as a *removed* artifact description | ✅ No implementation trace |
| `UnitRequestAnalysis` | Only in OpenSpec docs as a *removed* artifact | ✅ No implementation trace |
| `UNAVAILABLE_UNIT_MESSAGE` | Only in `apply-progress.md` as a removed constant name in the file-deletion summary | ✅ No implementation trace |
| `UnavailableUnitBanner` | Only in OpenSpec docs as a *removed* component name | ✅ No implementation trace |
| `?unit=` URL parsing | Only in OpenSpec docs as a disallowed pattern | ✅ No implementation trace |
| `localStorage.getItem|setItem` for unit state | None in changed files (`FocusSelector.tsx`) | ✅ No implementation trace |
| `useSearchParams(...)` for unit | None | ✅ No implementation trace |
| `SKILLS_BY_UNIT` mirror outside `FocusSelector.tsx` | None. `start-skill.ts` briefly held a `SKILLS_BY_UNIT` mirror + `analyzeRequestedUnit` helper + `UnitRequestAnalysis` type in commit `3a111c3`; the corrective commit `57ef9bd` reverted every one of those additions. Net diff against `main` for `src/app/practice/start-skill.ts` is empty (`git diff main..HEAD -- src/app/practice/start-skill.ts` returns no output). | ✅ |

---

## Out-of-Scope Discipline — Checked

| Concern | Status | Evidence |
|---|---|---|
| U3 catalog / skills / exercises touched | Not touched | `git diff main..fix/u5-availability-state --stat` shows 9 files, none are U3 catalog sources |
| U4 catalog / skills / exercises touched | Not touched | `grep "mat\.u4\."` outside existing tests — none of the changed files add a U4 surface |
| U5-02 work introduced | Not introduced | No `unit-5-foundation` content artifacts added |
| Archived U5-00 artifacts edited | Not edited | `git diff …` does not list any `openspec/changes/archive/u5-00-*` paths |
| Canonical U5 content added | Not added | The post-retirement `UNIT_5_SKILLS` remains `[]` |
| SQL / persistence / sidecar / marker / write gate | None added | `grep` returns 0 matches for any of these patterns in the diff |
| `?unit=` URL parameter or localStorage key | None added | `grep` returns 0 matches |

---

## Build / Tests / Type-Check Evidence

| Command | Exit code | Output hash (sha256) | Summary |
|---|---|---|---|
| `pnpm exec vitest run --reporter=verbose "FocusSelector"` | **0** | `b3a47ed0…` (see `.verify-output/focus-selector.txt`) | 1 file, **7/7** rendered tests pass (1.42s) — including the new real-executed-behavior auto-re-enable test and the pure-helper test |
| `CI=true pnpm run test` (full suite) | **0** | `8627f5abcce10e907a60733fa5e61252b6c51caaf86338221ce09b08e2ea3245` | **187 files, 3177 tests pass** (22.89s). Matches apply-progress.md claim. |
| `pnpm run typecheck` (`tsc --noEmit`) | **0** | `8366207267355d3e3d5bf3bf6e8c94c5f93f6078c34f08973fa2b38cdda6cc92` | No type errors |
| `pnpm run build` (`next build`) | **0** | `33c049c8e06d1ce1d0a08139767fa0c668adf99a94539ee700a9c96d4ef71786` | 11/11 static pages generated; compiled successfully in 7.3s |

Captured output: `.verify-output/{focus-selector,full-test,typecheck,build}.txt`
inside the worktree (not committed; parent retains the preimage). The
corrective run regenerates these outputs after applying the audit
findings; the local directory is deleted at the end of the run per
audit finding #4 (it remains untracked and uncommitted, not added to
`.gitignore`).

---

## Spec ↔ Test Runtime Compliance

Each scenario below is the runtime evidence tying the spec requirement
back to the implementation via a passing test.

### MODIFIED — `unit-5-foundation/spec.md`

- **Static Provisional Retirement**
  - "static retirement does not change persistence": the full test suite
    includes tests that exercise persistence seams unchanged from
    `main` (not asserted to have changed); the implementation files
    never touch the persistence layer (greps clean).
- **U5 Scope, Zero Threshold, and Deferred Exclusions**
  - "Unit 5 loads with zero threshold": existing `UNIT_THRESHOLDS` /
    coverage tests in the full suite (3177 tests) cover this; nothing
    in the changed files removes the empty-state tolerance.

### ADDED — `unit-5-foundation/spec.md`

- **Derived Unit Availability**
  - Scenario "active-skill counts control usability": runtime proof →
    `FocusSelector.test.tsx` "renders every unit option with its
    accessible label and disabled state" + "selecting a populated
    unit renders its non-empty skill listbox".
  - Scenario "content arrival automatically re-enables a unit":
    runtime proof → "auto-re-enable: pushing a skill into
    UNIT_5_SKILLS flips Unit 5 to enabled on the next render"
    (mutates the live catalog mock, re-renders the same mounted
    instance, asserts the option flips to enabled + bare
    `Unidad 5` + no muted/cursor-not-allowed classes) + the
    pure-helper test "getUnitAvailability pure helper: empty unit is
    unavailable, populated unit is available" (asserts the same
    re-enable rule at the unit level with two different unit maps).
- **Visible and Accessible Disabled Unit 5**
  - Scenario "Unit 5 remains visible with disabled semantics":
    runtime proof → `FocusSelector.test.tsx` "renders every unit option
    with its accessible label and disabled state" — U5 option
    text `=== "Unidad 5 — Próximamente"`, `disabled === true`,
    `aria-disabled === "true"`, `className` matches
    `/text-brand-400/` and `/cursor-not-allowed/`. U1/2/3/4/6 options
    enabled with bare labels and no muted/cursor-not-allowed classes.
- **Programmatic Unavailable-Unit Selection Is Rejected**
  - Scenario "programmatic Unit 5 selection is rejected":
    runtime proof → `FocusSelector.test.tsx` "programmatic change to
    Unit 5 does not invoke onSkillSelect" + "zero-skill render path
    shows the Próximamente pill, never an empty listbox".

### ADDED — `math-skill-model/spec.md`

- Provisional U5 skill IDs removed from active catalog: unchanged from
  the static-retirement segment — not part of this reduced-contract
  commit (catalog untouched by `git diff main..fix/u5-availability-state
  -- src/domain/...`); covered by the 187/187 full-suite pass.

### MODIFIED — `math-exercise-catalog/spec.md`

- Empty Unit 5 permitted with threshold 0: same — covered by the
  full-suite pass; not touched by this commit's diff.

### MODIFIED — `complex-numbers-skill/spec.md`

- Polar-form dependency retired: same — covered by the full-suite
  pass; not touched by this commit's diff.

---

## Correctness Table

| Concern | Expected | Observed | Verdict |
|---|---|---|---|
| Static retirement preserved | Catalog no longer carries the 6 provisional skill IDs | `grep "mat\.u5\." src/domain/models/skill-catalog.ts` → only comment block; no active entries | ✅ |
| Active units still selectable | Unit 1/2/3/4/6 listbox renders skills on selection | "selecting a populated unit renders its non-empty skill listbox" passes | ✅ |
| Disabled Unit 5 visible with `Próximamente` and muted + cursor-not-allowed styling | `<option value="5">` is disabled, `aria-disabled="true"`, text `Unidad 5 — Próximamente`, `className` includes `text-brand-400` + `cursor-not-allowed` | "renders every unit option …" asserts all of the above; muted/cursor-not-allowed classes are explicitly **absent** on enabled options | ✅ |
| Programmatic Unit 5 selection rejected | `onSkillSelect` not called; `select.value === ""`; no listbox or empty-state in DOM | "programmatic change to Unit 5 does not invoke onSkillSelect" + "zero-skill render path …" both pass | ✅ |
| Auto-re-enable on count change — proven by executed behavior | No flag carried in component state; U5 status recomputed every render from the live `SKILLS_BY_UNIT` map; mutating `UNIT_5_SKILLS` flips U5 to enabled on the next render | "auto-re-enable: pushing a skill into UNIT_5_SKILLS flips Unit 5 to enabled on the next render" mutates the live catalog mock, re-renders the same mounted instance, and asserts U5 becomes enabled + bare `Unidad 5` + no muted classes. Pure-helper test exercises the same re-enable rule with two different unit maps. | ✅ |
| TypeScript strict | `tsc --noEmit` exit 0 | exit 0 | ✅ |
| Build clean | `next build` exit 0 | exit 0 | ✅ |
| Full test suite | 187 files / 3177 tests pass | 187 / 3177 — matches apply-progress claim | ✅ |

---

## Design Coherence Table

| Design decision | Implementation alignment |
|---|---|
| "Availability source: `SKILLS_BY_UNIT[unit].length > 0`" | Exported `getUnitAvailability` (lines 70–76) does exactly this with the live `SKILLS_BY_UNIT` map passed in by the production component |
| "Empty unit UX: render `Unidad 5 — Próximamente` as disabled" | Lines 235–247: native `disabled`, `aria-disabled`, conditional `className="text-brand-400 cursor-not-allowed"`, label suffix ` — Próximamente` |
| "Rejection boundary: native + defensive handler" | `disabled` on `<option>` (line 242) + `handleUnitChange` early-return on `getUnitAvailability(candidateUnit, SKILLS_BY_UNIT).available` (lines 159–162) |
| "Unsupported fallback: do not add or retain" | None of `analyzeRequestedUnit` / `UnitRequestAnalysis` / `UNAVAILABLE_UNIT_MESSAGE` / `UnavailableUnitBanner` / `?unit=` / localStorage appears in implementation |
| File modifications named in `design.md § File Changes` (net diff vs `main`) | `FocusSelector.tsx` (modify), `FocusSelector.test.tsx` (create), `FocusSelector.test.ts` (modify → delete). `start-skill.ts` is listed in `design.md § File Changes` for traceability but has **no net candidate diff** — it was temporarily modified in `3a111c3` and reverted in `57ef9bd`. The corrected `design.md § File Changes` reflects this explicitly. | ✅ |
| `UnitAvailability` type from `design.md § Interfaces` | Returned by exported `getUnitAvailability` (lines 70–76): `{ available, activeSkillCount }` — matches the `readonly` shape declared |
| "Per-skill readiness remains separate from unit availability" | `readinessMap` / `isSkillReady` unchanged; unit availability is exclusively from `SKILLS_BY_UNIT[unit].length > 0` |

---

## Issues

### CRITICAL

None.

### WARNING

None.

### SUGGESTION

- The `act(...)` warnings emitted by Vitest's stderr during the rendered
  tests (`The current testing environment is not configured to
  support act(...)`) are non-fatal — tests still pass and assertions
  are honored. They are emitted because happy-dom + React 19 do not
  automatically wrap `act` from inside an `unstable_testEnvironment`
  declaration in this version of Vitest. The contract is met; the
  warning is noise. Tracking a follow-up to register a global `act`
  shim is a future cleanup, not a blocker for this change.

---

## Final Verdict

**PASS** — All 7 reduced-contract elements are met with covering
runtime tests. Focused run on this branch's corrective commit is **7/7
rendered tests green**, full suite (187 files / 3177 tests) is green,
typecheck and build are clean. The auto-re-enable contract is now
proven by mutating the live `UNIT_5_SKILLS` array via `vi.mock` and
re-rendering the same mounted instance — no source-string inspection.
The muted/cursor-not-allowed treatment on the unavailable option is
also covered by rendered DOM assertions. No forbidden contract
(direct, persisted, URL, or `?unit=` fallback) is added or promised.
Static retirement is preserved. Out-of-scope units (U3, U4, U5-02,
archived U5-00, canonical U5 content) are untouched. `start-skill.ts`
has no net candidate diff against `main`; the corrected design and
apply-progress reflect this explicitly.

Ready for archive.
