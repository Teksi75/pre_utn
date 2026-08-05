# Angle and Arc Measurement Specification

## Purpose

Canonical Unit 5 learning and practice journey covering sexagesimal ↔ radian conversion, the radian definition, arc length, and elapsed-time fraction of a revolution. The skill `mat.u5.medicion_angulos_y_arcos` is the first live Unit 5 root; it is normative (no prerequisites), sourced from `mat.u5.theory` pp. 7–9 and `mat.u5.practice` p. 3, and obeys the no-free-text design rule by accepting exact rational multiples of π or bounded DMS via dedicated structured controls.

## Requirements

### Requirement: First Live Unit 5 Skill Appears in Learn and Practice

The catalog MUST register exactly one root skill `mat.u5.medicion_angulos_y_arcos` in `UNIT_5_SKILLS`. The skill MUST appear on `/learn/matematica` as a section card AND in the practice selector's Unit 5 listbox once readiness passes. The skill MUST NOT declare a `SKILL_DEPENDENCIES` entry because it is the normative root.

#### Scenario: Unit 5 section card renders on learn page

- GIVEN the loaded catalog contains `mat.u5.medicion_angulos_y_arcos`
- WHEN `/learn/matematica` renders
- THEN one Unit 5 section card is present with the skill's Spanish label
- AND the card links to `/learn/matematica/mat.u5.medicion_angulos_y_arcos`

#### Scenario: practice selector exposes the Unit 5 skill

- GIVEN the practice selector renders with `UNIT_5_SKILLS` non-empty
- WHEN the student selects `Unidad 5`
- THEN the Unit 5 skill listbox is shown and contains `mat.u5.medicion_angulos_y_arcos`

### Requirement: Single Theory Node With Required Concepts

The skill MUST ship exactly one theory node whose `concepts` array contains 4–5 entries covering, at minimum: (a) sexagesimal system and DMS bounds (`0° ≤ α < 360°` canonical, with explicit 0 ≤ minutes < 60 and 0 ≤ seconds < 60 bounds); (b) `180° = π rad` and the equivalence in both directions; (c) decimal degrees ↔ DMS conversion with a declared nearest-second rounding policy; (d) radian definition (arc length equals radius); (e) `α = s / r` and `s = α · r`; elapsed-time fraction of one revolution (`α = (Δt / T) · 2π`). The `canonicalTrace.path` for every concept MUST cite `mat.u5.theory` pp. 7–9.

#### Scenario: theory node declares all five concept families

- GIVEN the U5 theory JSON
- WHEN the `concepts` array is enumerated
- THEN at least one concept matches each of: DMS bounds, `180°=π rad`, decimal↔DMS, radian + arc formula, elapsed-time fraction
- AND every concept's `canonicalTrace.path` includes `mat.u5.theory` with `pages: [7, 8, 9]`

#### Scenario: theory node stays single and bounded

- WHEN the U5 theory JSON is loaded
- THEN `theoryNodes.length === 1` for the skill
- AND `concepts.length` is between 4 and 5 inclusive

### Requirement: Three Worked Examples

The skill MUST ship exactly three worked examples: (E1) degree/radian table conversion (covers items 1.a–1.d), (E2) `6/30 rad` to DMS via `α = s/r` (covers item 2), (E3) 20-minute arc on a 12 cm minute hand (covers item 3). Each example's `canonicalTrace.path` MUST cite `mat.u5.theory` pp. 7–9 or `mat.u5.practice` p. 3.

#### Scenario: example E1 resolves table conversion

- GIVEN example E1 with prompt referencing the table rows `α1=36°`, `α2=225°`, `α3=3π/4`, `α4=2.3456`
- WHEN its `workedSteps` and `finalAnswer` are rendered
- THEN the table cells `1.0/4=π/5`, `5/4=5π/4`, `135°`, and `134.392980…°` are present
- AND `canonicalTrace.path` includes `mat.u5.practice` with `page: 3`

