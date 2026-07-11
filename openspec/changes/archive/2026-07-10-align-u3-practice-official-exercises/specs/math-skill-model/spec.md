# Delta for math-skill-model

## ADDED Requirements

### Requirement: U3 Absolute-Value Equations Skill

The skill catalog MUST register `mat.u3.ecuaciones_valor_absoluto` as a U3 leaf skill for the P8 `|ax+b|=k` equation family. It MUST appear in `UNIT_3_SKILLS` and `PILOT_SKILLS`. It MUST NOT appear as a prerequisite for any other skill (parallel-branch design; see root-skill convention).

#### Scenario: skill registered as leaf

- GIVEN the loaded skill catalog
- WHEN `UNIT_3_SKILLS` is enumerated
- THEN `mat.u3.ecuaciones_valor_absoluto` is present
- AND no entry in `SKILL_DEPENDENCIES` lists it as a prerequisite for any other skill

### Requirement: U3 Product-Quotient Inequalities Skill

The skill catalog MUST register `mat.u3.inecuaciones_producto_cociente` as a U3 leaf skill for the P9p-w sign-chart family. It MUST appear in `UNIT_3_SKILLS` and `PILOT_SKILLS`. It MUST NOT appear as a prerequisite for any other skill.

#### Scenario: skill registered as leaf

- GIVEN the loaded skill catalog
- WHEN `UNIT_3_SKILLS` is enumerated
- THEN `mat.u3.inecuaciones_producto_cociente` is present
- AND no entry in `SKILL_DEPENDENCIES` lists it as a prerequisite for any other skill

### Requirement: Existing `traduccion_lenguaje_verbal` Untouched

This change MUST NOT modify `mat.u3.traduccion_lenguaje_verbal` (the `fortalecer-u3-lenguaje-modelizacion-transferencia` companion owns it), MUST NOT alter its existing 5 base MC exercises, and MUST NOT touch its 2 existing desafios (`desafio-01` diff 5, `desafio-02` diff 4).

#### Scenario: existing skill and challenges unchanged

- GIVEN the existing `mat.u3.traduccion_lenguaje_verbal` entry and its 2 desafios
- WHEN this change is applied
- THEN `UNIT_3_SKILLS` membership is unchanged for that skill
- AND the 2 desafios remain in the challenge loader at their original `difficulty` and `id`