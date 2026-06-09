# Proposal: Add Complex Numbers as Unit 1 Pilot Skill

## Intent

`mat.u1.complejos` is fully wired in the catalog (dependencies, theme, topic map, validation) but has **zero content** and is excluded from `PILOT_SKILLS`. Students completing the number-set journey (ℕ → ℤ → ℚ → ℝ) hit a dead end before ℂ. Activating this skill closes Unit 1's conceptual arc and unblocks the `mat.u5.complejos_forma_polar` prerequisite chain.

## Scope

### In Scope
- Pilot activation: add `mat.u1.complejos` to `PILOT_SKILLS` (8th skill, after `logaritmos`)
- Theory: 8–10 concepts — imaginary unit *i*, standard form *a+bi*, real/imaginary parts, equality, addition, subtraction, multiplication (distributive + *i²=−1*), conjugate, division, powers of *i*
- Worked examples: ≥ 5 covering each operation
- Exercises: 10–14 graduated (difficulty 1–4), types `multiple-choice`, `true-false`, `numerical` (real/imag part separately). **No free-form `a+bi` text input**
- Error taxonomy: 6–8 tags (`u1_complejo_*`) with feedback mappings
- Domain tests: `complejos-domain.test.ts` (mirrors valor-absoluto pattern)
- Integration test updates: invert `catalog-readiness.test.ts` assertions for complejos

### Out of Scope
- Polar form, trigonometric form, or De Moivre (belongs to `mat.u5.complejos_forma_polar`)
- Complex plane / Argand diagram visualization
- New evaluators — existing `evaluateNumeric`, `evaluateExact`, `evaluateBoolean` suffice
- UI/component changes — MathThemePlate already supports "complex" theme

## Capabilities

### New Capabilities
- `complex-numbers-skill`: Content and behavioral contract for `mat.u1.complejos` — pilot entry, theory, examples, exercises, readiness (mirrors `valor-absoluto-skill` structure)

### Modified Capabilities
- `math-error-taxonomy`: Add 6–8 `u1_complejo_*` error tags for complex number misconceptions
- `pedagogical-feedback-coverage`: Add feedback mappings for each new error tag in `feedback/unit-1.json`

## Approach

Follow the proven `valor_absoluto` / `logaritmos` activation pattern. Content is pure JSON in `content/matematica/`. Domain registration is a single `PILOT_SKILLS` entry. TDD: write domain tests first (RED), add content and registration (GREEN), verify full suite.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/catalog/pilot-skills.ts` | Modified | Add `mat.u1.complejos` entry |
| `src/domain/error-taxonomy/index.ts` | Modified | Add `u1_complejo_*` tags |
| `content/matematica/theory/unit-1.json` | Modified | Add TheoryNode for complejos |
| `content/matematica/examples/unit-1.json` | Modified | Add ≥ 5 worked examples |
| `content/matematica/exercises.json` | Modified | Add 10–14 exercises |
| `content/matematica/feedback/unit-1.json` | Modified | Add feedback mappings |
| `src/domain/__tests__/complejos-domain.test.ts` | New | Domain tests |
| `src/domain/__tests__/catalog-readiness.test.ts` | Modified | Invert not-ready assertions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep into polar form | Med | Explicit non-goals; spec lists exact concepts |
| Exercise design constrained by no `a+bi` input | Low | MC + separate real/imag numerical inputs cover all operations |
| Test cascade from readiness assertions | Low | Well-scoped test file; only assertions for complejos change |

## Rollback Plan

Remove `mat.u1.complejos` from `PILOT_SKILLS` (one-line revert). Content JSON remains but is unreachable. Restore `catalog-readiness.test.ts` assertions. No data migration needed.

## Dependencies

- None external. Canonical UTN Ingreso material for content reference.

## Success Criteria

- [ ] `isSkillReady("mat.u1.complejos")` returns `{ ready: true, missing: [] }`
- [ ] ≥ 10 exercises, all permitted types, no free-form `a+bi`
- [ ] All error tags have feedback coverage
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` pass
- [ ] `mat.u5.complejos_forma_polar` prerequisite chain resolves
