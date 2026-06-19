# Design: Expand Factorization Worked Examples

## Technical Approach

Keep `content/matematica/examples/unit-2.json` as the only worked-example source and expand the `mat.u2.factorizacion` subset from five to nine entries. New IDs `example-factorizacion-6` through `-9` cover Cases 1, 2, 4, and 7; existing IDs retain their content identity. The JSON order becomes `6, 7, 2, 8, 1, 3, 4, 5, 9`, yielding Cases 1→7 while keeping the three Case 6 variants adjacent. Learn and Practice continue filtering the ordered output of `loadExampleContent("unit-2")`; no consumer-specific list is introduced.

Replace animated pixel ceilings with conditional rendering. Closed disclosures do not mount their content; open disclosures render at intrinsic height, so neither nine cards nor a long solution can be clipped. Preserve the current controls and add the missing `aria-expanded` contract to each solution toggle.

## Architecture Decisions

| Decision | Alternatives considered | Rationale |
|---|---|---|
| Encode pedagogical order in the canonical JSON array while preserving IDs | Renumber IDs; sort in each consumer | Feedback targets already reference IDs 1–3. Source ordering gives Learn and Practice identical progression without duplicate policy. |
| Represent case identity in human-readable problem/step text, not a new model field | Add `factorizationCase`; infer only from algebra | This is a bounded content expansion and the proposal excludes new content models. A stable `Caso N` marker makes coverage testable and visible to students. |
| Conditionally mount disclosure bodies | Increase `max-height`; measure `scrollHeight`; CSS grid animation | Conditional rendering has no ceiling, removes hidden mounted cards, and needs no measurement/effect state. Losing the height animation is preferable to clipping and accessibility debt. |
| Test semantic invariants instead of full copy | Snapshots; exact paragraph assertions | Pedagogical wording must remain editable while count, identity, progression, validation, traceability, result, and check contracts stay protected. |

## Data Flow

```text
unit-2.json → loadExampleContent → filter by skillId
                                  ├→ LearnSkillPage → WorkedExamplesSection
                                  └→ usePracticeFlow → PracticeExamplePhase
Both paths → WorkedExampleCard → RichText
```

No sequence diagram is needed: loading is synchronous and there are no new side effects or service boundaries.

## File Changes

| File | Action | Description |
|---|---|---|
| `content/matematica/examples/unit-2.json` | Modify | Add Cases 1, 2, 4, 7; reorder nine examples; retain IDs 1–5 and all Case 6 content. Each entry names its case, ends with `finalAnswer`, includes an expansion check, focused error note, and canonical trace. |
| `src/domain/__tests__/factorizacion-worked-examples.test.ts` | Create | Assert exact ordered IDs, nine unique examples, Cases 1–7, preserved Case 6 trio, `validateWorkedExample` success, sequential steps, final-result repetition/check, and trace/error-note presence. |
| `src/components/practice/WorkedExamplesSection.tsx` | Modify | Conditionally render the collection; remove `maxHeight`, `overflow-hidden`, and height transition. |
| `src/components/practice/WorkedExampleCard.tsx` | Modify | Conditionally render resolution; remove its ceiling; expose `aria-expanded`. |
| `src/components/practice/__tests__/WorkedExamplesSection.test.tsx` | Create | Server-render the closed disclosure and assert the toggle contract, absence of mounted examples, and absence of inline height ceilings. |
| `src/components/practice/__tests__/WorkedExampleCard.test.tsx` | Create | Assert the closed solution toggle contract and that solution/final-answer content is not mounted initially. |
| `tests/e2e/specs/factorizacion.spec.ts` | Modify | Verify Learn reveals nine ordered cards and the last full solution; verify Practice begins with the same first example and advances in the same order; repeat disclosure/overflow assertions at 375px. |

## Interfaces / Contracts

No production interface changes. Content invariants are:

```ts
const orderedIds = [
  "example-factorizacion-6", "example-factorizacion-7",
  "example-factorizacion-2", "example-factorizacion-8",
  "example-factorizacion-1", "example-factorizacion-3",
  "example-factorizacion-4", "example-factorizacion-5",
  "example-factorizacion-9",
] as const;
```

## Testing Strategy

| Phase | Evidence |
|---|---|
| RED | Add focused domain and disclosure tests first; they fail at count/order/coverage and mounted-or-clipped behavior. |
| GREEN | Add/reorder JSON and switch both disclosures to conditional intrinsic-height rendering. |
| REFACTOR | Consolidate test helpers only; keep production loader/model unchanged. Run focused tests, `pnpm run test`, `pnpm run typecheck`, and `pnpm run build`. |
| Responsive | Run targeted Playwright on desktop and 375px; assert nine cards, visible final solution, and `scrollWidth <= clientWidth` for page/cards. |

## Migration / Rollout

No data migration or feature flag is required. Roll back content, UI, and tests together.

## Open Questions

None.
