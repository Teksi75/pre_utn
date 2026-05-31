# Proposal: Unit 1 — Pedagogical Slice

## Intent

2 skills piloto (`reales_operaciones`, `intervalos`) genuinamente enseñables: teoría → ejemplo → práctica → feedback → persistencia → métricas. Patrón escalable Unit 2+.

## Scope

### In Scope
- Modelos domain puros: `TheoryNode`, `WorkedExample` + validación + TDD
- 2 theory nodes + 4 worked examples (2/skill)
- Expandir ejercicios piloto a 4/skill (+3 en exercises.json)
- Feedback pedagógico (correctivo, conceptual, procedimental)
- Persistencia localStorage + métricas accuracy/tendencia
- Error taxonomy: ≥2 tags/skill piloto
- Mapeo material canónico como fuente pedagógica válida

### Out of Scope
- Skills 3-7 Unit 1; simulacro; dashboard docente; repaso espaciado; Física

## Capabilities

### New
- `theory-content`: TheoryNode + Concept → `content/matematica/theory/`
- `worked-examples`: WorkedExample + SolutionStep → `content/matematica/examples/`
- `pedagogical-feedback`: Motor 3 tipos desde evaluación + error tag

### Modified
- `guided-practice`: Flujo teoría → ejemplo → práctica → feedback
- `math-exercise-catalog`: Expandir cobertura U1; cargar theory+examples

## Approach

Patrón escalable: skill nueva = JSON nuevo (theory + examples + exercises), sin código domain. Contenido guiado por el material canónico; se prefieren variantes cuando aportan práctica nueva y repeticiones cuando refuerzan un concepto.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/models/theory.ts` | New | Tipos + validación |
| `src/domain/models/worked-example.ts` | New | Tipos + validación |
| `src/domain/feedback/index.ts` | New | Motor feedback |
| `src/domain/persistence/index.ts` | New | localStorage |
| `src/domain/metrics/index.ts` | New | SkillMetric |
| `content/matematica/theory/` | New | 2 JSON |
| `content/matematica/examples/` | New | 2 JSON |
| `content/matematica/exercises.json` | Modified | +3 ejercicios |
| `src/domain/error-taxonomy/index.ts` | Modified | +4 tags |

## Risks

| Risk | L | Mitigation |
|------|---|------------|
| Repetición sin valor pedagógico | M | Variar ejercicios por defecto; repetir material canónico solo con intención didáctica explícita |
| Scope creep "sufficient theory" | M | 2 skills estricto |
| Feedback sin tags suficientes | M | ≥2 tags/skill, iterar |

## Rollback

Componentes aditivos. Models nuevos no tocan existentes. JSON nuevos borrables. Git: commit por componente.

## Dependencies

- **Material canónico**: PDFs disponibles en `material_canonico/Matemática/`, especialmente `UNIDAD1_matemática.pdf` y `RESOLUCIÓN DE EJERCICIOS SEMINARIO UNIVERSITARIO MATEMÁTICA.pdf`.
- Specs y domain layer existentes.

## Success Criteria

- [ ] Teoría visible para 2 skills (conceptos + errores comunes)
- [ ] ≥1 ejemplo resuelto/skill
- [ ] ≥4 ejercicios/skill con feedback correctivo + conceptual
- [ ] Persistencia intentos + accuracy por skill
- [ ] ≥2 error tags/skill piloto
- [ ] Uso del material canónico trazable y pedagógicamente justificado
- [ ] `pnpm test && pnpm typecheck && pnpm build` OK
- [ ] Patrón escalable verificado
