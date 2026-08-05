## Exploration: Fix catalog parseExerciseId GGA blocker
### Current State
`parseExerciseId()` validates catalog JSON with the same broad pattern used by `validateExercise()`. GGA 2.10.1 reports a domain-TDD violation because this loader boundary lacks focused valid/malformed-ID tests; existing tests only cover valid IDs indirectly.
### Affected Areas
- `src/domain/__tests__/content-loaders.test.ts` — add focused boundary characterization.
- `src/domain/catalog/content-loaders.ts` — inspected direct caller; no production change is currently justified.
- `src/domain/models/exercise.ts` — confirms the duplicated runtime contract and existing validator tests.
### Approaches
1. **Characterize the existing boundary** — test numeric and slug IDs plus malformed prefix/unit/segment cases.
   - Pros: resolves the reproduced finding without behavior change. Cons: leaves duplicate regexes. Effort: Low.
2. **Tighten and share one regex** — reject spaces, extra dots, slash characters, and malformed hyphens.
   - Pros: stronger invariant. Cons: changes an underspecified public contract and exceeds the blocker scope. Effort: Medium.
### Recommendation
Choose approach 1: add one parameterized acceptance test and one parameterized rejection test. Forecast: ~18 test lines plus this 19-line artifact; no production edit.
### Risks
- GGA also reports a separate pre-existing `canonicalTrace` type-safety issue; it is explicitly outside this change.
- Tightening the regex without a new contract decision could reject future ID shapes despite all 226 current general-exercise IDs remaining compatible.
### Ready for Proposal
Yes — proceed as a minimal test-only technical prerequisite, then run focused/full tests, typecheck, build, and GGA before a direct PR to `main`.
