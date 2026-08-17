# Delta for math-render-safety

## ADDED Requirements

### Requirement: Delimited LaTeX for Bounded U3 Exercise Content

For `ex.u3.exponenciales.2`, `.3`, `.4`, `.5`, `.03`, `.6` through `.17`, and `ex.u3.ecuaciones_lineales.6`, every math-bearing `prompt`, every math-bearing `options[]` value, and every math-bearing `pedagogicalNote` MUST enter RichText inside matching explicit `$...$` or `$$...$$` delimiters. Field coverage is `.2(P)`, `.3(P,O0,O3,N)`, `.4(P)`, `.5(P,O3,N)`, `.03(P,O0,O3,N)`, `.6(P)`, `.7(P,N)`, `.8(P,O2,O3,N)`, and `.9`–`.17(P,N)`, plus lineales.6 `P/O` (and any present `N`). Valid KaTeX-oriented forms MUST cover exponents, roots, fractions, multiplication, logarithms, and multi-step feedback, including forms such as `$2^x$`, `$\sqrt{32}$`, `$\frac{5}{2}$`, `$5\cdot2^x$`, `$\log_2(12)$`, and `$\frac{\ln 20}{\ln 3}$`. Prose and unaffected fields MUST remain unchanged; pedagogical reasoning MUST remain clear to students and interpretable by teachers.

#### Scenario: Covered math becomes RichText math

- GIVEN any covered record and a math-bearing prompt, option, or pedagogical note
- WHEN `parseRichTextSegments` processes the field
- THEN each intended expression is a math segment from `$...$` or `$$...$$`
- AND standalone equations MAY use `$$...$$` while surrounding prose remains text

#### Scenario: Content metadata and meaning are preserved

- GIVEN the baseline records in source order
- WHEN delimiters and valid LaTeX notation are added
- THEN IDs, order, answer keys, mathematical meaning, difficulty, tags, and unaffected fields remain identical
- AND multi-step pedagogical notes retain their original instructional intent

### Requirement: Plain-Text Segment Render Safety for Covered Fields

After `parseRichTextSegments`, a plain-text segment in any covered prompt, option, or pedagogical note MUST NOT contain a bare caret exponent (`^`), Unicode root (`√`), or plain numeric fraction matching `\d+/\d+`. The change MUST NOT add implicit math detection or alter parser or renderer behavior.

#### Scenario: Bare mathematical notation is rejected

- GIVEN the covered exercise fields are scanned after `parseRichTextSegments`
- WHEN a text segment contains `^`, `√`, or a plain numeric fraction such as `5/2`
- THEN render-safety validation fails and identifies the exercise and field
- AND the same notation inside a valid `$...$` or `$$...$$` segment is not reported as plain text

#### Scenario: Clean covered content passes

- GIVEN all math-bearing values for the 17 exponential records and lineales.6 use explicit delimiters
- WHEN the render-safety regression coverage runs over prompts, options, and pedagogical notes
- THEN no covered plain-text segment contains the prohibited patterns
- AND the coverage asserts the complete 17-ID namespace plus `ex.u3.ecuaciones_lineales.6`

### Requirement: Bounded Acceptance and Follow-Up Scope

Acceptance MUST include `pnpm run test`, `pnpm run typecheck`, and `pnpm run build`. This change MUST remain limited to the covered content and its render-safety specification/regression coverage; `mat.u3.logaritmicas` and `mat.u3.ecuaciones_cuadraticas` cleanup MUST remain follow-up work. It MUST NOT modify or archive `expand-u3-exponentials`, or introduce pushes, pull requests, merges, or worktree removal.

#### Scenario: Repository gates and boundaries hold

- GIVEN the bounded change candidate
- WHEN the three required pnpm gates run
- THEN all three commands pass
- AND no implicit detection, parser/renderer change, logarithmic/quadratic cleanup, or `expand-u3-exponentials` artifact action is present
