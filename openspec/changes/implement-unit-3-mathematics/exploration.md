# Exploration: implement-unit-3-mathematics

> **Status:** Complete
> **Date:** 2026-06-20
> **Depends on:** unit-1-pedagogical-slice, unit-2-pedagogical-slice, unit-2-factorizacion-slice, unit-2-aplicaciones-slice, unit-2-pilot-activation, `material_canonico/Matemática/UNIDAD3_matemática.pdf`

---

## 1. Executive Summary

Unit 3 (Ecuaciones y sistemas) must become a first-class navigable unit in the
app, following exactly the same vertical slice used for Unit 1 (Conjuntos
numéricos y herramientas algebraicas) and Unit 2 (Polinomios y álgebra): 8
skills, theory → worked examples → practice → feedback → recovery, fully
registered as pilot skills so they appear in `/learn/matematica` and the home
pilot badge.

The eight skill IDs are **already declared** in `src/domain/models/skill-catalog.ts`
(`UNIT_3_SKILLS`) and their prerequisite graph is already wired in
`SKILL_DEPENDENCIES`. **None of them are in `PILOT_SKILLS` today**, which is why
U3 currently renders as "Próximamente" in the skill surface. The activation
must be additive (no parallel structure, no UI redesign) and must respect the
AGENTS.md content/voice rules (no `free-response`/`symbolic`, no numerical
answers for intervals/pairs/multi-values, no `pageReferences`, theory uses
`concepts`, no migration of legacy U3 entries from `content/matematica/exercises.json`).

Estimated total diff: ~1800–2400 lines. **Single-PR delivery exceeds the
400-line review budget by ~5×. Chained PRs are mandatory.**

---

## 2. Current State

### 2.1 Skill identity is already declared (no domain work needed for IDs)

`src/domain/models/skill-catalog.ts:36-45` already exports the 8 U3 skill IDs
in canonical order, and `SKILL_DEPENDENCIES:120-123` already wires:

| Skill | Prerequisites (already declared) |
|-------|----------------------------------|
| `mat.u3.ecuaciones_lineales` | (none — leaf) |
| `mat.u3.ecuaciones_cuadraticas` | (none — leaf) |
| `mat.u3.inecuaciones_lineales` | (none — leaf) |
| `mat.u3.inecuaciones_valor_absoluto` | `mat.u1.valor_absoluto`, `mat.u3.inecuaciones_lineales` |
| `mat.u3.recta` | `mat.u3.ecuaciones_lineales` |
| `mat.u3.sistemas` | (none — leaf) |
| `mat.u3.exponenciales` | `mat.u1.potencias_raices` |
| `mat.u3.logaritmicas` | `mat.u1.logaritmos` |

**Discovery (non-obvious):** U3 has cross-unit dependencies on U1
(`valor_absoluto`, `potencias_raices`, `logaritmos`). A student who has not
mastered those U1 skills will be blocked from accessing the corresponding U3
skills via `getAccessibleSkills` (prereq accuracy threshold 0.7). This is
correct behavior — surfacing it explicitly so the orchestrator doesn't
"simplify" it later.

### 2.2 U3 is "coming soon" in the UI

`src/domain/catalog/pilot-skills.ts:9-85` contains 15 entries (8 U1 + 7 U2).
**No U3 entries.** Therefore:

- `/learn/matematica` (`src/app/learn/matematica/page.tsx:16`) is hardcoded
  `UNIT_KEYS = ["unit-1", "unit-2"] as const` — U3 doesn't render at all.
- `PILOT_SKILL_UNIT_MAP` returns `undefined` for U3 IDs, so
  `src/app/learn/matematica/[skillId]/page.tsx:18-22` calls `notFound()` for
  any U3 URL.
- `getAccessibleSkills` only iterates `PILOT_SKILLS`, so U3 skills are
  invisible to the practice focus selector.
- The home pilot badge says "Unidades 1 y 2" (`src/app/page.tsx`) — needs to
  expand once U3 lands.

### 2.3 Existing U3 content — fragmentary and rule-violating

`content/matematica/exercises.json:3-74` contains **5 legacy U3 exercises**:

