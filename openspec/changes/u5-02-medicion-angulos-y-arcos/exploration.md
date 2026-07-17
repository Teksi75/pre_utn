## Exploration: U5-02 angle and arc measurement

### Current State

Unit 5 is intentionally empty after U5-01. The first canonical skill, `mat.u5.medicion_angulos_y_arcos`, must add theory, worked examples, feedback, canonical exercises, catalog wiring, and the first structured answer support without restoring any retired provisional ID.

CodeGraph could not be used because the repository has no `.codegraph/` index; the investigation therefore used repository files and the external, read-only canonical PDFs named by the U5-00 receipts.

#### Canonical items 1–3

The binding allocation is `openspec/changes/archive/2026-07-14-u5-00-unit-5-foundation/traceability.md:42-48`. The source receipts are:

- `mat.u5.practice`: `05_ej_utn.pdf`, 7 pages, SHA-256 `49b8dd5c671cec28398bc58d3a6132368cb11476a6a619e384d9fe1f50628575` (`source-receipts.json:13-31`). The exact statements below are on practice p. 3.
- `mat.u5.theory`: `UNIDAD5_matemática.pdf`, 20 pages, SHA-256 `75255244e1c6fbd99813b4a34d7910df8fea30713d07852c928f3940064e3cd6` (`source-receipts.json:2-11`). Required theory is on pp. 7–9.

| Canonical item | Source statement / cells | Expected answer | Required answer form |
|---|---|---|---|
| 1.a | Table row `α1`, sexagesimal `36º`, circular blank | `π/5 rad = 0.628318… rad` | Normalized rational coefficient of π plus decimal value, as required by U5-00's “exact fractions of π + decimal form” trace. |
| 1.b | Table row `α2`, sexagesimal `225º`, circular blank | `5π/4 rad = 3.926991… rad` | Same structured π-rational plus decimal form. |
| 1.c | Table row `α3`, circular `3π/4`, sexagesimal blank | `135º` | Existing single numerical input; degrees are fixed by the prompt/label. |
| 1.d | Table row `α4`, circular `2,3456`, sexagesimal blank | `134.392980…º` (equivalently `134º 23′ 34.729…″`) | Decimal degrees using the existing numerical input. The table asks for the sexagesimal system but does not explicitly demand DMS; item 2 does. |
| 2 | “Un ángulo central determina un arco de 6 cm en una circunferencia de 30cm de radio. Expresa el ángulo central en radianes y en grados, minutos y segundos sexagesimales.” | `α=s/r=6/30=1/5=0.2 rad`; `11º 27′ 32.961…″`, normally displayed to the nearest second as `11º 27′ 33″` | Two traced app interactions are the smallest reusable design: existing numerical radians (`0.2`) and structured DMS. The spec must choose and state seconds rounding/tolerance because the source does not. |
| 3 | “El minutero de un reloj mide 12 cm. ¿Qué distancia recorre la punta del minutero durante 20 minutos?” | `s=(20/60)·2π·12=8π cm = 25.132741… cm` | Structured normalized π-rational plus decimal form, with the unit supplied by the control/prompt rather than free text. |

Important correction to U5-00 wording: item 2 is **not** a rational multiple of π. Its exact radian measure is `1/5 rad`; writing it as `qπ` requires `q=1/(5π)`, which is not rational. The π-rational encoding is nevertheless **consumed: yes**, by items 1.a, 1.b, and 3.

Minimal theory and examples are limited to: degree/minute/second definitions and bounds; `180º=π rad`; conversion in both directions; decimal-degree ↔ DMS conversion with a declared seconds policy; radian definition; `α=s/r` and `s=αr`; and elapsed-time fraction of one revolution. A compact content packet can use one theory node with 4–5 concepts and three worked examples: degree/radian table conversion, `6/30` radians to DMS, and the 20-minute arc.

#### Current answer evaluation and minimal extension

`src/domain/models/exercise.ts:32-40` supports `multiple-choice`, `true-false`, `numerical`, `fill-blank`, `matching`, `ordering`, and `graphical`. `src/domain/evaluator/index.ts:21-85` automatically grades only numerical (absolute tolerance `0.01`, `numeric.ts:7-38`), true/false, fill-blank, and multiple-choice; matching, ordering, and graphical return manual review. There is no structured answer kind, fraction/π parser, DMS codec, or structured display. The active `openspec/specs/math-answer-evaluator/spec.md:25-53,78-100` documents only these paths. The U5-00 architecture (`design.md:16,49-66`) explicitly reserves a structured discriminator, canonical JSON, pure codecs, control dispatch, snapshots, and read-only display for first consumption in U5-02.

The minimal additive contract is:

1. Add `structured` to `ExerciseType` and an `answerSpec` discriminator to `ExerciseBaseShape`/`EvaluableExercise` and `content-loaders.ts`.
2. Add only two answer specs in this slice:
   - `pi-rational`: expected normalized coefficient `{ numerator: integer, denominator: positive integer }` representing `(numerator/denominator)π`, optional required decimal and tolerance, and optional display unit. Normalize sign and GCD; reject zero denominator; do not accept aliases or retired formats.
   - `angle-dms`: expected `{ degrees: integer, minutes: integer, seconds: finite number }`, with `0≤minutes<60`, `0≤seconds<60`, and explicit seconds tolerance/rounding. Current items are non-negative, so signed-angle generalization is unnecessary.
