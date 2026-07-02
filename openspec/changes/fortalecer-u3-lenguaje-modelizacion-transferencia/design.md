# Design: Fortalecer Unidad 3: lenguaje algebraico, modelización y transferencia

## Technical Approach

Implementar PR 1 como expansión de contenido compatible con el flujo actual de `/practice`: skill seleccionada → teoría → ejemplos → ejercicios → feedback → complete/challenge. No se cambian modelos base ni loaders de challenges en PR 1. El foco técnico es mantener IDs existentes, agregar contenido trazable y preservar loaders actuales.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Modelización como slice acotado | Crear/usar contenido U3 centrado en traducción verbal, planteo y verificación | Rediseñar toda U3 | Reduce riesgo y ataca la brecha P0 más grave del Explore. |
| Respuestas de traducción | Preferir `multiple-choice` con distractores semánticos | Input simbólico libre | Evita fragilidad de formato y evalúa comprensión matemática real. |
| Skill nueva | Agregar `mat.u3.traduccion_lenguaje_verbal` solo si el catálogo lo permite sin bloquear skills existentes | Integrar todo dentro de `ecuaciones_lineales` | Una skill separada mejora trazabilidad, pero debe ser hoja para no romper progreso. |
| Challenges U3 | Diferir a PR 2; PR 1 no crea ni registra challenges | Meter desafíos en ejercicios base | Mantiene separación base vs desafío y acota el PR 1 a modelización base. |
| Mate-explorer | Excluir de este cambio | Diseñar exploraciones visuales nuevas | El Explore no tuvo acceso verificable al repo; incluirlo sería especulación. |

## Data Flow

```text
PILOT_SKILLS / UNIT_3_SKILLS
        │
        ▼
FocusSelector ──→ usePracticeFlow.handleSkillSelect(skillId)
        │              │
        │              ├─ queryBySkill(skillId)
        │              ├─ loadTheoryContent("unit-3")
        │              ├─ loadExampleContent("unit-3")
        │              └─ loadFeedbackContent("unit-3")
        ▼
theory → examples → exercise → feedback → complete
                                      │
                                      └─ ChallengeFlow queda sin cambios en PR 1
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/models/skill-catalog.ts` | Modify | Agregar skill U3 si se decide separarla. |
| `src/domain/catalog/pilot-skills.ts` | Modify | Exponer la skill en el selector, sin convertirla en prerequisito global. |
| `content/matematica/theory/unit-3.json` | Modify | Conceptos de variable, traducción, planteo y verificación. |
| `content/matematica/examples/unit-3.json` | Modify | Ejemplos trabajados de enunciado → modelo → solución → interpretación. |
| `content/matematica/exercises/unit-3.json` | Modify | Ejercicios MC de traducción/modelización y verificación. |
| `content/matematica/feedback/unit-3.json` | Modify | Mappings para errores de variable, relación invertida y verificación omitida. |
| `content/matematica/challenges/unit-3.json` | Deferred | PR 2; no se crea en PR 1. |
| `src/lib/challenges/loader.ts` | Deferred | PR 2; PR 1 no registra challenges U3. |
| `src/domain/__tests__/content-loaders-u3.test.ts` | Modify | Validar nueva cobertura U3 y shape de contenido. |
| `src/lib/challenges/__tests__/*` | Deferred | PR 2; no agregar tests de challenges en PR 1. |
| `openspec/specs/practice-coverage/spec.md` | Modify | Delta para cobertura de modelización U3. |
| `openspec/specs/challenge-exercises/spec.md` | Deferred | PR 2; no se modifica en PR 1. |

## Interfaces / Contracts

No se espera cambiar el contrato base de `Exercise`. Los contracts de challenges quedan fuera de PR 1 y se retoman en PR 2.

La skill nueva, si se agrega, debe seguir el patrón de `UNIT_3_SKILLS` y `PILOT_SKILLS`, con ID estable `mat.u3.traduccion_lenguaje_verbal` y sin reemplazar IDs existentes.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Domain/content | U3 carga teoría, ejemplos, feedback y ejercicios para todas las skills | Actualizar tests de content loaders U3. |
| Catalog | Skill nueva accesible y no bloquea skills existentes | Tests de catálogo/readiness si cambian prerequisitos. |
| Challenges | Sin cambios en PR 1 | No agregar tests/loaders de challenges hasta PR 2. |
| Regression | `/practice` conserva navegación y progreso | Vitest existente + smoke manual si aplica. |
| Project gates | Calidad general | `pnpm run test`, `pnpm run typecheck`, `pnpm run build`. |

## Migration / Rollout

No hay migración de datos. El rollout debe ser aditivo: conservar IDs actuales y agregar nuevos IDs. Si la skill nueva causa ruido en el selector, puede ocultarse/revertirse removiéndola de `PILOT_SKILLS` sin afectar ejercicios existentes.

## Open Questions

- [ ] Confirmar si `mat.u3.traduccion_lenguaje_verbal` será skill visible o contenido interno de `ecuaciones_lineales`.
- [x] Los challenges U3 quedan diferidos para PR 2; no entran en PR 1.
- [ ] Confirmar el formato final de `canonicalTrace` para fuentes locales no versionadas.
