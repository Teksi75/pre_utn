## Exploration: section-card-topic-count

### Current State

The `/learn/matematica` page renders one card per theory node. Each card currently
shows:

1. The **section title** (from `PILOT_SKILLS` / `TheoryNode`).
2. The **first subtopic** (`{node.concepts?.[0]?.title ?? "Teoría del tema"}`).

The "first subtopic" line is what's confusing the user. For `Operaciones con
polinomios`, the three internal concept blocks are:

| # | id | title |
|---|----|-------|
| 1 | `concept-op-suma-resta` | "1. Suma y resta de polinomios" |
| 2 | `concept-op-multiplicacion` | "2. Multiplicación de polinomios" |
| 3 | `concept-op-division` | "3. División larga de polinomios (procedimiento)" |

So the card literally reads "Operaciones con polinomios / 1. Suma y resta de
polinomios" — which can be misread as the *full* section content being "Suma y
resta" only. The other two topics (multiplicación, división) are invisible until
the user clicks through. That is the user-visible problem.

The data needed to fix this is already in the model:
`TheoryNode.concepts: readonly ConceptBlock[]` — `.length` gives the topic count
without touching the domain shape, and the order is the canonical pedagogical
order, so the count is honest (no remapping).

**Source of truth** (where the content is):
- `content/matematica/theory/unit-2.json` — raw concept blocks (read at build
  time by `src/domain/catalog/content-loaders.ts:471`).
- `src/app/learn/matematica/page.tsx` — the page that renders the section cards.

**Existing tests that touch this area** (verified by grep):
- `src/domain/__tests__/catalog-content.test.ts:386` asserts
  `polNode!.concepts[0].title` for `polinomios_basico` (NOT
  `operaciones_polinomios`). This is a content-shape test, independent of the
  card layout. **Will not be broken by the card change.**
- No test currently asserts on the rendered text of
  `src/app/learn/matematica/page.tsx` (verified — no `Teoría del tema` or
  `concepts[0].title` reference in any `.test.ts(x)` under `src/app` or
  `tests/`).
- E2E specs (`tests/e2e/specs/operaciones_polinomios.spec.ts` and others) go
  through the practice flow, NOT the learn index. **Unaffected.**

### Affected Areas

- `src/app/learn/matematica/page.tsx` (lines 60–67) — replace
  `{node.concepts?.[0]?.title ?? "Teoría del tema"}` with a topic-count line
  using `node.concepts.length` and a Spanish plural helper. Drop the
  fallback "Teoría del tema" — every pilot skill has at least one concept
  block (enforced by `validateTheoryNode` in
  `src/domain/models/theory.ts:90` and the `every U2 node has concepts`
  test in `catalog-content.test.ts:301`).
- `content/matematica/theory/unit-2.json` — rename the third concept title
  for the `operaciones_polinomios` node: change
  `"3. División larga de polinomios (procedimiento)"` →
  `"3. División de polinomios"`. This is the only content correction needed;
  the concept order, ids, and bodies stay the same.
- **NOT touched** (per the user's "Do not modify" list): `MathWatermark`,
  `DirectionalTransition`, the `Nav` / sidebar / footer, the
  `[skillId]/page.tsx` theory detail page, the `TheoryCard` component, any
  other page, and unrelated spec changes.

### Approaches

1. **Inline JSX change in `page.tsx`** — replace the first-subtopic line with
   a topic-count line computed from `node.concepts.length` and a tiny
   singular/plural helper (e.g. `count === 1 ? "1 tema" : `${count} temas``).
   - Pros: Minimal diff, no new files, no domain changes, the data is
     already in the model, pluralization is trivial.
   - Cons: Pluralization logic is a tiny inline expression (acceptable for
     a single-use string in one component).
   - Effort: **Low** (~10–15 LOC change + 1–2 tests).

2. **Extract a `SectionCard.tsx` component** — move the card markup to its
   own file under `src/components/learn/` with props `{ title, topicCount,
   href }`.
   - Pros: Reusable if other subjects (Física) reuse the same layout later;
     cleaner separation of concerns.
   - Cons: One-page change today; introducing a new component for a single
     consumer is over-engineering. Can be extracted later if/when Física
     reuses it.
   - Effort: **Medium** (new file + tests + a small refactor of the page).

3. **Add a `topicCount` (or `summary`) field to a domain view-model** —
   e.g. a `buildSectionCardModel(theoryNode)` helper in
   `src/domain/catalog/`.
   - Pros: Testable from the domain layer; aligns with the project's
     "domain pure" rule.
   - Cons: The data is `concepts.length` — adding an indirection for a
     1-line computation gains nothing. Would be the right call if we had a
     richer card model (status, progress, etc.), but we don't, and the
     user explicitly limited scope to the section card itself.
   - Effort: **Medium** (new helper + tests + import update).

**Recommendation: Approach 1.** The change is purely a presentational fix
to one JSX block and one content rename. The model already carries the
truth; we just need to stop reading the wrong slice of it. Extracting a
component or a domain view-model can be done later if the same shape is
reused (e.g. Física), but doing it now adds files without paying for
itself.

### Risks

- **Pedagogical**: the count must reflect the *actual* number of subtopics
  the user will see, not the length of some other array. We use
  `node.concepts.length` which is exactly the array rendered in
  `TheoryCard.tsx` (line 54: `node.concepts.map((concept) => …)`). Honest
  count, no drift possible.
- **Pluralization**: a unit-1 skill (`potencias_raices`) has 7 concepts, so
  the multi-topic case is the common one. The "1 tema" branch only matters
  if a future skill ships with a single concept block — the existing tests
  already accept `>= 1` concept blocks per node, so the branch needs to
  exist to be correct under that future possibility. The branch is
  one ternary; risk is low.
- **Content rename**: changing the third concept title from
  "3. División larga de polinomios (procedimiento)" to
  "3. División de polinomios" only affects (a) the new topic-count line
  is not affected because we don't show concept titles, and (b) any
  future test or feature that asserts the literal title. Verified by grep:
  no test asserts on the literal "División larga de polinomios". The
  remaining references to "División" in `src/` are inside the error
  taxonomy (`src/domain/error-taxonomy/index.ts:172` — "División de
  complejos" — different concept) and are unaffected.
- **Test coverage**: the existing tests don't cover the rendered text of
  the learn/matematica section cards, so the bug the user is reporting
  shipped without a test catching it. A new render test for the
  section-card content (no first subtopic, exact count, "tema" vs
  "temas", the title stays, the card is still a single `Link`) is part
  of the proposal. This is the durable regression guard the project
  needs for future content changes.
- **No spec change is required outside `openspec/changes/section-card-topic-count/`**
  — the change is scoped to one page, one content field, and the
  render-test surface. The existing
  `openspec/specs/math-skill-model/spec.md` and
  `openspec/specs/guided-practice/spec.md` are not affected.
- **Multi-PC coordination**: this change is small enough to live on a
  single branch; no need to update `openspec/changes/STATUS.json` yet
  (it gets updated on merge per the AGENTS.md "Gestión de ramas SDD"
  section).

### Ready for Proposal

**Yes** — the scope is small, well-bounded, and reversible (one JSX block
+ one JSON string). The user has been explicit about:

- The new card content (title + "N tema(s)").
- The forbidden elements (no first subtopic, no full list, no manual
  description, no textual CTA — the card remains the `Link` it already
  is).
- The content correction ("División de polinomios").
- The off-limits surfaces (background, global layout, sidebar, footer,
  other pages, watermark, unrelated changes).

The orchestrator can move to `sdd-propose`. The proposal should make
explicit: (1) the JSX rewrite in `page.tsx`, (2) the title rename in
`content/matematica/theory/unit-2.json` for the `concept-op-division`
concept block, (3) a new render test asserting the new card contract for
at least two units (one with N > 1 and one with N = 1 if available, or
otherwise the `operaciones_polinomios` and `potencias_raices` nodes
as the two cases).
