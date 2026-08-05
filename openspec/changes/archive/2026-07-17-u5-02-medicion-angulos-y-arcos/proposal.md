# Proposal: Unit 5 Angle and Arc Measurement

## Why / Intent

Add the first visible Unit 5 journey so students can study, practise, and correct angle/arc measurement between classes. It is supporting material—not a tutor—and fulfills the pedagogical criterion through learn, practice, and feedback.

## What Changes / Scope

- Add `mat.u5.medicion_angulos_y_arcos`, one theory node (4–5 concepts), three examples (degree/radian, `6/30` rad to DMS, 20-minute arc), feedback, and seven traced interactions from six source records: 1.a–1.d, 2 radians, 2 DMS, and 3. Traces cite `mat.u5.theory` pp. 7–9 and `mat.u5.practice` p. 3; every canonical subitem retains its own `canonicalTrace`.
- Add exactly two structured kinds: `pi-rational` (reduced rational coefficient of π plus required decimal/tolerance) and `angle-dms` (bounded D/M/S). Canonical versioned JSON, pure deterministic evaluation, accessible separate controls, and read-only submitted display reuse the current string flow.
- Correct U5-00: item 2 is exact `1/5 rad` (`0.2`), **not** a rational multiple of π. Display its DMS as nearest-second `11º 27′ 33″`; compare total arc-seconds with ±0.5-second tolerance.
- Add exactly `u5_degree_radian_factor`, `u5_dms_conversion`, and `u5_arc_time_fraction` feedback tags.
- Enable Unit 5 only through live `UNIT_5_SKILLS` plus readiness: theory, examples, covered feedback, evaluation, and at least four exercises. No flags.

## Capabilities

### New Capabilities
- `angle-arc-measurement`: canonical Unit 5 learning and practice journey.

### Modified Capabilities
- `unit-5-foundation`: replace empty U5 catalog state with its first live root skill.
- `math-exercise-model`: validate `structured` exercises and their two answer specs.
- `math-answer-evaluator`: dispatch, normalize, and grade the two structured forms.

## Impact / Approach

Update U5 content JSON, catalog/loaders/skill maps, evaluator and taxonomy, answer controls/state/display, and the Mathematics learn page. Follow ADR-005 dispatcher and ADR-006 canonical-material rules. Visible-flow tests MUST prove Unit 5 enables, theory/examples appear, π-rational and DMS inputs grade with feedback, and scalar 1.c/1.d remain numerical.

## Non-goals / Scope Boundary

No other U5 content, U5-03+, U3/U4, migrations/SQL, retired-ID aliases, navigation/home copy, PDF versioning, mandatory mate-explorer, visuals/watermarks, challenges, diagnostics, generalized fractions/parsers, signed DMS, or later answer kinds.

## Budget and Risks

| Work package | Cap |
|---|---:|
| Domain/evaluator TDD | 200 |
| Controls/display tests | 160 |
| Content (one node, 3 examples, 7 interactions) | 240 |
| Catalog/taxonomy wiring | 85 |
| Flow/regression tests | 115 |
| **Total** | **800** |

Risks: **High** invalid π modeling for item 2—pin correction; **Medium** rounding ambiguity—pin ±0.5 seconds; **Medium** dual registration/readiness failure—test the real visible flow. Reduce duplication/helpers if over budget; never chain or remove a canonical subitem.

## Rollback and Success Criteria

Revert this additive change as one PR, restoring U5's empty catalog/zero threshold; no persisted data needs migration. Success: all six source records are traced; readiness enables U5; both structured kinds accept valid normalized input and reject malformed/bounds-invalid input; feedback is declared-tag-only; and `pnpm run test`, `pnpm run typecheck`, and `pnpm run build` pass.
