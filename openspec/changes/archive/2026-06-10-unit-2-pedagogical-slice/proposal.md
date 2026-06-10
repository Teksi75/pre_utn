# Proposal: unit-2-pedagogical-slice

> **Change:** unit-2-pedagogical-slice
> **Date:** 2026-06-10
> **Author:** orchestrator + sdd-propose-chinos
> **Status:** proposed

## Intent

La Unidad 1 está completa: 10 cambios archivados en `openspec/changes/archive/`, infraestructura pedagógica operativa (TheoryNode, WorkedExample, motor de feedback, flujo de práctica guiada, persistencia, métricas), GGA activo, main estable. La Unidad 2 del material canónico (`UNIDAD2_matemática.pdf`, 16 páginas, 15 temas) cubre polinomios y álgebra polinómica. Los primeros 3 skills (`polinomios_basico` → `operaciones_polinomios` → `ruffini_resto`) forman una cadena de dependencia cerrada que permite al alumno leer, operar y evaluar polinomios — las herramientas básicas que habilitan todo el resto de la unidad.

## Approach

Reutiliza 8 specs U1 sin modificación. Extiende 4 componentes (catálogo, taxonomía, evaluador, skill-catalog). Crea 1 módulo nuevo (`polynomial-evaluator`). Factorización se difiere: 7 casos + Gauss exceden el presupuesto de revisión y merecen slice propio (exploration §4, §8).

## Scope (In)

- 3 skills: `mat.u2.polinomios_basico`, `mat.u2.operaciones_polinomios`, `mat.u2.ruffini_resto` (caps 1–11)
- 3 theory JSON + 3 examples JSON + 3 feedback JSON en `content/matematica/`
- 12 ejercicios nuevos (4 por skill), reutilizando 4 placeholders existentes
- ≥6 error tags `u2_*` nuevos (signo al restar, completar polinomio, Ruffini, etc.)
- `src/domain/evaluator/polynomial-evaluator.ts` — expansión, ordenamiento, comparación de coeficientes (TDD estricto)
- Relocación de `ex.u2.gauss.1` → `mat.u3.sistemas` (es eliminación gaussiana, no Gauss de factorización)
- Dependencias faltantes en `skill-catalog.ts`: `gauss ← ruffini_resto`, `mcm_mcd_polinomios ← factorizacion`
- Ejemplo trabajado de división larga con KaTeX (sin ejercicio interactivo)

## Scope (Out)

- Factorización (7 casos + Gauss) → slice U2-Factorización
- `mcm_mcd_polinomios`, `ecuaciones_fraccionarias`
- División larga como ejercicio interactivo
- `polynomial-evaluator`: factorización inversa
- Dependencias bloqueantes U1 → U2 (se documentan, no se implementan)

## Capabilities

### New
- `polynomial-evaluator`: equivalencia polinómica por expansión y comparación de coeficientes

### Modified
- `math-exercise-catalog`: +12 ejercicios U2, content loaders para theory/examples/feedback U2
- `math-error-taxonomy`: ≥6 tags `u2_*`
- `math-answer-evaluator`: patrones de error U2 en `error-tagging.ts`
- `math-skill-model`: dependencias faltantes en `SKILL_DEPENDENCIES`

## Success Criteria

- [ ] ≥4 ejercicios por skill, todos con `commonErrorTags` no vacío
- [ ] Todos los ejercicios U2 pasan `math-answer-evaluator`
- [ ] `polynomial-evaluator` con TDD (RED → GREEN → REFACTOR), ≥90% branch coverage
- [ ] ≥6 error tags `u2_*` en taxonomía con ejemplos y detección en `error-tagging.ts`
- [ ] 1117+ tests existentes siguen pasando
- [ ] `pnpm run typecheck` y `pnpm run build` verdes
- [ ] GGA pre-commit limpio

## Pedagogical Impact

**Alumno**: aprende a leer, clasificar, operar y evaluar polinomios con progresión guiada (teoría → ejemplo → práctica → feedback correctivo). Los error tags `u2_*` detectan errores frecuentes (signo al restar polinomios, no completar con ceros, confundir `a` con `−a` en Ruffini) y generan feedback específico que acelera la autocorrección.

**Docente**: la taxonomía de errores U2 y las métricas de accuracy por skill permiten identificar qué conceptos de polinomios generan más confusión, intervenir con foco y planificar el slice de factorización con evidencia de prerequisitos.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `polynomial-evaluator` no cubre equivalencias no triviales | Med | TDD estricto; scope = expansión + comparación; factorización inversa diferida |
| Contenido JSON con errores pedagógicos | Med | Referencia cruzada con PDF canónico; QA en verify |
| Scope creep hacia factorización | Alto | Límite estricto: 3 skills. Cualquier adición requiere re-abrir propuesta |
| `ex.u2.gauss.1` rompe tests al relocar | Bajo | Actualizar `skillId` a `mat.u3.sistemas`; verificar catalog + diagnostic tests |
| Prerrequisitos U1→U2 no bloquean acceso | Bajo | Documentado como supuesto; `computeReadiness` intra-unidad ya funciona |

## Open Assumptions

1. Slice = 3 skills, caps 1–11 (decisión orquestador #1)
2. `polinomios_basico` no se divide — 8 temas de baja densidad cognitiva (#2)
3. `ex.u2.gauss.1` se reubica a `mat.u3.sistemas`, no se elimina ni reescribe (#3)
4. `polynomial-evaluator` = solo expansión, sin factorización inversa (#4)
5. 4 ejercicios por skill → 12 total, consistente con U1 (#5)
6. División larga = ejemplo trabajado KaTeX, sin ejercicio interactivo (#6)
7. Dependencias U1→U2 no son bloqueantes en este slice (#7)
8. El alumno consolidó operaciones básicas de U1 (exploration §9.2)
9. Los tipos de ejercicio existentes (`multiple-choice`, `numerical`, `symbolic`) cubren las necesidades de U2
10. Contenido teórico en español neutro/profesional

## Execution Plan (preview)

spec → design → tasks → apply → verify → archive. Estrategia PR: `auto-forecast`. Estimación: ~350–400 líneas modificadas → 1 PR esperado.

## Rollback Plan

Revertir el merge commit. Restaurar `ex.u2.gauss.1` desde main (tenía `skillId: mat.u2.gauss`). Eliminar archivos JSON de U2 (`theory/unit-2.json`, `examples/unit-2.json`, `feedback/unit-2.json`). Eliminar `polynomial-evaluator.ts`. Revertir cambios en `error-taxonomy`, `error-tagging`, `skill-catalog`, `exercises.json`. Todos los cambios son aditivos o reubicaciones — sin destructive mutations sobre U1.

## References

- `openspec/changes/unit-2-pedagogical-slice/exploration.md`
- `openspec/changes/unit-1-pedagogical-slice/` (proposal, design, tasks, verify-report)
- `openspec/changes/archive/` (10 cambios U1 archivados)
- `material_canonico/Matemática/UNIDAD2_matemática.pdf`
- Specs reutilizadas: `openspec/specs/{theory-content,worked-examples,pedagogical-feedback-coverage,guided-practice,math-exercise-model,diagnostic-shell,math-render-safety,math-answer-evaluator}/`
