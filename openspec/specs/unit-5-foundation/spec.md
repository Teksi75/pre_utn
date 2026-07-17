# Unit 5 Foundation Specification

## Purpose

Establish the post-retirement contract for Unit 5. The catalog is intentionally empty until later work adds live skills; no provisional skills or exercises remain in active repository surfaces, and no persistence behavior is introduced.

## Requirements

### Requirement: Unit 5 Catalog State

The system MUST permit Unit 5 to contain at least one active skill. After U5-02 lands, `UNIT_5_SKILLS` MUST contain exactly `mat.u5.medicion_angulos_y_arcos` as its first live root skill, and `UNIT_THRESHOLDS["unit-5"]` MUST equal the number of implemented U5 exercises (seven) for this slice. The static retirement rules remain in force for the eleven retired provisional IDs (`mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar`, `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1`) using exact string equality.

#### Scenario: Unit 5 has one live root skill

- GIVEN the loaded skill catalog after U5-02
- WHEN `UNIT_5_SKILLS` is enumerated
- THEN it MUST contain exactly `[ "mat.u5.medicion_angulos_y_arcos" ]`

#### Scenario: unit-5 threshold equals the implemented exercise count

- GIVEN seven implemented U5 exercises
- WHEN `UNIT_THRESHOLDS["unit-5"]` is read
- THEN it MUST equal `7`

#### Scenario: retired IDs remain retired

- WHEN the source is searched for the eleven retired IDs
- THEN none appear as live skills or live exercises
- AND they MAY appear in archive allowlists or test fixtures only

#### Scenario: Unit 5 loads with zero threshold

- GIVEN the catalog after retirement
- WHEN Unit 5 is queried
- THEN it is intentionally empty without a threshold failure

> (Previously: `UNIT_5_SKILLS` was the empty array and `UNIT_THRESHOLDS["unit-5"]` was `0`.)

### Requirement: Unit Availability Is Derived From Live Skills

The practice selector MUST derive a unit's availability from its current live skill count. A zero-skill unit MUST remain visible as a native disabled option labelled `Unidad N — Próximamente`, with `aria-disabled="true"` and muted unavailable styling. A populated unit MUST be selectable.

The selector MUST defensively clear an unavailable value received by its change handler. It MUST derive its rendered selection from the current catalog so that a selected unit which becomes empty renders no skill listbox, and becomes usable again after live skills return. This behavior MUST NOT add a unit URL, stored unit selection, persistence behavior, or banner contract.

---

## Unit 5 Live Skills (from u5-02-medicion-angulos-y-arcos)

### Requirement: Unit 5 First Live Root Skill Has No Skill Dependencies

`mat.u5.medicion_angulos_y_arcos` MUST be declared as the normative root of Unit 5. It MUST NOT appear in `SKILL_DEPENDENCIES` (neither as a key nor as a value). `ALL_SKILLS` and `KNOWN_SKILL_IDS` MUST derive automatically from the registered `UNIT_5_SKILLS` entry; no manual extension of those derived sets is required.

#### Scenario: no SKILL_DEPENDENCIES entry for the root skill

- GIVEN the loaded `SKILL_DEPENDENCIES` map
- WHEN it is queried for `mat.u5.medicion_angulos_y_arcos`
- THEN it returns `undefined` (no key, no value)

#### Scenario: ALL_SKILLS includes the new root

- GIVEN the loaded skill catalog
- WHEN `ALL_SKILLS` is enumerated
- THEN it contains `mat.u5.medicion_angulos_y_arcos`

### Requirement: Dual Registration of Unit 5 Content

The four U5 content JSON files (`content/matematica/{theory,examples,feedback,exercises}/unit-5.json`) MUST be registered in BOTH `src/domain/catalog/content-loaders.ts` AND `src/domain/catalog/index.ts`. The first path makes theory/examples/feedback visible to `queryBySkill`, readiness, and the learn page; the second path makes exercises queryable to the practice flow. Wiring only one path leaves the skill in an inconsistent state and MUST be guarded by an automated test that loads both paths and asserts equal skill + exercise counts.

#### Scenario: both paths see Unit 5

- GIVEN the four U5 content JSON files exist
- WHEN the catalog is loaded via `content-loaders.ts`
- THEN `mat.u5.medicion_angulos_y_arcos` is queryable with theory, examples, feedback, and seven exercises
- WHEN the catalog is loaded via `catalog/index.ts`
- THEN `queryBySkill("mat.u5.medicion_angulos_y_arcos")` returns the same seven exercises

#### Scenario: missing dual registration fails the guard test

- GIVEN only `content-loaders.ts` registers `unit-5.json` (catalog/index.ts does not)
- WHEN the dual-registration guard runs
- THEN the test fails with a message naming the missing registration path

