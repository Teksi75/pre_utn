# Challenge Exercises Specification

## Purpose

Defines the optional challenge mini-flow offered to students AFTER they complete
the standard practice exercises for a skill. Challenges provide harder, integrative
exercises that stretch understanding **without** affecting base completion,
accuracy, or mastery. The challenge module is structurally isolated from the base
practice flow so it can be added or removed without touching the base mastery
contract or `pre-utn.practice.v1`.

## Scope and Isolation Contract

The challenge module lives entirely in its own files:

| Concern | Own module | Forbidden import from |
|---------|------------|------------------------|
| Challenge content loader + query | `src/domain/catalog/challenges/` | `src/domain/catalog/index.ts` (math-exercise-catalog) |
| Challenge attempt persistence | `src/lib/advanced-practice-progress.ts` | `src/lib/practice-progress.ts` |
| Challenge UI | `src/components/practice/challenges/` | `src/app/practice/page.tsx` is the ONLY allowed consumer, and only as a visual extension at the `complete` phase |

Base modules MUST NOT import from any of the three challenge modules. The only
allowed coupling point is the visual render of `<ChallengeOptInBlock />` inside
the base `complete` phase.

---

## Content

### Requirement: Challenge File Location

The system MUST load challenge content from `content/matematica/challenges/unit-{N}.json`
(per-unit files mirroring the standard catalog layout). The challenges loader MUST
live in `src/domain/catalog/challenges/` and MUST NOT import from
`src/domain/catalog/index.ts`.

#### Scenario: challenges load from per-unit file

- GIVEN `content/matematica/challenges/unit-1.json` exists with valid challenge exercises
- WHEN `loadChallengesForSkill("mat.u1.complejos")` is called
- THEN only the challenges whose `skillId` matches are returned

#### Scenario: challenges loader is structurally isolated

- GIVEN the challenges loader module
- WHEN its imports are inspected
- THEN it does NOT import from `src/domain/catalog/index.ts` or `src/domain/catalog/content-loaders.ts`

### Requirement: Challenge Exercise Schema

A challenge exercise reuses the `Exercise` type with these mandatory markers:

- `challengeSection: true`
- `category: "desafio"`
- `tags: ["desafio", "integrador"]` (plus any other tags the author wants)

The challenges loader MUST filter by `challengeSection === true` so challenges can
never leak into `queryBySkill` results.

#### Scenario: standard query excludes challenges

- GIVEN an exercise with `challengeSection: true` in the standard catalog
- WHEN `queryBySkill(skillId)` is called
- THEN that exercise is NOT in the returned array

#### Scenario: challenge query returns only challenges

- GIVEN mixed standard and challenge exercises for a skill
- WHEN `queryChallengesBySkill(skillId)` is called
- THEN only exercises with `challengeSection: true` are returned, sorted by `difficulty` asc then `id` asc

### Requirement: Complete canonicalTrace

Every challenge exercise MUST include `canonicalTrace` with ALL four fields:

```json
{
  "path": "...",
  "section": "...",
  "sourceUse": "...",
  "pedagogicalIntent": "..."
}
```

`sourceUse` MUST be one of these controlled values:

| Value | When to use |
|-------|-------------|
| `canonical-source` | Challenge uses conceptual base from a unit. Register the **unit PDF** (`UNIDAD{N}_matemática.pdf`) in `path` + `section`. |
| `calibrated-from-exam` | Challenge calibrates difficulty or format with an exam PDF. Register the **exam PDF** (`TEMARIO_PARCIAL_INGRESO_UTN_MATEMATICA_TEMA_1.pdf` or `_TEMA_2.pdf`) in `path`. |
| `solution-pattern` | Challenge takes its resolution structure from a worked resolution. Register the **resolution PDF** (`RESOLUCIÓN DE EJERCICIOS SEMINARIO UNIVERSITARIO MATEMÁTICA.pdf`) in `path` + `section`. |
| `adapted` | A combination of the above; register the primary source and document the adaptation in `pedagogicalIntent`. |

