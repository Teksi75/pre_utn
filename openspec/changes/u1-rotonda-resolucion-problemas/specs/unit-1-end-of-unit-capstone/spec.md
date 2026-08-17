# Delta for Unit 1 End-of-Unit Capstone

## ADDED Requirements

### Requirement: Genuine completion entry and non-blocking isolation

The system MUST show a prominent card only after the existing whole-Unit-1 completion signal; one skill or `Dominada` MUST NOT trigger it. It MUST open theory before the sequence. Unit 2, mastery, base practice, and challenges MUST remain independent of capstone progress.

#### Scenario: Incomplete or genuine Unit 1

- GIVEN Unit 1 is incomplete, WHEN its surface is viewed, THEN no capstone card appears.
- GIVEN whole-Unit-1 completion, WHEN the card opens, THEN theory precedes five stages and Unit 2 remains available.

#### Scenario: Repeated completion

- GIVEN capstone completion, WHEN it is reopened or repeated, THEN completion remains visible and mastery/practice results are unchanged.

### Requirement: Dedicated theory with deferred diagram

Theory MUST precede execution and cover the Cartesian plane, E/O/N/S to ±x/±y mapping, 2D distance/Pythagoras, units/modeling, radius/diameter, maximum constraints, exact/approximate values, and the five-stage method. Version one MUST omit diagrams but state `(0,0)`, `(70,30)`, the `30 m` road, `10 m` buffer, direction convention, units, formula, and ordered modeling steps in text.

#### Scenario: Textual model is sufficient

- GIVEN no diagram is rendered, WHEN theory is read, THEN every coordinate, direction, dimension, constraint, and formula needed is explicit and understandable.

### Requirement: Mathematical contract

It MUST use `0.07 km` (`0,07 km`) `= 70 m`; `D = √(70² + 30²) = 10√58 ≈ 76.16 m`; and maximum diameter `dmax = 2(D − 30 − 10) = 20√58 − 80 ≈ 72.32 m`. Exact equality MUST use `=`; rounded values MUST use repository notation (`\cong`, also `≈`), never `=`.

#### Scenario: Exact and approximate results

- GIVEN calculation feedback is shown, WHEN the result appears, THEN exact and rounded forms follow this contract and remain distinct.

### Requirement: Five-stage guided semantics

The system MUST expose exactly this order: **Comprender** identifies data, unknowns, units, and model; **Buscar un plan** selects the 2D-distance/Pythagoras strategy; **Llevarlo a cabo** owns `D`, `r = D − 30 − 10`, `d = 2r`; **Verificar** uses true/false/numerical checks for correctness, plausibility, units, and approximation, not merely the final recomputation; **Comunicar** selects the full contextual answer with unit, constraint, and approximation.

#### Scenario: Responsibilities remain distinct

- GIVEN theory is opened, WHEN the learner advances in order, THEN each stage keeps its responsibility and communication is not structured free text.

### Requirement: Supported controls and reveal discipline

Stages MUST use only single-select, true/false, and numerical controls; multi-select and free-text structured math MUST NOT be used. Numerical input MUST treat `72,32` and `72.32` equivalently within `0.01`. Before stage 3 submission, the final number, exact expression, and correct communication choice MUST remain undisclosed; feedback MAY reveal them after submission.

#### Scenario: Controls, decimals, and no leakage

- GIVEN stage 3 requests the diameter, WHEN `72,32` or `72.32` is entered, THEN both are equivalent and neither answer is disclosed before submission.

### Requirement: Per-student resumability and visible state

The system MUST track each student’s stage, show not-started/in-progress/current/completed state, and resume the last valid stage. Malformed or stale state MUST restart as incomplete; it MUST NOT unlock stages, claim completion, or alter mastery. The signal MUST orient learners and support later docente interpretation without tutor or teacher-panel claims.

#### Scenario: Resume and recover

- GIVEN a student left at `Verificar`, WHEN the student returns, THEN that stage is visible.
- GIVEN state is malformed or stale, WHEN the capstone opens, THEN it offers a safe incomplete restart without progress.

### Requirement: Ingenium, accessibility, and responsive presentation

Copy MUST present one Ingenium app; no source institution/faculty/program/location attribution or tutor/personalized-teaching claim. UI MUST be keyboard/screen-reader operable, label controls, announce stages politely, preserve focus/readable math, use at least `44px` controls, and avoid clipping on narrow screens.

#### Scenario: Branded accessible use

- GIVEN keyboard navigation or a narrow viewport, WHEN the sequence advances, THEN focus, announcements, labels, mathematics, and controls remain usable without prohibited copy.