| ID | Skill | Type | Issues |
|----|-------|------|--------|
| `ex.u3.ecuaciones_lineales.1` | `ecuaciones_lineales` | `numerical` | References `u2_aislamiento_variable`, `u2_signo_al_mover` — **wrong unit prefix** in error tags |
| `ex.u3.ecuaciones_cuadraticas.1` | `ecuaciones_cuadraticas` | `multiple-choice` | `expectedAnswer: "x = 2, x = 3"` — flagged by `catalog-answer-contract` as migration target (acceptable as MC, but the `=` shape leaks notation) |
| `ex.u3.inecuaciones_lineales.1` | `inecuaciones_lineales` | `multiple-choice` | Uses `u3_signo_desigualdad` (correct tag) |
| `ex.u3.recta.1` | `recta` | `numerical` | `expectedAnswer: "1"` (slope), no tags |
| `ex.u3.sistemas.1` | `sistemas` | `multiple-choice` | `expectedAnswer: "x = 3, y = 1"` — order-of-coords risk |

**3 U3 skills have ZERO exercises today:**
`inecuaciones_valor_absoluto`, `exponenciales`, `logaritmicas`.

**Per AGENTS.md + user constraint: do not migrate these.** They must remain in
`exercises.json` if at all, but the new `content/matematica/exercises/unit-3.json`
becomes the source of truth for U3. Loader composition order (see §2.5) means
matching IDs in `unit-3.json` will dedupe the legacy ones.

### 2.4 U3 error taxonomy — only 2 of the 8 skills are covered

`src/domain/error-taxonomy/index.ts:748-766` declares:

- `u3_signo_desigualdad` ✓ (used by `inecuaciones_lineales`)
- `u3_direccion_desigualdad` ✓ (declared but **not referenced** by any
  current exercise; orphan tag)

**Missing u3 tags for the other 6 skills.** Required coverage per
`validatePracticeBank` / `loadSkillBank` (content-loaders.ts:793-810): every
`commonErrorTags` entry on a U3 exercise MUST have a matching `FeedbackMapping`
in `content/matematica/feedback/unit-3.json`. Minimum expected new tags (one
per skill, more for high-frequency misconceptions):

| Skill | Suggested new u3 tags (≥1) |
|-------|-----------------------------|
| `ecuaciones_lineales` | `u3_aislamiento_variable`, `u3_signo_al_mover` |
| `ecuaciones_cuadraticas` | `u3_bhaskara_signo`, `u3_factorizacion_erronea` |
| `inecuaciones_valor_absoluto` | `u3_doble_desigualdad`, `u3_valor_absoluto_signo` |
| `recta` | `u3_pendiente_signo`, `u3_orden_puntos` |
| `sistemas` | `u3_sustitucion_signo`, `u3_eliminacion_incorrecta` |
| `exponenciales` | `u3_exponente_logaritmo`, `u3_dominio_exponencial` |
| `logaritmicas` | `u3_log_dominio_invalido`, `u3_propiedad_logaritmo` |

(`u3_direccion_desigualdad` already exists; reuse it for `inecuaciones_valor_absoluto` if applicable.)

### 2.5 Catalog composition order — confirm dedup behavior

`src/domain/catalog/index.ts:51-91` (`getComposedExercises`) composes sources
in this fixed order:

1. `_unit1Exercises` first
2. `_unit2Exercises` second
3. `_exercisesJson` (legacy monolith — contains the 5 U3 entries) third
4. Per-skill files (only `conjuntos-numericos.json` registered today) fourth

`seenIds` set dedupes by `id`. Since the new `unit-3.json` will be added
**before** `_exercisesJson` in the chain, an `ex.u3.X.1` in the new file
replaces `ex.u3.X.1` from the legacy monolith. Other legacy U3 entries
(`.2`, `.3`, etc.) keep being added — **but if the new file doesn't introduce
those IDs**, the legacy orphan IDs persist. The `loadCatalog` validation
doesn't filter by skill — it iterates all 6 units. To fully evict the legacy
5 U3 entries, the change must also remove them from `exercises.json`.

