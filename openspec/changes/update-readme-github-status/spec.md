# Delta Spec: README reflects current project state

Documentation-only. No code, no spec-level behavior is introduced or
modified. Each Requirement below describes what `README.md` MUST say
after this change; its Scenarios are the PR review acceptance criteria.

**Out of scope:** CI badges, U3+ content, code changes, detailed change
history in README. README stays a postal — `STATUS.json` carries detail.

## ADDED Requirements

### Requirement: Estado real del MVP reflects U1 and U2 complete

"Estado real del MVP" MUST describe U1 (8 skills) and U2 (7 skills) as
completed and transitables. "En construcción" MUST NOT reference U1 or U2.

#### Scenario: U1 listed as complete with 8 skills

- GIVEN a reader opens `README.md`
- WHEN they read "Estado real del MVP"
- THEN U1 is complete
- AND a table lists 8 U1 skills (Conjuntos, Propiedades Operaciones,
  Intervalos, Potencias y raíces, Racionalización, Valor absoluto,
  Logaritmos, Complejos) all "Listo"

#### Scenario: U2 listed as complete with 7 skills

- GIVEN a reader opens `README.md`
- WHEN they read "Estado real del MVP"
- THEN U2 is complete
- AND a table lists 7 U2 skills (polinomios_basico, operaciones_polinomios,
  ruffini_resto, factorizacion, gauss, mcm_mcd_polinomios,
  ecuaciones_fraccionarias) all "Listo"

#### Scenario: no stale "en construcción" for U1/U2

- GIVEN a reviewer greps `README.md`
- WHEN searching for "en construcción"
- THEN it does not reference U1 or U2

### Requirement: Camino actual de Unidad 2 present

README MUST include "Camino actual de Unidad 2" with a 7-row table in
pedagogical order, all "Listo". Column shape MUST match "Camino actual
de Unidad 1".

#### Scenario: U2 path table in order

- GIVEN a reader opens `README.md`
- WHEN they look for the U2 path
- THEN they find "Camino actual de Unidad 2"
- AND the table rows are polinomios_basico → operaciones_polinomios →
  ruffini_resto → factorizacion → gauss → mcm_mcd_polinomios →
  ecuaciones_fraccionarias
- AND every row shows "Listo"

### Requirement: Camino actual de Unidad 1 consistent with MVP table

"Camino actual de Unidad 1" MUST list 8 U1 skills in pedagogical order,
all "Listo". The U1 skills table in "Estado real del MVP" and the U1
path table MUST be row-consistent (no drift — Complejos in both).

#### Scenario: U1 path has 8 rows including Complejos

- GIVEN a reader opens `README.md`
- WHEN they read "Camino actual de Unidad 1"
- THEN the table has 8 rows
- AND Complejos appears as a "Listo" row

### Requirement: Fuente de verdad references STATUS.json

"Fuente de verdad" MUST list `openspec/changes/STATUS.json` as the
portable state source for SDD changes (multi-PC sync).

#### Scenario: STATUS.json row present

- GIVEN a reader opens `README.md`
- WHEN they read "Fuente de verdad"
- THEN a row explicitly mentions `openspec/changes/STATUS.json` as the
  portable state source for SDD changes

### Requirement: Recent changes note

README MUST include a short note (≤5 lines) referencing three recent
non-curriculum changes merged to main: student identity (local
persistence + switcher), visual redesign sprint v4, catalog readiness UI.

#### Scenario: recent-changes note visible

- GIVEN a reader scans `README.md` past the MVP status
- WHEN they look for recent activity
- THEN they find a brief mention of student identity, redesign v4, and
  catalog readiness UI

### Requirement: README stays a postal (size budget)

After the change, `README.md` MUST stay under 150 lines and the diff
MUST be under 150 changed lines. Detail belongs in `STATUS.json` and
specs, not the README.

#### Scenario: line budget respected

- GIVEN `README.md` after the change
- WHEN `wc -l README.md` runs
- THEN the count is ≤ 150
- AND `git diff --stat` shows ≤ 150 changed lines for `README.md`
