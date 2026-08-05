# Proposal: Recover U3 Ecuaciones Lineales

## Intent

`mat.u3.ecuaciones_lineales` is practice-ready but thin: every exercise is `numerical`, so `u3_aislamiento_incorrecto` (MC-only) never fires; the canonical P1l exercise is missing, so the skill never reaches canonical maximum difficulty.

## Scope

### In Scope
- MC exercises activating `u3_aislamiento_incorrecto`; P1l `ex.u3.ecuaciones_lineales.6`; P1l `difficulty: 5` challenge.
- New U3 tag `u3_racionalizacion_irracional` (taxonomy, feedback, detector, detector tests).
- Shape/catalog tests asserting the new tag and reachability of the existing isolation detector.

### Out of Scope
U2, free-text answers, "profe digital" copy, personalization, `validateTracePath`, `useChallengeFlow`, persistence, theory schema, `feat/align-u3-practice-official-exercises`.

## Autonomous P1l Decision (Tradeoff)

**Decision**: Adapt the canonical P1l prompt/distractors/explanation for concise app delivery; preserve mathematical structure, source provenance, and pedagogical intent. **Tradeoff**: a verbatim copy would push PR2 past 400 lines and dilute the neutral voice. The intent — rationalize the irrational coefficient, then isolate — is a math property, not wording. `canonicalTrace` proves provenance.

## Capabilities

### Modified Capabilities
- `math-error-taxonomy`: add `u3_racionalizacion_irracional` as an **additional** U3 tag (not a replacement of the 8 spec tags) plus detection pattern.
- `math-exercise-catalog`: MC isolation exercises, P1l exercise, P1l challenge; no-free-text + declared-tag discipline.
- `challenge-exercises`: one new U3 challenge (`difficulty: 5`, 4 MC options, Spanish `pedagogicalIntent`).

### New Capabilities
None.

## Approach

- **PR1** `feat/u3-ecuaciones-lineales-base` → main: MC isolation + shape/catalog tests. Self-contained.
- **PR2** `feat/u3-ecuaciones-lineales-p1l` → PR1: P1l + challenge + new tag/detector/tests. Canonical-trace dependency SATISFIED by PR #98 (merge `e553648`, head `feat/u3-traza-canonica-parser` @ `d4c77a5`). PR2 implementation MUST verify `e553648` is an ancestor of its base OR `parseOptionalCanonicalTrace`/`auditU3TraceSourceUse` are importable before any `canonicalTrace` write.

PR1 = preview-able milestone (isolation tag fires); PR2 = canonical max.

## Affected Areas

`content/matematica/{exercises,challenges,feedback}/unit-3.json` (MC isolation, P1l `.6`, P1l challenge, tag mapping); `src/domain/error-taxonomy/index.ts` (new tag conforming to `ErrorTag` contract `{ id, unit, description, examples }` — `description` is the pedagogical visible explanation; no `label` field, no model widening); `src/domain/evaluator/error-tagging.ts` (detector + dispatch); `src/domain/__tests__/{error-tagging-u3,error-taxonomy-u3,u3-exercise-shape}.test.ts` (declared-catalog, taxonomy, detector updates).

## Risks

| Risk | Mitigation |
|------|------------|
| P1l bloats PR2 past 400 lines (Med) | Adaptation per Autonomous P1l Decision |
| PR2 base lacks merged trace symbols (Low) | PR2 verifies `e553648` ancestry or symbol importability before any `canonicalTrace` write; aborts if check fails |
| U3-TAG-001 / voice drift / free-text math (Low) | New tag is additional, not replacement; AGENTS.md voice + shape tests |

## Rollback Plan

Revert PR2 then PR1. STATUS abandoned if delivery stops. Archived `recuperar-u3-fundacion-minima` and read-only source stay immutable.

## Dependencies

- Prerequisite: `recuperar-u3-fundacion-minima` (merged `0cf2c51`).
- Read-only source: `0f79d63` (P1l structure only).
- **PR2 only**: canonical-trace dependency SATISFIED by PR #98 (merge commit `e553648079cd7b6f9864683d4ab4d694b4f6a8e7`; head `feat/u3-traza-canonica-parser` @ `d4c77a5`), delivering `parseOptionalCanonicalTrace` and `auditU3TraceSourceUse` to `main`. PR2 implementation MUST verify `e553648` is an ancestor of its base OR both symbols are importable before writing any `canonicalTrace`.
- Clean base: `origin/main` at PR-start.

## Success Criteria

- [ ] `pnpm run test`/`typecheck`/`build` green after each PR
- [ ] PR1 ≤400 lines; PR2 ≤400 lines; no `size:exception`
- [ ] PR1 makes `u3_aislamiento_incorrecto` reachable; PR2 ships P1l + challenge + `u3_racionalizacion_irracional` end-to-end
- [ ] U2, read-only source, `feat/align-u3-practice-official-exercises` unchanged
- [ ] Each PR preview-deploys as a meaningful pedagogical milestone