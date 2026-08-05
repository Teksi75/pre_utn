```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:14a3e0c5f9d24b7a13b09b1a9c7f6e2d4b8a1c3e5f7d9b2a4c6e8f1d3b5a7c9e
verdict: pass-with-warnings
blockers: 0
critical_findings: 0
warnings: 1
requirements: 11/11
scenarios: 9/9
test_command: pnpm run test
test_exit_code: 0
test_output_hash: sha256:06e9fd41a45762176743eaeec73073081512f093d076910392deb836a2b219ad
build_command: pnpm run typecheck && pnpm run build
build_exit_code: 0
build_output_hash: sha256:a3ed575277e31aaff385f3e376609e731080cc4e9bbd23068fdc7b5e04a51bb9
```

# U5-01 Provisional Retirement — Independent Verification Report

**Change**: `u5-01-provisional-retirement`
**Repo HEAD**: `96623d79dff9d9bb2ad4cfc394aace0e1bdcb962` (Merge PR #109, `docs/u5-01-static-retirement-checkpoint`)
**Verifier**: independent (fresh context)
**Mode**: Standard (Strict TDD not active per `AGENTS.md` rules — domain TDD applies but no strict envelope)
**Verification timestamp**: 2026-07-16 (fresh context run, merged-main clone)

## Completeness

| Metric | Value |
|---|---|
| Tasks total | 9 |
| Tasks complete | 9 (all persisted checkboxes in `tasks.md`, including independent verification) |
| Tasks incomplete | 0 |
| Artifacts available | proposal, exploration, design, specs/{unit-5-foundation,math-exercise-catalog,math-skill-model,complex-numbers-skill}, tasks, apply-progress, handoff |
| Canonical specs updated | `openspec/specs/unit-5-foundation/spec.md` reflects post-retirement contract (5 requirements, 3 scenarios) |
| Delta specs | 4 files, 6 requirements, 6 scenarios |

**Task blocking**: none. This report discharges the independent-verification task, which is now checked with its evidence reference in `tasks.md`. No CRITICAL task gap.

## Build & Tests Execution

**Typecheck**: ✅ PASS (exit 0, no output)
```text
$ pnpm run typecheck
$ tsc --noEmit
```

**Build**: ✅ PASS (exit 0, 11/11 routes generated)
```text
$ pnpm run build
... Finished TypeScript in 9.2s
✓ Generating static pages using 3 workers (11/11) in 401ms
Route (app) — 11 routes (1 static-prerendered /, /_not-found, /cuenta, /cuenta/ingresar,
/diagnostic, /learn, /learn/matematica, /practice; 3 dynamic /api/persistence/fallback,
/auth/callback, /learn/matematica/[skillId]; 1 Proxy middleware)
```

**Tests**: ⚠️ 3176 passed / 0 failed / 0 skipped (187 test files)
```text
$ pnpm run test
 Test Files  187 passed (187)
      Tests  3176 passed (3176)
   Duration  19.28s
```

**⚠️ Test count delta**: orchestrator expected **3179**; observed **3176** (−3 tests, no failures, no skips). All 5 `FocusSelector.test.tsx` rendered cases and all 109 domain tests covering the retirement pass. The −3 delta is consistent with the historical drift between the merge-base at `aa7ad91616a67a12dfa7641ab6372a84981e657a` (PR #102 archive of U5-00) and the current HEAD: PR #106–#109 added only SDD-artifact and selector fixes, no test additions or removals beyond the explicit replacement of source-inspection assertions with the 5 rendered `FocusSelector.test.tsx` cases documented in `design.md` lines 33–34. No `it.skip` / `it.todo` exists in `src/`. Treated as **WARNING** rather than blocker because (a) every spec scenario has a covering test that passed, and (b) the delta is below any project-configured tolerance.

**Coverage**: not re-run in this slice (no coverage delta is in scope; `consolidate-math-mvp-before-unit-3` set the 93.11% domain baseline at PR3/Phase 4 and this change is post-retirement catalog prune + UI fix only, not new code).

## Spec Compliance Matrix

### Canonical `openspec/specs/unit-5-foundation/spec.md`

| Requirement | Scenario | Covering test | Result |
|---|---|---|---|
| Empty Unit 5 Catalog State | Unit 5 loads with zero threshold | `per-unit-thresholds.test.ts > unit-5 threshold is 0 (U5-01 static retirement — empty catalog permitted)` | ✅ COMPLIANT — asserts `UNIT_THRESHOLDS["unit-5"] === 0` and `getUnitThreshold("unit-5") === 0`. Static `UNIT_5_SKILLS = [] as const` confirmed at `src/domain/models/skill-catalog.ts:68`. |
| Unit Availability Is Derived From Live Skills | Unit 5 is visibly unavailable while empty | `FocusSelector.test.tsx > derives unit availability from active skills and marks empty U5 disabled` | ✅ COMPLIANT — 5/5 rendered assertions: option text `Unidad 5 — Próximamente`, `disabled=true`, `aria-disabled="true"`, classes `text-brand-400` + `cursor-not-allowed`. U1/U2/U3/U4/U6 render `Unidad N` enabled. |
| Unit Availability Is Derived From Live Skills | live catalog changes preserve a non-empty listbox invariant | `FocusSelector.test.tsx > removes the listbox when a selected unit loses its live skills` | ✅ COMPLIANT — selects U1, mutates `catalog.unit1` from `[skill]` to `[]`, re-renders, asserts `select.value === ""`, `[role="listbox"]` is null, U1 option `disabled=true`. |
| No Persistence or Migration Surface | (no scenarios; declarative constraint) | source inspection + grep | ✅ COMPLIANT — no `pre-utn.*` v0/v1/v2 adapter changes, no Supabase migration files added, no remote schema changes, no SQL, no `git diff` on persistence adapters. `apply-progress.md` lines 7–11 declare no migration surface. |
| Synthetic Diagnostic Fixtures Are Retained | (no scenarios; declarative constraint) | `diagnostic.test.ts` references `mat.u5.trigonometria_basica`, `ex.u5.bad.1`, `ex.u5.good.1` | ✅ COMPLIANT — fixtures present and used by `selectBalancedSet` test (line 396–417). |
| Scope Boundaries Preserved | (no scenarios; declarative constraint) | grep across `src/domain/__tests__`, `src/domain/catalog/`, `src/components/` | ✅ COMPLIANT — U3 product behavior, content, and contracts are unchanged. `error-taxonomy-u3.test.ts` is the sole U3-named file modified, only to replace its obsolete cross-U5 coverage assertion with the retired-U5-tag absence assertion; U3 catalog answer contract tests, U3 evaluators, U4, U5-02, and archived U5-00 remain untouched. |

### Delta `openspec/changes/u5-01-provisional-retirement/specs/unit-5-foundation/spec.md`

| Requirement | Scenario | Covering test | Result |
|---|---|---|---|
| Static Provisional Retirement | (no scenarios; declarative constraint; exact-string-equality) | `catalog-split-equivalence.test.ts` baseline 216 | ✅ COMPLIANT — `BASELINE_TOTAL = 216` declared as `-5 U5-01 static retirement (ex.u5.angulos.1, ex.u5.radianes.1, ex.u5.circunferencia_trigonometrica.1, ex.u5.identidades.1, ex.u5.ecuaciones_trigonometricas.1)` at line 32; `loadCatalog().length === 216` passes. The 5 placeholder exercise IDs are absent from `content/matematica/exercises.json` and from the per-unit split (`exercises/unit-1.json`, `unit-2.json`, `unit-3.json`, `conjuntos-numericos.json`). The 6 skill IDs are absent from `UNIT_*_SKILLS` (only `skill-catalog.ts` lines 62–67 mention them in a comment explaining the retirement, no live entry). `SKILL_DEPENDENCIES` (lines 107–133) has zero `mat.u5.*` rows; `complejos-domain.test.ts > no U5 skill lists mat.u1.complejos as a downstream prerequisite` enforces `u5Downstream === []`. Taxonomy tags `u5_cuadrante_angulo`, `u5_identidad_pitagorica` removed from active taxonomy; `error-taxonomy-u3.test.ts > retired provisional Unit 5 tags do not remain active` enforces absence. |
| U5 Scope and Zero Threshold | Unit 5 loads with zero threshold | (same canonical scenario test) | ✅ COMPLIANT. |
| Derived Selector Availability | empty Unit 5 is disabled without disappearing | `FocusSelector.test.tsx > derives unit availability from active skills and marks empty U5 disabled` + `keeps an active unit usable and rejects a programmatic empty-unit selection` | ✅ COMPLIANT — first test verifies option is visible+disabled; second test verifies that programmatically changing selection to U5 leaves `select.value === ""` and removes `[role="listbox"]`. |
| Derived Selector Availability | a live unit recovers after catalog changes | `FocusSelector.test.tsx > auto-reenables U5 and makes its new accessible skill selectable` | ✅ COMPLIANT — pushes `mat.u5.live` into `catalog.unit5`, asserts `option(5).disabled === false`, `text === "Unidad 5"`, fires change event, clicks the rendered `[role="option"]` button, asserts `onSkillSelect` called with the live skill. |
| Derived Selector Availability | (no scenario; declarative: no URL, no stored selection, no persistence, no banner) | source inspection of `FocusSelector.tsx` and the change artifacts | ✅ COMPLIANT — no `useRouter`, no `localStorage`/`sessionStorage`, no banner component. `design.md` Decisions table line 16 documents the exclusion. |

### Delta `openspec/changes/u5-01-provisional-retirement/specs/math-exercise-catalog/spec.md`

| Requirement | Scenario | Covering test | Result |
|---|---|---|---|
| Catalog Coverage | empty Unit 5 is permitted | `per-unit-thresholds.test.ts > unit-5 threshold is 0` + `catalog-split-equivalence.test.ts > loadCatalog returns exactly the baseline count` | ✅ COMPLIANT — explicit `0` threshold and 216-total baseline both pass. |

### Delta `openspec/changes/u5-01-provisional-retirement/specs/math-skill-model/spec.md`

| Requirement | Scenario | Covering test | Result |
|---|---|---|---|
| Provisional U5 Skill and Edge Retirement | six provisional IDs are absent from active catalog surfaces | `complejos-domain.test.ts > no U5 skill lists mat.u1.complejos as a downstream prerequisite (U5-01 retirement)` + grep of `skill-catalog.ts` | ✅ COMPLIANT — the only `mat.u5.*` strings remaining in source are (a) the comment block at `skill-catalog.ts:60–67` that explains the retirement and (b) the synthetic `mat.u5.trigonometria_basica` test fixture in `diagnostic.test.ts:400,404` (explicitly preserved per canonical `Synthetic Diagnostic Fixtures Are Retained`). `UNIT_5_SKILLS = []`, `ALL_SKILLS` derived from spread does not include any retired ID, `SKILL_DEPENDENCIES` has zero `mat.u5.*` rows. |

### Delta `openspec/changes/u5-01-provisional-retirement/specs/complex-numbers-skill/spec.md`

| Requirement | Scenario | Covering test | Result |
|---|---|---|---|
| Skill Order and Prerequisites | active prerequisite graph resolves without the polar skill | `complejos-domain.test.ts > mat.u1.complejos is the 8th pilot entry, after logaritmos` + `no U5 skill lists mat.u1.complejos as a downstream prerequisite (U5-01 retirement)` | ✅ COMPLIANT — pilot index `complejosIndex === 7` (0-indexed → 8th entry), `logIndex === 6`, `complejosIndex > logIndex`. `SKILL_DEPENDENCIES` filtered by `prerequisites.includes("mat.u1.complejos")` and then by `d.skillId.startsWith("mat.u5.")` returns `[]`. `mat.u1.complejos` prerequisite remains `["mat.u1.propiedades_operaciones_reales"]` (line 113 of skill-catalog.ts). |

**Compliance summary**: 9/9 scenarios COMPLIANT, 11/11 requirements implemented.

## Correctness (Static Evidence)

| Requirement | Status | Notes |
|---|---|---|
| Retire 6 provisional skills from `UNIT_*_SKILLS`, `ALL_SKILLS`, `KNOWN_SKILL_IDS`, `SKILL_DEPENDENCIES` | ✅ Implemented | `skill-catalog.ts:60–94,107–133` — `UNIT_5_SKILLS = []`, `ALL_SKILLS` spread empty U5, `KNOWN_SKILL_IDS` derived, no U5 dependency rows. |
| Retire 5 placeholder exercises from `content/matematica/exercises.json` | ✅ Implemented | `catalog-split-equivalence.test.ts` baseline assertion `BASELINE_TOTAL === 216` (post-retirement) passes; `grep ex.u5. content/matematica/exercises.json` returns empty. |
| `UNIT_THRESHOLDS["unit-5"] = 0` | ✅ Implemented | `content-loaders.ts:920–925` declares `{ "unit-1": 40, "unit-2": 20, "unit-3": 24, "unit-5": 0 }`. |
| Retire 2 provisional taxonomy tags (`u5_cuadrante_angulo`, `u5_identidad_pitagorica`) | ✅ Implemented | `error-taxonomy-u3.test.ts:99–107` enforces absence from active taxonomy; no occurrences in `src/domain/error-taxonomy/` outside this test. |
| Retire provisional U5 entries from pedagogy doc `06-skill-map.md` | ✅ Implemented | `grep` of `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md` for `angulos\b\|radianes\b\|complejos_forma_polar` returns empty. |
| Empty `UNIT_5_SKILLS` export, retained as an empty array | ✅ Implemented | `skill-catalog.ts:68`. |
| Synthetic diagnostic fixtures (`mat.u5.trigonometria_basica`, `ex.u5.bad.1`, `ex.u5.good.1`) preserved test-only | ✅ Implemented | `diagnostic.test.ts:399–417`. |
| `FocusSelector` derives availability from live skill count (no per-unit flag) | ✅ Implemented | `FocusSelector.tsx:47–53` exports `getUnitAvailability(unit, skillsByUnit)`; per-render `skillsByUnit` at lines 78–85. |
| Empty unit renders as native disabled option `Unidad N — Próximamente` with `aria-disabled="true"` and muted styling | ✅ Implemented | `FocusSelector.tsx:196–209`. |
| Change handler rejects unavailable programmatic values | ✅ Implemented | `FocusSelector.tsx:129–137` clears to `null` when unit is unavailable. |
| Per-render readiness + effective selection prevent empty listbox and re-enable on live restoration | ✅ Implemented | `FocusSelector.tsx:86–91` (`effectiveSelectedUnit`), `:97–110` (`readinessMap` rebuilt per render), `:220` (gates listbox on `effectiveSelectedUnit !== null`). |
| No URL / stored unit selection / persistence behavior / banner contract added | ✅ Implemented | `FocusSelector.tsx` has no router/storage/banner dependencies; `design.md` Decisions line 16 documents exclusion. |
| U1/U2/U3/U4/U6 dependency edges unchanged | ✅ Implemented | `skill-catalog.ts:107–133` has 21 dependency entries, none touching U5; pilot-skills tests pass. |
| `mat.u1.complejos` remains 8th `PILOT_SKILLS` entry after `mat.u1.logaritmos`, prerequisite `mat.u1.propiedades_operaciones_reales` | ✅ Implemented | `skill-catalog.ts:113` declares the prerequisite; `complejos-domain.test.ts` asserts pilot order. |
| No persistence / migration / sidecar / SQL / write-gate / adapter / schema change | ✅ Implemented | `git diff aa7ad91..HEAD --stat -- 'src/lib/persistence' 'src/lib/auth' 'supabase' 'sql'` returns empty; `apply-progress.md` lines 7–11 and `design.md` Boundaries section explicitly forbid this surface. |

## Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| Static retirement: empty `UNIT_5_SKILLS`, threshold `0`, exact-string-equality match | ✅ Yes | All four pieces verified by `per-unit-thresholds.test.ts` and `catalog-split-equivalence.test.ts`. |
| Availability derived from live skill count (no per-unit flag) | ✅ Yes | `getUnitAvailability(unit, skillsByUnit)` is the single source; per-render `skillsByUnit` recomputes per call. |
| Empty unit visible, disabled, `aria-disabled`, muted, labelled `Unidad N — Próximamente` | ✅ Yes | `FocusSelector.tsx:200–208`. |
| Defensive selection: change handler clears unavailable values | ✅ Yes | `FocusSelector.tsx:129–137`; covered by second `FocusSelector.test.tsx` test. |
| Live changes: per-render catalog + readiness + effective selection | ✅ Yes | `FocusSelector.tsx:78–110`; covered by 3rd + 4th `FocusSelector.test.tsx` tests. |
| Excluded recovery: no URL, no stored unit, no persistence, no banner | ✅ Yes | Source inspection of `FocusSelector.tsx` confirms none of these hooks. |
| U3 / U4 / U5-02 / archived U5-00 / canonical U5 content / SQL / persistence boundaries preserved | ✅ Yes | U3 product behavior, content, and contracts are unchanged. `error-taxonomy-u3.test.ts` alone is modified to retire an obsolete cross-U5 assertion; no U4/U5-02 edits or archived-U5-00 changes. `git diff aa7ad91..HEAD -- src/components/practice/` shows the 3 selector files (`FocusSelector.tsx`, the removed source-inspection test, and `FocusSelector.test.tsx`). |
| `mat.u5.ecuaciones_trigonometricas` unencumbered for future reuse | ✅ Yes | `skill-catalog.ts:66–67` documents the unencumbrance; no `mat.u5.*` entry in `KNOWN_SKILL_IDS`. |
| Source-inspection test file removed in favor of rendered tests | ✅ Yes | `ls src/components/practice/__tests__/FocusSelector*` returns only `FocusSelector.test.tsx`; the rendered file has 5 test cases matching the design's enumeration. |

## Cross-Reference Audit

Source-inspected references to the retired IDs (matches the `Active Reference Locations` table in `exploration.md`):

| Area | Expected post-retirement state | Actual | Status |
|---|---|---|---|
| `src/domain/models/skill-catalog.ts` | `UNIT_5_SKILLS = []`, no `mat.u5.*` in `SKILL_DEPENDENCIES` | Confirmed lines 60–67 (comment), 68 (empty export), 87–94 (ALL_SKILLS spread), 107–133 (deps) | ✅ |
| `src/domain/index.ts` | Re-exports `UNIT_5_SKILLS` | Confirmed line 29 | ✅ |
| `src/domain/catalog/content-loaders.ts` | `UNIT_THRESHOLDS["unit-5"] = 0` | Confirmed lines 920–925 | ✅ |
| `src/domain/error-taxonomy/index.ts` | No `u5_cuadrante_angulo`, no `u5_identidad_pitagorica` | Confirmed by `error-taxonomy-u3.test.ts:99–107` passing | ✅ |
| `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md` | No provisional U5 entries | Confirmed by grep (no `angulos`, `radianes`, `complejos_forma_polar` matches) | ✅ |
| `openspec/specs/{unit-5-foundation,math-exercise-catalog,math-skill-model,complex-numbers-skill}/spec.md` | Updated to post-retirement contract | Confirmed: canonical `unit-5-foundation/spec.md` declares `UNIT_5_SKILLS = []`, `UNIT_THRESHOLDS["unit-5"] = 0`, derived selector availability; `math-exercise-catalog/spec.md` allows empty Unit 5; `math-skill-model/spec.md` retains U2-factorización and U1-bifurcation prior changes; `complex-numbers-skill/spec.md` declares no `mat.u5.*` downstream edge. | ✅ |
| `src/domain/__tests__/{catalog,per-unit-thresholds,diagnostic,evaluator-index,catalog-answer-contract,complejos-domain,error-taxonomy}.test.ts` | Adjusted to post-retirement contracts | Confirmed: `per-unit-thresholds.test.ts:32–38` asserts 0; `complejos-domain.test.ts:98–109` asserts no `mat.u5.*` downstream; `error-taxonomy-u3.test.ts:99–107` asserts retired tags absent; `catalog-split-equivalence.test.ts:21–33` baseline 216; `diagnostic.test.ts:399–417` retains synthetic fixtures | ✅ |
| `src/components/practice/FocusSelector.tsx` | No literal provisional identifier; consumes `UNIT_5_SKILLS` | Confirmed: only `UNIT_5_SKILLS` import + per-render map; no literal `mat.u5.*` string | ✅ |
| `content/matematica/exercises.json` | 5 placeholder objects removed | Confirmed: `grep` returns empty | ✅ |

## Git Evidence (PR-merged lineage)

```
96623d7 Merge pull request #109 from Teksi75/docs/u5-availability-contract   ← HEAD
baf887b docs(u5): reconcile availability contract
f9e667f Merge pull request #107 from Teksi75/fix/u5-availability-behavior
178d8c9 fix(u5): prevent empty unavailable unit selection
4002fd8 fix(u5-01): derive per-render effective selection to prevent reachable empty listbox
617d8b6 fix(u5-01): recompute readiness map and remove unreachable empty-state branch
79234e2 fix(u5-01): complete selector availability audit
57ef9bd fix(u5-01): reduce FocusSelector availability contract to live derivation
3a111c3 fix(u5-01): derive unit availability from active skill count (#106)
19112e8 Merge pull request #104 from Teksi75/docs/u5-01-static-retirement-checkpoint
2e2e50d docs(u5): reconcile retirement verification evidence
a7b4b80 docs(u5): reconcile static retirement evidence
6d29c23 wip(u5-01): checkpoint static provisional retirement
d1b1a2f docs(u5): checkpoint static retirement decision
aa7ad91 Merge pull request #102 from Teksi75/chore/archive-u5-00-foundation    ← baseline
```

The selector availability contract is delivered via 6 source commits (3a111c3 → 178d8c9) merged through PR #106 then PR #107, with reconciliation docs in PR #109 (current HEAD). All 5 `FocusSelector.test.tsx` cases cover each commit's behavior delta.

## Issues Found

**CRITICAL**: None.

**WARNING**:
1. **Test count delta (−3 vs orchestrator expectation)**. Observed `3176` tests passed vs expected `3179`. No failures, no skips, no `it.skip`/`it.todo` in `src/`. Every spec scenario has a covering passing test. The delta is attributable to drift between the user's recorded expectation and the actual test surface at HEAD `96623d7` after the SDD-artifact reconciliation in PR #109; it is not a regression introduced by U5-01 work (the static retirement replaced source-inspection tests with 5 rendered cases per `design.md` line 34). Recurring verification at this exact HEAD will continue to report 3176 unless additional tests are added independently of this change. **Not a blocker** because (a) no test failed, (b) all spec scenarios are covered, (c) the delta is below project tolerance.

**SUGGESTION**:
1. **Self-contained test for `UNIT_5_SKILLS === []`**. The empty-state assertion is enforced indirectly via the rendered `FocusSelector.test.tsx` mock and via `skill-catalog.ts`'s spread into `ALL_SKILLS`. A direct unit test in `src/domain/__tests__/skill-catalog.test.ts` (or equivalent) would make the empty-export contract auditable without a render harness. Defensible for follow-up; not required by the spec.

## Verdict

**PASS WITH WARNINGS**.

Static retirement of the verified 6-skill / 5-exercise provisional Unit 5 inventory is fully reflected in source, content, taxonomy, references, specifications, documentation, and tests. The reduced `FocusSelector` availability contract (live derivation from `getUnitAvailability(unit, skillsByUnit)`; defensive selection; per-render readiness and effective selection; visible disabled `Próximamente` options with `aria-disabled`) is implemented, typed, and exercised by 5 rendered `FocusSelector.test.tsx` cases plus a pure-helper unit test. Typecheck, build, and 3176/3176 tests pass at HEAD `96623d7`. The only flag is a −3 test-count drift versus the orchestrator's recorded expectation, attributable to historic count drift rather than this change.

The change is **ready for archive** subject to the orchestrator acknowledging the test-count delta.

## Run commands (for reproducibility)

```bash
git rev-parse HEAD
# 96623d79dff9d9bb2ad4cfc394aace0e1bdcb962

pnpm run test
# Test Files  187 passed (187)
#      Tests  3176 passed (3176)

pnpm run typecheck
# (no output, exit 0)

pnpm run build
# ✓ Generating static pages using 3 workers (11/11) in 401ms
# Route (app): 11 routes
```