**Recommendation:** delete the 5 legacy U3 entries from `exercises.json` as
part of the activation. This is the only way to honor "do not migrate old U3
exercises" without leaving orphans.

### 2.6 Content files to create (mirroring unit-1.json / unit-2.json)

| File | Format | Reference |
|------|--------|-----------|
| `content/matematica/theory/unit-3.json` | Array of 8 `TheoryNode` (one per skill) | `unit-2.json` shape: 263–333 lines total for 7 nodes ≈ 30–50 lines per node |
| `content/matematica/examples/unit-3.json` | Array of 16–24 `WorkedExample` (2–3 per skill) | `unit-2.json`: 17 examples for 7 skills ≈ 2.4 per skill |
| `content/matematica/feedback/unit-3.json` | Array of 8–12 `FeedbackMapping` (one per new u3 tag) | `unit-2.json`: 11 entries for 7 skills |
| `content/matematica/exercises/unit-3.json` | Array of 32–48 `Exercise` (≥4 per skill) | `unit-2.json`: 30+ exercises for 7 skills |

### 2.7 Content schema rules (verified by parser + validator)

Confirmed by reading `src/domain/catalog/content-loaders.ts:393-427`,
`src/domain/models/theory.ts:24-61`, `src/domain/models/exercise.ts:32-40`,
and `content/matematica/conventions.md`:

- **Theory**: `parseTheoryNode` accepts both `concepts` (preferred, matches U1
  latest migration) and `conceptBlocks` (legacy U2 form). The parser
  normalizes both to the same internal `concepts` field. **User constraint:
  use `concepts` only.** Each concept has `id`, `title`, `body` (or
  `bodyParagraphs` if long — parser accepts both). Required fields per
  node: `notation: []`, `commonMistakes: []`, `practicePrompts: []`,
  `canonicalTrace: []`. **`pageReferences` is not in the schema — the
  parser ignores it if present.** So the user constraint is honored by
  simply not writing the field.
- **Worked examples**: `id`, `skillId`, `problem`, `steps[]` (each with
  `order`, `explanation`, optional `intervalRepresentations`),
  `finalAnswer`, `pedagogicalNote`, `canonicalTrace[]`.
- **Feedback**: `errorTag`, `type` (`corrective|conceptual|procedural`),
  `message`, optional `recoveryTarget`.
- **Exercises**: `id` (regex `ex\.u[1-6]\..+\.[a-z0-9-]+`), `skillId`,
  `type` (one of 7 supported — **no `symbolic`, no `free-response`**),
  `difficulty` (1–5), `prompt`, `expectedAnswer`, `commonErrorTags[]`,
  `pedagogicalNote`, `category?`, `tags?`, `options?` (required for
  `multiple-choice`, ≥3 unique).

### 2.8 Answer-type selection (from conventions.md, restated for U3)

| U3 answer shape | Correct type | Rationale |
|-----------------|--------------|-----------|
| Single x value (e.g. `x = 3`) | `numerical` | Finite scalar — already used by U1/U2 |
| Two solutions `x = -2, x = 2` | `multiple-choice` | Multi-value banned for `numerical` |
| Inequality result `x > 3` | `multiple-choice` | Operator + scalar — fragile to type |
| Interval solution `[-2, 5)` | `multiple-choice` with `intervalRepresentation` | Per AGENTS.md |
| System `x = 3, y = 1` | `multiple-choice` (ordered pair in options) | Per conventions.md |
| Logarithmic/exp result `log_2(8) = 3` | `numerical` (3) or `multiple-choice` (if non-numeric form) | Symbolic `log_2(8)` is banned — convert to MC |
| Slope/intersect single scalar | `numerical` | Same as U1/U2 |

### 2.9 Learn page rendering — already unit-agnostic

`src/app/learn/matematica/page.tsx:18-25` reads `UNIT_KEYS` and calls
`loadTheoryContent(key)` per entry. The new section is purely a config change
(extend `UNIT_KEYS` and `UNIT_LABELS`).