#### Scenario: example E2 resolves 6/30 rad to DMS

- GIVEN example E2 for `α = s/r = 6/30 = 1/5 rad`
- WHEN its `finalAnswer` is rendered
- THEN it MUST display the radian measure `1/5 rad` (or `0.2 rad`) AND the DMS equivalent `11° 27′ 33″` (nearest second)

#### Scenario: example E3 resolves the 20-minute arc

- GIVEN example E3 for `s = (20/60) · 2π · 12 = 8π cm`
- WHEN its `finalAnswer` is rendered
- THEN the answer MUST equal `8π cm` and the numeric equivalent `25.132741… cm`

### Requirement: Seven Traced Practice Interactions Cover Six Source Items

The catalog MUST register exactly seven `exercises` entries for this skill, mapped 1:1 to the six canonical source items:

| Source item | Exercise id | Type / kind | Expected answer |
|---|---|---|---|
| 1.a (36° → π/5 rad) | `ex.u5.medicion_angulos_y_arcos.1a` | `structured` / `pi-rational` | numerator 1, denominator 5, decimal 0.6283, tolerance 0.0001 |
| 1.b (225° → 5π/4 rad) | `ex.u5.medicion_angulos_y_arcos.1b` | `structured` / `pi-rational` | numerator 5, denominator 4, decimal 3.9269, tolerance 0.0001 |
| 1.c (3π/4 → 135°) | `ex.u5.medicion_angulos_y_arcos.1c` | `numerical` | 135 |
| 1.d (2.3456 rad → 134.392980…°) | `ex.u5.medicion_angulos_y_arcos.1d` | `numerical` | 134.392980 (tolerance 0.01) |
| 2 rad (α = 1/5 rad) | `ex.u5.medicion_angulos_y_arcos.2r` | `numerical` | 0.2 |
| 2 DMS (11° 27′ 33″) | `ex.u5.medicion_angulos_y_arcos.2d` | `structured` / `angle-dms` | degrees 11, minutes 27, seconds 33, tolerance 0.5 |
| 3 (s = 8π cm) | `ex.u5.medicion_angulos_y_arcos.3` | `structured` / `pi-rational` | numerator 8, denominator 1, decimal 25.1327, tolerance 0.001 |

Every entry MUST carry a `canonicalTrace` whose `path` cites `mat.u5.practice` with the corresponding item id (`1.a`, `1.b`, `1.c`, `1.d`, `2`, `3`) and `mat.u5.theory` pp. 7–9. Subitems 1.a–1.d MUST each retain their own `canonicalTrace` (no grouping that loses traceability).

#### Scenario: each interaction declares its canonical trace

- GIVEN the loaded U5 catalog
- WHEN each of the seven exercise ids is fetched
- THEN it carries a `canonicalTrace` entry whose `path` includes `mat.u5.practice` and the matching item id
- AND every entry's `canonicalTrace` for theory citations lists `mat.u5.theory` pp. 7–9

#### Scenario: subitems 1.a–1.d are individually traced

- GIVEN exercises `.1a`, `.1b`, `.1c`, `.1d`
- WHEN their `canonicalTrace` arrays are compared
- THEN each references a distinct item id (`1.a`, `1.b`, `1.c`, `1.d`) — no shared trace across the four

#### Scenario: exercise 2d uses angle-dms kind with 11°27′33″

- GIVEN `ex.u5.medicion_angulos_y_arcos.2d`
- WHEN its `answerSpec` is read
- THEN `answerSpec.kind === "angle-dms"`
- AND `expected.degrees === 11` AND `expected.minutes === 27` AND `expected.seconds === 33` AND `tolerance === 0.5`

### Requirement: Three Declared Unit 5 Feedback Tags

The taxonomy MUST define exactly three Unit 5 tags: `u5_degree_radian_factor`, `u5_dms_conversion`, and `u5_arc_time_fraction`. Each tag MUST be referenced only by exercises that declare it in `commonErrorTags`. Tag mappings MUST target the nearest concept in the U5 theory node and MUST NOT expose the final answer.