3. Serialize submissions as versioned canonical JSON strings (for example `{"v":1,"kind":"pi-rational","numerator":1,"denominator":5,"decimal":0.6283}` and `{"v":1,"kind":"angle-dms","degrees":11,"minutes":27,"seconds":33}`), preserving the current string flow through `evaluateAnswer`, progress snapshots, and retries.
4. Dispatch structured answers in `evaluateAnswer`; parse/normalize deterministically; malformed expected specs return `configuration_error`. Compare π coefficients exactly after normalization, decimals by declared tolerance, and DMS by total arc-seconds/tolerance.
5. Add only misconception detectors used by these items, gated by declared `commonErrorTags`: inverted degree/radian factor, DMS carry/bounds or conversion error, and wrong arc formula/time fraction. Corresponding `u5_*` taxonomy entries and feedback mappings must exist.

This is preferable to a general mathematical-expression parser: it obeys the no-free-text rule, is framework-free, and does not pre-build answer kinds owned by U5-03+.

#### Content wiring checklist

- Create only `content/matematica/{theory,examples,feedback,exercises}/unit-5.json`, following the U3 shapes: theory concepts/notation/mistakes/prompts and `canonicalTrace`; worked steps/final answer/note and trace; feedback mappings keyed by `u5_*` with valid recovery targets; exercises with `canonicalTrace` per canonical item/subitem.
- Use receipt identities in traces (`mat.u5.theory`, pp. 7–9; `mat.u5.practice`, item `1.a`…`3`) and preserve 1.a–1.d separately. Do not point at or copy PDFs into the repository.
- Register all four JSON imports in `src/domain/catalog/content-loaders.ts`: `RAW_REGISTRY` for theory/examples/feedback, `UNIT_EXERCISE_FILES[5]`, parser support for `structured`/`answerSpec`, and a positive `UNIT_THRESHOLDS["unit-5"]` equal to the implemented exercise count (not the retired `0`).
- Register `unit-5.json` in the independent composition path in `src/domain/catalog/index.ts`; otherwise `queryBySkill`, readiness, and practice will not see it even if `content-loaders.ts` does.
- Add only `mat.u5.medicion_angulos_y_arcos` to `UNIT_5_SKILLS`; `ALL_SKILLS` and `KNOWN_SKILL_IDS` derive automatically. It is the normative root, so add no `SKILL_DEPENDENCIES` entry.
- Add the skill to `PILOT_SKILLS` with `unitKey: "unit-5"` and a Spanish label. `PILOT_SKILL_UNIT_MAP` and `PRACTICE_SKILL_UNIT_MAP` then derive automatically. Update count/order guards in `pilot-skills.test.ts` and any stale catalog comments/count assertions.
- Add `unit-5` to `UNIT_LABELS` and `UNIT_KEYS` in `src/app/learn/matematica/page.tsx`, plus a visible section/card test. The dynamic learn route already resolves through `PILOT_SKILL_UNIT_MAP` and needs no route change.
- Add the minimal `u5_*` taxonomy entries in `src/domain/error-taxonomy/index.ts`, pure detectors/dispatch in `src/domain/evaluator/error-tagging.ts`, feedback coverage, and TDD tests.
- Extend the math-content brand-voice scan in `src/domain/__tests__/copy-strings-acceptance.test.ts:174-195` to all four U5 content files. No home copy should change.
- Home route/status/suggestions derive from `PILOT_SKILLS` (`src/domain/student-home/index.ts:340-403`), so U5 will appear with one live skill automatically; add a characterization test rather than special-case home code.
- Do not add challenges, diagnostic content, a custom angle watermark/theme, navigation redesign, persistence, SQL, provisional aliases, or U3/U4 edits.

#### Auto-enablement and practice flow

`FocusSelector` rebuilds `skillsByUnit` on every render and computes `available = activeSkillCount > 0` (`src/components/practice/FocusSelector.tsx:45-53,76-91,196-207`). Adding the skill to `UNIT_5_SKILLS` therefore changes the option from disabled `Unidad 5 — Próximamente` to enabled `Unidad 5`; no availability flag exists or is needed. `src/components/practice/__tests__/FocusSelector.test.tsx:75-147` guards the empty state, programmatic rejection, removal when skills disappear, and—most importantly—the exact “auto-reenables U5” populated fixture and selection callback.

Selection still depends on skill readiness. `readiness.ts:17-82` requires theory, examples, at least four exercises, covered feedback (or no in-scope tags), and evaluation. The six canonical interactions above satisfy the four-exercise floor. Once ready, `PILOT_SKILLS` also feeds `getAccessibleSkills`, so the U5 skill button becomes selectable.