The dynamic skill route `src/app/learn/matematica/[skillId]/page.tsx:24-25`
looks up `loadTheoryContent(unitKey).find(t => t.skillId === decodedSkillId)`.
This works for U3 the moment `PILOT_SKILL_UNIT_MAP` maps U3 IDs → `"unit-3"`
AND `loadTheoryContent("unit-3")` returns the 8 nodes. **No route changes
needed.**

### 2.10 Test fixtures that need updating

After `unit-2-pilot-activation`, the following tests reference the "not in
pilot" U3 IDs as their negative control:

- `src/app/practice/__tests__/start-skill.test.ts` — uses U3 IDs as
  "not-pilot" fixture → will break once U3 lands
- `src/components/diagnostic/__tests__/practice-link.test.ts` — same
- `src/domain/__tests__/pilot-skills.test.ts` — has 8+7=15 assertion; must
  become 8+7+8=23
- `src/domain/__tests__/accessibility.test.ts` — accuracy entries must cover
  U3 (currently 41 lines, ~6 U2 entries; will need ~8 U3 entries)
- `src/domain/__tests__/catalog-content.test.ts` — U1/U2 theory/example
  count assertions; will need U3 parallel assertions
- `src/domain/__tests__/content-loaders.test.ts` — U1/U2 threshold
  assertions; same
- `src/domain/__tests__/catalog-split-equivalence.test.ts:19-22` — pinned
  baseline of 152 total / 101 U1 / 44 conjuntos; any new exercises break
  this. Must be updated to the new totals.

---

## 3. Affected Areas

| Area | Action | Why |
|------|--------|-----|
| `src/domain/catalog/pilot-skills.ts` | **Modify** | Add 8 U3 `PilotSkill` entries; `PILOT_SKILL_UNIT_MAP` auto-regenerates |
| `src/domain/catalog/content-loaders.ts` | **Modify** | Add 4 imports (theoryUnit3, examplesUnit3, feedbackUnit3, unit3Exercises); extend `RAW_REGISTRY.theory/examples/feedback` and `UNIT_EXERCISE_FILES[3]` |
| `src/domain/catalog/index.ts` | **Modify** | Add `_unit3Exercises` import; `addExercises(_unit3Exercises, "unit-3", ...)` BEFORE the `exercisesJson` line so unit-3 wins dedup |
| `src/domain/error-taxonomy/index.ts` | **Modify** | Add 8–12 new `u3_*` tags following the existing block comment style at lines 746–766 |
| `src/app/learn/matematica/page.tsx` | **Modify** | Add `unit-3: "Unidad 3 — Ecuaciones y sistemas"` to `UNIT_LABELS`; add `"unit-3"` to `UNIT_KEYS` |
| `content/matematica/exercises.json` | **Modify** | Remove the 5 legacy U3 entries (lines 3–74) so they don't orphan |
| `content/matematica/theory/unit-3.json` | **Create** | 8 TheoryNodes with `concepts`, no `pageReferences`, `canonicalTrace` per skill |
| `content/matematica/examples/unit-3.json` | **Create** | 16–24 WorkedExamples (2–3 per skill) |
| `content/matematica/feedback/unit-3.json` | **Create** | 8–12 FeedbackMappings (one per new `u3_*` tag) |
| `content/matematica/exercises/unit-3.json` | **Create** | 32–48 Exercises (≥4 per skill, ≥3 options for MC) |
| `src/domain/__tests__/pilot-skills.test.ts` | **Modify** | 15 → 23 assertion; U3 sub-block |
| `src/domain/__tests__/accessibility.test.ts` | **Modify** | Add U3 accuracy entries |
| `src/domain/__tests__/catalog-content.test.ts` | **Modify** | U3 parallel assertions for theory/examples/feedback |
| `src/domain/__tests__/content-loaders.test.ts` | **Modify** | U3 threshold assertions (theory ≥ 8, examples ≥ 16, feedback ≥ 8) |
| `src/domain/__tests__/catalog-split-equivalence.test.ts` | **Modify** | Bump `BASELINE_TOTAL`, `BASELINE_UNIT_3` (new), keep U1/U2/conjuntos untouched |
| `src/app/practice/__tests__/start-skill.test.ts` | **Modify** | Replace "not-pilot" U3 fixture with a still-not-pilot ID (e.g. `mat.u4.perimetro_area_volumen`) |
| `src/components/diagnostic/__tests__/practice-link.test.ts` | **Modify** | Same as above |
| `src/components/home/SkillRoadmap.tsx` | **(no change needed)** | Already uses generic aria-label from `unit-2-pilot-activation` |
| `src/app/page.tsx` | **Modify** | Pilot badge "Unidades 1 y 2" → "Unidades 1, 2 y 3" |
| `src/app/learn/page.tsx` | **Modify** | Description references U3 |
| `src/domain/next-step/index.ts` | **(verify only)** | Multi-unit fallback already handles N≥2 units generically; no change expected |

