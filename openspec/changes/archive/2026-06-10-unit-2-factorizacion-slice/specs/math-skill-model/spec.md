# Delta: math-skill-model (Unit 2 Factorizacion Skill Catalog Edits)

## ADDED Requirements

**Referencias**: `unit-2-factorizacion-slice/proposal.md` | `unit-2-factorizacion-slice/exploration.md`

### Requirement: Factorizacion Prerequisite Update

El skill `mat.u2.factorizacion` DEBE declarar `mat.u2.ruffini_resto` como prerrequisito adicional en `SKILL_DEPENDENCIES` (`src/domain/models/skill-catalog.ts`). Actualmente solo declara `mat.u2.operaciones_polinomios`; DEBE incluir ambos.

**Justificacion**: El caso 7 (trinomio de segundo grado) usa Ruffini para encontrar factores cuando el coeficiente principal a != 1. Sin Ruffini, el alumno no puede factorizar completamente polinomios como `6x² + 7x + 2 = (2x+1)(3x+2)`.

**Estado actual** (linea 115 de `skill-catalog.ts`):
```
{ skillId: "mat.u2.factorizacion", prerequisites: ["mat.u2.operaciones_polinomios"] }
```

**Estado esperado**:
```
{ skillId: "mat.u2.factorizacion", prerequisites: ["mat.u2.operaciones_polinomios", "mat.u2.ruffini_resto"] }
```

#### Scenario: U2FAC-SKILL-001 — Factorizacion tiene ruffini_resto como prerrequisito

- GIVEN el `SKILL_DEPENDENCIES` actualizado
- WHEN se consulta la entrada de `mat.u2.factorizacion`
- THEN `mat.u2.ruffini_resto` esta en la lista de prerequisites
- AND `mat.u2.operaciones_polinomios` sigue en la lista

#### Scenario: U2FAC-SKILL-002 — Cadena de dependencia cerrada

- GIVEN el `SKILL_DEPENDENCIES` actualizado
- WHEN se valida el grafo de prerrequisitos de U2
- THEN la cadena es: `polinomios_basico → operaciones_polinomios → ruffini_resto → factorizacion → gauss → mcm_mcd_polinomios`
- AND no hay ciclos

#### Scenario: U2FAC-SKILL-003 — computeReadiness bloquea factorizacion sin ruffini

- GIVEN que el alumno completo `mat.u2.operaciones_polinomios` pero NO `mat.u2.ruffini_resto`
- WHEN se consulta `computeReadiness` para `mat.u2.factorizacion`
- THEN el skill NO esta ready (su prerrequisito `mat.u2.ruffini_resto` no esta completo)

### Requirement: Exercise Count Soft Minimum

El catalogo DEBE mantener un minimo suave de 4 ejercicios por skill para los skills U2 implementados. Este minimo NO se enforce en codigo; es una convencion de contenido para consistencia pedagogica.

| Skill | Ejercicios | Estado |
|-------|-----------|--------|
| `mat.u2.polinomios_basico` | 4 | Implementado (slice anterior) |
| `mat.u2.operaciones_polinomios` | 4 | Implementado (slice anterior) |
| `mat.u2.ruffini_resto` | 4 | Implementado (slice anterior) |
| `mat.u2.factorizacion` | 4 | Este slice |
| `mat.u2.gauss` | 4 | Este slice |

#### Scenario: U2FAC-SKILL-004 — Skills U2 tienen >= 4 ejercicios

- GIVEN el catalogo cargado
- WHEN se cuentan los ejercicios por skill U2
- THEN cada skill U2 implementado tiene al menos 4 ejercicios

---

## Impacto Pedagogico

**(alumno)**: La dependencia `factorizacion ← ruffini_resto` asegura que el alumno domino Ruffini antes de enfrentar la factorizacion con trinomio de segundo grado (a != 1). El grafo de prerrequisitos refleja el orden pedagogico real del material canonico.

**(docente)**: La cadena de dependencia completa (`polinomios_basico → operaciones → ruffini → factorizacion → gauss → mcm_mcd`) permite planificar la progresion del alumno con evidencia de prerequisitos.

---

## Fuera de alcance

- Dependencias inter-unidad U1 -> U2 (documentadas como supuesto, no implementadas)
- Division de `mat.u2.factorizacion` en sub-skills (basico/avanzado)
- Cambios al modelo `Skill` o a la interfaz `SkillDependency`
- Enforce del minimo de 4 ejercicios en codigo (es convencion, no validacion automatica)

---

## Referencias cruzadas

- `math-exercise-catalog`: los ejercicios U2 activan skills en el grafo
- `guided-practice`: el flujo de practica consulta `computeReadiness`
- `diagnostic-shell`: las recomendaciones usan el grafo de dependencias
- `src/domain/models/skill-catalog.ts`: archivo que contiene `SKILL_DEPENDENCIES`
