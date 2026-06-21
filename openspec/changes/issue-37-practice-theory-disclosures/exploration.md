# Exploration: issue-37-practice-theory-disclosures

> **Status:** Complete
> **Date:** 2026-06-21
> **Issue:** #37 — `content(practice): revisar contenido vacío en botones de notación y errores comunes`
> **Branch (target):** new feature branch off `main`

---

## 1. Executive Summary

In `/practice`, the U2 theory step always renders two disclosure buttons — `+ Ver notación` and `+ Ver errores comunes` — but for every one of the seven U2 theory nodes the underlying arrays are empty, so clicking them reveals an empty `<ul>`. U1 and U3 nodes carry real content in those arrays; U2 does not. The issue offers two valid resolutions: author useful content where pedagogically valuable, or hide/disable the buttons when there is nothing to show. The recommendation is **both, scoped**: relax the domain invariant so empty arrays are legal, hide the buttons when empty, and author content for the U2 nodes where the source `conceptBlocks` already carry the right material (Ruffini sign, TCP, MCM/MCD, ecuaciones fraccionarias, plus factorización general). The change is TDD-able, preserves `src/domain/` purity, and respects Ingenium voice (no profe-digital claims).

Estimated diff: ~250 lines. Single PR comfortably inside the 400-line review budget — verify after `sdd-tasks`.

---

## 2. Current State

### 2.1 TheoryCard always renders both disclosure buttons

`src/components/practice/TheoryCard.tsx:122-162` unconditionally renders the `+ Ver notación` and `+ Ver errores comunes` buttons and maps over `node.notation` / `node.commonMistakes`. When the arrays are empty, clicking the button reveals an empty `<ul>` — no heading, no placeholder, just whitespace. The toggle state (`showNotation` / `showMistakes`) is per-component, defaults to `false`. The button uses min-h-44 for accessibility, so the empty click target is real.

### 2.2 U2 nodes have no top-level notation / commonMistakes

`content/matematica/theory/unit-2.json` has 7 nodes. None of them declare `notation`, `commonMistakes`, or `practicePrompts`. All the pedagogical content lives inside `conceptBlocks[].body` or `conceptBlocks[].bodyParagraphs`. Several concept blocks already embed the equivalent of a common mistake as inline prose — e.g. `concept-ruffini-signo`, `concept-fac-tcp`, `concept-mcm-mcd-definicion`, `concept-ec-frac-dominio` all carry sentences that begin with "Error frecuente: …". That material is the natural lift source.

### 2.3 Loader normalizes missing arrays to `[]`

`src/domain/catalog/content-loaders.ts:140-146` (`parseOptionalStringArray`) returns `[]` when the field is `undefined`, `null`, or not an array. `parseTheoryNode` (lines 402-428) feeds `notation`, `commonMistakes`, and `practicePrompts` through that helper. So missing JSON keys become empty arrays on the parsed `TheoryNode`.

### 2.4 Validator still rejects empty arrays

`src/domain/models/theory.ts:99-107` (`validateTheoryNode`) returns `Err` when `notation` or `commonMistakes` is empty. This is the legacy invariant. `src/domain/__tests__/catalog-content.test.ts:330-339` ("U2 nodes with non-empty notation/commonMistakes validate successfully") already **filters** to nodes that have both arrays non-empty before validating, so this test does not require U2 nodes to satisfy the invariant — it explicitly accommodates the empty case. The test on line 305 ("every U2 node has notation, commonMistakes, and practicePrompts arrays") only checks that the arrays exist as arrays, not that they are non-empty.

### 2.5 U1 and U3 nodes are unaffected

`content/matematica/theory/unit-1.json` and `unit-3.json` both carry non-empty `notation`, `commonMistakes`, and `practicePrompts` arrays (e.g. U3 `theory-ecuaciones-lineales:39-53`). The disclosure buttons for U1/U3 reveal real content today. The U2 empty state is the regression being fixed.

### 2.6 TheoryCard is shared across `/practice` and `/learn`

`src/app/practice/page.tsx:80-91` renders `PracticeTheoryPhase` → `TheoryCard`. The Aprender side (`src/app/learn/matematica/[skillId]/page.tsx`) also renders `TheoryCard` (verified by `TheoryCard.test.tsx` working as a contract test for both surfaces). Any change to `TheoryCard` propagates to both, which is desirable.