The traceability audit MUST reject any challenge with missing `canonicalTrace`
fields, with an `unknown` `sourceUse`, or with a `path` that does not match the
declared `sourceUse` category. Standard exercises are unaffected.

#### Scenario: challenge with complete canonicalTrace passes

- GIVEN a challenge with `canonicalTrace: { path: "UNIDAD1_matemática.pdf", section: "3.2", sourceUse: "canonical-source", pedagogicalIntent: "..." }`
- WHEN the traceability audit runs
- THEN the challenge passes

#### Scenario: challenge with missing canonicalTrace field is rejected

- GIVEN a challenge with `canonicalTrace: { path: "UNIDAD1_matemática.pdf", section: "3.2" }` (no `sourceUse` or `pedagogicalIntent`)
- WHEN the traceability audit runs
- THEN the audit reports the challenge ID and the missing fields

#### Scenario: challenge with unknown sourceUse is rejected

- GIVEN a challenge with `sourceUse: "made-up-value"`
- WHEN the traceability audit runs
- THEN the audit reports the challenge ID and the invalid value

### Requirement: Pilot Skills

The pilot rollout MUST cover exactly these three skills:

| Skill | Unit | Justification |
|-------|------|---------------|
| `mat.u1.complejos` | U1 | Complex numbers — appears in exam Tema 1 and Tema 2. |
| `mat.u1.valor_absoluto` | U1 | Absolute value — case analysis + restrictions, appears strongly in exam. |
| `mat.u2.ecuaciones_fraccionarias` | U2 | Rational equations with domain exclusions — tests a different difficulty type. |

Coverage: at least 2 challenges per pilot skill. Pilot skills cover U1 and U2 and
allow testing different difficulty types (complex numbers, case analysis /
restrictions, rational equations and domain exclusions).

#### Scenario: pilot challenges exist for the three declared skills

- GIVEN the challenges catalog
- WHEN `queryChallengesBySkill(skillId)` is called for each pilot skill
- THEN each of `mat.u1.complejos`, `mat.u1.valor_absoluto`, and `mat.u2.ecuaciones_fraccionarias` returns at least 2 challenges

---

## Advanced Progress Store

### Requirement: Advanced Store Module

The challenge attempt store MUST live in its own module
`src/lib/advanced-practice-progress.ts` and MUST persist under a
**different localStorage key** from `pre-utn.practice.v1`
(recommended key: `pre-utn.advanced-practice.v1`).

The base `src/lib/practice-progress.ts` MUST NOT import from
`advanced-practice-progress.ts`, and vice versa. The two stores are peers that
do not know about each other.

#### Scenario: advanced store is keyed separately

- GIVEN a challenge attempt is recorded via `addChallengeAttempt`
- WHEN the localStorage keys are inspected
- THEN `pre-utn.practice.v1` is unchanged AND `pre-utn.advanced-practice.v1` contains the new attempt

#### Scenario: deleting the advanced store does not affect base progress

- GIVEN `pre-utn.advanced-practice.v1` exists
- WHEN `localStorage.removeItem("pre-utn.advanced-practice.v1")` is called and `loadProgress()` is invoked
- THEN the base progress from `pre-utn.practice.v1` is returned intact

### Requirement: Challenge Attempt API

`src/lib/advanced-practice-progress.ts` MUST expose:

- `addChallengeAttempt({ exerciseId, skillId, correct, errorTag, answeredAt, difficulty, timeMs, attemptIndex })` — persists a challenge attempt and recomputes the readiness score for that skill.
- `loadAdvancedProgress()` — returns the full `AdvancedPracticeProgress` (all skill readiness scores + raw attempts).

The function signatures MUST be similar to `addAttempt` / `loadProgress` but live
in the advanced module.

#### Scenario: challenge attempt is recorded

