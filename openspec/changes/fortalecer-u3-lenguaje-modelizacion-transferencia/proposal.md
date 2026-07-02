# Proposal: Fortalecer Unidad 3: lenguaje algebraico, modelización y transferencia

## Intent

Fortalecer la Unidad 3 para que el alumno no solo opere ecuaciones aisladas, sino que pueda traducir enunciados, definir incógnitas, plantear modelos, resolver, verificar e interpretar resultados como en una situación de evaluación. El cambio responde a la brecha P0 del Explore: la práctica actual cubre 37 ejercicios, pero no entrena explícitamente traducción verbal, modelización ni transferencia a examen.

## Scope

### In Scope
- Mejorar teoría, ejemplos, feedback y práctica de Unidad 3 vinculados con lenguaje algebraico, planteo lineal y verificación.
- Reutilizar ejercicios actuales de ecuaciones lineales cuando sirvan como base de resolución.
- Agregar una ruta breve de modelización: variable → expresión → ecuación/inecuación → resolución → verificación contextual.
- Dejar los desafíos U3 diferidos para PR 2; PR 1 solo aplica modelización base.

### Out of Scope
- `mate-explorer`.
- Rectas paralelas/perpendiculares, sistemas con parámetro y rediseño completo de Unidad 3.
- Cambios sobre PDFs oficiales o material canónico local.
- Cualquier framing de producto exclusivo de una institución.
- Cambios no relacionados ya presentes en Git (`material_canonico/**`, `.gitignore`, script local de sync).

## Capabilities

### New Capabilities
- `u3-algebraic-modeling`: entrenamiento de traducción verbal, definición de incógnitas, planteo, resolución, verificación e interpretación contextual.
- `u3-challenge-transfer`: PR 2/deferred; no forma parte del apply de PR 1.

### Modified Capabilities
- `practice-coverage`: incorporar criterios de cobertura evaluable para modelización U3, no solo cantidad de ejercicios.
- `challenge-exercises`: sin cambios en PR 1; los desafíos U3 quedan para PR 2.

## Approach

Partir del Explore `auditar-unidad-3-pedagogia` y construir un primer slice pedagógico acotado: lenguaje verbal y modelización lineal. La implementación futura debería preferir ejercicios de opción múltiple con distractores semánticos antes que respuesta simbólica libre, para evitar castigar formato y evaluar comprensión. La verificación debe exigir que el alumno conecte el resultado con el contexto, no solo que despeje correctamente.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/theory/unit-3.json` | Modified | Conceptos de traducción, variable, planteo y verificación. |
| `content/matematica/examples/unit-3.json` | Modified | Ejemplos trabajados de traducción y planteo. |
| `content/matematica/exercises/unit-3.json` | Modified | Ejercicios nuevos/reutilizados para modelización y verificación. |
| `content/matematica/feedback/unit-3.json` | Modified | Errores frecuentes de variable mal definida, relación invertida y falta de verificación. |
| `content/matematica/challenges/unit-3.json` | Deferred | PR 2; no se crea en PR 1. |
| `src/lib/challenges/loader.ts` | Deferred | PR 2; PR 1 no registra challenges U3. |
| `openspec/specs/practice-coverage/spec.md` | Modified | Delta de cobertura pedagógica por habilidad evaluable. |
| `openspec/specs/challenge-exercises/spec.md` | Deferred | PR 2; no se modifica en PR 1. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Agregar contenido por cantidad, no por habilidad | Medium | Cada ejercicio nuevo debe mapear a una brecha del Explore y a una habilidad evaluable. |
| Romper progreso o navegación de `/practice` | Medium | No cambiar IDs existentes; agregar contenido compatible con loaders actuales y tests de catálogo. |
| Sobrecargar el selector con demasiadas skills U3 | Medium | Preferir un slice acotado; si se crea skill nueva, mantenerla hoja y no prerequisito global. |
| Respuesta simbólica frágil | High | Usar multiple-choice con distractores pedagógicos para traducción algebraica. |
| Mezclar cambios de material canónico local | Low | Excluir explícitamente `material_canonico/**` del scope de este cambio. |

## Rollback Plan

Revertir los archivos de contenido y specs del cambio. PR 1 no agrega challenges ni loader de challenges U3; `/practice` debe seguir usando solo la práctica base U3 existente. No hay migración de datos esperada si se preservan IDs actuales.

## Dependencies

- `openspec/changes/auditar-unidad-3-pedagogia/exploration.md`.
- Specs actuales de `practice-coverage` y `challenge-exercises`.
- Fuentes canónicas locales solo como referencia pedagógica; no versionar PDFs.

## Success Criteria

- [ ] La propuesta identifica la habilidad evaluable fortalecida: modelización algebraica U3.
- [ ] Cada cambio futuro queda trazado a una brecha P0/P1 del Explore.
- [ ] Se reutilizan ejercicios lineales existentes cuando sirven a resolución, sin duplicar contenido.
- [ ] Los ejercicios nuevos se justifican por traducción, planteo, verificación o transferencia.
- [ ] La verificación mide interpretación contextual, no solo operación algebraica.
- [ ] `/practice` conserva progreso, navegación y carga de ejercicios existentes.
- [ ] Tests esperados para PR 1: catálogo/contenido U3, evaluador/feedback, typecheck, build y flujo `/practice`.
