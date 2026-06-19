## Exploration: Expand `mat.u2.factorizacion` worked examples (GitHub #38)

### Current State
`content/matematica/examples/unit-2.json` now contains five examples for `mat.u2.factorizacion`, not the two described when issue #38 was opened. Examples 1–2 cover difference of squares and a perfect-square trinomial; examples 3–5 were added by issue #42 and all cover Case 6 (equal-degree powers), including two methods for the same expression. The current set is valid but is neither a progressive tour nor varied across the seven canonical cases.

The canonical Unit 2 material (Chapter 13, PDF pages 9–14) defines seven cases in this order: common factor, grouping, perfect-square trinomial, perfect-cube polynomial, difference of squares, equal-degree powers, and quadratic trinomial. Four cases still lack a worked example: common factor, grouping, perfect cube, and quadratic trinomial.

Learn and Practice already reuse the same JSON collection through `loadExampleContent`: Learn renders every matching example, while Practice walks the same ordered array before exercises. Existing feedback recovery targets depend on stable IDs `example-factorizacion-1`, `-2`, and `-3`, so those IDs must not be renumbered.

The rendering has a concrete scalability defect: `WorkedExamplesSection` clips the complete collection at a hard-coded `3000px`, and each expanded `WorkedExampleCard` clips its solution at `1200px`. Seven or more long cards can therefore become unreadable, especially on narrow mobile layouts. Hidden cards also remain mounted inside an `aria-hidden` container.

### Affected Areas
- `content/matematica/examples/unit-2.json` — add canonical, step-by-step examples and order the collection pedagogically without changing existing IDs.
- `src/domain/__tests__/factorizacion-worked-examples.test.ts` (new) — lock count, validation, canonical-case coverage, progression, stable IDs, and explicit final results using content semantics rather than brittle full-copy snapshots.
- `src/components/practice/WorkedExamplesSection.tsx` — remove the fixed-height collection ceiling so Learn can reveal an arbitrary number of examples without clipping.
- `src/components/practice/WorkedExampleCard.tsx` — remove the fixed-height solution ceiling so long steps remain readable on desktop and mobile.
- `src/components/practice/__tests__/WorkedExamplesSection.test.ts` (new or equivalent focused test) — characterize unbounded disclosure and prevent regression to hard-coded height clipping.
- `tests/e2e/specs/factorizacion.spec.ts` — if browser coverage is extended, verify the Learn collection and Practice sequence reuse the same examples and do not overflow at a mobile viewport; exercise answers and navigation logic need no change.
- `openspec/specs/theory-paragraph-model/spec.md` — downstream delta spec should preserve the three Case 6 requirements from issue #42 while adding the broader count/coverage/progression contract.

### Approaches
1. **Add the four missing canonical cases and make disclosure content-sized** — create examples 6–9 for common factor, grouping, perfect cube, and quadratic trinomial, then order all nine by canonical difficulty while preserving IDs and feedback links.
   - Pros: covers all seven cases; makes “varied and progressive” objectively testable; stays coherent with current theory and exercises; keeps one content source for Learn/Practice; eliminates desktop/mobile clipping.
   - Cons: Practice will walk nine examples before exercises, increasing time-to-practice; touches two small UI components in addition to content/tests.
   - Effort: Medium

2. **Add only two examples to reach seven** — append two missing cases and retain the current rendering.
   - Pros: smallest content diff; meets the numeric threshold literally.
   - Cons: leaves two canonical cases without worked examples; the three-example Case 6 cluster still dominates; does not prove progression; fixed-height clipping becomes more likely and violates the legibility requirement.
   - Effort: Low

3. **Replace or renumber existing examples into exactly seven** — reshape the current set into one example per case.
   - Pros: shortest Practice walkthrough and clean one-case-per-example structure.
   - Cons: conflicts with the archived issue #42/main-spec contract requiring all three Case 6 examples; breaks feedback recovery targets or requires migrations; discards useful alternative-method instruction.
   - Effort: High

### Recommendation
Use Approach 1. Add four examples adapted from the canonical Chapter 13 progression: a maximum common factor example, a grouping example, a perfect-cube polynomial, and a quadratic trinomial with `a ≠ 1`. Each example should name the case in its first step, show ordered transformations, store the fully factored expression in `finalAnswer`, repeat it in the final step with an expansion check, and include canonical trace plus a focused error note.

Keep all existing IDs stable and reorder only the JSON entries so the learner sees Cases 1→7 progressively; the three Case 6 examples remain adjacent as alternative/advanced variants. Do not duplicate examples between Learn and Practice or modify exercises: both flows already consume the same loader output. Replace fixed pixel-height disclosure with content-sized/conditional disclosure so arbitrary step and collection lengths cannot be clipped; verify at desktop and approximately 375px mobile width. Because the issue changes domain content, implementation should follow RED→GREEN→REFACTOR with a dedicated factorization-example test before JSON edits.

### Risks
- Nine mandatory examples in Practice may delay exercises; this is existing flow behavior and should be made explicit in the proposal. A future selectable/skip example flow is a separate product change.
- Reordering is safe for identity-based feedback, but any hidden index-based analytics assumption should be checked before implementation.
- Full-copy snapshot tests would make pedagogical editing brittle; assert structure, case coverage, ordering, and final-result invariants instead.
- Long unbroken math can still overflow horizontally if future examples introduce wide display formulas; keep new expressions concise and include a 375px browser check.
- `openspec/changes/STATUS.json` does not yet register this change. The explore skill permits creating only `exploration.md`, so the orchestrator must add the required in-progress entry (and branch) separately.

### Ready for Proposal
Yes. The current code and canonical source support a content-first change with a small disclosure fix. The proposal should commit to nine total examples (all seven cases represented), stable existing IDs, shared Learn/Practice data, no exercise/evaluator changes, focused TDD, and desktop/mobile no-clipping verification.
