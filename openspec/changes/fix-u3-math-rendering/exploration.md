# Exploration: fix-u3-math-rendering

## Purpose

Audit how the `mat.u3.exponenciales` skill content flows from its source
JSON to the rendered student UI, identify the rendering defects the user
hypothesized (ExerciseCard → RichText only renders KaTeX inside `$...$`
delimiters; source content carries plain-text exponents, roots, and
fractions), and bound the scope of a fix that preserves mathematical
meaning, answers, difficulty, tags, and order.

This exploration only investigates. It does not write code, modify
catalog JSON, modify specs, or open PRs. It does not touch
`expand-u3-exponentials` (whose closeout is administratively blocked by
Gentle AI #2128).

## Current State

### Content-to-render pipeline (verified, line-numbered)

The component chain that takes a raw `prompt` string from
`content/matematica/exercises/unit-3.json` to the rendered student UI is:

```
ExerciseCard (src/components/practice/ExerciseCard.tsx:14-29)
  ├── exercise.type label (getExerciseTypeLabel)
  ├── difficulty chip
  └── <RichText text={exercise.prompt} />                ← line 26
        └── parseRichTextSegments(text)                  ← src/components/math/rich-text-parser.ts:29
              ├── splits ONLY on "$" / "$$" delimiters    (lines 34-65)
              └── any text outside "$...$" becomes a plain
                  text segment (kind: "text")
        └── chunks rendered as <strong>**...**</strong> or
            <InlineMath tex=...> / <BlockMath tex=...>      ← RichText.tsx:46-59
              └── KaTeXBlock (src/components/math/KaTeXBlock.tsx:32-55)
                    └── katex.renderToString(
                          expression, { throwOnError: false,
                          displayMode, trust: false })     ← line 19
```

Key facts from the source:

- `parseRichTextSegments` only emits `kind: "math"` for content between
  a matching pair of `$` (inline) or `$$` (display) delimiters. Any
  character that sits inside a plain text segment is rendered as a
  literal Unicode glyph with no mathematical typesetting.
- `KaTeXBlock` calls `katex.renderToString` with `throwOnError: false`,
  so any malformed `tex` (including empty content) renders an inline
  error span instead of throwing — there is no safety net for
  un-delimited math in the parser itself.
- `ExerciseCard`, `ExerciseAnswerInput`, `ChallengeExerciseCard`,
  `FeedbackDisplay`, and `SubmittedAnswerDisplay` ALL render through
  `RichText` (verified via the call graph returned by CodeGraph).
  Any text field that goes through these components is gated by the
  same `$...$` parser.

This confirms the user's hypothesis. There is no implicit-symbol
detection in `RichText`: if a string lives in a plain text segment
outside `$...$`, Unicode characters like `^`, `√`, `²`, `·`, `≥`, `≤`,
`≈`, `α`, `→`, `±`, `∈`, `⊂`, or a plain `2/5` all render as plain
text. The renderer is one delimiter away from correctness.

### `mat.u3.exponenciales` content (verified, lines 493-727 of unit-3.json)

The same file already contains a working pattern: theory
(`content/matematica/theory/unit-3.json:501-510`) and worked examples
(`content/matematica/examples/unit-3.json:431-456`) for
`mat.u3.exponenciales` use `$2^x = 8$`, `$8 = 2^3$`, `$4^x = 32$`,
`$(2^2)^x = 2^{2x}$`, `$x = 5/2$`, and the rendered output is correct
(KaTeX inhérent typesetting). The defect is **specific to the exercise
JSON** (and a small, mirrored pattern in `mat.u3.logaritmicas`),
**not** to the theory or examples layer.

### Defect inventory for `mat.u3.exponenciales` (17 of 17 affected)

All 17 `ex.u3.exponenciales.*` exercises in
`content/matematica/exercises/unit-3.json` (lines 493-727) contain at
least one plain-text math expression. The table below records every
field that needs a fix, with the exact offending token (verbatim). The
audit was performed by reading the current line-numbered file and
applying the same `parseRichTextSegments` logic the renderer uses.

| Exercise ID | Field | Plain-text math token (must move into `$...$`) |
|-------------|-------|-------------------------------------------------|
| `ex.u3.exponenciales.2` | `prompt` | `2^x` |
| `ex.u3.exponenciales.3` | `prompt` | `3^(2x)` |
| `ex.u3.exponenciales.3` | `options[0]` | `x = 3/2` (bare fraction) |
| `ex.u3.exponenciales.3` | `options[3]` | `x = 9/2` (bare fraction) |
| `ex.u3.exponenciales.3` | `pedagogicalNote` | `2x = 3` (implied exponent context) |
| `ex.u3.exponenciales.4` | `prompt` | `5^x` |
| `ex.u3.exponenciales.5` | `prompt` | `2^x`, `1/8` (bare fraction) |
| `ex.u3.exponenciales.5` | `options[3]` | `x = 1/8` |
| `ex.u3.exponenciales.5` | `pedagogicalNote` | `1/8 = 2^(-3)` |
| `ex.u3.exponenciales.03` | `prompt` | `2^x`, `√32` (bare root, U+221A) |
| `ex.u3.exponenciales.03` | `options[0]` | `x = 5/2` (bare fraction) |
| `ex.u3.exponenciales.03` | `options[3]` | `x = 5/4` (bare fraction) |
| `ex.u3.exponenciales.03` | `pedagogicalNote` | `√32`, `2^(5/2)`, `2^5`, `2^x = 2^(5/2)` |
| `ex.u3.exponenciales.6` | `prompt` | `3^x` |
| `ex.u3.exponenciales.7` | `prompt` | `2^(x+1)` |
| `ex.u3.exponenciales.7` | `pedagogicalNote` | `2^(x+1)`, `2^x`, `2^4` |
| `ex.u3.exponenciales.8` | `prompt` | `2^(-x)`, `1/32` (bare fraction) |
| `ex.u3.exponenciales.8` | `options[2]` | `x = 1/5` (bare fraction) |
| `ex.u3.exponenciales.8` | `options[3]` | `x = -1/32` (bare fraction) |
| `ex.u3.exponenciales.8` | `pedagogicalNote` | `1/32 = 2^(-5)`, `2^(-x) = 2^(-5)` |
| `ex.u3.exponenciales.9` | `prompt` | `2^(2x)`, `5·2^x` (multiplication dot, exponent) |
| `ex.u3.exponenciales.9` | `pedagogicalNote` | `t² - 5t + 4`, `2^x > 0` (multiple bare exponents) |
| `ex.u3.exponenciales.10` | `prompt` | `4^x`, `2^x` |
| `ex.u3.exponenciales.10` | `pedagogicalNote` | `4^x`, `2^(2x)`, `2^x`, `t² - t - 2`, `2^x = 2` |
| `ex.u3.exponenciales.11` | `prompt` | `2^x`, `2^(x+1)` |
| `ex.u3.exponenciales.11` | `pedagogicalNote` | `2^x + 2^(x+1)`, `2^x(1 + 2)`, `2^x · 3`, `2^x = 4`, `log₂(12)` |
| `ex.u3.exponenciales.12` | `prompt` | `2^(x^2 - 1)` |
| `ex.u3.exponenciales.12` | `pedagogicalNote` | `2^(x^2 - 1)`, `a^0 = 1` |
| `ex.u3.exponenciales.13` | `prompt` | `2^x`, `2^(1-x)`, `5/2` (bare fraction) |
| `ex.u3.exponenciales.13` | `pedagogicalNote` | `2^x + 2^(1-x)`, `t + 1/t`, `2^x = 1/2` |
| `ex.u3.exponenciales.14` | `prompt` | `3^(2x)`, `4·3^x` |
| `ex.u3.exponenciales.14` | `pedagogicalNote` | `3^x`, `t² - 4t + 3`, `3^x = 3` |
| `ex.u3.exponenciales.15` | `prompt` | `3^x` |
| `ex.u3.exponenciales.15` | `pedagogicalNote` | `3^x`, `ln(3^x)`, `ln 20`, `ln 3`, `ln 20 / ln 3`, `2.7265` |
| `ex.u3.exponenciales.16` | `prompt` | `2^(x/2)` |
| `ex.u3.exponenciales.16` | `pedagogicalNote` | `2^(x/2)`, `2^3`, `x/2 = 3` |
| `ex.u3.exponenciales.17` | `prompt` | `2^x`, `2^(x+2)` |
| `ex.u3.exponentials.17` | `pedagogicalNote` | `2^(x+2)`, `2^x · 2^2`, `4·2^x`, `2^x = 4`, `2^(x+2)` |

Total finding: 17 / 17 exercises affected; 40+ distinct field-level
fixes required across `prompt`, `options[]`, and `pedagogicalNote`
fields. Bare `√` (U+221A) appears in `ex.u3.exponenciales.03` (the
user's named example `2^x = √32`); bare fractions `\d+/\d+` appear in
12 of the 17 exercises; bare exponents `^` appear in all 17.

### "Two solutions" pattern — already correctly handled

The simplify path for "two solutions" (`x = 0 o x = 2`,
`x = -1 o x = 1`) is to keep the two answers inside a single option
string, exactly as the existing entries already do. This is consistent
with AGENTS.md's no-free-text rule (lines 166-178) and avoids the
complex-numbers, dual-root, interval, and complex-form inputs that the
pedagogical guidelines explicitly forbid typing into a free-text field.
No change is needed to the option shape; rendering through `$...$` is
sufficient.

### Defect inventory for nearby U3 skills (audit, recommendation = bound)

The user asked to audit nearby content sharing the same defect but
recommend a sharply bounded scope. The audit identifies the
following in `content/matematica/exercises/unit-3.json` (same file,
not additional files):

| Skill | Affected scope | Severity |
|-------|----------------|----------|
| `mat.u3.logaritmicas` | `ex.u3.logaritmicas.2-5` (lines 729-785) — `log₂(8)`, `log(100)`, `log₃(x)`, `log₂(32)` all without `$...$` | Same defect as exponenciales; 4 exercises |
| `mat.u3.ecuaciones_cuadraticas` | `ex.u3.ecuaciones_cuadraticas.2-3` (lines 179-200+) — `x² = 9`, `(x - 2)² = 16` in plain text | 2 exercises, plus 1 canonical `x = ±√9` reference in `pedagogicalNote` |
| `mat.u3.ecuaciones_lineales.6` | Single entry (line 154-177) — `(3 + √5)·x = 14 + 6√5` in plain text | 1 exercise, fully polluted with bare `√` and option `(14 + 6√5) / (3 − √5)` |

The `mat.u3.exponenciales` defect is the canonical case the user named
and the worst concentration (17 of 17). The other three skills host
the same root cause but a much smaller surface area. **The
recommendation is to bound the fix to `mat.u3.exponenciales` plus the
single `ex.u3.ecuaciones_lineales.6` entry** (the only U3 entry that
contains a bare `√` in a `prompt` field today, which is the most
visually broken copy on the practice screen for any U3 pilot skill).
`mat.u3.logaritmicas` and `mat.u3.ecuaciones_cuadraticas` should be
left to a tightly scoped follow-up change, each with its own SDD
artifact, so the line-count budget stays under the 400-line review
ceiling and the verification surface stays proportional to the size
of the fix.

### Existing render-safety scaffolding (reusable, not editing)

The repo already has a render-safety regression test pattern, codified
in `openspec/specs/math-render-safety/spec.md`, and live tests in
`src/components/math/__tests__/conjuntos-render-safety.test.ts` and
`src/components/math/__tests__/decimal-comma-convention.test.ts`.
These scans iterate the prompt / options / pedagogicalNote fields of
every exercise for a given skill, run `parseRichTextSegments`, and
fail on any plain-text segment that contains `√`, `∈`, `⊂`, `\d+/\d+`,
or `\d+\.\d+`. They enforce the spec's rules and serve as the
verification gate for the fix. The new change should ADD a new
exponenciales-scoped test file (modeled on the conjuntos one) and may
NEED to extend the spec with a new requirement: bare `^` (exponent)
outside `$...$` is a render-safety violation. The existing spec does
not currently enumerate `^` because unit-1 did not need it.

### Existing parser invariants (no change needed)

`parseRichTextSegments` is correct: an unclosed `$` is treated as
plain text, empty delimiters are treated as plain text, and
`\*\*` toggles bold inside or outside math. None of those edge cases
are triggered by the exponenciales content. The fix is purely on the
content side; the parser and rendering pipeline are not modified.

## Affected Areas

- `content/matematica/exercises/unit-3.json` — 17 lines × 3 fields
  each, plus the field-level table above. Largest single source file
  affected.
- `content/matematica/exercises/unit-3.json` — `ex.u3.ecuaciones_lineales.6`
  (lines 154-177) for the co-bounded fix in the same file.
- `openspec/specs/math-render-safety/spec.md` — add a new requirement
  for bare `^` (exponent) outside `$...$` is rejected, with at least
  one scenario that exercises an `ex.u3.exponenciales.*` entry.
- `src/components/math/__tests__/exponenciales-render-safety.test.ts`
  — new test file modeled on
  `src/components/math/__tests__/conjuntos-render-safety.test.ts`.
  Scans every `ex.u3.exponenciales.*` entry across both `exercises.json`
  (root) and `exercises/unit-3.json` (per-skill if present), iterates
  prompt + options[] + pedagogicalNote, runs `parseRichTextSegments`,
  and fails on plain-text exponents, bare `√`, and bare fractions.
- `openspec/changes/STATUS.json` — register `fix-u3-math-rendering`
  as `in-progress` on `sdd/fix-u3-math-rendering` (the branch the
  exploration already lives on, per `git branch --show-current`).
- `openspec/changes/fix-u3-math-rendering/exploration.md` — this
  artifact (the only file created by the exploration phase).

No domain code, no UI, no KaTeX/sandbox settings, no parser changes,
no theory/examples/feedback files, no other skills, no
`ex.u3.exponenciales.*` row count, no answer key, no tags, no
difficulty, no `prompts/reorder` change, no `RankingService` change,
no migration. The fix is **content-only** in `unit-3.json` plus a
new regression test file plus a small spec extension.

## Approaches

### 1. **Wrap every plain-text math token in `$...$` inside the JSON** (recommended)

- Pros: Author-driven; preserves exact byte content only where required
  (you add `$` and `$` around the existing token). Zero risk of
  rendering reordering. KaTeX handles every token already used
  (`2^x`, `√32`, `1/8`, `5·2^x`, `log₂(8)`, `(14 + 6√5)`, etc.). The
  change is mechanical, locally verifiable, and the regression test
  asserts the absence of any plain-text token. Aligns with the
  existing `theory-exponenciales` and `example-exponenciales-1/2`
  reference patterns already in the repo.
- Cons: The number of edits is large (40+ lines). Visual diff is
  noise-heavy. Requires a careful proof-read pass for each field
  because the wrap must keep the surrounding language intact (e.g.
  `Resuelve 2^x = 8` → `Resuelve $2^x = 8$`, not `Resuelve$2^x = 8$`).
- Effort: Low. One author pass with paired lines + a regression test
  guard.

### 2. **Move the exponenciales JSON to a per-skill file with structured fields**

- Pros: Lets the model carry structured `promptExpression`,
  `optionExpression`, etc. fields separate from prose. Future-proof
  for richer fields.
- Cons: Requires a new schema, a parser change, a content-loader
  change, and broad test coverage. Touches every skill currently
  using the single-string `prompt` shape. Massively out of proportion
  to the bug.
- Effort: High. Multiple modules, multiple tests, schema migration.

### 3. **Add implicit-symbol detection in `RichText`**

- Pros: Removes the burden from content authors; any future content
  "just works".
- Cons: Implicitly detected math is fragile (false positives: `e^x`
  in `excel`, `2^3` in a date, `1/2` in a URL). Adds a maintenance
  burden on the parser. The user explicitly forbade this without
  evidence — and the evidence here is the opposite: the existing
  `$...$` convention works perfectly for the theory and examples
  layers, including the SAME `2^x = 8` problem statement.
- Effort: High. Parser change + new tests + acceptance risk that
  implicit detection will misclassify future content.

### 4. **Render-tolerance: `RichText` detects bare `^` and rewrites inline**

- Pros: Avoids content edits.
- Cons: Same as 3: encodes display assumptions into the parser.
  Contradicts the repo's stated convention. Will leak into future
  skills and create new failure modes.
- Effort: Medium. Parser change + renderer integration + new tests.

## Recommendation

**Approach 1**, sharply bounded to `mat.u3.exponenciales` plus the
single `ex.u3.ecuaciones_lineales.6` entry (which is the only other U3
pilot-skill entry whose `prompt` contains a bare `√` in the practice
UI, the same category of defect the user named). Defer
`mat.u3.logaritmicas` and `mat.u3.ecuaciones_cuadraticas` to dedicated
follow-up changes to keep the line-count budget under the 400-line
review ceiling and to keep the verification surface proportional to
the size of the fix.

Implementation guidance for the proposal phase:

1. **Content edits.** For each entry in the Affected Areas inventory,
   wrap the exact offending token in `$...$` without changing the
   surrounding Spanish text. Sample edits:
   - `ex.u3.exponenciales.2` `prompt`: `"Resuelve 2^x = 8"` →
     `"Resuelve $2^x = 8$"`
   - `ex.u3.exponenciales.03` `prompt`: `"Resuelve 2^x = √32"` →
     `"Resuelve $2^x = \sqrt{32}$"`
   - `ex.u3.exponenciales.3` `options[0]`: `"x = 3/2"` →
     `"$x = \tfrac{3}{2}$"` (or `"x = 3/2"` if KaTeX rendering of a
     plain-text fraction is acceptable; the password is the
     KaTeX-rendered fraction, not `\tfrac`). For fractions inside
     option strings, prefer `"$x = \frac{3}{2}$"` so the option read
     matches the same renderer the theory uses.
   - `ex.u3.exponenciales.ecuaciones_lineales.6` `prompt`:
     `"Resuelve para x: (3 + √5)·x = 14 + 6√5"` →
     `"Resuelve para x: $(3 + \sqrt{5})\cdot x = 14 + 6\sqrt{5}$"`.
     The leading `Resuelve para x:` prose stays in plain text.

2. **Spec delta.** Add to `openspec/specs/math-render-safety/spec.md`
   (or as a new `openspec/changes/fix-u3-math-rendering/specs/math-render-safety/spec.md`
   delta): one new requirement that bare `^` (caret) outside `$...$`
   is a render-safety violation, with at least one scenario from
   `mat.u3.exponenciales`.

3. **Regression test.** Add
   `src/components/math/__tests__/exponenciales-render-safety.test.ts`
   that mirrors `conjuntos-render-safety.test.ts` for the
   `mat.u3.exponenciales` skill. Asserts no plain-text segment in
   prompt / options[] / pedagogicalNote contains `^`, `√`, or
   `\d+/\d+`. Add similar coverage for `mat.u3.ecuaciones_lineales`
   in the same file (or a sibling test) so the `ex.u3.ecuaciones_lineales.6`
   fix is locked down.

4. **Verification.** Run `pnpm run test`, `pnpm run typecheck`,
   `pnpm run build`. All three are available (the project has a
   scaffolded package.json with the scripts). Manual visual check on
   `/practice?skill=mat.u3.exponenciales` confirms KaTeX rendering
   of `2^x`, `√32`, `1/8`, `5/2`, `log₂(8)`, etc.

5. **No domain code, no renderer code, no schema, no parser, no
   theory/examples/feedback files, no migration.** The fix is small
   and obvious.

## Risks

- **Proof-read risk on mechanical edits.** 40+ field-level edits are
  noise-heavy and a token-level mistake (e.g. wrapping only one of
  several math tokens in a single field) will leave one stray plain
  text expression. **Mitigation:** the regression test enforces the
  rule automatically; the diff is reviewed per exercise in the PR.
- **KaTeX rendering quirks.** KaTeX with `throwOnError: false` will
  render an inline error span for malformed LaTeX. The content
  patterns in use today (`2^x`, `√32`, `1/8`, `5·2^x`, `log₂(8)`,
  `ln(3^x)`, `(14 + 6√5)`) are all standard KaTeX-readable syntax.
  **Mitigation:** the new regression test asserts the absence of
  bare-symbol plain-text, and a smoke run on the affected skill
  before merge would catch rendering errors.
- **Drift between spec and source.** The existing
  `math-render-safety/spec.md` does not enumerate `^` because unit-1
  did not need it. The proposal must extend the spec explicitly so
  the regression test has a stable home.
- **Scope creep into `logaritmicas` / `cuadraticas`.** These are
  real defects but the recommendation is to defer them. **Mitigation:**
  the inventory includes them as separate items, so the follow-up
  changes can pick them up without re-doing the survey.
- **`expand-u3-exponentials` interaction.** The
  `sdd/expand-u3-exponentials` branch is `in-progress` per
  `STATUS.json` and is administratively blocked at closeout by
  Gentle AI #2128. The new change MUST NOT touch that branch's
  artifacts. The new branch is `sdd/fix-u3-math-rendering` (per
  `git branch --show-current`); the new change's source range will
  overlap with the same file but only on the exponenciales JSON
  rows, so merging both into main requires a careful merge order.
  **Mitigation:** record the overlap in the apply phase so the
  releaser knows to merge `expand-u3-exponentials` first, then
  `fix-u3-math-rendering` on top.
- **Render-safety false negatives.** The new regression test only
  checks for `^`, `√`, and `\d+/\d+`. There are other mathematical
  patterns (`·`, `²`, `³`, `≈`, `α`, `→`, `±`) that may also need
  wrapping. **Mitigation:** make the test pattern explicit
  (transparent to the maintainer) and the proposal should describe
  the regex set; future skills can extend the pattern.
- **No `unit-3.exponenciales` secret IDs / canonical-expressions
  constraint.** The AGENTS.md "no free-text rule" and the
  `expand-u3-exponentials` exploration's "no literal copy of P39a–q"
  discipline both still apply. Wrapping tokens in `$...$` does not
  change the underlying expression, so the canonical-source
  stipulation is preserved.

## Ready for Proposal

**Yes**, with the bounding above. The exploration phase has produced a
field-level defect inventory for all 17 `mat.u3.exponenciales` entries
plus the single `ex.u3.ecuaciones_lineales.6` entry, a verified
content-to-render pipeline (line-numbered), a concrete recommended
approach (Approach 1: content-only wrap), a reusable regression test
pattern, and a list of small risks to call out in the proposal. No
follow-up clarification is required from the user before proposal
work begins.

Suggested ordering after this exploration:

1. Write `fix-u3-math-rendering/proposal.md` stating the
   content-only, sharply bounded approach.
2. Write `fix-u3-math-rendering/specs/math-render-safety/spec.md`
   delta adding the bare-`^` requirement.
3. Write `fix-u3-math-rendering/tasks.md` partitioning the 17
   exponenciales edits + the 1 lineales.6 edit + the new test file
   + the spec extension into reviewable work units.
4. Hand off to implementation via `sdd-apply`.