The existing practice state machine already loads unit content, runs `evaluateAnswer`, generates feedback, stores the submitted string, and advances (`src/app/practice/usePracticeFlow.ts:191-218,257-331`). Reuse that flow. Add structured branches to `ExerciseAnswerInput` for: fixed-π numerator/denominator plus decimal inputs, and separate degree/minute/second numeric inputs with labels and bounds. Extend `exercise-answer-state.ts` for structured completeness/serialization and `submitted-answer-display.ts` for human-readable rows. `PreviousExerciseSnapshot` remains unchanged because it stores the canonical string. Real rendered-flow tests should prove selection → theory/example → structured entry → grading/feedback for π-rational and DMS, not merely inspect source text.

### Affected Areas

- `content/matematica/{theory,examples,feedback,exercises}/unit-5.json` — canonical U5-02 learning and practice packet.
- `src/domain/models/exercise.ts` — structured discriminator and two minimal answer specs.
- `src/domain/catalog/content-loaders.ts`, `src/domain/catalog/index.ts` — four-file registration, parsing, composition, and threshold.
- `src/domain/evaluator/` — canonical JSON codecs and exact π-rational/DMS evaluation.
- `src/domain/error-taxonomy/index.ts`, `src/domain/evaluator/error-tagging.ts` — minimal U5 misconceptions.
- `src/domain/models/skill-catalog.ts`, `src/domain/catalog/pilot-skills.ts` — one canonical root skill and live pilot map.
- `src/components/exercises/ExerciseAnswerInput.tsx`, `exercise-answer-state.ts`, `submitted-answer-display.ts` — accessible structured controls and display.
- `src/app/learn/matematica/page.tsx` — visible Unit 5 theory section.
- `src/components/practice/__tests__/FocusSelector.test.tsx` — existing auto-reenable proof; retain and supplement with real U5 flow coverage.

### Approaches

1. **Two minimal structured kinds (recommended)** — add normalized π-rational and DMS codecs/controls, while keeping scalar degree/radian values on the existing numerical path.
   - Pros: satisfies exact canonical forms, U5-00 architecture, no-free-text policy, and future evaluator compatibility without building later slices.
   - Cons: touches model, loader, evaluator, controls, and submitted display in one slice.
   - Effort: Medium

2. **Multiple-choice substitution** — render exact π/DMS answers as choices and avoid structured infrastructure.
   - Pros: smaller implementation.
   - Cons: does not let students enter the answers required by the objective, defers the explicitly assigned U5-02 π-rational contract, and weakens misconception feedback.
   - Effort: Low, but non-compliant

### Recommendation

Proceed with approach 1. Treat item 2 as numeric `1/5 rad` plus DMS—not as a π-rational—and define π-rational strictly as a reduced rational coefficient of π because items 1.a, 1.b, and 3 consume it. Split compound source rows into small traced app interactions while preserving every canonical subitem. Declare nearest-second behavior (recommended expected display `11º 27′ 33″`, comparison by total seconds with a small explicit tolerance) in the proposal/spec rather than inventing silent rounding.

#### Size forecast (800 significant-line single-PR budget)

| Work package | Forecast |
|---|---:|
| Domain schema, codecs, evaluator, focused TDD | 170–200 |
| Structured controls, serialization/display, component tests | 130–160 |
| Theory, three examples, feedback, 6–8 traced exercise interactions | 210–240 |
| Catalog/pilot/learn/taxonomy wiring and guard updates | 65–85 |
| Visible practice-flow, auto-enable, voice and regression tests | 100–125 |
| **Total** | **675–810** |

The budget risk is **medium** and the upper bound slightly exceeds 800. Keep one PR and reduce scope if implementation trends above 800: cap content at one theory node/4–5 concepts/three examples; keep only 6–8 canonical interactions; use exactly three U5 error tags; omit custom visuals/watermarks, challenges, diagnostics, generalized fraction syntax, signed DMS, and any later answer kind. Do not remove any of items 1.a–1.d, 2, or 3. If still over budget, simplify tests by using shared fixtures/helpers—not by replacing structured answers with multiple choice or chaining PRs.

### Risks

- **High:** U5-00's item-2 trace incorrectly calls `0.2 rad` a rational multiple of π; carrying that wording into the spec would create a mathematically invalid model.
- **Medium:** The source does not prescribe DMS seconds rounding. Acceptance must pin display and tolerance to avoid inconsistent grading.
- **Medium:** There are two independent exercise registration paths (`content-loaders.ts` and `catalog/index.ts`); wiring only one creates a theory-visible but practice-invisible skill.
- **Medium:** Readiness requires at least four exercises; over-grouping items 1–3 into three records leaves the live skill disabled even though content exists.
- **Low:** `MathWatermark` falls back to the sets theme for this new skill; a new angle theme is explicitly unnecessary for this slice.

### Ready for Proposal

Yes. The proposal should lock: (1) six required source interactions covering 1.a–1.d, 2, and 3; (2) `pi-rational` and `angle-dms` as the only new structured kinds; (3) item 2 as exact numeric `1/5 rad`, not π-rational; (4) explicit nearest-second/tolerance behavior; (5) automatic enablement derived solely from live skills/readiness; and (6) the 800-line scope caps above.