### 2.7 Existing test surface for the affected logic

- `src/components/practice/__tests__/TheoryCard.test.tsx` — 435-line `renderToStaticMarkup` contract test. Has a `makeNode({ ...overrides })` helper. No existing test covers the "empty notation/commonMistakes → no button" path.
- `src/domain/__tests__/catalog-content.test.ts:291-388` — U2 normalization tests; explicit accommodation of empty U2 arrays.
- `src/domain/models/theory.ts` — no dedicated `theory-validation.test.ts` exists. The current "validate rejects empty" contract is asserted indirectly via `catalog-content.test.ts:34-40` and `:330-339`.

---

## 3. Affected Areas

| Path | Why it's affected |
|------|-------------------|
| `src/components/practice/TheoryCard.tsx` (lines 122-162) | Two button blocks always rendered; needs conditional render gated on `node.notation.length > 0` / `node.commonMistakes.length > 0`. Pure UI — outside `src/domain/`. |
| `content/matematica/theory/unit-2.json` (7 nodes) | Needs node-level `notation` and `commonMistakes` arrays authored for the nodes where the source content already exists. Content-only change. |
| `src/domain/models/theory.ts` (lines 99-107) | `validateTheoryNode` rejects empty `notation`/`commonMistakes`. To allow empty arrays as a first-class state (so hide-when-empty is honest), the validator must drop those two assertions. Pure data-shape change — domain stays free of UI. |
| `src/domain/__tests__/catalog-content.test.ts` (lines 305-339) | Test text needs to stay coherent with the new invariant; the existing "filters to non-empty before validating" pattern still works. May want to add a NEW assertion: "every U2 node has a defined array (possibly empty)". |
| `src/components/practice/__tests__/TheoryCard.test.tsx` | Add a `describe("disclosure buttons", …)` block: (a) node with empty notation renders NO `Ver notación` button; (b) node with non-empty notation renders the button and the bullets; (c) mixed (one empty, one not) renders only the populated button. |
| `openspec/specs/theory-paragraph-model/spec.md` | NOT a spec change. The paragraph-model invariant that lifted content must stay verbatim in concept bodies still holds — we are NOT moving prose out of concept bodies; we are ADDING node-level summaries. |
| `openspec/specs/guided-practice/spec.md` | NOT a spec change. Guided-practice does not constrain notation/mistakes disclosure. |

Not affected: any `evaluator*`, `metrics*`, or `recommendations*` module. Issue #37 does not touch scoring or feedback — it is a content + disclosure-surface fix.

---

## 4. Approaches

### 4.1 Approach A — Hide-when-empty only (renderer fix, no content authorship)

- `TheoryCard` conditionally renders each button only when its array is non-empty.
- Validator invariant stays as-is (empty notation/commonMistakes rejected at validate time).
- No content authored.
- Effort: **Low** — ~5-10 lines in TheoryCard + ~30 lines of renderer tests.

| Pros | Cons |
|------|------|
| Smallest blast radius; no JSON edits; no domain schema change; no validator churn | Pedagogically inconsistent: U1/U3 reveal lists, U2 reveals nothing — silent downgrade |
| Fastest TDD cycle (RED: empty-array node renders no button → GREEN: conditional) | Issue explicitly asks to "evaluate adding useful math content where pedagogically valuable" — A skips that half |
| No risk of duplicating or paraphrasing canonical material | The "Error frecuente" prose embedded in concept blocks never surfaces as a disclosure list, so it stays buried mid-paragraph |

### 4.2 Approach B — Author content for all 7 U2 nodes, keep validator strict

- Author `notation` (3-5 entries) and `commonMistakes` (3-5 entries) for every U2 node.
- Lift "Error frecuente" prose from concept blocks into `commonMistakes` for the 4 nodes that have natural lifts; author notation summaries for all 7.
- Validator invariant stays.
- Effort: **High** — 7 × ~8 lines of new content = ~56 lines of authored JSON, plus the renderer test stays unchanged.

| Pros | Cons |
|------|------|
| Pedagogically complete and uniform — every U2 step behaves like U1/U3 | Forces synthetic content for nodes whose source is purely definitional (e.g. "Definición de polinomio") |
| No validator change — preserves existing test invariants | Authorship risk — must respect "varied material" AGENTS.md rule and Ingenium voice |
| Single source of truth lives in concept blocks; node-level arrays become a curated index | Larger content surface to review; risk of paraphrasing canonical material |

