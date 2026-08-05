# Proposal: Selective Recovery of U3 Canonical Practice

## Intent

Selectively recover valid Unit 3 work from read-only source range `05639d48..0f79d634` instead of rebuilding from zero or continuing its megabranch. Practice must align with `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`, progressing from foundations to official maximum difficulty.

Complete topics must be previewable, verifiable, mergeable, and deployable before the whole unit is finished.

## Scope

Deliver these milestones in order:

1. Minimal shared foundation.
2. Linear equations.
3. Quadratic equations.
4. Absolute value.
5. Product/quotient inequalities.
6. Line geometry.
7. Systems.
8. Exponentials.
9. Logarithms.
10. Final canonical-coverage audit.

Foundation and the first five topics selectively recover source ideas, content, and test scenarios. Systems, exponentials, logarithms, and the final audit require fresh authoring.

## Delivery

Each topic is a deployable milestone. A milestone may contain a short chain of coherent PRs when necessary, but every PR must remain within the 400-line review budget. Splits must follow pedagogical or architectural boundaries; tests stay with the behavior they prove.

Before integration, every PR must pass focused tests plus:

- `pnpm run test`
- `pnpm run typecheck`
- `pnpm run build`

Exact file layout and helper signatures are deferred to design. Expected coarse surfaces include current domain models, catalog and evaluator modules, safe trace/challenge utilities, Unit 3 content JSON, focused tests, and OpenSpec deltas.

## Constraints and Non-Goals

- Preserve `mat.u3.traduccion_lenguaje_verbal`, owned by `fortalecer-u3-lenguaje-modelizacion-transferencia`.
- Do not modify `src/components/practice/challenges/useChallengeFlow.ts`.
- Do not restore unsafe monolithic files, large tests, archived artifacts, or previous spec mutations wholesale.
- Use structured controls—not free text—for structured mathematical answers.
- Preserve the product voice: support material, never an autonomous digital teacher.
- Keep `feat/align-u3-practice-official-exercises`, its commits, and dead review lineage `align-u3-practice-official-exercises-committed-range` untouched.

## Risks

- Recovered behavior may inherit defects: recover narrowly with focused TDD.
- A topic may exceed 400 lines: split it without sacrificing deployable value.
- Fresh topics may drift from the PDF: require canonical traceability and progression evidence.
- Topic content may overlap existing language-modeling work: verify ownership before each integration.

## Success Criteria

- Each milestone is independently previewable and deployable.
- Each PR is at most 400 changed lines and passes all required verification.
- Unit 3 reaches canonical maximum difficulty with no duplicated language-modeling content.
- The final audit proves coverage, progression, structured-answer compliance, and traceability.
- The source branch and incomplete review remain unchanged.

## Next Phase

Write delta specs per milestone, then design the minimal foundation and validate realistic PR boundaries before implementation.