---

## 4. Approaches

### Approach A — Single vertical slice (REJECTED)

One PR: full theory + examples + feedback + exercises + catalog + learn page
+ tests. Estimated 1800–2400 lines.

- **Pros:** One atomic change; reviewable as a unit; no inter-PR drift.
- **Cons:** ~5× the 400-line review budget; reviewer fatigue; harder to bisect
  regressions; risk of merge conflicts across multi-PC work (AGENTS.md calls
  this out explicitly: "Engram no es portable entre PCs").
- **Effort:** High (single mega-PR)

### Approach B — 3 chained PRs (RECOMMENDED)

Same pattern as `unit-1-pedagogical-slice` (3 chained PRs) and
`unit-2-pedagogical-slice` (3 chained PRs). Roughly aligned with the
U1/U2 sequence.

**PR-1 — Domain + Content (theory/examples/feedback, taxonomy, page registration)**
- Add 8–12 `u3_*` error tags in `error-taxonomy/index.ts`
- Add `error-tagging.ts` pattern detectors for the new tags (1–2 patterns
  per tag, mirroring U2 factorizacion/aplicaciones slices)
- Create `content/matematica/theory/unit-3.json` (8 nodes)
- Create `content/matematica/examples/unit-3.json` (16–24 examples)
- Create `content/matematica/feedback/unit-3.json` (8–12 mappings)
- TDD: shape tests for theory, examples, feedback, taxonomy
- `content/matematica/exercises.json` — remove 5 legacy U3 entries
- **Estimated:** ~900–1100 lines (TDD-heavy)
- **Review budget risk:** Medium (slightly over, but cohesive single concern)

**PR-2 — Catalog + Exercises (exercises JSON, loaders, exercises wiring)**
- Create `content/matematica/exercises/unit-3.json` (32–48 exercises)
- Extend `content-loaders.ts` (4 new imports, RAW_REGISTRY + UNIT_EXERCISE_FILES[3])
- Extend `catalog/index.ts` (`_unit3Exercises` import + `addExercises` call before
  the monolith)
- Bump `UNIT_THRESHOLS["unit-3"]` in `content-loaders.ts:831-834` to a defensible
  minimum (e.g. `40` to match U1, `20` would match U2 — pick based on what
  PR-2 actually ships)
- TDD: shape tests, validateExercise audit, difficulty-progression, traceability
- Bump `catalog-split-equivalence.test.ts` baseline totals
- **Estimated:** ~700–900 lines (mostly JSON + loader + tests)
- **Review budget risk:** Medium

**PR-3 — Pilot Activation (registration, UI, fixtures)**
- `src/domain/catalog/pilot-skills.ts` — add 8 U3 entries with labels
- `src/app/learn/matematica/page.tsx` — extend `UNIT_KEYS` and `UNIT_LABELS`
- `src/app/page.tsx` — pilot badge update
- `src/app/learn/page.tsx` — description update
- Test fixture updates: `pilot-skills.test.ts`, `accessibility.test.ts`,
  `start-skill.test.ts`, `practice-link.test.ts`
- Verify: `pnpm run test && pnpm run typecheck && pnpm run build`
- **Estimated:** ~200–350 lines
- **Review budget risk:** Low

**Total across 3 PRs:** ~1800–2350 lines, all ≤ 1100 lines per PR.

- **Pros:** Each PR has a single concern; matches established project
  pattern (U1 slice, U2 slice); easy to bisect; manageable review load per PR.