### 4.3 Approach C — Combined: relax validator + hide empty + author where natural

1. `validateTheoryNode` accepts empty `notation` and `commonMistakes` (drops the two assertions).
2. `TheoryCard` conditionally renders each disclosure button only when its array is non-empty.
3. For U2 nodes where the source `conceptBlocks` already contain natural lift content, author `notation` and `commonMistakes` arrays. For pure-definitional nodes (e.g. `concept-pol-definicion`-heavy nodes that don't carry a "Error frecuente" or a clean notation summary), leave the arrays absent — buttons don't render.
4. U1 and U3 untouched. Existing tests that pass non-empty arrays still pass.

| Pros | Cons |
|------|------|
| Both halves of the issue addressed; gradation (rich nodes get rich disclosure, lean nodes stay clean) | Splits work between code and content — needs TDD coverage for both halves |
| Validator change is small (two assertions to drop + one new test asserting the relaxation) | Slight churn in `catalog-content.test.ts` text |
| Preserves `src/domain/` purity: only data shape changes | The set of U2 nodes that get content authored is a small editorial decision — needs explicit pedadogical review |
| Keeps `/learn` and `/practice` aligned (shared TheoryCard) | None of the other identified |

---

## 5. Recommendation

**Approach C**, scoped as follows:

**Phase 1 — domain relaxation (TDD):**
1. RED: add `src/domain/__tests__/theory-validation.test.ts` asserting `validateTheoryNode({ ...minimally valid node, notation: [], commonMistakes: [] })` returns `Ok`.
2. GREEN: drop the two assertions in `src/domain/models/theory.ts:99-107`. `canonicalTrace` and `id` and `concepts` invariants stay.
3. Update `src/domain/__tests__/catalog-content.test.ts:330-339` test description to clarify it now tests "non-empty arrays still validate" (no behavior change — it still passes).
4. RED/GREEN on `TheoryCard.test.tsx`: empty notation → no `Ver notación` button; empty commonMistakes → no `Ver errores comunes` button. Render both as static HTML and assert absence of substring.

**Phase 2 — content authorship (TDD via catalog-content tests):**
1. RED: extend `catalog-content.test.ts` "U2 normalization" describe block with `"at least N U2 nodes carry non-empty notation AND commonMistakes AND practicePrompts"` (start with `>= 4` and grow if authorship lands more).
2. GREEN: author `notation` + `commonMistakes` arrays for the U2 nodes where natural content exists. **Initial set (high-confidence lifts):**
   - `theory-ruffini-resto` — `commonMistakes` lifts the "Error frecuente" from `concept-ruffini-signo`; `notation` covers `$P(x)$`, `$(x−a)$`, `Resto = P(a)`.
   - `theory-factorizacion` — `commonMistakes` lifts the "Error frecuente" from `concept-fac-tcp`; `notation` covers los 7 casos (can reference them by name).
   - `theory-gauss` — `notation` covers "p divide a₀", "q divide aₙ", "p/q irreducible"; `commonMistakes` covers "olvidar evaluar p/q completo (no solo p)".
   - `theory-mcm-mcd-polinomios` — `commonMistakes` lifts the "Error frecuente: intercambiar MCM y MCD" from `concept-mcm-mcd-definicion`; `notation` covers "factor con MAYOR exponente → MCM", "factor con MENOR exponente → MCD".
   - `theory-ecuaciones-fraccionarias` — `commonMistakes` lifts "resolver algebraicamente sin verificar dominio"; `notation` covers "dominio excluido", "MCM de denominadores".
   - `theory-operaciones-polinomios` — `notation` covers "$P(x) − Q(x) = P(x) + (−Q(x))$" distributiva del signo negativo; `commonMistakes` covers "no distribuir el signo negativo a TODOS los términos".
3. Leave `theory-polinomios-basico` without arrays (the 5 concept blocks are definitional — no clean commonMistakes summary that isn't already a repetition). Buttons won't render.
4. Add `practicePrompts` arrays for the nodes that get content authored (parity with U3).

**Phase 3 — verify + commit:**
- `pnpm run test`, `pnpm run typecheck`, `pnpm run build` must all pass.
- Visual spot check: `/practice` → U2 `ruffini_resto` and `factorizacion` show real disclosure lists; `/practice` → U2 `polinomios_basico` shows concepts but no disclosure buttons.

### Why not A
- Skips the pedagogical half of the issue. The "Error frecuente" prose embedded in U2 concept blocks remains buried.

### Why not B
- Forces synthetic content for definitional nodes. The honest signal is "no buttons here", not invented summaries.

### Why not skip the validator relaxation
- Keeping the validator strict while hiding empty buttons in the renderer creates a dead state: any future node that arrives with empty `notation`/`commonMistakes` would pass the renderer (no button) but FAIL validation (rejected). That's a latent bug — a node could be loadable but not validatable. The honest contract is "may be empty".

---

## 6. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Validator relaxation breaks downstream tests that rely on the "rejects empty" contract | Low | Audit: `catalog-content.test.ts:34-40` (U1 nodes — all have non-empty), `:330-339` (filters to non-empty), `WorkedExampleCard.test.tsx`, `interval-integration.test.ts:29-48` (explicit non-empty), `TheoryCard.test.tsx` (helper passes non-empty). No test asserts the rejection. |
| Lift content diverges from concept body text (paraphrasing canon) | Medium | The content stays verbatim from the source concept body — we COPY, not paraphrase. Existing `theory-paragraph-model.spec.md` invariant ("preserva cada oración verbatim") applies to lifted material too. |
| Hidden buttons surprise returning alumnos who remember clicking them | Low | Issue framing explicitly endorses hide-when-empty. Empty buttons that reveal empty `<ul>` are worse UX than absent buttons. |
| Voice regression in lifted content | Low | All "Error frecuente" prose in U2 concept blocks already complies with Ingenium voice (no "profe digital", no tutoría). Copy is verbatim. |
| U1/U3 unchanged regression | Low | Touches only U2 JSON file. U1/U3 files untouched. TheoryCard change is a pure conditional render — non-empty path stays identical. |
| Test name churn in `catalog-content.test.ts:330-339` may confuse a future agent reading git history | Low | Leave a one-line comment in the test file pointing to issue #37 and the rationale. |
| Hidden-button discoverability on accessibility tools (screen reader users may not realize the section was hidden because content was empty) | Low | Empty buttons with empty `<ul>` were already silently failing — no disclosure is acceptable; the surrounding concepts still surface the warnings as inline prose. |

---

## 7. Acceptance Anchors (for `sdd-spec` to lift)

- `TheoryCard` MUST NOT render the `Ver notación` button when `node.notation.length === 0`.
- `TheoryCard` MUST NOT render the `Ver errores comunes` button when `node.commonMistakes.length === 0`.
- `TheoryCard` MUST render each button (with its bullets) when its array has at least one entry.
- `validateTheoryNode` MUST accept `notation: []` and `commonMistakes: []` as valid; the `canonicalTrace`, `id`, and `concepts` invariants stay mandatory.
- For U2 nodes that carry natural common-mistakes content in their concept blocks, the node-level `commonMistakes` array MUST reproduce the warning verbatim (no paraphrase, no reordering).
- The voice gate (`copy-strings-acceptance.test.ts`) MUST stay green — no new forbidden strings.

---

## 8. Ready for Proposal

**Yes.** The next phase is `sdd-propose` with:
- **Scope**: `src/domain/models/theory.ts`, `src/components/practice/TheoryCard.tsx`, `content/matematica/theory/unit-2.json`, plus matching test files.
- **Out of scope**: U1, U3, evaluators, metrics, recommendations, `/learn/matematica/[skillId]`-specific changes (covered transitively via shared TheoryCard), exercise bank, voice/copy rules.
- **TDD**: enabled. AGENTS.md mandates TDD for domain/evaluators/metrics/recommendations. This change touches domain (`theory.ts`) → TDD required. Renderer change is a behavior test on a React component — also TDD via the existing `TheoryCard.test.tsx` pattern.
- **Delivery strategy**: single PR. Estimated diff ~250 lines (content dominates). Verify at `sdd-tasks` time.

**Hand-off note to orchestrator**: do NOT modify `openspec/changes/implement-unit-3-mathematics/` — that change has no active branch and is unrelated to #37. The STATUS.json entry for it is dormant until U3 work resumes.
