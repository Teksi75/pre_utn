# Proposal: Unit 1 Rotonda Problem-Solving Capstone

## Intent

Add a non-blocking end-of-Unit-1 surface for an integrative problem. It supports practice without replacing teaching or changing mastery. Copy is neutral professional Spanish for one unified Ingenium app; no attribution.

## Pedagogical Outcome

The alumno connects modeling, units, distance, constraints, and exact/approximate values through Comprender; Buscar un plan; Llevarlo a cabo; Verificar; Comunicar.

## Scope

### In Scope
- Prominent card tied to genuine unit completion, never one skill/`Dominada`.
- Theory: Cartesian plane/cardinal directions, 2D distance/Pythagoras, unit conversion/modeling, radius/diameter, maximum constraints, and exact/approximate values.
- Five stages use single-select, true/false, and numerical inputs; stage 3 owns the full calculation chain, stage 4 verifies.
- Resumable tracking.

### Out of Scope
- Diagram/visual, multi-select, free-text structured math, or new answer controls.
- Other units, teacher panel, or source institution/faculty/program/location claims.

### Non-Goals
- Blocking Unit 2, redefining mastery, or changing base-practice/challenge semantics.
- Choosing route, storage, module boundaries, or PR slices; design decides.

## Learner Journey

1. Unit 1 completion presents the card.
2. The card opens theory, then the sequence.
3. Prompts preserve modeling without premature disclosure.
4. Progress resumes; Unit 2 independent.

## Capabilities

### New Capabilities
- `unit-1-end-of-unit-capstone`: tracked end-of-unit surface, theory, and guided rotonda sequence.

### Modified Capabilities
- None. Mastery, practice, challenge, learn-card, and Unit 2 access contracts remain unchanged.

## Approach

Reuse evaluator, accessibility, and interaction contracts in an isolated runner. Leave the practice phase machine and base progress untouched; design selects integration.

## Affected Areas

| Area | Impact | Deliverable |
|---|---|---|
| `content/matematica/` | New | Theory and stage content. |
| Home, learn, capstone UI, domain/lib/tests | New/Modified | Card, runner, tracking, contracts. |

## Acceptance Direction

- Unit-level signal; never a single-skill completion or `Dominada` trigger.
- Stages preserve contextual communication, units, and `\cong` versus `=` discipline.
- Supported controls only; no diagram, multi-select, or free-text structured math.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Diagram omission harms comprehension | Med | Theory, prompts, staged reveal. |
| Tracking contaminates mastery | Low | Isolated state, regression tests. |
| Brand/source drift or scope growth | Med/High | Voice scans; auto-chain. |

## Rollback Plan

Remove capstone content, entry, runner, and isolated state; retain behavior.

## Dependencies

- `docs/sdd/13-adr-foundation.md` (ADRs 001, 005, 006, 007, 008, 009).
- Apply MUST start in a dedicated feature branch/worktree; this proposal was created on `main`, so registry `branch` is `null`.
- 400-line budget; `auto-chain` delivery.

## Success Criteria

- [ ] Card opens theory and sequence at Unit 1 completion.
- [ ] Topics and stages use supported controls.
- [ ] Tracking is visible/resumable/non-blocking; mastery and Unit 2 unchanged.