### Requirement: Pilot Skills and Learn Page Wiring for Unit 5

`PILOT_SKILLS` MUST contain an entry for `mat.u5.medicion_angulos_y_arcos` with `unitKey: "unit-5"` and a Spanish label. `UNIT_LABELS` and `UNIT_KEYS` (used by `/learn/matematica`) MUST include `unit-5`. `PILOT_SKILL_UNIT_MAP` and `PRACTICE_SKILL_UNIT_MAP` derive automatically and MUST expose the new skill without manual extension. Existing count and order guards in `pilot-skills.test.ts` MUST be updated to reflect the new total.

#### Scenario: PILOT_SKILLS exposes the new skill

- GIVEN the loaded pilot-skills table
- WHEN the entry for `mat.u5.medicion_angulos_y_arcos` is read
- THEN `unitKey === "unit-5"` AND `label` is a non-empty Spanish string

#### Scenario: learn page exposes a Unit 5 section card

- GIVEN `UNIT_LABELS["unit-5"]` and `UNIT_KEYS` include `unit-5`
- WHEN `/learn/matematica` renders
- THEN a Unit 5 section card is present
- AND the dynamic learn route resolves through `PILOT_SKILL_UNIT_MAP` without a route change

### Requirement: Item 2 Correction — Numeric Radian, Not a Pi Multiple

Item 2 of `mat.u5.practice` MUST be modeled as `α = s / r = 6 / 30 = 1 / 5 rad = 0.2 rad` (numerical) for the radian portion, NOT as a rational multiple of π. The DMS portion is modeled separately as `structured` / `angle-dms` with expected `11° 27′ 33″`. The π-rational encoding is consumed only by items 1.a, 1.b, and 3 in this slice. This correction supersedes U5-00 wording that labeled item 2 a rational multiple of π.

#### Scenario: 2r is numerical with expected 0.2

- GIVEN `ex.u5.medicion_angulos_y_arcos.2r`
- WHEN its type and expected answer are read
- THEN `type === "numerical"` AND `expectedAnswer === 0.2`
- AND `answerSpec` is absent (not structured)

#### Scenario: 2d is angle-dms with expected 11° 27′ 33″

- GIVEN `ex.u5.medicion_angulos_y_arcos.2d`
- WHEN its `answerSpec` is read
- THEN `kind === "angle-dms"` AND expected equals `{degrees: 11, minutes: 27, seconds: 33}` with `tolerance: 0.5`

### Requirement: No Persistence or Migration Surface for U5-02

U5-02 MUST NOT introduce a migration, sidecar, marker, SQL artifact, remote schema change, write gate, blocking behavior, adapter change, or stored-data transform. The U5-01 local + remote markers remain in their `retired-v1` state; this change is purely additive on top of the empty post-retirement catalog state.

#### Scenario: no new persistence artifacts introduced

- WHEN the change is reviewed for persistence footprint
- THEN no new storage keys, columns, or migrations are added
- AND the existing U5-01 marker logic is untouched

#### Scenario: Unit 5 is visibly unavailable while empty

- GIVEN `UNIT_5_SKILLS` has zero entries
- WHEN the practice selector renders
- THEN Unit 5 is visible as `Unidad 5 — Próximamente`
- AND its option is disabled and `aria-disabled="true"`
- AND no Unit 5 skill listbox is rendered

#### Scenario: live catalog changes preserve a non-empty listbox invariant

- GIVEN a populated unit is selected
- WHEN its live skill list becomes empty and the selector rerenders
- THEN the selector renders no selected unit and no skill listbox
- WHEN live skills return and the selector rerenders
- THEN that unit is enabled and selectable again

### Requirement: No Persistence or Migration Surface

The system MUST NOT introduce a migration, sidecar, marker, SQL artifact, remote schema change, write gate, blocking behavior, adapter change, or stored-data transform for this retirement.

### Requirement: Synthetic Diagnostic Fixtures Are Retained

Synthetic diagnostic fixtures `mat.u5.trigonometria_basica`, `ex.u5.bad.1`, and `ex.u5.good.1` remain test-only and MUST NOT be promoted to live catalog entries.

### Requirement: Scope Boundaries Preserved

U3, U4, U5-03+, canonical U5 content beyond what U5-02 adds, SQL, and persistence remain outside this change. Migration, sidecar, marker, SQL artifact, remote schema change, write gate, blocking behavior, adapter change, and stored-data transform for Unit 5 remain out of scope.

> (Previously: the exclusion list included U5-02 because U5-02 was future work at the time of U5-01; U5-02 is the present change and is therefore IN scope.)
