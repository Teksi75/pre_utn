# Proposal: Fix U3 Mathematical Rendering

## Intent

Repair the Unit 3 exercise math display. Flow: `unit-3.json` → `ExerciseCard` → `RichText` → `parseRichTextSegments` → `InlineMath`/`BlockMath` → KaTeX. The parser recognizes only matching `$...$` and `$$...$$`; undelimited `^`, `√`, and fractions remain text. The confirmed root cause is missing markup in exercise JSON, not parser or renderer behavior (ADR-003, ADR-006, ADR-008).

## Scope

### In Scope
- Wrap every math-bearing statement, option, and pedagogical note in the 17 `ex.u3.exponenciales.*` records, plus `ex.u3.ecuaciones_lineales.6`, preserving meaning, answer keys, difficulty, tags, IDs, and order.
- Add parser-backed render-safety regression coverage and the bare-caret requirement.
- Verify only with `pnpm run test`, `pnpm run typecheck`, and `pnpm run build`.

### Out of Scope
- Implicit detection, parser/renderer, domain, theory/example, schema, or migration changes.
- `mat.u3.logaritmicas` and `mat.u3.ecuaciones_cuadraticas`; defer both to separate SDD changes.
- Any modification or archival action for `expand-u3-exponentials`; Gentle AI #2128 affects only its closeout. No commit, push, PR, merge, deletion, or worktree removal.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `math-render-safety`: affected exercise math MUST enter RichText as delimited valid LaTeX; bare caret, root, or fraction in a plain-text segment fails validation.

## Approach

Use markup only: `$...$` for inline expressions and `$$...$$` for standalone equations. Use valid forms such as `$2^x=8$`, `$2^x=\sqrt{32}$`, `$x=\frac{5}{2}$`, `$5\cdot2^x$`, `$t^2-5t+4$`, `$\log_2(12)$`, and `$\frac{\ln 20}{\ln 3}$`. The lineales case uses `$(3+\sqrt{5})\cdot x=14+6\sqrt{5}$` and option `$\frac{14+6\sqrt{5}}{3-\sqrt{5}}$`.

**Coverage contract** (P=prompt, O=options, N=pedagogicalNote; all IDs retain the `ex.u3.exponenciales.*` namespace and source order): `.2(P)`, `.3(P,O0,O3,N)`, `.4(P)`, `.5(P,O3,N)`, `.03(P,O0,O3,N)`, `.6(P)`, `.7(P,N)`, `.8(P,O2,O3,N)`, `.9(P,N)`, `.10(P,N)`, `.11(P,N)`, `.12(P,N)`, `.13(P,N)`, `.14(P,N)`, `.15(P,N)`, `.16(P,N)`, `.17(P,N)`. Fields without offending math remain unchanged.

Regression coverage adds `exponenciales-render-safety.test.ts`, modeled on the existing pattern, scanning both catalogs and P/O/N through `parseRichTextSegments` for bare caret, root, and `\d+/\d+` fraction text; it also locks down `ex.u3.ecuaciones_lineales.6` and the 17-ID namespace.

## Affected Areas

`content/matematica/exercises/unit-3.json`; the future render-safety spec delta and regression test; `openspec/changes/STATUS.json`.

## Risks

Mechanical omissions or invalid LaTeX: mitigate with the field-level scan and per-exercise review. Branch overlap with `expand-u3-exponentials` is a delivery risk: merge that change first, then this branch; this proposal grants no permission to merge or modify it. Deferred nearby defects remain explicit follow-ups.

## Rollback Plan

Revert only this change’s content, regression, spec, and registry edits; leave the parser and `expand-u3-exponentials` artifacts untouched.

## Dependencies

Existing RichText/KaTeX delimiter convention; no new dependency. Follow ADR-003, ADR-006, and ADR-008.

## Success Criteria

- [ ] All 17 exponential records and lineales.6 render math through KaTeX with unchanged semantics and metadata.
- [ ] Regression coverage finds no bare caret, root, or fraction in plain segments; diff remains under 400 lines.
- [ ] All three required `pnpm` gates pass.