- **Cons:** Requires 3 successful merges; dependency on PR-1 for PR-2 to
  pass typecheck (PR-2 references new taxonomy tags).
- **Effort:** Medium per PR; Medium total

### Approach C — 2 chained PRs (acceptable alternative)

- **PR-1 (Domain + Content, ~1500 lines):** everything except pilot
  registration + UI + fixture updates
- **PR-2 (Pilot Activation, ~250 lines):** pilot-skills, learn page, fixtures

- **Pros:** Faster time-to-merge; fewer handoffs.
- **Cons:** PR-1 sits at ~3.5× review budget — the 400-line guard is
  defined for cognitive load, not hard failure. The status-quo project
  precedent (`unit-1-pedagogical-slice`, 800–950 lines forecast) was
  already High risk and ran 3 PRs.
- **Effort:** Medium

**Decision:** Approach B (3 PRs) is the default. Approach C is a fallback if
the user explicitly wants to compress; it requires an explicit
`size:exception` per `sdd-phase-common.md` §E.

---

## 5. Recommended Scope

### 5.1 MVP acceptance criteria

- [ ] All 8 U3 skill IDs visible on `/learn/matematica` as navigable topic
      cards under a "Unidad 3 — Ecuaciones y sistemas" heading
- [ ] Each U3 skill has:
  - [ ] 1 `TheoryNode` with ≥4 `concepts` (using `concepts` schema, no
        `pageReferences`)
  - [ ] ≥2 `WorkedExample` with `canonicalTrace` referencing
        `material_canonico/Matemática/UNIDAD3_matemática.pdf`
  - [ ] ≥4 `Exercise` covering difficulty 1–3, mix of `multiple-choice`
        and `numerical` types
  - [ ] ≥1 `commonErrorTag` per skill with matching `FeedbackMapping` in
        `unit-3.json`
  - [ ] `expectedAnswer` conforms to conventions.md (no `free-response`,
        no `symbolic`, no multi-value `numerical`, no `pageReferences`)
- [ ] `isSkillReady(skillId)` returns `ready: true` for all 8 U3 IDs
- [ ] `loadCatalog()` passes validation (unit threshold met, no orphan
      error tags)
