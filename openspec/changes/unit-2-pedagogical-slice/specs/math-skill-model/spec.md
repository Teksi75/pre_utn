# Delta: math-skill-model (Unit 2 Skill Catalog Edits)

## Analisis de impacto

**Referencias**: `unit-2-pedagogical-slice/proposal.md` | `unit-2-pedagogical-slice/exploration.md`

### Contexto

La propuesta identifica dos dependencias faltantes en `SKILL_DEPENDENCIES` (`src/domain/models/skill-catalog.ts`):

| Skill | Prerrequisito faltante |
|-------|----------------------|
| `mat.u2.gauss` | `mat.u2.ruffini_resto` |
| `mat.u2.mcm_mcd_polinomios` | `mat.u2.factorizacion` |

### Veredicto: No se requiere cambio de spec

El spec `math-skill-model` ya establece:

1. **Prerequisite Integrity**: el sistema DEBE rechazar prerrequisitos desconocidos y cadenas circulares.
2. **Skill Identity**: los skill IDs DEBEN seguir `mat.u{1-6}.{slug}`.

Agregar las dos dependencias faltantes es un **cambio de datos** en la constante `SKILL_DEPENDENCIES`, no un cambio de comportamiento del modelo. Los requisitos del spec ya cubren:

- Validacion de prerrequisitos existentes → Scenario: known prerequisites are accepted
- Rechazo de ciclos → Scenario: invalid prerequisites are rejected

Ningun requisito nuevo necesita expresarse en el spec. La correccion se documenta y ejecuta en la fase de apply.

### Nota para la fase de apply

Al modificar `SKILL_DEPENDENCIES`:

1. Agregar `{ skillId: "mat.u2.gauss", prerequisites: ["mat.u2.ruffini_resto"] }` (actualmente ausente).
2. Agregar `{ skillId: "mat.u2.mcm_mcd_polinomios", prerequisites: ["mat.u2.factorizacion"] }` (actualmente ausente).
3. Verificar que no se introduzcan ciclos (gauss depende de ruffini_resto, que depende de operaciones_polinomios, que depende de polinomios_basico — cadena lineal, sin ciclo).
4. Verificar que `computeReadiness` sigue funcionando para skills U2 fuera del slice (gauss, mcm_mcd, ecuaciones_fraccionarias quedan no-ready hasta que sus prerrequisitos tengan contenido).

---

## Escenarios

### Scenario: U2-SKILL-001 — Dependencias U2 completas tras apply

- GIVEN el `SKILL_DEPENDENCIES` actualizado
- WHEN se valida el grafo de prerrequisitos
- THEN `mat.u2.gauss` tiene `mat.u2.ruffini_resto` como prerrequisito
- AND `mat.u2.mcm_mcd_polinomios` tiene `mat.u2.factorizacion` como prerrequisito
- AND no hay ciclos en el grafo

### Scenario: U2-SKILL-002 — Skills fuera del slice no estan ready

- GIVEN que `mat.u2.factorizacion` no tiene contenido en este slice
- WHEN se consulta `computeReadiness` para `mat.u2.mcm_mcd_polinomios`
- THEN el skill NO esta ready (su prerrequisito `mat.u2.factorizacion` no tiene ejercicios)

---

## Impacto Pedagogico

**(alumno)**: Sin impacto directo — las dependencias correctas aseguran que el grafo de prerrequisitos refleje la cadena pedagogica real (polinomios → operaciones → Ruffini → factorizacion → Gauss/MCM).

**(docente)**: El grafo de dependencias U2 es coherente con el orden pedagogico del material canonico.

---

## Fuera de alcance

- Dependencias inter-unidad U1 → U2 (documentadas como supuesto, no implementadas)
- Division de `mat.u2.factorizacion` en sub-skills (considerar en slice U2-Factorizacion)
- Cambios al modelo `Skill` o a la interfaz `SkillDependency`

---

## Referencias cruzadas

- `math-exercise-catalog`: los ejercicios U2 activan skills en el grafo
- `guided-practice`: el flujo de practica consulta `computeReadiness`
- `diagnostic-shell`: las recomendaciones usan el grafo de dependencias