| Tag | Triggers on | Recovery target |
|---|---|---|
| `u5_degree_radian_factor` | inverted `180°/π` factor in items 1.a/1.b | concept "`180° = π rad`" |
| `u5_dms_conversion` | carry/bounds errors or skipped rounding in 2d | concept "decimal↔DMS rounding" |
| `u5_arc_time_fraction` | wrong fraction of revolution in 3 or 2 | concept "elapsed-time fraction" |

#### Scenario: only declared tags fire

- GIVEN a U5 exercise that does NOT declare `u5_dms_conversion` in `commonErrorTags`
- WHEN the student commits a DMS carry error
- THEN the result is incorrect with NO error tag

#### Scenario: feedback names the misconception, not the answer

- GIVEN any incorrect U5 result carrying `u5_dms_conversion`
- WHEN feedback is produced
- THEN it names the carry/bounds category
- AND it MUST NOT include the literal `11° 27′ 33″`

### Requirement: Auto-Enablement Derives Solely From Live Skills and Readiness

Unit 5 MUST become selectable in the practice selector without any availability flag. Enablement depends on: (a) `UNIT_5_SKILLS.length > 0`, AND (b) `readiness(unitKey)` returning true, which requires theory present, at least three worked examples, at least four implemented exercises, at least one declared feedback mapping per in-scope tag, and an evaluation path covering all exercises.

#### Scenario: selector transitions from Próximamente to enabled

- GIVEN `UNIT_5_SKILLS === []`
- WHEN the practice selector renders
- THEN Unit 5 is visible as `Unidad 5 — Próximamente` with `aria-disabled="true"`
- AND when `UNIT_5_SKILLS` later contains `mat.u5.medicion_angulos_y_arcos` and readiness passes
- THEN the same selector renders `Unidad 5` as enabled and selectable

#### Scenario: readiness fails when fewer than four exercises are implemented

- GIVEN the skill has three or fewer implemented exercises
- WHEN readiness is computed
- THEN readiness returns false
- AND the practice selector keeps Unit 5 disabled even though `UNIT_5_SKILLS` is non-empty

#### Scenario: no availability flag exists

- WHEN the source is searched for any U5-specific availability flag
- THEN no such flag exists — enablement is fully derived

### Requirement: Brand Voice and No Free Text

All U5 student-facing copy (theory prompts, example prose, exercise prompts, feedback messages) MUST obey the project brand voice: no personification of the app as a tutor, no claims of personalization beyond what error-tagged feedback provides, and no claim that the app replaces the in-person class. No exercise MUST accept a mathematical expression as free text; DMS answers use separate degree/minute/second controls, π-rational answers use separate numerator/denominator plus decimal controls, and scalar items use a single numerical input.

#### Scenario: no profe-digital copy in U5 content

- GIVEN all four U5 content files
- WHEN scanned for the brand-voice acceptance test
- THEN none contain phrases that personify the app as a tutor
- AND no exercise prompt asks the student to type an expression in plain text

### Requirement: Unit 5 Section Card and Selector Wiring

The learn page MUST include `unit-5` in both `UNIT_LABELS` and `UNIT_KEYS`; `PILOT_SKILLS` MUST contain an entry for `mat.u5.medicion_angulos_y_arcos` with `unitKey: "unit-5"` and a Spanish label. `PILOT_SKILL_UNIT_MAP` and `PRACTICE_SKILL_UNIT_MAP` MUST therefore expose the skill automatically (no manual additions).

#### Scenario: PILOT_SKILLS exposes the skill

- GIVEN the loaded pilot-skills map
- WHEN enumerated
- THEN it contains `mat.u5.medicion_angulos_y_arcos` with `unitKey === "unit-5"`
- AND a non-empty Spanish `label`

#### Scenario: learn page exposes Unit 5 section card