- [ ] Home pilot badge: "Unidades 1, 2 y 3"
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` all green
- [ ] No `getAccessibleSkills` regression: U1/U2 readiness/prereq behavior
      unchanged

### 5.2 Out of scope (avoid scope explosion)

- **Física** — explicitly deferred (AGENTS.md + product sequencing)
- **Migration of legacy U3 from `exercises.json`** — forbidden by user;
  instead the 5 entries are deleted
- **New exercise types** — uses the existing 7-type set; no `symbolic`
- **New content schema fields** — uses existing `concepts`/`commonMistakes`/
  `notation`/`practicePrompts`/`canonicalTrace`; no `pageReferences`
- **UI redesign** — only `UNIT_KEYS`/`UNIT_LABELS` + badge text change
- **Parallel unit-3 routes** — the dynamic `[skillId]` route already handles
  any unit; no new route files
- **Custom U3 evaluator / module** — U3 fits the existing evaluators
  (MC, numerical, true-false) with no need for `polynomial-evaluator`-like
  domain module. Inecuaciones with `intervalRepresentation` options reuse
  the existing `ExerciseOption` shape.
- **Genuine "domain helpers"** — none needed. The U2 slices needed
  `polynomial-evaluator` and `gauss-routing-helper`; U3 does not. The only
  pure-domain addition is `error-tagging.ts` detectors (mirroring U2
  pattern detectors, not full modules).

---

## 6. SDD Plan by Stages

### Stage 1: Domain + Content (PR-1)

**Change**: `implement-unit-3-mathematics-domain`
- **Forecast:** ~900–1100 lines, 400-line budget risk: Medium
- **TDD:** RED → GREEN → REFACTOR
- **Tasks:**
  1. Inspect `UNIDAD3_matemática.pdf` — confirm section coverage per skill
  2. Add 8–12 `u3_*` tags to `error-taxonomy/index.ts` (failing test first)
  3. Add `error-tagging.ts` detectors for 2–3 representative tags
  4. Create `content/matematica/theory/unit-3.json` (8 nodes, 4+ concepts each)
  5. Create `content/matematica/examples/unit-3.json` (16–24 examples, 2–3 per skill)
  6. Create `content/matematica/feedback/unit-3.json` (8–12 mappings)
  7. Remove the 5 legacy U3 entries from `exercises.json`
  8. Integration tests: shape validation for new content files
  9. Verify `validateExercise` for the new content (no orphan tags, no
     banned answer shapes)

### Stage 2: Catalog + Exercises (PR-2)

**Change**: `implement-unit-3-mathematics-catalog`
- **Forecast:** ~700–900 lines, 400-line budget risk: Medium
- **TDD:** RED → GREEN → REFACTOR
- **Tasks:**
  1. Create `content/matematica/exercises/unit-3.json` (32–48 exercises)
  2. Extend `content-loaders.ts`: 4 imports, RAW_REGISTRY entries,
     UNIT_EXERCISE_FILES[3]
  3. Extend `catalog/index.ts`: import + `addExercises` call before
     `exercisesJson` to ensure unit-3 wins dedup
  4. Bump `UNIT_THRESHOLS["unit-3"]` in `content-loaders.ts:831`
  5. Update `catalog-split-equivalence.test.ts` baseline
  6. TDD: catalog audit, exercise-unit-metadata, difficulty-progression,
     traceability audit
  7. Verify `loadCatalog()` passes unit-3 threshold

### Stage 3: Pilot Activation (PR-3)

**Change**: `implement-unit-3-mathematics-activation`
- **Forecast:** ~200–350 lines, 400-line budget risk: Low
- **Tasks:**
  1. Add 8 U3 `PilotSkill` entries to `pilot-skills.ts`
  2. Extend `learn/matematica/page.tsx` `UNIT_KEYS` and `UNIT_LABELS`
  3. Update home pilot badge in `src/app/page.tsx`
  4. Update `src/app/learn/page.tsx` description
  5. Update test fixtures: `pilot-skills.test.ts`, `accessibility.test.ts`,
     `start-skill.test.ts`, `practice-link.test.ts`
  6. Run full verification: `pnpm run test && pnpm run typecheck && pnpm run build`
  7. Update `openspec/changes/STATUS.json`: add this change with
     `status: "in-progress"`, `branch: <feature-branch>`

### Stage 4: Verification + Archive

- Verify all 3 PRs merged
- Update `STATUS.json` to `status: "done"`, `branch: null`
- Run GGA (Linux) for adversarial review (Windows GGA bypass per
  STATUS.json precedent)
- Archive the change folder under `openspec/changes/archive/2026-06-20-implement-unit-3-mathematics/`

---

## 7. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **400-line review budget exceeded** | High | 3 chained PRs (Approach B); `auto-chain` strategy |
| **Legacy U3 exercises orphan in `exercises.json`** | Medium | Delete the 5 entries in PR-1; explicit test for `queryBySkill("mat.u3.X")` count |
| **U3 skill accessibility blocked by U1 prereqs** | Low (correct) | `getAccessibleSkills` already handles this; document in commit |
| **Content quality drift from canonical PDF** | Medium | `canonicalTrace` field with `path`, `section`, `sourceUse`, `pedagogicalIntent` per AGENTS.md; per-skill traceability audit test |
| **Wrong unit prefix in error tags** (e.g. `u2_` on U3 exercise) | Medium | Per-tag unit assertion test; `error-taxonomy.test.ts` already pattern-matches; pre-PR validation of new exercises' `commonErrorTags` |
| **`conceptBlocks` vs `concepts` schema drift** | Low | `parseTheoryNode` normalizes both; `content-loaders.test.ts:475` regression covers the legacy `unit-1.json` form; U3 will use only `concepts` |
| **MC option distractor quality** | Medium | Per AGENTS.md, distractor logic should derive from `commonErrorTags`/`recoveryTarget`; review at proposal stage |
| **`expectedAnswer: "x = 2, x = 3"` shape leak in U3 quadratic MC** | Low | All new U3 MC answers use clean set/option forms (no `=`, no multi-numeric); review pre-merge |
| **GGA bypassed on Windows** | Medium | STATUS.json precedent: orchestrator must run GGA on Linux for adversarial review; document in PR-3 verify step |
| **Cross-PC work conflicts** (AGENTS.md multi-PC concern) | Medium | Each PR merges to main independently; STATUS.json tracks the active branch |
| **Voice/copy regression** ("profe digital" claims) | Low | U3 is math content; copy lives in JSON strings; CI test `copy-strings-acceptance.test.ts` covers the prohibited strings |
| **`PILOT_SKILL_UNIT_MAP` tolerance for unknown IDs** | Low | Already returns `string \| undefined`; `[skillId]/page.tsx:18-22` handles `notFound`; no behavior change needed |

---

## 8. Open Questions for the User / Orchestrator

1. **U3 minimum exercise count**: The `UNIT_THRESHOLS` map in
   `content-loaders.ts:831-834` has U1=40, U2=20. The user asked for
   "≥4 exercises per skill × 8 skills = 32 minimum". Recommendation:
   set `UNIT_THRESHOLS["unit-3"] = 32` (matches the floor the user
   implied). If higher (40 to match U1), PR-2 grows by ~8 more exercises.
2. **Per-skill `remedial=true` flag for U3 skills with U1 prereqs**: U3 has
   cross-unit prereqs (e.g. `logaritmicas` requires `u1.logaritmos`). Should
   we surface "antes de practicar esto, practicá X" guidance? Out of scope
   per "no UI redesign", but worth a UX follow-up after activation.
3. **Theory depth per skill**: U1 has 12–14 concepts for `conjuntos_numericos`
   alone; U2 averages 4–7. U3 skills vary widely (`recta` is thin;
   `ecuaciones_cuadraticas` is broad). Recommendation: 4–6 concepts per skill
   for MVP, expand in a follow-up slice if `practicaPrevia` signals demand.
4. **Worked examples per skill**: U1 has 2–4 per skill; U2 averages 2.4.
   Recommendation: 2 per skill for MVP (16 total), expandable in a
   follow-up if specific skills prove hard (e.g. `ecuaciones_cuadraticas`
   will likely need 3–4).

---

## 9. Ready for Proposal

**Yes** — exploration is sufficient to launch `sdd-propose`.

The orchestrator should:
1. Confirm Approach B (3 chained PRs) and the `auto-chain` delivery strategy
2. Resolve the 4 open questions in §8 (or pass them to `sdd-propose`)
3. Pass `chained-prs-stacked-to-main` (or `feature-branch-chain`) as the
   delivery strategy, matching the U1/U2 slice precedent
4. Launch `sdd-propose` with this exploration as context; `sdd-propose`
   will produce the proposal.md and the user-facing `size:exception`
   (if any) before apply

---

## SDD Result Envelope

**Status**: success
**Summary**: Unit 3 activation requires 3 chained PRs (Domain+Content → Catalog+Exercises → Pilot Activation). 8 U3 skill IDs already declared in `skill-catalog.ts` with prerequisite graph; UI is hidden because `PILOT_SKILLS` lacks U3 entries. ~1800–2350 lines total, exceeds 400-line budget 5×. No new domain module needed (U3 fits existing MC/numerical/true-false evaluators). Legacy 5 U3 entries in `exercises.json` must be removed (do not migrate). New u3_* error tags + detectors needed for 6 of 8 skills. Prereq graph correctly blocks `inecuaciones_valor_absoluto`, `exponenciales`, `logaritmicas` when their U1 prereqs are unmet.
**Artifacts**: Engram `sdd/implement-unit-3-mathematics/explore` | `openspec/changes/implement-unit-3-mathematics/exploration.md`
**Next**: sdd-propose (define scope for Stage 1: domain + content)
**Risks**: 400-line budget (mitigated by 3 chained PRs), GGA bypass on Windows, cross-PC branch conflicts, legacy U3 entries must be removed not migrated
**Skill Resolution**: paths-injected — 2 skills (sdd-explore, cognitive-doc-design)
