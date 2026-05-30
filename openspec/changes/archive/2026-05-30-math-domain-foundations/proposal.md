# Proposal: Math Domain Foundations

## Intent

La app necesita dominio Matemático funcional para habilitar el primer loop de usuario: elegir skill → hacer ejercicio → evaluar respuesta. Hoy `src/domain/` solo tiene constants y `content/` está vacío. Sin modelos ni ejercicios, ninguna feature posterior (diagnóstico, métricas, recomendaciones) puede existir.

## Scope

### In Scope
- Modelos de dominio `Skill` y `Exercise` con validación y tipos estrictos
- Catálogo inicial de ~30 ejercicios originales (5/unidad, 6 unidades), derivados del material canónico por transmutación pedagógica — NO copia literal
- Evaluador básico: comparación respuesta alumno vs respuesta correcta
- Taxonomía de errores: tags normalizados por unidad con descripción legible

### Out of Scope
- Diagnóstico inicial (depende de esta change)
- Métricas de progreso y recomendaciones
- UI/componentes React
- Persistencia Supabase
- Ejercicios de Física (fase 2)
- Calibración empírica de dificultad (iterar después con datos reales)

## Capabilities

> Contract con sdd-spec. Cada capability nueva → `openspec/specs/<name>/spec.md`.

### New Capabilities
- `math-skill-model`: Tipo `Skill` con validación, IDs por unidad (mat.u1..u6), prerequisitos, metadata pedagógica
- `math-exercise-model`: Tipo `Exercise` con validación, tipado por `ExerciseType` (9 tipos del spec 07), dificultad 1-5, skillId, errorTags
- `math-exercise-catalog`: Catálogo de ~30 ejercicios originales en `content/matematica/`, 5 por unidad, transmutados del material canónico
- `math-answer-evaluator`: Evaluador que compara respuesta del alumno con esperada, retorna correcto/incorrecto + errorTag si aplica
- `math-error-taxonomy`: Catálogo de errorTags por unidad con descripción legible y ejemplos de cuándo se activan

### Modified Capabilities
None — no existen specs previas.

## Approach

Orden: modelos → catálogo → evaluador → errores.

1. **Modelos**: Definir tipos TypeScript estrictos en `src/domain/` (libre de frameworks). Validación con funciones puras. TDD desde el inicio.
2. **Catálogo**: Ejercicios originales inspirados en patrones del material canónico (6 unidades). Cada ejercicio referencia `skillId`, `type`, `difficulty`, `errorTags`. Archivos JSON/TS en `content/matematica/`.
3. **Evaluador**: Función pura `evaluateAnswer(exercise, userAnswer) → Result`. Comparación exacta para tipos numéricos/simbólicos; matching para opción múltiple. TDD estricto.
4. **Errores**: Mapa estático `errorTag → { description, examples, unit }`. Vinculado a ejercicios vía `commonErrorTags`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/` | New | Modelos Skill, Exercise, evaluator, error taxonomy |
| `src/domain/__tests__/` | New | Tests unitarios para cada modelo y evaluador |
| `content/matematica/` | New | ~30 ejercicios (5×6 unidades) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ejercicios insuficientes o de baja calidad | Med | Empezar 5/unidad, iterar. Calidad > cantidad |
| Evaluador demasiado simple para ejercicios simbólicos | Med | Limitar a comparación numérica/exacta en MVP; simbólico en fase posterior |
| Error taxonomy incompleta | Bajo | Empezar con 2-3 errores/unidad, expandir iterativamente |
| Violación de "no copiar material canónico" | Bajo | Transmutación: cambiar valores, contexto, redacción. Referenciar fuente, no copiar |

## Rollback Plan

Eliminar los archivos creados:
- `src/domain/models/skill.ts`, `exercise.ts`, `evaluator.ts`, `error-taxonomy.ts`
- `src/domain/__tests__/` (los nuevos)
- `content/matematica/*.json` o `*.ts`

No afecta nada existente — `src/domain/index.ts` solo tiene constants. Rollback limpio.

## Dependencies

- Specs 05, 06, 07 aprobados (mapa de contenidos, skill map, exercise types) — ya existen
- Material canónico en `material_canonico/Matemática/` — disponible

## Success Criteria

- [ ] Tipos `Skill` y `Exercise` definidos con validación, sin `any`
- [ ] ~30 ejercicios originales en `content/matematica/` (5 por unidad)
- [ ] Evaluador retorna `{ correct: boolean, errorTag?: string }` para cada ejercicio
- [ ] Taxonomía con al menos 12 errorTags (2/unidad) con descripción
- [ ] Todos los tests pasan (`pnpm run test`)
- [ ] TypeScript estricto sin errores (`pnpm run typecheck`)
- [ ] `src/domain/` no importa React, Next.js ni Supabase
