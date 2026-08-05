# U3 Canonical Practice Deployment Specification

## Purpose

Cross-cutting contract for progressive recovery and deployment of Unit 3 canonical practice as ten independently deliverable topic milestones. Governs milestone independence, foundation contracts observed on existing parsers, structured answer controls, verification gates, language-modeling non-duplication, recovery-vs-fresh recording, rollback scope evidence, and product voice.

## Requirements

### Requirement: Milestone Independence and Existing Foundation Contracts

The ten milestones (foundation, linear equations, quadratic equations, absolute value, product/quotient inequalities, line geometry, systems, exponentials, logarithms, final audit) MUST each be independently previewable, verifiable, mergeable, and deployable to Vercel preview. A milestone MAY span a short chain of coherent PRs; every PR MUST stay within the 400-line review budget. Foundation contracts are OBSERVED on the existing parser/validator surface, not invented:

| Observed contract | Behavior |
|---|---|
| Structured-math answer validation | Base exercise validator rejects prohibited structured-math answer shapes at parse time |
| Trace path resolution | Canonical trace paths resolve within repository boundary |
| Catalog ordering | Ordering uses `progressionFamily` / `progressionOrder` deterministically |
| Loader compatibility | Load and validate entries stay backward-compatible with `pre-utn.practice.v1` |

Content JSON MUST remain plain arrays; provenance MUST stay OpenSpec-only (recorded in `tasks.md` and/or `apply-progress.md`) and MUST NOT appear as a runtime field on content JSON. The foundation MUST NOT introduce a `structured answer control registry` or a generic verification harness.

#### Scenario: foundation enables a topic without coupling

- GIVEN the foundation milestone is merged
- WHEN a topic slice integrates against the foundation
- THEN the slice's PR contains only topic-specific content
- AND no new runtime field (`provenance`, etc.) is introduced on content JSON
- AND existing parsers, loaders, and frozen fixtures remain green

### Requirement: Content Controls

Topic slices MUST use structured input controls (multiple-choice, numeric, two-numeric, interval selector, real/imaginary-part selector, step ordering, error detection). Free-text MUST NOT be used for square roots, fractions with roots, intervals, solution sets with union/intersection, complex `a+bi`, two-solution pairs, or complete logarithmic expressions. Structured-answer validation for this change targets exercise and challenge answer fields (`expectedAnswer`); worked-example `finalAnswer` is out of scope for this change. UI copy MUST match the support-material voice; slices MUST NOT introduce "Tu profesor digital", "primero miro tu punto de partida", "plan personalizado", or any claim that personifies the app as a tutor.

#### Scenario: prohibited shape replaced and forbidden copy blocked

- GIVEN a topic slice with a two-solution-pair exercise and feedback copy under review
- WHEN the slice is authored and the voice audit runs
- THEN `expectedAnswer` is rendered as two MC options or two numeric inputs AND every forbidden token match is reported

### Requirement: Recovery-vs-Fresh Recording in OpenSpec Metadata

Each topic slice MUST declare its provenance in `openspec/changes/recuperar-u3-practica-canonica/tasks.md` and/or `apply-progress.md`, NOT on the content JSON header. Foundation, linear equations, quadratic equations, absolute value, product/quotient inequalities, line geometry MUST be `recovered` (from read-only range `05639d48..0f79d634` on branch `feat/align-u3-practice-official-exercises`). Systems, exponentials, logarithms MUST be `fresh-authored`.

#### Scenario: provenance enforced per slice

- GIVEN a topic slice PR
- WHEN the slice's OpenSpec metadata is inspected
- THEN `provenance` matches the expected assignment
- AND no `provenance` field exists on the content JSON header

### Requirement: Verification Gates per Integration

Before any topic slice integrates, the slice MUST pass focused tests plus `pnpm run test`, `pnpm run typecheck`, and `pnpm run build`. `src/components/practice/challenges/useChallengeFlow.ts` MUST NOT be modified.

#### Scenario: full gate passes before integration

- GIVEN a topic slice ready to integrate
- WHEN the gate runs
- THEN all three commands exit zero AND no diff to `useChallengeFlow.ts` is present

### Requirement: Cross-Slice Constraints

Topic slices MUST NOT duplicate content owned by `mat.u3.traduccion_lenguaje_verbal` (change `fortalecer-u3-lenguaje-modelizacion-transferencia`); the slice MUST run a non-overlap audit and resolve any overlap. Each integrated milestone MUST be revertible independently of subsequent milestones. Source branch `feat/align-u3-practice-official-exercises`, its commits, and dead review lineage MUST remain untouched.

#### Scenario: per-milestone revert and non-overlap enforced

- GIVEN milestones M1 and M2 integrated on `main` and a slice M3 overlapping the language-modeling change
- WHEN M1 is reverted AND the M3 non-overlap audit runs
- THEN M2 remains fully intact AND the M3 overlap is reported by id
- AND M3 MUST NOT integrate until the overlap is removed