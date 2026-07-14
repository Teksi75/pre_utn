# U5-01 Static Retirement Inventory

## Binding Decision

Provisional Unit 5 was never exposed as a practicable user unit. U5-01 is static repository retirement, not per-student migration. All earlier sidecar, SQL, write-gate, blocking, and persistence-change plans are superseded.

## Baseline and Preservation

- Baseline: `origin/main` at `aa7ad91616a67a12dfa7641ab6372a84981e657a`.
- Archived U5-00 authority remains read-only at `openspec/changes/archive/2026-07-14-u5-00-unit-5-foundation/`.
- Do not modify U3, U5-02, canonical U5 content, persistence, SQL, or product behavior.

## Exact Provisional Inventory

### Skills

`mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar`.

### Placeholder Exercises

`ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1`.

### Retained Facts

- The five contiguous placeholder objects are in `content/matematica/exercises.json` lines 133-202 in the recorded baseline, a 70-line mechanical deletion.
- `mat.u5.trigonometria_basica`, `ex.u5.bad.1`, and `ex.u5.good.1` are synthetic diagnostic fixtures, not retirement keys.
- `pre-utn.advanced-practice.v1` contains no matching provisional records and is out of scope.

## Active Reference Locations

| Area | Verified active references |
|---|---|
| Skill catalog | `src/domain/models/skill-catalog.ts`: `UNIT_5_SKILLS`, derived `ALL_SKILLS` and `KNOWN_SKILL_IDS`, and two U5 dependency rows. `src/domain/index.ts` re-exports derived values. |
| Content | `content/matematica/exercises.json`: five placeholder objects. |
| Catalog threshold | `src/domain/catalog/content-loaders.ts`: add the temporary `UNIT_THRESHOLDS["unit-5"] = 0` contract. |
| Taxonomy | `src/domain/error-taxonomy/index.ts`: provisional `u5_cuadrante_angulo` and `u5_identidad_pitagorica`; reconcile any current minimum-tag contract with empty U5. |
| Pedagogy docs | `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md`: provisional U5 entries. |
| Active specs | `openspec/specs/{unit-5-foundation,math-exercise-catalog,complex-numbers-skill}/spec.md` and this change's delta specs. |
| Tests | `src/domain/__tests__/{catalog,per-unit-thresholds,diagnostic,evaluator-index,catalog-answer-contract,complejos-domain,error-taxonomy}.test.ts`. |

`src/components/practice/FocusSelector.tsx` consumes derived `SKILLS_BY_UNIT[5]`; it has no literal provisional identifier to rewrite.

## Superseded Inventory Sections

Earlier persistence-root, local-write-path, remote-schema, transformation, crash/retry, and rollout notes were investigated under the false migration premise. They are retained only as historical context in prior planning, not as U5-01 requirements. No persistence surface is active scope.

## Static Retirement Checklist

1. Retire the exact provisional catalog/content/taxonomy/reference/spec/document/test artifacts.
2. Preserve synthetic fixtures and unrelated Units 1, 2, 3, 4, and 6.
3. Validate the empty Unit 5 static catalog contract.
4. Rebuild `tasks.md` before implementation; do not adapt its invalid migration slices.