- GIVEN `addChallengeAttempt` is called with a valid payload
- WHEN the result is inspected
- THEN the attempt is appended to the advanced progress AND the readiness score for `skillId` is recomputed

---

## Advanced Readiness Metric

### Requirement: Per-Skill Numeric Readiness

The system MUST compute `readiness de examen` as a numeric score per skill
(stored in `advancedReadinessBySkill: Record<SkillId, number>` with values 0–100).

| Condition | State |
|-----------|-------|
| No challenge attempts for the skill | `advancedReadinessBySkill[skillId] = null` and the skill is `not-started` for advanced readiness. |
| ≥ 1 challenge attempt for the skill | A score in [0, 100] is computed from challenge accuracy for that skill. |

Score formula: `round(correctChallengeAttempts / totalChallengeAttempts * 100)`
after deduplicating by `exerciseId` keeping the latest attempt per challenge
(consistent with the base accuracy computation).

#### Scenario: no attempts → null score

- GIVEN a skill with zero challenge attempts
- WHEN `advancedReadinessBySkill[skillId]` is read
- THEN the value is `null`

#### Scenario: attempts exist → numeric score

- GIVEN a skill with 4 challenge attempts, 3 correct and 1 incorrect (after dedup)
- WHEN `advancedReadinessBySkill[skillId]` is read
- THEN the value is `75`

### Requirement: No Global or Blocking Effects

The advanced readiness metric MUST NOT:

- Calculate a global cross-skill readiness (no aggregation across skills).
- Be used to block navigation, complete skills, or modify base mastery.
- Be read by `computeMasteryLevel`, `computeAccuracy`, or any base progress helper.
- Be persisted into `pre-utn.practice.v1`.

The skill is considered completed after the standard exercises are done, NOT
after challenges. Challenges are never a completion condition.

#### Scenario: base mastery ignores challenge performance

- GIVEN a student with 5 standard attempts (all correct) and 0 challenge attempts
- AND the same student after 100 challenge attempts (all incorrect)
- WHEN `computeMasteryLevel(skillId, progress)` is called
- THEN both states return `"mastered"` (the base mastery is unchanged)

#### Scenario: challenge failures do not regress base mastery

- GIVEN a student with `"mastered"` base mastery
- WHEN the student gets every challenge attempt wrong
- THEN `computeMasteryLevel` still returns `"mastered"`

---

## UI Components

### Requirement: ChallengeOptInBlock

The challenge UI MUST live in `src/components/practice/challenges/` and be
encapsulated in `<ChallengeOptInBlock />` plus its child components
(`<ChallengeExerciseStep />`, `<ChallengeFeedbackStep />`, `<ChallengeDoneStep />`).

`<ChallengeOptInBlock />` is the only public surface mounted from the base flow
(at the `complete` phase). The child components are private to the challenge
module and MUST NOT be imported by the base flow code.

#### Scenario: opt-in block is mounted at complete phase

- GIVEN a student finishes the last standard exercise and reaches the `complete` phase
- AND the current skill has ≥ 1 challenge exercise
- WHEN the page renders the complete phase
- THEN `<ChallengeOptInBlock />` is visible alongside `PracticeCompletePhase`

#### Scenario: opt-in block is hidden when no challenges exist

- GIVEN a student finishes the last standard exercise and reaches the `complete` phase
- AND the current skill has zero challenge exercises
- WHEN the page renders the complete phase
- THEN `<ChallengeOptInBlock />` is NOT rendered (behavior is identical to today)

### Requirement: Neutral Copy

The opt-in card copy MUST be neutral with respect to the use context (the student
may be alone at 3am or may be after class expecting the teacher to review). The
copy MUST NOT promise personalization, MUST NOT claim to be a tutor, and MUST
NOT pretend to be the professor.

Acceptable patterns: "Si querés, hay desafíos disponibles. Son opcionales.",
"Podés intentar un desafío o volver al selector."

