# Proposal: Add Traversable `mat.u1.valor_absoluto` Skill

## Intent

`mat.u1.valor_absoluto` is scaffolded in the catalog and has 1 exercise, but `isSkillReady` returns `ready: false` — missing theory, examples, feedback, and pilot-skills entry. The student cannot practice this skill. This change makes it traversable: theory → solved examples → practice → feedback → readiness → navigation.

## Scope

### In Scope
- Add theory node to `content/matematica/theory/unit-1.json`: definition (cases), distance-to-zero, non-negativity, opposites, numeric calculation, distance between real numbers, basic properties (`|ab|=|a||b|`, `|a/b|=|a|/|b|`), simple `|x|=a` multiple-choice interpretation, conceptual interval connection
- Add 3–5 worked examples to `content/matematica/examples/unit-1.json`
- Add 4+ exercises to `content/matematica/exercises.json` (currently 1; need ≥5 total for catalog, ≥4 for readiness)
- Add error-tag feedback mappings to `content/matematica/feedback/unit-1.json`
- Update existing exercise `ex.u1.valor_absoluto.1` with `relatedTheoryIds` / `relatedExampleIds`
- Add entry to `PILOT_SKILLS` in `src/domain/catalog/pilot-skills.ts` (between `intervalos` and `logaritmos`)
- Update `README.md` — mark valor_absoluto as "Listo"

### Out of Scope
- Complex numbers or `|z|` for complex modulus
- Unit 3 absolute-value equations/inequalities (`|x-2| < 5`)
- Advanced modular equations
- Free-form symbolic answers (per AGENTS.md: no respuesta libre para expresiones estructuradas)
- Unit 6 function treatment of `|f(x)|`
- Domain model, loader, or evaluator changes

## Capabilities

> This section is the CONTRACT between proposal and specs phases.

### New Capabilities
<!-- No new spec-level capabilities. This is content addition within existing models. -->
None

### Modified Capabilities
<!-- No existing spec requirements change. Content fills gaps in existing architecture. -->
None

## Approach

**Single content-file approach** — add all content to existing `unit-1.json` files + one pilot-skills entry. This follows the exact pattern of `mat.u1.racionalizacion`, `mat.u1.intervalos`, and `mat.u1.logaritmos`.

No new files, no registry changes, no loader modifications. Content loaders already import `unit-1.json` for theory/examples/feedback.

### Content Design

| Layer | Target | Details |
|-------|--------|---------|
| Theory | `theory/unit-1.json` | 6–8 concepts: definition (cases), distance-to-zero, non-negativity, opposites, properties, `|x|=a` interpretation, interval connection |
| Examples | `examples/unit-1.json` | 3–5 worked examples covering numeric calculation, distance between reals, property application |
| Exercises | `exercises.json` | 5+ total (1 existing + 4 new): multiple-choice for conceptual, numerical for computation, MC for error detection |
| Feedback | `feedback/unit-1.json` | 4 error tags: `u1_va_confunde_signo`, `u1_va_distancia_cero`, `u1_va_dos_casos`, `u1_va_propiedad_producto` |
| Pilot | `pilot-skills.ts` | Entry between intervalos and logaritmos |

Exercise types per AGENTS.md: multiple-choice (classification, error detection, property identification), numerical (single-value computation). No free-form symbolic.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/theory/unit-1.json` | Modified | Add theory node for valor_absoluto |
| `content/matematica/examples/unit-1.json` | Modified | Add 3–5 worked examples |
| `content/matematica/exercises.json` | Modified | Add 4+ exercises |
| `content/matematica/feedback/unit-1.json` | Modified | Add error-tag feedback mappings |
| `src/domain/catalog/pilot-skills.ts` | Modified | Add PILOT_SKILLS entry |
| `README.md` | Modified | Update status from "Pendiente" to "Listo" |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Content quality depends on canonical material (`UNIDAD1_matemática.pdf` section) | Low | Verify section exists before writing theory; cross-reference with canonical examples |
| Existing exercise `ex.u1.valor_absoluto.1` has no theory/example linkage | Low | Update `relatedTheoryIds`/`relatedExampleIds` when adding theory/examples |
| CATEGORY_MINIMUMS constraint if exercises use categories | Medium | Use existing categories with capacity or omit category (defaults to `"clasificacion"`) |

## Rollback Plan

1. Remove added entries from `theory/unit-1.json`, `examples/unit-1.json`, `exercises.json`, `feedback/unit-1.json`
2. Remove pilot-skills entry from `pilot-skills.ts`
3. Revert `README.md` status to "Pendiente"
4. No schema or model changes to revert — rollback is pure content removal

## Dependencies

- Canonical material `UNIDAD1_matemática.pdf` must have a valor absoluto section (verify before content authoring)
- Existing models (`TheoryNode`, `WorkedExample`, `FeedbackMapping`, `Exercise`) already support required fields
- Existing evaluators (`evaluateExact`, `evaluateBoolean`) cover exercise types used

## Success Criteria

- [ ] `isSkillReady("mat.u1.valor_absoluto")` returns `ready: true`
- [ ] Skill appears in pilot-skills list and is navigable from UI
- [ ] ≥5 exercises exist with difficulty range 1–4
- [ ] Every exercise has a feedback entry in `feedback/unit-1.json`
- [ ] Theory covers: definition, distance-to-zero, non-negativity, properties, `|x|=a` interpretation
- [ ] All exercises use approved types (multiple-choice, numerical) — no free-form symbolic
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` pass
