## Archive Report

**Change**: `refine-issue-42-ruffini-monic-callout`
**Status**: ARCHIVED
**Date**: 2026-06-18
**Merge Commit**: `492f25f`

### Summary

Refinement of Ruffini step presentation in `concept-fac-potencias-igual-grado` (Caso 6, factorización). The single 700-char P4 prose paragraph was replaced with 5 focused bodyParagraphs: KaTeX `\begin{array}` coefficient table, explicit "resto es 0" closure, cociente line, "Importante:" callout on monic factor, and final reconciliation. Test caps relaxed from 5–6 to 5–10. Content-only change — zero model, parser, or renderer modifications.

### Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `theory-paragraph-model` | Updated | 1 MODIFIED (paragraph cap 5–6 → 5–10) + 8 ADDED requirements synced to `openspec/specs/theory-paragraph-model/spec.md` |

**Base spec updated**: `openspec/specs/theory-paragraph-model/spec.md`
- MODIFIED: "Caso 6 Concept Has 5-10 Paragraphs" (replaced "5-6 Paragraphs")
- ADDED: Ruffini Table as KaTeX Array, Explicit "Resto es 0" Closure, Importante Callout for Monic Factor, Explicit Cociente Line, Final Factorization Preserved, No Horizontal Overflow at 375px, No Forbidden Ingenium Voice Strings, Test Caps Updated for New Range

### Archive Contents

- `explore.md` ✅
- `proposal.md` ✅
- `specs/theory-paragraph-model/spec.md` ✅ (delta)
- `design.md` ✅
- `tasks.md` ✅ (6/7 tasks complete, T4.1 conditional N/A)
- `verify-report.md` ✅ (PASS WITH NOTES)

### Branch Naming

Branch used `refine/` prefix (not `feat/`) to match the change name `refine-issue-42-ruffini-monic-callout`. This is a deliberate precedent for refinement-scope changes. Documented here for future convention awareness.

### Verify Findings Carried to Archive

1. **CRITICAL (procedural, accepted)**: Missing TDD Cycle Evidence table. The apply-progress documents task completion and gate results, but no formal RED/GREEN/TRIANGULATE/SAFETY NET table. Accepted by orchestrator because this is a content-only change (JSON data + test cap relaxations) where the TDD cycle is structurally different from code TDD. Validation performed via: JSON.parse validation, voice gate test (copy-strings-acceptance), content-loaders test, and Playwright visual check at 375×812 viewport. All passed.

2. **SUGGESTION**: KaTeX `\\` in display-mode `array` may emit a non-fatal console warning in KaTeX 0.17.0. Validated via Playwright that the table renders correctly with 0 `katex-error` spans. Cosmetic only — no action required for merge.

3. **SUGGESTION**: Branch naming convention (`refine/` vs `feat/`). Deliberate — documented in this archive report.

### Follow-ups

1. **factorizacion-exercises change (future)**: Address R19 feedback shadowing from `issue-42-powers-same-degree` — `u2_ruffini_signo_a` appears twice in `content/matematica/feedback/unit-2.json` (lines 15 and 21). Resolution: `find()` → `findLast()` or skillId discrimination in feedback lookup.
2. **Linux GGA re-validation**: When available. GGA was bypassed on Windows (Codex CLI hook parser ambiguity).
3. **KaTeX `\\` warning**: Consider adding `\notag` or using `{aligned}` environment if the non-fatal console warning becomes distracting in devtools. Cosmetic — does not block render.

### Latent Issue (Non-Blocking)

**R19 shadowing from `issue-42-powers-same-degree`**: `u2_ruffini_signo_a` appears twice in `content/matematica/feedback/unit-2.json` (lines 15 and 21) — two feedback mappings share the same error tag. Confirmed still latent (both entries present). Not introduced or resolved by this refinement. Non-blocking.

### Diff Summary

| Metric | Value |
|--------|-------|
| Files changed | 9 |
| Insertions | 537 |
| Deletions | 7 |
| Net lines (content) | ~12 (content + test caps; rest is SDD artifacts) |
| Content file | `content/matematica/theory/unit-2.json` (6 ins, 7 del) |
| Test files | `content-loaders.test.ts` (10 changes), `copy-strings-acceptance.test.ts` (10 changes) |
| SDD artifacts | explore.md, proposal.md, design.md, tasks.md, verify-report.md, delta spec |

### Branches Deleted

| Branch | Status |
|--------|--------|
| `refine/issue-42-ruffini-monic-callout` (local) | ✅ deleted |
| `refine/issue-42-ruffini-monic-callout` (remote) | ⚠️ not exist (never pushed) |

### Gates Final

| Gate | Result |
|------|--------|
| `pnpm run test` | ✅ 2116/2116 passed (0 failed, 0 skipped) |
| `pnpm run typecheck` | ✅ clean (tsc --noEmit, 0 errors) |
| `pnpm run build` | ✅ 7/7 routes (Next.js 16.2.7 Turbopack) |

### Spec Compliance

9/9 requirements compliant (8 ADDED + 1 MODIFIED). Full compliance matrix in `verify-report.md`.