Forbidden patterns: "Te recomiendo los desafíos", "Tu profe digital te marca…",
"Plan personalizado para vos".

---

## Flow Extension

### Requirement: Visual Extension Point at complete Phase

The challenge flow is a **separate optional mini-flow** that the base practice
machine does NOT need to know about internally. The base `PracticePhase` union
remains `select | theory | example | exercise | feedback | recovery | complete`
(unchanged). The challenge flow is mounted as a **sibling visual section** at
the `complete` phase and manages its own internal state through its own hook
(e.g. `useChallengeFlow`).

The challenge flow is:

```
ChallengeOptInBlock
  → ChallengeExerciseStep → ChallengeFeedbackStep → ChallengeDoneStep
```

After the challenge done step, the user can return to the selector (same as the
base complete behavior). The challenge module is forbidden from mutating the
base `phase` state directly; it communicates back through a typed callback that
the base page wires up to `resetToSelect`.

#### Scenario: user accepts the challenge

- GIVEN the complete phase is rendered with `<ChallengeOptInBlock />`
- WHEN the user clicks "Hacer un desafío"
- THEN the opt-in block transitions to `<ChallengeExerciseStep />` with the first challenge for the skill

#### Scenario: user skips the challenge

- GIVEN the complete phase is rendered with `<ChallengeOptInBlock />`
- WHEN the user clicks "Volver al selector"
- THEN `resetToSelect()` is called and the base flow returns to the selector (no change vs. today)

#### Scenario: base phase machine is unchanged

- GIVEN the base `PracticePhase` union
- WHEN inspected
- THEN it does NOT include a `"challenges"` member (the challenge flow is a sibling, not a base phase)

### Requirement: Skill Completion

A skill MUST be considered "completed" after the student finishes the standard
exercises, regardless of whether the student attempts any challenges. The
challenge module MUST NOT call into `computeMasteryLevel` or modify
`accuracyBySkill` / `trendBySkill` in `pre-utn.practice.v1`.

#### Scenario: skill completion is driven by standard exercises only

- GIVEN a student finishes the standard exercises
- WHEN the next-step / home-roadmap logic reads the skill state
- THEN the skill is reported as completed/practicing/mastered based on standard attempts only

### Requirement: .engram/ Disclaimer

`.engram/` MUST NOT participate in the challenge attempt flow nor in any other
student-progress flow. `.engram/` is reserved for agent operational memory, SDD
decisions, assumptions, risks, and implementation technical debt.

The exact disclaimer that MUST be honored:

```
.engram/ no participa del flujo de intentos de desafío ni de ningún otro flujo de progreso del alumno.
```

#### Scenario: challenge attempts do not touch engram

- GIVEN `addChallengeAttempt` is called
- WHEN the persistence layer is inspected
- THEN no read or write to `.engram/` happens

---

## Rollback Guarantees

### Requirement: Delete-Only Rollback

Deleting the following MUST restore the project to a state where
`pre-utn.practice.v1` is intact, standard exercises and base mastery still work,
and the challenge module leaves no trace:

1. `src/domain/catalog/challenges/` (loader, query, types)
2. `src/lib/advanced-practice-progress.ts` (advanced store)
3. `src/components/practice/challenges/` (UI components)
4. The single render call to `<ChallengeOptInBlock />` inside
   `src/app/practice/page.tsx` `complete` phase
5. The `content/matematica/challenges/` directory

After deletion, all existing practice tests MUST still pass.

#### Scenario: full rollback preserves base progress

- GIVEN the challenge module is deleted AND `pre-utn.practice.v1` contains a populated `PracticeProgress`
- WHEN `loadProgress()` is called
- THEN it returns the populated progress unchanged

#### Scenario: full rollback does not break existing practice tests

- GIVEN the challenge module is deleted
- WHEN the existing test suite runs
- THEN all practice-flow, progress, and catalog tests pass