- GIVEN the loaded `UNIT_LABELS` and `UNIT_KEYS`
- WHEN `/learn/matematica` renders
- THEN a Unit 5 section card is present with the localized label and a topic count equal to the theory node's `concepts.length`

### Requirement: Dual Registration of Unit 5 Content

The four U5 JSON files (theory, examples, feedback, exercises) MUST be registered in BOTH `src/domain/catalog/content-loaders.ts` AND `src/domain/catalog/index.ts`. Wiring only one path leaves the skill theory-visible but practice-invisible (or vice versa) and MUST be guarded by an automated test that loads the catalog through both paths and asserts the same skill and exercise counts.

#### Scenario: both paths register Unit 5

- GIVEN `content/matematica/{theory,examples,feedback,exercises}/unit-5.json` exists
- WHEN the catalog is loaded via `content-loaders.ts`
- THEN theory, examples, feedback, and exercises for `mat.u5.medicion_angulos_y_arcos` are present
- WHEN the catalog is loaded via `catalog/index.ts`
- THEN the same skill and same seven exercises are queryable by skill

### Requirement: Unit Threshold Tracks Implemented Exercise Count

`UNIT_THRESHOLDS["unit-5"]` MUST equal the number of implemented U5 exercises (seven) once this change lands. The threshold MUST NOT remain at `0` because the empty-catalog contract no longer applies.

#### Scenario: unit-5 threshold equals seven

- GIVEN the loaded threshold map after this change
- WHEN `UNIT_THRESHOLDS["unit-5"]` is read
- THEN it MUST equal `7`

### Requirement: Item 2 Is Exact Numeric, Not a Pi Multiple

The exercise for item 2's radian part (`ex.u5.medicion_angulos_y_arcos.2r`) MUST be typed `numerical` with expected `0.2`. It MUST NOT be modeled as `structured` / `pi-rational` because `1/5 rad` is not a rational multiple of π. The π-rational encoding remains consumed by items 1.a, 1.b, and 3 only. This supersedes U5-00 wording that labeled item 2 a rational multiple of π.

#### Scenario: 2r stays numerical with expected 0.2

- GIVEN `ex.u5.medicion_angulos_y_arcos.2r`
- WHEN its type and expected answer are read
- THEN `type === "numerical"` AND `expectedAnswer === 0.2`
- AND `answerSpec` is absent (not structured)

### Requirement: Nearest-Second DMS Behavior Is Pinned

The DMS exercise for item 2 MUST declare an explicit nearest-second policy: the expected display string is `11° 27′ 33″`, and grading compares total arc-seconds with tolerance `0.5` seconds. The decimal degrees equivalent `134.392980…°` (item 1.d) is graded on the existing numerical path with the standard numerical tolerance (0.01 absolute). Per-exercise tolerance metadata is a future enhancement tracked as a follow-up; see `evaluator-numeric-u5-scalar.test.ts` for the explicit pinning of current behavior.

#### Scenario: 11° 27′ 32.7″ is within tolerance

- GIVEN `ex.u5.medicion_angulos_y_arcos.2d` with tolerance `0.5`
- WHEN the student submits `degrees: 11, minutes: 27, seconds: 32.7`
- THEN the total arc-seconds difference is `0.3`
- AND evaluation is correct

#### Scenario: 11° 27′ 32″ is outside tolerance

- GIVEN the same exercise
- WHEN the student submits seconds `32`
- THEN the difference is `1.0` arc-second
- AND evaluation is incorrect (with `u5_dms_conversion` if declared)

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | First Unit 5 visible journey; structured controls remove free-text ambiguity for π and DMS answers. |
| Docente | Indirect: clearer misconception signals via the three declared `u5_*` tags. |

## Out of Scope

U5-03+, U3/U4 edits, navigation/home copy, signed DMS, generalized fraction or expression parsers, custom angle watermarks/themes, diagnostic content, challenges, SQL/migrations, persistence behavior, retired-ID aliases.